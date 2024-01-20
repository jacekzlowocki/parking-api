/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  openHandlesTimeout: 2000,
  roots: ['<rootDir>/tests/'],
};
