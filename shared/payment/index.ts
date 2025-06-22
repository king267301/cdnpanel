// 支付模块统一接口

export interface PaymentConfig {
  yipay: {
    merchantId: string;
    secretKey: string;
    notifyUrl: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
  };
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  method: 'yipay' | 'paypal' | 'stripe';
  returnUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

// 易支付实现
export class YiPayPayment {
  private config: PaymentConfig['yipay'];

  constructor(config: PaymentConfig['yipay']) {
    this.config = config;
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 构建易支付请求参数
      const params = {
        pid: this.config.merchantId,
        type: 'alipay', // 支付方式
        out_trade_no: request.orderId,
        notify_url: this.config.notifyUrl,
        return_url: request.returnUrl,
        name: request.description,
        money: request.amount.toFixed(2),
        sign: this.generateSign(request)
      };

      // 这里应该发送请求到易支付API
      const paymentUrl = `https://api.yipay.com/submit.php?${new URLSearchParams(params)}`;
      
      return {
        success: true,
        paymentUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '易支付创建失败'
      };
    }
  }

  private generateSign(request: PaymentRequest): string {
    // 生成易支付签名
    const signStr = `${this.config.merchantId}${request.orderId}${request.amount.toFixed(2)}${this.config.notifyUrl}${this.config.secretKey}`;
    return require('crypto').createHash('md5').update(signStr).digest('hex');
  }
}

// PayPal实现
export class PayPalPayment {
  private config: PaymentConfig['paypal'];

  constructor(config: PaymentConfig['paypal']) {
    this.config = config;
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 这里应该调用PayPal API
      const paymentUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${this.config.clientId}&item_name=${request.description}&amount=${request.amount}&currency_code=${request.currency}&return=${request.returnUrl}&cancel_return=${request.returnUrl}`;
      
      return {
        success: true,
        paymentUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPal创建失败'
      };
    }
  }
}

// Stripe实现
export class StripePayment {
  private config: PaymentConfig['stripe'];

  constructor(config: PaymentConfig['stripe']) {
    this.config = config;
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 这里应该调用Stripe API
      const stripe = require('stripe')(this.config.secretKey);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: request.currency,
            product_data: {
              name: request.description,
            },
            unit_amount: Math.round(request.amount * 100), // Stripe使用分
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: request.returnUrl,
        cancel_url: request.returnUrl,
      });

      return {
        success: true,
        paymentUrl: session.url
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe创建失败'
      };
    }
  }
}

// 支付工厂
export class PaymentFactory {
  private config: PaymentConfig;

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  createPayment(method: 'yipay' | 'paypal' | 'stripe') {
    switch (method) {
      case 'yipay':
        return new YiPayPayment(this.config.yipay);
      case 'paypal':
        return new PayPalPayment(this.config.paypal);
      case 'stripe':
        return new StripePayment(this.config.stripe);
      default:
        throw new Error(`不支持的支付方式: ${method}`);
    }
  }
} 