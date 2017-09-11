# [**@ladjs/graceful**](https://github.com/ladjs/graceful)

[![build status](https://img.shields.io/travis/ladjs/graceful.svg)](https://travis-ci.org/ladjs/graceful)
[![code coverage](https://img.shields.io/codecov/c/github/ladjs/graceful.svg)](https://codecov.io/gh/ladjs/graceful)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/graceful.svg)](<>)

> Gracefully exit server (Koa), database (Mongo/Mongoose), and job scheduler (Agenda)


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install @ladjs/graceful
```

[yarn][]:

```sh
yarn add @ladjs/graceful
```


## Usage

Using this package will bind process event listeners when `graceful.listen()` is called:

* `process.on('warning')` - will output via `config.logger.warn`
* `process.on('unhandledRejection')` - will output via `config.logger.error`
* `process.on('uncaughtException')` - will output via `config.logger.error` and `process.exit(1)`
* `process.on('message')` - support Windows (e.g. signals not available) and listen for message of `shutdown` and then exit gracefully
* `process.on('SIGTERM')` - will exit gracefully
* `process.on('SIGHUP')` - will exit gracefully
* `process.on('SIGINT')` - will exit gracefully

This package also prevents multiple process/SIG events from triggering multiple graceful exits. Only one graceful exit can occur at a time.

An example below shows usage showing `server`, `redisClient`, `mongoose`, and `agenda` options all being passed.

Please note that NONE of these are required, as each one is completely optional and independent.

However if you have both `mongoose` and `agenda` defined, it knows to stop `agenda` first using [stop-agenda][], then disconnect `mongoose`.

```js
const http = require('http');

const Graceful = require('@ladjs/graceful');
const Mongoose = require('@ladjs/mongoose');
const Koa = require('koa');
const redis = require('redis');
const Agenda = require('agenda');

const app = new Koa();
const agenda = new Agenda();

let server = http.createServer(app.callback());
server = server.listen();

const redisClient = redis.createClient();

const mongoose = new Mongoose({ agenda }).mongoose;

const graceful = new Graceful({

  // uses `server.close` for graceful exit
  server,

  // uses `redisClient.quit` for graceful exit
  redisClient,

  // uses `mongoose.disconnect` for graceful exit
  mongoose,

  // uses `stop-agenda` package for graceful exit
  agenda,

  // default logger (you can also use `new Logger()` from @ladjs/logger)
  logger: console,

  // options get passed to `stop-agenda`
  // <https://github.com/ladjs/stop-agenda>
  stopAgenda: {},

  // max time allowed in ms for graceful exit
  timeoutMs: 5000
});

graceful.listen();
```


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **Nick Baugh** | <http://niftylettuce.com/> |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com/)


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/

[stop-agenda]: https://github.com/ladjs/stop-agenda
