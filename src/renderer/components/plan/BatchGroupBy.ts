class BatchGroupBy {
	_group: number | null = null;

	start(group = Date.now()) {
		this._group = group;
	}

	end() {
		this._group = null;
	}

	init() {
		return () => this._group;
	}
}

export { BatchGroupBy };
