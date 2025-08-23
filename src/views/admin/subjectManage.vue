<!-- 少一个获取全部subject的接口 -->
<template>
  <div class="subject-manage">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">学科管理</h2>
      </div>
      <el-button type="primary" @click="showAddDialog" size="large">
        <el-icon><Plus /></el-icon>
        添加学科
      </el-button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <div class="search-content">
        <div class="search-group">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索学科名称或描述"
            style="width: 300px;"
            clearable
            @input="handleSearch"
            size="large"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select 
            v-model="selectedStatus" 
            placeholder="选择状态" 
            style="width: 150px;" 
            clearable
            size="large"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </div>
        
        <div class="search-actions">
          <el-button type="info" @click="resetSearch" size="large">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-section">
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="table-header">
            <div class="table-title">
              <el-icon><Collection /></el-icon>
              <span>学科列表</span>
            </div>
            <div class="table-info">
              <el-tag type="info" size="large">
                共 {{ filteredSubjects.length }} 条记录
              </el-tag>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="filteredSubjects" 
          style="width: 100%" 
          v-loading="loading"
          border
          stripe
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          :cell-style="{ padding: '12px 0' }"
        >
          <el-table-column label="序号" width="80" align="center">
            <template #default="scope">
              {{ (scope.$index + 1) }}
            </template>
          </el-table-column>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="name" label="学科名称" min-width="200" />
          <el-table-column prop="category" label="分类" width="120" align="center" />
          <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="large">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right" align="center">
            <template #default="scope">
              <div class="action-buttons">
                <el-button size="small" @click="editSubject(scope.row)" type="primary">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" type="info" @click="showRelatedCourses(scope.row)">
                  <el-icon><Link /></el-icon>
                  关联课程
                </el-button>
                <el-button size="small" type="danger" @click="deleteSubject(scope.row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 添加/编辑学科对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑学科' : '添加学科'"
      width="600px"
      :close-on-click-modal="false"
      class="subject-dialog"
    >
      <el-form :model="subjectForm" :rules="formRules" ref="subjectFormRef" label-width="100px">
        <el-form-item label="学科名称" prop="name">
          <el-input v-model="subjectForm.name" placeholder="请输入学科名称" size="large" />
        </el-form-item>
        
        <el-form-item label="分类" prop="category">
          <el-input v-model="subjectForm.category" placeholder="请输入学科分类" size="large" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="subjectForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入学科描述"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="subjectForm.status" size="large">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="subjectForm.sortOrder" :min="1" :max="999" size="large" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="saveSubject" :loading="saving" size="large">
            {{ isEdit ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 关联课程对话框 -->
    <el-dialog
      v-model="relatedCoursesDialogVisible"
      title="关联课程"
      width="700px"
      :close-on-click-modal="false"
      class="related-courses-dialog"
    >
      <div class="dialog-content">
        <div class="subject-info">
          <el-icon><Collection /></el-icon>
          <span class="info-label">当前学科：</span>
          <el-tag type="primary" size="large">{{ currentSubject?.name }}</el-tag>
        </div>
        
        <el-table 
          :data="relatedCourses" 
          style="width: 100%" 
          v-loading="relatedCoursesLoading"
          border
          stripe
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column prop="id" label="课程ID" width="100" align="center" />
          <el-table-column prop="name" label="课程名称" min-width="200" />
          <el-table-column prop="code" label="课程编码" width="140" align="center" />
          <el-table-column prop="category" label="分类" width="140" align="center" />
          <el-table-column prop="createTime" label="创建时间" width="180" align="center">
            <template #default="scope">
              {{ formatDateTime(scope.row.createTime || scope.row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="relatedCoursesDialogVisible = false" size="large">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, Refresh, Edit, Link, Delete, 
  Collection 
} from '@element-plus/icons-vue'
import { subjectController } from '@/api/apiLearning'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const searchKeyword = ref('')
const selectedStatus = ref('')
const subjectFormRef = ref()

// 学科数据
const subjectList = ref([])

const subjectForm = reactive({
  id: null,
  name: '',
  code: '',
  category: '',
  description: '',
  status: 1,
  sortOrder: 1
})

const formRules = {
  name: [
    { required: true, message: '请输入学科名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入学科代码', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请输入学科分类', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  sortOrder: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
}

// 计算属性 - 只处理状态筛选，搜索由API处理
const filteredSubjects = computed(() => {
  let filtered = subjectList.value

  if (selectedStatus.value !== '') {
    filtered = filtered.filter(item => item.status === selectedStatus.value)
  }

  return filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
})

// 方法
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const handleSearch = async () => {
  if (searchKeyword.value.trim()) {
    try {
      loading.value = true
      const data = await subjectController.search(searchKeyword.value.trim())
      subjectList.value = data || []
    } catch (error) {
      console.error('搜索失败:', error)
      ElMessage.error('搜索失败，请重试')
    } finally {
      loading.value = false
    }
  } else {
    // 如果搜索关键词为空，重新加载所有数据
    await loadSubjects()
  }
}

const resetSearch = async () => {
  searchKeyword.value = ''
  selectedStatus.value = ''
  // 重新加载所有学科数据
  await loadSubjects()
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editSubject = (row) => {
  isEdit.value = true
  Object.assign(subjectForm, row)
  dialogVisible.value = true
}



const deleteSubject = async (row) => {
  if (row.knowledgeCount > 0) {
    ElMessage.warning(`该学科下还有 ${row.knowledgeCount} 个知识点，无法删除`)
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除学科"${row.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除API
    await subjectController.delete(row.id)
    ElMessage.success('删除成功')
    
    // 重新加载数据
    await loadSubjects()
  } catch (error) {
    if (error.message !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  }
}

const resetForm = () => {
  Object.assign(subjectForm, {
    id: null,
    name: '',
    code: '',
    category: '',
    description: '',
    status: 1,
    sortOrder: 1
  })
  if (subjectFormRef.value) {
    subjectFormRef.value.clearValidate()
  }
}

const saveSubject = async () => {
  if (!subjectFormRef.value) return
  
  try {
    await subjectFormRef.value.validate()
    saving.value = true
    
    // 检查学科代码是否重复
    const existingSubject = subjectList.value.find(item => 
      item.code === subjectForm.code && item.id !== subjectForm.id
    )
    if (existingSubject) {
      ElMessage.error('学科代码已存在，请使用其他代码')
      return
    }
    
    if (isEdit.value) {
      // 更新学科
      await subjectController.update(subjectForm)
      ElMessage.success('更新成功')
    } else {
      // 添加学科
      await subjectController.add(subjectForm)
      ElMessage.success('添加成功')
    }
    
    // 重新加载数据
    await loadSubjects()
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    saving.value = false
  }
}

// 加载学科数据
const loadSubjects = async () => {
  try {
    loading.value = true
    // 使用获取全部学科的接口
    const data = await subjectController.getAll()
    subjectList.value = data || []
  } catch (error) {
    console.error('加载学科数据失败:', error)
    ElMessage.error('加载数据失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

// 关联课程对话框
const relatedCoursesDialogVisible = ref(false)
const relatedCoursesLoading = ref(false)
const currentSubject = ref({})
const relatedCourses = ref([])

// 显示关联课程
const showRelatedCourses = async (row) => {
  currentSubject.value = { ...row }
  relatedCoursesDialogVisible.value = true
  relatedCoursesLoading.value = true
  relatedCourses.value = []
  try {
    const data = await subjectController.getCoursesBySubjectId(row.id)
    if (Array.isArray(data)) {
      relatedCourses.value = data
    } else if (data && Array.isArray(data.records)) {
      relatedCourses.value = data.records
    } else {
      relatedCourses.value = []
    }
  } catch (error) {
    console.error('获取关联课程失败:', error)
    ElMessage.error('获取关联课程失败，请重试')
  } finally {
    relatedCoursesLoading.value = false
  }
}

onMounted(() => {
  loadSubjects()
})
</script>

<style scoped>
.subject-manage {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.header-content {
  display: flex;
  flex-direction: column;
  margin-right: 20px;
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-subtitle {
  color: #909399;
  font-size: 14px;
  margin-top: 5px;
}

.search-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.search-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-actions {
  display: flex;
  align-items: center;
}

.table-section {
  margin-top: 20px;
}

.table-card {
  border-radius: 8px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.table-info {
  color: #909399;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.subject-dialog .el-dialog__header {
  background-color: #409eff;
  color: white;
  border-radius: 8px 8px 0 0;
}

.subject-dialog .el-dialog__header .el-dialog__title {
  color: white;
}

.related-courses-dialog .el-dialog__header {
  background-color: #67c23a;
  color: white;
  border-radius: 8px 8px 0 0;
}

.related-courses-dialog .el-dialog__header .el-dialog__title {
  color: white;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.subject-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.info-label {
  color: #606266;
  font-size: 15px;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.action-buttons .el-button {
  flex: 1;
  min-width: 70px;
  white-space: nowrap;
}
</style>
