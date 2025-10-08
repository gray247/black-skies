#!/usr/bin/env node
const {
  mkdirSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  readdirSync,
  rmSync,
} = require('node:fs');
const { join } = require('node:path');

const distRoot = join(__dirname, '..', 'dist-electron');
const legacyRoot = join(__dirname, '..', '..', 'dist-electron');

const packages = [distRoot, join(distRoot, 'main'), join(distRoot, 'shared')];

for (const dir of packages) {
  mkdirSync(dir, { recursive: true });
  const packagePath = join(dir, 'package.json');
  const contents = JSON.stringify({ type: 'commonjs' }, null, 2);
  writeFileSync(packagePath, `${contents}\n`, 'utf8');
}

const mainSource = join(distRoot, 'main', 'main.js');
const mainTarget = join(distRoot, 'main.js');

if (existsSync(mainSource)) {
  copyFileSync(mainSource, mainTarget);
}

function copyTree(source, destination) {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);
    if (entry.isDirectory()) {
      copyTree(sourcePath, destinationPath);
    } else {
      copyFileSync(sourcePath, destinationPath);
    }
  }
}

if (existsSync(distRoot)) {
  rmSync(legacyRoot, { recursive: true, force: true });
  copyTree(distRoot, legacyRoot);
}

