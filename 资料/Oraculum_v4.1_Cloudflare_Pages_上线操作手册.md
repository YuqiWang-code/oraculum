# Oraculum v4.1.0 — Cloudflare Pages 正式上线操作手册

> 项目：`YuqiWang-code/oraculum`
>
> GitHub：`https://github.com/YuqiWang-code/oraculum`
>
> 部署基准 commit：`9c36d7577d0f5c14389685a210110f06aff73947`
>
> 当前架构：Vue 3 + TypeScript + Vite + PWA，纯静态、本地 IndexedDB、无后端、无 AI、无 API Key。

## 1. 现在可以直接上线吗？

可以。

当前仓库已经具备 Cloudflare Pages 所需条件：

- `npm run build` 输出 `dist/`
- `public/_redirects` 已存在，内容为 `/* /index.html 200`
- Vue Router 使用 `createWebHistory()`
- PWA manifest / service worker 已生成
- 不依赖服务端
- 不依赖环境变量
- 用户历史只保存在各自设备 IndexedDB

下一步不需要继续开发大型功能，直接做部署和真实手机验收。

## 2. 部署前本地最后检查

项目根目录：

```powershell
cd F:\豆包\Projects\智能推理与预测
```

如果还留有旧 AI 时代的 `.env`，而项目已经完全不再使用它，建议手动删除：

```powershell
Remove-Item .env
```

不要把 `.env` 上传 GitHub，也不要展示其中任何旧密钥。

检查版本：

```powershell
git status
git log -1 --oneline
```

确认最新 commit 为 `9c36d75`。

然后执行：

```powershell
npm run lint
npm run test
npm run validate
npm run build
```

确认全部成功。

## 3. Cloudflare Pages 部署参数

```text
Git provider       GitHub
Repository         YuqiWang-code/oraculum
Production branch  main
Framework preset   Vite
Build command      npm run build
Build output       dist
Root directory     留空
Environment vars   留空
```

如果 Cloudflare 没显示 Vite preset，可以选择 `None`，但 Build command 仍填 `npm run build`，Output 仍填 `dist`。

## 4. Dashboard 逐步操作

1. 登录 Cloudflare Dashboard。
2. 进入 `Workers & Pages`。
3. 点击 `Create application`。
4. 选择 `Pages`。
5. 点击 `Connect to Git`。
6. 选择 `GitHub`。
7. 授权 Cloudflare GitHub App。
8. 建议使用 `Only select repositories`，只授权 `YuqiWang-code/oraculum`。
9. 选择仓库 `YuqiWang-code/oraculum`。
10. 点击 `Begin setup`。
11. 项目名推荐 `oraculum`；如果被占用，可以用 `oraculum-yuqi`、`yuqi-oraculum` 等。
12. Production branch：`main`。
13. Framework preset：`Vite`。
14. Build command：`npm run build`。
15. Build output directory：`dist`。
16. Root directory：留空。
17. Environment variables：留空。
18. 点击 `Save and Deploy`。

Cloudflare 会自动执行：

```text
clone GitHub
→ 安装依赖
→ npm run build
→ 上传 dist/
→ 发布到 pages.dev
```

## 5. 部署成功后

你会得到类似：

```text
https://oraculum-yuqi.pages.dev
```

这个地址就是以后发给朋友的正式地址。

朋友不需要：
- GitHub
- Cloudflare
- Node.js
- 和你同一个 Wi-Fi
- 你的电脑保持开机

## 6. 部署后必须测试

假设地址是：

```text
https://oraculum-yuqi.pages.dev
```

依次测试：

```text
/
/divination
/history
/knowledge
/settings
/about
```

然后直接在地址栏访问并刷新：

```text
/history
/knowledge
/settings
```

不能出现 404。

这依赖 `public/_redirects`：

```text
/* /index.html 200
```

## 7. `/result/:id` 刷新测试

正式站完成一次问卦后，结果 URL 应类似：

```text
https://...pages.dev/result/xxxxx
```

测试：

1. 刷新页面
2. 关闭标签页
3. 再打开相同 URL

同一设备 IndexedDB 里有记录时，应能恢复结果。

注意：把这个 URL 发到另一台设备，并不会同步问卦记录。这是正常设计，因为记录只保存在本机 IndexedDB。

## 8. PWA 安装

### Android

Chrome 打开正式站后，可使用：

```text
安装应用 / 添加到主屏幕
```

项目自己的安装卡片也可触发安装。

### iPhone

使用 Safari：

```text
分享
→ 添加到主屏幕
```

## 9. 离线测试

朋友首次需要在线完整打开一次网站，让 Service Worker 完成缓存。

然后：

1. 在线打开一次
2. 关闭
3. 开飞行模式
4. 从桌面 PWA 图标重新打开

测试：
- 首页
- 问卦
- 知识库
- 历史
- 本地结果

核心功能应仍可用。

## 10. 用户数据

当前没有云同步。

```text
Cloudflare Pages
↓
只托管静态文件
↓
每台设备自己的 IndexedDB
```

所以 A 用户看不到 B 用户历史。

清除网站数据可能删除本地历史，因此重要记录建议用“历史 → 导出 JSON”备份。

## 11. 以后怎么更新

以后只要：

```powershell
git add -A
git commit -m "update: ..."
git push
```

因为 Cloudflare Pages 已连接 `main`：

```text
push main
→ 自动 build
→ 自动发布
→ pages.dev 地址不变
```

## 12. PWA 显示旧版本

如果刚 push 新版，手机仍显示旧内容：

1. 完全关闭 PWA
2. 重新打开
3. 必要时回浏览器刷新正式站

开发测试期间仍旧不更新时，可以清除该站点缓存后重新进入。

## 13. Cloudflare Pages 免费额度

当前 Free plan 对本项目足够：

- 每月最多 500 次 Pages builds
- 静态资源请求免费且不限量
- `pages.dev` 自带 HTTPS
- 可自动部署和预览分支

本项目没有 Pages Functions，日常访问主要是静态资源请求。

## 14. Node.js

Cloudflare Pages 当前 v3 build image 默认 Node.js 22.16.0。

第一次部署建议直接用默认值，不需要额外环境变量。

只有 Build Log 明确出现 Node 兼容问题时，再配置：

```text
NODE_VERSION=22.16.0
```

或增加 `.node-version`。

## 15. npm registry 故障

如果 Cloudflare Build Log 明确报错指向：

```text
registry.npmmirror.com
```

再考虑在本地切回官方 npm 源并重新生成 lockfile。

没有报错时不要提前重写 package-lock。

## 16. 首页正常、子路由 404

检查：

```text
public/_redirects
```

必须包含：

```text
/* /index.html 200
```

构建产物里还应有：

```text
dist/_redirects
```

## 17. PWA 不能安装

检查：

- 地址是否 HTTPS
- manifest 是否可访问
- service worker 是否注册
- icon 是否正常
- Android/iOS 浏览器是否支持相应安装方式

`*.pages.dev` 自带 HTTPS。

## 18. Cloudflare 看不到仓库

检查 GitHub 的 Cloudflare App repository access。

如果只授权过其他仓库，给它增加：

```text
YuqiWang-code/oraculum
```

即可。

## 19. 当前不要做的事

部署阶段不要再：
- 加 AI
- 加后端
- 加云数据库
- 改成 hash router
- 改成 GitHub Pages 子目录 base
- 改 PWA scope
- 改起卦算法
- 改六爻评分

当前目标只有：

> 把已经稳定的 v4.1.0 发布出去并做真实手机测试。

## 20. Cloudflare Pages vs Quick Tunnel

长期正式使用：

```text
Cloudflare Pages
```

临时测试：

```text
cloudflared Quick Tunnel
```

Quick Tunnel 适合几个小时的临时测试，不适合长期正式使用。

## 21. 最终验收清单

- [ ] Deployment successful
- [ ] 首页正常
- [ ] `/divination` 正常
- [ ] `/history` 直接打开正常
- [ ] `/knowledge` 直接打开正常
- [ ] `/settings` 直接打开正常
- [ ] 子路由刷新不 404
- [ ] 梅花起卦正常
- [ ] 六爻起卦正常
- [ ] `/result/:id` 刷新可恢复
- [ ] 知识库正常
- [ ] 历史保存正常
- [ ] JSON 导出正常
- [ ] Android 安装正常
- [ ] iOS 添加主屏幕正常
- [ ] 断网重新打开正常
- [ ] 朋友不同网络访问正常
- [ ] 深色模式正常
- [ ] 320/375/390/430 宽度至少抽测
- [ ] 分享应用 URL 正常

全部通过后，Oraculum v4.1.0 就可以视为正式上线。
