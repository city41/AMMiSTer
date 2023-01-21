import '../src/renderer/renderer.css';
import 'react-sortable-tree/style.css';
import 'react-toggle/style.css';

export const parameters = {
	actions: { argTypesRegex: '^on[A-Z].*' },
	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/,
		},
	},
};
