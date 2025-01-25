# Web Monitor 使用说明

Cursor 成员数据监控工具，用于获取和监控设置页面的成员列表。

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

## 运行模式

1. 单次获取：获取一次数据后自动退出
2. 持续监控：按指定间隔持续获取数据，按 Ctrl+C 退出

## 数据存储

所有数据文件保存在 `data/webMonitor` 目录下，格式为 JSON：

```json
[
  {
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
