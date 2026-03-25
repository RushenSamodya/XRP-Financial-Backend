const { HotPocketUserClient } = require('hotpocket-js-client');

async function connect(url, privKeyHex) {
  const client = new HotPocketUserClient(url, privKeyHex);
  await client.connect();
  return client;
}

async function submitJson(client, payload) {
  const buf = Buffer.from(JSON.stringify(payload));
  const res = await client.submitContractInput(buf);
  return res;
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `AssertEqual failed: ${a} !== ${b}`);
}

function assertSuccessResponse(resp) {
  if (!resp || !resp.success) throw new Error('Expected success response.');
}

function assertErrorResponse(resp) {
  if (!resp || resp.success) throw new Error('Expected error response.');
}

module.exports = { connect, submitJson, assertEqual, assertSuccessResponse, assertErrorResponse };
