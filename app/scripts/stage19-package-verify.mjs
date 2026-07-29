import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { extractFile, getRawHeader, listPackage } from "@electron/asar";
import YAML from "yaml";

export const RELEASE_VERSION = "1.0.0-rc1";
export const WINDOWS_NUMERIC_VERSION = "1.0.0.1";
export const WINDOWS_PRODUCT_VERSION = "1.0.0.0";
export const INSTALLER_NAME = `BlackSkies-Setup-${RELEASE_VERSION}.exe`;
export const EXPECTED_ASAR_PATHS = [
  "/dist/index.html",
  "/dist-electron/main/main.js",
  "/dist-electron/main/stage19Preload.js",
  "/package.json"
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(appDir, "..");
const forbiddenFragments = [
  "/sample_project/",
  "/services/",
  "/requirements",
  "/sitecustomize",
  "/proj_esther_estate/",
  "/esther_estate/",
  "/truth_receipts/",
  "/ci_artifacts/",
  "/build/runtime_truth/",
  ".map"
];

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizedArchivePath(value) {
  const normalized = value.replaceAll("\\", "/").toLowerCase();
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function findForbiddenPackagePaths(paths) {
  return paths.filter((candidate) => {
    const normalized = normalizedArchivePath(candidate);
    return (
      forbiddenFragments.some((fragment) => normalized.includes(fragment)) ||
      /^\/(?:tests?|fixtures?|docs?)(?:\/|$)/u.test(normalized) ||
      /\.(?:py|pyc|pyo)$/u.test(normalized) ||
      /(?:^|\/)\.env(?:[./]|$)/u.test(normalized) ||
      normalized.includes("portable")
    );
  });
}

export function readIcoSizes(buffer) {
  invariant(buffer.length >= 6, "The Windows icon is truncated.");
  invariant(buffer.readUInt16LE(0) === 0, "The Windows icon has an invalid reserved field.");
  invariant(buffer.readUInt16LE(2) === 1, "The Windows icon is not an ICO resource.");
  const count = buffer.readUInt16LE(4);
  invariant(buffer.length >= 6 + count * 16, "The Windows icon directory is truncated.");
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    return {
      width: buffer[offset] || 256,
      height: buffer[offset + 1] || 256,
      bitDepth: buffer.readUInt16LE(offset + 6)
    };
  });
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function fileIdentity(filePath) {
  return {
    filename: path.basename(filePath),
    byteLength: statSync(filePath).size,
    sha256: sha256(filePath)
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function getWindowsFileTruth(filePath) {
  if (process.platform !== "win32") {
    return {
      productVersion: null,
      fileVersion: null,
      fileDescription: null,
      signatureStatus: "NotInspectedOnThisPlatform"
    };
  }
  const command = [
    "$file = [System.IO.Path]::GetFullPath($env:BLACK_SKIES_ARTIFACT);",
    "$version = [Diagnostics.FileVersionInfo]::GetVersionInfo($file);",
    "$signature = Get-AuthenticodeSignature -LiteralPath $file;",
    "[ordered]@{ productVersion = $version.ProductVersion; fileVersion = $version.FileVersion; fileDescription = $version.FileDescription; signatureStatus = $signature.Status.ToString() } | ConvertTo-Json -Compress"
  ].join(" ");
  const childEnvironment = { ...process.env, BLACK_SKIES_ARTIFACT: filePath };
  for (const key of Object.keys(childEnvironment)) {
    if (key.toLowerCase() === "psmodulepath") delete childEnvironment[key];
  }
  return JSON.parse(
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], {
      encoding: "utf8",
      env: childEnvironment
    }).trim()
  );
}

export function verifyPreflight() {
  const rootPackage = readJson(path.join(repoRoot, "package.json"));
  const appPackage = readJson(path.join(appDir, "package.json"));
  const builder = YAML.parse(readFileSync(path.join(appDir, "electron-builder.yml"), "utf8"));
  const iconPath = path.join(appDir, "resources", "icon.ico");

  invariant(rootPackage.version === RELEASE_VERSION, "Root manifest version is not 1.0.0-rc1.");
  invariant(appPackage.version === RELEASE_VERSION, "App manifest version is not 1.0.0-rc1.");
  invariant(
    builder.buildVersion === WINDOWS_NUMERIC_VERSION,
    "The Windows numeric version is not the deterministic RC1 encoding 1.0.0.1."
  );
  invariant(builder.extraMetadata?.main === "dist-electron/main/main.js", "Packaged main entry is unexpected.");
  invariant(builder.asar === true, "ASAR packaging must remain enabled.");
  invariant(!builder.extraResources, "extraResources is forbidden for the Stage 19 installer.");
  invariant(!builder.asarUnpack, "ASAR unpack rules are not authorized.");
  invariant(
    JSON.stringify(builder.files) ===
      JSON.stringify(["dist/**", "dist-electron/**", "!**/*.map", "package.json"]),
    "The packaged file allowlist differs from the qualified Stage 19 allowlist."
  );
  const targets = builder.win?.target ?? [];
  invariant(targets.length === 1 && targets[0]?.target === "nsis", "NSIS must be the only Windows target.");
  invariant(
    JSON.stringify(targets[0]?.arch) === JSON.stringify(["x64"]),
    "Windows x64 must be the only installer architecture."
  );
  invariant(builder.win?.icon === "resources/icon.ico", "The canonical Windows icon is not selected.");
  invariant(builder.nsis?.oneClick === false, "The installer must use assisted mode.");
  invariant(builder.nsis?.perMachine === false, "The installer must be per-user.");
  invariant(
    builder.nsis?.differentialPackage === false,
    "NSIS blockmap generation must remain disabled for the single-artifact RC."
  );
  invariant(
    builder.nsis?.allowToChangeInstallationDirectory === true,
    "The assisted installer must allow directory selection."
  );
  invariant(
    builder.nsis?.deleteAppDataOnUninstall === false,
    "Uninstall must retain user data."
  );
  invariant(
    builder.nsis?.artifactName === "BlackSkies-Setup-${version}.exe",
    "The installer filename template is unexpected."
  );
  invariant(existsSync(iconPath), "The canonical Windows icon is missing.");
  const iconSizes = readIcoSizes(readFileSync(iconPath));
  const requiredSizes = [16, 24, 32, 48, 64, 128, 256];
  invariant(
    requiredSizes.every((size) =>
      iconSizes.some((entry) => entry.width === size && entry.height === size)
    ),
    "The Windows icon does not contain every required resolution."
  );

  return {
    version: RELEASE_VERSION,
    windowsNumericVersion: WINDOWS_NUMERIC_VERSION,
    windowsProductVersion: WINDOWS_PRODUCT_VERSION,
    target: "nsis",
    architecture: "x64",
    iconSizes
  };
}

function collectIntegrityRecords(record, prefix = "") {
  const records = [];
  for (const [name, entry] of Object.entries(record.files ?? {})) {
    const entryPath = `${prefix}/${name}`;
    if (entry.files) {
      records.push(...collectIntegrityRecords(entry, entryPath));
    } else {
      records.push({
        path: entryPath,
        algorithm: entry.integrity?.algorithm,
        hash: entry.integrity?.hash
      });
    }
  }
  return records;
}

export function verifyUnpacked(unpackedPath) {
  const executablePath = path.join(unpackedPath, "Black Skies.exe");
  const asarPath = path.join(unpackedPath, "resources", "app.asar");
  invariant(existsSync(executablePath), "The unpacked Black Skies executable is missing.");
  invariant(existsSync(asarPath), "The packaged app.asar is missing.");

  const packagePaths = listPackage(asarPath, { isPack: false });
  const normalized = packagePaths.map(normalizedArchivePath);
  for (const expected of EXPECTED_ASAR_PATHS) {
    invariant(normalized.includes(expected.toLowerCase()), `ASAR is missing ${expected}.`);
  }
  const forbidden = findForbiddenPackagePaths(packagePaths);
  invariant(forbidden.length === 0, `Forbidden ASAR paths found: ${forbidden.slice(0, 10).join(", ")}`);

  const packagedManifest = JSON.parse(extractFile(asarPath, "package.json").toString("utf8"));
  invariant(packagedManifest.version === RELEASE_VERSION, "Packaged manifest version is unexpected.");
  invariant(
    packagedManifest.main === "dist-electron/main/main.js",
    "Packaged manifest main entry is unexpected."
  );

  const integrityRecords = collectIntegrityRecords(getRawHeader(asarPath).header);
  const missingIntegrity = integrityRecords.filter(
    (record) => record.algorithm !== "SHA256" || !record.hash
  );
  invariant(
    integrityRecords.length > 0 && missingIntegrity.length === 0,
    "ASAR integrity metadata is absent or incomplete."
  );

  const executableTruth = getWindowsFileTruth(executablePath);
  invariant(
    executableTruth.fileVersion === WINDOWS_NUMERIC_VERSION,
    `Executable FileVersion is ${executableTruth.fileVersion ?? "missing"}.`
  );
  invariant(
    executableTruth.productVersion === WINDOWS_PRODUCT_VERSION,
    `Executable ProductVersion is ${executableTruth.productVersion ?? "missing"}.`
  );
  invariant(
    executableTruth.fileDescription === "Black Skies",
    `Executable description is ${executableTruth.fileDescription ?? "missing"}.`
  );
  invariant(
    executableTruth.signatureStatus === "NotSigned",
    `Internal RC executable signature status is ${executableTruth.signatureStatus}.`
  );

  return {
    executable: { ...fileIdentity(executablePath), ...executableTruth },
    asar: {
      ...fileIdentity(asarPath),
      entryCount: packagePaths.length,
      integrityRecordCount: integrityRecords.length,
      expectedPaths: EXPECTED_ASAR_PATHS
    },
    forbiddenPathCount: forbidden.length
  };
}

export function verifyInstaller(installerPath) {
  invariant(existsSync(installerPath), "The NSIS installer is missing.");
  invariant(path.basename(installerPath) === INSTALLER_NAME, "The installer filename is unexpected.");
  const releaseFiles = readdirSync(path.dirname(installerPath), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  const forbiddenReleaseFiles = releaseFiles.filter(
    (filename) =>
      filename.toLowerCase().includes("portable") ||
      filename.toLowerCase().endsWith(".blockmap") ||
      (filename.toLowerCase().endsWith(".exe") && filename !== INSTALLER_NAME)
  );
  invariant(
    forbiddenReleaseFiles.length === 0,
    `Unexpected release artifacts found: ${forbiddenReleaseFiles.join(", ")}`
  );
  const installerTruth = getWindowsFileTruth(installerPath);
  invariant(
    installerTruth.productVersion === RELEASE_VERSION,
    `Installer ProductVersion is ${installerTruth.productVersion ?? "missing"}.`
  );
  invariant(
    installerTruth.fileVersion === WINDOWS_NUMERIC_VERSION,
    `Installer FileVersion is ${installerTruth.fileVersion ?? "missing"}.`
  );
  invariant(
    installerTruth.fileDescription === "Electron desktop client for the Black Skies writing toolkit.",
    `Installer description is ${installerTruth.fileDescription ?? "missing"}.`
  );
  invariant(
    installerTruth.signatureStatus === "NotSigned",
    `Internal RC installer signature status is ${installerTruth.signatureStatus}.`
  );
  return { ...fileIdentity(installerPath), ...installerTruth };
}

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function currentCommit() {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();
}

function runCli() {
  const preflight = verifyPreflight();
  const unpackedPath = valueAfter("--unpacked");
  const installerPath = valueAfter("--installer");
  const receiptPath = valueAfter("--receipt");
  const unpacked = unpackedPath ? verifyUnpacked(path.resolve(appDir, unpackedPath)) : null;
  const installer = installerPath ? verifyInstaller(path.resolve(appDir, installerPath)) : null;
  const receipt = {
    schema: "black-skies.stage19.package-receipt.v1",
    qualifiedCommit: currentCommit(),
    version: RELEASE_VERSION,
    windowsNumericVersion: WINDOWS_NUMERIC_VERSION,
    windowsProductVersion: WINDOWS_PRODUCT_VERSION,
    architecture: "x64",
    target: "nsis",
    signaturePolicy: "unsigned-internal-rc",
    signatureStatus: installer?.signatureStatus ?? unpacked?.executable.signatureStatus ?? "NotYetInspected",
    generatedAtUtc: new Date().toISOString(),
    preflight,
    unpacked,
    installer,
    protectedEvidenceUsed: false
  };
  if (receiptPath) {
    invariant(unpacked && installer, "A final receipt requires both unpacked and installer verification.");
    writeFileSync(path.resolve(appDir, receiptPath), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    process.stderr.write(`[stage19-package] FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
