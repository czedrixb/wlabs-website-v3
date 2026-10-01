import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Stale git worktrees checked out inside the repo (not part of this
    // project's source) — their own tailwind.config.ts otherwise trips
    // @typescript-eslint/no-require-imports and fails `pnpm lint`.
    ".claude/**",
  ]),
]);

export default eslintConfig;
