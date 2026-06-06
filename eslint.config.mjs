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
    // Project ignores:
    ".old-frontend/**",
  ]),
  {
    rules: {
      // Allow underscore-prefixed args to be unused (TanStack Query mutation stubs).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // The user's existing components use raw apostrophes/quotes; visually fine.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
