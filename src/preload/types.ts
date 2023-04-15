// import { Settings, SettingsValue } from 'src/main/settings/types';
// import { Catalog, UpdateCallback } from 'src/main/catalog/types';
// import { FileClientConnectConfig } from 'src/main/export/types';
// import { Plan } from 'src/main/plan/types';

export interface RPCRenderer {
	getVersion(): Promise<string>;
}
