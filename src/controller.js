const Response = require('./Utils/Response.Helper');
const UpgradeController = require('./Controllers/Upgrade.Controller');
const ProductService = require('./Services/Domain.Services/Product.Service');
const FinanceService = require('./Services/Domain.Services/Finance.Service');

/*
  Central request router for Computershop Finance contract.
  - Delegates product operations to ProductService (create/get).
  - Delegates financial ops to FinanceService (record sale, report, XRPL balance/pay).
  - Handles secure upgrade flow via UpgradeController.
  Notes:
  - startup.js enforces read-only guards so mutating routes won't execute during readonly rounds.
  - Responses use a unified shape via Utils/Response.Helper for consistency.
*/
class Controller {
  constructor(ctx) {
    this.ctx = ctx;
    this.productService = new ProductService();
    this.financeService = new FinanceService();
    this.upgradeController = new UpgradeController();
  }

  async route(user, payload) {
    if (!payload || !payload.type) return Response.error('Invalid payload');

    // Route each message type to the appropriate domain service.
    switch (payload.type) {
      case 'PRODUCT_CREATE': {
        const { sku, name, priceXrp } = payload;
        const prod = await this.productService.create({ sku, name, priceXrp });
        return Response.success(prod);
      }
      case 'PRODUCT_GET': {
        const { sku } = payload;
        const prod = await this.productService.getBySku(sku);
        return Response.success(prod);
      }
      case 'SALE_RECORD': {
        const { sku, qty, payment_method, amountXrp, customer, txHash } = payload;
        const sale = await this.financeService.recordSale({ sku, qty, payment_method, amountXrp, customer, txHash });
        return Response.success(sale);
      }
      case 'FINANCE_REPORT': {
        const { fromDate, toDate } = payload;
        const report = await this.financeService.getReport({ fromDate, toDate });
        return Response.success(report);
      }
      case 'XRPL_BALANCE': {
        const bal = await this.financeService.getXrpBalance();
        return Response.success(bal);
      }
      case 'XRPL_PAY': {
        const { destination, amountXrp } = payload;
        const result = await this.financeService.payXrp(destination, amountXrp);
        return Response.success(result);
      }
      case 'UPGRADE': {
        return await this.upgradeController.handleUpgrade(user, payload);
      }
      default:
        return Response.error('Unknown type: ' + payload.type);
    }
  }
}

module.exports = Controller;
