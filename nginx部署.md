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

## 缓存配置优化

### 问题描述
Nginx部署新项目后访问页面仍显示旧内容，通常由缓存机制导致。Nginx默认开启反向代理缓存（proxy_cache），当项目更新后，缓存目录中的旧文件未被清除会导致页面显示旧内容。

### 解决方法

#### 1. 清除Nginx缓存
进入宝塔面板，找到已安装的Nginx，进入配置文件目录（通常为/www/server/nginx/proxy_cache_dir），删除所有缓存文件。

#### 2. 强制刷新浏览器缓存
使用Ctrl+F5或Cmd+Shift+R强制刷新页面，清除浏览器缓存。

#### 3. 检查代理服务器缓存
若使用CDN等代理服务，需登录对应平台清除缓存。

#### 4. 修改Nginx配置
在nginx.conf中添加或修改以下配置：

**完全关闭缓存：**
```nginx
proxy_cache off;
```

**设置5分钟缓存有效期：**
```nginx
proxy_cache_valid 200 5m;
proxy_cache_valid 404 1m;
```

**完整的缓存配置示例：**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 设置缓存路径和配置
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;
    
    location / {
        root /projects/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        proxy_cache my_cache;
        proxy_cache_valid 200 5m;  # 成功响应缓存5分钟
        proxy_cache_valid 404 1m;  # 404错误缓存1分钟
        proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
        
        # 添加缓存状态头部
        add_header X-Cache-Status $upstream_cache_status;
    }
    
    # 静态资源缓存配置
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        root /projects/frontend/dist;
        expires 5m;  # 静态资源缓存5分钟
        add_header Cache-Control "public, immutable";
    }
}
```

配置完成后重启Nginx：
```bash
sudo systemctl restart nginx
```