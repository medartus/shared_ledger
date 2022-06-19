import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import BN from 'bn.js';

import getProgram from './anchor';
import { IDL, SharedLedger } from '../../target/types/shared_ledger';

const PROGRAM_ID = new PublicKey(
  '27b22Rj4yVNXM1vEdh65LJ2HsfbmWwBeoncMEFd14bhL'
);

enum NETWORK {
  LOCALHOST = 'http://127.0.0.1:8899',
  DEVNET = 'https://api.devnet.solana.com',
  MAINNET = 'https://api.mainnet-beta.solana.com',
}

const signedTransactionOwnerFilter = (pubkey: PublicKey) => ({
  memcmp: {
    offset: 8, // Discriminator.
    bytes: bs58.encode(pubkey.toBuffer()),
  },
});

const signedTransactionDataFilter = (encryptedData: string) => ({
  memcmp: {
    offset:
      8 + // Discriminator.
      32 + // Owner public key.
      1 + // Type
      4, // Array Length
    bytes: bs58.encode(Buffer.from(encryptedData)),
  },
});

const TransactionUuidFilter = (uuid: PublicKey) => ({
  memcmp: {
    offset:
      8 + // Discriminator.
      32 + // from pubkey.
      32, // to pubkey.
    bytes: bs58.encode(uuid.toBuffer()),
  },
});

export class SharedLedgerWrapper {
  program: Program<SharedLedger> | null;

  wallet: Wallet;

  constructor() {
    this.program = null;
    this.wallet = new Wallet(new Keypair());
  }

  initialize = async () => {
    const connection = new Connection(NETWORK.DEVNET.toString(), 'processed');
    const program = await getProgram(this.wallet, connection, PROGRAM_ID, IDL);
    this.program = program as unknown as Program<SharedLedger>;
  };

  getCredentials = (hashedEmail: string, pubkey: PublicKey) => {
    if (this.program && this.wallet) {
      return this.program.account.contentCredential.all([
        signedTransactionOwnerFilter(new PublicKey(pubkey)),
        signedTransactionDataFilter(hashedEmail),
      ]);
    }
    return [];
  };

  getTransferRequestfromUuid = async (
    transactionUuid: PublicKey
  ): Promise<Transfer[]> => {
    if (this.program && this.wallet) {
      return this.program.account.transfer.all([
        TransactionUuidFilter(transactionUuid),
      ]) as unknown as Transfer[];
    }
    return [];
  };
}

export type Transfer = {
  account: TransferAccount;
  publicKey: PublicKey;
};

export type TransferAccount = {
  from: PublicKey;
  to: PublicKey;
  uuid: PublicKey;
  topic: string;
  amount: BN;
  events: TransactionEvent[];
  bump: number;
};

export type TransactionEvent = {
  timestamp: BN;
  eventType: object;
};

export type TransactionEventParsed = {
  date: Date;
  eventType: EventType;
};

export enum EventType {
  UNDEFINED = 'undefined',
  CREATION = 'creation',
  CANCEL = 'cancel',
  TRANSFER = 'transfer',
}

const parseEvent = (event: TransactionEvent) => {
  let eventType = EventType.UNDEFINED;

  switch (Object.keys(event.eventType)[0]) {
    case 'creation':
      eventType = EventType.CREATION;
      break;
    case 'transfer':
      eventType = EventType.TRANSFER;
      break;
    case 'cancel':
      eventType = EventType.CANCEL;
      break;
    default:
      break;
  }

  const date = new Date(event.timestamp.toNumber() * 1000);

  return {
    date,
    eventType,
  } as TransactionEventParsed;
};

export const parseEvents = (events: TransactionEvent[]) =>
  events.map((event) => parseEvent(event));
