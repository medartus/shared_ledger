import { PublicKey } from '@solana/web3.js';
import axios from 'axios';

const API_ADDRESS = 'http://localhost:5001';

export enum ApiEndpoint {
  VERIFY_TRANSCATION,
  WALLET_EXISTS,
  SEND_NOTIFICATION,
}

export const getEndpoint = (endpointType: ApiEndpoint) => {
  switch (endpointType) {
    case ApiEndpoint.VERIFY_TRANSCATION:
      return `${API_ADDRESS}/shared-w3-ledger/us-central1/verifyTransaction`;
    case ApiEndpoint.WALLET_EXISTS:
      return `${API_ADDRESS}/shared-w3-ledger/us-central1/walletExists`;
    case ApiEndpoint.SEND_NOTIFICATION:
      return `${API_ADDRESS}/shared-w3-ledger/us-central1/sendNotification`;
    default:
      return '';
  }
};

export const verifyCredentials = (
  credential: string,
  pubkey: PublicKey,
  uuid: string
) =>
  axios.post(getEndpoint(ApiEndpoint.VERIFY_TRANSCATION), {
    data: credential,
    pubkey,
    uuid,
  });

export const walletExists = (wallet: PublicKey) =>
  axios.post(getEndpoint(ApiEndpoint.WALLET_EXISTS), {
    walletPubkey: wallet,
  });

export const senNotification = (transactionUuid: PublicKey) =>
  axios.post(getEndpoint(ApiEndpoint.SEND_NOTIFICATION), {
    transactionUuid,
  });
