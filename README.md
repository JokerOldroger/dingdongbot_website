# DingDong Interactive Site

一个无构建依赖的 DingDong 响应式官网原型。当前阶段完成了项目框架、首页完整浏览链路、独立功能模块首屏与功能详情滚动切换段，素材已从原始压缩包中提取并重命名，便于后续维护。

## 目录结构

```text
.
├── index.html              # 首页
├── function.html           # 功能模块页面
├── public/
│   └── assets/
│       ├── home/           # 首页模块素材
│       └── function/       # 功能模块素材
├── src/
│   ├── data/               # 页面数据与文案配置
│   ├── scripts/            # 交互脚本
│   └── styles/             # 样式与响应式规则
└── docs/
    └── asset-map.md        # 素材来源映射
```

## 本地预览

### 浏览器预览

```bash
npm run start
```

打开 `http://localhost:5173`。

### Electron 桌面预览

先安装依赖：

```bash
npm install
```

再启动 Electron：

```bash
npm run electron:dev
```

应用会直接加载项目根目录下的 `index.html`，并保留现有多页面导航与静态资源路径。

## 打包 Windows `.exe`

```bash
npm run dist:win
```

打包产物默认输出到 `dist/` 目录，包含：
- `nsis` 安装版（适合发给普通用户安装）
- `portable` 免安装版（适合直接预览）

### 分发说明

- 这个项目目前通过 Electron 直接加载本地静态页面，不需要域名或在线服务。
- 在 macOS 上可以先完成 Electron 集成与本地验证；如需发给大多数 Windows 用户，建议优先构建 `x64` 包。若本机交叉打包受限，可改用 Windows 机器或 CI（如 GitHub Actions Windows runner）生成最终 `.exe`。
- 由于应用默认未做代码签名，Windows 可能会弹出 SmartScreen “未知发布者” 提示；这是未签名桌面应用的常见现象。
