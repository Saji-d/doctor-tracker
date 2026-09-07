/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/__tests__/env.setup.ts"],
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],
  testTimeout: 30000,
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
