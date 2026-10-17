# 香港云服务器 (43.128.7.140) 网站上线与域名点亮操作指南

> **现状诊断**：浏览器打开 `https://thinkai.vip` 报错 `ERR_CONNECTION_CLOSED`，是因为代码目前仅在 AI Studio 开发沙箱中运行，尚未同步部署到香港服务器 (`43.128.7.140`)，且 Caddy 尚未反向代理前端静态站。  
> **目标**：在 5 分钟内把本项目部署到香港服务器，让 `https://thinkai.vip` 能在公网直接打开，展示完整的正版商品页面供虎皮椒审核！

---

## 步骤一：确认域名解析 (DNS A 记录)

请在您的域名解析后台（如阿里云、腾讯云、Namesilo 或 Cloudflare）确认：
- **主机记录**：`@` 和 `api`
- **记录类型**：`A`
- **记录值**：`43.128.7.140`
- **TTL**：默认 (600秒)

*(如果刚解析，通常 1~5 分钟内全球生效)*

---

## 步骤二：在香港服务器上拉取并运行网站服务

登录香港服务器终端（SSH）：
```bash
ssh root@43.128.7.140
```

执行以下命令快速部署：

```bash
# 1. 创建项目目录
mkdir -p /opt/thinkai-web
cd /opt/thinkai-web

# 2. 将 AI Studio 导出的项目 ZIP 解压到此目录 (或通过 git / scp 上传)
# 目录内应包含 package.json, server.ts, src/, index.html 等

# 3. 安装依赖并执行编译打包
npm install
npm run build

# 4. 使用 pm2 守护进程后台运行生产服务 (3000端口)
npm install -g pm2 tsx
NODE_ENV=production pm2 start "npx tsx server.ts" --name "thinkai-web"

# 查看运行状态 (确认 status 为 online 且监听 3000 端口)
pm2 status
curl http://127.0.0.1:3000/api/license/health
```

---

## 步骤三：配置 Caddy 自动申请 SSL 并反向代理

香港服务器上最轻量、免备案自动配齐 HTTPS 证书的工具是 **Caddy**：

1. 编辑 Caddy 配置文件：
```bash
nano /etc/caddy/Caddyfile
```

2. 写入以下内容（替换为您的配置）：
```caddyfile
thinkai.vip, api.thinkai.vip {
    # 自动向 Let's Encrypt 申请 https 证书
    tls lchzsj8385@gmail.com

    # 将所有网页与 API 反代到本机的 Node 生产服务
    reverse_proxy 127.0.0.1:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

3. 重启并加载 Caddy：
```bash
systemctl restart caddy
# 或者 caddy reload
```

---

## 步骤四：在浏览器中打开验证

在电脑普通浏览器打开：
👉 **`https://thinkai.vip`**

您将看到：
1. 绿色的“官方正版商城”已上线；
2. 尊享年卡 ¥99 / 标准季卡 ¥29.9 明确标价与功能清单；
3. 绿色免安装客户端下载按钮与正规售后说明。

**此时再返回虎皮椒后台提交申请，审核人员打开网站就能看到真实的商业内容，立刻合规获批！**
