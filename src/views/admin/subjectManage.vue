<!-- 少一个获取全部subject的接口 -->
<template>
  <div class="subject-manage">
    <div class="page-header">
      <h2>学科管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加学科
      </el-button>
    </div>

    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索学科名称或描述"
        style="width: 300px; margin-right: 15px;"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
             <el-select v-model="selectedStatus" placeholder="选择状态" style="width: 150px; margin-right: 15px;" clearable>
         <el-option label="启用" :value="1" />
         <el-option label="禁用" :value="0" />
       </el-select>
      
      <el-button type="info" @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="filteredSubjects" style="width: 100%" v-loading="loading">
             <el-table-column prop="id" label="ID" width="80" />
       <el-table-column prop="name" label="学科名称" min-width="200" />
       <el-table-column prop="category" label="分类" width="120" />
       <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
       <el-table-column prop="code" label="学科代码" width="120" />
             <el-table-column prop="status" label="状态" width="100">
         <template #default="scope">
           <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
             {{ scope.row.status === 1 ? '启用' : '禁用' }}
           </el-tag>
         </template>
       </el-table-column>
      <el-table-column prop="knowledgeCount" label="知识点数量" width="120" />
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
             <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="editSubject(scope.row)">编辑</el-button>
            <el-button size="small" type="primary" @click="showRelatedCourses(scope.row)">关联课程</el-button>
            <el-button size="small" type="danger" @click="deleteSubject(scope.row)">删除</el-button>
          </template>
        </el-table-column>
    </el-table>

    <!-- 添加/编辑学科对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑学科' : '添加学科'"
      width="600px"
    >
      <el-form :model="subjectForm" :rules="formRules" ref="subjectFormRef" label-width="100px">
                 <el-form-item label="学科名称" prop="name">
           <el-input v-model="subjectForm.name" placeholder="请输入学科名称" />
         </el-form-item>
         
         <el-form-item label="分类" prop="category">
           <el-input v-model="subjectForm.category" placeholder="请输入学科分类" />
         </el-form-item>
         
         <el-form-item label="描述" prop="description">
           <el-input 
             v-model="subjectForm.description" 
             type="textarea" 
             :rows="3"
             placeholder="请输入学科描述"
           />
         </el-form-item>
        
                 <el-form-item label="状态" prop="status">
           <el-radio-group v-model="subjectForm.status">
             <el-radio :value="1">启用</el-radio>
             <el-radio :value="0">禁用</el-radio>
           </el-radio-group>
         </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="subjectForm.sortOrder" :min="1" :max="999" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSubject" :loading="saving">
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
    >
      <div v-if="currentSubject && currentSubject.name" style="margin-bottom: 10px;">
        当前学科：<strong>{{ currentSubject.name }}</strong>
      </div>
      <el-table :data="relatedCourses" style="width: 100%" v-loading="relatedCoursesLoading">
        <el-table-column prop="id" label="课程ID" width="100" />
        <el-table-column prop="name" label="课程名称" min-width="200" />
        <el-table-column prop="code" label="课程编码" width="140" />
        <el-table-column prop="category" label="分类" width="140" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime || scope.row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="relatedCoursesDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
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

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.search-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
