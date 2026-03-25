const HotPocket = require('hotpocket-nodejs-contract');
const fs = require('fs');
const path = require('path');
const BSON = require('bson');
const Controller = require('./controller');
const initDB = require('./Data.Deploy/initDB');

/*
  HotPocket contract entrypoint for Computershop Finance
  - Correct HP initialization: new HotPocket.Contract().init(contract)
  - DB initialization only in non-readonly rounds to avoid state writes during readonly
  - Read-only guard for state-mutating operations (WRITE_OPS)
  - Protocol-aware I/O symmetry: respond in the same encoding (JSON/BSON) as request
  - Promise correlation: echo promiseId when present for client-side matching
  - Reuse a single Controller instance per consensus round
*/

const dbPath = process.env.DB_PATH || 'computershop_finance.db';

// Operations that mutate state (must not run in readonly rounds)
// Keep this in sync with controller routes that write to DB or ledger.
const WRITE_OPS = new Set(['PRODUCT_CREATE', 'SALE_RECORD', 'XRPL_PAY', 'UPGRADE']);

// Try to parse incoming buffer as JSON first; if that fails, try BSON.
// Returns { data: any, encoding: 'json' | 'bson' | 'invalid', error?: string }
function tryParseInput(buffer) {
  // Attempt JSON first, then BSON, and return encoding info for response symmetry
  try {
    const txt = buffer.toString('utf8');
    const obj = JSON.parse(txt);
    return { data: obj, encoding: 'json' };
  } catch (_) {
    try {
      const bson = new BSON();
      const obj = bson.deserialize(buffer);
      return { data: obj, encoding: 'bson' };
    } catch (err) {
      return { data: null, encoding: 'invalid', error: 'Invalid input format' };
    }
  }
}

async function contract(ctx) {
  // Respect read-only mode: skip any DB initialization in readonly rounds
  if (!ctx.readonly) {
    try {
      await initDB(dbPath);
    } catch (err) {
      console.error('DB init failed: ' + err.message);
    }
  }

  // Reuse controller per round
  const controller = new Controller(ctx);

  // Iterate through connected users and read their inputs for this round.
  for (const user of ctx.users.list()) {
    // Normalize/compat user public key field expected by controllers
    try { if (!user.pubkey && user.publicKey) user.pubkey = user.publicKey; } catch (_) {}

    for (const input of user.inputs) {
      const buf = await ctx.users.read(input);
      const parsed = tryParseInput(buf);

      // If invalid payload format, reply error immediately
      if (parsed.encoding === 'invalid') {
        const errResp = { success: false, error: parsed.error };
        const outBuf = Buffer.from(JSON.stringify(errResp));
        await user.send(outBuf);
        continue;
      }

      const payload = parsed.data;
      const promiseId = payload && payload.promiseId;

      // Enforce read-only safety: block write ops during readonly rounds
      if (ctx.readonly && WRITE_OPS.has(payload?.type)) {
        const roErr = { success: false, error: 'Write operation not allowed in read-only round.' };
        const roOut = promiseId ? { promiseId, ...roErr } : roErr;
        const outBuf = parsed.encoding === 'bson' ? new BSON().serialize(roOut) : Buffer.from(JSON.stringify(roOut));
        await user.send(outBuf);
        continue;
      }

      try {
        const response = await controller.route(user, payload);
        // Add promiseId correlation to responses for client-side matching
        const out = promiseId ? { promiseId, ...response } : response;
        // Mirror the input protocol when responding
        const outBuf = parsed.encoding === 'bson' ? new BSON().serialize(out) : Buffer.from(JSON.stringify(out));
        await user.send(outBuf);
      } catch (err) {
        const errResp = { success: false, error: err.message };
        const out = promiseId ? { promiseId, ...errResp } : errResp;
        const outBuf = parsed.encoding === 'bson' ? new BSON().serialize(out) : Buffer.from(JSON.stringify(out));
        await user.send(outBuf);
      }
    }
  }
}

const hpc = new HotPocket.Contract();
hpc.init(contract);
