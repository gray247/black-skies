import { createHash } from "node:crypto";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const appDir = path.join(repoRoot, "app");
const require = createRequire(import.meta.url);
const allowDirty = process.argv.includes("--allow-dirty");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const unitFiles = [
  "shared/__tests__/manuscriptStructure.test.ts",
  "main/__tests__/manuscriptStructureRepository.test.ts",
  "main/__tests__/manuscriptStructureIpc.test.ts",
  "shared/__tests__/livingOutlineAnchors.test.ts",
  "renderer/__tests__/Stage19WritingSpineApp.test.tsx",
  "renderer/__tests__/companionOrientation.test.ts",
  "renderer/__tests__/Stage19WritingSpineLayout.test.ts",
  "renderer/__tests__/ManuscriptStructureView.test.tsx",
  "renderer/__tests__/manuscriptStructurePerformance.test.tsx",
  "renderer/__tests__/stage19WritingSpineController.test.ts",
  "renderer/__tests__/DraftEditor.test.tsx",
  "renderer/__tests__/splitCommandShellState.test.ts",
  "main/__tests__/splitCommandWindowPlacement.test.ts",
  "main/__tests__/splitCommandSecondaryLaunchHook.test.ts",
  "main/__tests__/splitCommandPreload.test.ts",
  "main/__tests__/splitCommandAuthority.test.ts",
  "main/__tests__/projectSpineRepository.test.ts",
  "main/__tests__/projectSpineRecoveryRepository.test.ts",
  "main/__tests__/projectSpineRecoveryCheckpoints.test.ts",
  "main/__tests__/projectSpineMarkdownExport.test.ts",
  "main/__tests__/projectSpineIpc.test.ts",
  "main/__tests__/optionalServiceStartup.test.ts",
  "main/__tests__/pythonExecutablePolicy.test.ts",
  "main/__tests__/python311LanePolicy.test.ts",
  "main/__tests__/packagedRuntimePolicy.test.ts",
  "main/__tests__/stage19PreloadChannels.test.ts",
  "main/__tests__/stage19PackageVerifier.test.ts",
  "main/__tests__/stage19_22QualificationWitness.test.ts",
  "main/__tests__/stage19InternalBaselineIdentity.test.ts",
  "main/__tests__/runVitestOfflineExitCode.test.ts",
  "main/__tests__/stage19PackagingWorkflowPolicy.test.ts",
  "main/__tests__/stage19NsisCompatibilityPatch.test.ts",
  "main/__tests__/stage19AcceptanceWitness.test.ts",
  "main/__tests__/aiCritiqueQualification.test.ts",
  "main/__tests__/aiCritiqueIpc.test.ts",
  "main/__tests__/aiCritiqueGateway.test.ts",
  "main/__tests__/aiCritiqueCoordinator.test.ts",
  "main/__tests__/aiCritiqueQualificationArtifacts.test.ts",
  "main/__tests__/feedbackNotesRepository.test.ts",
  "main/__tests__/feedbackNotesIpc.test.ts",
  "main/__tests__/contextualProductShellContracts.test.ts",
  "main/__tests__/critiqueReviewIpc.test.ts",
  "main/__tests__/program3SurfacePerformanceProtocol.test.ts",
  "main/__tests__/program3CombinedInstalledQualification.test.ts",
  "main/__tests__/livingOutlineRepository.test.ts",
  "main/__tests__/livingOutlineIpc.test.ts",
  "main/__tests__/runtimeSessionTruthMain.test.ts",
  "main/__tests__/runtimeSessionTruth.test.ts",
  "main/__tests__/truthLaneRuntimeBoundary.test.ts"
];

const electronFiles = [
  "tests/e2e/stage19-project-spine.spec.ts",
  "tests/e2e/stage19-recovery.spec.ts",
  "tests/e2e/stage19-command-center-integrity.spec.ts",
  "tests/e2e/stage19-ai-critique.spec.ts",
  "tests/e2e/stage19-gate1-workflows.spec.ts",
  "tests/e2e/stage19-surface-host.spec.ts",
  "tests/e2e/stage19-writing-shell.spec.ts",
  "tests/e2e/stage19-accessibility.spec.ts",
  "tests/e2e/stage19-performance.spec.ts",
  "tests/e2e/stage19-program3-performance.spec.ts",
  "tests/e2e/stage19-program3-presentation.spec.ts",
  "tests/e2e/stage19-program3-visual.spec.ts",
  "tests/e2e/stage19-companion-orientation.spec.ts",
  "tests/e2e/program6-story-intelligence.spec.ts"
];

const electronPreflightFiles = [
  "tests/e2e/stage19-surface-host-preflight.spec.ts"
];

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      PLAYWRIGHT_DISABLE_ANIMATIONS: "1",
      PLAYWRIGHT_RETRIES: "0",
      ...options.env
    },
    encoding: options.capture ? "utf8" : undefined,
    stdio: options.capture ? "pipe" : "inherit",
    shell: process.platform === "win32" && command.toLowerCase().endsWith(".cmd")
  });
}

function fail(message, result) {
  process.stderr.write(`\n[stage19] FAIL: ${message}\n`);
  if (result?.error) {
    process.stderr.write(`${result.error.stack ?? result.error.message}\n`);
  }
  process.exit(result?.status && result.status > 0 ? result.status : 1);
}

function phase(label, command, args, options) {
  const startedAt = Date.now();
  process.stdout.write(`\n[stage19] ${label}\n`);
  const result = run(command, args, options);
  if (result.error || result.status !== 0) {
    fail(`${label} did not pass.`, result);
  }
  process.stdout.write(`[stage19] PASS ${label} (${((Date.now() - startedAt) / 1000).toFixed(1)}s)\n`);
}

function assertWorktreePolicy() {
  const result = run("git", ["status", "--porcelain", "--untracked-files=all"], {
    capture: true
  });
  if (result.error || result.status !== 0) {
    fail("The worktree state could not be inspected.", result);
  }
  const status = result.stdout.trim();
  if (status && !allowDirty) {
    process.stderr.write(`${status}\n`);
    fail("The fixed CI/RC gate requires a clean worktree. Use --allow-dirty only while developing the gate.");
  }
  process.stdout.write(
    `[stage19] worktree=${status ? "DIRTY_DEVELOPMENT_OVERRIDE" : "CLEAN"}\n`
  );
}

function electronCommand(files) {
  // Direct Node launch preserves each title/regex as one argument on Windows.
  const args = [path.join(appDir, "node_modules", "@playwright", "test", "cli.js"),
    "test", "--config", path.join(appDir, "playwright.config.ts"), ...files,
    "--project=electron", "--workers=1", "--reporter=list", "--trace=retain-on-failure"];
  if (process.platform !== "linux" || process.env.DISPLAY) return { command: process.execPath, args };
  const xvfb = run("which", ["xvfb-run"], { capture: true });
  if (xvfb.status !== 0) fail("Linux Electron verification requires xvfb-run.", xvfb);
  return { command: "xvfb-run", args: ["-a", process.execPath, ...args] };
}

export const stabilityRequiredFiles = [...electronFiles,
  'tests/e2e/stage19-writer-foundation.spec.ts', 'tests/e2e/program7-revision.spec.ts',
  'tests/e2e/program7-create-develop.spec.ts', 'tests/e2e/program7-accessibility.spec.ts',
  'tests/e2e/program7-long-form.spec.ts', 'tests/e2e/program7-scale-performance.spec.ts'];

export function validateStabilityManifest(manifest, sourceStatus = '', selectedPhase = 'candidate') {
  const errors = [];
  if (manifest.schema !== 'black-skies.stability-manifest.v1') errors.push('Unsupported stability manifest.');
  for (const file of stabilityRequiredFiles) if (!manifest.electronFiles?.includes(file)) errors.push(`Required native spec omitted: ${file}`);
  if (selectedPhase !== 'baseline' && sourceStatus.trim()) errors.push('Candidate and packaged qualification require a clean committed source; --allow-dirty is development-only.');
  if (!Number.isInteger(manifest.minimumRepetitions) || manifest.minimumRepetitions < 60) errors.push('Candidate repetitions cannot be reduced below sixty.');
  return errors;
}

export function validateStabilityInventories(manifest, unitCases, nativeCases, baselineUnits = [], baselineNative = []) {
  const errors = [];
  if (!unitCases.length || !nativeCases.length) errors.push('The complete unit and native inventories are required.');
  for (const item of unitCases) {
    const allowed = ['pending', 'skipped'].includes(item.status) && manifest.allowedUnitSkips.some(skip => item.file === skip.file && item.title.endsWith(skip.title));
    if (item.status !== 'passed' && !allowed) errors.push(`Offline case did not pass: ${item.file} / ${item.title} (${item.status})`);
  }
  for (const old of baselineUnits) if (!unitCases.some(item => item.file === old.file && item.title === old.title)) errors.push(`Baseline offline case omitted: ${old.title}`);
  for (const item of nativeCases) if (item.expectedStatus !== 'passed' || !item.results.length || item.results.some(result => result.status !== 'passed' || result.retry !== 0)) errors.push(`Native case did not pass without retries: ${item.title}`);
  for (const old of baselineNative) {
    const rename = manifest.caseRenames?.find(rename => path.basename(rename.file) === path.basename(old.file) && old.title.endsWith(rename.from));
    const title = rename ? old.title.slice(0, -rename.from.length) + rename.to : old.title;
    if (!nativeCases.some(item => path.basename(item.file) === path.basename(old.file) && item.title === title)) errors.push(`Baseline native case omitted: ${old.title}`);
  }
  return errors;
}

export function validateStabilityPackageBinding(witness, receipt, head, runtime, hashes) {
  const errors = [];
  if (witness.schema !== 'black-skies.stability-offline-spelling.v1' || witness.qualifiedCommit !== head || receipt.qualifiedCommit !== head) errors.push('Package and offline witness must identify the exact candidate commit.');
  if (witness.executableSha256 !== hashes.executable || receipt.unpacked?.executable?.sha256 !== hashes.executable || witness.asarSha256 !== hashes.asar || receipt.unpacked?.asar?.sha256 !== hashes.asar || receipt.installer?.sha256 !== hashes.installer) errors.push('Packaged executable, ASAR or installer hash does not match its witness.');
  const life = receipt.installedLifecycle;
  if (life?.status !== 'passed' || !life.offlineFirewallRuleApplied || !life.firewallActivatedBeforeInstall || !(Date.parse(life.firewallActivatedAtUtc) <= Date.parse(life.installerStartedAtUtc)) || witness.firewall?.activatedAtUtc !== life.firewallActivatedAtUtc) errors.push('A pre-install outbound block and completed installed lifecycle are required.');
  const locales = new Set();
  for (const profile of witness.profiles ?? []) {
    locales.add(profile.locale);
    if (!profile.packaged || !profile.sandbox || profile.runtime !== runtime || !profile.firstProfileWasEmpty || !profile.typoDetected || !profile.intendedCorrectionApplied || !profile.chronologicalUndoRedo || profile.languages?.join(',') !== 'en-US') errors.push(`Incomplete first-offline profile: ${profile.locale}`);
  }
  if (locales.size !== 2 || !locales.has('en-US') || !locales.has('en-GB')) errors.push('Both required fresh locale profiles must be present.');
  for (const flag of ['acceptedWordSurvivedExit', 'removedWordSurvivedExit', 'correctedWritingSurvivedExit', 'missingSourceRefused', 'writingAvailableWithoutDictionary', 'sourceRestoredExactly']) if (witness[flag] !== true) errors.push(`Missing packaged proof: ${flag}`);
  if (witness.engine !== 'nspell@2.1.5' || witness.sourceDictionary !== 'dictionary-en@4.0.0' || witness.checkerLanguage !== 'en-US') errors.push('The pinned offline engine and dictionary are required.');
  return errors;
}

// The stability manifest extends this gate; it never narrows the legacy matrix.
function stabilityGate(manifestFile) {
  const argument = (name) => {
    const index = process.argv.indexOf(name);
    if (index < 0 || !process.argv[index + 1] || process.argv[index + 1].startsWith("--")) {
      fail(`Missing required ${name}.`);
    }
    return process.argv[index + 1];
  };
  const selectedPhase = argument("--phase");
  if (!["baseline", "candidate", "packaged"].includes(selectedPhase)) fail("Unknown stability phase.");
  const manifestPath = path.resolve(repoRoot, manifestFile);
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  if (manifest.schema !== "black-skies.stability-manifest.v1") fail("Unsupported stability manifest.");
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  const evidenceRoot = path.resolve(argument("--evidence-root"));
  if (evidenceRoot === repoRoot || evidenceRoot.startsWith(repoRoot + path.sep)) {
    fail("Stability evidence must be outside the publication checkout.");
  }
  fs.mkdirSync(evidenceRoot, { recursive: true });
  const receiptPath = path.join(evidenceRoot, "receipt.json");
  if (fs.existsSync(receiptPath)) fail("Evidence directory already has a receipt; never overwrite a run.");
  assertWorktreePolicy();
  for (const file of stabilityRequiredFiles) {
    if (!manifest.electronFiles.includes(file)) fail(`Manifest omitted legacy required spec: ${file}`);
  }
  for (const file of manifest.electronFiles) {
    if (!fs.existsSync(path.join(appDir, file))) fail(`Required spec missing: ${file}`);
  }
  const artifactPath = process.argv.includes("--baseline-artifact") ? path.resolve(argument("--baseline-artifact")) : null;
  const artifact = artifactPath ? JSON.parse(fs.readFileSync(artifactPath, "utf8")) : null;
  if (artifact && (selectedPhase !== "baseline" || artifact.schema !== "black-skies.frozen-baseline.v1")) fail("Frozen artifacts are baseline-only.");
  const continuationRoot = selectedPhase === "baseline" && process.argv.includes("--baseline-evidence") ? path.resolve(argument("--baseline-evidence")) : null;
  if (continuationRoot && !artifact) fail("Continuing an old baseline requires its frozen artifact.");
  const sourceState = run("git", ["status", "--porcelain=v1", "--untracked-files=all"], { capture: true });
  const head = run("git", ["rev-parse", "HEAD"], { capture: true }).stdout.trim();
  const sourceErrors = validateStabilityManifest(manifest, sourceState.stdout, selectedPhase);
  if (sourceErrors.length) fail(sourceErrors.join("\n"));
  const receipt = {
    schema: "black-skies.stability-run.v1", phase: selectedPhase, head,
    sourceStatus: sourceState.stdout, manifestSha256: digest(manifestBytes),
    lockSha256: digest(fs.readFileSync(path.join(repoRoot, "pnpm-lock.yaml"))),
    runtime: artifact?.runtimeVersion ?? require(path.join(appDir, "node_modules/electron/package.json")).version,
    frozenArtifact: artifactPath ? { path: artifactPath, sha256: digest(fs.readFileSync(artifactPath)), productHead: artifact.head } : null,
    environment: { platform: process.platform, arch: process.arch, node: process.version,
      workers: 1, retries: 0, providers: "disabled", measuredAt: new Date().toISOString() },
    steps: [], defects: {}, outcome: "RUNNING"
  };
  const save = () => fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
  save();
  const execute = (id, command, args, extraEnv = {}) => {
    const logPath = path.join(evidenceRoot, `${id}.log`);
    const started = Date.now();
    process.stdout.write(`[stability] ${id}\n`);
    const log = fs.openSync(logPath, "wx");
    const result = spawnSync(command, args, {
      cwd: repoRoot, stdio: ["ignore", log, log],
      env: { ...process.env, BLACKSKIES_DISABLE_LOCAL_AI: "1", PLAYWRIGHT_RETRIES: "0",
        PLAYWRIGHT_DISABLE_ANIMATIONS: "1", ...(artifactPath ? { BLACKSKIES_STABILITY_BASELINE_ARTIFACT: artifactPath } : {}), PLAYWRIGHT_OUTPUT_DIR: path.join(evidenceRoot, id), ...extraEnv },
      shell: process.platform === "win32" && command.toLowerCase().endsWith(".cmd")
    });
    fs.closeSync(log);
    const step = { id, command, args, env: extraEnv, status: result.status,
      error: result.error?.message ?? null, durationMs: Date.now() - started,
      log: logPath, logSha256: digest(fs.readFileSync(logPath)) };
    receipt.steps.push(step); save();
    process.stdout.write(`[stability] ${id}: ${result.status === 0 ? "PASS" : "FAIL (retained)"}\n`);
    return step;
  };
  const validate = (condition, message) => { if (!condition) throw new Error(message); };
  try {
    if (selectedPhase === "packaged") {
      validate(!receipt.sourceStatus.trim(), "Packaged qualification requires clean candidate C.");
      // Consume the disposable Windows workflow's exact artifact. This phase
      // performs no local installation, first launch or firewall mutation.
      const artifactRoot = path.resolve(argument("--artifact-root"));
      validate(artifactRoot !== repoRoot && !artifactRoot.startsWith(repoRoot + path.sep), "The packaged artifact must be outside the checkout.");
      const read = name => JSON.parse(fs.readFileSync(path.join(artifactRoot, name), "utf8"));
      const witness = read("offline-spelling-witness.json"), packageReceipt = read("stage19-package-receipt.json");
      const hashes = { executable: digest(fs.readFileSync(path.join(artifactRoot, "win-unpacked", "Black Skies.exe"))),
        asar: digest(fs.readFileSync(path.join(artifactRoot, "win-unpacked", "resources", "app.asar"))),
        installer: digest(fs.readFileSync(path.join(artifactRoot, "BlackSkies-Setup-1.0.0-rc1.exe"))) };
      const errors = validateStabilityPackageBinding(witness, packageReceipt, head, receipt.runtime, hashes);
      validate(errors.length === 0, errors.join("\n"));
      const lifecycle = read("stage19-22-lifecycle-evidence.json");
      validate(lifecycle.qualifiedCommit === head && lifecycle.firstOfflineSpellingWitnessSha256 === digest(fs.readFileSync(path.join(artifactRoot, "offline-spelling-witness.json"))), "Lifecycle did not bind the exact offline witness.");
      const resources = packageReceipt.unpacked.offlineSpelling;
      validate(JSON.stringify(resources) === JSON.stringify(witness.resources), "Installed and unpacked dictionary identities differ.");
      for (const file of [...resources.files, { name: "manifest.json", ...resources.manifest }])
        validate(digest(fs.readFileSync(path.join(artifactRoot, "win-unpacked", "resources", "dictionaries", file.name))) === file.sha256, `Packaged dictionary changed: ${file.name}`);
      const files = [];
      const inventory = directory => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const file = path.join(directory, entry.name);
          validate(!entry.isSymbolicLink(), "Artifact symlinks are unsupported.");
          if (entry.isDirectory()) inventory(file);
          else files.push({ path: path.relative(artifactRoot, file).replaceAll("\\", "/"), bytes: fs.statSync(file).size, sha256: digest(fs.readFileSync(file)) });
        }
      };
      inventory(path.join(artifactRoot, "win-unpacked"));
      receipt.package = { head, tree: run("git", ["rev-parse", "HEAD^{tree}"], { capture: true }).stdout.trim(), artifactRoot,
        hashes, files: files.sort((a, b) => a.path.localeCompare(b.path)), witnessSha256: digest(fs.readFileSync(path.join(artifactRoot, "offline-spelling-witness.json"))),
        qualification: "development package only; candidate gate and author acceptance remain separate" };
      receipt.outcome = "PASS";
      return 0;
    }
    if (continuationRoot) {
      const previousBytes = fs.readFileSync(path.join(continuationRoot, "receipt.json"));
      validate(digest(previousBytes) === artifact.baselineReceiptSha256, "Original baseline receipt changed.");
      const previous = JSON.parse(previousBytes);
      validate(previous.phase === "baseline" && previous.head === artifact.head && previous.runtime === artifact.runtimeVersion, "Frozen artifact is not the original baseline.");
      for (const [file, expected] of [["unit-results.json", artifact.unitResultsSha256], ["native-results.json", artifact.nativeResultsSha256]]) {
        validate(digest(fs.readFileSync(path.join(continuationRoot, file))) === expected, `Original evidence changed: ${file}`);
      }
      for (const file of ["unit-inventory.json", "native-inventory.json"]) fs.copyFileSync(path.join(continuationRoot, file), path.join(evidenceRoot, file));
      receipt.steps = previous.steps.map(step => ({ ...step, inheritedFrom: continuationRoot }));
      receipt.baselineContinuation = { path: continuationRoot, sha256: digest(previousBytes), productHead: artifact.head };
      save();
    } else {
    for (const step of manifest.checks) {
      const command = step.command === "$node" ? process.execPath : step.command === "$pnpm" ? pnpm : step.command;
      execute(step.id, command, step.args);
    }
    const unitJson = path.join(evidenceRoot, "unit-results.json");
    execute("full-offline-suite", pnpm, ["--dir", "app", "test", "--", "--run", "--maxWorkers=1",
      "--reporter=default", "--reporter=json", `--outputFile=${unitJson}`]);
    if (fs.existsSync(unitJson)) {
      const result = JSON.parse(fs.readFileSync(unitJson, "utf8"));
      const cases = result.testResults.flatMap(file => file.assertionResults.map(item => ({
        file: path.relative(repoRoot, file.name).replaceAll("\\", "/"), title: item.fullName,
        status: item.status, duration: item.duration })));
      fs.writeFileSync(path.join(evidenceRoot, "unit-inventory.json"), JSON.stringify(cases, null, 2));
      const skipped = cases.filter(item => item.status === "pending" || item.status === "skipped");
      const unexpected = skipped.filter(item => !manifest.allowedUnitSkips.some(allowed =>
        item.file === allowed.file && item.title.endsWith(allowed.title)));
      validate(unexpected.length === 0, `Unexpected offline skips: ${JSON.stringify(unexpected)}`);
      validate(cases.length > 0, "Full offline suite discovered no cases.");
    } else validate(false, "Full offline machine-readable results missing.");
    const nativeJson = path.join(evidenceRoot, "native-results.json");
    const native = electronCommand([...electronPreflightFiles, ...manifest.electronFiles]);
    native.args = native.args.filter(value => value !== "--reporter=list");
    native.args.push("--reporter=list,json");
    execute("native-regressions", native.command, native.args,
      { PLAYWRIGHT_JSON_OUTPUT_NAME: nativeJson });
    validate(fs.existsSync(nativeJson), "Native machine-readable results missing.");
    const nativeResult = JSON.parse(fs.readFileSync(nativeJson, "utf8"));
    const inventory = [];
    const visit = (suite, parents = []) => {
      for (const spec of suite.specs ?? []) for (const test of spec.tests) {
        inventory.push({ id: spec.id, file: spec.file, line: spec.line,
          title: [...parents, suite.title, spec.title].filter(Boolean).join(" / "),
          expectedStatus: test.expectedStatus, results: test.results.map(result => ({ status: result.status, retry: result.retry })) });
      }
      for (const child of suite.suites ?? []) visit(child, [...parents, suite.title].filter(Boolean));
    };
    for (const suite of nativeResult.suites) visit(suite);
    fs.writeFileSync(path.join(evidenceRoot, "native-inventory.json"), JSON.stringify(inventory, null, 2));
    validate(inventory.length > 0 && inventory.every(item => item.results.length && item.results.every(result => result.retry === 0 && (selectedPhase === "baseline" || result.status === "passed"))),
      "Native matrix has failed, skipped or unexecuted cases (see retained results).");
    }
    const inventory = JSON.parse(fs.readFileSync(path.join(evidenceRoot, "native-inventory.json"), "utf8"));
    let baseline;
    if (selectedPhase === "candidate") {
      const baselineRoot = path.resolve(argument("--baseline-evidence"));
      baseline = JSON.parse(fs.readFileSync(path.join(baselineRoot, "receipt.json"), "utf8"));
      validate(baseline.schema === receipt.schema && baseline.phase === "baseline", "Invalid baseline evidence.");
      const baselineCases = JSON.parse(fs.readFileSync(path.join(baselineRoot, "native-inventory.json"), "utf8"));
      const baselineUnits = JSON.parse(fs.readFileSync(path.join(baselineRoot, "unit-inventory.json"), "utf8"));
      const candidateUnits = JSON.parse(fs.readFileSync(path.join(evidenceRoot, "unit-inventory.json"), "utf8"));
      const inventoryErrors = validateStabilityInventories(manifest, candidateUnits, inventory, baselineUnits, baselineCases);
      validate(inventoryErrors.length === 0, inventoryErrors.join("\n"));
      for (const [id, row] of Object.entries(baseline.defects)) {
        const report = path.join(baselineRoot, `${id}-results.json`);
        validate(fs.existsSync(report) && digest(fs.readFileSync(report)) === row.resultSha256, `Baseline repetition bytes changed: ${id}`);
      }
    }
    for (const scenario of manifest.repetitions) {
      const old = baseline?.defects[scenario.id];
      const p = old && old.attempts > 0 ? old.failures / old.attempts : 0;
      const repetitions = p > 0 ? Math.max(manifest.minimumRepetitions,
        Math.ceil(Math.log(.05) / Math.log(1 - Math.min(p, .05)))) : manifest.minimumRepetitions;
      const selectionJson = path.join(evidenceRoot, `${scenario.id}-selection.json`);
      const selection = electronCommand([scenario.file, "--grep", scenario.title, "--list"]);
      selection.args = selection.args.filter(value => value !== "--reporter=list");
      selection.args.push("--reporter=json");
      const selected = execute(`${scenario.id}-selection`, selection.command, selection.args, { PLAYWRIGHT_JSON_OUTPUT_NAME: selectionJson });
      validate(selected.status === 0 && fs.existsSync(selectionJson), `Scenario discovery failed: ${scenario.id}`);
      const selectionResult = JSON.parse(fs.readFileSync(selectionJson, "utf8"));
      const selectedCases = [];
      const discover = suite => {
        for (const spec of suite.specs ?? []) for (const test of spec.tests) selectedCases.push({ title: spec.title, file: spec.file, project: test.projectName });
        for (const child of suite.suites ?? []) discover(child);
      };
      for (const suite of selectionResult.suites) discover(suite);
      validate(selectedCases.length === 1 && selectedCases[0].title === scenario.expectedTitle && path.basename(selectedCases[0].file) === path.basename(scenario.file), `Scenario selection must identify exactly its declared case: ${scenario.id}`);
      const resultJson = path.join(evidenceRoot, `${scenario.id}-results.json`);
      const command = electronCommand([scenario.file, "--grep", scenario.title, `--repeat-each=${repetitions}`]);
      command.args = command.args.filter(value => value !== "--reporter=list");
      command.args.push("--reporter=list,json");
      const step = execute(scenario.id, command.command, command.args,
        { PLAYWRIGHT_JSON_OUTPUT_NAME: resultJson, ...scenario.env });
      validate(fs.existsSync(resultJson), `Missing repetition results: ${scenario.id}`);
      const result = JSON.parse(fs.readFileSync(resultJson, "utf8"));
      const failures = result.stats.unexpected + result.stats.flaky;
      const attempts = result.stats.expected + result.stats.unexpected + result.stats.flaky;
      receipt.defects[scenario.id] = { attempts, failures, skipped: result.stats.skipped,
        required: repetitions, baselineRate: p, profile: scenario.profile, triggeringConfiguration: scenario.env,
        resultSha256: digest(fs.readFileSync(resultJson)) }; save();
      validate(attempts === repetitions && result.stats.skipped === 0, `Missing/extra repetition cases: ${scenario.id}`);
      if (selectedPhase === "candidate") validate(step.status === 0 && failures === 0, `Candidate repetition failed: ${scenario.id}`);
    }
    if (selectedPhase === "candidate") {
      validate(receipt.runtime === manifest.candidateRuntime.version, "Candidate does not use its qualified supported runtime.");
      validate(manifest.pendingCoverage.length === 0, `Manifest still has unimplemented coverage: ${manifest.pendingCoverage.join("; ")}`);
      const closure = JSON.parse(fs.readFileSync(path.join(evidenceRoot, "defect-closure.json"), "utf8"));
      for (const id of manifest.requiredDefects) {
        validate(closure[id]?.status === "resolved" && closure[id]?.candidate === head &&
          closure[id]?.cause && closure[id]?.repair && closure[id]?.evidence?.length,
          `Required defect remains unresolved or lacks candidate-bound evidence: ${id}`);
      }
    }
    validate(receipt.steps.every(step => step.status === 0), "One or more gate steps failed; all evidence retained.");
    receipt.outcome = "PASS";
  } catch (error) {
    receipt.outcome = "INCOMPLETE_OR_FAILED"; receipt.failure = error.message;
    process.stderr.write(`[stability] ${error.message}\n`);
  } finally { receipt.completedAt = new Date().toISOString(); save(); }
  return receipt.outcome === "PASS" ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
const stabilityManifestIndex = process.argv.indexOf("--manifest");
if (stabilityManifestIndex >= 0) {
  const file = process.argv[stabilityManifestIndex + 1];
  if (!file || file.startsWith("--")) fail("Missing stability manifest path.");
  process.exit(stabilityGate(file));
}

process.stdout.write(
  `[stage19] fixed regression gate; allowDirty=${allowDirty}; protectedEvidence=NOT_USED\n`
);

assertWorktreePolicy();
phase("Repository tracked-path hygiene", "python", [
  "scripts/check_repo_hygiene.py",
  "--tracked"
]);
phase("Foundation reachability and coverage policy", process.execPath, [
  "scripts/verify-foundation-inventory.mjs"
]);
phase("Git diff hygiene", "git", ["diff", "--check"]);
phase("Packaging workflow manual-dispatch policy", process.execPath, [
  "scripts/stage19-packaging-workflow-policy.mjs"
]);
phase("First-party app lint with zero-warning ceiling", process.execPath, [
  "scripts/run-app-eslint.mjs"
]);
phase("Active Stage 19 lint with zero-warning ceiling", process.execPath, [
  "scripts/run-stage19-eslint.mjs"
]);
phase("Full app TypeScript boundary", pnpm, [
  "--dir",
  "app",
  "run",
  "typecheck:all"
]);
phase("Renderer and main production build", pnpm, [
  "--dir",
  "app",
  "run",
  "build:production"
]);
phase("Critical unit, component, and contract matrix", pnpm, [
  "--filter",
  "app",
  "test",
  "--",
  "--run",
  "--maxWorkers=1",
  ...unitFiles
]);
const electronPreflight = electronCommand(electronPreflightFiles);
phase(
  "Critical Stage 19 Electron startup preflight",
  electronPreflight.command,
  electronPreflight.args,
);
const electron = electronCommand(electronFiles);
phase("Critical Stage 19 Electron matrix", electron.command, electron.args);

process.stdout.write(
  `\nSTAGE19_REGRESSION_PASS\nworktree=${allowDirty ? "DEVELOPMENT_OVERRIDE" : "CLEAN_RC_ELIGIBLE"}\nprotectedEvidence=NOT_USED\n`
);

}
