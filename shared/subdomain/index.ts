import { createCloudflareAPI, generateCNAMEValue } from '../cloudflare';

export interface SubdomainConfig {
  domain: string; // 主域名，如 cdn-system.com
  cloudflareConfig: {
    apiToken: string;
    zoneId: string;
    accountId?: string;
  };
}

export interface UserSubdomain {
  id: string;
  userId: string;
  username: string;
  subdomain: string; // 生成的子域名，如 user123.cdn-system.com
  cnameValue: string; // CNAME记录值
  status: 'active' | 'pending' | 'disabled';
  createdAt: Date;
  expiresAt?: Date;
  packageId: string;
  packageName: string;
}

export class SubdomainManager {
  private config: SubdomainConfig;
  private cloudflare: any;

  constructor(config: SubdomainConfig) {
    this.config = config;
    this.cloudflare = createCloudflareAPI(config.cloudflareConfig);
  }

  /**
   * 为用户生成唯一的子域名
   */
  async generateUserSubdomain(userId: string, username: string, packageId: string, packageName: string): Promise<UserSubdomain> {
    try {
      // 生成唯一的子域名
      const subdomain = await this.generateUniqueSubdomain(userId, username);
      
      // 生成CNAME记录值
      const cnameValue = generateCNAMEValue(subdomain, this.config.domain);
      
      // 创建DNS记录
      await this.cloudflare.createCNAMERecord(subdomain, cnameValue);
      
      const userSubdomain: UserSubdomain = {
        id: `sub_${Date.now()}_${userId}`,
        userId,
        username,
        subdomain,
        cnameValue,
        status: 'active',
        createdAt: new Date(),
        packageId,
        packageName
      };
      
      return userSubdomain;
    } catch (error) {
      console.error('生成用户子域名失败:', error);
      throw new Error('生成用户子域名失败');
    }
  }

  /**
   * 生成唯一的子域名
   */
  private async generateUniqueSubdomain(userId: string, username: string): Promise<string> {
    const maxAttempts = 10;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      // 生成子域名候选
      const candidates = [
        `user${userId}`,
        `cdn${userId}`,
        `${username}${userId}`,
        `u${userId}`,
        `c${userId}`
      ];
      
      for (const candidate of candidates) {
        const subdomain = `${candidate}.${this.config.domain}`;
        
        // 检查子域名是否已存在
        const exists = await this.checkSubdomainExists(subdomain);
        if (!exists) {
          return subdomain;
        }
      }
      
      // 如果所有候选都存在，添加随机后缀
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const subdomain = `user${userId}${randomSuffix}.${this.config.domain}`;
      
      const exists = await this.checkSubdomainExists(subdomain);
      if (!exists) {
        return subdomain;
      }
      
      attempt++;
    }
    
    throw new Error('无法生成唯一子域名，请稍后重试');
  }

  /**
   * 检查子域名是否已存在
   */
  private async checkSubdomainExists(subdomain: string): Promise<boolean> {
    try {
      const records = await this.cloudflare.getDNSRecords(subdomain);
      return records.length > 0;
    } catch (error) {
      // 如果查询失败，假设不存在
      return false;
    }
  }

  /**
   * 更新用户子域名
   */
  async updateUserSubdomain(subdomainId: string, updates: Partial<UserSubdomain>): Promise<UserSubdomain> {
    try {
      // 这里应该更新数据库中的记录
      // 简化处理，返回更新后的对象
      return {
        id: subdomainId,
        userId: updates.userId || '',
        username: updates.username || '',
        subdomain: updates.subdomain || '',
        cnameValue: updates.cnameValue || '',
        status: updates.status || 'active',
        createdAt: updates.createdAt || new Date(),
        expiresAt: updates.expiresAt,
        packageId: updates.packageId || '',
        packageName: updates.packageName || ''
      };
    } catch (error) {
      console.error('更新用户子域名失败:', error);
      throw new Error('更新用户子域名失败');
    }
  }

  /**
   * 禁用用户子域名
   */
  async disableUserSubdomain(subdomainId: string): Promise<boolean> {
    try {
      // 这里应该更新数据库状态
      // 简化处理，返回成功
      return true;
    } catch (error) {
      console.error('禁用用户子域名失败:', error);
      throw new Error('禁用用户子域名失败');
    }
  }

  /**
   * 删除用户子域名
   */
  async deleteUserSubdomain(subdomainId: string, subdomain: string): Promise<boolean> {
    try {
      // 删除DNS记录
      const records = await this.cloudflare.getDNSRecords(subdomain);
      for (const record of records) {
        if (record.type === 'CNAME') {
          await this.cloudflare.deleteDNSRecord(record.id!);
        }
      }
      
      // 这里应该从数据库中删除记录
      return true;
    } catch (error) {
      console.error('删除用户子域名失败:', error);
      throw new Error('删除用户子域名失败');
    }
  }

  /**
   * 获取用户子域名信息
   */
  async getUserSubdomain(userId: string): Promise<UserSubdomain | null> {
    try {
      // 这里应该从数据库查询
      // 简化处理，返回模拟数据
      return null;
    } catch (error) {
      console.error('获取用户子域名失败:', error);
      return null;
    }
  }

  /**
   * 验证子域名是否有效
   */
  async validateSubdomain(subdomain: string): Promise<boolean> {
    try {
      const records = await this.cloudflare.getDNSRecords(subdomain);
      return records.some(record => record.type === 'CNAME');
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成CNAME配置信息
   */
  generateCNAMEConfig(subdomain: string): {
    recordType: string;
    hostRecord: string;
    recordValue: string;
    ttl: number;
  } {
    const cnameValue = generateCNAMEValue(subdomain, this.config.domain);
    
    return {
      recordType: 'CNAME',
      hostRecord: '@', // 或者子域名部分
      recordValue: cnameValue,
      ttl: 600
    };
  }
}

/**
 * 创建子域名管理器
 */
export function createSubdomainManager(config: SubdomainConfig): SubdomainManager {
  return new SubdomainManager(config);
}

/**
 * 生成用户友好的子域名
 */
export function generateUserFriendlySubdomain(userId: string, username: string): string {
  // 清理用户名，只保留字母数字
  const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '');
  
  // 生成候选子域名
  const candidates = [
    cleanUsername,
    `user${userId}`,
    `cdn${userId}`,
    `${cleanUsername}${userId}`
  ];
  
  // 返回第一个有效的候选
  return candidates[0] || `user${userId}`;
}

/**
 * 验证子域名格式
 */
export function validateSubdomainFormat(subdomain: string): boolean {
  const subdomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/;
  return subdomainRegex.test(subdomain);
} 