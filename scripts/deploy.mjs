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

const {
  host,
  port = 22,
  username,
  password,
  remotePath,
  domain,
  // Cloudflare Origin 证书路径（放到服务器这两个路径即自动启用 HTTPS/443）。可在 deploy.config.cjs 覆盖。
  sslCert = '/etc/nginx/ssl/ibve.pem',
  sslKey = '/etc/nginx/ssl/ibve.key',
} = cfg;
const ssh = new NodeSSH();

const exec = async (cmd, label) => {
  const r = await ssh.execCommand(cmd);
  if (r.code !== 0) {
    console.error(`❌ ${label || 'command'} 失败:\n${r.stderr || r.stdout}`);
    throw new Error(label);
  }
  return (r.stdout || '').trim();
};

// nginx 站点配置（heredoc 用引号定界符 <<'NGINXEOF'，远端 shell 不做变量展开，$uri 原样写入，无需转义）
// 站点使用 Astro trailingSlash:'always'，页面只有 /path/ 形式。
// 下面的 if 把「无扩展名且缺尾斜杠」的路径 301 到带斜杠版，保证 URL 唯一（避免重复内容）；
// 带扩展名的静态资源(.png/.svg/.xml/.txt 等)因含「.」不会被匹配，正常直出。
const siteBody = `    root ${remotePath};
    index index.html;

    if ($uri ~ "^[^.]*[^/]$") {
        return 301 $uri/$is_args$args;
    }

    location / { try_files $uri $uri/ $uri.html =404; }
    error_page 404 /404.html;`;

// 站点在 Cloudflare 后面：
// - 80 与 443 都直出同样内容，不在源站强制 80→443 跳转（否则 Cloudflare「Flexible」模式回源会成环）。
//   访客的 http→https 升级交给 Cloudflare 的「Always Use HTTPS」在边缘完成。
// - 443 块仅在服务器存在证书时才生成，避免没证书时 nginx -t 失败。
const buildNginxConf = (ssl) => {
  const httpServer = `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${domain} www.${domain} _;
${siteBody}
}`;
  if (!ssl) return httpServer;
  const httpsServer = `server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name ${domain} www.${domain} _;
    ssl_certificate ${ssl.cert};
    ssl_certificate_key ${ssl.key};
${siteBody}
}`;
  return `${httpServer}\n\n${httpsServer}`;
};

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

  // 探测证书：两个文件都在 → 启用 HTTPS(443)；否则仅 HTTP(80)
  const hasSsl =
    (await ssh.execCommand(`test -f ${sslCert} && test -f ${sslKey} && echo yes`)).stdout.trim() ===
    'yes';
  if (hasSsl) {
    console.log(`🔐 检测到证书 → 启用 HTTPS(443)：${sslCert}`);
  } else {
    console.log(
      `ℹ️  未检测到证书(${sslCert})，仅配置 HTTP(80)。\n` +
        `   放好 Cloudflare Origin 证书到该路径后重跑本命令即可启用 443（配合 Cloudflare 切 Full(strict)）。`,
    );
  }
  const nginxConf = buildNginxConf(hasSsl ? { cert: sslCert, key: sslKey } : null);

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
  console.log(`   源站直连(按 IP): http://${host}/`);
  console.log(`   访问(按域名): ${hasSsl ? 'https' : 'http'}://${domain}/  （经 Cloudflare）`);
  if (hasSsl) {
    console.log('   已启用源站 443 → 现在可把 Cloudflare SSL/TLS 模式切到 Full (strict)。');
  } else {
    console.log('   源站暂无 443 → Cloudflare SSL/TLS 请用 Flexible，否则 https 会 521。');
  }
} catch (e) {
  console.error('\n部署中断:', e.message);
  process.exitCode = 1;
} finally {
  ssh.dispose();
}
