# 在同一服务器部署多个前端项目

本文档介绍如何在已有nginx容器的基础上，部署第二个前端项目。

## 方案概述

我们将使用以下方案：
- **方案一**：单个nginx容器 + 多个虚拟主机（推荐）
- **方案二**：多个nginx容器 + 不同端口

---

## 方案一：单个nginx容器 + 多个虚拟主机（推荐）

### 1. 目录结构规划

```bash
/projects/
├── frontend/          # 第一个项目（已存在）
│   └── dist/
├── frontend2/         # 第二个项目
│   └── dist/
└── nginx/
    └── conf.d/
        ├── project1.conf
        └── project2.conf
```

### 2. 创建第二个项目目录

```bash
# 在服务器上执行
sudo mkdir -p /projects/frontend2/dist
sudo mkdir -p /projects/nginx/conf.d
sudo chown -R www-data:www-data /projects/frontend2
sudo chmod -R 755 /projects/frontend2
```

### 3. 配置nginx虚拟主机

**创建第一个项目配置文件：`/projects/nginx/conf.d/project1.conf`**
```nginx
server {
    listen 80;
    server_name project1.yourdomain.com;  # 或使用 IP:8080
    root /usr/share/nginx/html/project1;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理（如果需要）
    location /api/ {
        proxy_pass http://your-backend-server:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**创建第二个项目配置文件：`/projects/nginx/conf.d/project2.conf`**
```nginx
server {
    listen 80;
    server_name project2.yourdomain.com;  # 或使用 IP:8081
    root /usr/share/nginx/html/project2;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理（如果需要）
    location /api/ {
        proxy_pass http://your-backend-server2:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 4. 重新创建nginx容器

```bash
# 停止并删除现有容器
docker stop nginx-frontend
docker rm nginx-frontend

# 创建新的nginx容器，挂载多个项目和配置
docker run -d \
  --name nginx-multi-frontend \
  -p 8080:80 \
  -p 8081:80 \
  -v /projects/frontend/dist:/usr/share/nginx/html/project1 \
  -v /projects/frontend2/dist:/usr/share/nginx/html/project2 \
  -v /projects/nginx/conf.d:/etc/nginx/conf.d \
  nginx:latest
```

### 5. 部署第二个项目

**本地构建第二个项目：**
```bash
# 在第二个项目根目录执行
npm run build
```

**上传到服务器：**
```powershell
# Windows PowerShell
scp -r "D:\path\to\your\second-project\dist\*" root@118.89.136.119:/projects/frontend2/dist/
```

```bash
# Git Bash
scp -r /d/path/to/your/second-project/dist/* root@118.89.136.119:/projects/frontend2/dist/
```

### 6. 访问项目

- 第一个项目：`http://118.89.136.119:8080`
- 第二个项目：`http://118.89.136.119:8081`

---

## 方案二：多个nginx容器 + 不同端口

### 1. 创建第二个项目目录

```bash
sudo mkdir -p /projects/frontend2/dist
sudo chown -R www-data:www-data /projects/frontend2
sudo chmod -R 755 /projects/frontend2
```

### 2. 创建第二个nginx容器

```bash
docker run -d \
  --name nginx-frontend2 \
  -p 8081:80 \
  -v /projects/frontend2/dist:/usr/share/nginx/html \
  nginx:latest
```

### 3. 部署第二个项目

```powershell
# Windows PowerShell
scp -r "D:\path\to\your\second-project\dist\*" root@118.89.136.119:/projects/frontend2/dist/
```

### 4. 访问项目

- 第一个项目：`http://118.89.136.119:8080`
- 第二个项目：`http://118.89.136.119:8081`

---

## 更新项目流程

### 更新第一个项目
```powershell
# 本地构建
npm run build

# 上传（方案一）
scp -r "D:\git depository\smart-education-front\dist\*" root@118.89.136.119:/projects/frontend/dist/

# 上传（方案二，与原流程相同）
scp -r "D:\git depository\smart-education-front\dist\*" root@118.89.136.119:/projects/frontend/dist/
```

### 更新第二个项目
```powershell
# 本地构建
npm run build

# 上传
scp -r "D:\path\to\your\second-project\dist\*" root@118.89.136.119:/projects/frontend2/dist/
```

---

## 推荐配置

**推荐使用方案一**，原因：
1. 资源占用更少（单个nginx容器）
2. 配置更灵活（可以配置域名、SSL等）
3. 管理更简单（统一的nginx配置）
4. 可以轻松添加更多项目

**如果需要域名访问**，可以配置DNS解析：
- `project1.yourdomain.com` → `118.89.136.119:8080`
- `project2.yourdomain.com` → `118.89.136.119:8081`

**如果需要HTTPS**，可以添加SSL证书配置到nginx配置文件中。