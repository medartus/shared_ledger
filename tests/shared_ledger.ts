import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SharedLedger } from "../target/types/shared_ledger";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("anchor-escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SharedLedger as Program<SharedLedger>;
  const { provider } = program;

  const payer = anchor.web3.Keypair.generate();
  const receiver = anchor.web3.Keypair.generate();

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

    console.log(await provider.connection.getBalance(payer.publicKey));
    console.log(await provider.connection.getBalance(receiver.publicKey));
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
});
