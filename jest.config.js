/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  resetMocks: true,
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
