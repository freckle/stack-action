import { createDefaultPreset, type JestConfigWithTsJest } from "ts-jest";

const presetConfig = createDefaultPreset({
  isolatedModules: true,
});

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  resetMocks: true,
  testEnvironment: "node",
};

export default jestConfig;
