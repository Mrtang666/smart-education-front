<template>
  <div class="teacher-center">
    <!-- 顶部导航栏 -->
    <AppHeader 
      :logo-url="logoUrl" 
      :app-name="'慧课'" 
      :avatar-url="avatarUrl" 
      :user-name="userName"
      :default-search-value="searchValue"
      @user-action="handleUserAction" 
      @avatar-change="handleAvatarChange"
      @search="handleSearch"
      @search-input="handleSearchInput"
    />

    <main class="main-content">
      <!-- 左侧菜单栏 -->
      <aside class="sidebar">
        <div class="menu-container">
          <div 
            v-for="item in menuList" 
            :key="item.name" 
            class="menu-btn" 
            :class="{ 'menu-btn-active': activeMenu === item.name }"
            @click="handleMenuClick(item)"
          >
            <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </aside>
      <!-- 右侧内容区 -->
      <section class="content-area">
        <router-view></router-view>
      </section>
    </main>

    <!-- 右下角AI对话框入口 - 已注释 -->
    <!--
    <div class="ai-chat-entry" @click="showAIChat = true" v-if="!showAIChat">
      <el-icon :size="24"><ChatDotRound /></el-icon>
    </div>
    -->
    <!-- AI聊天弹窗 - 已注释 -->
    <!--
    <transition name="slide-up">
      <div v-if="showAIChat" class="ai-chat-modal" :style="{ width: chatWidth + 'px' }">
        <div class="resize-handle" @mousedown="startResize"></div>

        <div class="ai-chat-header">
          <span>AI智能对话</span>
          <el-icon class="close-icon" @click="showAIChat = false"><Close /></el-icon>
        </div>
        <div class="ai-chat-body">
          <div class="chat-message" v-for="(msg, idx) in chatMessages" :key="idx"
            :class="{ 'chat-message-user': msg.role === 'user', 'chat-message-ai': msg.role === 'ai' }">
            <div class="chat-message-content">
              <span v-if="msg.role === 'ai'" class="chat-role">AI：</span>
              <span>{{ msg.content }}</span>
            </div>
          </div>
        </div>
        <div class="ai-chat-footer">
          <div class="chat-suggestions-horizontal">
            <el-button v-for="(suggest, idx) in chatSuggestions" :key="idx" size="small" class="suggest-btn-horizontal"
              @click="suggestClick(suggest)" type="primary" plain>
              {{ suggest }}
            </el-button>
          </div>
          <div class="chat-input-row">
            <el-input v-model="chatInput" placeholder="请输入你的问题..." size="small" @keyup.enter="sendChat"
              class="chat-input-full">
              <template #append>
                <el-button type="primary" @click="sendChat">
                  <el-icon><Position /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </transition>
    -->
  </div>
</template>

<script setup>
import { getValidToken } from '@/utils/auth'
import { ref, provide } from 'vue' // onUnmounted 已注释（AI助手相关）
import { ElMessage } from 'element-plus'
import AppHeader from '@/components/common/AppHeader.vue'
import { useRouter } from 'vue-router'
import {
  // ChatDotRound,  // AI助手相关 - 已注释
  // Close,         // AI助手相关 - 已注释
  // Position,      // AI助手相关 - 已注释
  Reading,
  Document,
  DataAnalysis,
  Setting,
  HomeFilled
} from '@element-plus/icons-vue'

const router = useRouter()
const logoUrl = ref('@/assets/projectlogo.png') // 项目logo
const avatarUrl = ref('https://placehold.co/40x40?text=头像') // 默认头像
const userName = getUserName() // 默认用户名
// AI助手相关变量 - 已注释
// const showAIChat = ref(false)
// const chatInput = ref('')
const searchValue = ref('') // 搜索框的值
// const chatMessages = ref([
//   { role: 'ai', content: '您好，有什么可以帮您？' }
// ])

// 对话框宽度相关 - 已注释
// const chatWidth = ref(400) // 初始宽度
// const minWidth = 300 // 最小宽度
// const maxWidth = 800 // 最大宽度
// const isResizing = ref(false)
// const startX = ref(0)
// const startWidth = ref(0)

// AI助手调整大小函数 - 已注释
/*
function startResize(e) {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = chatWidth.value
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  // 防止文本选择
  document.body.style.userSelect = 'none'
}
*/

function getUserName() {
  // 从localStorage获取用户信息
  const userInfoStr = localStorage.getItem('user_info')
  let userInfo = null
  if (userInfoStr) {
    try {
      userInfo = JSON.parse(userInfoStr)
    } catch (error) {
      console.error('解析用户信息出错:', error)
      return '老师'
    }
  }
  
  // 确保userInfo不为null，并且有fullName属性
  if (userInfo && userInfo.fullName) {
    return userInfo.fullName
  } else if (userInfo && userInfo.username) {
    return userInfo.username
  } else {
    return '老师'
  }
}

// AI助手调整大小相关函数 - 已注释
/*
function handleResize(e) {
  if (!isResizing.value) return
  const offsetX = startX.value - e.clientX
  let newWidth = startWidth.value + offsetX

  // 限制最小和最大宽度
  if (newWidth < minWidth) newWidth = minWidth
  if (newWidth > maxWidth) newWidth = maxWidth

  chatWidth.value = newWidth
}

// 停止调整大小
function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.userSelect = ''
}
*/

// AI助手组件卸载清理 - 已注释
/*
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
*/

// AI助手聊天建议选项 - 已注释
/*
const chatSuggestions = ref([
  '如何创建课程?',
  '如何查看学生作业?',
  '怎样生成考试试卷?',
  '如何分析学情报告?'
])
*/

// 左侧菜单栏
const menuList = [
  { name: '首页', icon: HomeFilled },
  { name: '课程', icon: Reading },
  { name: '知识', icon: Document },
  { name: '作业', icon: Document },
  { name: '考试', icon: Document },
  { name: '分析', icon: DataAnalysis },
  { name: '设置', icon: Setting },
]

const activeMenu = ref('') // 默认选中第一个菜单

// 设置活动菜单的方法，供子组件调用
const setActiveMenu = (menuName) => {
  // 查找匹配的菜单项
  const foundMenu = menuList.find(item => item.name === menuName)
  if (foundMenu) {
    activeMenu.value = menuName
    console.log('从子组件设置活动菜单:', menuName)
  }
}

// 将设置活动菜单的方法提供给子组件
provide('setActiveMenu', setActiveMenu)

// 菜单点击处理
function handleMenuClick(menu) {
  activeMenu.value = menu.name
  console.log('选中菜单:', menu.name)
  
  // 根据菜单项跳转到不同的路由
  switch (menu.name) {
    case '首页':
      router.push('/teacher/center')
      break
    case '课程':
      router.push('/teacher/course')
      break
    case '知识':
      router.push('/teacher/knowledge')
      break
    case '作业':
      router.push('/teacher/exercise')
      break
    case '考试':
      router.push('/teacher/exam')
      break
    case '分析':
      router.push('/teacher/analysis')
      break
    case '设置':
      router.push('/teacher/setting')
      break
    default:
      break
  }
  
  ElMessage.success(`切换到${menu.name}页面`)
}

// 用户操作
function handleUserAction(action) {
  if (action === 'profile') {
    getValidToken();
    console.log('个人中心')
    ElMessage.success('进入个人中心')
  }

  if (action === 'changePassword') {
    console.log('修改密码')
    ElMessage.success('修改密码成功')
  }
  
  if (action === 'clearMenuActive') {
    // 清空左侧导航栏选中状态
    activeMenu.value = ''
    console.log('清空导航栏选中状态')
  }
}

function handleAvatarChange(newAvatarUrl) {
  avatarUrl.value = newAvatarUrl
  ElMessage.success('头像更新成功')
}

// AI助手建议点击函数 - 已注释
/*
function suggestClick(suggest) {
  chatInput.value = suggest
  sendChat()
}
*/

function handleSearchInput(value) {
  searchValue.value = value
  console.log('搜索输入:', value)
}

function handleSearch(value) {
  console.log('执行搜索:', value)
  ElMessage.success(`正在搜索: ${value}`)
  // 这里可以添加实际的搜索逻辑
}

// AI助手发送聊天函数 - 已注释
/*
function sendChat() {
  if (!chatInput.value.trim()) return
  const userMessage = chatInput.value
  chatMessages.value.push({ role: 'user', content: userMessage })
  // todo 这里接入AI接口，暂用模拟回复
  setTimeout(() => {
    chatMessages.value.push({ role: 'ai', content: '我已收到您的消息：' + userMessage })
  }, 500)
  chatInput.value = ''
}
*/
</script>

<style scoped>
.teacher-center {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* 覆盖Element Plus按钮样式 */
:deep(.el-button) {
  border-color: transparent !important;
}

:deep(.sidebar .menu-container .menu-btn) {
  padding: 12px 20px !important;
}

:deep(.el-button:hover),
:deep(.el-button:focus) {
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

:deep(.el-button--plain:hover) {
  border-color: transparent !important;
  background-color: #f5f7fa;
}

:deep(.el-button--plain:focus) {
  border-color: transparent !important;
  background-color: transparent;
}

/* 顶部导航栏固定 */
:deep(.header) {
  position: sticky;
  top: 0;
  z-index: 100;
}

.main-content {
  flex: 1;
  display: flex;
  margin: 0;
  padding: 0;
  height: calc(100vh - 60px); /* 减去顶部导航栏高度 */
  overflow: hidden; /* 防止整体滚动 */
}

/* 侧边栏固定 */
.sidebar {
  width: 100px;
  background: #2e3a4f;
  color: #fff;
  padding: 0 0 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 5;
  height: 100%;
  overflow-y: auto;
}

.sidebar-divider {
  width: 80%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 10px;
}

.menu-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding-top: 10px;
}

.menu-btn {
  box-sizing: border-box;
  width: 100px;
  font-size: 14px;
  transition: all 0.3s;
  border: none;
  position: relative;
  overflow: hidden;
  text-align: center;
  justify-content: center;
  display: flex;
  align-items: center;
  padding: 12px 0;
  margin: 0;
  cursor: pointer;
  background-color: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  padding-left: 24px;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-btn-active {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #fff !important;
  position: relative;
}

.menu-btn-active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  height: 60%;
  width: 4px;
  background: #4b8de6;
  transform: translateY(-50%);
  border-radius: 0 2px 2px 0;
}

.menu-icon {
  margin-right: 12px;
  font-size: 16px;
}

.content-area {
  flex: 1;
  padding: 32px;
  background: #f5f7fa;
  min-width: 0;
  overflow-y: auto;
  height: 100%;
}

.content-placeholder {
  color: #aaa;
  font-size: 18px;
  text-align: center;
  margin-top: 100px;
}

/* AI助手样式 - 已注释
.ai-chat-entry {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 60px;
  height: 60px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  cursor: pointer;
  font-size: 15px;
  z-index: 100;
  transition: transform 0.3s, box-shadow 0.3s;
}

.ai-chat-entry:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.25);
}
*/

/* AI聊天弹窗样式 - 已注释
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(.25, .8, .25, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.ai-chat-modal {
  position: fixed;
  right: 0;
  top: 60px;
  bottom: 0;
  width: 400px;
  height: auto;
  background: #fff;
  border-radius: 12px 0 0 0;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 200;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
  background-color: transparent;
  z-index: 300;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: rgba(64, 158, 255, 0.1);
}

.ai-chat-header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-weight: 500;
  font-size: 16px;
  background: linear-gradient(135deg, #f9fcff, #f6f9fc);
  color: #303133;
}

.close-icon {
  cursor: pointer;
  font-size: 20px;
  color: #909399;
  transition: color 0.2s;
}

.close-icon:hover {
  color: #f56c6c;
}

.ai-chat-body {
  flex: 1;
  padding: 16px 18px;
  overflow-y: auto;
  background: #f9fbfd;
  scroll-behavior: smooth;
}

.chat-suggestions-horizontal {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 10px;
  gap: 6px;
}

.suggest-btn-horizontal {
  border-radius: 10px;
  background: rgba(64, 158, 255, 0.08);
  color: #4b8de6;
  border: none;
  font-size: 12px;
  padding: 0 10px;
  height: 22px;
  line-height: 20px;
  transition: background 0.2s;
  text-align: center;
  margin: 0;
}

.suggest-btn-horizontal:hover {
  background: rgba(64, 158, 255, 0.15);
  color: #409eff;
  transform: translateY(-1px);
}

.chat-message {
  margin-bottom: 16px;
  font-size: 15px;
  display: flex;
  width: 100%;
  position: relative;
}

.chat-message-content {
  display: inline-block;
  max-width: 85%;
  text-align: left;
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.03);
  position: relative;
  word-break: break-word;
}

.chat-message-user {
  justify-content: flex-end;
}

.chat-message-ai {
  justify-content: flex-start;
}

.chat-message-user .chat-message-content {
  background: #ecf5ff;
  border-color: #d9ecff;
  color: #303133;
  border-bottom-right-radius: 3px;
}

.chat-message-ai .chat-message-content {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.05);
  border-bottom-left-radius: 3px;
}

.chat-message-user .chat-message-content::after {
  content: '';
  position: absolute;
  right: -6px;
  bottom: 0;
  width: 12px;
  height: 12px;
  background: #ecf5ff;
  border-right: 1px solid #d9ecff;
  border-bottom: 1px solid #d9ecff;
  transform: rotate(-45deg) translate(4px, 0);
  border-radius: 0 0 4px 0;
}

.chat-message-ai .chat-message-content::after {
  content: '';
  position: absolute;
  left: -6px;
  bottom: 0;
  width: 12px;
  height: 12px;
  background: #fff;
  border-left: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transform: rotate(45deg) translate(-4px, 0);
  border-radius: 0 0 0 4px;
}

.chat-role {
  font-weight: bold;
  margin-right: 4px;
  color: #409eff;
}

.chat-input-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.chat-input-full {
  width: 100%;
  margin-bottom: 0;
  margin-top: 0;
}

.ai-chat-footer {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 10px 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
}
*/

/* 确保所有文字都是横向显示的 */
:deep(.el-dropdown-menu__item),
:deep(.el-button),
:deep(.user-name),
:deep(.el-avatar),
:deep(.el-dropdown) {
  writing-mode: horizontal-tb !important;
}
</style>