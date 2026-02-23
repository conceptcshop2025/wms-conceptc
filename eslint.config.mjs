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
  ]),
  // TypeScript best practices — bloquean el commit si no se cumplen
  {
    rules: {
      // Prohíbe el uso de `any` explícito
      "@typescript-eslint/no-explicit-any": "error",

      // Variables y parámetros sin usar (prefijo _ para ignorar intencionalmente)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Obliga a usar `import type` para importaciones de solo tipos
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // Prohíbe el operador de aserción no nula `!`
      "@typescript-eslint/no-non-null-assertion": "error",

      // Prohíbe deshabilitar TypeScript con comentarios @ts-*
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description" },
      ],

      // Evita redundancia en tipos que TypeScript ya infiere
      "@typescript-eslint/no-inferrable-types": "error",

      // Obliga a usar `as const` en lugar de casting literal
      "@typescript-eslint/prefer-as-const": "error",

      // Prohíbe el uso de la función constructora `Function`
      "@typescript-eslint/no-unsafe-function-type": "error",

      // Prohíbe arrays vacíos del tipo `{}`
      "@typescript-eslint/no-empty-object-type": "error",

      // Prohíbe wrappers de tipos primitivos (new String, new Number...)
      "@typescript-eslint/no-wrapper-object-types": "error",
    },
  },
]);

export default eslintConfig;
