import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SharedLedger } from "../target/types/shared_ledger";
import * as assert from "assert";
import { sha256 } from "js-sha256";
import bs58 from "bs58";
import BN from "bn.js";

import { v4 as uuidv4 } from "uuid";

const authorFilter = (author: PublicKey) => ({
  memcmp: {
    offset: 8, // Discriminator.
    bytes: bs58.encode(author.toBuffer()),
  },
});

const uuidFilter = (uuid: PublicKey) => ({
  memcmp: {
    offset:
      8 + // Discriminator.
      32, // Author public key.
    bytes: bs58.encode(uuid.toBuffer()),
  },
});

const topicFilter = (topic: String) => ({
  memcmp: {
    offset:
      8 + // Discriminator.
      32 + // Author public key.
      32 + // Uuid publick key.
      4, //topic length.
    bytes: bs58.encode(Buffer.from(topic)),
  },
});

const ledgerFilter = (ledger_key: PublicKey) => ({
  memcmp: {
    offset:
      8 + // Discriminator.
      32 + // Author public key.
      32, // Uuid publick key.
    bytes: bs58.encode(ledger_key.toBuffer()),
  },
});

class PDA {
  constructor(program) {
    this.programId = program.programId;
  }
  programId: PublicKey;

  getLedger = (ledgerUuid: anchor.web3.Keypair) => {
    return PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("ledger"),
        ledgerUuid.publicKey.toBuffer(),
      ],
      this.programId
    );
  };

  getTransaction = (
    LedgerPDA: anchor.web3.PublicKey,
    transactionUuid: anchor.web3.Keypair
  ) => {
    return PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("transaction"),
        LedgerPDA.toBuffer(),
        transactionUuid.publicKey.toBuffer(),
      ],
      this.programId
    );
  };

  getLegderUser = (
    LedgerPDA: anchor.web3.PublicKey,
    ledgerUserUuid: anchor.web3.Keypair
  ) => {
    return PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("ledger_user"),
        LedgerPDA.toBuffer(),
        ledgerUserUuid.publicKey.toBuffer(),
      ],
      this.programId
    );
  };
}

describe("shared_ledger", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SharedLedger as Program<SharedLedger>;
  const pda = new PDA(program);

  const mainLedger = anchor.web3.Keypair.generate();

  it("Create valid ledger", async () => {
    const topic = "Madrid Con Sangre";
    const [LedgerPDA, _] = await pda.getLedger(mainLedger);

    const tx = await program.methods
      .createLedger(mainLedger.publicKey, topic)
      .accounts({
        ledger: LedgerPDA,
        author: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const ledgers = await program.account.ledger.all();

import { v4 as uuidv4 } from "uuid";

    assert.equal(ledgers.length, 1);
    assert.equal(
      ledgers[0].account.author.toBase58().toString(),
      program.provider.wallet.publicKey
    );
    assert.equal(ledgers[0].account.topic, topic);
  });

  it("Create multiple ledgers", async () => {
    const topic = "Another Ledger";
    const ledgerUuid = anchor.web3.Keypair.generate();
    const [LedgerPDA, _] = await pda.getLedger(ledgerUuid);

    const tx = await program.methods
      .createLedger(ledgerUuid.publicKey, topic)
      .accounts({
        ledger: LedgerPDA,
        author: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const ledgers = await program.account.ledger.all();
    assert.equal(ledgers.length, 2);
  });

  it("Fetch ledger using UUID", async () => {
    const [LedgerPDA, _] = await pda.getLedger(mainLedger);
    const ledger = await program.account.ledger.fetch(LedgerPDA);
    assert.equal(ledger.topic, "Madrid Con Sangre");
  });

  it("Fetch Auhtor", async () => {
    const ledgers = await program.account.ledger.all([
      authorFilter(program.provider.wallet.publicKey),
    ]);

    assert.equal(ledgers.length, 2);
  });

  it("Fetch UUID", async () => {
    const ledgers = await program.account.ledger.all([
      uuidFilter(mainLedger.publicKey),
    ]);

    assert.equal(ledgers.length, 1);
  });

  it("Fetch Topic", async () => {
    const ledgerTopic = "Madrid Con Sangre";

    const ledgers = await program.account.ledger.all([
      topicFilter(ledgerTopic),
    ]);

    assert.equal(ledgers.length, 1);
  });

  it("Fetch no Topic", async () => {
    const ledgers = await program.account.ledger.all([
      topicFilter("Madrid Solo"),
    ]);

    assert.equal(ledgers.length, 0);
  });

  const mainTransaction = anchor.web3.Keypair.generate();
  it("Create transaction", async () => {
    const [ledgerPDA, _] = await pda.getLedger(mainLedger);

    const [transactionPDA, _u] = await pda.getTransaction(
      ledgerPDA,
      mainTransaction
    );

    const tx = await program.methods
      .createTransaction(
        mainTransaction.publicKey,
        "Virement du cul",
        154.32,
        program.provider.wallet.publicKey
      )
      .accounts({
        ledger: ledgerPDA,
        transaction: transactionPDA,
        author: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const transaction = await program.account.transaction.all();

    console.log(transaction);
  });

  it("Fetch transaction", async () => {
    const [ledgerPDA, _] = await pda.getLedger(mainLedger);

    const [transactionPDA, _u] = await pda.getTransaction(
      ledgerPDA,
      mainTransaction
    );

    const transaction = await program.account.transaction.fetch(transactionPDA);
    console.log(transaction);
    assert.equal(transaction.name, "Virement du cul");
  });

  const ledgerUsers = [anchor.web3.Keypair.generate()];
  it("Create transaction", async () => {
    const [ledgerPDA, _] = await pda.getLedger(mainLedger);

    const [ledgerUserPDA, _u] = await pda.getLegderUser(
      ledgerPDA,
      ledgerUsers[0]
    );

    const tx = await program.methods
      .createLedgerUser(
        ledgerUsers[0].publicKey,
        anchor.web3.Keypair.generate().publicKey,
        "Random guy #1"
      )
      .accounts({
        ledger: ledgerPDA,
        ledgerUser: ledgerUserPDA,
        author: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const transaction = await program.account.transaction.all();

    console.log(transaction);
  });
});
