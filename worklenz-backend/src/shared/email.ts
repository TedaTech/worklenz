import {Validator} from "jsonschema";
import {QueryResult} from "pg";
import {log_error, isValidateEmail} from "./utils";
import emailRequestSchema from "../json_schemas/email-request-schema";
import db from "../config/db";
import nodemailer from "nodemailer";
import {SESv2Client, SendEmailCommand} from "@aws-sdk/client-sesv2";

function getEmailProvider(): string {
  if (process.env.EMAIL_PROVIDER) {
    return process.env.EMAIL_PROVIDER;
  }
  if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return "ses";
  }
  return "smtp";
}

const EMAIL_PROVIDER = getEmailProvider();

function createTransporter() {
  if (EMAIL_PROVIDER === "ses") {
    const sesClient = new SESv2Client({
      region: process.env.AWS_REGION
    });
    return nodemailer.createTransport({
      SES: {sesClient, SendEmailCommand}
    });
  } else {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
}

const transporter = createTransporter();

export interface IEmail {
  to?: string[];
  subject: string;
  html: string;
}

export class EmailRequest implements IEmail {
  public readonly html: string;
  public readonly subject: string;
  public readonly to: string[];

  constructor(toEmails: string[], subject: string, content: string) {
    this.to = toEmails;
    this.subject = subject;
    this.html = content;
  }
}

function isValidMailBody(body: IEmail) {
  const validator = new Validator();
  return validator.validate(body, emailRequestSchema).valid;
}

async function removeMails(query: string, emails: string[]) {
  const result: QueryResult<{ email: string; }> = await db.query(query, []);
  const bouncedEmails = result.rows.map(e => e.email);
  for (let i = emails.length - 1; i >= 0; i--) {
    const email = emails[i];
    if (bouncedEmails.includes(email)) {
      emails.splice(i, 1);
    }
  }
}

async function filterSpamEmails(emails: string[]): Promise<void> {
  await removeMails("SELECT email FROM spam_emails ORDER BY email;", emails);
}

async function filterBouncedEmails(emails: string[]): Promise<void> {
  await removeMails("SELECT email FROM bounced_emails ORDER BY email;", emails);
}

export async function sendEmail(email: IEmail): Promise<string | null> {
  try {
    const options = {...email} as IEmail;
    options.to = Array.isArray(options.to) ? Array.from(new Set(options.to)) : [];

    // Filter out empty, null, undefined, and invalid emails
    options.to = options.to
      .filter(email => email && typeof email === 'string' && email.trim().length > 0)
      .map(email => email.trim())
      .filter(email => isValidateEmail(email));

    if (options.to.length) {
      await filterBouncedEmails(options.to);
      await filterSpamEmails(options.to);
    }

    // Double-check that we still have valid emails after filtering
    if (!options.to.length) return null;

    if (!isValidMailBody(options)) return null;

    const fromName = process.env.EMAIL_FROM_NAME || "Worklenz";
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "noreply@worklenz.com";

    const mailOptions = {
      from: `${fromName} <${fromAddress}>`,
      to: options.to.join(", "),
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    return info.messageId || null;
  } catch (e) {
    log_error(e);
  }

  return null;
}
