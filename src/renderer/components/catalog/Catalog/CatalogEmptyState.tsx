import React from 'react';
import { Button } from '../../Button';

type CatalogEmptyStateProps = {
	onClick: () => void;
};

function CatalogEmptyState({ onClick }: CatalogEmptyStateProps) {
	return (
		<div className="w-full h-full border-l border-gray-300 flex flex-col items-center justify-start p-8 gap-y-4 bg-white">
			<div className="text-gray-800 text-lg font-medium">No Catalog</div>
			<Button onClick={onClick}>Build Catalog</Button>
		</div>
	);
}

export { CatalogEmptyState };
