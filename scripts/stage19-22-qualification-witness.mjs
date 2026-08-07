import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(modulePath), "..");

export function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function fileIdentity(filePath) {
  return { filename: path.basename(filePath), byteLength: statSync(filePath).size, sha256: sha256File(filePath) };
}

function currentCommit() {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
}

export function validateCandidateReceipt(receipt, installer, commit = currentCommit()) {
  const errors = [];
  if (receipt?.schema !== "black-skies.stage19.package-receipt.v1") errors.push("The package receipt schema is not the Stage 19 package receipt schema.");
  if (receipt?.qualifiedCommit !== commit) errors.push(`Receipt SHA differed: expected ${commit}, received ${receipt?.qualifiedCommit ?? "missing"}.`);
  if (receipt?.protectedEvidenceUsed !== false) errors.push("The receipt must declare protectedEvidenceUsed=false.");
  if (receipt?.signatureStatus !== "NotSigned") errors.push(`Receipt signature status differed: ${receipt?.signatureStatus ?? "missing"}.`);
  const receiptInstaller = receipt?.installer;
  for (const key of ["filename", "byteLength", "sha256"]) {
    if (receiptInstaller?.[key] !== installer?.[key]) errors.push(`Installer ${key} differed from the receipt.`);
  }
  if (receiptInstaller?.signatureStatus !== "NotSigned") errors.push("The receipt installer is not explicitly NotSigned.");
  return errors;
}

export function validateInstalledCandidate(receipt, installed) {
  const errors = [];
  const unpacked = receipt?.unpacked;
  if (!unpacked?.executable?.sha256 || !unpacked?.asar?.sha256) {
    errors.push("The package receipt has no verified unpacked executable and ASAR identities.");
    return errors;
  }
  if (installed?.executable?.sha256 !== unpacked.executable.sha256) errors.push("Installed executable SHA-256 differed from the verified unpacked executable.");
  if (installed?.asar?.sha256 !== unpacked.asar.sha256) errors.push("Installed ASAR SHA-256 differed from the verified unpacked ASAR.");
  if (installed?.signatureStatus !== "NotSigned") errors.push("Installed executable is not explicitly NotSigned.");
  return errors;
}

export function validateLifecycleEvidence(evidence, commit = currentCommit()) {
  const errors = [];
  if (evidence?.qualifiedCommit !== commit) errors.push("Lifecycle evidence is not bound to the checked-out candidate SHA.");
  for (const key of ["installedOffline", "representativeWorkloadPassed", "forbiddenRuntimeProcessCount", "uninstallRemovedApplication", "externalDataPreserved", "sameInstallerReinstallPassed"]) {
    if (key === "forbiddenRuntimeProcessCount") {
      if (evidence?.[key] !== 0) errors.push("Lifecycle evidence found a forbidden runtime descendant.");
    } else if (evidence?.[key] !== true) errors.push(`Lifecycle evidence did not prove ${key}.`);
  }
  return errors;
}

export function fileManifest(rootPath) {
  const root = path.resolve(rootPath);
  if (!existsSync(root)) return [];
  const visit = (directory) => readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name)).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return visit(absolute);
    if (!entry.isFile()) throw new Error(`Unexpected external-data entry: ${absolute}.`);
    return [{ path: path.relative(root, absolute).replaceAll("\\", "/"), byteLength: statSync(absolute).size, sha256: sha256File(absolute) }];
  });
  return visit(root);
}

export function validatePreservation(expected, actual) {
  const errors = [];
  const actualByPath = new Map(actual.map((entry) => [entry.path, entry]));
  if (expected.length !== actual.length) errors.push(`External manifest count differed: expected ${expected.length}, received ${actual.length}.`);
  for (const entry of expected) {
    const found = actualByPath.get(entry.path);
    if (!found) errors.push(`External file is missing: ${entry.path}.`);
    else if (found.byteLength !== entry.byteLength || found.sha256 !== entry.sha256) errors.push(`External file changed: ${entry.path}.`);
  }
  return errors;
}

function windowsSignatureStatus(filePath) {
  if (process.platform !== "win32") return "NotInspectedOnThisPlatform";
  const command = ["$signature = Get-AuthenticodeSignature -LiteralPath $env:BLACK_SKIES_ARTIFACT;", "$signature.Status.ToString()"].join(" ");
  const options = { encoding: "utf8", env: { ...process.env, BLACK_SKIES_ARTIFACT: filePath } };
  try {
    return execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], options).trim();
  } catch {
    return execFileSync("pwsh.exe", ["-NoProfile", "-NonInteractive", "-Command", command], options).trim();
  }
}

function required(options, name) {
  const value = options[name];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing --${name}.`);
  return path.resolve(value);
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (!name.startsWith("--")) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}.`);
    options[name.slice(2)] = value;
    index += 1;
  }
  return options;
}

function readJson(filePath, label) {
  if (!existsSync(filePath)) throw new Error(`${label} is missing: ${filePath}.`);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function ensure(label, errors) {
  if (errors.length) throw new Error(`${label}\n${errors.join("\n")}`);
}

export function runWitness(argv = process.argv.slice(2)) {
  if (process.platform !== "win32") throw new Error("The Package 19.22 qualification witness requires Windows.");
  const options = parseArguments(argv);
  const receiptPath = required(options, "receipt");
  const installerPath = required(options, "installer");
  const installDirectory = required(options, "install-dir");
  const externalRoot = required(options, "external-root");
  const lifecyclePath = required(options, "lifecycle-evidence");
  const expectedManifestPath = required(options, "expected-manifest");
  const receipt = readJson(receiptPath, "Package receipt");
  const lifecycle = readJson(lifecyclePath, "Lifecycle evidence");
  const expectedManifest = readJson(expectedManifestPath, "External preservation manifest");
  const installer = fileIdentity(installerPath);
  ensure("Candidate receipt validation failed.", validateCandidateReceipt(receipt, installer));
  ensure("Lifecycle validation failed.", validateLifecycleEvidence(lifecycle));
  const executablePath = path.join(installDirectory, "Black Skies.exe");
  const asarPath = path.join(installDirectory, "resources", "app.asar");
  if (!existsSync(executablePath) || !existsSync(asarPath)) throw new Error("Installed executable or ASAR is missing.");
  const installed = { executable: fileIdentity(executablePath), asar: fileIdentity(asarPath), signatureStatus: windowsSignatureStatus(executablePath) };
  ensure("Installed candidate validation failed.", validateInstalledCandidate(receipt, installed));
  ensure("External-data preservation failed.", validatePreservation(expectedManifest, fileManifest(externalRoot)));
  return { schema: "black-skies.stage19-22.qualification-witness.v1", status: "passed", qualifiedCommit: currentCommit(), installer, installed, lifecycleEvidencePath: lifecyclePath, externalRoot, externalFileCount: expectedManifest.length, protectedEvidenceUsed: false, completedAtUtc: new Date().toISOString() };
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  try {
    const result = runWitness();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\nSTAGE19_22_QUALIFICATION_WITNESS_PASS\n`);
  } catch (error) {
    process.stderr.write(`[stage19-22-witness] ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exit(1);
  }
}
