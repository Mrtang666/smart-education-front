<template>
  <div class="login-page">
    <div class="login-container">
      <h2 class="login-title">基于AI的教学实训平台</h2>
      <login-form />
    </div>
  </div>
</template>

<script setup lang="js">
import LoginForm from '@/components/auth/loginForm.vue';
</script>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-container {
  width: 380px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.login-title {
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}
</style>