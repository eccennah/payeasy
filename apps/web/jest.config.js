/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
    testEnvironment: 'jsdom',
    preset: 'ts-jest',

    roots: ['<rootDir>/__tests__'],
    setupFilesAfterEnv: ['./jest.setup.js', '<rootDir>/__tests__/setup.ts'],

    // Merged both patterns so spec/test files and __tests__ folder files are both picked up
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
    ],

    // Ignore node_modules and fixture/helper dirs that don't define test cases
    testPathIgnorePatterns: [
        '/node_modules/',
        '/performance/',
        '<rootDir>/__tests__/fixtures/',
    ],

    collectCoverageFrom: [
        'lib/auth/**/*.ts',
        'app/api/auth/**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
    },

    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    },

    // Resolves deps from local and hoisted workspace root
    moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>/../../node_modules'],

    transform: {
        '^.+\\.(ts|tsx|js|mjs|jsx)$': ['ts-jest', {
            tsconfig: {
                jsx: 'react-jsx',
                module: 'commonjs',
                target: 'es2022',
                allowJs: true,
            },
        }],
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(@faker-js/faker)/)',
    ],
};

module.exports = config;