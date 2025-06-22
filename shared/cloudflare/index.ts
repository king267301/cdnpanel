import axios from 'axios';

export interface CloudflareConfig {
  apiToken: string;
  zoneId: string;
  accountId: string;
}

export interface DNSRecord {
  id?: string;
  type: 'CNAME' | 'A' | 'AAAA';
  name: string;
  content: string;
  ttl: number;
  proxied?: boolean;
}

export class CloudflareAPI {
  private config: CloudflareConfig;
  private baseURL = 'https://api.cloudflare.com/client/v4';

  constructor(config: CloudflareConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
      'X-Auth-Key': this.config.apiToken,
      'X-Auth-Email': 'admin@cdn-system.com' // 可选，某些API需要
    };
  }

  /**
   * 获取域名的所有DNS记录
   */
  async getDNSRecords(domain: string): Promise<DNSRecord[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/zones/${this.config.zoneId}/dns_records`,
        {
          headers: this.getHeaders(),
          params: {
            name: domain,
            per_page: 100
          }
        }
      );

      if (response.data.success) {
        return response.data.result.map((record: any) => ({
          id: record.id,
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl,
          proxied: record.proxied
        }));
      }
      return [];
    } catch (error) {
      console.error('获取DNS记录失败:', error);
      throw new Error('获取DNS记录失败');
    }
  }

  /**
   * 创建CNAME记录
   */
  async createCNAMERecord(domain: string, cnameValue: string, ttl: number = 600): Promise<DNSRecord> {
    try {
      const recordData = {
        type: 'CNAME',
        name: domain,
        content: cnameValue,
        ttl: ttl,
        proxied: false // CDN系统不需要Cloudflare代理
      };

      const response = await axios.post(
        `${this.baseURL}/zones/${this.config.zoneId}/dns_records`,
        recordData,
        {
          headers: this.getHeaders()
        }
      );

      if (response.data.success) {
        const record = response.data.result;
        return {
          id: record.id,
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl,
          proxied: record.proxied
        };
      }
      throw new Error('创建CNAME记录失败');
    } catch (error) {
      console.error('创建CNAME记录失败:', error);
      throw new Error('创建CNAME记录失败');
    }
  }

  /**
   * 更新CNAME记录
   */
  async updateCNAMERecord(recordId: string, domain: string, cnameValue: string, ttl: number = 600): Promise<DNSRecord> {
    try {
      const recordData = {
        type: 'CNAME',
        name: domain,
        content: cnameValue,
        ttl: ttl,
        proxied: false
      };

      const response = await axios.put(
        `${this.baseURL}/zones/${this.config.zoneId}/dns_records/${recordId}`,
        recordData,
        {
          headers: this.getHeaders()
        }
      );

      if (response.data.success) {
        const record = response.data.result;
        return {
          id: record.id,
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl,
          proxied: record.proxied
        };
      }
      throw new Error('更新CNAME记录失败');
    } catch (error) {
      console.error('更新CNAME记录失败:', error);
      throw new Error('更新CNAME记录失败');
    }
  }

  /**
   * 删除DNS记录
   */
  async deleteDNSRecord(recordId: string): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/zones/${this.config.zoneId}/dns_records/${recordId}`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data.success;
    } catch (error) {
      console.error('删除DNS记录失败:', error);
      throw new Error('删除DNS记录失败');
    }
  }

  /**
   * 检查域名是否存在CNAME记录
   */
  async checkCNAMERecord(domain: string): Promise<DNSRecord | null> {
    try {
      const records = await this.getDNSRecords(domain);
      const cnameRecord = records.find(record => record.type === 'CNAME');
      return cnameRecord || null;
    } catch (error) {
      console.error('检查CNAME记录失败:', error);
      return null;
    }
  }

  /**
   * 自动创建或更新CNAME记录
   */
  async upsertCNAMERecord(domain: string, cnameValue: string, ttl: number = 600): Promise<DNSRecord> {
    try {
      // 检查是否已存在CNAME记录
      const existingRecord = await this.checkCNAMERecord(domain);
      
      if (existingRecord) {
        // 更新现有记录
        return await this.updateCNAMERecord(existingRecord.id!, domain, cnameValue, ttl);
      } else {
        // 创建新记录
        return await this.createCNAMERecord(domain, cnameValue, ttl);
      }
    } catch (error) {
      console.error('自动创建/更新CNAME记录失败:', error);
      throw new Error('自动创建/更新CNAME记录失败');
    }
  }

  /**
   * 获取域名信息
   */
  async getZoneInfo(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/zones/${this.config.zoneId}`,
        {
          headers: this.getHeaders()
        }
      );

      if (response.data.success) {
        return response.data.result;
      }
      throw new Error('获取域名信息失败');
    } catch (error) {
      console.error('获取域名信息失败:', error);
      throw new Error('获取域名信息失败');
    }
  }

  /**
   * 验证API Token是否有效
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseURL}/user/tokens/verify`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data.success;
    } catch (error) {
      console.error('验证API Token失败:', error);
      return false;
    }
  }
}

/**
 * 生成CNAME记录值
 */
export function generateCNAMEValue(domain: string, cdnDomain: string = 'cdn-system.com'): string {
  return `cdn.${domain}.${cdnDomain}`;
}

/**
 * 验证域名格式
 */
export function validateDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
}

/**
 * 创建Cloudflare API实例
 */
export function createCloudflareAPI(config: CloudflareConfig): CloudflareAPI {
  return new CloudflareAPI(config);
} 