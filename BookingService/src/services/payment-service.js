class PaymentService {
  async processPayment(amount) {
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
