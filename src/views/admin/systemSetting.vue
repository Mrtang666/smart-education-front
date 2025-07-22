<template>
  <div class="system-setting">
    <el-form
      :model="settingForm"
      label-width="120px"
      class="setting-form"
    >
      <el-form-item label="管理员密码">
        <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
      </el-form-item>

      <el-form-item label="系统名称">
        <el-input v-model="settingForm.systemName" />
      </el-form-item>

      <el-form-item label="系统公告">
        <el-input
          v-model="settingForm.announcement"
          type="textarea"
          :rows="4"
          placeholder="系统公告将显示在登录页面"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSaveSettings">保存设置</el-button>
      </el-form-item>
    </el-form>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
      center
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmChangePassword">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const settingForm = ref({
  systemName: '慧课',
  announcement: ''
})

// 密码修改相关
const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleChangePassword = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordDialogVisible.value = true
}

const confirmChangePassword = () => {
  passwordFormRef.value?.validate((valid) => {
    if (valid) {
      ElMessage.success('密码修改成功')
      passwordDialogVisible.value = false
    }
  })
}

const handleSaveSettings = () => {
  // TODO: 实现保存设置功能
  ElMessage.info('保存成功')
}
</script>

<style scoped>
.system-setting {
  padding: 20px;
}

.setting-form {
  max-width: 600px;
  margin-top: 20px;
}
</style>
