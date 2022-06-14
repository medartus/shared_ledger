import { PublicKey } from '@solana/web3.js';

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

export const foo = () => {};
