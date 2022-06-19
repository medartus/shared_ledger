import functions from 'firebase-functions';
import { createTransport, Transporter } from 'nodemailer';
import Mail = require('nodemailer/lib/mailer');
import SMTPTransport = require('nodemailer/lib/smtp-transport');
import { readFileSync } from 'fs';
import juice from 'juice';

const emailAddress = `Shared Ledger <${functions.config().email.address}>`;

const getEmailTemplate = (
  templateName: string,
  context: { [key: string]: string }
) => {
  let html = readFileSync(`./emailTemplates/${templateName}.html`, 'utf8');

  Object.keys(context).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, context[key]);
  });

  return juice(html);
};

const createMailOptions = (
  template: string,
  params: { [key: string]: string },
  email: string,
  subject: string
) => {
  const html = getEmailTemplate(template, params);
  return {
    from: emailAddress,
    to: email,
    subject,
    html,
    attachments: [
      {
        path: './emailTemplates/images/transaction-request.png',
        cid: 'transaction-request',
      },
    ],
  };
};

class MailProvider {
  transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.transporter = createTransport({
      service: 'gmail',
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

  sendTransactionRequest(
    email: string,
    amount: string,
    topic: string,
    transactionUrl: string
  ) {
    return new Promise((resolve, reject) => {
      const mailOptions = createMailOptions(
        'transaction-creation',
        {
          amount,
          topic,
          transactionUrl,
          contactEmail: functions.config().email.address,
        },
        email,
        `Request transfer of ${amount} SOL`
      );
      this.sendEmail(mailOptions)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }
}

export default MailProvider;
