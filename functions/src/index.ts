import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@project-serum/anchor";
import { IDL } from "../../target/types/shared_ledger";

import * as Base64 from "crypto-js/enc-base64";
import * as sha256 from "crypto-js/sha256";
import { v4 as uuidv4 } from "uuid";
import * as bs58 from "bs58";

import { MailProvider } from "./mailProvider";
import * as serviceAccount from "../serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const firestore = admin.firestore();

const credentialsDB = firestore
  .collection("app")
  .doc("shared_ledger")
  .collection("credentials");

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
      1 + // Type
      4, // Array Length
    bytes: bs58.encode(Buffer.from(encryptedData)),
  },
});

const errorFormat = (message: string) => ({
  error: {
    message,
  },
});

export const verifyTransaction = functions.https.onRequest(
  async (request, response) => {
    const { pubkey, data, uuid } = request.body;
    const hashedEmail = Base64.stringify(sha256(uuid + data));

    if (!pubkey || !data || !uuid) {
      response.status(400).send(errorFormat("Missing valid parameter"));
    }

    const program = new Program(
      IDL,
      "27b22Rj4yVNXM1vEdh65LJ2HsfbmWwBeoncMEFd14bhL",
      getProvider()
    );

    const notifCrendentials = await program.account.contentCredential.all([
      signedTransactionOwnerFilter(new PublicKey(pubkey)),
      signedTransactionDataFilter(hashedEmail),
    ]);

    if (notifCrendentials.length > 0) {
      switch (Object.keys(notifCrendentials[0].account.content)[0]) {
        case "email":
          credentialsDB.doc(notifCrendentials[0].publicKey.toString()).set(
            {
              email: data,
            },
            { merge: true }
          );
          response.sendStatus(201);
          break;
        default:
          response.status(500).send(errorFormat("Credential type not found"));
          break;
      }
    } else {
      response
        .status(500)
        .send(errorFormat("No signed crendential found on chain"));
    }
  }
);

export const sendNotification = functions.https.onRequest(
  async (request, response) => {
    const mailProvider = new MailProvider();

    mailProvider
      .sendWelcomeEmail("marcetienne.dartus@gmail.com", "Markitanki")
      .then(() => response.sendStatus(200))
      .catch((err) => {
        functions.logger.error(err);
        response.sendStatus(500);
      });
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

    const credential = anchor.web3.Keypair.generate();

    const data = "jean.bon@gmail.com";
    const uuid = uuidv4();
    const hashedEmail = Base64.stringify(sha256(uuid + data));

    await program.methods
      .createNotificationCredential({ email: null }, hashedEmail)
      .accounts({
        author: emailOwner.publicKey,
        credential: credential.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([emailOwner, credential])
      .rpc();
    functions.logger.info("4");

    response.send({
      data,
      pubkey: emailOwner.publicKey,
      uuid,
    });
  }
);
