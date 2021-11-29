export interface GracefulOptions {
  servers?: Array<{ close(): unknown }>;
  mongooses?: Array<{ disconnect(): Promise<void> }>;
  bulls?: Array<{ close(): unknown }>;
  brees?: Array<{ stop(): Promise<void> }>;
  redisClients?: Array<{ disconnect(): unknown }>;
  customHandlers?: Array<() => unknown>;
  timeoutMs?: number;
  logger?: {
    info(): unknown;
    warn(): unknown;
    error(): unknown;
  };
}

export default class Graceful {
  constructor(options?: GracefulOptions);
  listen(): void;
  exit(code: number | string): Promise<void>;
}
