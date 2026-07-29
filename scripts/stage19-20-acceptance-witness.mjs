import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);

export const stage19Candidate = Object.freeze({
  sourceCommit: "85c1524d486cf42d93fa057e3e8c00376071e8fb",
  installerFilename: "BlackSkies-Setup-1.0.0-rc1.exe",
  installerByteLength: 89318050,
  installerSha256:
    "3f59db2f17566a99a269968cd9dba7785646cc7652f4948cb99dc4d1c163a0e0",
  installedExecutableSha256:
    "4ac995b39fb917f7f1d4b7afa8d2bf148f6caf60bc66e4899b3e20edafc04e59",
  installedAsarSha256:
    "2d1343640a53882d4a26589b526973886e899fd3dbabfc4625b8cd34396c3e4b",
  version: "1.0.0-rc1",
  fileVersion: "1.0.0.1",
  executableProductVersion: "1.0.0.0",
  signatureStatus: "NotSigned"
});

function normalize(value) {
  return String(value ?? "").replaceAll("\\", "/").toLowerCase();
}

function samePath(left, right) {
  return normalize(path.resolve(left)) === normalize(path.resolve(right));
}

export function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export function validateCandidateFacts(facts) {
  const errors = [];
  const expected = stage19Candidate;
  const checks = [
    ["installer filename", facts.filename, expected.installerFilename],
    ["installer byte length", facts.byteLength, expected.installerByteLength],
    ["installer SHA-256", facts.sha256, expected.installerSha256],
    ["signature status", facts.signatureStatus, expected.signatureStatus],
    ["receipt source commit", facts.receipt?.qualifiedCommit, expected.sourceCommit],
    ["receipt version", facts.receipt?.version, expected.version],
    ["receipt architecture", facts.receipt?.architecture, "x64"],
    ["receipt target", facts.receipt?.target, "nsis"],
    [
      "receipt installer filename",
      facts.receipt?.installer?.filename,
      expected.installerFilename
    ],
    [
      "receipt installer byte length",
      facts.receipt?.installer?.byteLength,
      expected.installerByteLength
    ],
    [
      "receipt installer SHA-256",
      facts.receipt?.installer?.sha256,
      expected.installerSha256
    ],
    [
      "receipt signature status",
      facts.receipt?.installer?.signatureStatus,
      expected.signatureStatus
    ],
    ["receipt protected evidence", facts.receipt?.protectedEvidenceUsed, false],
    ["receipt installed lifecycle", facts.receipt?.installedLifecycle?.status, "passed"]
  ];
  for (const [label, actual, wanted] of checks) {
    if (actual !== wanted) {
      errors.push(`${label} differed: expected ${wanted}, received ${actual}.`);
    }
  }
  return errors;
}

export function validateRegistrationFacts(entries, expectedUninstaller = null) {
  const errors = [];
  if (entries.length !== 1) {
    errors.push(`Expected one Black Skies registration; found ${entries.length}.`);
    return errors;
  }
  const entry = entries[0];
  if (entry.scope !== "HKCU") {
    errors.push(`Registration scope was ${entry.scope}; expected HKCU.`);
  }
  if (entry.displayName !== "Black Skies 1.0.0-rc1") {
    errors.push(`Registration display name differed: ${entry.displayName}.`);
  }
  if (entry.displayVersion !== stage19Candidate.version) {
    errors.push(`Registration version differed: ${entry.displayVersion}.`);
  }
  if (
    expectedUninstaller &&
    !samePath(String(entry.uninstallString ?? "").replace(/\s+\/currentuser\s*$/iu, "").replaceAll('"', ""), expectedUninstaller)
  ) {
    errors.push("Registration uninstaller did not target the selected installation.");
  }
  return errors;
}

export function validateShortcutFacts(shortcuts, installedExecutable, installDirectory) {
  const errors = [];
  if (shortcuts.length !== 2) {
    errors.push(`Expected two Black Skies shortcuts; found ${shortcuts.length}.`);
  }
  for (const shortcut of shortcuts) {
    if (!samePath(shortcut.targetPath, installedExecutable)) {
      errors.push(`Shortcut target escaped the selected installation: ${shortcut.path}.`);
    }
    if (String(shortcut.arguments ?? "").trim()) {
      errors.push(`Shortcut carried unexpected arguments: ${shortcut.path}.`);
    }
    if (
      String(shortcut.workingDirectory ?? "").trim() &&
      !samePath(shortcut.workingDirectory, installDirectory)
    ) {
      errors.push(`Shortcut working directory escaped the installation: ${shortcut.path}.`);
    }
    const iconPath = String(shortcut.iconLocation ?? "")
      .split(",")[0]
      .replaceAll('"', "")
      .trim();
    if (iconPath && !samePath(iconPath, installedExecutable)) {
      errors.push(`Shortcut icon escaped the selected executable: ${shortcut.path}.`);
    }
  }
  return errors;
}

export function validateInstalledFacts(facts) {
  const errors = [];
  const expected = stage19Candidate;
  const checks = [
    ["installed executable SHA-256", facts.executableSha256, expected.installedExecutableSha256],
    ["installed ASAR SHA-256", facts.asarSha256, expected.installedAsarSha256],
    ["installed signature status", facts.signatureStatus, expected.signatureStatus],
    ["installed file version", facts.fileVersion, expected.fileVersion],
    [
      "installed product version",
      facts.productVersion,
      expected.executableProductVersion
    ]
  ];
  for (const [label, actual, wanted] of checks) {
    if (actual !== wanted) {
      errors.push(`${label} differed: expected ${wanted}, received ${actual}.`);
    }
  }
  return errors;
}

export function validatePathFacts(facts) {
  return facts
    .filter((fact) => fact.reparse)
    .map((fact) => `Path crosses a reparse point: ${fact.path}.`);
}

export function validatePreservation(expected, actual) {
  const errors = [];
  const expectedMap = new Map(expected.map((entry) => [normalize(entry.path), entry]));
  const actualMap = new Map(actual.map((entry) => [normalize(entry.path), entry]));
  if (expectedMap.size !== actualMap.size) {
    errors.push(
      `External manifest entry count differed: expected ${expectedMap.size}, received ${actualMap.size}.`
    );
  }
  for (const [key, entry] of expectedMap) {
    const found = actualMap.get(key);
    if (!found) {
      errors.push(`External file is missing: ${entry.path}.`);
    } else if (
      found.byteLength !== entry.byteLength ||
      found.sha256 !== entry.sha256
    ) {
      errors.push(`External file bytes changed: ${entry.path}.`);
    }
  }
  return errors;
}

export function fileManifest(rootPath) {
  const root = path.resolve(rootPath);
  if (!existsSync(root)) return [];
  const visit = (directory) =>
    readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name))
      .flatMap((entry) => {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) return visit(absolute);
        if (!entry.isFile()) {
          throw new Error(`Unexpected external-data entry: ${absolute}.`);
        }
        return [{
          path: path.relative(root, absolute).replaceAll("\\", "/"),
          byteLength: statSync(absolute).size,
          sha256: sha256File(absolute)
        }];
      });
  return visit(root);
}

function pathFacts(targetPath) {
  const resolved = path.resolve(targetPath);
  const segments = [];
  let cursor = resolved;
  while (true) {
    if (existsSync(cursor)) {
      segments.push({
        path: cursor,
        reparse: lstatSync(cursor).isSymbolicLink()
      });
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return segments.reverse();
}

function assertNoReparse(targetPath) {
  const errors = validatePathFacts(pathFacts(targetPath));
  if (errors.length) throw new Error(errors.join("\n"));
}

function powershell(script, environment = {}) {
  const childEnvironment = { ...process.env, ...environment };
  for (const key of Object.keys(childEnvironment)) {
    if (key.toLowerCase() === "psmodulepath") delete childEnvironment[key];
  }
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { encoding: "utf8", env: childEnvironment }
  ).trim();
  return output ? JSON.parse(output) : null;
}

function fileTruth(filePath) {
  return powershell(
    [
      "$file = [System.IO.Path]::GetFullPath($env:BS_FILE);",
      "$version = [Diagnostics.FileVersionInfo]::GetVersionInfo($file);",
      "$signature = Get-AuthenticodeSignature -LiteralPath $file;",
      "[ordered]@{",
      "productVersion = $version.ProductVersion;",
      "fileVersion = $version.FileVersion;",
      "fileDescription = $version.FileDescription;",
      "signatureStatus = $signature.Status.ToString()",
      "} | ConvertTo-Json -Compress"
    ].join(" "),
    { BS_FILE: filePath }
  );
}

function registrationFacts() {
  return powershell(
    [
      "$entries = @();",
      "$roots = @(",
      "[pscustomobject]@{ Scope = 'HKCU'; Path = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall' },",
      "[pscustomobject]@{ Scope = 'HKLM'; Path = 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall' }",
      ");",
      "foreach ($root in $roots) {",
      "if (-not (Test-Path -LiteralPath $root.Path)) { continue };",
      "foreach ($item in Get-ChildItem -LiteralPath $root.Path) {",
      "$value = Get-ItemProperty -LiteralPath $item.PSPath;",
      "if ([string]$value.DisplayName -like 'Black Skies*') {",
      "$entries += [pscustomobject]@{",
      "scope = $root.Scope;",
      "path = $item.PSPath;",
      "displayName = [string]$value.DisplayName;",
      "displayVersion = [string]$value.DisplayVersion;",
      "uninstallString = [string]$value.UninstallString",
      "}",
      "}",
      "}",
      "};",
      "[ordered]@{ entries = @($entries) } | ConvertTo-Json -Depth 5 -Compress"
    ].join(" ")
  ).entries;
}

function shortcutFacts() {
  return powershell(
    [
      "$shell = New-Object -ComObject WScript.Shell;",
      "$paths = @(",
      "(Join-Path ([Environment]::GetFolderPath('Desktop')) 'Black Skies.lnk'),",
      "(Join-Path ([Environment]::GetFolderPath('Programs')) 'Black Skies.lnk')",
      ");",
      "$entries = @();",
      "foreach ($path in $paths) {",
      "if (Test-Path -LiteralPath $path -PathType Leaf) {",
      "$shortcut = $shell.CreateShortcut($path);",
      "$entries += [pscustomobject]@{",
      "path = $path;",
      "targetPath = $shortcut.TargetPath;",
      "arguments = $shortcut.Arguments;",
      "workingDirectory = $shortcut.WorkingDirectory;",
      "iconLocation = $shortcut.IconLocation",
      "}",
      "}",
      "};",
      "[ordered]@{ entries = @($entries); expectedPaths = $paths } | ConvertTo-Json -Depth 5 -Compress"
    ].join(" ")
  );
}

function processFacts(executablePath) {
  return powershell(
    [
      "$target = [System.IO.Path]::GetFullPath($env:BS_EXECUTABLE);",
      "$rows = @(Get-CimInstance Win32_Process | ForEach-Object {",
      "[pscustomobject]@{",
      "pid = [int]$_.ProcessId;",
      "parentPid = [int]$_.ParentProcessId;",
      "name = [string]$_.Name;",
      "executablePath = [string]$_.ExecutablePath;",
      "createdAt = if ($_.CreationDate) { $_.CreationDate.ToUniversalTime().ToString('o') } else { $null }",
      "}",
      "});",
      "$matching = @($rows | Where-Object { $_.ExecutablePath -and ([System.IO.Path]::GetFullPath($_.ExecutablePath) -eq $target) });",
      "$matchingIds = @($matching | ForEach-Object { $_.pid });",
      "$roots = @($matching | Where-Object { $matchingIds -notcontains $_.parentPid });",
      "$descendants = @();",
      "foreach ($root in $roots) {",
      "$queue = New-Object System.Collections.Generic.Queue[int];",
      "$queue.Enqueue($root.pid);",
      "$rootTime = if ($root.createdAt) { [DateTime]::Parse($root.createdAt).ToUniversalTime() } else { [DateTime]::MinValue };",
      "while ($queue.Count -gt 0) {",
      "$parent = $queue.Dequeue();",
      "foreach ($row in $rows) {",
      "$rowTime = if ($row.createdAt) { [DateTime]::Parse($row.createdAt).ToUniversalTime() } else { [DateTime]::MinValue };",
      "if ($row.parentPid -eq $parent -and $rowTime -ge $rootTime) {",
      "$descendants += $row;",
      "$queue.Enqueue($row.pid)",
      "}",
      "}",
      "}",
      "};",
      "$forbidden = @($descendants | Where-Object { $_.name -match '^(node|python|python3)(\\.exe)?$' });",
      "[ordered]@{ roots = @($roots); descendants = @($descendants); forbidden = @($forbidden) } | ConvertTo-Json -Depth 7 -Compress"
    ].join(" "),
    { BS_EXECUTABLE: executablePath }
  );
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      options[argument.slice(2)] = true;
    } else {
      options[argument.slice(2)] = value;
      index += 1;
    }
  }
  return options;
}

function required(options, name) {
  const value = options[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing --${name}.`);
  }
  return path.resolve(value);
}

function writeEvidence(acceptanceRoot, name, evidence) {
  const evidenceDirectory = path.join(acceptanceRoot, "Evidence");
  mkdirSync(evidenceDirectory, { recursive: true });
  const evidencePath = path.join(evidenceDirectory, `${name}.json`);
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  return evidencePath;
}

function readPreflight(acceptanceRoot) {
  return JSON.parse(
    readFileSync(path.join(acceptanceRoot, "Evidence", "preflight.json"), "utf8")
  );
}

function candidateFacts(installerPath, receiptPath) {
  if (!existsSync(installerPath) || !existsSync(receiptPath)) {
    throw new Error("The installer or qualification receipt is missing.");
  }
  const truth = fileTruth(installerPath);
  return {
    filename: path.basename(installerPath),
    byteLength: statSync(installerPath).size,
    sha256: sha256File(installerPath),
    signatureStatus: truth.signatureStatus,
    receipt: JSON.parse(readFileSync(receiptPath, "utf8"))
  };
}

function ensureNoErrors(label, errors) {
  if (errors.length) {
    throw new Error(`${label}\n${errors.join("\n")}`);
  }
}

function baselineFacts(installDirectory, userDataDirectory) {
  const shortcut = shortcutFacts();
  return {
    registrations: registrationFacts(),
    shortcuts: shortcut.entries,
    expectedShortcutPaths: shortcut.expectedPaths,
    installDirectoryExists: existsSync(installDirectory),
    userDataDirectory,
    userDataDirectoryExists: existsSync(userDataDirectory)
  };
}

function baselineErrors(baseline) {
  const errors = [];
  if (baseline.registrations.length) {
    errors.push(`Found ${baseline.registrations.length} existing Black Skies registration(s).`);
  }
  if (baseline.shortcuts.length) {
    errors.push(`Found ${baseline.shortcuts.length} existing Black Skies shortcut(s).`);
  }
  if (baseline.installDirectoryExists) {
    errors.push("The selected installation directory already exists.");
  }
  if (baseline.userDataDirectoryExists) {
    errors.push(`Existing Black Skies user data requires review: ${baseline.userDataDirectory}.`);
  }
  return errors;
}

function copyExact(sourcePath, destinationPath) {
  if (existsSync(destinationPath)) {
    throw new Error(`Refusing to replace an existing acceptance artifact: ${destinationPath}.`);
  }
  copyFileSync(sourcePath, destinationPath);
}

function runPreflight(options) {
  const installerSource = required(options, "installer");
  const receiptSource = required(options, "receipt");
  const acceptanceRoot = required(options, "acceptance-root");
  const installDirectory = required(options, "install-dir");
  const userDataDirectory = options["user-data-dir"]
    ? path.resolve(options["user-data-dir"])
    : path.join(process.env.APPDATA ?? "", "Black Skies");

  for (const checkedPath of [
    installerSource,
    receiptSource,
    acceptanceRoot,
    installDirectory,
    userDataDirectory
  ]) {
    assertNoReparse(checkedPath);
  }
  if (existsSync(acceptanceRoot) && readdirSync(acceptanceRoot).length > 0) {
    throw new Error(`The acceptance root is not empty: ${acceptanceRoot}.`);
  }

  const sourceFacts = candidateFacts(installerSource, receiptSource);
  ensureNoErrors("Candidate identity failed.", validateCandidateFacts(sourceFacts));
  const baseline = baselineFacts(installDirectory, userDataDirectory);
  ensureNoErrors("Machine baseline is not clean.", baselineErrors(baseline));

  const artifactDirectory = path.join(acceptanceRoot, "Artifact");
  const externalDataDirectory = path.join(acceptanceRoot, "ExternalData");
  mkdirSync(artifactDirectory, { recursive: true });
  mkdirSync(externalDataDirectory, { recursive: true });
  const installerPath = path.join(artifactDirectory, stage19Candidate.installerFilename);
  const receiptPath = path.join(artifactDirectory, "stage19-package-receipt.json");
  copyExact(installerSource, installerPath);
  copyExact(receiptSource, receiptPath);

  const copiedFacts = candidateFacts(installerPath, receiptPath);
  ensureNoErrors("Copied candidate identity failed.", validateCandidateFacts(copiedFacts));

  const installParent = path.dirname(installDirectory);
  assertNoReparse(installParent);
  mkdirSync(installParent, { recursive: true });
  const sentinelPath = path.join(installParent, "stage19-20-unrelated-sentinel.txt");
  if (existsSync(sentinelPath)) {
    throw new Error(`The adjacent sentinel already exists: ${sentinelPath}.`);
  }
  writeFileSync(
    sentinelPath,
    "BLACK_SKIES_STAGE19_20_UNRELATED_SENTINEL_V1\n",
    "utf8"
  );

  const evidence = {
    schema: "black-skies.stage19-20.preflight.v1",
    status: "ready",
    candidate: {
      sourceCommit: stage19Candidate.sourceCommit,
      installerPath,
      receiptPath,
      byteLength: copiedFacts.byteLength,
      sha256: copiedFacts.sha256,
      signatureStatus: copiedFacts.signatureStatus
    },
    acceptanceRoot,
    externalDataDirectory,
    installDirectory,
    userDataDirectory,
    baseline,
    sentinel: {
      path: sentinelPath,
      byteLength: statSync(sentinelPath).size,
      sha256: sha256File(sentinelPath)
    },
    completedAtUtc: new Date().toISOString()
  };
  const evidencePath = writeEvidence(acceptanceRoot, "preflight", evidence);
  return { ...evidence, evidencePath };
}

function runPreinstall(options) {
  const acceptanceRoot = required(options, "acceptance-root");
  const preflight = readPreflight(acceptanceRoot);
  const facts = candidateFacts(
    preflight.candidate.installerPath,
    preflight.candidate.receiptPath
  );
  ensureNoErrors("Pre-install candidate identity failed.", validateCandidateFacts(facts));
  const evidence = {
    schema: "black-skies.stage19-20.preinstall.v1",
    status: "ready-to-execute",
    installerPath: preflight.candidate.installerPath,
    byteLength: facts.byteLength,
    sha256: facts.sha256,
    signatureStatus: facts.signatureStatus,
    checkedAtUtc: new Date().toISOString()
  };
  return {
    ...evidence,
    evidencePath: writeEvidence(acceptanceRoot, "preinstall", evidence)
  };
}

function installedEvidence(options, phase) {
  const acceptanceRoot = required(options, "acceptance-root");
  const preflight = readPreflight(acceptanceRoot);
  const installDirectory = preflight.installDirectory;
  const executablePath = path.join(installDirectory, "Black Skies.exe");
  const asarPath = path.join(installDirectory, "resources", "app.asar");
  const uninstallerPath = path.join(installDirectory, "Uninstall Black Skies.exe");
  for (const requiredPath of [executablePath, asarPath, uninstallerPath]) {
    if (!existsSync(requiredPath)) throw new Error(`Installed file is missing: ${requiredPath}.`);
    assertNoReparse(requiredPath);
  }
  const candidate = candidateFacts(
    preflight.candidate.installerPath,
    preflight.candidate.receiptPath
  );
  ensureNoErrors("Post-execution installer identity failed.", validateCandidateFacts(candidate));

  const truth = fileTruth(executablePath);
  const facts = {
    executableSha256: sha256File(executablePath),
    asarSha256: sha256File(asarPath),
    signatureStatus: truth.signatureStatus,
    fileVersion: truth.fileVersion,
    productVersion: truth.productVersion
  };
  ensureNoErrors("Installed file identity failed.", validateInstalledFacts(facts));
  const registrations = registrationFacts();
  ensureNoErrors(
    "Installed registration failed.",
    validateRegistrationFacts(registrations, uninstallerPath)
  );
  const shortcut = shortcutFacts();
  ensureNoErrors(
    "Installed shortcuts failed.",
    validateShortcutFacts(shortcut.entries, executablePath, installDirectory)
  );
  const evidence = {
    schema: `black-skies.stage19-20.${phase}.v1`,
    status: "passed",
    installDirectory,
    executablePath,
    asarPath,
    uninstallerPath,
    candidateSha256AfterExecution: candidate.sha256,
    installed: facts,
    registrations,
    shortcuts: shortcut.entries,
    completedAtUtc: new Date().toISOString()
  };
  return {
    ...evidence,
    evidencePath: writeEvidence(acceptanceRoot, phase, evidence)
  };
}

function runningEvidence(options) {
  const acceptanceRoot = required(options, "acceptance-root");
  const preflight = readPreflight(acceptanceRoot);
  const executablePath = path.join(preflight.installDirectory, "Black Skies.exe");
  const facts = processFacts(executablePath);
  if (facts.roots.length !== 1) {
    throw new Error(`Expected one installed Black Skies process root; found ${facts.roots.length}.`);
  }
  if (facts.forbidden.length) {
    throw new Error(
      `Forbidden installed runtime descendants: ${facts.forbidden.map((entry) => entry.name).join(", ")}.`
    );
  }
  const evidence = {
    schema: "black-skies.stage19-20.running.v1",
    status: "passed",
    executablePath,
    rootProcessCount: facts.roots.length,
    descendantCount: facts.descendants.length,
    forbiddenRuntimeProcessCount: facts.forbidden.length,
    roots: facts.roots,
    completedAtUtc: new Date().toISOString()
  };
  return {
    ...evidence,
    evidencePath: writeEvidence(acceptanceRoot, "running", evidence)
  };
}

function snapshotEvidence(options) {
  const acceptanceRoot = required(options, "acceptance-root");
  const preflight = readPreflight(acceptanceRoot);
  const manifest = fileManifest(preflight.externalDataDirectory);
  if (manifest.length === 0) {
    throw new Error("The external acceptance-data manifest is empty.");
  }
  const sentinel = {
    path: preflight.sentinel.path,
    byteLength: statSync(preflight.sentinel.path).size,
    sha256: sha256File(preflight.sentinel.path)
  };
  ensureNoErrors(
    "The adjacent sentinel changed before uninstall.",
    validatePreservation([preflight.sentinel], [sentinel])
  );
  const evidence = {
    schema: "black-skies.stage19-20.preservation-snapshot.v1",
    status: "captured",
    externalDataDirectory: preflight.externalDataDirectory,
    externalManifest: manifest,
    sentinel,
    completedAtUtc: new Date().toISOString()
  };
  return {
    ...evidence,
    evidencePath: writeEvidence(acceptanceRoot, "preservation-snapshot", evidence)
  };
}

function postUninstallEvidence(options) {
  const acceptanceRoot = required(options, "acceptance-root");
  const preflight = readPreflight(acceptanceRoot);
  const snapshot = JSON.parse(
    readFileSync(
      path.join(acceptanceRoot, "Evidence", "preservation-snapshot.json"),
      "utf8"
    )
  );
  const applicationPaths = [
    path.join(preflight.installDirectory, "Black Skies.exe"),
    path.join(preflight.installDirectory, "Uninstall Black Skies.exe")
  ];
  const remainingApplicationPaths = applicationPaths.filter(existsSync);
  const registrations = registrationFacts();
  const shortcuts = shortcutFacts().entries;
  const errors = [];
  if (remainingApplicationPaths.length) {
    errors.push(`Installed application files remain: ${remainingApplicationPaths.join(", ")}.`);
  }
  if (registrations.length) {
    errors.push(`Black Skies registrations remain: ${registrations.length}.`);
  }
  if (shortcuts.length) {
    errors.push(`Black Skies shortcuts remain: ${shortcuts.length}.`);
  }
  errors.push(
    ...validatePreservation(
      snapshot.externalManifest,
      fileManifest(preflight.externalDataDirectory)
    )
  );
  const currentSentinel = {
    path: preflight.sentinel.path,
    byteLength: existsSync(preflight.sentinel.path)
      ? statSync(preflight.sentinel.path).size
      : -1,
    sha256: existsSync(preflight.sentinel.path)
      ? sha256File(preflight.sentinel.path)
      : null
  };
  errors.push(...validatePreservation([snapshot.sentinel], [currentSentinel]));
  ensureNoErrors("Post-uninstall boundary failed.", errors);

  const evidence = {
    schema: "black-skies.stage19-20.post-uninstall.v1",
    status: "passed",
    applicationRemoved: true,
    registrationRemoved: true,
    shortcutsRemoved: true,
    externalDataPreserved: true,
    adjacentSentinelPreserved: true,
    userDataDirectoryRetained: existsSync(preflight.userDataDirectory),
    userDataContentInspected: false,
    completedAtUtc: new Date().toISOString()
  };
  return {
    ...evidence,
    evidencePath: writeEvidence(acceptanceRoot, "post-uninstall", evidence)
  };
}

export function runWitness(argv = process.argv.slice(2)) {
  if (process.platform !== "win32") {
    throw new Error("The Package 19.20 acceptance witness requires Windows.");
  }
  const options = parseArguments(argv);
  switch (options.phase) {
    case "preflight":
      return runPreflight(options);
    case "preinstall":
      return runPreinstall(options);
    case "installed":
      return installedEvidence(options, "installed");
    case "running":
      return runningEvidence(options);
    case "snapshot":
      return snapshotEvidence(options);
    case "post-uninstall":
      return postUninstallEvidence(options);
    case "reinstalled":
      return installedEvidence(options, "reinstalled");
    default:
      throw new Error(
        "Missing or unsupported --phase. Use preflight, preinstall, installed, running, snapshot, post-uninstall, or reinstalled."
      );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  try {
    const result = runWitness();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.stdout.write("STAGE19_20_ACCEPTANCE_WITNESS_PASS\n");
  } catch (error) {
    process.stderr.write(
      `[stage19-20-witness] ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`
    );
    process.exit(1);
  }
}
