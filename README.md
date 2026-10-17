# ThinkAI 网站：下载与授权修复快照

开始修改前请先阅读 [GEMINI_HANDOVER.md](GEMINI_HANDOVER.md)。

本仓库同时包含历史演示面板与生产修复代码，不能直接把所有演示功能部署为真实业务。

- 官网 Windows 真实下载与授权测试已经验收。
- 独立生产授权核心位于 `services/license/authority.cjs`，不是旧 `server.ts` 的演示授权逻辑。
- 在线付款、自动发卡、分销结算未上线；macOS未发布。
- `deploy/` 是脱敏配置参考，不是自动安装或覆盖脚本。不要修改服务器现有私钥、数据或授权路由。
- 私钥、支付密钥、授权状态、客户数据和客户端ZIP不得提交到仓库。

独立授权回归测试（不联网、不使用生产私钥）：

```sh
node --test services/license/authority.test.cjs
```

本次修复以独立分支和合并请求交付；不自动合并主分支或重新部署。
