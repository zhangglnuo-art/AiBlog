// 部署配置模板。复制为 deploy.config.cjs 并填入真实信息（deploy.config.cjs 已被 gitignore）。
// ⚠️ 不要把真实密码写在本文件里 —— 本文件会被提交到仓库。
module.exports = {
  prod: {
    host: 'your.server.ip',
    port: 22,
    username: 'root',
    password: 'YOUR_SERVER_PASSWORD',
    remotePath: '/var/www/ibve', // 静态文件上传目录
    domain: 'ibve.org', // 站点域名
  },
};
