const test = require('ava');

const Graceful = require('..');

test('returns itself', t => {
  t.true(new Graceful() instanceof Graceful);
});
