# [**@ladjs/graceful**](https://github.com/ladjs/graceful)

[![build status](https://github.com/ladjs/graceful/actions/workflows/ci.yml/badge.svg)](https://github.com/ladjs/graceful/actions/workflows/ci.yml)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/graceful.svg)]()

> Gracefully exit HTTP servers (Express/Koa/Fastify/etc), databases (Mongo/Mongoose), Redis clients, [Bree][] job schedulers, and custom handlers.


## Table of Contents

* [Install](#install)
* [Usage](#usage)
  * [Express](#express)
  * [Koa](#koa)
  * [Fastify](#fastify)
  * [Other](#other)
* [Instance Options](#instance-options)
* [Examples](#examples)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install @ladjs/graceful
```


## Usage

See the [Express](#express), [Koa](#koa), [Fastify](#fastify), or [Other](#other) code snippet examples and [Instance Options](#instance-options) below.

**You can pass [Instance Options](#instance-options) to customize your graceful handler** (e.g. if you have more than one server, or wish to close both a Redis connection and a server at the same time).

```js
const Graceful = require('@ladjs/graceful');

//
// ...
//

//
// see Instance Options in the README below and examples for different projects (e.g. Koa or Express)
//
const graceful = new Graceful({
  //
  // http or net servers
  // (this supports Express/Koa/Fastify/etc)
  // (basically anything created with http.createServer or net.createServer)
  // <https://github.com/expressjs/express>
  // <https://github.com/koajs/koa>
  // <https://github.com/fastify/fastify>
  //
  servers: [],

  // bree clients
  // <https://github.com/breejs/bree>
  brees: [],

  // redis clients
  // <https://github.com/luin/ioredis>
  // <https://github.com/redis/node-redis>
  redisClients: [],

  // mongoose clients
  // <https://github.com/Automattic/mongoose>
  mongooses: [],

  // custom handlers to invoke upon shutdown
  customHandlers: [],

  // logger
  logger: console,

  // how long to wait in ms for exit to finish
  timeoutMs: 5000,

  // options to pass to `lil-http-terminator` to override defaults
  lilHttpTerminator: {},

  //
  // appends a `true` boolean value to a property of this name in the logger meta object
  // (this is useful for Cabin/Axe as it will prevent a log from being created in MongoDB)
  // (and instead of having a DB log created upon graceful exit, it will simply log to console)
  // (defer to the Forward Email codebase, specifically the logger helper)
  //
  // NOTE: if you set this to `false` then this will be ignored and no meta property will be populated
  //
  ignoreHook: 'ignore_hook',

  //
  // appends a `true` boolean value to a property of this name in the logger meta object
  // (this is useful for Cabin/Axe as it will prevent the meta object from being outputted to the logger)
  //
  hideMeta: 'hide_meta'
});

//
// NOTE: YOU MUST INVOKE `graceful.listen()` IN ORDER FOR THIS TO WORK!
//
graceful.listen();
```

Using this package will bind process event listeners when `graceful.listen()` is called:

* `process.on('warning')` - will output via `config.logger.warn`
* `process.on('unhandledRejection')` - bubbles up to `uncaughtException` (will output via `config.logger.error` and `process.exit(1)` (*does not exit gracefully*)
* `process.once('uncaughtException')` - will output via `config.logger.error` and `process.exit(1)` (*does not exit gracefully*)
* `process.on('message')` - support Windows (e.g. signals not available) and listen for message of `shutdown` and then exit gracefully
* `process.once('SIGTERM')` - will exit gracefully
* `process.once('SIGHUP')` - will exit gracefully
* `process.once('SIGINT')` - will exit gracefully
* `process.once('SIGUSR2')` - will exit gracefully (nodemon support)

This package also prevents multiple process/SIG events from triggering multiple graceful exits. Only one graceful exit can occur at a time.

For `servers` passed, we use [lil-http-terminator][] under the hood.  Default configuration options can be overridden by passing a `lilHttpTerminator` configuration object.  See [index.js](index.js) for more insight.

### Express

```js
const express = require('express');
const Graceful = require('@ladjs/graceful');

const app = express();
const server = app.listen();
const graceful = new Graceful({ servers: [server] });
graceful.listen();
```

### Koa

```js
const Koa = require('koa');
const Graceful = require('@ladjs/graceful');

const app = new Koa();
const server = app.listen();
const graceful = new Graceful({ servers: [server] });
graceful.listen();
```

### Fastify

```js
const fastify = require('fastify');
const Graceful = require('@ladjs/graceful');

const app = fastify();
app.listen();

//
// NOTE: @ladjs/graceful is smart and detects `app.server` automatically
//
const graceful = new Graceful({ servers: [app] });
graceful.listen();
```

### Other

This package works with any server created with `http.createServer` or `net.createServer` (Node's internal HTTP and Net packages).

**Please defer to the [test folder files](test/test.js) for example usage.**


## Instance Options

Here is the full list of options and their defaults.  See [index.js](index.js) for more insight if necessary.

| Property            | Type                      | Default Value   | Description                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `servers`           | Array                     | `[]`            | An array of HTTP or NET servers to gracefully close on exit                                                                                                                                                                                                                                                                                                                                             |
| `brees`             | Array                     | `[]`            | An array of [Bree][] instances to gracefully exit                                                                                                                                                                                                                                                                                                                                                       |
| `redisClients`      | Array                     | `[]`            | An array of Redis client instances to gracefully exit                                                                                                                                                                                                                                                                                                                                                   |
| `mongooses`         | Array                     | `[]`            | An array of Mongoose connections to gracefully exit                                                                                                                                                                                                                                                                                                                                                     |
| `customHandlers`    | Array                     | `[]`            | An array of functions (custom handlers) to invoke upon graceful exit                                                                                                                                                                                                                                                                                                                                    |
| `logger`            | Object                    | `console`       | This is the default logger.  **We recommend using [Cabin][cabin]** instead of using `console` as your default logger.  Set this value to `false` to disable logging entirely (uses noop function)                                                                                                                                                                                                       |
| `timeoutMs`         | Number                    | `5000`          | A number in milliseconds for how long to wait to gracefully exit                                                                                                                                                                                                                                                                                                                                        |
| `lilHttpTerminator` | Object                    | `{}`            | An object of options to pass to `lil-http-terminator` to override default options provided                                                                                                                                                                                                                                                                                                              |
| `ignoreHook`        | String or `false` Boolean | `"ignore_hook"` | Appends a `true` boolean property to a property with this value in logs, e.g. `console.log('graceful exiting', { ignore_hook: true });` which is useful for preventing logs from being written to a database in hooks (this is meant for usage with [Cabin][] and [Axe][] and made for [Forward Email][forward-email]).  If you pass a `false` value then this property will not get populated.         |
| `hideMeta`          | String or `false` Boolean | `"hide_meta"`   | Appends a `true` boolean property to a property with this value in logs, e.g. `console.log('graceful exiting', { hide_meta: true });` which is useful for preventing metadata object from being invoked as the second argument (this is meant for usage with [Cabin][] and [Axe][] and made for [Forward Email][forward-email]). If you pass a `false` value then this property will not get populated. |


## Examples

You can refer Forward Email for more complex usage:

* API - <https://github.com/forwardemail/forwardemail.net/blob/master/api.js>
* Web - <https://github.com/forwardemail/forwardemail.net/blob/master/web.js>
* Bree - <https://github.com/forwardemail/forwardemail.net/blob/master/bree.js>
* Proxy - <https://github.com/forwardemail/forwardemail.net/blob/master/proxy.js>

Additionally you can also refer to [Lad][] usage:

* API - <https://github.com/ladjs/lad/blob/master/template/api.js>
* Web - <https://github.com/ladjs/lad/blob/master/template/web.js>
* Bree - <https://github.com/ladjs/lad/blob/master/template/bree.js>
* Proxy - <https://github.com/ladjs/lad/blob/master/template/proxy.js>

You can also read more about Bree at <https://github.com/breejs/bree>.


## Contributors

| Name                | Website                        |
| ------------------- | ------------------------------ |
| **Nick Baugh**      | <http://niftylettuce.com/>     |
| **Felix Mosheev**   | <https://github.com/felixmosh> |
| **Nicholai Nissen** | <https://nicholai.dev>         |
| **Spencer Snyder**  | <https://spencersnyder.io>     |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com/)


##

[npm]: https://www.npmjs.com/

[lad]: https://lad.js.org

[lil-http-terminator]: https://github.com/flash-oss/lil-http-terminator

[cabin]: https://cabinjs.com

[bree]: https://jobscheduler.net

[axe]: https://github.com/cabinjs/axe

[forward-email]: https://github.com/forwardemail
