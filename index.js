const http = require('http');
const net = require('net');
const process = require('process');
const util = require('util');

const isPromise = require('p-is-promise');
const HttpTerminator = require('lil-http-terminator');

const debug = util.debuglog('@ladjs/graceful');

class Graceful {
  constructor(config) {
    this.config = {
      servers: [],
      brees: [],
      redisClients: [],
      mongooses: [],
      customHandlers: [],
      logger: console,
      timeoutMs: 5000,
      lilHttpTerminator: {},
      ...config
    };

    // noop logger if false
    if (this.config.logger === false)
      this.config.logger = {
        info() {},
        warn() {},
        error() {}
      };

    // shortcut logger
    this.logger = this.config.logger;

    // if lilHttpTerminator does not have a logger set then re-use `this.logger`
    if (!this.config.lilHttpTerminator.logger)
      this.config.lilHttpTerminator.logger = this.logger;

    // prevent multiple SIGTERM/SIGHUP/SIGINT from firing graceful exit
    this._isExiting = false;

    //
    // create instances of HTTP terminator in advance for faster shutdown
    //
    for (const server of this.config.servers) {
      // backwards compatible support (get the right http or net server object instance)
      let serverInstance = server;
      if (serverInstance.server instanceof net.Server)
        serverInstance = serverInstance.server;
      else if (!(serverInstance instanceof net.Server))
        throw new Error('Servers passed must be instances of net.Server');

      if (serverInstance instanceof http.Server) {
        server.terminator = new HttpTerminator({
          server: serverInstance,
          ...this.config.lilHttpTerminator
        });
      }
    }

    // bind this to everything
    this.listen = this.listen.bind(this);
    this.stopServer = this.stopServer.bind(this);
    this.stopServers = this.stopServers.bind(this);
    this.stopRedisClient = this.stopRedisClient.bind(this);
    this.stopRedisClients = this.stopRedisClients.bind(this);
    this.stopMongoose = this.stopMongoose.bind(this);
    this.stopMongooses = this.stopMongooses.bind(this);
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
    // <https://nodejs.org/api/process.html#event-unhandledrejection>
    process.on('unhandledRejection', (err) => {
      // we don't want to log here, we want to throw the error
      // so that processes exit or bubble up to middleware error handling
      // we need to support listening to unhandledRejections (backward compatibility)
      // (even though node is deprecating this in future versions)
      // <https://developer.ibm.com/blogs/nodejs-15-release-blog/>
      throw err;
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

  async stopServer(server, code) {
    try {
      if (server.terminator) {
        // HTTP servers
        debug('server.terminator');
        const { error } = await server.terminator.terminate();
        if (error) throw error;
      } else if (server.stop) {
        // support for `stoppable`
        debug('server.stop');
        await (isPromise(server.stop)
          ? server.stop()
          : util.promisify(server.stop).bind(server)());
      } else if (server.close) {
        // all other servers (e.g. SMTP)
        debug('server.close');
        await (isPromise(server.close)
          ? server.close()
          : util.promisify(server.close).bind(server)());
      }
    } catch (err) {
      this.logger.error(err, { code });
    }
  }

  async stopServers(code) {
    await Promise.all(
      this.config.servers.map((server) => this.stopServer(server, code))
    );
  }

  async stopRedisClient(client, code) {
    if (client.status === 'end') return;
    try {
      await client.disconnect();
    } catch (err) {
      this.logger.error(err, { code });
    }
  }

  async stopRedisClients(code) {
    await Promise.all(
      this.config.redisClients.map((client) =>
        this.stopRedisClient(client, code)
      )
    );
  }

  async stopMongoose(mongoose, code) {
    try {
      await mongoose.disconnect();
    } catch (err) {
      this.logger.error(err, { code });
    }
  }

  async stopMongooses(code) {
    await Promise.all(
      this.config.mongooses.map((mongoose) => this.stopMongoose(mongoose, code))
    );
  }

  async stopBree(bree, code) {
    try {
      await bree.stop();
    } catch (err) {
      this.logger.error(err, { code });
    }
  }

  async stopBrees(code) {
    await Promise.all(
      this.config.brees.map((bree) => this.stopBree(bree, code))
    );
  }

  async stopCustomHandler(handler, code) {
    try {
      await handler();
    } catch (err) {
      this.logger.error(err, { code });
    }
  }

  stopCustomHandlers(code) {
    return Promise.all(
      this.config.customHandlers.map((handler) =>
        this.stopCustomHandler(handler, code)
      )
    );
  }

  async exit(code) {
    if (code) this.logger.info('Gracefully exiting', { code });

    if (this._isExiting) {
      this.logger.info('Graceful exit already in progress', { code });
      return;
    }

    this._isExiting = true;

    // give it only X ms to gracefully exit
    setTimeout(() => {
      this.logger.error(
        new Error(
          `Graceful exit failed, timeout of ${this.config.timeoutMs}ms was exceeded`
        ),
        { code }
      );
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }, this.config.timeoutMs);

    try {
      await Promise.all([
        // servers
        this.stopServers(code),
        // redisClients
        this.stopRedisClients(code),
        // mongooses
        this.stopMongooses(code),
        // brees
        this.stopBrees(code),
        // custom handlers
        this.stopCustomHandlers(code)
      ]);
      this.logger.info('Gracefully exited', { code });
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0);
    } catch (err) {
      this.logger.error(err, { code });
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }
  }
}

module.exports = Graceful;
