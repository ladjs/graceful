const net = require('node:net');
const util = require('node:util');

const API = require('@ladjs/api');
const Koa = require('koa');
const Redis = require('ioredis-mock');
const Web = require('@ladjs/web');
const express = require('express');
const fastify = require('fastify');
const getPort = require('get-port');
const test = require('ava');
const { SMTPServer } = require('smtp-server');

const Graceful = require('..');

//
// NOTE: these tests should be improved with sinon spies perhaps
//

test('returns itself', (t) => {
  t.true(new Graceful() instanceof Graceful);
});

test('works for net.createServer', async (t) => {
  const server = net.createServer();
  const port = await getPort();
  await new Promise((resolve, reject) => {
    server.listen(port, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
  server.on('close', () => {
    console.log('server was closed gracefully');
  });
  const graceful = new Graceful({ servers: [server] });
  graceful.listen();
  await t.notThrowsAsync(graceful.stopServers());
});

test('works for SMTP server', async (t) => {
  const port = await getPort();
  const app = new SMTPServer({ logger: true, logInfo: true });
  await util.promisify(app.listen).call(app, port);
  const graceful = new Graceful({ servers: [app] });
  graceful.listen();
  await t.notThrowsAsync(graceful.stopServers());
});

test('works for Koa HTTP server', async (t) => {
  const app = new Koa();
  const port = await getPort();
  const server = await new Promise((resolve, reject) => {
    app.listen(port, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
  const graceful = new Graceful({ servers: [server] });
  graceful.listen();
  await t.notThrowsAsync(graceful.stopServers());
});

test('works for Express HTTP server', async (t) => {
  const app = express();
  const port = await getPort();
  const server = await new Promise((resolve, reject) => {
    app.listen(port, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
  const graceful = new Graceful({ servers: [server] });
  graceful.listen();
  await t.notThrowsAsync(graceful.stopServers());
});

test('works for @ladjs/web', async (t) => {
  const web = new Web({ redis: new Redis() });
  const port = await getPort();
  await web.listen(port);
  const graceful = new Graceful({ servers: [web.server] });
  graceful.listen();
  await t.notThrowsAsync(graceful.stopServers());
});

test('works for @ladjs/api', async (t) => {
  const api = new API({ redis: new Redis() });
  const port = await getPort();
  await api.listen(port);
  const graceful = new Graceful({ servers: [api.server] });
  graceful.listen();
  await t.notThrowsAsync(graceful.stopServers());
});

test('works for fastify', async (t) => {
  const app = fastify();
  const port = await getPort();
  await util.promisify(app.listen).call(app, port);
  //
  // NOTE: @ladjs/graceful is smart and detects `app.server` automatically
  //
  const graceful = new Graceful({ servers: [app] });
  graceful.listen();
  await t.notThrowsAsync(graceful.stopServers());
});
