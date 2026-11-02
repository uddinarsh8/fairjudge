const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
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
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error(
      "Resend email settings are incomplete. Set RESEND_API_KEY and MAIL_FROM."
    );
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);

  let response;

  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Your FairJudge judge account",
        text:
          "Hello " +
          name +
          ",\n\nAn organizer created a FairJudge judge account for you.\n\nLogin email: " +
          email +
          "\nTemporary password: " +
          password +
          "\n\nSign in at the FairJudge login page.",
        html:
          "<p>Hello " +
          safeName +
          ",</p><p>An organizer created a FairJudge judge account for you.</p><p><strong>Login email:</strong> " +
          safeEmail +
          "<br/><strong>Temporary password:</strong> " +
          safePassword +
          "</p><p>Sign in at the FairJudge login page.</p>",
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new Error(
      "Could not reach Resend: " +
        (error && error.message ? error.message : "Unknown network error")
    );
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      result && typeof result.message === "string"
        ? result.message
        : "HTTP " + response.status;

    throw new Error("Resend email request failed: " + detail);
  }
};

module.exports = { sendJudgeCredentials };