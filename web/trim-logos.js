const sharp = require('sharp');
const fs = require('fs');

async function processLogo(theme) {
  const inputPath = `./public/getlist-logo-${theme}.png`;
  const tempPath = `./public/getlist-logo-${theme}-trimmed.png`;

  console.log(`Processing ${inputPath}...`);
  try {
    await sharp(inputPath)
      .trim()
      .toFile(tempPath);
    
    // Replace original
    fs.renameSync(tempPath, inputPath);
    console.log(`Successfully trimmed ${theme} logo!`);
  } catch (err) {
    console.error(`Error processing ${theme} logo:`, err);
  }
}

async function run() {
  await processLogo('light');
  await processLogo('dark');
}

run();
