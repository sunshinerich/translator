# Translator Pro

一款基于 Electron 和 TypeScript 开发的轻量级、中英双向桌面翻译应用，拥有极简的 "Zen" 审美设计。

## 📖 项目简介

主要借助AI生成的翻译工具，用于学习和工作。

## ✨ 主要功能

- **双向翻译**：支持中英文互译，智能识别输入语言。
- **多引擎支持**：内置 Google 翻译、有道翻译（官方 API）和百度翻译（官方 API）。
- **灵活布局**：
    - **窗口缩放**：支持自由调整应用窗口大小。
    - **区域调节**：内置分割条，可自由调节输入框与输出框的比例。
- **高效交互**：
    - **全局快捷键**：使用 `Alt + Space` 快速切换应用显示/隐藏。
    - **剪贴板监听**：开启后可自动翻译剪贴板内容。
    - **置顶显示**：支持窗口始终置顶。
- **系统托盘**：支持最小化到托盘，提供快捷菜单进行显示、隐藏或进入设置。
- **自定义配置**：轻松配置各翻译引擎的 API 密钥。

## 🛠️ 技术栈

- **核心框架**：[Electron](https://www.electronjs.org/)
- **编程语言**：[TypeScript](https://www.typescriptlang.org/)
- **样式处理**：Vanilla CSS (Modern CSS features)
- **构建工具**：[electron-builder](https://www.electron.build/)
- **翻译服务**：Google Translate API, 有道智云 API, 百度翻译开放平台 API

## � 项目目录说明

```text
.
├── src/
│   ├── main.ts          # 主进程代码 (Electron Main Process)
│   ├── preload.ts       # 预加载脚本 (Preload Script)
│   ├── renderer.ts      # 渲染进程逻辑 (Renderer Process)
│   ├── services/        # 业务服务层
│   │   └── translator.ts # 翻译引擎实现
│   ├── ui/              # UI 资源
│   │   └── styles.css    # 样式文件
│   ├── types.d.ts       # TypeScript 类型定义
│   └── md5.d.ts         # MD5 模块定义
├── index.html           # 应用主入口界面
├── package.json         # 项目配置与依赖管理
├── tsconfig.json        # TypeScript 基础配置
├── icon.png             # 应用图标
└── tray-icon.png        # 系统托盘图标
```

## �🚀 安装与运行

### 开发环境准备

确保您的系统中已安装 Node.js 和 npm。

1. 克隆项目：
   ```bash
   git clone https://github.com/sunshine-it/translator-pro.git
   cd translator
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

### 运行应用

在开发模式下启动应用：
```bash
npm start
```

## 📦 构建与发布

使用以下命令构建安装包：

- **构建当前平台**：
  ```bash
  npm run dist
  ```

构建后的产物将存放在 `release` 目录下。

## ⚙️ 配置说明

应用启动后，点击底部的设置图标即可配置翻译引擎：
- **Google 翻译**：默认可用，无需配置。
- **有道翻译**：需要提供 `App Key` 和 `App Secret`。
- **百度翻译**：需要提供 `App ID` 和 `Secret Key`。

## 📄 许可证

本项目采用 [ISC License](LICENSE) 许可。

---
