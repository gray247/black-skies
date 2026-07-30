import { describe, expect, it } from "vitest";

// The verifier is deliberately executable as plain Node.js in clean packaging jobs.
// @ts-expect-error JavaScript verification module has no separate declaration file.
import {
  findForbiddenPackagePaths,
  readIcoSizes
} from "../../scripts/stage19-package-verify.mjs";

function icoDirectory(sizes: number[]): Buffer {
  const buffer = Buffer.alloc(6 + sizes.length * 16);
  buffer.writeUInt16LE(0, 0);
  buffer.writeUInt16LE(1, 2);
  buffer.writeUInt16LE(sizes.length, 4);
  sizes.forEach((size, index) => {
    const offset = 6 + index * 16;
    buffer[offset] = size === 256 ? 0 : size;
    buffer[offset + 1] = size === 256 ? 0 : size;
    buffer.writeUInt16LE(32, offset + 6);
  });
  return buffer;
}

describe("Stage 19 package artifact verifier", () => {
  it("rejects protected evidence, Python, source maps, credentials, and portable output", () => {
    expect(
      findForbiddenPackagePaths([
        "/sample_project/protected/file.bin",
        "/services/api.py",
        "/dist/main.js.map",
        "/dist/credentials.json",
        "/dist/session-token.txt",
        "/BlackSkies-Portable.exe",
        "/dist/index.html"
      ])
    ).toEqual([
      "/sample_project/protected/file.bin",
      "/services/api.py",
      "/dist/main.js.map",
      "/dist/credentials.json",
      "/dist/session-token.txt",
      "/BlackSkies-Portable.exe"
    ]);
  });

  it("accepts the strict production allowlist surfaces", () => {
    expect(
      findForbiddenPackagePaths([
        "/dist/index.html",
        "/dist/assets/index.js",
        "/dist-electron/main/main.js",
        "/dist-electron/main/stage19Preload.js",
        "/package.json"
      ])
    ).toEqual([]);
  });

  it("recognizes the complete Windows icon resolution set", () => {
    expect(readIcoSizes(icoDirectory([16, 24, 32, 48, 64, 128, 256]))).toEqual(
      [16, 24, 32, 48, 64, 128, 256].map((size) => ({
        width: size,
        height: size,
        bitDepth: 32
      }))
    );
  });
});
