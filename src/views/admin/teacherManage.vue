<template>
  <div class="teacher-manage">
    <h2>教师管理</h2>
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索教师姓名或工号"
        class="search-input"
      >
        <template #suffix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button type="success" @click="handleAdd">添加教师</el-button>
    </div>

    <el-table :data="teacherList" border style="width: 100%">
      <el-table-column prop="teacherId" label="工号" width="120" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="fullName" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button @click="handleEdit(scope.row)" type="primary" size="small">编辑</el-button>
          <el-button @click="handleDelete(scope.row)" type="danger" size="small">禁用</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50]"
      :total="total"
      layout="total, sizes, prev, pager, next"
      class="pagination"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isAdd ? '添加教师' : '编辑教师信息'"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" :disabled="!isAdd" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="isAdd">
          <el-input v-model="editForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="fullName">
          <el-input v-model="editForm.fullName" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { teacherAPI, authAPI } from '@/api/api'

const searchQuery = ref('')
const teacherList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 控制编辑对话框的显示
const editDialogVisible = ref(false)
const isAdd = ref(false)
// 编辑的表单数据
const editForm = ref({
  teacherId: '',
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
    const response = await teacherAPI.getTeacherList()
    // 前端处理搜索和分页
    let filteredList = response.data
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filteredList = filteredList.filter(teacher => 
        teacher.username.toLowerCase().includes(query) ||
        teacher.fullName?.toLowerCase().includes(query) ||
        teacher.teacherId.toString().includes(query)
      )
    }
    // 分页处理
    total.value = filteredList.length
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    teacherList.value = filteredList.slice(start, end)
  } catch (error) {
    console.error('获取教师列表失败:', error)
    ElMessage.error('获取教师列表失败')
  }
}

const handleAdd = () => {
  editForm.value = {
    teacherId: '',
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
      // 使用注册接口添加教师
      await authAPI.registerTeacher({
        username: editForm.value.username,
        password: editForm.value.password,
        fullName: editForm.value.fullName,
        email: editForm.value.email,
        phone: editForm.value.phone
      })
      ElMessage.success('添加成功')
    } else {
      await teacherAPI.updateTeacher(editForm.value)
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
    `确定要禁用教师 ${row.fullName || row.username} 吗？禁用后该教师将无法登录系统。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await teacherAPI.disableTeacher(row.teacherId)
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
.teacher-manage {
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.search-input {
  width: 300px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
