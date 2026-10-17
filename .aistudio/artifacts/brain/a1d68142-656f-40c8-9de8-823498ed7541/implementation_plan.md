# 虎皮椒 (Xunhupay V3) 聚合支付集成与商业全闭环实施计划

针对您已注册的虎皮椒（微信支付/支付宝个人免营业执照官方结算）服务，本计划制定了完整的服务端 API 对接、MD5 签名校验、自动发卡交付与二级分销返佣闭环流程。

## 用户决策确认 (Confirmed Decisions)

> [!IMPORTANT]
> 虎皮椒 (Xunhupay V3) 只需要 APPID 和 APPSECRET 即可在服务端发起真实调起与回调校验。在测试或未填真实 Key 时，系统自动提供“沙箱模式 / 模拟成功”探针，确保本地联调与生产上线无缝切换。

- **支付网关**：虎皮椒 V3 (`https://api.xunhupay.com/payment/do.html`)
- **支持通道**：微信支付 (`wechat`) / 支付宝 (`alipay`)
- **关键配置项**：`XUNHUPAY_APPID` 与 `XUNHUPAY_APPSECRET`（保存在服务器环境变量或后端安全配置中）
- **核心闭环**：用户下单 ➔ 调起虎皮椒扫码/跳转 ➔ 异步回调 notify ➔ 自动生成卡密 ➔ 分销商获取 40% 佣金 ➔ 客户端可立即使用卡密激活软件

---

## 1. 虎皮椒 API 协议与加密签名规范 (API Protocol & Signature Rules)

### 1.1 发起支付请求算法 (MD5 Signature)
1. 收集非空参数（排除 `hash` 字段）：`appid`, `trade_order_id`, `total_fee`, `title`, `time`, `notify_url`, `return_url`, `nonce_str`, `type` 等。
2. 按参数名 ASCII 码升序排列，拼接为 `key1=value1&key2=value2...`。
3. 在末尾直接追加 `APPSECRET` 字符串。
4. 进行 MD5 哈希计算，转为 32 位小写字符串作为 `hash`。

```
┌────────────────────────────────────────────────────────────────────────┐
│                        虎皮椒聚合支付全闭环时序图                       │
└────────────────────────────────────────────────────────────────────────┘

  买家 (StoreFront)           后端服务 (server.ts)          虎皮椒 (Xunhupay V3)
       │                            │                               │
       │ 1. 选择套餐 (季卡/年卡)     │                               │
       │    填写分销码 VIP888       │                               │
       │ ─────────────────────────> │                               │
       │                            │ 2. 计算 MD5 签名 (hash)        │
       │                            │ 3. 发起请求 POST do.html      │
       │                            │ ────────────────────────────> │
       │                            │                               │
       │                            │ 4. 返回 url_qrcode / url      │
       │                            │ <──────────────────────────── │
       │ 5. 展示微信/支付宝二维码    │                               │
       │ <───────────────────────── │                               │
       │                                                            │
       │ 6. 买家使用微信/支付宝扫码支付                             │
       │ ─────────────────────────────────────────────────────────> │
       │                                                            │ 7. 异步通知回调
       │                            │ POST /api/payment/xunhupay/notify
       │                            │ <──────────────────────────── │
       │                            │ 8. 校验回调 MD5 签名          │
       │                            │ 9. 状态 OD ➔ 自动发卡         │
       │                            │ 10. 结算分销佣金 (40%)        │
       │                            │ 11. 响应 "success"            │
       │ 12. 轮询 /api/payment/status                            │
       │ ➔ 自动显示新卡密并跳转激活  │                               │
       ▼                            ▼                               ▼
```

---

## 2. 新增接口与路由设计 (Backend API Routes)

### 2.1 发起支付 API (`POST /api/payment/xunhupay/create`)
- **请求参数**：
  ```json
  {
    "plan": "annual",
    "payment_method": "wechat",
    "referrer_code": "VIP888",
    "buyer_email": "user@example.com"
  }
  ```
- **核心逻辑**：
  - 计算金额（年卡 99 元，季卡 29.9 元）。
  - 生成唯一订单号 `ORD-${Date.now()}-${random}`。
  - 构造虎皮椒请求参数并进行 MD5 签名。
  - 请求 `https://api.xunhupay.com/payment/do.html`。
  - 若配置了真实 APPID/APPSECRET，返回真实微信/支付宝二维码 URL (`url_qrcode`) 或支付跳转链接；未配置则切换为即时演示沙箱。

### 2.2 异步回调通知 API (`POST /api/payment/xunhupay/notify`)
- **虎皮椒回调参数**：`trade_order_id`, `total_fee`, `transaction_id`, `open_order_id`, `status` ("OD" 表示成功), `appid`, `time`, `nonce_str`, `hash`。
- **业务处理**：
  1. 验证回调签名 `hash`。
  2. 确认 `status === 'OD'` 且订单未重复处理。
  3. 自动调生成算法生成全新卡密（例如 `YEAR-99A8-71B2-C4D5`）。
  4. 计算分销商佣金（如 99 元 * 40% = 39.60 元），并归入分销商名下。
  5. 更新订单状态为 `paid`。
  6. 返回 plain/text 响应 `"success"`。

### 2.3 订单状态查询 API (`GET /api/payment/status?order_id=...`)
- 前端二维码弹窗每 2 秒静默轮询，一旦订单变更为 `paid`，前端弹窗自动转换为“支付成功！您的卡密为：XXXX-XXXX-XXXX-XXXX”，并提供一键复制与立即激活按钮。

---

## 3. 前端与配置界面增强 (UI & Configuration Upgrades)

1. **商店前端 (StoreFront) 升级**：
   - 增加“虎皮椒微信支付”与“虎皮椒支付宝”原生选择入口。
   - 包含二维码弹窗与实时支付状态监听器。
2. **控制中心 (CloudControlCenter) 增加虎皮椒密钥设置面板**：
   - 提供 APPID 和 APPSECRET 的安全输入框与联调测试探针。
   - 提供“一键测试虎皮椒回调”按钮，无需真钱即可测试完整发卡与分销流程。

---

## 4. 实施与验证步骤 (Execution Steps)

- [ ] 1. 在 `server.ts` 中实现虎皮椒 MD5 签名生成器与验签函数。
- [ ] 2. 增加 `/api/payment/xunhupay/create` 与 `/api/payment/xunhupay/notify` 接口。
- [ ] 3. 升级 `StoreFront.tsx` 中的调起逻辑与轮询状态弹窗。
- [ ] 4. 在 `CloudControlCenter.tsx` 中添加虎皮椒配置与测试面板。
- [ ] 5. 执行编译与自动化测试，验证全链路“下单 ➔ 支付 ➔ 回调 ➔ 发卡 ➔ 分销 ➔ 激活”闭环。
