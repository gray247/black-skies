import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inventoryPath = resolve(repoRoot, 'docs', 'current_authority_inventory.json');
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));
const documents = inventory.documents;

if (!Array.isArray(documents) || documents.length === 0) {
  throw new Error('Current-authority documentation inventory is empty.');
}

const sortedDocuments = [...documents].sort((left, right) => left.localeCompare(right));
if (JSON.stringify(documents) !== JSON.stringify(sortedDocuments)) {
  throw new Error('Current-authority documentation inventory must remain sorted.');
}
if (new Set(documents).size !== documents.length) {
  throw new Error('Current-authority documentation inventory contains a duplicate path.');
}

const package1921Closure = 'docs/product_systems/stage19_package_19_21_closure.md';
const package1922Closure = 'docs/product_systems/stage19_package_19_22_closure.md';
if (documents.includes(package1921Closure) && documents.includes(package1922Closure)) {
  throw new Error('Current-authority inventory cannot contain both Package 19.21 and 19.22 closure receipts.');
}

const missingDocuments = documents.filter((documentPath) => {
  return !existsSync(resolve(repoRoot, documentPath));
});
if (missingDocuments.length > 0) {
  throw new Error(`Current-authority documents are missing:\n${missingDocuments.join('\n')}`);
}

const markdownlint = resolve(repoRoot, 'node_modules', 'markdownlint-cli', 'markdownlint.js');
const lint = spawnSync(
  process.execPath,
  [markdownlint, '--disable', 'MD041', '--', ...documents],
  {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit',
  },
);
if (lint.error) throw lint.error;
if (lint.status !== 0) process.exit(lint.status ?? 1);

const unresolved = [];
const repositoryAbsolutePrefix = /^\/[A-Za-z]:\/(?:Dev\/black-skies\/)?/;
const markdownLink = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;

for (const documentPath of documents) {
  const absoluteDocumentPath = resolve(repoRoot, documentPath);
  const source = readFileSync(absoluteDocumentPath, 'utf8');
  for (const match of source.matchAll(markdownLink)) {
    const rawTarget = match[1]?.trim().replace(/^<|>$/g, '');
    if (
      !rawTarget ||
      rawTarget.startsWith('#') ||
      /^(?:https?:|mailto:)/i.test(rawTarget)
    ) {
      continue;
    }
    const pathOnly = decodeURIComponent(rawTarget.split('#', 1)[0] ?? '');
    if (!pathOnly) continue;

    let targetPath;
    if (repositoryAbsolutePrefix.test(pathOnly.replaceAll('\\', '/'))) {
      const normalized = pathOnly
        .replaceAll('\\', '/')
        .replace(/^\/[A-Za-z]:\/Dev\/black-skies\//i, '')
        .replace(/^\/[A-Za-z]:\//i, '');
      targetPath = resolve(repoRoot, normalized);
    } else {
      targetPath = isAbsolute(pathOnly)
        ? pathOnly
        : resolve(dirname(absoluteDocumentPath), pathOnly);
    }

    const normalizedRoot = `${repoRoot.toLowerCase()}${sep}`;
    const normalizedTarget = targetPath.toLowerCase();
    if (
      !normalizedTarget.startsWith(normalizedRoot) ||
      !existsSync(targetPath)
    ) {
      unresolved.push(`${documentPath}: ${rawTarget}`);
    }
  }
}

if (unresolved.length > 0) {
  throw new Error(`Unresolved current-authority links:\n${unresolved.join('\n')}`);
}

const claimPatterns = [
  /\b(?:is|are)\s+(?:release[- ]ready|production[- ]ready)\b/i,
  /\bpublic V1\b/i,
  /\bPackage `?19\.22`?.{0,80}\b(?:release|release\/tag) boundary\b/i,
  /\bPackage 19\.22 implementation\/release\b/i,
  /\bPackage `?19\.22`?.{0,120}\b(?:explicit |final )?release authorization\b/i,
];
const rejectedClaimSentinels = [
  'Package 19.22 is the final V1.0 closure/release boundary.',
  'Package 19.22 requires Jason\'s explicit release authorization.',
  'Package 19.22 is production-ready.',
  'Package 19.22 is public V1.',
];
for (const sentinel of rejectedClaimSentinels) {
  if (!claimPatterns.some((pattern) => pattern.test(sentinel))) {
    throw new Error(`Stale-claim guard does not reject its required sentinel: ${sentinel}`);
  }
}
const staleClaims = [];
for (const documentPath of documents) {
  const source = readFileSync(resolve(repoRoot, documentPath), 'utf8');
  for (const pattern of claimPatterns) {
    if (pattern.test(source)) {
      staleClaims.push(`${documentPath}: ${pattern}`);
    }
  }
}
if (staleClaims.length > 0) {
  throw new Error(`Stale public-release authority claims:\n${staleClaims.join('\n')}`);
}

console.log(
  `Current-authority documentation verified: ${documents.length} files, local links resolved, no stale public-release claim.`,
);
