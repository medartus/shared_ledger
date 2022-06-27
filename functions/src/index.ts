import * as functions from 'firebase-functions';
import Base64 from 'crypto-js/enc-base64';
import sha256 from 'crypto-js/sha256';
import { PublicKey } from '@solana/web3.js';

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

export const walletExists = functions.https.onCall((data) => {
  const { walletPubkey } = data;

  if (!walletPubkey) {
    throw new Error('Missing valid parameter');
  }

  return getCrendentials(new PublicKey(walletPubkey)).then((credential) => ({
    walletExists: credential.exists,
  }));
});

export const verifyTransaction = functions.https.onCall(async (data) => {
  const { pubkey, credential, uuid } = data;
  const hashedEmail = Base64.stringify(sha256(uuid + credential));

  if (!pubkey || !credential || !uuid) {
    throw new Error('Missing valid parameter');
  }

  const notifCrendentials = await sharedLedgerWrapper.getCredentials(
    hashedEmail,
    new PublicKey(pubkey)
  );

  if (notifCrendentials.length > 0) {
    switch (Object.keys(notifCrendentials[0].account.content)[0]) {
      case 'email':
        return setCrendentials(notifCrendentials[0].account.owner, {
          email: credential,
        });
      default:
        throw new Error('Credential type not found');
    }
  } else {
    throw new Error('No signed crendential found on chain');
  }
});

export const sendNotification = functions.https.onCall(async (data) => {
  const { transactionUuid } = data;

  if (!transactionUuid) {
    throw new Error('Missing valid parameter');
  }

  const transfers = await sharedLedgerWrapper.getTransferRequestfromUuid(
    new PublicKey(transactionUuid)
  );

  if (transfers.length === 0) {
    throw new Error('No Transfer Request associated with this identifier');
  }

  const notificationSnapshot = await getNotificationStatus(transactionUuid);
  const notificationData = notificationSnapshot.data();
  if (
    notificationData?.processStatus === NotifcationStatus.NOTIFIED ||
    notificationData?.processStatus === NotifcationStatus.PROCESSING
  ) {
    throw new Error('User already notified');
  }

  await setNotificationStatus(transactionUuid, NotifcationStatus.PROCESSING);

  const { from, events } = transfers[0].account;

  const parsedEvents = parseEvents(events);
  const finalEvent = parsedEvents[1];

  if (finalEvent.eventType !== EventType.UNDEFINED) {
    throw new Error('Notifiy only created transfer request');
  }

  const snapshot = await getCrendentials(from);
  const snapshotData = snapshot.data();
  if (!snapshotData) {
    functions.logger.error('No email is associated to that wallet');
  } else {
    const { email } = snapshotData;

    const mailProvider = new MailProvider();

    const { amount, topic, uuid } = transfers[0].account;
    const solAmount = getSolPrice(amount);
    const transactionUrl = getTransactionUrl(uuid);

    try {
      await mailProvider.sendTransactionRequest(
        email as string,
        solAmount.toString(),
        topic,
        transactionUrl
      );

      return setNotificationStatus(transactionUuid, NotifcationStatus.NOTIFIED);
    } catch (error) {
      setNotificationStatus(transactionUuid, NotifcationStatus.ERROR);
      functions.logger.error("Can't send Email to that user");
    }
  }
});
