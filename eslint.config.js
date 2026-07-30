import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: repoRoot,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      "**/dist/**",
      "**/dist-electron/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/release/**",
      "**/test-results/**",
      "**/playwright-report/**",
    ],
  },
  ...compat.config({
    env: {
      es2022: true,
      node: true,
    },
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    overrides: [
      {
        files: ["app/**/*.{ts,tsx,js,jsx}"],
        parser: "@typescript-eslint/parser",
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          ecmaFeatures: {
            jsx: true,
          },
        },
        plugins: ["@typescript-eslint", "react", "react-hooks", "jsx-a11y"],
        extends: [
          "eslint:recommended",
          "plugin:@typescript-eslint/recommended",
          "plugin:react/recommended",
          "plugin:react-hooks/recommended-legacy",
          "plugin:jsx-a11y/recommended",
          "plugin:react/jsx-runtime",
          "prettier",
        ],
        settings: {
          react: {
            version: "detect",
          },
        },
        rules: {
          "react/react-in-jsx-scope": "off",
          "jsx-a11y/no-noninteractive-tabindex": [
            "error",
            {
              tags: ["main"],
              roles: ["tabpanel"],
              allowExpressionValues: true,
            },
          ],
        },
      },
    ],
  }),
];
