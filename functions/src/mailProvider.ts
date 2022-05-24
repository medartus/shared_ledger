import * as functions from "firebase-functions";
import { createTransport, Transporter } from "nodemailer";
import Mail = require("nodemailer/lib/mailer");
import SMTPTransport = require("nodemailer/lib/smtp-transport");
import { readFileSync } from "fs";
import * as juice from "juice";

const emailAddress: string = `Shared Ledger <${
  functions.config().email.address
}>`;

class MailProvider {
  transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.transporter = createTransport({
      service: "gmail",
      auth: {
        user: functions.config().email.address,
        pass: functions.config().email.password,
      },
    });
  }

  sendEmail(mailOptions: Mail.Options) {
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) reject(error);
        else resolve(info);
      });
    });
  }

  getEmailTemplate(templateName: string, context: { [key: string]: string }) {
    let html = readFileSync(`./emailTemplates/${templateName}.html`, "utf8");

    if (context) {
      Object.keys(context).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, context[key]);
      });
    }

    return juice(html);
  }

  createMailOptions(
    template: string,
    params: { [key: string]: string },
    email: string,
    subject: string
  ) {
    const html = this.getEmailTemplate(template, (params = {}));
    return {
      from: emailAddress,
      to: email,
      subject,
      html,
      attachments: [
        {
          path: "./emailTemplates/fmf.png",
          cid: "fmfLogo",
        },
      ],
    };
  }

  //   sendPostConfirmation(data) {
  //     const { userUID, shareCommentary, publisherName, publisherPhoto } = data;
  //     return new Promise(async (resolve, reject) => {
  //       const { email, displayName, photoURL } = await admin
  //         .auth()
  //         .getUser(userUID)
  //         .then((userRecord) => {
  //           return userRecord;
  //         })
  //         .catch((err) => reject(err));
  //       if (email !== undefined) {
  //         const name = publisherName ? publisherName : displayName;
  //         const photo = publisherPhoto ? publisherPhoto : photoURL;
  //         const params = { displayName: name, shareCommentary, photoURL: photo };
  //         const mailOptions = this.createMailOptions(
  //           "postConfirmation",
  //           params,
  //           email,
  //           "FeedMyFlow post confirmation"
  //         );
  //         this.sendEmail(mailOptions)
  //           .then((res) => resolve(res))
  //           .catch((err) => reject(err));
  //       } else {
  //         console.log(`No email for user ${userUID}`);
  //       }
  //     });
  //   }

  sendWelcomeEmail(email: string, displayName: string) {
    return new Promise(async (resolve, reject) => {
      const mailOptions = this.createMailOptions(
        "welcome",
        { displayName },
        email,
        "Weclome on FeedMyFlow !"
      );
      this.sendEmail(mailOptions)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }
}

export { MailProvider };
