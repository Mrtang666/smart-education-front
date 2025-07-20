<template>
  <div class="network-status">
    <!-- 网络状态提示 -->
    <el-alert
      v-if="!isOnline"
      title="网络连接已断开"
      description="请检查您的网络连接，部分功能可能无法正常使用"
      type="warning"
      :closable="false"
      show-icon
      class="network-alert"
    />
    
    <!-- 文件服务器状态提示 -->
    <el-alert
      v-if="isOnline && !fileServerOnline"
      title="文件服务器连接异常"
      description="文件下载功能可能受到影响，正在尝试重新连接..."
      type="info"
      :closable="false"
      show-icon
      class="server-alert"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { watchNetworkStatus, checkServerConnection } from '@/utils/networkUtils'
import { FILE_SERVER_CONFIG } from '@/config/fileServer'

export default {
  name: 'NetworkStatus',
  setup() {
    const isOnline = ref(navigator.onLine)
    const fileServerOnline = ref(true)
    let unwatchNetwork = null
    let serverCheckInterval = null

    // 检查文件服务器状态
    const checkFileServer = async () => {
      if (!isOnline.value) {
        fileServerOnline.value = false
        return
      }

      try {
        // 检查主服务器
        const mainServer = FILE_SERVER_CONFIG.servers[0]
        const isServerOnline = await checkServerConnection(mainServer, 3000)
        fileServerOnline.value = isServerOnline
      } catch (error) {
        console.warn('文件服务器状态检查失败:', error)
        fileServerOnline.value = false
      }
    }

    // 网络状态变化处理
    const handleOnline = () => {
      isOnline.value = true
      console.log('网络已连接')
      // 网络恢复后立即检查文件服务器
      setTimeout(checkFileServer, 1000)
    }

    const handleOffline = () => {
      isOnline.value = false
      fileServerOnline.value = false
      console.log('网络已断开')
    }

    onMounted(() => {
      // 监听网络状态变化
      unwatchNetwork = watchNetworkStatus(handleOnline, handleOffline)
      
      // 初始检查文件服务器状态
      checkFileServer()
      
      // 定期检查文件服务器状态（每30秒）
      serverCheckInterval = setInterval(checkFileServer, 30000)
    })

    onUnmounted(() => {
      // 清理监听器和定时器
      if (unwatchNetwork) {
        unwatchNetwork()
      }
      if (serverCheckInterval) {
        clearInterval(serverCheckInterval)
      }
    })

    return {
      isOnline,
      fileServerOnline
    }
  }
}
</script>

<style scoped>
.network-status {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 2000;
  pointer-events: none;
}

.network-alert,
.server-alert {
  margin: 0;
  border-radius: 0;
  pointer-events: auto;
}

.network-alert {
  background-color: #fdf6ec;
  border-color: #f5dab1;
}

.server-alert {
  background-color: #f4f4f5;
  border-color: #d3d4d6;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .network-status {
    top: 50px;
  }
  
  .network-alert :deep(.el-alert__description),
  .server-alert :deep(.el-alert__description) {
    font-size: 12px;
    line-height: 1.4;
  }
}
</style>
