# Cursor Auto

自动化工具集合，用于提升 Cursor 使用效率。

## 功能模块

### 1. Web Monitor

监控 Cursor 设置页面的成员列表数据，支持单次获取和持续监控两种模式。

#### 功能特点

- 支持单次获取和持续监控模式
- 自动保存为 JSON 格式
- 支持自定义监控间隔
- 使用 TypeScript 开发
- 支持 Windows/MacOS/Linux

### 2. Excel 处理工具

提供 Excel 文件的读写、更新和比对功能。

#### 功能特点

- 支持创建新的 Excel 文件
- 支持向现有文件添加新工作表
- 支持更新现有工作表数据（覆盖/追加模式）
- 支持读取指定列数据
- 使用 TypeScript 开发，提供类型安全

### 3. 邮箱比对工具

比对不同数据源中的邮箱信息，支持 JSON 和 Excel 格式。

#### 功能特点

- 支持多数据源比对（JSON/Excel）
- 自动检测重复邮箱
- 支持导出比对结果
- 提供详细的比对报告
- 支持中文字符对齐显示

## 快速开始

1. [安装说明](docs/INSTALL.md)
2. [Web Monitor 使用说明](docs/webMonitor/USAGE.md)
3. [邮箱比对工具使用说明](docs/scripts/compareEmails.md)

## 许可证

MIT
