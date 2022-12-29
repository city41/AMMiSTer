import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { loadDemoPlan, loadNewPlan, setPlan } from '../../plan/planSlice';
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
		window.ipcAPI.loadDemoPlan(async () => {
			const catalog = await window.ipcAPI.getCurrentCatalog();
			if (!catalog) {
				alert('Please update first');
			} else {
				dispatch(loadDemoPlan());
			}
		});

		window.ipcAPI.loadNewPlan(handleNewPlan);

		window.ipcAPI.loadOpenedPlan(async (plan: Plan) => {
			dispatch(setPlan(plan));
		});
	}, []);

	if (plan) {
		return <Plan key={plan.name + plan.createdAt} plan={plan} />;
	} else {
		return <PlanEmptyState onClick={handleNewPlan} />;
	}
}

export { ConnectedPlan };
