module.exports = {
	roots: ['<rootDir>/src'],
	testRegex: '/__integration__/.*integration\\.ts$',
	preset: 'ts-jest',
	testEnvironment: 'node',
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.jest.json',
		},
	},
};
