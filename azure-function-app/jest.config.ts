import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    maxWorkers: 3,
    verbose: true,
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
};

export default config;
