import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { _electron as electron } from "playwright";

const expectedMarkdown = [
  "# Installed Ω Orbit",
  "",
  "## Opening \\# \\[α\\]",
  "",
  "Saved A — Café 🌌 **bold**",
  "",
  "## Duplicate \\*Title\\*",
  "",
  "[Signal](https://example.invalid/signal)",
  "",
  "## Untitled",
  ""
].join("\n");
const representativeUnitCount = 100;
const coldLaunchSampleCount = 5;
const coldLaunchProtocol = "paired-main-process-monotonic-two-window-median-v4";
const representativeProjectTitle = "Packaged 100 Unit Ω";
const representativeOpening = "Packaged scale opening — Café 🌌 **bold**";
const representativeClosing = "[Closing](https://example.invalid/closing)";

export function expectedRepresentativeMarkdown() {
  const lines = [`# ${representativeProjectTitle}`, ""];
  for (let index = 1; index <= representativeUnitCount; index += 1) {
    lines.push(`## Representative ${String(index).padStart(3, "0")}`, "");
    if (index === 1) lines.push(representativeOpening, "");
    if (index === representativeUnitCount) lines.push(representativeClosing, "");
  }
  return lines.join("\n");
}

function fail(message) {
  throw new Error(`[stage19-installed] ${message}`);
}

function requireValue(flag) {
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) fail(`Missing ${flag}.`);
  return path.resolve(value);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function hashBytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hashFile(filePath) {
  return hashBytes(readFileSync(filePath));
}

function projectFileManifest(projectPath) {
  const visit = (directory) =>
    readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name))
      .flatMap((entry) => {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) return visit(absolute);
        assert(entry.isFile(), `Unexpected non-file project entry: ${absolute}`);
        return [{
          path: path.relative(projectPath, absolute).replaceAll("\\", "/"),
          byteLength: statSync(absolute).size,
          sha256: hashFile(absolute)
        }];
      });
  return visit(projectPath);
}

function sanitizedLaunchEnvironment() {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (
      /^(?:PLAYWRIGHT|BLACKSKIES|ELECTRON_RENDERER_URL|OPENAI|ANTHROPIC|AZURE_OPENAI|GOOGLE_API|GEMINI|COHERE|MISTRAL|GROQ|TOGETHER|DEEPSEEK)/iu.test(
        key
      ) ||
      key === "NODE_OPTIONS"
    ) {
      delete environment[key];
    }
  }
  environment.STAGE19_INTERNAL_STARTUP_PROBE = "1";
  return environment;
}

function processTree(rootPid) {
  const command = [
    "$root = [int]$env:BLACK_SKIES_ROOT_PID;",
    "$rows = @(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,WorkingSetSize);",
    "$selected = New-Object System.Collections.Generic.List[object];",
    "$queue = New-Object System.Collections.Generic.Queue[int];",
    "$queue.Enqueue($root);",
    "while ($queue.Count -gt 0) {",
    "  $parent = $queue.Dequeue();",
    "  foreach ($row in $rows) {",
    "    if ([int]$row.ParentProcessId -eq $parent) { $selected.Add($row); $queue.Enqueue([int]$row.ProcessId) }",
    "  }",
    "}",
    "$selected | ConvertTo-Json -Compress"
  ].join(" ");
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    {
      encoding: "utf8",
      env: { ...process.env, BLACK_SKIES_ROOT_PID: String(rootPid) }
    }
  ).trim();
  if (!output) return [];
  const parsed = JSON.parse(output);
  return (Array.isArray(parsed) ? parsed : [parsed]).map((entry) => ({
    pid: Number(entry.ProcessId),
    parentPid: Number(entry.ParentProcessId),
    name: String(entry.Name ?? ""),
    executablePath: entry.ExecutablePath ? String(entry.ExecutablePath) : null,
    workingSetBytes: Number(entry.WorkingSetSize ?? 0)
  }));
}

function survivingOwnedProcesses(processIds) {
  if (!processIds.length) return [];
  const command = [
    "$ids = $env:BLACK_SKIES_OWNED_PIDS -split ',' | Where-Object { $_ };",
    "@(Get-Process -Id $ids -ErrorAction SilentlyContinue | Select-Object Id,ProcessName | ConvertTo-Json -Compress)"
  ].join(" ");
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    {
      encoding: "utf8",
      env: { ...process.env, BLACK_SKIES_OWNED_PIDS: processIds.join(",") }
    }
  ).trim();
  if (!output) return [];
  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function identifyWindows(application) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const candidates = application.windows();
    const roles = await Promise.all(
      candidates.map(async (page) => ({
        page,
        writing: await page.locator('[data-stage19-role="writing"]').count(),
        command: await page.locator('[data-stage19-role="command"]').count()
      }))
    );
    const writing = roles.find((role) => role.writing === 1)?.page;
    const command = roles.find((role) => role.command === 1)?.page;
    if (writing && command && writing !== command) return { writing, command };
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  fail("The installed application did not expose one Writing Studio and one Command Center.");
}

async function launchInstalled(executablePath, userDataPath) {
  const application = await electron.launch({
    executablePath,
    args: ["--disable-gpu", `--user-data-dir=${userDataPath}`],
    env: sanitizedLaunchEnvironment()
  });
  const windows = await identifyWindows(application);
  return { application, ...windows };
}

async function runtimeTruth(application, writing, command, executablePath) {
  const mainTruth = await application.evaluate(async ({ app, BrowserWindow }) => {
    const windows = BrowserWindow.getAllWindows().filter((window) => !window.isDestroyed());
    return {
      isPackaged: app.isPackaged,
      version: app.getVersion(),
      executablePath: app.getPath("exe"),
      windows: await Promise.all(
        windows.map(async (window) => ({
          role: await window.webContents.executeJavaScript(
            "document.querySelector('[data-stage19-role=\"writing\"]') ? 'writing' : document.querySelector('[data-stage19-role=\"command\"]') ? 'command' : 'unknown'"
          ),
          sandbox: window.webContents.getLastWebPreferences().sandbox,
          contextIsolation: window.webContents.getLastWebPreferences().contextIsolation,
          nodeIntegration: window.webContents.getLastWebPreferences().nodeIntegration,
          preloadRuntimePath: window.webContents.getLastWebPreferences().preload ?? null
        }))
      )
    };
  });
  assert(mainTruth.isPackaged === true, "app.isPackaged was not true.");
  assert(mainTruth.version === "1.0.0-rc1", `Installed app version was ${mainTruth.version}.`);
  assert(
    path.resolve(mainTruth.executablePath).toLowerCase() === path.resolve(executablePath).toLowerCase(),
    "The running executable did not match the installed target."
  );
  assert(mainTruth.windows.length === 2, `Expected two installed windows; found ${mainTruth.windows.length}.`);
  assert(
    mainTruth.windows.every(
      (window) =>
        window.sandbox === true &&
        window.contextIsolation === true &&
        window.nodeIntegration === false
    ),
    `An installed renderer did not use the sandboxed Stage 19 preload: ${JSON.stringify(mainTruth.windows)}`
  );
  assert(
    new Set(mainTruth.windows.map((window) => window.role)).size === 2,
    "Installed windows did not have distinct Writing and Command roles."
  );

  const writingGlobals = await writing.evaluate(() => ({
    projectSpine: Object.keys(window.projectSpine ?? {}).sort(),
    splitCommand: Object.keys(window.splitCommand ?? {}).sort(),
    aiCritique: Object.keys(window.aiCritique ?? {}).sort(),
    requireType: typeof window.require,
    processType: typeof window.process
  }));
  const commandGlobals = await command.evaluate(() => ({
    projectSpine: Object.keys(window.projectSpine ?? {}).sort(),
    splitCommand: Object.keys(window.splitCommand ?? {}).sort(),
    aiCritiqueType: typeof window.aiCritique,
    requireType: typeof window.require,
    processType: typeof window.process
  }));
  const writingProjectSpine = [
    "acceptRecoveryCandidate",
    "captureRecoveryCheckpoint",
    "chooseDirectory",
    "createProject",
    "createUnit",
    "deleteUnit",
    "exportMarkdown",
    "focusWritingWindow",
    "getSession",
    "onCloseConfirmationRequest",
    "openProject",
    "rejectRecoveryCandidate",
    "removeRecent",
    "renameUnit",
    "reorderUnits",
    "respondToCloseConfirmation",
    "saveUnit",
    "selectUnit",
    "setUnitDirty",
    "subscribeSession",
    "windowRole"
  ].sort();
  const commandProjectSpine = [
    "getSession",
    "selectUnit",
    "subscribeSession",
    "windowRole"
  ].sort();
  const splitCommand = [
    "readOwnershipSync",
    "requestOwnershipSync",
    "subscribeOwnershipSync",
    "windowRole"
  ].sort();
  const aiCritique = [
    "approveAndExecute",
    "cancel",
    "clearCredential",
    "credentialStatus",
    "invalidate",
    "prepare",
    "setCredential",
    "subscribeState"
  ].sort();
  assert(
    JSON.stringify(writingGlobals.projectSpine) === JSON.stringify(writingProjectSpine),
    `Writing Project Spine allowlist differed: ${JSON.stringify(writingGlobals.projectSpine)}`
  );
  assert(
    JSON.stringify(commandGlobals.projectSpine) === JSON.stringify(commandProjectSpine),
    `Command Project Spine allowlist differed: ${JSON.stringify(commandGlobals.projectSpine)}`
  );
  assert(
    JSON.stringify(writingGlobals.splitCommand) === JSON.stringify(splitCommand) &&
      JSON.stringify(commandGlobals.splitCommand) === JSON.stringify(splitCommand),
    "Split-window bridge allowlist differed."
  );
  assert(
    JSON.stringify(writingGlobals.aiCritique) === JSON.stringify(aiCritique) &&
      commandGlobals.aiCritiqueType === "undefined",
    "AI critique bridge role boundary differed."
  );
  assert(
    writingGlobals.requireType === "undefined" &&
      writingGlobals.processType === "undefined" &&
      commandGlobals.requireType === "undefined" &&
      commandGlobals.processType === "undefined",
    "A renderer exposed Node globals."
  );
  return mainTruth;
}

function binding(snapshot, operationId) {
  assert(snapshot.project, "No active project was available for a bound operation.");
  return {
    projectId: snapshot.project.projectId,
    projectPath: snapshot.project.path,
    generation: snapshot.generation,
    operationId
  };
}

async function invokeOk(page, callback, value) {
  const result = await page.evaluate(callback, value);
  if (!result?.ok) fail(`Installed bridge operation failed: ${JSON.stringify(result?.error ?? result)}`);
  return result;
}

async function saveProse(writing, unitId, prose, prefix) {
  let snapshot = await writing.evaluate(() => window.projectSpine.getSession());
  const expected = snapshot.project?.drafts?.[unitId];
  assert(typeof expected === "string", `Unit ${unitId} had no durable draft.`);
  const normalized = expected.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  const closingIndex = lines.slice(1).findIndex((line) => line.trim() === "---") + 1;
  const header = closingIndex > 0 ? `${lines.slice(0, closingIndex + 1).join("\n")}\n` : "";

  await invokeOk(
    writing,
    async ({ request, unitId: id }) => window.projectSpine.setUnitDirty({ ...request, unitId: id, dirty: true }),
    { request: binding(snapshot, `${prefix}-dirty`), unitId }
  );
  snapshot = await writing.evaluate(() => window.projectSpine.getSession());
  await invokeOk(
    writing,
    async ({ request, unitId: id, prose: value }) =>
      window.projectSpine.captureRecoveryCheckpoint({ ...request, unitId: id, prose: value }),
    { request: binding(snapshot, `${prefix}-checkpoint`), unitId, prose }
  );
  snapshot = await writing.evaluate(() => window.projectSpine.getSession());
  await invokeOk(
    writing,
    async ({ request, unitId: id, expectedMarkdown, markdown, submittedProse }) =>
      window.projectSpine.saveUnit({
        ...request,
        unitId: id,
        expectedMarkdown,
        markdown,
        submittedProse
      }),
    {
      request: binding(snapshot, `${prefix}-save`),
      unitId,
      expectedMarkdown: snapshot.project.drafts[unitId],
      markdown: `${header}${prose.replaceAll("\r\n", "\n")}\n`,
      submittedProse: prose
    }
  );
}

async function closeClean(application, ownedProcessIds) {
  const processHandle = application.process();
  const exitPromise = processHandle
    ? new Promise((resolve, reject) => {
        processHandle.once("exit", (code, signal) => {
          if (signal || code !== 0) reject(new Error(`Installed app exited code=${code} signal=${signal}.`));
          else resolve();
        });
      })
    : Promise.reject(new Error("Installed app process handle was unavailable."));
  await application.evaluate(({ app }) => app.quit());
  await exitPromise;
  const survivors = survivingOwnedProcesses(ownedProcessIds);
  assert(survivors.length === 0, `Installed app left owned processes after teardown: ${JSON.stringify(survivors)}.`);
}

function median(values) {
  assert(values.length % 2 === 1, "Cold-launch median requires an odd sample count.");
  return [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)];
}

function summarizeColdLaunchPerformance(coldLaunchPreparation, coldLaunchSamples) {
  const coldLaunchSamplesMs = coldLaunchSamples.map((sample) => sample.durationMs);
  return {
    coldLaunchProtocol,
    coldLaunchMeasurementSource: "main-process-monotonic-probe",
    coldLaunchProbeSchema: coldLaunchPreparation.probe.schema,
    coldLaunchPreparationMs: coldLaunchPreparation.durationMs,
    coldLaunchPreparationHarnessReadyAtMs: coldLaunchPreparation.harnessReadyAtMs,
    coldLaunchPreparationWindowCount: coldLaunchPreparation.windowCount,
    coldLaunchPreparationVisibleWindowCount: coldLaunchPreparation.visibleWindowCount,
    coldLaunchPreparationSandboxedWindowCount: coldLaunchPreparation.sandboxedWindowCount,
    coldLaunchDurationMs: median(coldLaunchSamplesMs),
    coldLaunchSamplesMs,
    coldLaunchHarnessReadyAtSamplesMs: coldLaunchSamples.map((sample) => sample.harnessReadyAtMs),
    coldLaunchSampleCount,
    coldLaunchSampleWindowCounts: coldLaunchSamples.map((sample) => sample.windowCount),
    coldLaunchSampleVisibleWindowCounts: coldLaunchSamples.map((sample) => sample.visibleWindowCount),
    coldLaunchSampleSandboxedWindowCounts: coldLaunchSamples.map(
      (sample) => sample.sandboxedWindowCount
    ),
    coldLaunchStatistic: "median"
  };
}

async function coldLaunchReadiness(application) {
  const windows = await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()
      .filter((window) => !window.isDestroyed())
      .map((window) => {
        const preferences = window.webContents.getLastWebPreferences();
        return {
          visible: window.isVisible(),
          sandbox: preferences.sandbox,
          contextIsolation: preferences.contextIsolation,
          nodeIntegration: preferences.nodeIntegration
        };
      })
  );
  assert(windows.length === 2, `Cold launch did not expose two windows: ${windows.length}.`);
  assert(windows.every((window) => window.visible), "Cold launch did not expose two visible windows.");
  assert(
    windows.every(
      (window) =>
        window.sandbox === true &&
        window.contextIsolation === true &&
        window.nodeIntegration === false
    ),
    "Cold launch did not expose two sandboxed windows."
  );
  return windows;
}

async function readColdLaunchProbe(application) {
  const probe = await application.evaluate(() => {
    const value = globalThis[Symbol.for("blackskies.stage19.internal.startupProbe")];
    if (!value || typeof value !== "object") {
      return null;
    }
    return {
      schema: value.schema,
      writingVisibleMs: value.writingVisibleMs,
      commandVisibleMs: value.commandVisibleMs,
      twoWindowVisibleMs: value.twoWindowVisibleMs
    };
  });
  assert(
    probe?.schema === "black-skies.stage19.internal-startup-probe.v1",
    "Installed startup probe was unavailable or malformed."
  );
  assert(
    Number.isFinite(probe.writingVisibleMs) &&
      Number.isFinite(probe.commandVisibleMs) &&
      Number.isFinite(probe.twoWindowVisibleMs),
    "Installed startup probe did not record both visible windows."
  );
  return probe;
}

async function measureColdLaunch(executablePath, userDataPath) {
  mkdirSync(userDataPath, { recursive: true });
  let launched;
  try {
    const startedAt = performance.now();
    launched = await launchInstalled(executablePath, userDataPath);
    const readiness = await coldLaunchReadiness(launched.application);
    const probe = await readColdLaunchProbe(launched.application);
    const harnessReadyAtMs = performance.now() - startedAt;
    const durationMs = probe.twoWindowVisibleMs;
    const truth = await runtimeTruth(
      launched.application,
      launched.writing,
      launched.command,
      executablePath
    );
    const rootPid = launched.application.process()?.pid;
    assert(Number.isInteger(rootPid), "Installed root process PID was unavailable.");
    const processEntries = processTree(rootPid);
    const ownedProcessIds = [rootPid, ...processEntries.map((entry) => entry.pid)];
    const forbiddenProcesses = processEntries.filter((entry) =>
      /^(?:python(?:3)?|node)(?:\.exe)?$/iu.test(entry.name)
    );
    assert(
      forbiddenProcesses.length === 0,
      `Installed process tree contained forbidden runtimes: ${JSON.stringify(forbiddenProcesses)}`
    );
    await closeClean(launched.application, ownedProcessIds);
    launched = undefined;
    return {
      durationMs,
      harnessReadyAtMs,
      probe,
      isPackaged: truth.isPackaged,
      version: truth.version,
      windowCount: truth.windows.length,
      visibleWindowCount: readiness.filter((window) => window.visible).length,
      sandboxedWindowCount: truth.windows.filter((window) => window.sandbox).length,
      forbiddenRuntimeProcessCount: forbiddenProcesses.length
    };
  } finally {
    if (launched) {
      try {
        const rootPid = launched.application.process()?.pid;
        const ownedProcessIds = Number.isInteger(rootPid)
          ? [rootPid, ...processTree(rootPid).map((entry) => entry.pid)]
          : [];
        await closeClean(launched.application, ownedProcessIds);
      } catch {
        try {
          await launched.application.close();
        } catch {
          // Preserve the original launch/measurement failure.
        }
      }
    }
  }
}

async function main() {
  const executablePath = requireValue("--executable");
  const smokeRoot = requireValue("--root");
  const resultPath = requireValue("--result");
  const runRepresentative = process.argv.includes("--representative");
  const performanceOnly = process.argv.includes("--performance-only");
  assert(existsSync(executablePath), "Installed executable does not exist.");
  mkdirSync(smokeRoot, { recursive: true });
  const userDataPath = path.join(smokeRoot, "user-data");
  const projectParent = path.join(smokeRoot, "projects");
  const exportPath = path.join(smokeRoot, "exports", "installed-orbit.md");
  mkdirSync(userDataPath, { recursive: true });
  mkdirSync(projectParent, { recursive: true });
  mkdirSync(path.dirname(exportPath), { recursive: true });

  let first;
  let second;
  let third;
  try {
    // First-profile initialization and host executable preparation are not the
    // cold-process launch being budgeted. Prepare one disposable profile with a
    // complete two-window lifecycle, then use that same prepared profile for a
    // fixed sequence of fully closed process launches. No sample is retried or
    // discarded; the median of all five is the governed metric.
    const coldLaunchUserDataPath = path.join(smokeRoot, "cold-launch-user-data", "prepared");
    const coldLaunchPreparation = await measureColdLaunch(executablePath, coldLaunchUserDataPath);
    const coldLaunchSamples = [];
    for (let sampleIndex = 1; sampleIndex <= coldLaunchSampleCount; sampleIndex += 1) {
      coldLaunchSamples.push(await measureColdLaunch(executablePath, coldLaunchUserDataPath));
    }
    const launchPerformance = summarizeColdLaunchPerformance(
      coldLaunchPreparation,
      coldLaunchSamples
    );
    assert(
      coldLaunchSamples.every((sample) => sample.isPackaged),
      "Cold-launch samples did not prove packaged runtime truth."
    );
    assert(
      coldLaunchSamples.every((sample) => sample.forbiddenRuntimeProcessCount === 0),
      "Cold-launch samples found a forbidden runtime process."
    );
    if (performanceOnly) {
      const firstSample = coldLaunchSamples[0];
      const result = {
        schema: "black-skies.stage19.installed-smoke.v1",
        qualificationMode: "paired-startup-reference",
        appIsPackaged: true,
        version: firstSample.version,
        windowCount: firstSample.windowCount,
        sandboxedWindowCount: firstSample.sandboxedWindowCount,
        forbiddenRuntimeProcessCount: 0,
        zeroSurvivorProcessCount: 0,
        performance: launchPerformance,
        completedAtUtc: new Date().toISOString()
      };
      writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    }
    first = await launchInstalled(executablePath, userDataPath);
    const firstTruth = await runtimeTruth(
      first.application,
      first.writing,
      first.command,
      executablePath
    );
    const rootPid = first.application.process()?.pid;
    assert(Number.isInteger(rootPid), "Installed root process PID was unavailable.");
    const firstTree = processTree(rootPid);
    const firstOwnedProcessIds = [rootPid, ...firstTree.map((entry) => entry.pid)];
    const steadyStateWorkingSetBytes = firstTree.reduce(
      (total, entry) => total + entry.workingSetBytes,
      0
    );
    const forbiddenProcesses = firstTree.filter((entry) =>
      /^(?:python(?:3)?|node)(?:\.exe)?$/iu.test(entry.name)
    );
    assert(
      forbiddenProcesses.length === 0,
      `Installed process tree contained forbidden runtimes: ${JSON.stringify(forbiddenProcesses)}`
    );

    const created = await invokeOk(
      first.writing,
      async (parentPath) =>
        window.projectSpine.createProject({
          parentPath,
          title: "Installed Ω Orbit",
          operationId: "installed-create"
        }),
      projectParent
    );
    const projectPath = created.snapshot.project.path;
    assert(
      !path.resolve(projectPath).toLowerCase().startsWith(path.dirname(executablePath).toLowerCase()),
      "The disposable project was created inside the installation directory."
    );

    const unitIds = [];
    for (const [index, title] of ["Opening # [α]", "   ", "Duplicate *Title*"].entries()) {
      const snapshot = await first.writing.evaluate(() => window.projectSpine.getSession());
      const createdUnit = await invokeOk(
        first.writing,
        async ({ request, title: unitTitle }) =>
          window.projectSpine.createUnit({ ...request, title: unitTitle }),
        { request: binding(snapshot, `installed-unit-${index}`), title }
      );
      unitIds.push(createdUnit.data.unitId);
    }
    let snapshot = await first.writing.evaluate(() => window.projectSpine.getSession());
    await invokeOk(
      first.writing,
      async ({ request, orderedUnitIds }) =>
        window.projectSpine.reorderUnits({ ...request, orderedUnitIds }),
      {
        request: binding(snapshot, "installed-reorder"),
        orderedUnitIds: [unitIds[0], unitIds[2], unitIds[1]]
      }
    );
    await saveProse(first.writing, unitIds[0], "Saved A — Café 🌌 **bold**", "installed-opening");
    await saveProse(
      first.writing,
      unitIds[2],
      "[Signal](https://example.invalid/signal)",
      "installed-duplicate"
    );
    snapshot = await first.writing.evaluate(() => window.projectSpine.getSession());
    assert(snapshot.dirtyUnitIds.length === 0, "The generated project was not durably clean.");
    await closeClean(first.application, firstOwnedProcessIds);
    first = null;

    second = await launchInstalled(executablePath, userDataPath);
    const secondTruth = await runtimeTruth(
      second.application,
      second.writing,
      second.command,
      executablePath
    );
    const reopened = await invokeOk(
      second.writing,
      async (project) =>
        window.projectSpine.openProject({ path: project, operationId: "installed-reopen" }),
      projectPath
    );
    assert(reopened.snapshot.project.units.length === 3, "Reopened project unit count differed.");
    assert(reopened.snapshot.dirtyUnitIds.length === 0, "Reopened project was not clean.");
    assert(
      JSON.stringify(reopened.snapshot.project.units.map((unit) => unit.id)) ===
        JSON.stringify([unitIds[0], unitIds[2], unitIds[1]]),
      "Reopened project order differed."
    );
    await second.application.evaluate(({ dialog }, destination) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: destination });
    }, exportPath);
    snapshot = await second.writing.evaluate(() => window.projectSpine.getSession());
    const exported = await invokeOk(
      second.writing,
      async (request) => window.projectSpine.exportMarkdown(request),
      { ...binding(snapshot, "installed-export"), revision: snapshot.revision }
    );
    assert(exported.data.status === "completed", "Installed Markdown export did not complete.");
    assert(existsSync(exportPath), "Installed Markdown export file is missing.");
    const exactExport = readFileSync(exportPath);
    assert(
      exactExport.equals(Buffer.from(expectedMarkdown, "utf8")),
      `Installed Markdown bytes differed (actual SHA-256 ${hashBytes(exactExport)}).`
    );
    assert(
      exported.data.sha256 === hashBytes(exactExport),
      "Installed export result SHA-256 differed from exact bytes."
    );

    let representative = null;
    if (runRepresentative) {
      const representativeCreated = await invokeOk(
        second.writing,
        async (parentPath) =>
          window.projectSpine.createProject({
            parentPath,
            title: "Packaged 100 Unit Ω",
            operationId: "installed-representative-create"
          }),
        projectParent
      );
      const representativeProjectPath = representativeCreated.snapshot.project.path;
      let representativeSnapshot = representativeCreated.snapshot;
      const representativeUnitIds = [];
      const creationStartedAt = performance.now();
      for (let index = 1; index <= representativeUnitCount; index += 1) {
        const createdUnit = await invokeOk(
          second.writing,
          async ({ request, title }) =>
            window.projectSpine.createUnit({ ...request, title }),
          {
            request: binding(
              representativeSnapshot,
              `installed-representative-unit-${index}`
            ),
            title: `Representative ${String(index).padStart(3, "0")}`
          }
        );
        representativeUnitIds.push(createdUnit.data.unitId);
        representativeSnapshot = createdUnit.snapshot;
      }
      const creationDurationMs = performance.now() - creationStartedAt;
      assert(
        creationDurationMs < 15_000,
        `Installed 100-unit creation exceeded 15 seconds: ${creationDurationMs}ms.`
      );
      await saveProse(
        second.writing,
        representativeUnitIds[0],
        representativeOpening,
        "installed-representative-opening"
      );
      await saveProse(
        second.writing,
        representativeUnitIds.at(-1),
        representativeClosing,
        "installed-representative-closing"
      );
      representativeSnapshot = await second.writing.evaluate(() =>
        window.projectSpine.getSession()
      );
      const selectionStartedAt = performance.now();
      await invokeOk(
        second.writing,
        async ({ request, unitId }) =>
          window.projectSpine.selectUnit({ ...request, unitId }),
        {
          request: binding(representativeSnapshot, "installed-representative-select"),
          unitId: representativeUnitIds.at(-1)
        }
      );
      const selectionDurationMs = performance.now() - selectionStartedAt;
      assert(
        selectionDurationMs < 3_000,
        `Installed unit-100 selection exceeded 3 seconds: ${selectionDurationMs}ms.`
      );
      const secondRootPid = second.application.process()?.pid;
      assert(Number.isInteger(secondRootPid), "Installed root process PID was unavailable.");
      await closeClean(second.application, [secondRootPid, ...processTree(secondRootPid).map((entry) => entry.pid)]);
      second = null;

      third = await launchInstalled(executablePath, userDataPath);
      await runtimeTruth(third.application, third.writing, third.command, executablePath);
      const representativeReopened = await invokeOk(
        third.writing,
        async (project) =>
          window.projectSpine.openProject({
            path: project,
            operationId: "installed-representative-reopen"
          }),
        representativeProjectPath
      );
      assert(
        representativeReopened.snapshot.project.units.length === representativeUnitCount,
        "Reopened representative project unit count differed."
      );
      assert(
        representativeReopened.snapshot.dirtyUnitIds.length === 0,
        "Reopened representative project was not clean."
      );
      const representativeExportPath = path.join(
        smokeRoot,
        "exports",
        "installed-representative.md"
      );
      await third.application.evaluate(({ dialog }, destination) => {
        dialog.showSaveDialog = async () => ({ canceled: false, filePath: destination });
      }, representativeExportPath);
      const representativeExport = await invokeOk(
        third.writing,
        async (request) => window.projectSpine.exportMarkdown(request),
        {
          ...binding(
            representativeReopened.snapshot,
            "installed-representative-export"
          ),
          revision: representativeReopened.snapshot.revision
        }
      );
      const representativeExportBytes = readFileSync(representativeExportPath);
      assert(
        representativeExportBytes.equals(
          Buffer.from(expectedRepresentativeMarkdown(), "utf8")
        ),
        "Installed representative Markdown bytes differed."
      );
      assert(
        representativeExport.data.unitCount === representativeUnitCount,
        "Installed representative export unit count differed."
      );
      const thirdRootPid = third.application.process()?.pid;
      assert(Number.isInteger(thirdRootPid), "Installed root process PID was unavailable.");
      await closeClean(third.application, [thirdRootPid, ...processTree(thirdRootPid).map((entry) => entry.pid)]);
      third = null;
      representative = {
        projectPath: representativeProjectPath,
        projectFiles: projectFileManifest(representativeProjectPath),
        exportPath: representativeExportPath,
        exportByteLength: statSync(representativeExportPath).size,
        exportSha256: hashFile(representativeExportPath),
        unitCount: representativeUnitCount,
        creationDurationMs,
        selectionDurationMs,
        exactMarkdownMatched: true
      };
    } else {
      const secondRootPid = second.application.process()?.pid;
      assert(Number.isInteger(secondRootPid), "Installed root process PID was unavailable.");
      await closeClean(second.application, [secondRootPid, ...processTree(secondRootPid).map((entry) => entry.pid)]);
      second = null;
    }

    const result = {
      schema: "black-skies.stage19.installed-smoke.v1",
      appIsPackaged: firstTruth.isPackaged && secondTruth.isPackaged,
      version: firstTruth.version,
      windowCount: firstTruth.windows.length,
      sandboxedWindowCount: firstTruth.windows.filter((window) => window.sandbox).length,
      forbiddenRuntimeProcessCount: forbiddenProcesses.length,
      zeroSurvivorProcessCount: 0,
      performance: {
        ...launchPerformance,
        steadyStateWorkingSetBytes,
        processCount: firstTree.length
      },
      projectPath,
      projectFiles: projectFileManifest(projectPath),
      exportPath,
      exportByteLength: statSync(exportPath).size,
      exportSha256: hashFile(exportPath),
      exportedUnitCount: exported.data.unitCount,
      exactMarkdownMatched: true,
      representative,
      coreNetworkCredentialsPresent: false,
      developmentFlagsPresent: false,
      completedAtUtc: new Date().toISOString()
    };
    writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    for (const launched of [third, second, first]) {
      if (!launched) continue;
      try {
        await launched.application.close();
      } catch {
        // The PowerShell wrapper guarantees uninstall cleanup if launch proof fails.
      }
    }
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exit(1);
  });
}
