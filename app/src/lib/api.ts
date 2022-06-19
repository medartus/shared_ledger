import { PublicKey } from '@solana/web3.js';
import { httpsCallable } from 'firebase/functions';
import functions from './firebase';

export const verifyCredentials = (
  credential: string,
  pubkey: PublicKey,
  uuid: string
) =>
  httpsCallable<unknown, null>(
    functions,
    'verifyTransaction'
  )({
    credential,
    pubkey: pubkey.toString(),
    uuid,
  });

type WalletExistsResponse = { walletExists: boolean };

export const walletExists = (wallet: PublicKey) =>
  httpsCallable<unknown, WalletExistsResponse>(
    functions,
    'walletExists'
  )({
    walletPubkey: wallet.toString(),
  });

export const sendNotification = (transactionUuid: PublicKey) =>
  httpsCallable<unknown, null>(
    functions,
    'sendNotification'
  )({
    transactionUuid: transactionUuid.toString(),
  });
