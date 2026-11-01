const nodemailer = require("nodemailer");

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return entities[character];
});

const sendJudgeCredentials = async ({ name, email, password }) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || user;

  if (!host || !user || !pass || !from || !Number.isInteger(port)) {
    throw new Error("SMTP settings are incomplete");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);

  await transporter.sendMail({
    from,
    to: email,
    subject: "Your FairJudge judge account",
    text: `Hello ${name},\n\nAn organizer created a FairJudge judge account for you.\n\nLogin email: ${email}\nTemporary password: ${password}\n\nSign in at the FairJudge login page.`,
    html: `<p>Hello ${safeName},</p><p>An organizer created a FairJudge judge account for you.</p><p><strong>Login email:</strong> ${safeEmail}<br/><strong>Temporary password:</strong> ${safePassword}</p><p>Sign in at the FairJudge login page.</p>`,
  });
};

module.exports = { sendJudgeCredentials };
