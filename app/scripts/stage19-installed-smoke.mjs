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
  return environment;
}

function processTree(rootPid) {
  const command = [
    "$root = [int]$env:BLACK_SKIES_ROOT_PID;",
    "$rows = @(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath);",
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
    executablePath: entry.ExecutablePath ? String(entry.ExecutablePath) : null
  }));
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

async function closeClean(application) {
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
}

async function main() {
  const executablePath = requireValue("--executable");
  const smokeRoot = requireValue("--root");
  const resultPath = requireValue("--result");
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
  try {
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
    await closeClean(first.application);
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
    await closeClean(second.application);
    second = null;

    const result = {
      schema: "black-skies.stage19.installed-smoke.v1",
      appIsPackaged: firstTruth.isPackaged && secondTruth.isPackaged,
      version: firstTruth.version,
      windowCount: firstTruth.windows.length,
      sandboxedWindowCount: firstTruth.windows.filter((window) => window.sandbox).length,
      forbiddenRuntimeProcessCount: forbiddenProcesses.length,
      projectPath,
      projectFiles: projectFileManifest(projectPath),
      exportPath,
      exportByteLength: statSync(exportPath).size,
      exportSha256: hashFile(exportPath),
      exportedUnitCount: exported.data.unitCount,
      exactMarkdownMatched: true,
      coreNetworkCredentialsPresent: false,
      developmentFlagsPresent: false,
      completedAtUtc: new Date().toISOString()
    };
    writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    for (const launched of [second, first]) {
      if (!launched) continue;
      try {
        await launched.application.close();
      } catch {
        // The PowerShell wrapper guarantees uninstall cleanup if launch proof fails.
      }
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
