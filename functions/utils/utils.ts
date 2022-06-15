import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as BN from "bn.js";

const WEBSITE_URL = "http://localhost:3000";

export const getSolPrice = (
  lamports: BN,
  precision: number | undefined = undefined
) => {
  if (!precision) return lamports.toNumber() / LAMPORTS_PER_SOL;
  return Number((lamports.toNumber() / LAMPORTS_PER_SOL).toFixed(precision));
};

export const getTransactionUrl = (uuid: PublicKey) =>
  `${WEBSITE_URL}/transfer?uuid=${uuid.toString()}`;
