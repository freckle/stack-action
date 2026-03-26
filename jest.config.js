import { createDefaultPreset } from "ts-jest";

const presetConfig = createDefaultPreset();

const jestConfig = {
  ...presetConfig,
  resetMocks: true,
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};

export default jestConfig;
