class PaymentService {
  async processPayment(amount, shouldFail = false) {
    const allowTestHooks = process.env.ALLOW_TEST_HOOKS === 'true';
    if (allowTestHooks && (process.env.MOCK_PAYMENT_FAIL === 'true' || shouldFail)) {
      return {
        success: false,
        amount,
        gateway: 'mock-gateway',
        status: 'failed',
        error: 'Simulated payment failure for compensation testing'
      };
    }

    return {
      success: true,
      amount,
      gateway: 'mock-gateway',
      status: 'succeeded',
      reference: `mock-${Date.now()}`
    };
  }
}

module.exports = PaymentService;
