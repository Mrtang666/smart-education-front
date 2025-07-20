# 文件下载问题排查指南

## 问题描述
当用户尝试下载文件时，可能会遇到以下错误：
- `ERR_CONNECTION_TIMED_OUT` - 连接超时
- `Failed to fetch` - 网络请求失败
- `ERR_NETWORK` - 网络错误

## 解决方案

### 1. 自动重试机制
系统已实现自动重试机制：
- **重试次数**: 最多3次
- **重试延迟**: 递增延迟（2秒、4秒、6秒）
- **多URL尝试**: 自动尝试不同端口的服务器地址

### 2. 网络状态监控
- 实时监控网络连接状态
- 检测文件服务器可用性
- 在网络异常时显示提示信息

### 3. 错误处理优化
- 根据不同错误类型提供具体的解决建议
- 超时设置：单次请求10秒超时，总下载30秒超时
- 支持取消下载操作

## 使用方法

### 基本下载
```javascript
// 在Vue组件中使用
await this.$fileDownloadService.downloadFile('example.pdf')
```

### 带进度监控的下载
```javascript
await this.$fileDownloadService.downloadFile('example.pdf', {
  onProgress: (progress, loaded, total) => {
    console.log(`下载进度: ${progress}%`)
  },
  onRetry: (attempt, maxRetries) => {
    console.log(`正在重试 (${attempt}/${maxRetries})`)
  }
})
```

### 批量下载
```javascript
const filenames = ['file1.pdf', 'file2.docx', 'file3.txt']
await this.$fileDownloadService.downloadMultipleFiles(filenames, {
  concurrent: 2, // 并发下载数量
  onFileComplete: (filename, success) => {
    console.log(`${filename} 下载${success ? '成功' : '失败'}`)
  }
})
```

## 配置说明

### 文件服务器配置 (`src/config/fileServer.js`)
```javascript
export const FILE_SERVER_CONFIG = {
  servers: [
    'http://118.89.136.119',        // 主服务器
    'http://118.89.136.119:8080',   // 备用端口
    'http://118.89.136.119:80',     // HTTP默认端口
  ],
  pathPrefix: '/smart-edu-files',
  requestConfig: {
    timeout: 10000,    // 10秒超时
    maxRetries: 3,     // 最大重试3次
    retryDelay: 2000,  // 重试延迟2秒
  }
}
```

### 网络工具配置 (`src/utils/networkUtils.js`)
- 网络连接检测
- 服务器可用性检测
- 重试机制实现
- 网络状态监听

## 故障排查步骤

### 1. 检查网络连接
- 确认设备已连接到互联网
- 尝试访问其他网站验证网络正常

### 2. 检查服务器状态
- 系统会自动检测文件服务器状态
- 如果服务器不可用，会显示相应提示

### 3. 清除浏览器缓存
- 清除浏览器缓存和Cookie
- 刷新页面重新尝试

### 4. 检查防火墙设置
- 确认防火墙没有阻止对文件服务器的访问
- 检查企业网络是否有访问限制

### 5. 尝试不同浏览器
- 使用Chrome、Firefox、Edge等不同浏览器测试
- 确认是否为浏览器兼容性问题

## 错误代码说明

| 错误代码 | 说明 | 解决方案 |
|---------|------|----------|
| ERR_CONNECTION_TIMED_OUT | 连接超时 | 检查网络连接，系统会自动重试 |
| ERR_NETWORK | 网络错误 | 检查网络设置，确认网络正常 |
| Failed to fetch | 请求失败 | 可能是CORS问题或服务器不可用 |
| 404 | 文件不存在 | 确认文件名正确，联系管理员 |
| 403 | 权限不足 | 确认有下载权限，联系管理员 |

## 性能优化建议

### 1. 网络环境
- 使用稳定的网络连接
- 避免在网络高峰期下载大文件

### 2. 浏览器设置
- 启用浏览器的并行下载功能
- 适当增加浏览器的连接数限制

### 3. 文件管理
- 定期清理下载文件夹
- 避免同时下载过多文件

## 联系支持

如果问题仍然存在，请联系技术支持：
- 提供具体的错误信息
- 说明操作步骤和环境信息
- 附上浏览器控制台的错误日志

## 更新日志

### v1.1.0 (2024-01-20)
- 添加自动重试机制
- 实现多服务器地址支持
- 优化错误处理和用户提示

### v1.0.0 (2024-01-15)
- 基础文件下载功能
- 简单错误处理
