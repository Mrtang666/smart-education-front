<template>
  <div class="register-page">
    <!-- 左侧注册表单区域 -->
    <div class="register-container">
      <div class="register-form-wrapper">
        <div class="logo-section">
          <img src="@/assets/projectlogo.png" alt="慧课" class="logo" />
          <h1 class="brand-title">慧课</h1>
          <p class="brand-subtitle">基于AI的智慧教学平台</p>
        </div>
        
        <div class="welcome-section">
          <h2 class="welcome-title">欢迎注册</h2>
          <p class="welcome-subtitle">开启您的智慧学习之旅</p>
        </div>
        
        <reg-form />
        
        <div class="auth-switch">
          <span>已有账号？</span>
          <router-link to="/login" class="switch-link">立即登录</router-link>
        </div>
      </div>
    </div>
    
    <!-- 右侧背景区域 -->
    <div class="decoration-area">
    </div>
  </div>
</template>

<script setup lang="js">
import RegForm from '@/components/auth/regForm.vue';
</script>

<style scoped>
.register-page {
    width: 100%;
    height: 100vh;
    display: flex;
    background: linear-gradient(to right, rgba(173, 216, 230, 0.8) 0%, rgba(173, 216, 230, 0.4) 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%), url('@/assets/background.png') no-repeat right center;
    background-size: contain;
    position: relative;
    overflow: hidden;
}

/* .register-page::before {
    content: '慧课';
    position: absolute;
    top: 30px;
    left: 10%;
    font-size: 150px;
    font-weight: bold;
    color: white;
    letter-spacing: 8px;
    z-index: 1;
    pointer-events: none;
    opacity: 0.3;
} */

/* 左侧注册表单区域 */
.register-container {
    width: 480px;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    left: 25%;
    transform: translateX(-50%);
    z-index: 2;
    overflow-y: auto;
}

.register-form-wrapper {
    width: 320px;
    padding: 40px 30px;
    background: transparent;
    border-radius: 16px;
    box-shadow: none;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.logo {
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 4px 0;
  letter-spacing: 2px;
}

.brand-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  font-weight: 400;
}

/* 右侧背景区域 */
.decoration-area {
    flex: 1;
    position: relative;
    z-index: 1;
}



.welcome-section {
  text-align: left;
  margin-bottom: 30px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.welcome-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  font-weight: 400;
}

.auth-switch {
  text-align: center;
  margin-top: 30px;
  font-size: 14px;
  color: #6c757d;
}

.switch-link {
  color: #4a6cf7;
  text-decoration: none;
  margin-left: 8px;
  font-weight: 500;
}

.switch-link:hover {
  text-decoration: underline;
}



/* 响应式设计 */
@media (max-width: 1024px) {
    .decoration-area {
        display: none;
    }

    .register-container {
        width: 100%;
    }

    .register-page::before {
        font-size: 36px;
        top: 30px;
        left: 30px;
        letter-spacing: 6px;
    }
}
</style>