<template>
  <div class="admin-center">
    <!-- 顶部标题区域 -->
    <div class="header-section">
      <div class="header-content">
        <div class="logo-section">
          <h1>慧课平台后台管理中心</h1>
        </div>
      </div>
    </div>

    <el-container class="main-container">
      <!-- 侧边栏 -->
      <el-aside width="260px" class="sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">管理菜单</span>
        </div>
        <el-menu
          router
          :default-active="$route.path"
          class="admin-menu"
          background-color="transparent"
          text-color="#2c3e50"
          active-text-color="#409eff"
        >
          <el-menu-item index="/admin/teacher" class="menu-item">
            <div class="menu-icon">
              <el-icon><User /></el-icon>
            </div>
            <span>教师管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/student" class="menu-item">
            <div class="menu-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <span>学生管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/stats" class="menu-item">
            <div class="menu-icon">
              <el-icon><DataLine /></el-icon>
            </div>
            <span>统计分析</span>
          </el-menu-item>
          <el-menu-item index="/admin/knowledge" class="menu-item">
            <div class="menu-icon">
              <el-icon><Collection /></el-icon>
            </div>
            <span>知识库管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/subject" class="menu-item">
            <div class="menu-icon">
              <el-icon><Files /></el-icon>
            </div>
            <span>学科管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/question-bank" class="menu-item">
            <div class="menu-icon">
              <el-icon><QuestionFilled /></el-icon>
            </div>
            <span>题库管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/setting" class="menu-item">
            <div class="menu-icon">
              <el-icon><Setting /></el-icon>
            </div>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main class="main-content">
        <div class="content-wrapper">
          <router-view></router-view>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { User, UserFilled, DataLine, Setting, Collection, Files, QuestionFilled } from '@element-plus/icons-vue'
</script>

<style scoped>
.admin-center {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* 顶部标题区域 */
.header-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  position: relative;
  z-index: 10;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 30px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
}

.logo-icon .el-icon {
  font-size: 24px;
  color: white;
}

h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #2c3e50, #409eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-subtitle {
  color: #7f8c8d;
  font-size: 16px;
  font-weight: 400;
}

/* 侧边栏 */
.sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px 0 0 16px;
  margin-top: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 260px !important;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  height: fit-content;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  z-index: 100;
}

/* 主容器 */
.main-container {
  flex: 1;
  max-width: 2200px;
  margin: 0 auto;
  padding: 0 30px;
  gap: 0;
  display: flex;
  align-items: flex-start;
}

.sidebar-header {
  padding: 24px 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 8px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.admin-menu {
  border: none;
  background: transparent;
}

.admin-menu .el-menu-item {
  margin: 4px 12px;
  border-radius: 12px;
  height: 56px;
  line-height: 56px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.admin-menu .el-menu-item:hover {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-color: rgba(64, 158, 255, 0.2);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.admin-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  border-color: transparent;
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);
  transform: translateX(4px);
}

.admin-menu .el-menu-item.is-active .menu-icon {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-icon {
  width: 36px;
  height: 36px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.menu-icon .el-icon {
  font-size: 18px;
  color: #409eff;
}

/* 主内容区域 */
.main-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin-top: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0;
  width: 1300px;
  height: 800px;
  flex-shrink: 0;
  margin-left: 20px;
  overflow: hidden;
}

.content-wrapper {
  padding: 30px;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-container {
    padding: 0 20px;
  }
  
  .header-content {
    padding: 0 20px;
  }
  
  h1 {
    font-size: 24px;
  }
  
  .sidebar {
    width: 240px !important;
  }
  
  .main-content {
    width: 900px;
    height: 700px;
    margin-left: 15px;
  }
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
    padding: 0 15px;
  }
  
  .sidebar {
    width: 100% !important;
    border-radius: 16px;
    margin-bottom: 20px;
    position: relative;
    top: 0;
    height: auto;
    margin-top: 20px;
  }
  
  .main-content {
    width: 100%;
    height: 600px;
    border-radius: 16px;
    margin-top: 20px;
    margin-left: 0;
  }
  
  .content-wrapper {
    padding: 20px;
  }
  
  h1 {
    font-size: 20px;
  }
  
  .logo-icon {
    width: 40px;
    height: 40px;
  }
  
  .logo-icon .el-icon {
    font-size: 20px;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-center {
  animation: fadeInUp 0.6s ease-out;
}

.menu-item {
  animation: fadeInUp 0.6s ease-out;
}

.menu-item:nth-child(1) { animation-delay: 0.1s; }
.menu-item:nth-child(2) { animation-delay: 0.2s; }
.menu-item:nth-child(3) { animation-delay: 0.3s; }
.menu-item:nth-child(4) { animation-delay: 0.4s; }
.menu-item:nth-child(5) { animation-delay: 0.5s; }
.menu-item:nth-child(6) { animation-delay: 0.6s; }
.menu-item:nth-child(7) { animation-delay: 0.7s; }
</style>
