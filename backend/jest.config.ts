import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    // Match files in __tests__ folders or .test.ts files
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    // Setup module aliases (if you use @/utils etc.)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // Coverage reporting
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;