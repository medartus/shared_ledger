import { PublicKey, SystemProgram, Connection, Keypair } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import Base64 from 'crypto-js/enc-base64';
import sha256 from 'crypto-js/sha256';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import bs58 from 'bs58';
import BN from 'bn.js';

import getProgram from './anchor';
import { IDL, SharedLedger } from '../types/shared_ledger';

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

const TransactionUserFilter = (user: PublicKey) => ({
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

      axios.post(
        'http://localhost:5001/shared-w3-ledger/us-central1/verifyTransaction',
        {
          data: email,
          pubkey: this.wallet.publicKey,
          uuid,
        }
      );
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
      console.log('done');
    }
  };

  cancelTransferRequest = async () => {
    if (this.program && this.wallet) {
      const transferUuid = Keypair.generate().publicKey;

      const [transferPDA] = await getTransferPDA(transferUuid);

      await this.program.methods
        .cancelTransferRequest(transferUuid)
        .accounts({
          requester: this.wallet.publicKey,
          transfer: transferPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }
  };

  executeTransferRequest = async (
    requester: PublicKey,
    transferUuid: PublicKey
  ) => {
    if (this.program && this.wallet) {
      const [transferPDA] = await getTransferPDA(transferUuid);

      await this.program.methods
        .executeTransferRequest(transferUuid)
        .accounts({
          requester,
          payer: this.wallet.publicKey,
          transfer: transferPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    }
  };

  getTransferRequest = async () => {
    if (this.program && this.wallet) {
      return this.program.account.transfer.all([
        TransactionUserFilter(this.wallet.publicKey),
      ]);
    }
    return [];
  };

  getTransferRequestfromUuid = async (transactionUuid: PublicKey) => {
    if (this.program && this.wallet) {
      return this.program.account.transfer.all([
        TransactionUuidFilter(transactionUuid),
      ]);
    }
    return [];
  };
}

export type TransferRequests = Awaited<
  ReturnType<typeof SharedLedgerWrapper.prototype.getTransferRequest>
>;

export type TransactionEvent = {
  timestamp: BN;
  eventType: object;
};
