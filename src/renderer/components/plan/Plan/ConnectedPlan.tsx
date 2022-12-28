import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { loadDemoPlan } from '../../plan/planSlice';
import { AppState, dispatch } from '../../../store';

import { Plan } from './Plan';

function ConnectedPlan() {
	const plan = useSelector((state: AppState) => state.plan.plan);

	useEffect(() => {
		window.ipcAPI.loadDemoPlan(async () => {
			const catalog = await window.ipcAPI.getCurrentCatalog();
			if (!catalog) {
				alert('Please update first');
			} else {
				dispatch(loadDemoPlan());
			}
		});
	}, []);

	if (plan) {
		return <Plan plan={plan} />;
	} else {
		return null;
	}
}

export { ConnectedPlan };
