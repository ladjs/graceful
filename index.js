const { promisify } = require('util');
const stopAgenda = require('stop-agenda');
const debug = require('debug')('@ladjs/graceful');

class Graceful {
  constructor(config) {
    this.config = Object.assign(
      {
        server: false,
        redisClient: false,
        mongoose: false,
        agenda: false,
        logger: console,
        stopAgenda: {},
        timeoutMs: 5000
      },
      config
    );

    // shortcut logger
    this.logger = this.config.logger;

    // prevent multiple SIGTERM/SIGHUP/SIGINT from firing graceful exit
    this._isExiting = false;
  }

  listen() {
    // handle warnings
    process.on('warning', this.logger.warn.bind(this.logger));

    // handle uncaught promises
    process.on('unhandledRejection', this.logger.error.bind(this.logger));

    // handle uncaught exceptions
    process.on('uncaughtException', err => {
      this.logger.error(err);
      process.exit(1);
    });

    // handle windows support (signals not available)
    // <http://pm2.keymetrics.io/docs/usage/signals-clean-restart/#windows-graceful-stop>
    process.on('message', msg => {
      if (msg === 'shutdown') this.exit();
    });

    // handle graceful restarts
    process.on('SIGTERM', () => this.exit());
    process.on('SIGHUP', () => this.exit());
    process.on('SIGINT', () => this.exit());
  }

  exit() {
    const { server, redisClient, mongoose, agenda, timeoutMs } = this.config;

    if (this._isExiting) {
      debug('already in the process of a graceful exit');
      return;
    }

    this._isExiting = true;

    debug('graceful exit started');

    const promises = [];

    if (server) promises.push(promisify(server.close).bind(server));

    if (redisClient)
      promises.push(promisify(redisClient.quit).bind(redisClient));

    if (mongoose) {
      // we need to stop agenda and cancel recurring jobs
      // before shutting down our mongodb connection
      // otherwise cancellation wouldn't work gracefully
      if (agenda) {
        promises.push(
          new Promise(async (resolve, reject) => {
            try {
              try {
                await stopAgenda(agenda, this.config.stopAgenda);
              } catch (err) {
                this.logger.error(err);
              } finally {
                await mongoose.disconnect();
                resolve();
              }
            } catch (err) {
              reject(err);
            }
          })
        );
      } else {
        promises.push(mongoose.disconnect);
      }
    } else if (agenda) {
      promises.push(stopAgenda(agenda, this.config.stopAgenda));
    }

    // give it only X ms to gracefully shut down
    setTimeout(() => {
      this.logger.error(
        new Error(
          `graceful shutdown failed, timeout of ${timeoutMs} ms exceeded`
        )
      );
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }, timeoutMs);

    Promise.all(promises)
      .then(() => {
        this.logger.debug('gracefully shut down');
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0);
      })
      .catch(err => {
        this.logger.error(err);
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
      });
  }
}

module.exports = Graceful;
