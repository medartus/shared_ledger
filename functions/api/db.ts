import { PublicKey } from "@solana/web3.js";
import * as admin from "firebase-admin";

import * as serviceAccount from "../serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const firestore = admin.firestore();

const credentialsDB = firestore
  .collection("app")
  .doc("shared_ledger")
  .collection("credentials");

const notiicationDB = firestore
  .collection("app")
  .doc("shared_ledger")
  .collection("requestNotification");

export const getCrendentials = (payerPubkey: PublicKey) =>
  credentialsDB.doc(payerPubkey.toString()).get();

export const setCrendentials = (
  walletPubkey: PublicKey,
  credentials: any,
  merge = true
) => {
  return credentialsDB.doc(walletPubkey.toString()).set(credentials, { merge });
};

export const getNotificationStatus = (transactionUuid: string) =>
  notiicationDB.doc(transactionUuid).get();

export const setNotificationStatus = (
  transactionUuid: string,
  processStatus: NotifcationStatus,
  merge = true
) => {
  notiicationDB.doc(transactionUuid).set(
    {
      processStatus: processStatus.toString(),
    },
    { merge }
  );
};

export enum NotifcationStatus {
  NOTIFIED = "NOTIFIED",
  PROCESSING = "PROCESSING",
  ERROR = "ERROR",
}
