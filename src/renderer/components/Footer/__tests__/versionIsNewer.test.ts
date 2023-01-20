import { versionIsNewer } from '../versionIsNewer';

describe('versionIsNewer', function () {
	it('should fallback to false when the main version is missing', function () {
		expect(versionIsNewer('', '0.0.3')).toBe(false);
		expect(versionIsNewer(null, '0.0.3')).toBe(false);
		expect(versionIsNewer(undefined, '0.0.3')).toBe(false);
	});

	it('should work for simple cases', function () {
		expect(versionIsNewer('0.0.2', '0.0.1')).toBe(true);
		expect(versionIsNewer('0.2.2', '0.1.2')).toBe(true);
		expect(versionIsNewer('0.3.0', '0.2.1')).toBe(true);
		expect(versionIsNewer('1.0.0', '0.99.1')).toBe(true);

		expect(versionIsNewer('0.0.2', '0.0.3')).toBe(false);
		expect(versionIsNewer('0.2.2', '0.4.2')).toBe(false);
		expect(versionIsNewer('0.3.0', '1.2.1')).toBe(false);
		expect(versionIsNewer('12.0.0', '24.99.1')).toBe(false);
	});

	it('should work for release candidates', function () {
		expect(versionIsNewer('1.0.0-rc.2', '1.0.0-rc.1')).toBe(true);

		expect(versionIsNewer('1.0.0-rc.2', '1.0.0-rc.4')).toBe(false);

		expect(versionIsNewer('2.0.0-rc.2', '1.0.0')).toBe(true);
	});
});
