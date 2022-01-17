const process = require('process');
const debug = require('debug')('@ladjs/graceful');

class Graceful {
  constructor(config) {
    this.config = {
      servers: [],
      redisClients: [],
      mongooses: [],
      bulls: [],
      brees: [],
      customHandlers: [],
      logger: console,
      timeoutMs: 5000,
      ...config
    };

    // shortcut logger
    this.logger = this.config.logger;

    // prevent multiple SIGTERM/SIGHUP/SIGINT from firing graceful exit
    this._isExiting = false;

    // bind this to everything
    this.listen = this.listen.bind(this);
    this.stopServer = this.stopServer.bind(this);
    this.stopServers = this.stopServers.bind(this);
    this.stopRedisClient = this.stopRedisClient.bind(this);
    this.stopRedisClients = this.stopRedisClients.bind(this);
    this.stopMongoose = this.stopMongoose.bind(this);
    this.stopMongooses = this.stopMongooses.bind(this);
    this.stopBull = this.stopBull.bind(this);
    this.stopBulls = this.stopBulls.bind(this);
    this.stopBree = this.stopBree.bind(this);
    this.stopBrees = this.stopBrees.bind(this);
    this.stopCustomHandler = this.stopCustomHandler.bind(this);
    this.stopCustomHandlers = this.stopCustomHandlers.bind(this);
    this.exit = this.exit.bind(this);
  }

  listen() {
    // handle warnings
    process.on('warning', (warning) => {
      // <https://github.com/pinojs/pino/issues/833#issuecomment-625192482>
      warning.emitter = null;
      this.logger.warn(warning);
    });

    // handle uncaught promises
    process.on('unhandledRejection', (err) => {
      this.logger.error(err);
    });

    // handle uncaught exceptions
    process.once('uncaughtException', (err) => {
      this.logger.error(err);
      process.exit(1);
    });

    // handle windows support (signals not available)
    // <http://pm2.keymetrics.io/docs/usage/signals-clean-restart/#windows-graceful-stop>
    process.on('message', async (message) => {
      if (message === 'shutdown') {
        this.logger.info('Received shutdown message');
        await this.exit();
      }
    });

    // handle graceful restarts
    // support nodemon (SIGUSR2 as well)
    // <https://github.com/remy/nodemon#controlling-shutdown-of-your-script>
    for (const sig of ['SIGTERM', 'SIGHUP', 'SIGINT', 'SIGUSR2']) {
      process.once(sig, async () => {
        await this.exit(sig);
      });
    }
  }

  async stopServer(server) {
    try {
      await server.close();
    } catch (err) {
      this.config.logger.error(err);
    }
  }

  async stopServers() {
    await Promise.all(
      this.config.servers.map((server) => this.stopServer(server))
    );
  }

  async stopRedisClient(client) {
    if (client.status === 'end') return;
    // TODO: give it a max of 500ms
    // https://github.com/OptimalBits/bull/blob/develop/lib/queue.js#L516
    try {
      await client.disconnect();
    } catch (err) {
      this.config.logger.error(err);
    }
  }

  async stopRedisClients() {
    await Promise.all(
      this.config.redisClients.map((client) => this.stopRedisClient(client))
    );
  }

  async stopMongoose(mongoose) {
    try {
      await mongoose.disconnect();
    } catch (err) {
      this.config.logger.error(err);
    }
  }

  async stopMongooses() {
    await Promise.all(
      this.config.mongooses.map((mongoose) => this.stopMongoose(mongoose))
    );
  }

  async stopBull(bull) {
    try {
      await bull.close();
    } catch (err) {
      this.config.logger.error(err);
    }
  }

  async stopBulls() {
    await Promise.all(this.config.bulls.map((bull) => this.stopBull(bull)));
  }

  async stopBree(bree) {
    try {
      await bree.stop();
    } catch (err) {
      this.config.logger.error(err);
    }
  }

  async stopBrees() {
    await Promise.all(this.config.brees.map((bree) => this.stopBree(bree)));
  }

  async stopCustomHandler(handler) {
    try {
      await handler();
    } catch (err) {
      this.config.logger.error(err);
    }
  }

  stopCustomHandlers() {
    return Promise.all(
      this.config.customHandlers.map((handler) =>
        this.stopCustomHandler(handler)
      )
    );
  }

  async exit(code) {
    if (code) this.logger.info(`Gracefully exiting from ${code}`);

    if (this._isExiting) {
      this.logger.info('Graceful exit already in progress');
      return;
    }

    this._isExiting = true;

    debug('graceful exit started');

    // give it only X ms to gracefully exit
    setTimeout(() => {
      this.logger.error(
        new Error(
          `Graceful exit failed, timeout of ${this.config.timeoutMs}ms was exceeded`
        )
      );
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }, this.config.timeoutMs);

    try {
      await Promise.all([
        // servers
        this.stopServers(),
        // redisClients
        this.stopRedisClients(),
        // mongooses
        this.stopMongooses(),
        // bulls
        this.stopBulls(),
        // brees
        this.stopBrees(),
        // custom handlers
        this.stopCustomHandlers()
      ]);
      this.logger.info('Gracefully exited');
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0);
    } catch (err) {
      this.logger.error(err);
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }
  }
}

module.exports = Graceful;
