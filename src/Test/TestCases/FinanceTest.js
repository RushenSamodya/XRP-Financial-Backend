const { submitJson, assertSuccessResponse } = require('../test-utils');

module.exports = async function(client) {
  // Record sale
  let resp = await submitJson(client, { type: 'SALE_RECORD', sku: 'SKU-TEST', qty: 1, payment_method: 'XRP', amountXrp: 1000, customer: 'QA Tester', txHash: '' });
  assertSuccessResponse(resp);

  // Report
  resp = await submitJson(client, { type: 'FINANCE_REPORT' });
  assertSuccessResponse(resp);
};
