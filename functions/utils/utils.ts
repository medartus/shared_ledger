import * as functions from 'firebase-functions';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

const WEBSITE_URL = functions.config().website.url;

export const getSolPrice = (
  lamports: BN,
  precision: number | undefined = undefined
) => {
  if (!precision) return lamports.toNumber() / LAMPORTS_PER_SOL;
  return Number((lamports.toNumber() / LAMPORTS_PER_SOL).toFixed(precision));
};

export const getTransactionUrl = (uuid: PublicKey) =>
  `${WEBSITE_URL}/transfer?uuid=${uuid.toString()}`;
