<template>
    <div class="password-change-page">
        <!-- 左侧密码修改表单区域 -->
        <div class="password-change-container">
            <div class="password-change-form-wrapper">
                <div class="logo-section">
                    <img src="@/assets/projectlogo.png" alt="慧课" class="logo" />
                    <h1 class="brand-title">慧课</h1>
                    <p class="brand-subtitle">基于AI的智慧教学平台</p>
                </div>

                <div class="welcome-section">
                    <h2 class="welcome-title">密码修改</h2>
                    <p class="welcome-subtitle">保护您的账户安全</p>
                </div>

                <el-form :model="form" :rules="rules" ref="formRef" label-width="0px" class="password-form">
                    <el-form-item prop="username">
                        <el-input v-model="form.username" placeholder="请输入用户名" size="large">
                            <template #prefix>
                                <el-icon>
                                    <User />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item prop="oldPassword">
                        <el-input v-model="form.oldPassword" type="password" placeholder="请输入旧密码" size="large">
                            <template #prefix>
                                <el-icon>
                                    <Lock />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item prop="newPassword">
                        <el-input v-model="form.newPassword" type="password" placeholder="请输入新密码" size="large">
                            <template #prefix>
                                <el-icon>
                                    <Lock />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item prop="confirmPassword">
                        <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" size="large">
                            <template #prefix>
                                <el-icon>
                                    <Lock />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-radio-group v-model="userType" class="user-type-group">
                            <el-radio value="student">学生</el-radio>
                            <el-radio value="teacher">教师</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="submitForm" size="large" class="submit-btn">修改密码</el-button>
                        <el-button @click="resetForm" size="large" class="reset-btn">重置</el-button>
                    </el-form-item>
                </el-form>

                <div class="auth-switch">
                    <span>返回登录？</span>
                    <router-link to="/login" class="switch-link">立即登录</router-link>
                </div>
            </div>
        </div>

        <!-- 右侧背景区域 -->
        <div class="decoration-area">
        </div>
    </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { authAPI } from '@/api/api';

export default {
    name: 'PasswordChange',
    components: {
        User,
        Lock
    },
    data() {
        return {
            formRef: null,
            userType: 'student',
            form: {
                username: '',
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            },

        };
    },


    computed: {
        rules() {
            return {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' }
                ],
                oldPassword: [
                    { required: true, message: '请输入旧密码', trigger: 'blur' },
                    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
                ],
                newPassword: [
                    { required: true, message: '请输入新密码', trigger: 'blur' },
                    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
                ],
                confirmPassword: [
                    { required: true, message: '请再次输入新密码', trigger: 'blur' },
                    { validator: this.validateConfirmPassword, trigger: 'blur' }
                ]
            };
        }
    },
    methods: {
        validateConfirmPassword(rule, value, callback) {
            if (value === '') {
                callback(new Error('请再次输入密码'));
            } else if (value !== this.form.newPassword) {
                callback(new Error('两次输入密码不一致!'));
            } else {
                callback();
            }
        },
        async submitForm() {
            if (!this.$refs.formRef) return;

            await this.$refs.formRef.validate(async (valid) => {
                if (valid) {
                    try {
                        const changePasswordData = {
                            username: this.form.username,
                            oldPassword: this.form.oldPassword,
                            newPassword: this.form.newPassword
                        };

                        let response;
                        if (this.userType === 'student') {
                            response = await authAPI.changeStudentPassword(changePasswordData);
                        } else {
                            response = await authAPI.changeTeacherPassword(changePasswordData);
                        }

                        // 更新token
                        if (response && response.accessToken) {
                            // 使用localStorage代替Vuex存储token
                            localStorage.setItem('accessToken', response.accessToken);
                            localStorage.setItem('refreshToken', response.refreshToken);

                            ElMessage({
                                type: 'success',
                                message: '密码修改成功!'
                            });

                            // 重置表单
                            this.resetForm();

                            // 可以选择跳转到其他页面
                            // this.$router.push('/dashboard');
                        }
                    } catch (error) {
                        ElMessage({
                            type: 'error',
                            message: error.response?.data?.message || '密码修改失败，请检查输入信息'
                        });
                    }
                } else {
                    ElMessage({
                        type: 'warning',
                        message: '请正确填写表单信息'
                    });
                    return false;
                }
            });
        },
        resetForm() {
            if (this.$refs.formRef) {
                this.$refs.formRef.resetFields();
            }
        }
    }
};
</script>

<style scoped>
.password-change-page {
    width: 100%;
    height: 100vh;
    display: flex;
    background: linear-gradient(to right, rgba(173, 216, 230, 0.8) 0%, rgba(173, 216, 230, 0.4) 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%), url('@/assets/background.png') no-repeat right center;
    background-size: contain;
    position: relative;
    overflow: hidden;
}


/* 
.password-change-page::before {
    content: '慧';
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

/* .password-change-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(135, 206, 250, 0.8) 0%, rgba(70, 130, 180, 0.9) 100%);
  opacity: 0.5;
  z-index: 1;
} */

/* 密码修改表单区域 */
.password-change-container {
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

.password-change-form-wrapper {
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

.password-form {
    margin-bottom: 20px;
}

.password-form .el-form-item {
    margin-bottom: 20px;
}

.password-form .el-input {
    border-radius: 8px;
}

.user-type-group {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 30px;
}

.user-type-group .el-radio {
    margin-right: 0;
}

.submit-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    background: linear-gradient(135deg, #4a6cf7 0%, #667eea 100%);
    border: none;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
}

.submit-btn:hover {
    background: linear-gradient(135deg, #3b5ce6 0%, #5a6fd9 100%);
}

.reset-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    border: 1px solid #dcdfe6;
    color: #606266;
    font-size: 16px;
    font-weight: 500;
}

.reset-btn:hover {
    color: #4a6cf7;
    border-color: #4a6cf7;
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

/* 右侧背景区域 */
.decoration-area {
    flex: 1;
    position: relative;
    z-index: 1;
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .decoration-area {
        display: none;
    }

    .password-change-container {
        width: 100%;
    }

    .password-change-page::before {
        font-size: 36px;
        top: 30px;
        left: 30px;
        letter-spacing: 6px;
    }
}
</style>