import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Disable rules that conflict with Prettier
  prettier,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "package-lock.json",
    ],
  },
  // Test files: relax Next.js specific DOM rules
  {
    files: ["**/__tests__/**", "tests-e2e/**"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
