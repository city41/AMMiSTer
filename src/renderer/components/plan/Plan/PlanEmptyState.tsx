import React from 'react';
import { NewPlanIcon } from 'src/renderer/icons';

type PlanEmptyStateProps = {
	onClick: () => void;
};

function PlanEmptyState({ onClick }: PlanEmptyStateProps) {
	return (
		<div className="w-full h-full p-16">
			<div className="w-full h-48 rounded border-dashed border-2 bg-white p-8 flex flex-col justify-center items-center">
				<NewPlanIcon
					className="w-8 h-8 text-gray-600 hover:bg-green-100 cursor-pointer rounded"
					onClick={onClick}
				/>
				<div className="text-gray-800">Create a new plan</div>
			</div>
		</div>
	);
}

export { PlanEmptyState };
