interface Logger {
  info(): unknown;
  warn(): unknown;
  error(): unknown;
}

interface LilHttpTerminator {
  gracefulTerminationTimeout?: number;
  maxWaitTimeout?: number;
  logger?: Logger;
}

export interface GracefulOptions {
  servers?: Array<{ close(): unknown }>;
  brees?: Array<{ stop(): Promise<void> }>;
  redisClients?: Array<{ disconnect(): unknown }>;
  mongooses?: Array<{ disconnect(): Promise<void> }>;
  bulls?: Array<{ close(): unknown }>;
  customHandlers?: Array<() => unknown>;
  logger?: Logger;
  timeoutMs?: number;
  lilHttpTerminator?: LilHttpTerminator;
}

export default class Graceful {
  constructor(options?: GracefulOptions);
  listen(): void;
  exit(code: number | string): Promise<void>;
}
