<template>
  <div class="teacher-center">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="logo-area">
        <!-- logo图片支持插入 -->
        <img class="logo-img" :src="logoUrl" alt="logo" />
        <span class="app-name">软件名称</span>
      </div>
      <div class="header-right">
        <el-input placeholder="请输入邀请码" v-model="inviteCode" class="invite-input" size="small" style="width: 140px; margin-right: 12px;" />
        <el-input placeholder="请输入查询词" class="search-input" size="small" />
        <el-upload
          class="avatar-uploader"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
          action="#"
        >
          <el-avatar :src="avatarUrl" class="avatar" />
        </el-upload>
        <el-dropdown>
          <span class="user-name">
            {{ userName }}
            <el-icon-arrow-down style="margin-left: 4px;" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item>修改密码</el-dropdown-item>
              <el-dropdown-item divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

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
    <div class="ai-chat-entry" @click="showAIChat = true">
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
          <div class="chat-message" v-for="(msg, idx) in chatMessages" :key="idx">
            <span class="chat-role">{{ msg.role === 'user' ? '我' : 'AI' }}：</span>
            <span>{{ msg.content }}</span>
          </div>
        </div>
        <div class="ai-chat-footer">
          <el-input
            v-model="chatInput"
            placeholder="请输入你的问题..."
            size="small"
            @keyup.enter="sendChat"
            class="chat-input"
          />
          <el-button type="primary" size="small" @click="sendChat">发送</el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const logoUrl = ref('https://placehold.co/48x48?text=Logo') // 可替换为实际logo图片
const inviteCode = ref('')
const avatarUrl = ref('https://placehold.co/40x40?text=头像') // 默认头像
const userName = ref('姓名')
const showAIChat = ref(false)
const chatInput = ref('')
const chatMessages = ref([
  { role: 'ai', content: '您好，有什么可以帮您？' }
])

const menuList = [
  '创建课程',
  '编辑课程信息',
  '管理课程知识点',
  '智能助手生成知识点教案',
  '添加知识点巩固练习题',
  '查看课后习题学习作答统计',
  '自动生成考试卷题',
  '智能助手自动讲评学生考试作答',
  '查看考试作答情况总结',
  '查看学情分析'
]

function handleAvatarSuccess(res, file) {
  // 这里只做本地预览，实际应上传到服务器
  avatarUrl.value = URL.createObjectURL(file.raw)
}
function beforeAvatarUpload(file) {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isJPG) {
    ElMessage.error('头像图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}
function sendChat() {
  if (!chatInput.value.trim()) return
  chatMessages.value.push({ role: 'user', content: chatInput.value })
  // 这里可接入AI接口，暂用模拟回复
  setTimeout(() => {
    chatMessages.value.push({ role: 'ai', content: 'AI回复：' + chatInput.value })
  }, 500)
  chatInput.value = ''
}
</script>

<style scoped>
.teacher-center {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 32px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.logo-area {
  display: flex;
  align-items: center;
}
.logo-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 16px;
}
.app-name {
  font-size: 20px;
  font-weight: 500;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.search-input {
  width: 180px;
}
.invite-input {
  width: 140px;
}
.avatar-uploader {
  display: inline-block;
  margin-right: 8px;
}
.avatar {
  background: #e6f7ff;
  cursor: pointer;
}
.user-name {
  cursor: pointer;
  margin-left: 8px;
  display: flex;
  align-items: center;
}
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #eee;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.menu-btn {
  width: 200px;
  border-radius: 6px;
  font-size: 15px;
}
.content-area {
  flex: 1;
  padding: 32px;
  background: #fafbfc;
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
  border: 1px solid #eee;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  cursor: pointer;
  font-size: 15px;
  z-index: 100;
}
/* AI聊天弹窗样式 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s cubic-bezier(.55,0,.1,1);
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
.ai-chat-modal {
  position: fixed;
  right: 32px;
  bottom: 84px;
  width: 380px;
  height: 420px;
  background: #fff;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 4px 24px rgba(0,0,0,0.13);
  display: flex;
  flex-direction: column;
  z-index: 200;
  border: 1px solid #eee;
}
.ai-chat-header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  font-size: 16px;
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
}
.close-btn::before,
.close-btn::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 3px;
  background: #888;
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
  background: #f56c6c; /* 悬浮变色 */
}
.ai-chat-body {
  flex: 1;
  padding: 16px 18px;
  overflow-y: auto;
  background: #fafbfc;
}
.chat-message {
  margin-bottom: 10px;
  font-size: 15px;
}
.chat-role {
  font-weight: bold;
  margin-right: 4px;
}
.ai-chat-footer {
  display: flex;
  align-items: center;
  padding: 10px 18px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}
.chat-input {
  flex: 1;
  margin-right: 8px;
}
</style>
