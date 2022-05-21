import * as functions from "firebase-functions";
import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@project-serum/anchor";
import { IDL } from "../../target/types/shared_ledger";
import * as Base64 from "crypto-js/enc-base64";
import * as sha256 from "crypto-js/sha256";
import * as bs58 from "bs58";
import { v4 as uuidv4 } from "uuid";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

const opts: any = {
  preflightCommitment: "processed",
};

const emailOwner = anchor.web3.Keypair.generate();

const getProvider = () => {
  const network = "http://127.0.0.1:8899";
  const connection = new Connection(network, "processed");

  const provider = new AnchorProvider(connection, new Wallet(emailOwner), opts);
  return provider;
};

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
      1, // Type
    bytes: bs58.encode(Buffer.from(encryptedData)),
  },
});

export const verifyTransaction = functions.https.onRequest(
  async (request, response) => {
    const program = new Program(
      IDL,
      "27b22Rj4yVNXM1vEdh65LJ2HsfbmWwBeoncMEFd14bhL",
      getProvider()
    );
    const { pubkey, data, uuid } = request.body;

    const hashedEmail = Base64.stringify(sha256(uuid + data));
    console.log(pubkey);
    console.log(hashedEmail);

    const notifCrendentials = await program.account.contentCredential.all([
      signedTransactionOwnerFilter(new PublicKey(pubkey)),
      signedTransactionDataFilter(hashedEmail),
    ]);
    functions.logger.info("5");
    // console.log(notifCrendentials);

    // functions.logger.info("Hello logs!", { structuredData: true });
    response.send(notifCrendentials);
  }
);

export const createTransaction = functions.https.onRequest(
  async (request, response) => {
    const program = new Program(
      IDL,
      "27b22Rj4yVNXM1vEdh65LJ2HsfbmWwBeoncMEFd14bhL",
      getProvider()
    );
    const { provider } = program;

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        emailOwner.publicKey,
        1000000000
      ),
      "processed"
    );

    const data = "marcetienne.dartus@gmail.com";
    const uuid = uuidv4();

    const hashedEmail = Base64.stringify(sha256(uuid + data));

    await program.methods
      .createNotificationCredential({ email: null }, hashedEmail)
      .accounts({
        author: emailOwner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([emailOwner])
      .rpc();
    functions.logger.info("4");

    response.send({
      data,
      pubkey: emailOwner.publicKey,
      uuid,
    });
  }
);
