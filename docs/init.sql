-- CDN系统数据库初始化SQL

-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  status ENUM('active', 'disabled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 节点表
CREATE TABLE nodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  port INT DEFAULT 80,
  status ENUM('online', 'offline') DEFAULT 'offline',
  region VARCHAR(50),
  bandwidth BIGINT DEFAULT 0,
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 域名表
CREATE TABLE domains (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  status ENUM('pending', 'active', 'disabled') DEFAULT 'pending',
  ssl_status ENUM('pending', 'active', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 订单表
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  payment_method ENUM('yipay', 'paypal', 'stripe'),
  payment_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 套餐表
CREATE TABLE packages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  bandwidth BIGINT NOT NULL,
  domains INT DEFAULT 1,
  status ENUM('active', 'disabled') DEFAULT 'active'
);

-- 插入默认管理员账号
INSERT INTO users (username, password, email, role) VALUES ('admin', '$2b$10$default_hash', 'admin@example.com', 'admin');

-- 插入默认套餐
INSERT INTO packages (name, price, bandwidth, domains) VALUES 
('基础版', 9.99, 107374182400, 1),
('专业版', 29.99, 536870912000, 5),
('企业版', 99.99, 2147483648000, 20); 