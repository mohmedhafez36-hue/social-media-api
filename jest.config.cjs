const { createDefaultEsmPreset } = require("ts-jest");

const tsJestEsmPreset = createDefaultEsmPreset();

/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",

  ...tsJestEsmPreset,

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};