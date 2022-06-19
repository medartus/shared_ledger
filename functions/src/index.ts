import functions from 'firebase-functions';

import Base64 from 'crypto-js/enc-base64';
import sha256 from 'crypto-js/sha256';
import { PublicKey } from '@solana/web3.js';
import cors from 'cors';

import MailProvider from './mailProvider';
import {
  NotifcationStatus,
  getNotificationStatus,
  getCrendentials,
  setCrendentials,
  setNotificationStatus,
} from '../api/db';
import {
  EventType,
  parseEvents,
  SharedLedgerWrapper,
} from '../api/shared_ledger';
import { getSolPrice, getTransactionUrl } from '../utils/utils';

const sharedLedgerWrapper = new SharedLedgerWrapper();
sharedLedgerWrapper.initialize();

const errorFormat = (message: string) => ({
  error: {
    message,
  },
});

const corsHandler = cors({
  origin: functions.config().website.isLocal
    ? true
    : functions.config().website.url,
});

export const walletExists = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    const { walletPubkey } = request.body;

    if (!walletPubkey) {
      response.status(400).send(errorFormat('Missing valid parameter'));
      return;
    }

    getCrendentials(walletPubkey)
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
        response.status(400).send(errorFormat('Missing valid parameter'));
        return;
      }

      const notifCrendentials = await sharedLedgerWrapper.getCredentials(
        hashedEmail,
        new PublicKey(pubkey)
      );

      if (notifCrendentials.length > 0) {
        switch (Object.keys(notifCrendentials[0].account.content)[0]) {
          case 'email':
            await setCrendentials(notifCrendentials[0].account.owner, {
              email: data,
            });
            response.sendStatus(201);
            break;
          default:
            response.status(500).send(errorFormat('Credential type not found'));
        }
      } else {
        response
          .status(500)
          .send(errorFormat('No signed crendential found on chain'));
      }
    });
  }
);

export const sendNotification = functions.https.onRequest(
  (request, response) => {
    corsHandler(request, response, async () => {
      const { transactionUuid } = request.body;

      if (!transactionUuid) {
        response.status(400).send(errorFormat('Missing valid parameter'));
        return;
      }

      const transfers = await sharedLedgerWrapper.getTransferRequestfromUuid(
        new PublicKey(transactionUuid)
      );

      if (transfers.length === 0) {
        response
          .status(400)
          .send(
            errorFormat('No Transfer Request associated with this identifier')
          );
        return;
      }

      const notificationSnapshot = await getNotificationStatus(transactionUuid);
      const notificationData = notificationSnapshot.data();
      if (
        notificationData?.processStatus === NotifcationStatus.NOTIFIED ||
        notificationData?.processStatus === NotifcationStatus.PROCESSING
      ) {
        response.status(400).send(errorFormat('User already notified'));
        return;
      }

      await setNotificationStatus(
        transactionUuid,
        NotifcationStatus.PROCESSING
      );

      const { from, events } = transfers[0].account;

      const parsedEvents = parseEvents(events);
      const finalEvent = parsedEvents[1];

      if (finalEvent.eventType !== EventType.UNDEFINED) {
        response
          .status(400)
          .send(errorFormat('Notifiy only created transfer request'));
        return;
      }

      const snapshot = await getCrendentials(from);
      const data = snapshot.data();
      if (!data) {
        response.status(400).send(errorFormat("User can't be notified"));
      } else {
        const { email } = data;

        const mailProvider = new MailProvider();

        const { amount, topic, uuid } = transfers[0].account;
        const solAmount = getSolPrice(amount);
        const transactionUrl = getTransactionUrl(uuid);

        mailProvider
          .sendTransactionRequest(
            email as string,
            solAmount.toString(),
            topic,
            transactionUrl
          )
          .then(async () => {
            await setNotificationStatus(
              transactionUuid,
              NotifcationStatus.NOTIFIED
            );
            response.sendStatus(200);
          })
          .catch(async (err) => {
            functions.logger.error(err);
            response.sendStatus(500);
            await setNotificationStatus(
              transactionUuid,
              NotifcationStatus.ERROR
            );
          });
      }
    });
  }
);
