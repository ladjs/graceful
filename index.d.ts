declare module '@ocalan/graceful' {
  interface GracefulOptions {
    servers?: Array<{ close(): any }>;
    mongooses?: Array<{ disconnect(): any }>;
    brees?: Array<{ stop(): any }>;
    customHandlers?: Array<() => any>;
  }
  export default class Graceful {
    constructor(options: GracefulOptions);
    listen(): void;
    exit(code: number | string): void;
  }
}
