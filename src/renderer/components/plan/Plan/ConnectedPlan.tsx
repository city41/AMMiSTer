import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
	loadDemoPlan,
	loadNewPlan,
	savePlanAs,
	setPlan,
	addItem,
	deleteItem,
	moveItem,
	addDirectory,
	directoryRename,
	toggleDirectoryExpansion,
} from '../../plan/planSlice';
import { AppState, dispatch } from '../../../store';

import { Plan } from './Plan';
import { PlanEmptyState } from './PlanEmptyState';

function ConnectedPlan() {
	const plan = useSelector((state: AppState) => state.plan.plan);

	async function handleNewPlan() {
		const catalog = await window.ipcAPI.getCurrentCatalog();
		if (!catalog) {
			alert('Please update first');
		} else {
			dispatch(loadNewPlan());
		}
	}

	useEffect(() => {
		window.ipcAPI.menu_loadDemoPlan(async () => {
			const catalog = await window.ipcAPI.getCurrentCatalog();
			if (!catalog) {
				alert('Please update first');
			} else {
				dispatch(loadDemoPlan());
			}
		});

		window.ipcAPI.menu_loadNewPlan(handleNewPlan);

		window.ipcAPI.menu_loadOpenedPlan(async (plan: Plan) => {
			dispatch(setPlan(plan));
		});

		window.ipcAPI.menu_savePlanAs(async (planPath: string) => {
			dispatch(savePlanAs(planPath));
		});
	}, []);

	function handleItemMove(args: {
		prevParentPath: string[];
		newParentPath: string[];
		name: string;
	}) {
		dispatch(moveItem(args));
	}

	function handleItemDelete(args: { parentPath: string[]; name: string }) {
		dispatch(deleteItem(args));
	}

	function handleDirectoryAdd(args: { parentPath: string[] }) {
		dispatch(addDirectory(args));
	}

	function handleToggleDirectoryExpansion(path: string[]) {
		dispatch(toggleDirectoryExpansion({ path }));
	}

	function handleDirectoryRename(args: {
		parentPath: string[];
		name: string;
		newName: string;
	}) {
		dispatch(directoryRename(args));
	}

	function handleItemAdd(args: {
		parentPath: string[];
		db_id: string;
		mraFileName: string;
	}) {
		dispatch(addItem(args));
	}

	if (plan) {
		return (
			<Plan
				plan={plan}
				onItemAdd={handleItemAdd}
				onItemDelete={handleItemDelete}
				onItemMove={handleItemMove}
				onDirectoryAdd={handleDirectoryAdd}
				onDirectoryRename={handleDirectoryRename}
				onToggleDirectoryExpansion={handleToggleDirectoryExpansion}
			/>
		);
	} else {
		return <PlanEmptyState onClick={handleNewPlan} />;
	}
}

export { ConnectedPlan };
