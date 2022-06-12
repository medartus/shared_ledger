import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as Base64 from "crypto-js/enc-base64";
import * as sha256 from "crypto-js/sha256";

import { MailProvider } from "./mailProvider";
import * as serviceAccount from "../serviceAccountKey.json";
import { SharedLedgerWrapper } from "./shared_ledger";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const sharedLedgerWrapper = new SharedLedgerWrapper();
sharedLedgerWrapper.initialize();

const firestore = admin.firestore();

const credentialsDB = firestore
  .collection("app")
  .doc("shared_ledger")
  .collection("credentials");

const errorFormat = (message: string) => ({
  error: {
    message,
  },
});

export const walletExists = functions.https.onRequest(
  async (request, response) => {
    const { walletPubkey } = request.body;

    if (!walletPubkey) {
      response.status(400).send(errorFormat("Missing valid parameter"));
    }

    credentialsDB
      .doc(walletPubkey)
      .get()
      .then((credential) => response.sendStatus(credential.exists ? 200 : 204))
      .catch(() => response.sendStatus(500));
  }
);

export const verifyTransaction = functions.https.onRequest(
  async (request, response) => {
    const { pubkey, data, uuid } = request.body;
    const hashedEmail = Base64.stringify(sha256(uuid + data));

    if (!pubkey || !data || !uuid) {
      response.status(400).send(errorFormat("Missing valid parameter"));
    }

    const notifCrendentials = await sharedLedgerWrapper.getCredentials(
      hashedEmail,
      pubkey
    );

    if (notifCrendentials.length > 0) {
      switch (Object.keys(notifCrendentials[0].account.content)[0]) {
        case "email":
          credentialsDB.doc(notifCrendentials[0].publicKey.toString()).set(
            {
              email: data,
            },
            { merge: true }
          );
          response.sendStatus(201);
          break;
        default:
          response.status(500).send(errorFormat("Credential type not found"));
          break;
      }
    } else {
      response
        .status(500)
        .send(errorFormat("No signed crendential found on chain"));
    }
  }
);

export const sendNotification = functions.https.onRequest(
  async (request, response) => {
    const mailProvider = new MailProvider();

    mailProvider
      .sendWelcomeEmail("marcetienne.dartus@gmail.com", "Markitanki")
      .then(() => response.sendStatus(200))
      .catch((err) => {
        functions.logger.error(err);
        response.sendStatus(500);
      });
  }
);
