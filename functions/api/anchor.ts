import * as anchor from '@project-serum/anchor';
import { Program, Idl, Wallet } from '@project-serum/anchor';
import { ConfirmOptions, Connection } from '@solana/web3.js';

const connectionsOptions = {
  preflightCommitment: 'processed' as ConfirmOptions,
};

const getConnectionProvider = (wallet: Wallet, connection: Connection) =>
  new anchor.AnchorProvider(
    connection,
    wallet,
    connectionsOptions.preflightCommitment
  );

const getProgram = async (
  wallet: Wallet,
  connection: Connection,
  programId: anchor.web3.PublicKey,
  idl: Idl
) => {
  // Get a provider
  const provider = getConnectionProvider(wallet, connection);
  // Create a program that you can call
  return new Program(idl, programId, provider);
};

export default getProgram;
