import { contextBridge } from 'electron';
import { ipcAPI } from './ipcAPI';

contextBridge.exposeInMainWorld('ipcAPI', ipcAPI);
