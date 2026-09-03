import { HostToWebviewMessage, WebviewToHostMessage } from '../../src/common/types';

interface VsCodeApi<T = unknown> {
  postMessage(message: unknown): void;
  getState(): T | undefined;
  setState(state: T): void;
}

declare function acquireVsCodeApi<T = unknown>(): VsCodeApi<T>;

class VsCodeWrapper {
  private readonly vscode: VsCodeApi;

  constructor() {
    if (typeof acquireVsCodeApi === 'function') {
      this.vscode = acquireVsCodeApi();
    } else {
      // Fallback for standalone browser testing outside VS Code
      this.vscode = {
        postMessage: (msg: unknown) => {
          console.log('[Dev Webview -> Host]', msg);
        },
        getState: () => undefined,
        setState: () => {},
      };
    }
  }

  public postMessage(message: WebviewToHostMessage): void {
    this.vscode.postMessage(message);
  }

  public onMessage(handler: (message: HostToWebviewMessage) => void): () => void {
    const listener = (event: MessageEvent) => {
      const data = event.data as HostToWebviewMessage;
      if (data && data.type) {
        handler(data);
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }
}

export const vscode = new VsCodeWrapper();
