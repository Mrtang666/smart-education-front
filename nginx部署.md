更新 `dist` 代码的流程很简单，由于已通过 Docker 挂载将宿主机目录与容器目录关联，只需替换宿主机的 `dist` 文件即可，无需重建容器，具体步骤如下：


### 步骤1：本地重新构建前端代码
在本地前端项目根目录执行构建命令（根据你的项目框架选择）：
```bash
# Vue 项目
npm run build

# React 项目
npm run build

# 其他框架（如 Angular）
# ng build --prod
```
构建完成后，本地 `D:\git depository\smart-education-front\dist` 会生成最新的前端文件。


### 步骤2：上传新的 `dist` 到服务器（覆盖旧文件）
通过本地终端（PowerShell/Git Bash）将新 `dist` 上传到服务器的挂载目录，覆盖原有文件：
```powershell
# Windows PowerShell 命令
scp -r "D:\git depository\smart-education-front\dist\*" root@118.89.136.119:/projects/frontend/dist/
```
```bash
# Git Bash 或 Linux/macOS 终端命令
scp -r /d/git depository/smart-education-front/dist/* root@118.89.136.119:/projects/frontend/dist/
```
> 注意路径后的 `*` 表示只上传 `dist` 内的文件，而非整个文件夹，避免额外嵌套目录。


### 步骤3：验证更新是否生效
1. **检查服务器文件**：登录服务器，确认文件已更新：
   ```bash
   ls -l /projects/frontend/dist  # 查看文件修改时间是否为最新
   ```

2. **浏览器验证**：访问 `http://118.89.136.119`，按 `Ctrl+Shift+R`（强制刷新）清除缓存，确认页面显示最新内容。


### 特殊情况处理
- 若更新后未生效，可能是文件权限被重置，重新修复权限：
  ```bash
  sudo chown -R www-data:www-data /projects/frontend/dist
  sudo chmod -R 755 /projects/frontend/dist
  ```

- 极少数情况需重启容器（如依赖配置变更）：
  ```bash
  docker restart nginx-frontend
  ```


按以上步骤操作，即可无缝更新前端代码，无需重新配置容器。