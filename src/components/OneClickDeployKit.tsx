import { useState } from 'react';
import { Terminal, Copy, Check, Rocket, Server, ShieldCheck, ExternalLink, Sparkles, AlertCircle, FileCode } from 'lucide-react';

const DOCKER_COMPOSE_CONTENT = `version: '3.8'

services:
  # 1. 独角数卡 Dujiao-Next 主服务
  dujiao:
    image: ghcr.io/dujiaoka/dujiao-next:latest
    container_name: dujiao-app
    restart: always
    ports:
      - "80:8000"
    environment:
      - APP_NAME=SoftwareStore
      - APP_ENV=production
      - APP_DEBUG=false
      - APP_URL=http://localhost
      - DB_CONNECTION=mysql
      - DB_HOST=dujiao-mysql
      - DB_PORT=3306
      - DB_DATABASE=dujiao
      - DB_USERNAME=dujiao_user
      - DB_PASSWORD=YourStrongPassword2026
      - REDIS_HOST=dujiao-redis
      - REDIS_PORT=6379
    volumes:
      - ./dujiao/storage:/app/storage
      - ./dujiao/uploads:/app/public/uploads
    depends_on:
      - dujiao-mysql
      - dujiao-redis

  # 2. 独立 MySQL 数据库容器
  dujiao-mysql:
    image: mysql:5.7
    container_name: dujiao-mysql
    restart: always
    environment:
      - MYSQL_DATABASE=dujiao
      - MYSQL_USER=dujiao_user
      - MYSQL_PASSWORD=YourStrongPassword2026
      - MYSQL_ROOT_PASSWORD=RootSecretPassword2026
    volumes:
      - ./mysql/data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  # 3. Redis 缓存服务 (用于加速与防并发抢单)
  dujiao-redis:
    image: redis:alpine
    container_name: dujiao-redis
    restart: always
    volumes:
      - ./redis/data:/data`;

const ONE_LINE_SCRIPT = `curl -sSL https://raw.githubusercontent.com/your-org/dujiao-deploy/main/quick-deploy.sh | bash`;

const MANUAL_COMMANDS = `# 1. 更新系统并安装 Docker 与 Docker Compose
sudo apt-get update && sudo apt-get install -y docker.io docker-compose

# 2. 创建部署目录
mkdir -p /opt/dujiao-store && cd /opt/dujiao-store

# 3. 下载配置并一键拉起容器
cat << 'EOF' > docker-compose.yml
version: '3.8'
services:
  dujiao:
    image: ghcr.io/dujiaoka/dujiao-next:latest
    container_name: dujiao-app
    restart: always
    ports:
      - "80:8000"
    environment:
      - APP_NAME=软件卡密发卡中心
      - DB_CONNECTION=mysql
      - DB_HOST=dujiao-mysql
      - DB_DATABASE=dujiao
      - DB_USERNAME=dujiao_user
      - DB_PASSWORD=StorePassword2026
    depends_on:
      - dujiao-mysql
  dujiao-mysql:
    image: mysql:5.7
    restart: always
    environment:
      - MYSQL_DATABASE=dujiao
      - MYSQL_USER=dujiao_user
      - MYSQL_PASSWORD=StorePassword2026
      - MYSQL_ROOT_PASSWORD=RootPassword2026
    volumes:
      - ./mysql-data:/var/lib/mysql
EOF

# 4. 启动发卡商城
sudo docker-compose up -d`;

export function OneClickDeployKit() {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              为您准备好的【全自动接管部署交付方案】
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            您无需学习任何 Docker 运维细节，只需在腾讯云后台执行一键自动化脚本
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>全自动编排 · 100% 容器隔离 · 绝无环境报错</span>
        </div>
      </div>

      {/* 2 Ways Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">1</span>
            方式 A：我为您打包好 Docker 脚本，您在腾讯云点一次“粘贴”
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            服务器在您自己的腾讯云账号下，最安全可控。您在腾讯云控制台点<strong>【登录 (WebShell)】</strong>，弹出一个黑底网页窗口，把下面的全自动脚本<strong>直接右键粘贴进去敲回车</strong>，3分钟内自动完成所有安装并输出商城地址！
          </p>
        </div>

        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/10">
          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">2</span>
            方式 B：连这 32 元服务器都省了，直接由我部署到纯 Serverless
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            如果您甚至不想管任何服务器，我可以把全套发卡收银台、一级推广返佣和机器码授权直接编译成前端 + Cloudflare Workers，一键免费发布上线，永久 0 维护！
          </p>
        </div>
      </div>

      {/* Step by step for Way A */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-5 border border-slate-800 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <div className="text-xs text-indigo-400 font-mono uppercase font-bold tracking-wider">
              腾讯云 WebShell 粘贴即装脚本 (Docker 自动版)
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              仅需复制下方指令，在腾讯云网页终端粘贴敲回车：
            </div>
          </div>
          <button
            onClick={() => handleCopy(MANUAL_COMMANDS, 'commands')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copiedType === 'commands' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>已复制脚本</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>一键复制全自动命令</span>
              </>
            )}
          </button>
        </div>

        <pre className="font-mono text-xs text-indigo-300/90 bg-slate-950 p-4 rounded-lg overflow-x-auto max-h-64 border border-slate-800 leading-relaxed">
          {MANUAL_COMMANDS}
        </pre>
      </div>

      {/* Visual Step Guide on Tencent Cloud */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-xs">
        <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-indigo-500" />
          腾讯云后台操作图示指南（只要 3 步）：
        </div>
        <ol className="space-y-1.5 pl-4 list-decimal text-slate-600 dark:text-slate-300 leading-relaxed">
          <li>
            打开腾讯云控制台的<strong>【轻量应用服务器】</strong>列表，找到刚才买好的香港服务器，点击卡片右上角的<strong>【登录】</strong>（官方叫 WebShell，网页内直接打开终端，不需要下载任何 Putty 或 Xshell 软件）。
          </li>
          <li>
            网页跳出一个黑色终端窗口，在里面点击鼠标右键选择<strong>【粘贴】</strong>刚才复制的这串代码，按下键盘上的 <strong>回车键 (Enter)</strong>。
          </li>
          <li>
            屏幕会自动滚屏安装 Docker、自动拉取 Dujiao-Next 和 MySQL，<strong>约 2 分钟跑完后，在浏览器直接输入您的服务器公网 IP，漂亮的商城前台就瞬间出现在眼前！</strong>
          </li>
        </ol>
      </div>
    </div>
  );
}
