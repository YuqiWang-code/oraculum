# 临时跨网络分享（cloudflared 快速隧道）

本文档用于**临时**把本地运行的应用通过公网链接分享给他人测试，**不是正式部署**。

## 操作步骤

1. 先在项目根目录执行构建：

   ```bash
   npm run build
   ```

2. 启动本地预览服务：

   ```bash
   npm run preview
   ```

   Vite preview 默认监听 `http://localhost:4173`，保持该终端窗口不要关闭。

3. 另开一个终端，确认已安装 `cloudflared`。如未安装：

   - Windows：可直接下载 `cloudflared-windows-amd64.exe`，或使用 winget 安装：

     ```powershell
     winget install --id Cloudflare.cloudflared
     ```

4. 启动临时隧道，把本地 4173 端口暴露到公网：

   ```bash
   cloudflared tunnel --url http://localhost:4173
   ```

5. 命令运行后会输出一个形如 `https://xxxx.trycloudflare.com` 的临时地址，复制该链接分享给对方即可访问。

## 注意事项

- **仅用于临时测试**：这不是正式部署，不要当作长期线上服务使用。
- **本机必须保持开机**：`npm run preview` 与 `cloudflared` 两个进程都不能关闭，电脑也不能休眠/断网，否则链接立即失效。
- **URL 每次可能变化**：`trycloudflare.com` 临时域名在每次重启隧道时都会重新分配，不固定。
- **正式使用请走 Cloudflare Pages**：长期、稳定、可自动部署的线上版本请参考 [DEPLOY_CLOUDFLARE_PAGES.md](./DEPLOY_CLOUDFLARE_PAGES.md)。
- **隐私风险**：分享出去的链接任何人拿到都能访问，请勿在其中输入敏感或私密信息。
