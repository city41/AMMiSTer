import React, { Component, ErrorInfo, ReactNode } from 'react';

type ErrorBoundaryProps = {
	children?: ReactNode;
};

type ErrorBoundaryState = {
	hasError: boolean;
	stack?: string;
	message?: string;
};

const ISSUES_URL = 'https://github.com/city41/AMMiSTer/issues';

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	public state: ErrorBoundaryState = {
		hasError: false,
	};

	public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		// Update state so the next render will show the fallback UI.
		return { hasError: true, stack: error.stack, message: error.message };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('Uncaught error:', error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div className="px-16 py-8 flex flex-col gap-y-4">
					<h1 className="text-lg font-bold">Unexpected Error</h1>
					<p className="-mx-8 p-8 bg-red-100">
						Something unexpected happened. Try closing the app and relaunching
						it. If it keeps happening, please{' '}
						<a
							className="text-blue-600 underline curosr-pointer"
							href={ISSUES_URL}
							target="_blank"
							rel="noreferrer"
						>
							file an issue
						</a>
						, and add all the text here.
					</p>
					<div className="mt-16">{this.state.message}</div>
					<div>
						<pre>{this.state.stack}</pre>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export { ErrorBoundary };
