import { Request, Response, NextFunction } from 'express';
import { FiveSecondShield, SecurityConfig, CaptchaGenerator } from '../../../shared/security';

// 5秒盾配置
const securityConfig: SecurityConfig = {
  enabled: true,
  challengeTimeout: 300, // 5分钟
  maxRequestsPerMinute: 60,
  whitelistIps: ['127.0.0.1', '::1'],
  blacklistIps: [],
  userAgents: [],
  countries: ['CN', 'US', 'JP', 'KR', 'SG', 'HK']
};

const shield = new FiveSecondShield(securityConfig);

// 5秒盾中间件
export function fiveSecondShield(req: Request, res: Response, next: NextFunction) {
  if (!securityConfig.enabled) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || '';

  shield.checkRequest(clientIp, userAgent, req.headers)
    .then(result => {
      if (result.allowed) {
        return next();
      }

      if (result.challenge) {
        return handleChallenge(req, res, result.challenge);
      }

      // 拒绝访问
      res.status(403).json({
        error: 'Access Denied',
        reason: result.reason,
        ip: result.ip
      });
    })
    .catch(error => {
      console.error('5秒盾检查失败:', error);
      next();
    });
}

// 处理验证挑战
function handleChallenge(req: Request, res: Response, challenge: any) {
  switch (challenge.type) {
    case 'captcha':
      return handleCaptchaChallenge(req, res, challenge);
    case 'javascript':
      return handleJavaScriptChallenge(req, res, challenge);
    case 'cookie':
      return handleCookieChallenge(req, res, challenge);
    default:
      res.status(403).json({ error: 'Unknown challenge type' });
  }
}

// 验证码挑战
function handleCaptchaChallenge(req: Request, res: Response, challenge: any) {
  const captcha = CaptchaGenerator.generate();
  
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>安全验证</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .challenge { max-width: 400px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 8px; }
        .captcha { font-size: 24px; margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 4px; }
        input { padding: 10px; font-size: 16px; width: 200px; margin: 10px; }
        button { padding: 10px 20px; font-size: 16px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #005a87; }
      </style>
    </head>
    <body>
      <div class="challenge">
        <h2>🔒 安全验证</h2>
        <p>请完成以下验证以继续访问</p>
        <div class="captcha">${captcha.question}</div>
        <form method="POST" action="/verify">
          <input type="hidden" name="token" value="${challenge.token}">
          <input type="hidden" name="type" value="captcha">
          <input type="hidden" name="answer" value="${captcha.answer}">
          <input type="text" name="userAnswer" placeholder="请输入答案" required>
          <br>
          <button type="submit">验证</button>
        </form>
      </div>
    </body>
    </html>
  `);
}

// JavaScript挑战
function handleJavaScriptChallenge(req: Request, res: Response, challenge: any) {
  const jsCode = `
    function verify() {
      const result = eval('2 + 2');
      document.getElementById('result').value = result;
      document.getElementById('form').submit();
    }
  `;
  
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>JavaScript验证</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .challenge { max-width: 400px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 8px; }
        .code { background: #f5f5f5; padding: 20px; border-radius: 4px; font-family: monospace; margin: 20px 0; }
        button { padding: 10px 20px; font-size: 16px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="challenge">
        <h2>🔒 JavaScript验证</h2>
        <p>请执行以下JavaScript代码</p>
        <div class="code">${jsCode}</div>
        <form id="form" method="POST" action="/verify">
          <input type="hidden" name="token" value="${challenge.token}">
          <input type="hidden" name="type" value="javascript">
          <input type="hidden" name="result" id="result">
          <button type="button" onclick="verify()">执行验证</button>
        </form>
      </div>
    </body>
    </html>
  `);
}

// Cookie挑战
function handleCookieChallenge(req: Request, res: Response, challenge: any) {
  res.cookie('security_token', challenge.token, {
    maxAge: 300000, // 5分钟
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cookie验证</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .challenge { max-width: 400px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 8px; }
        button { padding: 10px 20px; font-size: 16px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="challenge">
        <h2>🔒 Cookie验证</h2>
        <p>Cookie已设置，请点击继续</p>
        <form method="POST" action="/verify">
          <input type="hidden" name="token" value="${challenge.token}">
          <input type="hidden" name="type" value="cookie">
          <button type="submit">继续访问</button>
        </form>
      </div>
    </body>
    </html>
  `);
}

// 验证处理
export function handleVerification(req: Request, res: Response, next: NextFunction) {
  const { token, type, userAnswer, result } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

  shield.verifyChallenge(clientIp, token, userAnswer || result)
    .then(verified => {
      if (verified) {
        // 验证成功，设置Cookie并重定向
        res.cookie('security_verified', 'true', {
          maxAge: 3600000, // 1小时
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
        res.redirect('/');
      } else {
        res.status(403).json({ error: '验证失败' });
      }
    })
    .catch(error => {
      console.error('验证失败:', error);
      res.status(500).json({ error: '验证处理失败' });
    });
}

// 定期清理过期数据
setInterval(() => {
  shield.cleanup();
}, 60000); // 每分钟清理一次 