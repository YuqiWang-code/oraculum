# 部署到 Cloudflare Pages

本文档说明如何将本项目（Vite + Vue 3 PWA）部署到 Cloudflare Pages 静态托管。

## 前置条件

- 代码已推送到 GitHub 仓库 `YuqiWang-code/oraculum`，主分支为 `main`
- 本地可正常执行 `npm install` 与 `npm run build`

## 部署步骤

1. 登录 Cloudflare Dashboard（<https://dash.cloudflare.com>），进入左侧 **Workers & Pages**。
2. 点击 **Create application**。
3. 选择 **Pages** 标签页，点击 **Connect to Git**。
4. 选择 **GitHub** 并完成 OAuth 授权，允许 Cloudflare 访问对应仓库。
5. 选择仓库 **`YuqiWang-code/oraculum`**。
6. 配置构建参数：
   - **Production branch**：`main`
   - **Framework preset**：`Vite`（如无该预设则选 `None`）
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
7. **环境变量**：本项目无需额外环境变量，保持留空即可。
8. 点击 **Save and Deploy**，等待 Cloudflare 拉取代码并执行构建。
9. 构建完成后，获得形如 `https://<项目名>.pages.dev` 的正式域名。
10. 此后每次向 `main` 分支 push 代码，Cloudflare Pages 都会自动触发重新部署，无需手动操作。
11. （可选）在 Pages 项目的 **Custom domains** 中绑定自定义域名。
12. 验证部署：访问 `https://<你的项目>.pages.dev`，并直接刷新 `/history`、`/knowledge`、`/settings` 等子路由，确认不会出现 404（依赖根目录 `public/_redirects` 的 SPA 回退规则 `/*  /index.html  200`）。

## 说明

- `public/_redirects` 会在构建时被原样拷贝到 `dist/_redirects`，无需在 Cloudflare 控制台额外配置重定向。
- `vite.config.ts` 中 `base` 保持默认 `/`，PWA manifest 的 `start_url` 与 `scope` 均为 `/`，与 Cloudflare Pages 根域名部署匹配，不要改成子路径。

## 备选：GitHub Pages

Cloudflare Pages 为本次推荐方案。如果确需改用 GitHub Pages 作为 project site（即部署到 `https://<用户名>.github.io/oraculum/` 子路径），则必须：

- 将 `vite.config.ts` 的 `base` 改为 `'/oraculum/'`；
- 同步调整 PWA manifest 的 `start_url` 与 `scope` 为 `'/oraculum/'`；
- 处理 `_redirects` 在 GitHub Pages 上不生效的问题（GitHub Pages 不支持 Cloudflare 的 `_redirects` 语法，需改用 404.html 回退方案）。

这会显著增加 PWA 子路径部署与路由回退的复杂度，**本轮不推荐**，仅在此作为备选方案记录。
