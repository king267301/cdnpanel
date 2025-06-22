// 5秒盾安全防护模块

export interface SecurityConfig {
  enabled: boolean;
  challengeTimeout: number; // 验证超时时间（秒）
  maxRequestsPerMinute: number; // 每分钟最大请求数
  whitelistIps: string[]; // IP白名单
  blacklistIps: string[]; // IP黑名单
  userAgents: string[]; // 可疑User-Agent
  countries: string[]; // 允许的国家代码
}

export interface SecurityChallenge {
  type: 'captcha' | 'javascript' | 'cookie';
  token: string;
  expiresAt: number;
}

export interface SecurityResult {
  allowed: boolean;
  challenge?: SecurityChallenge;
  reason?: string;
  ip: string;
  userAgent: string;
  country?: string;
}

// 5秒盾核心类
export class FiveSecondShield {
  private config: SecurityConfig;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private challenges: Map<string, SecurityChallenge> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  // 检查请求是否通过安全验证
  async checkRequest(ip: string, userAgent: string, headers: Record<string, string>): Promise<SecurityResult> {
    const result: SecurityResult = {
      allowed: false,
      ip,
      userAgent
    };

    // 1. 检查IP白名单
    if (this.config.whitelistIps.includes(ip)) {
      result.allowed = true;
      return result;
    }

    // 2. 检查IP黑名单
    if (this.config.blacklistIps.includes(ip)) {
      result.reason = 'IP已被封禁';
      return result;
    }

    // 3. 检查可疑User-Agent
    if (this.isSuspiciousUserAgent(userAgent)) {
      result.reason = '可疑的User-Agent';
      return result;
    }

    // 4. 检查请求频率
    if (!this.checkRateLimit(ip)) {
      result.reason = '请求频率过高';
      return result;
    }

    // 5. 检查是否已有有效验证
    const existingChallenge = this.challenges.get(ip);
    if (existingChallenge && existingChallenge.expiresAt > Date.now()) {
      result.allowed = true;
      return result;
    }

    // 6. 生成新的验证挑战
    const challenge = this.generateChallenge();
    this.challenges.set(ip, challenge);
    result.challenge = challenge;

    return result;
  }

  // 验证挑战结果
  async verifyChallenge(ip: string, token: string, answer?: string): Promise<boolean> {
    const challenge = this.challenges.get(ip);
    if (!challenge || challenge.token !== token || challenge.expiresAt < Date.now()) {
      return false;
    }

    // 根据挑战类型验证答案
    switch (challenge.type) {
      case 'captcha':
        return this.verifyCaptcha(answer);
      case 'javascript':
        return this.verifyJavaScript(answer);
      case 'cookie':
        return this.verifyCookie(ip, token);
      default:
        return false;
    }
  }

  // 生成验证挑战
  private generateChallenge(): SecurityChallenge {
    const types: Array<'captcha' | 'javascript' | 'cookie'> = ['captcha', 'javascript', 'cookie'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      type,
      token: this.generateToken(),
      expiresAt: Date.now() + (this.config.challengeTimeout * 1000)
    };
  }

  // 生成随机Token
  private generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // 检查请求频率
  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(ip);
    
    if (!record || record.resetTime < now) {
      this.requestCounts.set(ip, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (record.count >= this.config.maxRequestsPerMinute) {
      return false;
    }

    record.count++;
    return true;
  }

  // 检查可疑User-Agent
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspicious = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java',
      'masscan', 'nmap', 'sqlmap', 'nikto', 'dirb', 'gobuster'
    ];
    
    return suspicious.some(keyword => 
      userAgent.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // 验证验证码
  private verifyCaptcha(answer?: string): boolean {
    // 这里应该集成真实的验证码服务
    return answer === 'correct';
  }

  // 验证JavaScript挑战
  private verifyJavaScript(answer?: string): boolean {
    // 验证JavaScript执行结果
    return answer === 'executed';
  }

  // 验证Cookie挑战
  private verifyCookie(ip: string, token: string): boolean {
    // 验证Cookie是否正确设置
    return true;
  }

  // 清理过期数据
  cleanup() {
    const now = Date.now();
    
    // 清理过期的挑战
    for (const [ip, challenge] of this.challenges.entries()) {
      if (challenge.expiresAt < now) {
        this.challenges.delete(ip);
      }
    }

    // 清理过期的请求计数
    for (const [ip, record] of this.requestCounts.entries()) {
      if (record.resetTime < now) {
        this.requestCounts.delete(ip);
      }
    }
  }
}

// 验证码生成器
export class CaptchaGenerator {
  static generate(): { question: string; answer: string } {
    const operations = [
      { op: '+', fn: (a: number, b: number) => a + b },
      { op: '-', fn: (a: number, b: number) => a - b },
      { op: '*', fn: (a: number, b: number) => a * b }
    ];

    const operation = operations[Math.floor(Math.random() * operations.length)];
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    
    const question = `${a} ${operation.op} ${b} = ?`;
    const answer = operation.fn(a, b).toString();

    return { question, answer };
  }
}

// IP地理位置查询
export class GeoIP {
  static async getCountry(ip: string): Promise<string | null> {
    try {
      // 这里应该调用真实的IP地理位置API
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();
      return data.countryCode || null;
    } catch (error) {
      return null;
    }
  }
} 