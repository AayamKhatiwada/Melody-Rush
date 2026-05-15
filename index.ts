// Hermes (React Native) has no Web Worker API.
// mpg123-decoder defines `class MPEGDecoderWebWorker extends Worker` at module
// load time, so we stub Worker before anything else is required.
if (typeof (global as any).Worker === 'undefined') {
  (global as any).Worker = class MockWorker {
    constructor(_url?: any, _opts?: any) {}
    postMessage(_data?: any) {}
    terminate() {}
    addEventListener(_type?: string, _handler?: any) {}
    removeEventListener(_type?: string, _handler?: any) {}
    dispatchEvent(_event?: any) { return false; }
    onmessage: any = null;
    onerror: any = null;
  };
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
