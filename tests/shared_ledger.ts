import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SharedLedger } from "../target/types/shared_ledger";
import sha256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";

describe("anchor-escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SharedLedger as Program<SharedLedger>;
  const { provider } = program;

  const payer = anchor.web3.Keypair.generate();
  const receiver = anchor.web3.Keypair.generate();
  const emailOwner = anchor.web3.Keypair.generate();

  it("Initialize program state", async () => {
    // Airdropping tokens to a payer.
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 1000000000),
      "processed"
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(receiver.publicKey, 10000000),
      "processed"
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        emailOwner.publicKey,
        1000000000
      ),
      "processed"
    );

    console.log(await provider.connection.getBalance(payer.publicKey));
    console.log(await provider.connection.getBalance(receiver.publicKey));
    console.log(await provider.connection.getBalance(emailOwner.publicKey));
  });

  it("Send money", async () => {
    // Sending money to a receiver.
    const tx = await program.methods
      .transferNativeSol()
      .accounts({
        from: payer.publicKey,
        to: receiver.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    console.log(await provider.connection.getBalance(payer.publicKey));
    console.log(await provider.connection.getBalance(receiver.publicKey));
  });

  it("Configure Email", async () => {
    const email = "marcetienne.dartus@gmail.com";
    const uuid = uuidv4();

    const hashedEmail = Base64.stringify(sha256(uuid + email));

    console.log(
      await provider.connection.getBalance(program.provider.wallet.publicKey)
    );
    const tx = await program.methods
      .createNotificationCredential({ email: null }, hashedEmail)
      .accounts({
        author: emailOwner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([emailOwner])
      .rpc();

    // console.log(await provider.connection.getTransaction(tx));
    const notifCrendentials = await program.account.contentCredential.all();
    console.log(notifCrendentials);
    console.log(await provider.connection.getBalance(emailOwner.publicKey));
    console.log(
      await provider.connection.getBalance(program.provider.wallet.publicKey)
    );
    console.log(
      await program.account.contentCredential.fetch(
        notifCrendentials[0].publicKey
      )
    );
  });
});
