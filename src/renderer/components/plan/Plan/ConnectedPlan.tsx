import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
	loadOpenedPlan,
	loadDemoPlan,
	loadNewPlan,
	savePlanAs,
	savePlan,
	addItem,
	deleteItem,
	deleteAllMissingGamesInDirectory,
	moveItem,
	addDirectory,
	planRename,
	directoryRename,
	toggleDirectoryExpansion,
	undo,
	redo,
} from '../../plan/planSlice';
import { AppState, dispatch } from '../../../store';

import { Plan } from './Plan';
import { PlanEmptyState } from './PlanEmptyState';
import { BulkAddModal } from '../BulkAddModal';

function ConnectedPlan() {
	const plan = useSelector((state: AppState) => state.plan.present.plan);
	const isDirty = useSelector((state: AppState) => state.plan.present.isDirty);
	const [bulkAddDestination, setBulkAddDestination] = useState<string | null>(
		null
	);
	const [bulkAddInvocationCount, setBulkAddInvocationCount] = useState(0);

	async function handleNewPlan() {
		const catalog = await window.ipcAPI.getCurrentCatalog();
		if (!catalog) {
			alert('Please build a catalog first');
		} else {
			dispatch(loadNewPlan());
		}
	}

	useEffect(() => {
		window.ipcAPI.menu_undo(() => {
			dispatch(undo());
		});

		window.ipcAPI.menu_redo(() => {
			dispatch(redo());
		});

		window.ipcAPI.menu_loadDemoPlan(async () => {
			const catalog = await window.ipcAPI.getCurrentCatalog();
			if (!catalog) {
				alert('Please build a catalog first');
			} else {
				dispatch(loadDemoPlan());
			}
		});

		window.ipcAPI.menu_loadNewPlan(handleNewPlan);

		window.ipcAPI.menu_loadOpenedPlan(async (plan: Plan) => {
			if (!plan) {
				alert(
					'This plan could not be found, or the file is not an AMMiSter plan'
				);
			} else {
				dispatch(loadOpenedPlan(plan));
			}
		});

		window.ipcAPI.menu_savePlanAs(async () => {
			dispatch(savePlanAs());
		});

		window.ipcAPI.menu_savePlan(async () => {
			dispatch(savePlan());
		});
		window.ipcAPI.noPlan(() => {
			dispatch(loadOpenedPlan(null));
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

	function handlePlanRename(name: string) {
		dispatch(planRename(name));
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

	function handleBulkAdd(planPath: string) {
		setBulkAddDestination(planPath);
		setBulkAddInvocationCount((c) => c + 1);
	}

	function handleBulkRemoveMissing(args: { parentPath: string[] }) {
		dispatch(deleteAllMissingGamesInDirectory(args));
	}

	// if plan is undefined, then main is still loading it,
	// since this will only take a couple seconds at most, the
	// "loading state" is just blank
	if (plan === undefined) {
		return null;
	}

	// either plan is an object or null at this point, if null,
	// then <Plan /> will show the blank slate

	return (
		<>
			<Plan
				plan={plan}
				isDirty={isDirty}
				onItemAdd={handleItemAdd}
				onItemDelete={handleItemDelete}
				onItemMove={handleItemMove}
				onDirectoryAdd={handleDirectoryAdd}
				onPlanRename={handlePlanRename}
				onDirectoryRename={handleDirectoryRename}
				onToggleDirectoryExpansion={handleToggleDirectoryExpansion}
				onBulkAdd={handleBulkAdd}
				onBulkRemoveMissing={handleBulkRemoveMissing}
			/>
			{!plan && <PlanEmptyState onClick={handleNewPlan} />}
			<BulkAddModal
				key={String(bulkAddDestination) + bulkAddInvocationCount.toString()}
				isOpen={bulkAddDestination !== null}
				destination={bulkAddDestination ?? ''}
				onClose={() => {
					setBulkAddDestination(null);
					setBulkAddInvocationCount((c) => c + 1);
				}}
			/>
		</>
	);
}

export { ConnectedPlan };
