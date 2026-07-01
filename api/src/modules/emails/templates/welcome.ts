export const getWelcomeEmailTemplate = (
  waitlist: string,
  position: number,
  referralLink: string,
) => {
  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to ${waitlist}</h2>
      <p>You're in.</p>
      <p>Current Position:<br/><strong>#${position}</strong></p>
      <p>Invite friends to move up the waitlist:</p>
      <p><a href="${referralLink}">${referralLink}</a></p>
    </div>
  `;
};
