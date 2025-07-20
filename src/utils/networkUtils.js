/**
 * 网络工具类
 * 提供网络连接检测和重试机制
 */

/**
 * 检测网络连接状态
 * @returns {Promise<boolean>} 网络是否可用
 */
export async function checkNetworkConnection() {
  if (!navigator.onLine) {
    return false
  }
  
  try {
    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

    try {
      // 尝试连接到一个可靠的服务器
      await fetch('https://www.baidu.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return true
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.warn('网络连接检测失败:', error)
    return false
  }
}

/**
 * 检测特定服务器的连接状态
 * @param {string} serverUrl 服务器URL
 * @param {number} timeout 超时时间（毫秒）
 * @returns {Promise<boolean>} 服务器是否可达
 */
export async function checkServerConnection(serverUrl, timeout = 5000) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(serverUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-cache'
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn(`服务器 ${serverUrl} 连接检测失败:`, error)
    return false
  }
}

/**
 * 带重试机制的网络请求
 * @param {Function} requestFn 请求函数
 * @param {Object} options 选项
 * @param {number} options.maxRetries 最大重试次数
 * @param {number} options.baseDelay 基础延迟时间（毫秒）
 * @param {Function} options.onRetry 重试回调函数
 * @returns {Promise<any>} 请求结果
 */
export async function retryRequest(requestFn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    onRetry = () => {}
  } = options
  
  let lastError = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // 检查网络连接
        const isOnline = await checkNetworkConnection()
        if (!isOnline) {
          throw new Error('网络连接不可用')
        }
        
        // 计算延迟时间（指数退避）
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`第 ${attempt} 次重试，延迟 ${delay}ms...`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        onRetry(attempt, maxRetries)
      }
      
      return await requestFn()
    } catch (error) {
      lastError = error
      console.warn(`请求失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message)
      
      // 如果是最后一次尝试，或者是不可重试的错误，直接抛出
      if (attempt === maxRetries || !isRetryableError(error)) {
        break
      }
    }
  }
  
  throw lastError
}

/**
 * 判断错误是否可以重试
 * @param {Error} error 错误对象
 * @returns {boolean} 是否可以重试
 */
function isRetryableError(error) {
  const retryableErrors = [
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_NETWORK',
    'Failed to fetch',
    'AbortError',
    'TimeoutError',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION_REFUSED'
  ]
  
  return retryableErrors.some(errorType => 
    error.name === errorType || error.message.includes(errorType)
  )
}

/**
 * 获取网络状态信息
 * @returns {Object} 网络状态信息
 */
export function getNetworkInfo() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false
  }
}

/**
 * 监听网络状态变化
 * @param {Function} onOnline 网络连接时的回调
 * @param {Function} onOffline 网络断开时的回调
 * @returns {Function} 取消监听的函数
 */
export function watchNetworkStatus(onOnline, onOffline) {
  const handleOnline = () => {
    console.log('网络已连接')
    onOnline && onOnline()
  }
  
  const handleOffline = () => {
    console.log('网络已断开')
    onOffline && onOffline()
  }
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 返回取消监听的函数
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * 文件下载工具函数
 * @param {string} url 文件URL
 * @param {string} filename 文件名
 * @param {Object} options 选项
 * @returns {Promise<void>}
 */
export async function downloadFile(url, filename, options = {}) {
  const {
    timeout = 30000,
    onRetry = () => {}
  } = options
  
  return retryRequest(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache'
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      
      // 创建下载链接
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // 清理资源
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(link)
      }, 100)
      
    } finally {
      clearTimeout(timeoutId)
    }
  }, {
    maxRetries: 3,
    baseDelay: 2000,
    onRetry
  })
}
