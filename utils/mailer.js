require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FRONT_URL = process.env.FRONT_URL || 'http://127.0.0.1';

async function sendResetEmail(to, token) {
  const resetLink = `${FRONT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"築豆咖啡" <${process.env.SMTP_USER}>`,
    to,
    subject: '築豆咖啡重設密碼通知',
    html: `
            <p>親愛的築豆咖啡會員您好：</p>
            <p>請點擊以下連結重設您的密碼（30分鐘內有效）：</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>若非本人操作，請忽略此信</p>
        `,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendResetEmail };
