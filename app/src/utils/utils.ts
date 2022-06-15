import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export const getWalletString = (
  wallet: PublicKey,
  shorten: boolean,
  numbChars = 5
) => {
  const walletString = wallet.toString();
  if (!shorten) return walletString;
  const stranegrWalletStart = walletString.substring(0, numbChars);
  const stranegrWalletEnd = walletString.substring(
    walletString.length - numbChars
  );
  return `${stranegrWalletStart}...${stranegrWalletEnd}`;
};

export const getSolPrice = (
  lamports: number,
  precision: number | undefined = undefined
) => {
  if (!precision) return lamports / LAMPORTS_PER_SOL;
  return Number((lamports / LAMPORTS_PER_SOL).toFixed(precision));
};
