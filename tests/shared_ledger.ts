import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SharedLedger } from "../target/types/shared_ledger";
import sha256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";
import bs58 from "bs58";
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

  CredentialHashFilter = (hash: string) => ({
    memcmp: {
      offset:
        8 + // Discriminator.
        32 + // owner pubkey
        1 + // content
        4, // hash string length
      bytes: bs58.encode(Buffer.from(hash)),
    },
  });

  TransactionUuidFilter = (uuid: PublicKey) => ({
    memcmp: {
      offset:
        8 + // Discriminator.
        32 + // from pubkey.
        32, // to pubkey.
      bytes: bs58.encode(uuid.toBuffer()),
    },
  });
}

describe("SharedLedger", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  describe("CreateContentCredential", () => {
    let numCredentials = 0;

    it("Create valid credentials", async () => {
      const email = "marcetienne.dartus@gmail.com";
      const uuid = uuidv4();
      const hashedEmail = Base64.stringify(sha256(uuid + email));
      const content = { email: {} };

      const testUtils = new TestUtils();
      const emailOwner = anchor.web3.Keypair.generate();
      const credential = anchor.web3.Keypair.generate();

      await testUtils.requestAirdrop(emailOwner.publicKey);

      await testUtils.program.methods
        .createNotificationCredential(content, hashedEmail)
        .accounts({
          author: emailOwner.publicKey,
          credential: credential.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([emailOwner, credential])
        .rpc();

      const notifCrendentials =
        await testUtils.program.account.contentCredential.all([
          testUtils.CredentialHashFilter(hashedEmail),
        ]);

      assert.equal(notifCrendentials.length, 1);
      assert.equal(
        notifCrendentials[0].account.owner.toString(),
        emailOwner.publicKey.toString()
      );
      assert.deepEqual(notifCrendentials[0].account.content, content);
      assert.equal(notifCrendentials[0].account.hash, hashedEmail);

      numCredentials += 1;
    });

    it("Create credential with hash length below limit", async () => {
      const testUtils = new TestUtils();
      const emailOwner = anchor.web3.Keypair.generate();
      const credential = anchor.web3.Keypair.generate();

      await testUtils.requestAirdrop(emailOwner.publicKey);
      const hashedEmail = new Array(64 + 1).join("_");
      const content = { email: {} };

      await testUtils.program.methods
        .createNotificationCredential(content, hashedEmail)
        .accounts({
          author: emailOwner.publicKey,
          credential: credential.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([emailOwner, credential])
        .rpc();

      const notifCrendentials =
        await testUtils.program.account.contentCredential.all([
          testUtils.CredentialHashFilter(hashedEmail),
        ]);

      assert.equal(notifCrendentials.length, 1);
      assert.equal(
        notifCrendentials[0].account.owner.toString(),
        emailOwner.publicKey.toString()
      );
      assert.deepEqual(notifCrendentials[0].account.content, content);
      assert.equal(notifCrendentials[0].account.hash, hashedEmail);

      numCredentials += 1;
    });

    it("Fail credential due to hash length above limit", async () => {
      const testUtils = new TestUtils();
      const emailOwner = anchor.web3.Keypair.generate();
      const credential = anchor.web3.Keypair.generate();

      await testUtils.requestAirdrop(emailOwner.publicKey);
      const hashedEmail = new Array(65 + 1).join("_");
      const content = { email: {} };

      try {
        await testUtils.program.methods
          .createNotificationCredential(content, hashedEmail)
          .accounts({
            author: emailOwner.publicKey,
            credential: credential.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([emailOwner, credential])
          .rpc();
      } catch (error) {
        assert.equal(error.error.errorCode.code, "HashTooLong");
      }

      const notifCrendentials =
        await testUtils.program.account.contentCredential.all();

      assert.equal(notifCrendentials.length, numCredentials);
    });
  });

  describe("CreateTransferRequest", () => {
    it("Create valid transfer request", async () => {
      const topic = "Goooiko Con Sangre";
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

      const transfers = await testUtils.program.account.transfer.all([
        testUtils.TransactionUuidFilter(transferUuid),
      ]);

      assert.equal(transfers.length, 1);
      assert.equal(transfers[0].account.amount.toNumber(), amount);
      assert.equal(transfers[0].account.topic, topic);
      assert.deepEqual(transfers[0].account.from, payer.publicKey);
      assert.deepEqual(transfers[0].account.to, receiver.publicKey);
      assert.deepEqual(transfers[0].account.uuid, transferUuid);
      assert.deepEqual(transfers[0].account.events[0].eventType, {
        creation: {},
      });
    });

    it("Invalid transfer request due to negative number", async () => {
      const topic = "Negativo no!";
      const amount = -42;

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

      const transfers = await testUtils.program.account.transfer.all([
        testUtils.TransactionUuidFilter(transferUuid),
      ]);

      assert.equal(transfers.length, 1);
      assert.equal(transfers[0].account.amount.toNumber(), -1 * amount);
      assert.equal(transfers[0].account.topic, topic);
      assert.deepEqual(transfers[0].account.from, payer.publicKey);
      assert.deepEqual(transfers[0].account.to, receiver.publicKey);
      assert.deepEqual(transfers[0].account.uuid, transferUuid);
      assert.deepEqual(transfers[0].account.events[0].eventType, {
        creation: {},
      });
    });

    it("Invalid transfer request due to topic to long", async () => {
      const topic = new Array(51 + 1).join("_");
      const amount = 42;

      const testUtils = new TestUtils();
      const payer = anchor.web3.Keypair.generate();
      const receiver = anchor.web3.Keypair.generate();
      const transferUuid = anchor.web3.Keypair.generate().publicKey;

      await testUtils.requestAirdrop(payer.publicKey);
      await testUtils.requestAirdrop(receiver.publicKey);

      const [transferPDA, _] = await testUtils.getTransfer(transferUuid);

      try {
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
      } catch (error) {
        assert.equal(error.error.errorCode.code, "TopicTooLong");
      }

      const transfers = await testUtils.program.account.transfer.all([
        testUtils.TransactionUuidFilter(transferUuid),
      ]);

      assert.equal(transfers.length, 0);
    });
  });

  describe("ExecuteTransferRequest", () => {
    it("Execute transfer request", async () => {
      const topic = "Goooiko Con Sangre";
      const amount = 1000000;

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

      const payerBalance = await testUtils.getBalance(payer.publicKey);
      const receiverBalance = await testUtils.getBalance(receiver.publicKey);

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

      const transfers = await testUtils.program.account.transfer.all([
        testUtils.TransactionUuidFilter(transferUuid),
      ]);

      assert.equal(transfers.length, 1);
      assert.deepEqual(transfers[0].account.events[1].eventType, {
        transfer: {},
      });

      assert.equal(
        await testUtils.getBalance(payer.publicKey),
        payerBalance - amount
      );
      assert.equal(
        await testUtils.getBalance(receiver.publicKey),
        receiverBalance + amount
      );
    });

    it("Can't processed again transfer request", async () => {
      const topic = "Goooiko Con Sangre";
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

      const payerBalance = await testUtils.getBalance(payer.publicKey);
      const receiverBalance = await testUtils.getBalance(receiver.publicKey);

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

      try {
        await testUtils.program.methods
          .cancelTransferRequest(transferUuid)
          .accounts({
            requester: receiver.publicKey,
            payer: payer.publicKey,
            transfer: transferPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([receiver])
          .rpc();
      } catch (error) {
        assert.equal(error.error.errorCode.code, "ProcessedTransfer");
      }

      try {
        await testUtils.program.methods
          .cancelTransferRequest(transferUuid)
          .accounts({
            requester: receiver.publicKey,
            payer: payer.publicKey,
            transfer: transferPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([receiver])
          .rpc();
      } catch (error) {
        assert.equal(error.error.errorCode.code, "ProcessedTransfer");
      }

      assert.equal(
        await testUtils.getBalance(payer.publicKey),
        payerBalance - amount
      );
      assert.equal(
        await testUtils.getBalance(receiver.publicKey),
        receiverBalance + amount
      );
    });
  });

  describe("CancelTransferRequest", () => {
    it("Cancel transfer request", async () => {
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

      const payerBalance = await testUtils.getBalance(payer.publicKey);
      const receiverBalance = await testUtils.getBalance(receiver.publicKey);

      await testUtils.program.methods
        .cancelTransferRequest(transferUuid)
        .accounts({
          requester: receiver.publicKey,
          payer: payer.publicKey,
          transfer: transferPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([receiver])
        .rpc();

      const transfers = await testUtils.program.account.transfer.all([
        testUtils.TransactionUuidFilter(transferUuid),
      ]);

      assert.equal(transfers.length, 1);
      assert.deepEqual(transfers[0].account.events[1].eventType, {
        cancel: {},
      });

      assert.equal(await testUtils.getBalance(payer.publicKey), payerBalance);
      assert.equal(
        await testUtils.getBalance(receiver.publicKey),
        receiverBalance
      );
    });

    it("Can't process a canceled transfer request", async () => {
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

      const payerBalance = await testUtils.getBalance(payer.publicKey);
      const receiverBalance = await testUtils.getBalance(receiver.publicKey);

      await testUtils.program.methods
        .cancelTransferRequest(transferUuid)
        .accounts({
          requester: receiver.publicKey,
          payer: payer.publicKey,
          transfer: transferPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([receiver])
        .rpc();

      try {
        await testUtils.program.methods
          .cancelTransferRequest(transferUuid)
          .accounts({
            requester: receiver.publicKey,
            payer: payer.publicKey,
            transfer: transferPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([receiver])
          .rpc();
      } catch (error) {
        assert.equal(error.error.errorCode.code, "CanceledTransfer");
      }

      try {
        await testUtils.program.methods
          .cancelTransferRequest(transferUuid)
          .accounts({
            requester: receiver.publicKey,
            payer: payer.publicKey,
            transfer: transferPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([receiver])
          .rpc();
      } catch (error) {
        assert.equal(error.error.errorCode.code, "CanceledTransfer");
      }

      assert.equal(await testUtils.getBalance(payer.publicKey), payerBalance);
      assert.equal(
        await testUtils.getBalance(receiver.publicKey),
        receiverBalance
      );
    });
  });
});
