export const getReengagementEmailTemplate = (
  templateId: number,
  position: number,
  referralLink: string,
): { subject: string; html: string } => {
  let subject = '';
  let body = '';

  switch (templateId) {
    case 1:
      subject = "You're closer than you think";
      body = `You're currently ranked #${position}.<br><br>Invite a few friends today and move up the waitlist faster.`;
      break;
    case 2:
      subject = 'Move up the waitlist';
      body = `Your position has not changed recently.<br><br>Share your referral link and climb the rankings.`;
      break;
    case 3:
      subject = "Don't lose momentum";
      body = `Hundreds of people are competing for early access.<br><br>Share your link and improve your position.`;
      break;
    default:
      subject = "You're closer than you think";
      body = `You're currently ranked #${position}.<br><br>Invite a few friends today and move up the waitlist faster.`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background-color: #f9fafb; border-radius: 8px; padding: 30px; text-align: center; }
    .btn { display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin-top: 20px; }
    .link { margin-top: 20px; font-size: 14px; color: #666; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <h2>${subject}</h2>
    <p>${body}</p>
    <a href="${referralLink}" class="btn">Share your link</a>
    <p class="link">Or copy and paste this link:<br><a href="${referralLink}">${referralLink}</a></p>
  </div>
</body>
</html>
  `;

  return { subject, html };
};
