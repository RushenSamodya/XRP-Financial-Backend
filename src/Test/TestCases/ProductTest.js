const { submitJson, assertSuccessResponse } = require('../test-utils');

module.exports = async function(client) {
  // Create product
  let resp = await submitJson(client, { type: 'PRODUCT_CREATE', sku: 'SKU-TEST', name: 'Gaming Laptop', priceXrp: 1000 });
  assertSuccessResponse(resp);

  // Get product
  resp = await submitJson(client, { type: 'PRODUCT_GET', sku: 'SKU-TEST' });
  assertSuccessResponse(resp);
};
