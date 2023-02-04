import React from 'react';

function CatalogLoading() {
	return (
		<div className="fixed top-0 left-0 z-50 w-screen h-screen overflow-hidden grid place-items-center">
			<div className="flex flex-col items-center">
				<h1 className="font-medium">Catalog Loading...</h1>
				<p className="text-sm text-gray-600">Verifying all game files are ok</p>
			</div>
		</div>
	);
}

export { CatalogLoading };
