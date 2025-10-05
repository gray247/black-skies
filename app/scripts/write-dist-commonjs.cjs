#!/usr/bin/env node
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const packages = [
  join(__dirname, '..', '..', 'dist-electron'),
  join(__dirname, '..', '..', 'dist-electron', 'main'),
  join(__dirname, '..', '..', 'dist-electron', 'shared'),
];

for (const dir of packages) {
  mkdirSync(dir, { recursive: true });
  const packagePath = join(dir, 'package.json');
  const contents = JSON.stringify({ type: 'commonjs' }, null, 2);
  writeFileSync(packagePath, `${contents}\n`, 'utf8');
}
