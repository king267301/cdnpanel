export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface Node {
  id: number;
  name: string;
  ip: string;
  status: 'online' | 'offline';
  region: string;
  bandwidth: number;
  createdAt: string;
}

export interface Order {
  id: number;
  userId: number;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  method: 'yipay' | 'paypal' | 'stripe';
  createdAt: string;
} 