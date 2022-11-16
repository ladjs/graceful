type Logger = {
  info(): unknown;
  warn(): unknown;
  error(): unknown;
};

type LilHttpTerminator = {
  gracefulTerminationTimeout?: number;
  maxWaitTimeout?: number;
  logger?: Logger;
};

export type GracefulOptions = {
  servers?: Array<{ close(): unknown }>;
  brees?: Array<{ stop(): Promise<void> }>;
  redisClients?: Array<{ disconnect(): unknown }>;
  mongooses?: Array<{ disconnect(): Promise<void> }>;
  customHandlers?: Array<() => unknown>;
  logger?: Logger;
  timeoutMs?: number;
  lilHttpTerminator?: LilHttpTerminator;
  ignoreHook?: string | boolean;
};

export default class Graceful {
  constructor(options?: GracefulOptions);
  listen(): void;
  exit(code: number | string): Promise<void>;
}
