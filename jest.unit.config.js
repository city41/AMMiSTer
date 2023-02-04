module.exports = {
	roots: ['<rootDir>/src'],
	testRegex: '/__unit__/.*unit\\.ts$',
	preset: 'ts-jest',
	testEnvironment: 'node',
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.jest.json',
		},
	},
};
