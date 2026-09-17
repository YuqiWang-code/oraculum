# 手机使用与 PWA 安装

## 1. 局域网快速测试

```bash
npm run build
npm run preview -- --host
```

或开发模式：

```bash
npm run dev -- --host
```

手机与电脑连同一 Wi-Fi，浏览器打开 `http://<电脑局域网IP>:5173`（或 preview 的端口）。

## 2. HTTPS 部署后安装为 PWA

1. `npm run build` 生成 `dist/`。
2. 把 `dist/` 部署到任意 HTTPS 静态托管（Netlify/Vercel/GitHub Pages/自己的 Nginx）。
3. 用手机浏览器打开站点：
   - Android Chrome：菜单 → "添加到主屏幕 / 安装应用"。
   - iOS Safari：分享 → "添加到主屏幕"。
4. 安装后可离线打开，service worker 缓存静态资源。

> PWA 要求 HTTPS（localhost 除外）。manifest 已在 `vite.config.ts` 配置：名称、图标、theme_color、standalone。

## 3. Android APK 二期方向（未实现）

如后续要打包成 APK，可用 Capacitor：

```bash
npm i @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap sync
npx cap open android
```

把 `webDir` 指向 `dist`。v1 不打包 APK，先保证 PWA 稳定可离线。
