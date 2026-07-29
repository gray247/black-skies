# Windows Packaging Guide

Status: Package 19.19 internal release-candidate authority

Version: `1.0.0-rc1`

Target: Windows 11 x64, per-user assisted NSIS installer

Package 19.19 produces exactly one distributable application artifact:

```text
app/release/BlackSkies-Setup-1.0.0-rc1.exe
```

The installer is an unsigned internal release candidate. Its truthful signature
status is `NotSigned`; it is not represented as publicly signed or
SmartScreen-trusted. Package 19.20 owns the separate human packaged-RC
acceptance pass.

Windows PE fixed-version fields cannot encode a SemVer prerelease label. The
manifest, installed `app.getVersion()`, filename, and receipt retain
`1.0.0-rc1`; the PE file version uses the deterministic RC1 equivalent
`1.0.0.1`, while electron-builder's PE product version contains the SemVer
numeric core `1.0.0.0`. The verifier requires all three identities and records
their relationship.

## Prerequisites

- Windows 11 x64
- the repository-pinned Node and pnpm toolchain
- frozen repository dependencies

Python, a globally installed NSIS, globally installed Node for the application,
provider credentials, and internet access at application runtime are neither
required nor permitted dependencies of the packaged application. The build
tool may obtain its pinned packaging binaries when they are not already cached.

## Build and verify

From the repository root:

```powershell
pnpm install --frozen-lockfile
$env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
pnpm --filter app run package:win
```

`package:win` performs the following fail-closed sequence:

1. validates version, target, icon, ASAR, and file-allowlist policy;
2. creates the production renderer and main/preload bundles;
3. creates only the Windows x64 assisted NSIS installer;
4. inspects the unpacked application and ASAR before accepting the installer;
5. verifies executable and installer identity and unsigned status; and
6. writes `app/release/stage19-package-receipt.json`.

The builder is invoked with `--publish never`; GitHub Actions performs the only
artifact retention step, after installed lifecycle qualification succeeds.

The receipt contains source commit, version, architecture, filenames, byte
lengths, SHA-256 hashes, signature truth, manifest checks, and timestamps. It
must never contain manuscript prose, protected evidence, or credentials.

For an unpacked diagnostic build, use:

```powershell
$env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
pnpm --filter app run package:dir
```

The same preflight and unpacked-artifact verifier runs automatically. No
installer is accepted or uploaded unless the verifier passes.

## Packaged contents and runtime

ASAR remains enabled. Packaging uses an explicit allowlist containing only:

- the production renderer;
- compiled Electron main and preload files;
- production package metadata; and
- production runtime dependencies selected by the packager.

The installer excludes `sample_project`, protected evidence, Python sources and
requirements, development/test material, fixtures, source maps, portable
targets, update blockmaps, and unrelated repository resources.

The installed application always launches the dedicated Stage 19 two-window
host. Both renderers are sandboxed, context isolated, and denied Node
integration. The packaged runtime does not probe or launch legacy
Python/FastAPI services. Retained AI critique uses its direct main-process
gateway and is not part of offline core qualification.

Projects and Markdown exports remain outside the installation directory at
locations chosen by the user. Uninstall removes application files,
registration, and shortcuts while retaining external project data and the
Electron user-data directory.

## Qualification boundary

Package 19.19 qualification binds the installer filename and SHA-256 to one
exact source commit. The clean Windows workflow runs the fixed Stage 19
regression gate, verifies the artifact before installation, performs the
installed offline lifecycle smoke, and uninstalls in guaranteed cleanup.
Linux runs the same fixed Stage 19 regression for that commit.

Only the installer and machine-readable receipt are retained for the bounded
Package 19.20 handoff.
