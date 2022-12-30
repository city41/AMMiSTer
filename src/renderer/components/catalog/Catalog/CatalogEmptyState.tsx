import React from 'react';

type CatalogEmptyStateProps = {
	onClick: () => void;
};

function CatalogEmptyState({ onClick }: CatalogEmptyStateProps) {
	return (
		<div className="w-full h-full border-l border-gray-300 flex flex-col items-center justify-start p-8 gap-y-4 bg-white">
			<div className="text-gray-800 text-lg font-medium">No Catalog</div>
			<button
				type="button"
				onClick={onClick}
				className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm shadow-sm bg-indigo-600 text-white"
			>
				Build Catalog
			</button>
		</div>
	);
}

export { CatalogEmptyState };
