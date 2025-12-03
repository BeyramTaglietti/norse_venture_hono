import js from "@eslint/js";
import drizzle from "eslint-plugin-drizzle";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  { ignores: ["build"] },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js, drizzle },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node,
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      ...drizzle.configs.recommended.rules,
    },
  },
  tseslint.configs.recommended,
]);
