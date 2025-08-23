<template>
  <div class="knowledge-manage">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">知识库管理</h2>
        <!-- <p class="page-subtitle">管理系统知识点与题目关联关系</p> -->
      </div>
      <div class="header-actions">
        <el-button 
          type="warning" 
          :disabled="selectedRows.length === 0"
          @click="batchUpdateStatus(0)"
          size="large"
        >
          <el-icon><Lock /></el-icon>
          批量禁用
        </el-button>
        <el-button 
          type="success" 
          :disabled="selectedRows.length === 0"
          @click="batchUpdateStatus(1)"
          size="large"
        >
          <el-icon><Unlock /></el-icon>
          批量启用
        </el-button>
        <el-button type="primary" @click="showAddDialog" size="large">
          <el-icon><Plus /></el-icon>
          添加知识点
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <div class="search-content">
        <div class="search-group">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索知识点名称或描述"
            style="width: 300px;"
            clearable
            @input="handleSearch"
            size="large"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-input
            v-model="subjectFilter"
            placeholder="输入学科名称筛选"
            style="width: 200px;"
            clearable
            @keyup.enter="searchBySubject"
            size="large"
          >
            <template #prefix>
              <el-icon><Collection /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="search-actions">
          <el-button type="primary" @click="searchBySubject" :loading="subjectLoading" size="large">
            <el-icon><Search /></el-icon>
            按学科筛选
          </el-button>
          
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
              <el-icon><Document /></el-icon>
              <span>知识点列表</span>
            </div>
            <div class="table-info">
              <el-tag type="info" size="large">
                共 {{ total }} 条记录
              </el-tag>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="knowledgeList" 
          style="width: 100%" 
          v-loading="loading"
          @selection-change="handleSelectionChange"
          border
          stripe
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          :cell-style="{ padding: '12px 0' }"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" width="80" align="center">
            <template #default="scope">
              {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="name" label="知识点名称" min-width="200" />
          <el-table-column prop="subject" label="所属学科" width="120" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getStateType(scope.row.status)" size="large">
                {{ getStateText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="320" fixed="right" align="center">
            <template #default="scope">
              <div class="action-buttons">
                <div class="action-row">
                  <el-button size="small" @click="editKnowledge(scope.row)" type="primary">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button 
                    size="small" 
                    :type="scope.row.status === 1 ? 'warning' : 'success'"
                    @click="toggleStatus(scope.row)"
                  >
                    <el-icon><Setting /></el-icon>
                    {{ scope.row.status === 1 ? '禁用' : '启用' }}
                  </el-button>
                  <el-button size="small" type="primary" @click="showAddRelationDialog(scope.row)">
                    <el-icon><Link /></el-icon>
                    添加关系
                  </el-button>
                </div>
                <div class="action-row">
                  <el-button size="small" type="info" @click="showViewRelationDialog(scope.row)">
                    <el-icon><View /></el-icon>
                    查看关系
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteKnowledge(scope.row)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
        :pager-count="7"
      />
    </div>

    <!-- 添加/编辑知识点对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑知识点' : '添加知识点'"
      width="600px"
      :close-on-click-modal="false"
      class="knowledge-dialog"
    >
      <el-form :model="knowledgeForm" :rules="formRules" ref="knowledgeFormRef" label-width="100px">
        <el-form-item label="知识点名称" prop="name">
          <el-input v-model="knowledgeForm.name" placeholder="请输入知识点名称" size="large" />
        </el-form-item>
        
        <el-form-item label="所属学科" prop="subject">
          <el-input v-model="knowledgeForm.subject" placeholder="请输入所属学科" size="large" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="knowledgeForm.status" size="large">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="saveKnowledge" :loading="saving" size="large">
            {{ isEdit ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加题目关系对话框 -->
    <el-dialog 
      v-model="relationDialogVisible" 
      title="添加题目关系"
      width="600px"
      :close-on-click-modal="false"
      class="relation-dialog"
    >
      <el-form :model="relationForm" :rules="relationRules" ref="relationFormRef" label-width="120px">
        <el-form-item label="知识点名称">
          <el-input v-model="currentKnowledgeUnit.name" disabled size="large" />
        </el-form-item>
        
        <el-form-item label="题目ID列表" prop="problemIds">
          <el-input 
            v-model="relationForm.problemIds" 
            type="textarea" 
            :rows="4"
            placeholder="请输入题目ID，多个ID用逗号分隔，例如：123,456,789"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="说明">
          <div class="form-help">
            <el-icon><InfoFilled /></el-icon>
            <span>请输入要关联的题目ID，多个ID之间用逗号分隔。题目ID可以从题库管理页面获取。</span>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="relationDialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="saveRelation" :loading="relationSaving" size="large">
            添加关系
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看题目关系对话框 -->
    <el-dialog 
      v-model="viewRelationDialogVisible" 
      title="查看题目关系"
      width="600px"
      :close-on-click-modal="false"
      class="view-relation-dialog"
    >
      <div v-if="currentKnowledgeUnit.name" class="relation-detail">
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Document /></el-icon>
            <span>知识点名称：</span>
          </div>
          <div class="detail-value">{{ currentKnowledgeUnit.name }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Collection /></el-icon>
            <span>所属学科：</span>
          </div>
          <div class="detail-value">{{ currentKnowledgeUnit.subject }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Link /></el-icon>
            <span>关联题目数量：</span>
          </div>
          <div class="detail-value">
            <el-tag type="primary" size="large">{{ relatedProblemIds.length }}</el-tag>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><List /></el-icon>
            <span>关联题目ID列表：</span>
          </div>
          <div class="detail-value">
            <div v-if="relatedProblemIds.length > 0" class="problem-ids-list">
              <el-tag 
                v-for="problemId in relatedProblemIds" 
                :key="problemId"
                type="success"
                size="large"
                closable
                @close="deleteSingleRelation(problemId)"
                class="problem-tag"
              >
                {{ problemId }}
              </el-tag>
            </div>
            <div v-else class="no-data">
              <el-empty description="暂无关联题目" />
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewRelationDialogVisible = false" size="large">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, Collection, Lock, Unlock, Edit, 
  Setting, Link, View, Delete, Document, InfoFilled, 
  Refresh, List 
} from '@element-plus/icons-vue'
import { knowledgeUnitController, problemKnowledgeUnit } from '@/api/apiLearning'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const searchKeyword = ref('')
const subjectFilter = ref('')
const subjectLoading = ref(false)
const knowledgeFormRef = ref()

// 题目关系相关数据
const relationDialogVisible = ref(false)
const relationSaving = ref(false)
const relationFormRef = ref()
const currentKnowledgeUnit = ref({})

// 查看关系相关数据
const viewRelationDialogVisible = ref(false)
const relatedProblemIds = ref([])

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 知识单元数据
const knowledgeList = ref([])
// 选中的行数据
const selectedRows = ref([])



const knowledgeForm = reactive({
  id: null,
  name: '',
  subject: '',
  status: 1
})

const relationForm = reactive({
  problemIds: ''
})

const formRules = {
  name: [
    { required: true, message: '请输入知识点名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请输入所属学科', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

const relationRules = {
  problemIds: [
    { required: true, message: '请输入题目ID列表', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!value.trim()) {
          callback(new Error('请输入题目ID列表'))
          return
        }
        
        // 验证ID格式：数字和逗号
        const idPattern = /^[\d,\s]+$/
        if (!idPattern.test(value)) {
          callback(new Error('题目ID只能包含数字和逗号'))
          return
        }
        
        // 验证是否有有效的ID
        const ids = value.split(',').map(id => id.trim()).filter(id => id)
        if (ids.length === 0) {
          callback(new Error('请至少输入一个有效的题目ID'))
          return
        }
        
        callback()
      },
      trigger: 'blur'
    }
  ]
}

// 分页处理函数
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1 // 重置到第一页
  if (subjectFilter.value.trim()) {
    // 如果当前是按学科筛选状态，重新执行学科筛选
    searchBySubject()
  } else {
    loadKnowledgeUnits()
  }
}

const deleteSingleRelation = async (problemId) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除该知识点与题目ID ${problemId} 的关系吗？`,
      '删除关系确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await problemKnowledgeUnit.deleteRelation(problemId, currentKnowledgeUnit.value.id)
    ElMessage.success('关系删除成功')

    // 从本地列表中移除
    relatedProblemIds.value = relatedProblemIds.value.filter(id => id !== problemId)
  } catch (error) {
    if (error.message !== 'cancel') {
      console.error('删除指定关系失败:', error);
    }
  }
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  if (subjectFilter.value.trim()) {
    // 如果当前是按学科筛选状态，重新执行学科筛选
    searchBySubject()
  } else {
    loadKnowledgeUnits()
  }
}

// 方法
const getStateType = (state) => {
  switch (state) {
    case 1: return 'success'
    case 0: return 'danger'
    default: return 'info'
  }
}

const getStateText = (state) => {
  switch (state) {
    case 1: return '启用'
    case 0: return '禁用'
    default: return '未知'
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const handleSearch = async () => {
  currentPage.value = 1 // 搜索时重置到第一页
  await loadKnowledgeUnits()
}

const resetSearch = async () => {
  searchKeyword.value = ''
  subjectFilter.value = ''
  selectedRows.value = [] // 清空选择
  currentPage.value = 1 // 重置时回到第一页
  await loadKnowledgeUnits()
}

const searchBySubject = async () => {
  if (!subjectFilter.value.trim()) {
    ElMessage.warning('请输入学科名称')
    return
  }
  
  try {
    subjectLoading.value = true
    currentPage.value = 1 // 重置到第一页
    
    // 调用getAllBySubject接口
    const data = await knowledgeUnitController.getAllBySubject(subjectFilter.value.trim())
    
    // 处理返回的数据
    if (Array.isArray(data)) {
      // 如果返回的是数组，进行前端分页
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      knowledgeList.value = data.slice(startIndex, endIndex)
      total.value = data.length
    } else {
      knowledgeList.value = []
      total.value = 0
    }
    
    console.log('按学科筛选的数据:', data)
    console.log('处理后的数据:', knowledgeList.value)
    
    if (knowledgeList.value.length === 0) {
      ElMessage.info(`未找到学科"${subjectFilter.value}"的知识点`)
    } else {
      ElMessage.success(`找到 ${total.value} 个知识点`)
    }
  } catch (error) {
    console.error('按学科筛选失败:', error)
  } finally {
    subjectLoading.value = false
  }
}

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量更新状态
const batchUpdateStatus = async (status) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要操作的知识点')
    return
  }
  
  const statusText = status === 1 ? '启用' : '禁用'
  const selectedIds = selectedRows.value.map(row => row.id)
  
  try {
    await ElMessageBox.confirm(
      `确定要${statusText}选中的 ${selectedRows.value.length} 个知识点吗？`,
      `批量${statusText}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用批量更新状态API
    await knowledgeUnitController.batchUpdateStatus(status, selectedIds)
    ElMessage.success(`批量${statusText}成功`)
    
    // 清空选择
    selectedRows.value = []
    
    // 重新加载当前页数据
    if (subjectFilter.value.trim()) {
      await searchBySubject()
    } else {
      await loadKnowledgeUnits()
    }
  } catch (error) {
    if (error.message !== 'cancel') {
      console.error('批量更新状态失败:', error)
    }
  }
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const showAddRelationDialog = (row) => {
  currentKnowledgeUnit.value = { ...row }
  relationForm.problemIds = ''
  relationDialogVisible.value = true
}

const showViewRelationDialog = async (row) => {
  currentKnowledgeUnit.value = { ...row }
  viewRelationDialogVisible.value = true
  
  try {
    // 调用API获取关联的题目ID
    const data = await problemKnowledgeUnit.getProblemIdByKnowledgeUnitId(row.id)
    console.log('获取到的关联题目ID:', data)
    
    // 处理返回的数据
    if (Array.isArray(data)) {
      relatedProblemIds.value = data
    } else if (data && Array.isArray(data.problemIds)) {
      relatedProblemIds.value = data.problemIds
    } else {
      relatedProblemIds.value = []
    }
  } catch (error) {
    console.error('获取关联题目ID失败:', error)
    relatedProblemIds.value = []
  }
}

const editKnowledge = (row) => {
  isEdit.value = true
  Object.assign(knowledgeForm, row)
  dialogVisible.value = true
}

const deleteKnowledge = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除知识点"${row.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除API
    await knowledgeUnitController.batchDelete([row.id])
    ElMessage.success('删除成功')
    
    // 重新加载当前页数据
    await loadKnowledgeUnits()
  } catch (error) {
    if (error.message !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  }
}

const toggleStatus = async (row) => {
  try {
    const newStatus = row.status === 1 ? 0 : 1
    const actionText = newStatus === 1 ? '启用' : '禁用'
    
    await ElMessageBox.confirm(
      `确定要${actionText}知识点"${row.name}"吗？`,
      `${actionText}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用批量更新状态API
    await knowledgeUnitController.batchUpdateStatus(newStatus, [row.id])
    ElMessage.success(`${actionText}成功`)
    
    // 重新加载当前页数据
    await loadKnowledgeUnits()
  } catch (error) {
    if (error.message !== 'cancel') {
      console.error('状态更新失败:', error)
      ElMessage.error('状态更新失败，请重试')
    }
  }
}

const resetForm = () => {
  Object.assign(knowledgeForm, {
    id: null,
    name: '',
    subject: '',
    status: 1
  })
  if (knowledgeFormRef.value) {
    knowledgeFormRef.value.clearValidate()
  }
}

const saveKnowledge = async () => {
  if (!knowledgeFormRef.value) return
  
  try {
    await knowledgeFormRef.value.validate()
    saving.value = true
    
    if (isEdit.value) {
      // 编辑模式：先删除原数据，再添加新数据
      try {
        // 删除原数据
        await knowledgeUnitController.batchDelete([knowledgeForm.id])
        
        // 添加新数据（不包含id字段）
        const newData = {
          name: knowledgeForm.name,
          subject: knowledgeForm.subject,
          status: knowledgeForm.status
        }
        await knowledgeUnitController.add(newData)
        
        ElMessage.success('更新成功')
      } catch (error) {
        console.error('更新失败:', error)
        return
      }
    } else {
      // 添加模式
      try {
        await knowledgeUnitController.add(knowledgeForm)
        ElMessage.success('添加成功')
      } catch (error) {
        console.error('添加失败:', error)
        return
      }
    }
    
    // 重新加载当前页数据
    await loadKnowledgeUnits()
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

// 加载知识单元数据
const loadKnowledgeUnits = async () => {
  try {
    loading.value = true
    
    let data
    if (searchKeyword.value.trim()) {
      // 如果有搜索关键词，使用搜索API
      data = await knowledgeUnitController.search(searchKeyword.value.trim())
    } else {
      // 如果没有搜索关键词，使用空字符串搜索获取所有数据
      data = await knowledgeUnitController.search('')
    }
    
    // 处理返回的数据结构
    if (data && data.records) {
      // 如果返回的是分页数据结构
      knowledgeList.value = data.records || []
      total.value = data.total || 0
    } else if (Array.isArray(data)) {
      // 如果返回的是数组，进行前端分页
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      knowledgeList.value = data.slice(startIndex, endIndex)
      total.value = data.length
    } else {
      knowledgeList.value = []
      total.value = 0
    }
    
    console.log('加载的数据:', data)
    console.log('处理后的数据:', knowledgeList.value)
    
    // 调试：显示第一条数据的字段结构
    if (knowledgeList.value.length > 0) {
      console.log('第一条数据的字段结构:', Object.keys(knowledgeList.value[0]))
      console.log('第一条数据详情:', knowledgeList.value[0])
    }
  } catch (error) {
    console.error('加载知识单元数据失败:', error)
    ElMessage.error('加载数据失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

const saveRelation = async () => {
  if (!relationFormRef.value) return
  
  try {
    await relationFormRef.value.validate()
    relationSaving.value = true
    
    // 解析题目ID列表
    const problemIds = relationForm.problemIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id)
    
    // 构建关系数据
    const relationData = problemIds.map(problemId => ({
      problemId: problemId,
      knowledgeUnitId: currentKnowledgeUnit.value.id
    }))
    
    console.log('要添加的关系数据:', relationData)
    
    // 调用批量添加关系API
    await problemKnowledgeUnit.batchAdd(relationData)
    ElMessage.success(`成功添加 ${relationData.length} 个题目关系`)
    
    // 关闭对话框
    relationDialogVisible.value = false
    relationForm.problemIds = ''
    
  } catch (error) {
    console.error('添加题目关系失败:', error)
    ElMessage.error('添加题目关系失败，请重试')
  } finally {
    relationSaving.value = false
  }
}

 

onMounted(async () => {
  console.log('组件挂载，开始加载数据...')
  try {
    await loadKnowledgeUnits()
  } catch (error) {
    console.error('初始化数据加载失败:', error)
  }
})
</script>

<style scoped>
.knowledge-manage {
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
  align-items: flex-start;
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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
}

.table-section {
  margin-top: 20px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
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

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.action-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-row:last-child {
  justify-content: flex-end;
}

.action-row .el-button {
  min-width: 80px;
}

.relation-detail {
  padding: 20px;
}

.relation-detail .detail-item {
  margin-bottom: 15px;
}

.relation-detail .detail-item strong {
  display: inline-block;
  width: 120px;
  color: #303133;
}

.problem-ids-list {
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  background-color: #f5f7fa;
}

.no-data {
  margin-top: 10px;
  text-align: center;
}

.problem-tag {
  margin: 2px;
}

.form-help {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 12px;
}

.form-help .el-icon {
  font-size: 14px;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.detail-value {
  color: #606266;
  font-size: 14px;
}

.knowledge-dialog .el-dialog__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.knowledge-dialog .el-dialog__title {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.relation-dialog .el-dialog__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.relation-dialog .el-dialog__title {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.view-relation-dialog .el-dialog__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.view-relation-dialog .el-dialog__title {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}
</style>
