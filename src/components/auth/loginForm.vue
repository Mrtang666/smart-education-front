<template>
    <div class="login-form">
        <van-cell-group class="input-group">
            <!-- 用户名输入框 -->
            <div class="custom-field">
                <van-field v-model="username" placeholder="请输入用户名" left-icon="contact-o" class="login-input"
                    :clearable="false" />
                <div v-if="username" class="custom-clear" @click="username = ''">
                    <van-icon name="cross" />
                </div>
            </div>

            <!-- 密码输入框 -->
            <div class="custom-field">
                <van-field v-model="password" type="password" placeholder="请输入密码" left-icon="lock" class="login-input"
                    :clearable="false" />
                <div v-if="password" class="custom-clear" @click="password = ''">
                    <van-icon name="cross" />
                </div>
            </div>
        </van-cell-group>

        <van-button type="primary" block @click="handleLogin" class="login-button">登 录</van-button>
        <div class="additional-options">
            <van-checkbox v-model="rememberMe" class="remember-me">十天内免登录</van-checkbox>
            <div class="right-links">
                <span class="forgot-password" @click="goToPasswordChange">修改密码</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authAPI } from '@/api/api';
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const router = useRouter();
import { ElMessage } from 'element-plus'
import { initUserInfo, setToken, setRefreshToken } from '@/utils/auth';
const handleLogin = () => {
    // 教师学生统一登录接口
    authAPI.studentLogin(username.value, password.value).then(res => {
        // console.log('登录响应:', res);

        // 设置token到本地存储
        setToken(res.tokens.accessToken);
        setRefreshToken(res.tokens.refreshToken);

        // 设置用户角色信息到本地存储
        localStorage.setItem('user_role', JSON.stringify(res.roles));
        console.log("token 和 refreshToken 设置成功");

        // 初始化用户信息
        initUserInfo();
        
        // 根据角色不同跳转至首页
        if (res.roles && res.roles.includes('ROLE_ADMIN')) {
            router.push('/admin');
        } else if (res.roles && res.roles.includes('ROLE_STUDENT')) {
            router.push('/student');
        } else if (res.roles && res.roles.includes('ROLE_TEACHER')) {
            router.push('/teacher');
        }
    }).catch(err => {
        console.error('登录失败:', err);
        ElMessage.error('登录失败,请稍后再试');
    });
};


const goToPasswordChange = () => {
    router.push('/passwordchange');
};
</script>

<style scoped>
.login-form {
    width: 100%;
    max-width: 320px;
}

.input-group {
    margin-bottom: 24px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.login-input {
    height: 46px;
    font-size: 15px;
}

/* 自定义输入框容器 */
.custom-field {
    position: relative;
    display: flex;
    align-items: center;
}

/* 自定义清除按钮 */
.custom-clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ccc;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    opacity: 0.7;
    transition: all 0.2s;
}

.custom-clear:hover {
    opacity: 1;
    background-color: #999;
}

.login-button {
    height: 46px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
    background-color: #4a6cf7;
    border-color: #4a6cf7;
    box-shadow: 0 4px 12px rgba(74, 108, 247, 0.3);
    transition: all 0.3s ease;
}

.login-button:hover {
    background-color: #3a5ce5;
    border-color: #3a5ce5;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 108, 247, 0.4);
}

.additional-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding: 0 4px;
}

.right-links {
    display: flex;
    gap: 16px;
}

.forgot-password,
.register-link {
    color: #4a6cf7;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s;
}

.forgot-password:hover,
.register-link:hover {
    color: #3a5ce5;
    text-decoration: underline;
}

.remember-me {
    font-size: 14px;
    color: #606266;
}

:deep(.van-checkbox__label) {
    color: #606266;
}

:deep(.van-field__left-icon) {
    color: #909399;
}
</style>