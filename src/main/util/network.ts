import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import mkdirp from 'mkdirp';

async function downloadFile(url: string, localPath: string): Promise<void> {
	await mkdirp(path.dirname(localPath));
	return axios.get(url, { responseType: 'stream' }).then((response) => {
		if (response.status >= 400) {
			return Promise.reject(
				`Axios request failed with status ${response.status}`
			);
		}

		let errorOccured = false;

		return new Promise((resolve, reject) => {
			const writer = fs.createWriteStream(localPath);

			writer.on('error', (err) => {
				errorOccured = true;
				writer.close();
				reject(err);
			});

			writer.on('close', () => {
				if (!errorOccured) {
					resolve();
				}
			});

			response.data.pipe(writer);
		});
	});
}

export { downloadFile };
