# [**@ladjs/graceful**](https://github.com/ladjs/graceful)

[![build status](https://img.shields.io/travis/ladjs/graceful.svg)](https://travis-ci.org/ladjs/graceful)
[![code coverage](https://img.shields.io/codecov/c/github/ladjs/graceful.svg)](https://codecov.io/gh/ladjs/graceful)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/graceful.svg)]()

> Gracefully exit server (Koa), database (Mongo/Mongoose), Redis clients, Bree job schedulers, Bull job schedulers, and custom handlers.


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
* `process.on('unhandledRejection')` - bubbles up to `uncaughtException` (will output via `config.logger.error` and `process.exit(1)` (*does not exit gracefully*)
* `process.once('uncaughtException')` - will output via `config.logger.error` and `process.exit(1)` (*does not exit gracefully*)
* `process.on('message')` - support Windows (e.g. signals not available) and listen for message of `shutdown` and then exit gracefully
* `process.once('SIGTERM')` - will exit gracefully
* `process.once('SIGHUP')` - will exit gracefully
* `process.once('SIGINT')` - will exit gracefully
* `process.once('SIGUSR2')` - will exit gracefully (nodemon support)

This package also prevents multiple process/SIG events from triggering multiple graceful exits. Only one graceful exit can occur at a time.

See one of these following files from [Lad][] for the most up to date usage example:

* API - <https://github.com/ladjs/lad/blob/master/template/api.js>
* Web - <https://github.com/ladjs/lad/blob/master/template/web.js>
* Bull - <https://github.com/ladjs/lad/blob/master/template/bull.js>
* Proxy - <https://github.com/ladjs/lad/blob/master/template/proxy.js>

You can also read more about Bree at <https://github.com/breejs/bree>.


## Contributors

| Name                | Website                        |
| ------------------- | ------------------------------ |
| **Nick Baugh**      | <http://niftylettuce.com/>     |
| **Felix Mosheev**   | <https://github.com/felixmosh> |
| **Nicholai Nissen** | <https://nicholai.dev>         |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com/)


##

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/

[lad]: https://lad.js.org
