#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    key: process.env.INDEXNOW_KEY || '',
    output: process.env.INDEXNOW_KEY_FILE || path.join(process.cwd(), 'docs', 'indexnow-key.txt')
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if ((token === '--key' || token === '-k') && next) {
      args.key = next;
      i += 1;
    } else if ((token === '--output' || token === '-o') && next) {
      args.output = next;
      i += 1;
    }
  }

  return args;
}

function main() {
  const { key, output } = parseArgs(process.argv);

  if (!key) {
    console.error('Missing INDEXNOW_KEY. Provide it via the environment or --key.');
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${key}\n`, 'utf8');
  console.log(`Wrote IndexNow key file to ${output}`);
}

main();