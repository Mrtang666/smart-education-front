<template>
    <div class="reg-form">
        <!-- 角色选择 -->
        <div class="role-selector">
            <div class="role-option" :class="{ active: selectedRole === 'student' }" @click="selectedRole = 'student'">
                <van-icon name="manager-o" class="role-icon" />
                <span>学生</span>
            </div>
            <div class="role-option" :class="{ active: selectedRole === 'teacher' }" @click="selectedRole = 'teacher'">
                <van-icon name="contact" class="role-icon" />
                <span>教师</span>
            </div>
        </div>

        <van-cell-group class="input-group">
            <!-- 用户名输入框 -->
            <div class="custom-field">
                <van-field v-model="username" placeholder="请输入用户名" left-icon="contact-o" class="reg-input"
                    :clearable="false" />
                <div v-if="username" class="custom-clear" @click="username = ''">
                    <van-icon name="cross" />
                </div>
            </div>

            <!-- 密码输入框 -->
            <div class="custom-field">
                <van-field v-model="password" type="password" placeholder="请输入密码" left-icon="lock" class="reg-input"
                    :clearable="false" />
                <div v-if="password" class="custom-clear" @click="password = ''">
                    <van-icon name="cross" />
                </div>
            </div>

            <!-- 确认密码输入框 -->
            <div class="custom-field">
                <van-field v-model="confirmPassword" type="password" placeholder="请确认密码" left-icon="lock" class="reg-input"
                    :clearable="false" />
                <div v-if="confirmPassword" class="custom-clear" @click="confirmPassword = ''">
                    <van-icon name="cross" />
                </div>
            </div>

            <!-- 邮箱输入框 -->
            <div class="custom-field">
                <van-field v-model="email" placeholder="请输入邮箱" left-icon="envelop-o" class="reg-input"
                    :clearable="false" />
                <div v-if="email" class="custom-clear" @click="email = ''">
                    <van-icon name="cross" />
                </div>
            </div>

            <!-- 姓名输入框 -->
            <div class="custom-field">
                <van-field v-model="fullName" placeholder="请输入姓名" left-icon="user-o" class="reg-input"
                    :clearable="false" />
                <div v-if="fullName" class="custom-clear" @click="fullName = ''">
                    <van-icon name="cross" />
                </div>
            </div>

            <!-- 电话输入框 -->
            <div class="custom-field">
                <van-field v-model="phone" placeholder="请输入电话" left-icon="phone-o" class="reg-input"
                    :clearable="false" />
                <div v-if="phone" class="custom-clear" @click="phone = ''">
                    <van-icon name="cross" />
                </div>
            </div>
        </van-cell-group>

        <van-button type="primary" block @click="handleRegister" class="reg-button">注 册</van-button>
        <div class="additional-options">
            <van-checkbox v-model="agreeTerms" class="agree-terms">同意用户协议和隐私条款</van-checkbox>
            <div class="right-links">
                <span class="login-link" @click="goToLogin">已有账号？去登录</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authAPI } from '@/api/api';
import { ElMessage } from 'element-plus';

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const email = ref('');
const fullName = ref('');
const phone = ref('');
const agreeTerms = ref(false);
const router = useRouter();

// 角色选择，默认为学生
const selectedRole = ref('student');

const handleRegister = async () => {
    // 表单验证
    if (!username.value.trim()) {
        ElMessage.error('用户名不能为空');
        return;
    }
    if (!password.value.trim()) {
        ElMessage.error('密码不能为空');
        return;
    }
    if (password.value !== confirmPassword.value) {
        ElMessage.error('两次密码输入不一致');
        return;
    }
    if (!email.value.trim()) {
        ElMessage.error('邮箱不能为空');
        return;
    }
    if (!fullName.value.trim()) {
        ElMessage.error('姓名不能为空');
        return;
    }
    if (!agreeTerms.value) {
        ElMessage.error('请同意用户协议和隐私条款');
        return;
    }

    // 检查用户名是否可用
    try {
        let isUsernameAvailable;
        if (selectedRole.value === 'student') {
            isUsernameAvailable = await authAPI.checkAvailableUsername(username.value);
        } else {
            isUsernameAvailable = await authAPI.checkAvailableUsernameForTeacher(username.value);
        }
        
        if (!isUsernameAvailable) {
            ElMessage.error('用户名已被占用，请更换');
            return;
        }
    } catch (err) {
        console.error('检查用户名失败:', err);
        ElMessage.error('检查用户名失败，请稍后再试');
        return;
    }

    try {
        let res;
        
        if (selectedRole.value === 'student') {
            // 捕获异常
            try {
                // 构建学生注册数据
            const studentData = {
                username: username.value,
                password: password.value,
                email: email.value,
                fullName: fullName.value,
                phone: phone.value,
                role: 'STUDENT'  // 添加角色标识
            };
            
            // 调用学生注册接口
            res = await authAPI.studentRegister(studentData);
            console.log('学生注册成功:', res);
            } catch (err) {
                console.error('学生注册失败:', err);
                ElMessage.error('学生注册失败，请稍后再试');
                return;
            }
            

        } else {
            // 构建教师注册数据
            const teacherData = {
                username: username.value,
                password: password.value,
                email: email.value,
                fullName: fullName.value,
                phone: phone.value,
                role: 'TEACHER'  // 添加角色标识
            };
            
            // 调用教师注册接口
            res = await authAPI.registerTeacher(teacherData);
            console.log('教师注册成功:', res);
        }
        
        ElMessage.success('注册成功，即将跳转到登录页');
        
        // 延迟跳转到登录页
        setTimeout(() => {
            router.push('/login');
        }, 1500);
    } catch (err) {
        console.error('注册失败:', err);
        
        // 提供更详细的错误信息
        if (err.response) {
            // 服务器返回了错误状态码
            const statusCode = err.response.status;
            const responseData = err.response.data;
            
            if (statusCode === 500) {
                ElMessage.error(`服务器内部错误(500)，请联系管理员`);
                console.error('服务器响应数据:', responseData);
            } else if (statusCode === 400) {
                ElMessage.error(`请求参数错误(400): ${responseData.message || '请检查输入信息'}`);
            } else if (statusCode === 409) {
                ElMessage.error(`用户名或邮箱已存在(409): ${responseData.message || '请更换用户名或邮箱'}`);
            } else {
                ElMessage.error(`注册失败(${statusCode}): ${responseData.message || '请稍后再试'}`);
            }
        } else if (err.request) {
            // 请求已发送但没有收到响应
            ElMessage.error('服务器无响应，请检查网络连接或稍后再试');
        } else {
            // 请求配置出错
            ElMessage.error(`请求错误: ${err.message}`);
        }
    }
};

const goToLogin = () => {
    router.push('/login');
};
</script>

<style scoped>
.reg-form {
    width: 100%;
    max-width: 320px;
}

/* 角色选择器样式 */
.role-selector {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    width: 100%;
}

.role-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px 0;
    border-radius: 8px;
    background-color: #f5f7fa;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 0 5px;
}

.role-option.active {
    background-color: #e6f7ff;
    border: 1px solid #4a6cf7;
    color: #4a6cf7;
}

.role-icon {
    font-size: 24px;
    margin-bottom: 8px;
}

.input-group {
    margin-bottom: 24px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.reg-input {
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

.reg-button {
    height: 46px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
    background-color: #4a6cf7;
    border-color: #4a6cf7;
    box-shadow: 0 4px 12px rgba(74, 108, 247, 0.3);
    transition: all 0.3s ease;
}

.reg-button:hover {
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

.login-link {
    color: #4a6cf7;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s;
}

.login-link:hover {
    color: #3a5ce5;
    text-decoration: underline;
}

.agree-terms {
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
