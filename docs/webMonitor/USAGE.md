# Web Monitor 使用说明

Cursor 成员数据监控工具，用于获取和监控设置页面的成员列表。支持按团队分类管理数据。

## 启动步骤

1. 先关闭所有 Chrome 进程

```bash
# MacOS
pkill -9 -a -i "Google Chrome"

# Windows
taskkill /F /IM "chrome.exe"
```

2. 启动调试模式的 Chrome

```bash
# MacOS
bun run chrome:mac

# Windows
bun run chrome:win

# Linux
bun run chrome:linux
```

3. 在新打开的 Chrome 窗口中登录到 Cursor 设置页面
   https://www.cursor.com/settings

4. 运行数据获取脚本

```bash
bun run monitor
```

## 运行配置

1. 团队名称：输入要监控的团队名称（必填）
2. 文件名：默认为 `team-{团队名}-data.json`，可自定义
3. 运行模式：
   - 单次获取：获取一次数据后自动退出
   - 持续监控：按指定间隔持续获取数据，按 Ctrl+C 退出
4. 监控间隔：持续监控模式下的数据获取间隔（秒），默认为 5 秒

## 数据存储

所有数据文件保存在 `data` 目录下，格式为 JSON：

```json
[
  {
    "team": "团队名称",
    "timestamp": "2024-01-25T16:00:00.000Z",
    "totalMembers": 76,
    "members": [
      {
        "name": "用户名",
        "email": "用户邮箱",
        "lastUsed": "最后使用时间",
        "role": "用户角色"
      }
    ]
  }
]
```

## 数据管理建议

1. 为不同团队创建独立的数据文件，便于分别管理和分析
2. 文件命名建议使用默认的 `team-{团队名}-data.json` 格式，方便识别
3. 定期备份数据文件，避免数据丢失
