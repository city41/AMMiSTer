// eslint-disable-next-line import/no-extraneous-dependencies
import { contextBridge } from 'electron';
import { ipcAPI } from '_preload/ipcAPI';

contextBridge.exposeInMainWorld('ipcAPI', ipcAPI);
