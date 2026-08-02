export const generateReferralMessagesPrompt = (
  productName: string,
  tagline: string,
  description: string,
  rank: number,
  referralLink: string,
) => `You are an expert viral growth marketer.

Generate referral messages optimized for sharing.
Create unique messages for Twitter/X, LinkedIn, and WhatsApp.

Context:
- Product Name: ${productName}
- Tagline: ${tagline}
- Description: ${description}
- Participant Rank: #${rank}
- Referral Link: ${referralLink}

Message Requirements:
- Twitter/X: Short, engaging, social, optimized for sharing. Include the referral link.
- LinkedIn: Professional, business-focused, more detailed. Include the referral link.
- WhatsApp: Conversational, personal, friendly. Include the referral link.

Personalization:
Include the product value proposition, participant rank, and a call to action to help them move up the list or join before launch.
Avoid spammy language.

IMPORTANT: Return ONLY a valid JSON object matching the schema. Do NOT include markdown code blocks (like \`\`\`json) or any other text. Just the raw JSON object.

{
  "twitter": "message here",
  "linkedin": "message here",
  "whatsapp": "message here"
}`;
