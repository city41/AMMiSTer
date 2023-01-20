import { compareVersions } from 'compare-versions';

function versionIsNewer(
	mainVersion: string | null | undefined,
	localVersion: string
): boolean {
	if (!mainVersion || !mainVersion.trim()) {
		return false;
	}

	return compareVersions(mainVersion, localVersion) > 0;
}

export { versionIsNewer };
