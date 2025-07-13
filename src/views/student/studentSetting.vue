<!-- 学生信息设置页面 -->
<template>
  <div class="settings-container">
    <!-- 左侧菜单栏 -->
    <div class="settings-sidebar">
      <h2 class="settings-title">设置</h2>
      <div class="settings-menu">
        <div
          v-for="item in menuItems"
          :key="item.id"
          class="menu-item"
          :class="{ 'active': activeMenu === item.id }"
          @click="activeMenu = item.id"
        >
          {{ item.name }}
        </div>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="settings-content">
      <!-- 通用标题 -->
      <h2 class="content-title">{{ getCurrentMenuTitle() }}</h2>

      <!-- 账号管理 -->
      <div v-if="activeMenu === 'account'" class="account-management">
        <el-form 
          label-position="top" 
          :model="userForm" 
          ref="userFormRef"
          :rules="rules"
          v-loading="loading"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="true"></el-input>
          </el-form-item>

          <el-form-item label="真实姓名" prop="fullName">
            <el-input v-model="userForm.fullName" placeholder="请输入真实姓名"></el-input>
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="userForm.phone" placeholder="请输入手机号"></el-input>
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="saveUserInfo" :loading="saving">保存修改</el-button>
          </el-form-item>

          <div class="danger-zone">
            <h3>危险区域</h3>
            <el-button type="danger" @click="showLogoutConfirm">注销账号</el-button>
          </div>
        </el-form>
      </div>

      <!-- 隐私设置 -->
      <div v-if="activeMenu === 'privacy'" class="privacy-settings">
        <div class="privacy-menu">
          <div class="privacy-menu-item" @click="showPrivacyAgreement">
            <span>隐私协议</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="privacy-menu-item" @click="showUserAgreement">
            <span>用户协议</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- 帮助中心 -->
      <div v-if="activeMenu === 'help'" class="help-center">
        <p class="placeholder-text">帮助中心页面内容将在后续开发中添加</p>
      </div>

      <!-- 关于 -->
      <div v-if="activeMenu === 'about'" class="about-section">
        <div class="app-info">
          <img src="@/assets/projectlogo.png" alt="应用Logo" class="app-logo">
          <h3 class="app-name">慧课</h3>
          <p class="app-version">版本: 1.3.3</p>
          <p class="app-description">
            慧课是一款专为学生和教师设计的教育管理系统，提供课程管理、作业提交、考试安排等功能。
          </p>
        </div>
        
        <div class="about-details">
          <div class="detail-item">
            <span class="detail-label">开发团队:</span>
            <span class="detail-value">慧课研发团队</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">技术支持:</span>
            <span class="detail-value">support@huike.com</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">版权所有:</span>
            <span class="detail-value">© 2025 慧课</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 隐私协议对话框 -->
  <el-dialog
    v-model="privacyDialogVisible"
    title="隐私协议"
    width="60%"
    :before-close="() => privacyDialogVisible = false"
  >
    <div class="agreement-content">
      <h3>隐私政策</h3>
      <p>最后更新日期：2025年1月1日</p>
      
      <h4>1. 引言</h4>
      <p>欢迎使用慧课（以下简称"我们"或"平台"）。我们非常重视您的个人信息和隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和共享您的个人信息，以及您享有的相关权利。请您在使用我们的服务前，仔细阅读并了解本隐私政策的全部内容。</p>
      
      <h4>2. 我们收集的信息</h4>
      <p>我们可能收集以下类型的信息：</p>
      <ul>
        <li>基本信息：包括姓名、学号、联系方式、电子邮箱等。</li>
        <li>学习信息：包括课程选择、作业提交、考试成绩等。</li>
        <li>使用信息：包括设备信息、IP地址、浏览记录、使用习惯等。</li>
      </ul>
      
      <h4>3. 信息使用</h4>
      <p>我们使用收集的信息主要用于：</p>
      <ul>
        <li>提供、维护和改进我们的服务。</li>
        <li>响应您的请求、问题和反馈。</li>
        <li>分析使用趋势，优化用户体验。</li>
        <li>遵守法律法规的要求。</li>
      </ul>
      
      <h4>4. 信息共享</h4>
      <p>我们不会将您的个人信息出售给第三方。在以下情况下，我们可能会共享您的信息：</p>
      <ul>
        <li>经您明确同意。</li>
        <li>应法律法规要求、强制性的行政或司法要求。</li>
        <li>与我们的关联公司共享，用于提供服务和改进产品。</li>
      </ul>
      
      <h4>5. 信息安全</h4>
      <p>我们采取各种安全措施保护您的个人信息，防止数据遭到未经授权的访问、披露、使用、修改等。</p>
      
      <h4>6. 您的权利</h4>
      <p>您有权访问、更正、删除您的个人信息，以及撤回您的同意。如需行使这些权利，请通过本政策提供的联系方式与我们联系。</p>
      
      <h4>7. 政策更新</h4>
      <p>我们可能会不时更新本隐私政策。更新后的政策将在平台上发布，并标明更新日期。</p>
      
      <h4>8. 联系我们</h4>
      <p>如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：</p>
      <p>电子邮箱：privacy@smart-edu.com</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="privacyDialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 用户协议对话框 -->
  <el-dialog
    v-model="userAgreementDialogVisible"
    title="用户协议"
    width="60%"
    :before-close="() => userAgreementDialogVisible = false"
  >
    <div class="agreement-content">
      <h3>用户服务协议</h3>
      <p>最后更新日期：2025年1月1日</p>
      
      <h4>1. 协议的接受</h4>
      <p>欢迎使用慧课（以下简称"平台"）。本协议是您与平台之间关于使用平台服务所订立的协议。请您在使用平台服务前，仔细阅读并充分理解本协议的全部内容。一旦您开始使用平台服务，即表示您已充分理解并接受本协议的所有条款。</p>
      
      <h4>2. 服务内容</h4>
      <p>平台提供的服务包括但不限于：课程学习、作业提交、考试管理、学习资料获取等。平台有权根据实际情况变更、中断或终止部分或全部的服务。</p>
      
      <h4>3. 用户账号</h4>
      <p>您需要注册账号才能使用平台的完整服务。您应当保护好自己的账号和密码，对账号下的所有活动负责。如发现任何未经授权使用您账号的情况，请立即通知平台。</p>
      
      <h4>4. 用户行为规范</h4>
      <p>您在使用平台服务时应遵守以下行为规范：</p>
      <ul>
        <li>遵守中华人民共和国相关法律法规。</li>
        <li>尊重他人的知识产权和隐私权。</li>
        <li>不发布、传播违法、有害、骚扰、侮辱、恐吓、诽谤、淫秽或其他不当内容。</li>
        <li>不进行任何可能损害平台正常运行的行为。</li>
      </ul>
      
      <h4>5. 知识产权</h4>
      <p>平台上的内容（包括但不限于文本、图像、音频、视频、软件等）的知识产权归平台或相关权利人所有。未经平台或相关权利人明确书面许可，您不得以任何方式使用这些内容。</p>
      
      <h4>6. 免责声明</h4>
      <p>平台不对因下列原因导致的任何损害承担责任：</p>
      <ul>
        <li>不可抗力或不可归责于平台的原因。</li>
        <li>用户自身原因导致的损失。</li>
        <li>第三方原因导致的损失。</li>
      </ul>
      
      <h4>7. 协议修改</h4>
      <p>平台有权在必要时修改本协议条款。协议修改后，平台会在网站上公布修改后的协议内容。如您继续使用平台服务，即表示您接受修改后的协议。</p>
      
      <h4>8. 适用法律与争议解决</h4>
      <p>本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。如发生本协议相关的任何争议，双方应友好协商解决；协商不成的，任何一方均有权将争议提交至有管辖权的人民法院诉讼解决。</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="userAgreementDialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowRight } from '@element-plus/icons-vue';
import { studentAPI } from '@/api/api';  // 只导入studentAPI

// 菜单项
const menuItems = [
  { id: 'account', name: '账号管理' },
  { id: 'privacy', name: '隐私设置' },
  { id: 'help', name: '帮助中心' },
  { id: 'about', name: '关于' }
];

// 当前激活的菜单
const activeMenu = ref('account');

// 用户表单数据
const userForm = ref({
  username: '',
  fullName: '',
  phone: '',
  email: '',
  studentId: '' // 添加studentId字段
});

// 加载状态
const loading = ref(false);
const saving = ref(false);

// 表单引用
const userFormRef = ref(null);

// 表单验证规则
const rules = reactive({
  fullName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
});

// 隐私协议对话框
const privacyDialogVisible = ref(false);
const userAgreementDialogVisible = ref(false);

// 获取当前菜单标题
function getCurrentMenuTitle() {
  const currentMenu = menuItems.find(item => item.id === activeMenu.value);
  return currentMenu ? currentMenu.name : '';
}

// 组件挂载时获取用户信息
onMounted(async () => {
  await getUserInfo();
});

// 获取学生信息
async function getUserInfo() {
  loading.value = true;
  try {
    // 获取学生信息
    const userInfo = await studentAPI.getSelfStudentInfo();
    
    if (userInfo) {
      userForm.value = {
        username: userInfo.username || '',
        fullName: userInfo.fullName || '',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        studentId: userInfo.studentId || '' // 保存studentId
      };
      ElMessage.success('用户信息获取成功');
    }
  } catch (error) {
    console.error('获取学生信息失败:', error);
    ElMessage.error('获取学生信息失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

// 保存学生信息
function saveUserInfo() {
  if (!userFormRef.value) return;
  
  userFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请正确填写表单信息');
      return;
    }
    
    saving.value = true;
    try {
      const userData = {
        username: userForm.value.username,
        fullName: userForm.value.fullName,
        phone: userForm.value.phone,
        email: userForm.value.email,
        studentId: userForm.value.studentId // 确保包含studentId
      };
      
      // 更新学生信息
      const result = await studentAPI.updateStudent(userData);
      
      // 处理返回结果
      if (result) {
        const studentId = result.studentId || result.id;
        
        if (studentId) {
          ElMessage.success('学生信息更新成功');
          // 重新获取用户信息
          await getUserInfo();
        } else {
          ElMessage.error('学生信息更新失败');
        }
      } else {
        ElMessage.error('学生信息更新失败');
      }
    } catch (error) {
      console.error('更新学生信息失败:', error);
      ElMessage.error('更新学生信息失败，请稍后重试');
    } finally {
      saving.value = false;
    }
  });
}

// 显示注销账号确认对话框
function showLogoutConfirm() {
  ElMessageBox.confirm(
    '注销账号将删除您的所有数据，此操作不可逆，是否继续?',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      // 这里应该调用注销账号的API
      ElMessage.success('账号已注销');
    })
    .catch(() => {
      ElMessage.info('已取消注销操作');
    });
}

// 显示隐私协议
function showPrivacyAgreement() {
  privacyDialogVisible.value = true;
}

// 显示用户协议
function showUserAgreement() {
  userAgreementDialogVisible.value = true;
}
</script>

<style scoped>
.settings-container {
  display: flex;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.settings-sidebar {
  width: 200px;
  background-color: #f5f7fa;
  border-right: 1px solid #e6e6e6;
  padding: 20px 0;
}

.settings-title {
  padding: 0 20px;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  color: #303133;
}

.settings-menu {
  display: flex;
  flex-direction: column;
}

.menu-item {
  padding: 14px 20px;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s;
  font-size: 14px;
}

.menu-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.menu-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
  border-right: 3px solid #409eff;
}

.settings-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.content-title {
  margin-top: 0;
  margin-bottom: 30px;
  font-size: 22px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

/* 账号管理样式 */
.account-management {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.danger-zone {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px dashed #f56c6c;
}

.danger-zone h3 {
  color: #f56c6c;
  margin-bottom: 15px;
}

/* 占位文本样式 */
.placeholder-text {
  color: #909399;
  text-align: center;
  font-size: 16px;
  margin-top: 100px;
}

/* 关于页面样式 */
.about-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.app-logo {
  width: 120px;
  height: 120px;
  margin-bottom: 15px;
}

.app-name {
  font-size: 24px;
  margin: 10px 0;
}

.app-version {
  color: #909399;
  margin-bottom: 20px;
}

.app-description {
  text-align: center;
  max-width: 500px;
  line-height: 1.6;
  color: #606266;
}

.about-details {
  width: 100%;
  max-width: 500px;
}

.detail-item {
  display: flex;
  margin-bottom: 15px;
}

.detail-label {
  width: 100px;
  color: #909399;
}

.detail-value {
  flex: 1;
  color: #606266;
}

/* 隐私设置样式 */
.privacy-settings {
  padding: 20px 0;
}

.privacy-menu {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.privacy-menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.privacy-menu-item:last-child {
  border-bottom: none;
}

.privacy-menu-item:hover {
  background-color: #f5f7fa;
}

.privacy-menu-item span {
  font-size: 14px;
  color: #303133;
}

/* 协议内容样式 */
.agreement-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 10px;
}

.agreement-content h3 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #303133;
}

.agreement-content h4 {
  font-size: 16px;
  margin: 20px 0 10px;
  color: #303133;
}

.agreement-content p {
  margin: 10px 0;
  line-height: 1.6;
  color: #606266;
}

.agreement-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.agreement-content li {
  margin: 5px 0;
  color: #606266;
}
</style>