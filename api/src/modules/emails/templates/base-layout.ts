/**
 * Base HTML email layout shared by all transactional emails.
 * Renders a clean, branded wrapper around any content block.
 */
export function baseLayout(content: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>WaitlistOS</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
    .body { padding: 40px; color: #374151; }
    .body h2 { margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #111827; }
    .body p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #6b7280; }
    .btn { display: inline-block; margin: 8px 0 24px; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .code-box { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 24px; text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #111827; margin: 16px 0 24px; font-family: monospace; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .token-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; word-break: break-all; font-size: 12px; color: #6b7280; font-family: monospace; margin: 8px 0 24px; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 40px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .footer a { color: #6366f1; text-decoration: none; }
    .alert { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px 16px; margin: 16px 0 24px; font-size: 13px; color: #92400e; }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="header">
      <h1>WaitlistOS</h1>
      <p>Transactional Email</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent by WaitlistOS. If you did not request this, please ignore it.<br/>
      &copy; ${new Date().getFullYear()} WaitlistOS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
