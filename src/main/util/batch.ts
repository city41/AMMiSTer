function batch<T>(romEntries: T[], batchSize = 4): T[][] {
	// important to not mutate the arguments
	const romEntriesCopy = [...romEntries];
	const batches: T[][] = [];

	while (romEntriesCopy.length > 0) {
		const batch = romEntriesCopy.splice(0, batchSize);
		batches.push(batch);
	}

	return batches;
}

export { batch };
