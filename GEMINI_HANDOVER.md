# Gemini 接手前必读：已验收版本与部署边界

本分支保存 Codex 于 2026-10-17 完成的下载与授权修复。同步源码不代表执行部署；本次没有重启、覆盖或重新部署现有网站与客户端。

## 已验收的真实功能

- https://thinkai.vip/downloads/ThinkAI_Wechat_Assistant_Win_x64_Green.zip 是实际 Windows x64 免安装客户端，不是前端生成的演示 ZIP。
- 版本 0.3.0-rc.2；159543249 字节；SHA256 `2a12e0903c3dbc503bce56d503b87072114b4947ba5be7640e38c6f442566256`。
- 官网真实点击下载、完整公网下载与本地文件校验一致。
- 卡密激活、续期、72 小时离线边界验证通过，服务重启后签名公钥及绑定保持不变。
- macOS 未发布，在线收款未开放。不要解除禁用状态或恢复演示支付、演示 ZIP 回退。

## 生产结构（不要自行改变）

```
HTTPS Caddy
  /api/license/*  -> 127.0.0.1:8788（独立持久授权服务）
  /api/payment/*  -> 127.0.0.1:8788（明确返回503，尚未开放）
  /downloads/*    -> 127.0.0.1:8788（已验收真实ZIP）
  其余请求       -> 127.0.0.1:3000（原网站前端）
```

- 实际授权代码：`services/license/authority.cjs`。由服务器 systemd `thinkai-authority.service` 运行。
- 私钥与授权状态保存在服务器 `/home/ubuntu/.local/share/thinkai-authority`，不得上传、删除、替换或重新生成。仅公钥可进入客户端与仓库。
- 公钥 SPKI DER SHA256：`6f7aecfce26c7f653a38677d965d0d5b280c84e8991cf28db99285f031db45f2`。
- root `server.ts`、`src/server/licenseService.ts` 和 `mock-license-server.*` 仍有历史演示逻辑；它们不是生产授权核心。不得用它们替换8788服务或绕过 Caddy 路由。
- 生产临时上传令牌已撤除；不要重开上传入口。本仓库不包含任何服务器私钥、真实环境变量、授权状态或 ZIP 二进制。

## 可以进行的前端工作

1. 从本修复分支开始，不要从旧 main 覆盖修复。
2. 先在独立分支修改样式与文案，保留真实 Windows 下载地址、Mac未发布提示、付款未开放提示。
3. 提交差异供核对，构建验证后再单独安排部署。不要自动 `git pull`、运行一键部署脚本、重启PM2/Caddy或修改授权公钥。
4. 不要把模拟订单、代理演示界面、返佣示例当作已验证的商业功能。

## 支付安全与未完成事项

支付密钥曾出现在旧源码中。本分支移除了识别到的硬编码支付密钥与演示私钥文本，但历史提交仍存在；不能据此认为密钥已安全。真实收款前必须在支付平台轮换密钥，之后单独验收支付、验签、真实发卡、持久订单和佣金权限隔离。

Windows 客户端完整源码目前保留在本地独立工程，不在这个网站仓库；本分支附带公开公钥和发布清单，不把整个 Electron 工程误混入网站源码。

## 备份与回退

- 本次同步前仓库基线：`18f70b0b3612a9c1cc9c4d3ac52823ac1ee35681`。本地已创建并验证完整 git bundle 备份。
- 服务器原前端备份：`/opt/thinkai-backups/frontend-download-before-20261017`。
- Caddy 切换前备份：`/opt/thinkai-backups/caddy-before-authority-switch-20261017`。
- 不要把包含旧敏感信息的原始备份重新上传 GitHub。
