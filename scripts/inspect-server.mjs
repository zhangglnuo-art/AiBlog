// 只读探测服务器现状：不改任何东西，只看清楚环境再决定怎么部署。
import { NodeSSH } from 'node-ssh';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cfg = require('../deploy.config.cjs').prod;

const ssh = new NodeSSH();
const run = async (cmd) => {
  const r = await ssh.execCommand(cmd);
  return (r.stdout || r.stderr || '').trim();
};

console.log(`连接 ${cfg.username}@${cfg.host}:${cfg.port} ...`);
await ssh.connect({
  host: cfg.host,
  port: cfg.port,
  username: cfg.username,
  password: cfg.password,
  readyTimeout: 20000,
});
console.log('✅ 已连接\n');

const checks = {
  '系统版本': 'cat /etc/os-release 2>/dev/null | grep PRETTY_NAME',
  'CPU/内存': "nproc | tr '\\n' ' '; free -h | awk '/Mem/{print $2\" total\"}'",
  '已装 Web 服务器': 'which nginx caddy apache2 httpd 2>/dev/null || echo 无',
  'nginx 版本': 'nginx -v 2>&1 || echo 未安装',
  '80/443 端口占用': "ss -ltnp 2>/dev/null | grep -E ':80 |:443 ' || echo 无监听",
  'Docker': 'docker ps --format "{{.Names}} -> {{.Ports}}" 2>/dev/null || echo 无docker或无容器',
  '/var/www 现状': 'ls -la /var/www 2>/dev/null || echo 目录不存在',
  'nginx 站点配置': 'ls /etc/nginx/conf.d/ /etc/nginx/sites-enabled/ 2>/dev/null || echo 无',
  '域名解析(服务端看)': "getent hosts ibve.org || echo 未解析",
  '本机公网IP': 'curl -s --max-time 5 ifconfig.me || echo 取不到',
};

for (const [label, cmd] of Object.entries(checks)) {
  const out = await run(cmd);
  console.log(`【${label}】\n${out}\n`);
}

ssh.dispose();
