declare module '@ocalan/graceful' {
  interface GracefulOptions {
    servers?: Array<{ close(): unknown }>;
    mongooses?: Array<{ disconnect(): unknown }>;
    brees?: Array<{ stop(): unknown }>;
    customHandlers?: Array<() => unknown>;
  }
  export default class Graceful {
    constructor(options: GracefulOptions);
    listen(): void;
    exit(code: number | string): void;
  }
}
