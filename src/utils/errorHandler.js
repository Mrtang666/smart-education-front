/**
 * 错误处理工具
 * 主要用于处理开发环境中的常见警告和错误
 */

/**
 * 初始化错误处理器
 * 主要处理ResizeObserver相关的错误和警告
 */
export function initErrorHandler() {
  // 只在开发环境中启用
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // 处理ResizeObserver错误
  const handleResizeObserverError = (e) => {
    const errorMessage = e.message || (e.error && e.error.message) || ''
    if (errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
        errorMessage.includes('ResizeObserver loop limit exceeded') ||
        errorMessage.includes('ResizeObserver')) {
      // 这是一个已知的无害错误，通常由Element Plus组件引起
      if (e.stopImmediatePropagation) e.stopImmediatePropagation()
      if (e.preventDefault) e.preventDefault()
      return true
    }
    return false
  }

  // 重写ResizeObserver构造函数以捕获错误
  if (window.ResizeObserver) {
    const OriginalResizeObserver = window.ResizeObserver
    window.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback) {
        const wrappedCallback = (entries, observer) => {
          try {
            callback(entries, observer)
          } catch (error) {
            if (error.message && error.message.includes('ResizeObserver')) {
              // 忽略ResizeObserver相关错误
              return
            }
            throw error
          }
        }
        super(wrappedCallback)
      }
    }
  }

  // 监听全局错误事件
  window.addEventListener('error', (e) => {
    if (handleResizeObserverError(e)) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
    // 其他错误正常处理
  }, true)

  // 监听未处理的Promise错误
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.message && e.reason.message.includes('ResizeObserver')) {
      e.preventDefault()
      return
    }
    // 其他Promise错误正常处理
  })

  // 重写console.error以过滤特定错误
  const originalConsoleError = console.error
  console.error = (...args) => {
    // 过滤ResizeObserver相关的错误
    if (args[0] && typeof args[0] === 'string') {
      if (args[0].includes('ResizeObserver loop completed') ||
          args[0].includes('ResizeObserver loop limit exceeded')) {
        return // 忽略这些错误
      }
    }
    
    // 过滤Element Plus相关的开发警告
    if (args[0] && typeof args[0] === 'string') {
      if (args[0].includes('[Element Plus]') && args[0].includes('deprecated')) {
        return // 忽略Element Plus的废弃警告
      }
    }
    
    // 其他错误正常输出
    originalConsoleError.apply(console, args)
  }

  // 重写console.warn以过滤特定警告
  const originalConsoleWarn = console.warn
  console.warn = (...args) => {
    // 过滤ResizeObserver相关的警告
    if (args[0] && typeof args[0] === 'string') {
      if (args[0].includes('ResizeObserver') ||
          args[0].includes('loop completed with undelivered notifications')) {
        return // 忽略这些警告
      }
    }

    // 过滤Element Plus相关的开发警告
    if (args[0] && typeof args[0] === 'string') {
      if (args[0].includes('[Vue warn]') &&
          (args[0].includes('Invalid prop') ||
           args[0].includes('validation failed') ||
           args[0].includes('deprecated'))) {
        return // 忽略Element Plus的prop验证警告
      }
    }

    // 过滤Element Plus radio/checkbox label prop 警告
    if (args[0] && typeof args[0] === 'string') {
      if (args[0].includes('ElementPlusError') &&
          args[0].includes('about to be deprecated')) {
        return // 忽略Element Plus的废弃警告
      }
    }

    // 其他警告正常输出
    originalConsoleWarn.apply(console, args)
  }

  // 处理webpack-dev-server的overlay错误
  const originalHandleError = window.__webpack_dev_server_client_overlay_handleError
  if (originalHandleError) {
    window.__webpack_dev_server_client_overlay_handleError = function(error) {
      if (error && error.message && error.message.includes('ResizeObserver')) {
        return // 忽略ResizeObserver错误
      }
      return originalHandleError.call(this, error)
    }
  }

  // 拦截webpack-dev-server的错误显示
  const originalCreateOverlay = window.__webpack_dev_server_client_overlay_createOverlay
  if (originalCreateOverlay) {
    window.__webpack_dev_server_client_overlay_createOverlay = function(options) {
      if (options && options.errors) {
        options.errors = options.errors.filter(error => {
          const errorStr = error.toString()
          return !errorStr.includes('ResizeObserver loop completed with undelivered notifications')
        })
        if (options.errors.length === 0) {
          return // 如果所有错误都被过滤掉了，就不显示overlay
        }
      }
      return originalCreateOverlay.call(this, options)
    }
  }

  console.log('🛡️ 错误处理器已初始化 - 开发环境')
}

/**
 * 安全执行函数，捕获并处理可能的ResizeObserver错误
 * @param {Function} fn 要执行的函数
 * @param {*} defaultValue 出错时的默认返回值
 */
export function safeExecute(fn, defaultValue = null) {
  try {
    return fn()
  } catch (error) {
    if (error.message && error.message.includes('ResizeObserver')) {
      // 忽略ResizeObserver错误
      return defaultValue
    }
    // 其他错误重新抛出
    throw error
  }
}

/**
 * 延迟执行函数，避免ResizeObserver循环
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间（毫秒）
 */
export function deferredExecute(fn, delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        resolve(fn())
      } catch (error) {
        if (error.message && error.message.includes('ResizeObserver')) {
          resolve(null)
        } else {
          throw error
        }
      }
    }, delay)
  })
}

/**
 * 防抖函数，减少频繁的DOM操作
 * @param {Function} fn 要防抖的函数
 * @param {number} delay 防抖延迟时间
 */
export function debounce(fn, delay = 100) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 节流函数，限制函数执行频率
 * @param {Function} fn 要节流的函数
 * @param {number} delay 节流间隔时间
 */
export function throttle(fn, delay = 100) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      return fn.apply(this, args)
    }
  }
}
