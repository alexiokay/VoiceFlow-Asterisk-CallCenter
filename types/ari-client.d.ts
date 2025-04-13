declare module 'ari-client' {
  export interface AriClient {
    on(event: string, callback: (event: any, ...args: any[]) => void): void;
    start(appName: string): void;
    channels: {
      originate(params: any, callback: (err: Error | null, channel: any) => void): void;
    };
  }

  export function connect(
    url: string,
    username: string,
    password: string,
    callback: (err: Error | null, client: AriClient) => void
  ): void;
} 