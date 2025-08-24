import nodemailer from "nodemailer";

export const sendMail = async (
  subject: string,
  toEmail: string,
  otpText: string
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: toEmail,
    subject: subject,
    text: otpText,
  };

  transporter.sendMail(mailOptions, (e, info) => {
    if (e) {
      throw e;
    } else {
      console.log(`Email Sent - ${JSON.stringify(info, null, 2)}`);
      return true;
    }
  });
};
