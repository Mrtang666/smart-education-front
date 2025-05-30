<template>
  <div class="teacher-center">
    <!-- 顶部导航栏 -->
    <AppHeader 
      :logo-url="logoUrl" 
      :app-name="'智能教育平台'" 
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
        <el-button v-for="item in menuList" :key="item" class="menu-btn" plain>{{ item }}</el-button>
      </aside>
      <!-- 右侧内容区 -->
      <section class="content-area">
        <div class="content-placeholder">内容区</div>
      </section>
    </main>

    <!-- 右下角AI对话框入口 -->
    <div class="ai-chat-entry" @click="showAIChat = true" v-if="!showAIChat">
      ai对话框，点击放大进行对话
    </div>
    <!-- AI聊天弹窗 -->
    <transition name="slide-up">
      <div v-if="showAIChat" class="ai-chat-modal">
        <div class="ai-chat-header">
          <span>AI智能对话</span>
          <div class="close-btn" @click="showAIChat = false"></div>
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
              class="chat-input-full" />
            <el-button type="primary" size="small" @click="sendChat" class="send-btn-inline">发送</el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppHeader from '@/components/common/AppHeader.vue'

const logoUrl = ref('https://placehold.co/48x48?text=Logo') // 可替换为实际logo图片
const avatarUrl = ref('https://placehold.co/40x40?text=头像') // 默认头像
const userName = ref('某教师') // 默认用户名
const showAIChat = ref(false)
const chatInput = ref('')
const searchValue = ref('') // 搜索框的值
const chatMessages = ref([
  { role: 'ai', content: '您好，有什么可以帮您？' }
])

// 聊天建议选项
const chatSuggestions = ref([
  '如何创建课程?',
  '如何查看学生作业?',
  '怎样生成考试试卷?',
  '如何分析学情报告?'
])

// 左侧菜单栏
const menuList = [
  '创建课程',
  '编辑课程信息',
  '管理课程知识点',
  '添加知识点巩固练习题',
  '查看课后习题学习作答统计',
  '自动生成考试卷题',
  '智能助手自动讲评学生考试作答',
  '查看考试作答情况总结',
  '查看学情分析'
]

// 用户操作
function handleUserAction(action) {
  if (action === 'logout') {
    console.log('退出登录')
    ElMessage.success('退出登录成功')
    // todo 这里可以添加退出登录逻辑
  }

  if (action === 'profile') {
    console.log('个人中心')
    ElMessage.success('进入个人中心')
  }

  if (action === 'changePassword') {
    console.log('修改密码')
    ElMessage.success('修改密码成功')
  }
}

function handleAvatarChange(newAvatarUrl) {
  avatarUrl.value = newAvatarUrl
  ElMessage.success('头像更新成功')
}

// 建议点击函数
function suggestClick(suggest) {
  chatInput.value = suggest
  sendChat()
}

function handleSearchInput(value) {
  searchValue.value = value
  console.log('搜索输入:', value)
}

function handleSearch(value) {
  console.log('执行搜索:', value)
  ElMessage.success(`正在搜索: ${value}`)
  // 这里可以添加实际的搜索逻辑
}

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
/* ------------------------- */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 5;
}

.menu-btn {
  width: 200px;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
  border: 1px solid #ebeef5;
  position: relative;
  overflow: hidden;
}

.menu-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: transparent;
  transition: background 0.3s;
}

.menu-btn:hover {
  background: #f5f7fa;
  color: #409eff;
  border-color: #d9ecff;
}

.menu-btn:hover::before {
  background: #409eff;
}

.content-area {
  flex: 1;
  padding: 32px;
  background: #f5f7fa;
  min-width: 0;
}

.content-placeholder {
  color: #aaa;
  font-size: 18px;
  text-align: center;
  margin-top: 100px;
}

.ai-chat-entry {
  position: fixed;
  right: 32px;
  bottom: 24px;
  width: 260px;
  height: 60px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px 10px 0 0;
  box-shadow: 0 -2px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  cursor: pointer;
  font-size: 15px;
  z-index: 100;
  transition: transform 0.3s, box-shadow 0.3s;
}

.ai-chat-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.12);
  color: #409eff;
}

/* AI聊天弹窗样式 */
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
  right: 32px;
  bottom: 84px;
  width: 380px;
  height: 700px;
  background: #fff;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 200;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
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

.close-btn {
  width: 32px;
  height: 32px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.close-btn::before,
.close-btn::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 3px;
  background: #909399;
  border-radius: 2px;
  transition: background 0.2s;
}

.close-btn::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.close-btn::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.close-btn:hover::before,
.close-btn:hover::after {
  background: #f56c6c;
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

.send-btn-inline {
  margin-left: 0;
  height: 32px;
  padding: 0 18px;
  background: #409eff;
  border-color: #409eff;
  transition: all 0.3s;
}

.send-btn-inline:hover {
  background: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
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
</style>