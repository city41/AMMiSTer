import { convertFileNameDate } from './fs';
import path from './universalPath';

export function getDatedFilenamePathComponents(fileName: string): {
	fileNameBase: string;
	extension: string;
	date: Date;
} | null {
	const split = path.parse(fileName).name.split('_');
	const date = convertFileNameDate(split[split.length - 1]);

	if (!date) {
		return null;
	}

	split.pop();

	return {
		fileNameBase: split.join('_'),
		extension: path.extname(fileName),
		date,
	};
}
