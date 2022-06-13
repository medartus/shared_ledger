import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { ConfirmOptions, Connection } from '@solana/web3.js';

const connectionsOptions = {
  preflightCommitment: 'processed' as ConfirmOptions,
};

const getConnectionProvider = (wallet: AnchorWallet, connection: Connection) =>
  new anchor.AnchorProvider(
    connection,
    wallet,
    connectionsOptions.preflightCommitment
  );

const getProgram = async (
  wallet: AnchorWallet,
  connection: Connection,
  programId: anchor.web3.PublicKey
) => {
  // Get a provider
  const provider = getConnectionProvider(wallet, connection);
  // Get metadata about your solana program
  const idl = await Program.fetchIdl(programId, provider);
  if (idl === null) return null;
  // Create a program that you can call
  return new Program(idl, programId, provider);
};

export default getProgram;
