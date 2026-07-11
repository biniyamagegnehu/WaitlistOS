export const getInvitationTemplate = (
  waitlistName: string,
  position: number,
) => {
  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
      <h2>You're In!</h2>
      <p>Congratulations!</p>
      <p>Your waitlist position has reached the access stage.</p>
      <p>You can now access the product.</p>
      <p><strong>Waitlist:</strong> ${waitlistName}</p>
      <p><strong>Your Position:</strong> #${position}</p>
      <p>Thank you for being part of our community!</p>
    </div>
  `;
};
