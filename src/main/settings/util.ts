import { UpdateDbConfig } from './types';

export function areAllNonDependentDbsEnabled(
	updateDbs: UpdateDbConfig[]
): boolean {
	return updateDbs
		.filter((udb) => !udb.isDependent)
		.every((udb) => udb.enabled);
}
