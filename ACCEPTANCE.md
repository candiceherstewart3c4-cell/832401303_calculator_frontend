# 本地验收记录

课程：EE308FZ；FZU：832401303；MUID：241215237。验收日期：2026-10-03。

环境：Windows、Node.js 24.15.0、Codex 内置浏览器。前端独立监听 http://127.0.0.1:4187，后端独立监听 http://127.0.0.1:3187，通过 HTTP/JSON 和限定来源的 CORS 联调。

本次浏览器验收使用独立测试数据库，未修改原有 `backend/data/calculator.sqlite`。截图中的计算时间由浏览器按本地时区显示。

## 验收结论

- 四则、小数、优先级、括号、一元正负号均返回预期结果。
- 除零与非法表达式显示后端错误，数据库没有插入失败记录。
- 刷新前端保留历史；单条删除后重新查询，直接 SQL 检查确认该 ID 不存在。
- 收藏在刷新后保留；搜索、分页、历史复用正常。
- DEG/RAD 科学计算、Enter 键、进制转换与温度换算正常。
- 后端停止后，新计算报连接错误，按钮仍可编辑表达式；重新启动后恢复历史与收藏。
- 390×844 手机宽度未出现水平溢出；修复了滚动时固定校园标识遮挡计算区域的问题。

自动化检查共 11 项通过：后端 10 项（表达式、HTTP/数据库及扩展功能），前端 1 项（独立静态服务、API 地址配置与文件访问校验）。从两个独立仓库克隆后分别执行 npm test，无需第三方依赖。

## 截图及说明

| 文件 | 实际演示 |
|---|---|
| [01 主界面](docs/screenshots/01-main-interface.jpg) | 前端连接独立后端，初始历史为空 |
| [02 加法](docs/screenshots/02-addition.jpg) | 12+8 = 20 |
| [03 减法](docs/screenshots/03-subtraction.jpg) | 8-3 = 5 |
| [04 乘法](docs/screenshots/04-multiplication.jpg) | 6×7 = 42；API 表达式使用 * |
| [05 除法](docs/screenshots/05-division.jpg) | 10÷2 = 5；API 表达式使用 / |
| [06 小数](docs/screenshots/06-decimal.jpg) | 0.1+0.2 = 0.3，显示结果按 15 位有效数字整理 |
| [07 优先级](docs/screenshots/07-precedence.jpg) | 1+2×3 = 7，乘法先执行 |
| [08 括号](docs/screenshots/08-parentheses.jpg) | (1+2)×3 = 9，括号改变优先级 |
| [09 一元负号](docs/screenshots/09-unary-signs.jpg) | -5+3×-2 = -11 |
| [10 一元正号](docs/screenshots/10-unary-plus.jpg) | +5×+2 = 10 |
| [11 除零](docs/screenshots/11-division-by-zero.jpg) | 1/0 显示 Cannot divide by zero，失败不入库 |
| [12 非法表达式](docs/screenshots/12-invalid-expression.jpg) | 1+ 提示缺少数字或左括号，失败不入库 |
| [13 刷新持久化](docs/screenshots/13-refresh-persistence.jpg) | 页面刷新后数据库中的 9 条成功记录仍显示 |
| [14 收藏](docs/screenshots/14-favorites.jpg) | 收藏筛选只显示 1 条记录，数据库总数仍为 9 |
| [15 搜索](docs/screenshots/15-history-search.jpg) | 搜索 12+8，只返回对应记录 |
| [16 单条删除](docs/screenshots/16-delete-record.jpg) | 删除 ID 1 后没有搜索结果，总记录数从 9 变为 8 |
| [17 科学计算 DEG](docs/screenshots/17-science-deg.jpg) | 函数键插入 sin(30)，后端返回 0.5 |
| [18 科学计算 RAD](docs/screenshots/18-science-rad.jpg) | sin(pi/6) 在 RAD 下为 0.5 |
| [19 进制转换](docs/screenshots/19-base-conversion.jpg) | 十进制 255 转换为十六进制 FF 并保存 |
| [20 温度转换](docs/screenshots/20-unit-conversion.jpg) | 0°C 转换为 32°F 并保存 |
| [21 分页](docs/screenshots/21-history-pagination.jpg) | 12 条记录按每页 10 条显示，第二页有 2 条 |
| [22 手机布局](docs/screenshots/22-mobile-calculator.jpg) | 390px 宽度正常计算，标识不会遮住滚动内容 |
| [23 后端停机](docs/screenshots/23-backend-offline.jpg) | 100+23 无法在前端独立得出 123，显示后端不可用 |
| [24 后端重启](docs/screenshots/24-backend-restart.jpg) | 重启后原有 13 条记录重新从 SQLite 读取 |

后端重启截图拍摄后又进行了一次手机修复回归计算，因此最终测试数据库共有 14 条记录，截图编号反映的是各项检查当时的状态。

## 尚未验收

GitHub 远程发布、公网 HTTPS 访问、托管平台重部署后的磁盘持久化和正式博客发布仍待完成。本地验收不表示项目已经公开部署。发布博客时将本地图片上传到博客平台，并保留每张图片的说明。
