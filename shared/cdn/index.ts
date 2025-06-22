// CDN核心功能模块

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // 缓存时间（秒）
  maxSize: number; // 最大缓存大小（MB）
  strategy: 'lru' | 'fifo' | 'lfu';
  compress: boolean;
}

export interface OriginConfig {
  url: string;
  timeout: number;
  retries: number;
  healthCheck: boolean;
  weight: number;
}

export interface SecurityConfig {
  hotlinkProtection: boolean;
  allowedDomains: string[];
  sslEnabled: boolean;
  sslCertPath: string;
  sslKeyPath: string;
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    burstSize: number;
  };
}

export interface CDNConfig {
  cache: CacheConfig;
  origins: OriginConfig[];
  security: SecurityConfig;
  domains: string[];
}

// CDN缓存管理器
export class CDNCache {
  private cache: Map<string, { data: any; expires: number; size: number }> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  async get(key: string): Promise<any | null> {
    const item = this.cache.get(key);
    if (!item || item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    const expires = Date.now() + (ttl || this.config.ttl) * 1000;
    const size = JSON.stringify(data).length;
    
    this.cache.set(key, { data, expires, size });
    
    // 检查缓存大小限制
    this.cleanup();
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  private cleanup(): void {
    if (!this.config.maxSize) return;

    const items = Array.from(this.cache.entries());
    let totalSize = items.reduce((sum, [_, item]) => sum + item.size, 0);

    if (totalSize > this.config.maxSize * 1024 * 1024) {
      // 按策略清理
      switch (this.config.strategy) {
        case 'lru':
          items.sort((a, b) => a[1].expires - b[1].expires);
          break;
        case 'fifo':
          // FIFO保持插入顺序
          break;
        case 'lfu':
          // 这里应该实现LFU算法
          break;
      }

      // 删除最旧的项目直到大小合适
      for (const [key, item] of items) {
        this.cache.delete(key);
        totalSize -= item.size;
        if (totalSize <= this.config.maxSize * 1024 * 1024 * 0.8) break;
      }
    }
  }
}

// CDN回源管理器
export class CDNOrigin {
  private origins: OriginConfig[];
  private healthStatus: Map<string, boolean> = new Map();

  constructor(origins: OriginConfig[]) {
    this.origins = origins;
    this.startHealthCheck();
  }

  async fetch(path: string): Promise<Response> {
    const origin = await this.selectOrigin();
    const url = `${origin.url}${path}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), origin.timeout * 1000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CDN-Node/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async selectOrigin(): Promise<OriginConfig> {
    const healthyOrigins = this.origins.filter(origin => 
      this.healthStatus.get(origin.url) !== false
    );

    if (healthyOrigins.length === 0) {
      throw new Error('No healthy origins available');
    }

    // 简单的轮询选择
    const index = Math.floor(Math.random() * healthyOrigins.length);
    return healthyOrigins[index];
  }

  private startHealthCheck(): void {
    if (!this.origins.some(origin => origin.healthCheck)) return;

    setInterval(async () => {
      for (const origin of this.origins) {
        if (!origin.healthCheck) continue;

        try {
          const response = await fetch(`${origin.url}/health`, {
            signal: AbortSignal.timeout(5000)
          });
          this.healthStatus.set(origin.url, response.ok);
        } catch (error) {
          this.healthStatus.set(origin.url, false);
        }
      }
    }, 30000); // 每30秒检查一次
  }
}

// 防盗链检查器
export class HotlinkProtection {
  private allowedDomains: string[];

  constructor(allowedDomains: string[]) {
    this.allowedDomains = allowedDomains;
  }

  check(headers: Record<string, string>): boolean {
    const referer = headers.referer || headers.Referer;
    if (!referer) return true; // 允许直接访问

    try {
      const url = new URL(referer);
      return this.allowedDomains.some(domain => 
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }
}

// SSL证书管理器
export class SSLManager {
  private config: { enabled: boolean; certPath: string; keyPath: string };

  constructor(config: { enabled: boolean; certPath: string; keyPath: string }) {
    this.config = config;
  }

  async getCertificate(): Promise<{ cert: string; key: string } | null> {
    if (!this.config.enabled) return null;

    try {
      const fs = require('fs').promises;
      const cert = await fs.readFile(this.config.certPath, 'utf8');
      const key = await fs.readFile(this.config.keyPath, 'utf8');
      return { cert, key };
    } catch (error) {
      console.error('SSL证书加载失败:', error);
      return null;
    }
  }

  async autoRenew(): Promise<void> {
    // 这里应该实现自动续期逻辑
    console.log('SSL证书自动续期检查');
  }
}

// CDN主控制器
export class CDNController {
  private cache: CDNCache;
  private origin: CDNOrigin;
  private hotlinkProtection: HotlinkProtection;
  private sslManager: SSLManager;
  private config: CDNConfig;

  constructor(config: CDNConfig) {
    this.config = config;
    this.cache = new CDNCache(config.cache);
    this.origin = new CDNOrigin(config.origins);
    this.hotlinkProtection = new HotlinkProtection(config.security.allowedDomains);
    this.sslManager = new SSLManager({
      enabled: config.security.sslEnabled,
      certPath: config.security.sslCertPath,
      keyPath: config.security.sslKeyPath
    });
  }

  async handleRequest(path: string, headers: Record<string, string>): Promise<{
    status: number;
    headers: Record<string, string>;
    body: string | Buffer;
  }> {
    // 1. 防盗链检查
    if (this.config.security.hotlinkProtection && !this.hotlinkProtection.check(headers)) {
      return {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Hotlink protection: Access denied'
      };
    }

    // 2. 缓存检查
    const cacheKey = `cdn:${path}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return {
        status: 200,
        headers: cached.headers,
        body: cached.body
      };
    }

    // 3. 回源获取
    try {
      const response = await this.origin.fetch(path);
      const body = await response.text();
      const responseHeaders = Object.fromEntries(response.headers.entries());

      // 4. 缓存响应
      if (response.ok && this.config.cache.enabled) {
        await this.cache.set(cacheKey, {
          headers: responseHeaders,
          body: body
        });
      }

      return {
        status: response.status,
        headers: responseHeaders,
        body: body
      };
    } catch (error) {
      console.error('回源失败:', error);
      return {
        status: 502,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Origin server error'
      };
    }
  }

  async purgeCache(path?: string): Promise<void> {
    if (path) {
      await this.cache.delete(`cdn:${path}`);
    } else {
      await this.cache.clear();
    }
  }

  getStats(): any {
    return {
      cacheSize: this.cache.cache.size,
      origins: this.config.origins.length,
      domains: this.config.domains
    };
  }
} 