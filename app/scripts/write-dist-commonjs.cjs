#!/usr/bin/env node
const {
  mkdirSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  readFileSync,
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
const yamlSource = join(__dirname, '..', 'node_modules', 'yaml');
const yamlTarget = join(distRoot, 'vendor', 'yaml');
const legacyYamlTarget = join(distRoot, 'node_modules', 'yaml');
const runtimeConfigOutput = join(distRoot, 'shared', 'config', 'runtime.js');

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

if (!existsSync(yamlSource)) {
  throw new Error('The production yaml dependency is missing; packaged runtime config cannot be built.');
}

rmSync(legacyYamlTarget, { recursive: true, force: true });
rmSync(yamlTarget, { recursive: true, force: true });
copyTree(yamlSource, yamlTarget);
copyFileSync(
  join(yamlSource, 'package.json'),
  join(yamlTarget, 'package-metadata.json'),
);

if (!existsSync(runtimeConfigOutput)) {
  throw new Error('The compiled runtime config module is missing.');
}

const runtimeConfigSource = readFileSync(runtimeConfigOutput, 'utf8');
const externalYamlRequire = 'require("yaml")';
if (!runtimeConfigSource.includes(externalYamlRequire)) {
  throw new Error('The compiled runtime config no longer contains the expected yaml import.');
}
writeFileSync(
  runtimeConfigOutput,
  runtimeConfigSource.replace(
    externalYamlRequire,
    'require("../../vendor/yaml/dist/index.js")',
  ),
  'utf8',
);

if (existsSync(distRoot)) {
  rmSync(legacyRoot, { recursive: true, force: true });
  copyTree(distRoot, legacyRoot);
}
