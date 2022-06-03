import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SharedLedger } from "../target/types/shared_ledger";
import sha256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";
import BN from "bn.js";

class TestUtils {
  program: anchor.Program<SharedLedger>;
  programId: anchor.web3.PublicKey;
  provider: anchor.Provider;

  constructor() {
    this.program = anchor.workspace.SharedLedger as Program<SharedLedger>;
    this.programId = this.program.programId;
    this.provider = this.program.provider;
  }

  getTransfer = (transferUuid: anchor.web3.PublicKey) => {
    return PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("transfer"), transferUuid.toBuffer()],
      this.programId
    );
  };

  requestAirdrop = async (pubkey: anchor.web3.PublicKey, amount = 10000000) => {
    return this.provider.connection.confirmTransaction(
      await this.provider.connection.requestAirdrop(pubkey, amount),
      "processed"
    );
  };

  getBalance = async (pubkey: anchor.web3.PublicKey) => {
    return this.provider.connection.getBalance(pubkey);
  };
}

describe("anchor-escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  it("Configure Email", async () => {
    const email = "marcetienne.dartus@gmail.com";
    const uuid = uuidv4();
    const hashedEmail = Base64.stringify(sha256(uuid + email));

    const testUtils = new TestUtils();
    const emailOwner = anchor.web3.Keypair.generate();
    const credential = anchor.web3.Keypair.generate();

    await testUtils.requestAirdrop(emailOwner.publicKey);

    await testUtils.program.methods
      .createNotificationCredential({ email: null }, hashedEmail)
      .accounts({
        author: emailOwner.publicKey,
        credential: credential.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([emailOwner, credential])
      .rpc();

    const notifCrendentials =
      await testUtils.program.account.contentCredential.all();
    console.log(notifCrendentials);
  });

  it("Create Transfer Request", async () => {
    const topic = "Another Ledger";
    const amount = 42;

    const testUtils = new TestUtils();
    const payer = anchor.web3.Keypair.generate();
    const receiver = anchor.web3.Keypair.generate();
    const transferUuid = anchor.web3.Keypair.generate().publicKey;

    await testUtils.requestAirdrop(payer.publicKey);
    await testUtils.requestAirdrop(receiver.publicKey);

    const [transferPDA, _] = await testUtils.getTransfer(transferUuid);

    await testUtils.program.methods
      .createTransferRequest(transferUuid, topic, new BN(amount))
      .accounts({
        requester: receiver.publicKey,
        payer: payer.publicKey,
        transfer: transferPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([receiver])
      .rpc();

    const transfers = await testUtils.program.account.transfer.all();
    console.log(JSON.stringify(transfers, null, 4));
  });

  it("Send money", async () => {
    const topic = "Another Ledger";
    const amount = 42;

    const testUtils = new TestUtils();
    const payer = anchor.web3.Keypair.generate();
    const receiver = anchor.web3.Keypair.generate();
    const transferUuid = anchor.web3.Keypair.generate().publicKey;

    await testUtils.requestAirdrop(payer.publicKey);
    await testUtils.requestAirdrop(receiver.publicKey);

    const [transferPDA, _] = await testUtils.getTransfer(transferUuid);

    await testUtils.program.methods
      .createTransferRequest(transferUuid, topic, new BN(amount))
      .accounts({
        requester: receiver.publicKey,
        payer: payer.publicKey,
        transfer: transferPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([receiver])
      .rpc();

    await testUtils.program.methods
      .executeTransferRequest(transferUuid)
      .accounts({
        requester: receiver.publicKey,
        payer: payer.publicKey,
        transfer: transferPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    const transfers = await testUtils.program.account.transfer.all();
    console.log(JSON.stringify(transfers, null, 4));
  });

  it("Cancel transfer request  ", async () => {
    const topic = "Another Ledger";
    const amount = 42;

    const testUtils = new TestUtils();
    const payer = anchor.web3.Keypair.generate();
    const receiver = anchor.web3.Keypair.generate();
    const transferUuid = anchor.web3.Keypair.generate().publicKey;

    await testUtils.requestAirdrop(payer.publicKey);
    await testUtils.requestAirdrop(receiver.publicKey);

    const [transferPDA, _] = await testUtils.getTransfer(transferUuid);

    await testUtils.program.methods
      .createTransferRequest(transferUuid, topic, new BN(amount))
      .accounts({
        requester: receiver.publicKey,
        payer: payer.publicKey,
        transfer: transferPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([receiver])
      .rpc();

    await testUtils.program.methods
      .executeTransferRequest(transferUuid)
      .accounts({
        requester: receiver.publicKey,
        payer: payer.publicKey,
        transfer: transferPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    const transfers = await testUtils.program.account.transfer.all();
    console.log(JSON.stringify(transfers, null, 4));
  });
});
