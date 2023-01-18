function batch<T>(romEntries: T[], batchSize = 4): T[][] {
	const batches: T[][] = [];

	while (romEntries.length > 0) {
		const batch = romEntries.splice(0, batchSize);
		batches.push(batch);
	}

	return batches;
}

export { batch };
