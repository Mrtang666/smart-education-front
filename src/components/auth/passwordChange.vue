<template>
    <div class="password-change-container">
        <h1>密码修改</h1>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
            <el-form-item label="用户名" prop="username">
                <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
            </el-form-item>
            <el-form-item label="旧密码" prop="oldPassword">
                <el-input v-model="form.oldPassword" type="password" placeholder="请输入旧密码"></el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="form.newPassword" type="password" placeholder="请输入新密码"></el-input>
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码"></el-input>
            </el-form-item>
            <el-form-item>
                <el-radio-group v-model="userType">
                    <el-radio label="student">学生</el-radio>
                    <el-radio label="teacher">教师</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="submitForm">修改密码</el-button>
                <el-button @click="resetForm">重置</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { authAPI } from '@/api/api';
// import { useRouter } from 'vue-router';

// const router = useRouter();
const formRef = ref(null);
const userType = ref('student'); // 默认为学生

const form = reactive({
    username: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const validateConfirmPassword = (rule, value, callback) => {
    if (value === '') {
        callback(new Error('请再次输入密码'));
    } else if (value !== form.newPassword) {
        callback(new Error('两次输入密码不一致!'));
    } else {
        callback();
    }
};

const rules = reactive({
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
        { validator: validateConfirmPassword, trigger: 'blur' }
    ]
});

const submitForm = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const changePasswordData = {
                    username: form.username,
                    oldPassword: form.oldPassword,
                    newPassword: form.newPassword
                };
                
                let response;
                if (userType.value === 'student') {
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
                    resetForm();
                    
                    // 可以选择跳转到其他页面
                    // router.push('/dashboard');
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
};

const resetForm = () => {
    if (formRef.value) {
        formRef.value.resetFields();
    }
};
</script>

<style scoped>
.password-change-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}
</style>