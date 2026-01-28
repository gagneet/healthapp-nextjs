import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "prisma/generated/**",
      "scripts/**",
      "tests/**",
      "archive/**",
      "logs/**",
      "coverage/**",
      "test-patient-creation.js",
      "tailwind.config.js",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "warn",
      "import/no-anonymous-default-export": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
