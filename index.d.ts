declare module '@ocalan/graceful' {
  interface GracefulOptions {
    servers?: Array<{ close(): unknown }>;
    mongooses?: Array<{ disconnect(): unknown }>;
    bulls?: Array<{ close(): unknown }>;
    brees?: Array<{ stop(): unknown }>;
    redisClients?: Array<{ disconnect(): unknown }>;
    customHandlers?: Array<() => unknown>;
  }
  export default class Graceful {
    constructor(options: GracefulOptions);
    listen(): void;
    exit(code: number | string): void;
  }
}
