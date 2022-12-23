// eslint-disable-next-line import/no-extraneous-dependencies
import { contextBridge } from 'electron';
import { ipcAPI } from './ipcAPI';

contextBridge.exposeInMainWorld('ipcAPI', ipcAPI);
