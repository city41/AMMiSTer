module.exports = {
	roots: ['<rootDir>/src'],
	testRegex: '(/__tests__/.*|(\\.|/)test)\\.tsx?$',
	preset: 'ts-jest',
	testEnvironment: 'node',
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.jest.json',
		},
	},
};
