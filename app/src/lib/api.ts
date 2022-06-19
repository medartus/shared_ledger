import { PublicKey } from '@solana/web3.js';
import axios from 'axios';

const BACKEND_API_ADDRESS = process.env.REACT_APP_BACKEND_API_ADDRESS;
console.log(BACKEND_API_ADDRESS);

export enum ApiEndpoint {
  VERIFY_TRANSCATION,
  WALLET_EXISTS,
  SEND_NOTIFICATION,
}

export const getEndpoint = (endpointType: ApiEndpoint) => {
  switch (endpointType) {
    case ApiEndpoint.VERIFY_TRANSCATION:
      return `${BACKEND_API_ADDRESS}/verifyTransaction`;
    case ApiEndpoint.WALLET_EXISTS:
      return `${BACKEND_API_ADDRESS}/walletExists`;
    case ApiEndpoint.SEND_NOTIFICATION:
      return `${BACKEND_API_ADDRESS}/sendNotification`;
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

export const sendNotification = (transactionUuid: PublicKey) =>
  axios.post(getEndpoint(ApiEndpoint.SEND_NOTIFICATION), {
    transactionUuid,
  });
