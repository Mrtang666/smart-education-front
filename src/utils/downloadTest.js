/**
 * 文件下载测试工具
 * 用于调试和测试文件下载功能
 */

import { FILE_SERVER_CONFIG } from '@/config/fileServer'

/**
 * 测试服务器连接
 * @param {string} serverUrl 服务器URL
 * @returns {Promise<Object>} 测试结果
 */
export async function testServerConnection(serverUrl) {
  const startTime = Date.now()
  
  try {
    console.log(`测试服务器连接: ${serverUrl}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
    
    const response = await fetch(serverUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-cache'
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    const result = {
      server: serverUrl,
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      headers: Object.fromEntries(response.headers.entries())
    }
    
    console.log(`服务器连接测试结果:`, result)
    return result
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    const result = {
      server: serverUrl,
      success: false,
      error: error.message,
      errorName: error.name,
      responseTime
    }
    
    console.error(`服务器连接测试失败:`, result)
    return result
  }
}

/**
 * 测试文件下载URL
 * @param {string} filename 文件名
 * @returns {Promise<Array>} 所有URL的测试结果
 */
export async function testFileUrls(filename) {
  const servers = FILE_SERVER_CONFIG.servers
  const pathPrefix = FILE_SERVER_CONFIG.pathPrefix
  const encodedFilename = encodeURIComponent(filename)
  
  console.log(`测试文件下载URL: ${filename}`)
  
  const results = []
  
  for (const server of servers) {
    const fileUrl = `${server}${pathPrefix}/${encodedFilename}`
    const result = await testFileUrl(fileUrl)
    results.push(result)
  }
  
  return results
}

/**
 * 测试单个文件URL
 * @param {string} fileUrl 文件URL
 * @returns {Promise<Object>} 测试结果
 */
export async function testFileUrl(fileUrl) {
  const startTime = Date.now()
  
  try {
    console.log(`测试文件URL: ${fileUrl}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15秒超时
    
    const response = await fetch(fileUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-cache'
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    const result = {
      url: fileUrl,
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      contentLength: response.headers.get('content-length'),
      contentType: response.headers.get('content-type'),
      lastModified: response.headers.get('last-modified')
    }
    
    console.log(`文件URL测试结果:`, result)
    return result
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    const result = {
      url: fileUrl,
      success: false,
      error: error.message,
      errorName: error.name,
      responseTime
    }
    
    console.error(`文件URL测试失败:`, result)
    return result
  }
}

/**
 * 测试网络连接
 * @returns {Promise<Object>} 网络测试结果
 */
export async function testNetworkConnection() {
  const testUrls = [
    'https://www.baidu.com/favicon.ico',
    'https://www.google.com/favicon.ico',
    'https://httpbin.org/status/200'
  ]
  
  console.log('测试网络连接...')
  
  const results = []
  
  for (const url of testUrls) {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      results.push({
        url,
        success: true,
        responseTime
      })
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      results.push({
        url,
        success: false,
        error: error.message,
        responseTime
      })
    }
  }
  
  const successCount = results.filter(r => r.success).length
  const networkStatus = {
    online: navigator.onLine,
    testResults: results,
    successRate: successCount / results.length,
    averageResponseTime: results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / successCount || 0
  }
  
  console.log('网络连接测试结果:', networkStatus)
  return networkStatus
}

/**
 * 完整的下载诊断
 * @param {string} filename 要测试的文件名
 * @returns {Promise<Object>} 诊断结果
 */
export async function diagnoseDownload(filename) {
  console.log(`开始下载诊断: ${filename}`)
  
  const diagnosis = {
    filename,
    timestamp: new Date().toISOString(),
    network: null,
    servers: [],
    fileUrls: [],
    recommendations: []
  }
  
  try {
    // 1. 测试网络连接
    diagnosis.network = await testNetworkConnection()
    
    // 2. 测试服务器连接
    for (const server of FILE_SERVER_CONFIG.servers) {
      const serverResult = await testServerConnection(server)
      diagnosis.servers.push(serverResult)
    }
    
    // 3. 测试文件URL
    diagnosis.fileUrls = await testFileUrls(filename)
    
    // 4. 生成建议
    diagnosis.recommendations = generateRecommendations(diagnosis)
    
  } catch (error) {
    console.error('下载诊断过程中出错:', error)
    diagnosis.error = error.message
  }
  
  console.log('下载诊断完成:', diagnosis)
  return diagnosis
}

/**
 * 根据诊断结果生成建议
 * @param {Object} diagnosis 诊断结果
 * @returns {Array} 建议列表
 */
function generateRecommendations(diagnosis) {
  const recommendations = []
  
  // 网络连接建议
  if (diagnosis.network && diagnosis.network.successRate < 0.5) {
    recommendations.push('网络连接不稳定，建议检查网络设置')
  }
  
  // 服务器连接建议
  const workingServers = diagnosis.servers.filter(s => s.success)
  if (workingServers.length === 0) {
    recommendations.push('所有服务器都无法连接，请联系管理员')
  } else if (workingServers.length < diagnosis.servers.length) {
    recommendations.push('部分服务器无法连接，但仍可尝试下载')
  }
  
  // 文件URL建议
  const workingUrls = diagnosis.fileUrls.filter(u => u.success)
  if (workingUrls.length === 0) {
    recommendations.push('文件不存在或无法访问，请检查文件名')
  }
  
  // 性能建议
  const avgResponseTime = diagnosis.network?.averageResponseTime || 0
  if (avgResponseTime > 3000) {
    recommendations.push('网络响应较慢，下载可能需要更长时间')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('所有检查都通过，下载应该可以正常进行')
  }
  
  return recommendations
}

export default {
  testServerConnection,
  testFileUrls,
  testFileUrl,
  testNetworkConnection,
  diagnoseDownload
}
