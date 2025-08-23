<template>
  <div class="student-manage">
    <!-- 页面标题区域 -->
    <!-- <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">学生管理</h2>
        <p class="page-subtitle">管理系统中的学生账户信息</p>
      </div>
    </div> -->

    <!-- 搜索和操作区域 -->
    <div class="action-section">
      <div class="search-area">
        <el-input
          v-model="searchQuery"
          placeholder="搜索学生姓名、学号或用户名"
          class="search-input"
          size="large"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="large" @click="handleSearch" class="search-btn">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
      <div class="action-buttons">
        <el-button type="success" size="large" @click="handleAdd" class="add-btn">
          <el-icon><Plus /></el-icon>
          添加学生
        </el-button>
      </div>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-section">
      <el-card class="table-card" shadow="never">
        <div class="table-header">
          <h3 class="table-title">学生列表</h3>
          <span class="table-count">共 {{ total }} 位学生</span>
        </div>
        
        <el-table 
          :data="studentList" 
          border 
          stripe
          class="data-table"
          :header-cell-style="{ background: '#f8f9fa', color: '#2c3e50', fontWeight: '600' }"
          :cell-style="{ padding: '16px 0' }"
        >
          <el-table-column label="ID" width="80" align="center">
            <template #default="scope">
              {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="studentId" label="学号" width="120" align="center" />
          <el-table-column prop="username" label="用户名" width="140" align="center" />
          <el-table-column prop="fullName" label="姓名" width="120" align="center" />
          <el-table-column prop="email" label="邮箱" min-width="200" />
          <el-table-column prop="phone" label="电话" width="140" align="center" />
          <el-table-column prop="grade" label="年级" width="100" align="center" />
          <el-table-column prop="className" label="班级" width="120" align="center" />
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="scope">
              <div class="action-buttons-cell">
                <el-button 
                  @click="handleEdit(scope.row)" 
                  type="primary" 
                  size="small"
                  class="edit-btn"
                >
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button 
                  @click="handleDelete(scope.row)" 
                  type="danger" 
                  size="small"
                  class="delete-btn"
                >
                  <el-icon><Delete /></el-icon>
                  禁用
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页器 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isAdd ? '添加学生' : '编辑学生信息'"
      width="600px"
      class="edit-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
        class="edit-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="editForm.username" 
            :disabled="!isAdd"
            placeholder="请输入用户名"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="isAdd">
          <el-input 
            v-model="editForm.password" 
            type="password" 
            show-password
            placeholder="请输入密码"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="姓名" prop="fullName">
          <el-input 
            v-model="editForm.fullName"
            placeholder="请输入姓名"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input 
            v-model="editForm.phone"
            placeholder="请输入手机号"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="editForm.email"
            placeholder="请输入邮箱地址"
            size="large"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit" size="large">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { teacherAPI, authAPI } from '@/api/api'

const searchQuery = ref('')
const studentList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 控制编辑对话框的显示
const editDialogVisible = ref(false)
const isAdd = ref(false)
// 编辑的表单数据
const editForm = ref({
  studentId: '',
  username: '',
  password: '',
  fullName: '',
  email: '',
  phone: ''
})

// 编辑表单的校验规则
const editRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  fullName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

const handleSearch = async () => {
  try {
    const response = await teacherAPI.getStudentList()
    // 前端处理搜索和分页
    let filteredList = response.data
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filteredList = filteredList.filter(student => 
        student.username.toLowerCase().includes(query) ||
        student.fullName?.toLowerCase().includes(query) ||
        student.studentId.toString().includes(query)
      )
    }
    // 分页处理
    total.value = filteredList.length
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    studentList.value = filteredList.slice(start, end)
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.error('获取学生列表失败')
  }
}

const handleAdd = () => {
  editForm.value = {
    studentId: '',
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: ''
  }
  isAdd.value = true
  editDialogVisible.value = true
}

const handleEdit = (row) => {
  editForm.value = { ...row }
  isAdd.value = false
  editDialogVisible.value = true
}

const handleEditSubmit = async () => {
  try {
    if (isAdd.value) {
      // 使用注册接口添加学生
      await authAPI.studentRegister({
        username: editForm.value.username,
        password: editForm.value.password,
        fullName: editForm.value.fullName,
        email: editForm.value.email,
        phone: editForm.value.phone
      })
      ElMessage.success('添加成功')
    } else {
      await teacherAPI.updateStudent(editForm.value)
      ElMessage.success('更新成功')
    }
    editDialogVisible.value = false
    handleSearch() // 刷新列表
  } catch (error) {
    console.error(isAdd.value ? '添加失败:' : '更新失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error(isAdd.value ? '添加失败' : '更新失败')
    }
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要禁用学生 ${row.fullName || row.username} 吗？禁用后该学生将无法登录系统。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await teacherAPI.disableStudent(row.studentId)
      ElMessage.success('操作成功')
      handleSearch() // 刷新列表
    } catch (error) {
      console.error('操作失败:', error)
      if (error.response?.status === 405) {
        ElMessage.error('当前不支持此操作，请联系系统管理员')
      } else {
        ElMessage.error('操作失败')
      }
    }
  }).catch(() => {
    // 取消操作，不做处理
  })
}

const handleSizeChange = (val) => {
  pageSize.value = val
  handleSearch()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  handleSearch()
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.student-manage {
  padding: 0;
  background: #f5f7fa;
  min-height: 100%;
}

/* 页面标题区域 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 0;
  margin-bottom: 30px;
  color: white;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
  text-align: center;
}

.page-title {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 600;
  color: white;
}

.page-subtitle {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
  font-weight: 400;
}

/* 搜索和操作区域 */
.action-section {
  max-width: 1200px;
  margin: 0 auto 30px;
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.search-area {
  display: flex;
  gap: 12px;
  flex: 1;
  max-width: 500px;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-icon {
  color: #909399;
  font-size: 18px;
}

.search-btn {
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.add-btn {
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}

/* 表格区域 */
.table-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
}

.table-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.table-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.table-count {
  color: #909399;
  font-size: 14px;
}

.data-table {
  border-radius: 8px;
  overflow: hidden;
}

.data-table :deep(.el-table__header) {
  background: #f8f9fa;
}

.data-table :deep(.el-table__row:hover) {
  background: #f8f9fa;
}

.action-buttons-cell {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.edit-btn, .delete-btn {
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
}

.edit-btn {
  background: linear-gradient(135deg, #409eff, #67c23a);
  border: none;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #f56c6c, #e6a23c);
  border: none;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

/* 分页器 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.pagination :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background: linear-gradient(135deg, #409eff, #67c23a);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

/* 编辑对话框 */
.edit-dialog :deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.edit-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
  margin: 0;
}

.edit-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.edit-form {
  padding: 20px 0;
}

.edit-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #2c3e50;
}

.edit-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.dialog-footer .el-button {
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .search-area {
    max-width: none;
  }
  
  .page-header {
    padding: 30px 0;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .table-section,
  .action-section {
    padding: 0 20px;
  }
  
  .data-table {
    font-size: 14px;
  }
  
  .action-buttons-cell {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
