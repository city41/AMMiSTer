import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import mkdirp from 'mkdirp';

axiosRetry(axios, {
	retries: 2,
	retryDelay(retryCount) {
		return retryCount * 1500;
	},
});

async function downloadFile(
	url: string,
	localPath: string,
	expectedContentType?: string
): Promise<void> {
	await mkdirp(path.dirname(localPath));
	return axios.get(url, { responseType: 'stream' }).then((response) => {
		if (response.status >= 400) {
			return Promise.reject(
				`Axios request failed with status ${response.status}`
			);
		}

		const contentType = response.headers['content-type'];
		if (expectedContentType && contentType !== expectedContentType) {
			return Promise.reject(
				`Axios request expected content-type ${expectedContentType}, but got ${contentType}`
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
