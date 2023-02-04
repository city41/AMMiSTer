module.exports = {
	roots: ['<rootDir>/src'],
	testRegex: '/__integration__/.*integration\\.ts$',
	preset: 'ts-jest',
	testEnvironment: 'node',
	testTimeout: 5 * 60 * 1000,
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.jest.json',
		},
	},
};
