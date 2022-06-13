import * as functions from "firebase-functions";

import * as Base64 from "crypto-js/enc-base64";
import * as sha256 from "crypto-js/sha256";
import { PublicKey } from "@solana/web3.js";
import * as cors from "cors";

import { MailProvider } from "./mailProvider";
import * as db from "../api/db";
import {
  EventType,
  parseEvents,
  SharedLedgerWrapper,
} from "../api/shared_ledger";

const sharedLedgerWrapper = new SharedLedgerWrapper();
sharedLedgerWrapper.initialize();

const errorFormat = (message: string) => ({
  error: {
    message,
  },
});

const corsHandler = cors({ origin: true });

export const walletExists = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    const { walletPubkey } = request.body;

    if (!walletPubkey) {
      response.status(400).send(errorFormat("Missing valid parameter"));
      return;
    }

    db.getCrendentials(walletPubkey)
      .then((credential) => response.sendStatus(credential.exists ? 200 : 204))
      .catch(() => response.sendStatus(500));
  });
});

export const verifyTransaction = functions.https.onRequest(
  (request, response) => {
    corsHandler(request, response, async () => {
      const { pubkey, data, uuid } = request.body;
      const hashedEmail = Base64.stringify(sha256(uuid + data));

      if (!pubkey || !data || !uuid) {
        response.status(400).send(errorFormat("Missing valid parameter"));
        return;
      }

      const notifCrendentials = await sharedLedgerWrapper.getCredentials(
        hashedEmail,
        new PublicKey(pubkey)
      );

      if (notifCrendentials.length > 0) {
        switch (Object.keys(notifCrendentials[0].account.content)[0]) {
          case "email":
            await db.setCrendentials(notifCrendentials[0].account.owner, {
              email: data,
            });
            response.sendStatus(201);
            break;
          default:
            response.status(500).send(errorFormat("Credential type not found"));
            return;
        }
      } else {
        response
          .status(500)
          .send(errorFormat("No signed crendential found on chain"));
        return;
      }
    });
  }
);

export const sendNotification = functions.https.onRequest(
  (request, response) => {
    corsHandler(request, response, async () => {
      const { transactionUuid } = request.body;

      if (!transactionUuid) {
        response.status(400).send(errorFormat("Missing valid parameter"));
        return;
      }

      const transfers = await sharedLedgerWrapper.getTransferRequestfromUuid(
        new PublicKey(transactionUuid)
      );

      if (transfers.length === 0) {
        response
          .status(400)
          .send(
            errorFormat("No Transfer Request associated with this identifier")
          );
        return;
      }

      const notificationSnapshot = await db.getNotificationStatus(
        transactionUuid
      );
      const notificationData = notificationSnapshot.data();
      if (
        notificationData?.processStatus == db.NotifcationStatus.NOTIFIED ||
        notificationData?.processStatus == db.NotifcationStatus.PROCESSING
      ) {
        response.status(400).send(errorFormat("User already notified"));
        return;
      }

      await db.setNotificationStatus(
        transactionUuid,
        db.NotifcationStatus.PROCESSING
      );

      const { from, events } = transfers[0].account;

      const parsedEvents = parseEvents(events);
      const finalEvent = parsedEvents[1];

      if (finalEvent.eventType !== EventType.UNDEFINED) {
        response
          .status(400)
          .send(errorFormat("Notifiy only created transfer request"));
        return;
      }

      const snapshot = await db.getCrendentials(from);
      const data = snapshot.data();
      if (!data) {
        response.status(400).send(errorFormat("User can't be notified"));
        return;
      } else {
        const { email } = data;

        const mailProvider = new MailProvider();

        mailProvider
          .sendWelcomeEmail(email as string, "Markitanki")
          .then(async () => {
            await db.setNotificationStatus(
              transactionUuid,
              db.NotifcationStatus.NOTIFIED
            );
            response.sendStatus(200);
          })
          .catch(async (err) => {
            functions.logger.error(err);
            response.sendStatus(500);
            await db.setNotificationStatus(
              transactionUuid,
              db.NotifcationStatus.ERROR
            );
          });
      }
    });
  }
);
