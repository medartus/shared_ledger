import { PublicKey, SystemProgram, Connection, Keypair } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import Base64 from 'crypto-js/enc-base64';
import sha256 from 'crypto-js/sha256';
import { v4 as uuidv4 } from 'uuid';
import bs58 from 'bs58';
import BN from 'bn.js';

import getProgram from './anchor';
import { IDL, SharedLedger } from '../types/shared_ledger';
import { senNotification, verifyCredentials } from './api';

const PROGRAM_ID = new PublicKey(
  '27b22Rj4yVNXM1vEdh65LJ2HsfbmWwBeoncMEFd14bhL'
);

const getTransferPDA = (transferUuid: anchor.web3.PublicKey) =>
  PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode('transfer'), transferUuid.toBuffer()],
    PROGRAM_ID
  );

const TransactionUuidFilter = (uuid: PublicKey) => ({
  memcmp: {
    offset:
      8 + // Discriminator.
      32 + // from pubkey.
      32, // to pubkey.
    bytes: bs58.encode(uuid.toBuffer()),
  },
});

const TransactionPayerFilter = (user: PublicKey) => ({
  memcmp: {
    offset: 8, // Discriminator.
    bytes: bs58.encode(user.toBuffer()),
  },
});

const TransactionReceiverFilter = (user: PublicKey) => ({
  memcmp: {
    offset:
      8 + // Discriminator.
      32, // from pubkey.
    bytes: bs58.encode(user.toBuffer()),
  },
});

export class SharedLedgerWrapper {
  program: Program<SharedLedger> | null;

  wallet: AnchorWallet | null;

  constructor() {
    this.program = null;
    this.wallet = null;
  }

  initialize = async (wallet: AnchorWallet, connection: Connection) => {
    const program = await getProgram(wallet, connection, PROGRAM_ID, IDL);
    if (program) {
      this.program = program as unknown as Program<SharedLedger>;
      this.wallet = wallet;
    }
  };

  createCredential = async (email: string) => {
    if (this.program && this.wallet) {
      const uuid = uuidv4();
      const hashedEmail = Base64.stringify(sha256(uuid + email));
      const content = { email: {} };

      const credential = anchor.web3.Keypair.generate();

      await this.program.methods
        .createNotificationCredential(content, hashedEmail)
        .accounts({
          author: this.wallet.publicKey,
          credential: credential.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([credential])
        .rpc();

      verifyCredentials(email, this.wallet.publicKey, uuid);
    }
  };

  createTransferRequest = async (
    topic: string,
    amount: number,
    payer: PublicKey
  ) => {
    console.log(this.program, this.wallet);
    if (this.program && this.wallet) {
      const transferUuid = Keypair.generate().publicKey;

      const [transferPDA] = await getTransferPDA(transferUuid);
      console.log(topic, amount, payer, transferPDA);

      await this.program.methods
        .createTransferRequest(transferUuid, topic, new BN(amount))
        .accounts({
          requester: this.wallet.publicKey,
          payer,
          transfer: transferPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await senNotification(transferUuid);
    }
  };

  cancelTransferRequest = async (transfer: TransferAccount) => {
    if (this.program && this.wallet) {
      const { uuid } = transfer;
      const [transferPDA] = await getTransferPDA(uuid);

      await this.program.methods
        .cancelTransferRequest(uuid)
        .accounts({
          requester: this.wallet.publicKey,
          transfer: transferPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }
  };

  executeTransferRequest = async (transfer: TransferAccount) => {
    if (this.program && this.wallet) {
      const { uuid, to } = transfer;

      const [transferPDA] = await getTransferPDA(uuid);

      await this.program.methods
        .executeTransferRequest(uuid)
        .accounts({
          requester: to,
          payer: this.wallet.publicKey,
          transfer: transferPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    }
  };

  getTransferRequest = (): Promise<Transfer[]> =>
    new Promise((resolve) => {
      if (this.program && this.wallet) {
        Promise.all([
          this.program.account.transfer.all([
            TransactionPayerFilter(this.wallet.publicKey),
          ]),
          this.program.account.transfer.all([
            TransactionReceiverFilter(this.wallet.publicKey),
          ]),
        ]).then((res) => {
          console.log(res);
          const transferList = [...res[0], ...res[1]] as Transfer[];
          transferList.sort(
            (a, b) =>
              a.account.events[0].timestamp.toNumber() -
              b.account.events[0].timestamp.toNumber()
          );
          console.log(transferList);
          resolve(transferList);
        });
      } else {
        resolve([]);
      }
    });

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
