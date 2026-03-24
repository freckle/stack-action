import { createDefaultPreset, type JestConfigWithTsJest } from "ts-jest";

const presetConfig = createDefaultPreset();

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  resetMocks: true,
  testEnvironment: "node",
};

export default jestConfig;
