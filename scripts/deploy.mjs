// 本地一键部署：把 dist/ 上传到你的服务器并配好 nginx。
// 用法：先开好 VPN/代理（确保能连上服务器），再运行 pnpm deploy。
// 依赖 deploy.config.cjs（已 gitignore）里的 host/username/password/remotePath/domain。
import { NodeSSH } from 'node-ssh';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cfg = require('../deploy.config.cjs').prod;

const DIST = new URL('../dist', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
if (!existsSync(DIST)) {
  console.error('❌ 找不到 dist/，请先 pnpm build（或用 pnpm deploy 会自动构建）');
  process.exit(1);
}

const { host, port = 22, username, password, remotePath, domain } = cfg;
const ssh = new NodeSSH();

const exec = async (cmd, label) => {
  const r = await ssh.execCommand(cmd);
  if (r.code !== 0) {
    console.error(`❌ ${label || 'command'} 失败:\n${r.stderr || r.stdout}`);
    throw new Error(label);
  }
  return (r.stdout || '').trim();
};

// nginx 站点配置（$uri 用 \$ 转义，避免被本地 shell 解析）
const nginxConf = `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${domain} www.${domain} _;
    root ${remotePath};
    index index.html;
    location / { try_files \\$uri \\$uri/ \\$uri.html =404; }
    error_page 404 /404.html;
}`;

try {
  console.log(`🔌 连接 ${username}@${host}:${port} ...`);
  await ssh.connect({ host, port, username, password, readyTimeout: 25000 });
  console.log('✅ 已连接');

  // 1) 确保 nginx 已安装（幂等，兼容 apt/dnf/yum）
  const hasNginx = (await ssh.execCommand('command -v nginx')).code === 0;
  if (!hasNginx) {
    console.log('📦 服务器未装 nginx，正在安装 ...');
    await exec(
      'if command -v apt-get >/dev/null; then export DEBIAN_FRONTEND=noninteractive; apt-get update -y && apt-get install -y nginx; ' +
        'elif command -v dnf >/dev/null; then dnf install -y nginx; ' +
        'elif command -v yum >/dev/null; then yum install -y nginx; ' +
        'else echo "no known package manager"; exit 1; fi',
      '安装 nginx',
    );
  } else {
    console.log('✓ nginx 已安装');
  }

  // 2) 建站点目录 + 写 nginx 配置
  console.log('🗂  准备目录与 nginx 配置 ...');
  await exec(`mkdir -p ${remotePath}`, 'mkdir');
  await ssh.execCommand('rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf');
  const confDir = (await ssh.execCommand('test -d /etc/nginx/conf.d && echo yes')).stdout.trim();
  const confPath = confDir === 'yes' ? '/etc/nginx/conf.d/ibve.conf' : '/etc/nginx/sites-enabled/ibve.conf';
  await exec(`cat > ${confPath} <<'NGINXEOF'\n${nginxConf}\nNGINXEOF`, '写 nginx 配置');
  await exec('nginx -t', 'nginx 配置检查');

  // 3) 上传 dist/ 内容到站点目录
  console.log('⬆️  上传 dist/ ...');
  const ok = await ssh.putDirectory(DIST, remotePath, {
    recursive: true,
    concurrency: 8,
    validate: (p) => !p.includes('node_modules'),
  });
  if (!ok) throw new Error('上传过程中有文件失败');

  // 4) 重载 nginx
  await exec('systemctl enable nginx >/dev/null 2>&1; systemctl restart nginx || service nginx restart', '重启 nginx');

  console.log('\n✅ 部署完成！');
  console.log(`   服务器目录: ${remotePath}`);
  console.log(`   访问(按 IP): http://${host}/`);
  console.log(`   访问(按域名): http://${domain}/  （需 DNS 已指向 ${host}）`);
} catch (e) {
  console.error('\n部署中断:', e.message);
  process.exitCode = 1;
} finally {
  ssh.dispose();
}
