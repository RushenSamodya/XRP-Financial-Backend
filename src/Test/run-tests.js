const { connect } = require('./test-utils');
const ProductTest = require('./TestCases/ProductTest');
const FinanceTest = require('./TestCases/FinanceTest');

(async () => {
  try {
    const url = process.env.CONTRACT_URL || 'ws://localhost:8081';
    const privKeyHex = process.env.PRIV_KEY_HEX || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const client = await connect(url, privKeyHex);

    await ProductTest(client);
    await FinanceTest(client);

    console.log('All tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
  }
})();
