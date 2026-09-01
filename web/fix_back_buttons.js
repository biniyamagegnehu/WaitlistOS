const fs = require('fs');
const path = require('path');

const files = [
  'app/(dashboard)/dashboard/waitlists/[id]/growth/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/open-gates/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/rewards/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/signup-config/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/skip-line/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/streaks/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/teams/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/monetization/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/analytics/audience/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/analytics/funnel/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/analytics/growth-velocity/page.tsx',
  'app/(dashboard)/dashboard/waitlists/[id]/analytics/sources/page.tsx'
];

for (const relPath of files) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Remove the incorrectly placed BackButton
  content = content.replace(/\n\s*<BackButton href=\{routes\.waitlist\(waitlistId\)\} label="Back to waitlist" className="mb-4" \/>/g, '');
  
  // Re-insert it right before <PageHeader
  content = content.replace(/(<PageHeader)/g, `<BackButton href={routes.waitlist(waitlistId)} label="Back to waitlist" className="mb-4" />\n      $1`);
  
  fs.writeFileSync(fullPath, content);
  console.log('Fixed:', relPath);
}
