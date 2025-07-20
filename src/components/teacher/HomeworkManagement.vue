<template>
  <div class="content-section">
    <div class="section-header">
      <h3>作业列表</h3>
      <el-button type="primary" size="small" @click="$emit('show-add-homework')">
        <el-icon><Plus /></el-icon>
        创建作业
      </el-button>
    </div>
    <div class="section-body">
      <div class="table-toolbar" v-if="homeworks.length > 0">
        <el-input
          v-model="homeworkSearchKeyword"
          placeholder="搜索作业标题或描述"
          prefix-icon="Search"
          clearable
          @clear="handleSearchClear"
          @input="handleSearchInput"
          style="width: 250px;"
        />
      </div>
      <div v-if="homeworks.length === 0" class="empty-tip">
        暂无作业，请点击"创建作业"按钮添加
      </div>
      <el-table
        v-else
        :data="filteredHomeworks"
        style="width: 100%"
        border
        stripe
        :row-class-name="getHomeworkRowClass"
      >
        <el-table-column prop="title" label="作业标题" min-width="180">
          <template #default="scope">
            <div class="homework-title">
              {{ scope.row.title }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="时间设置" min-width="180">
          <template #default="scope">
            <div>
              <div>开始：{{ formatDate(scope.row.startTime) }}</div>
              <div>截止：{{ formatDate(scope.row.endTime) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="选项设置" min-width="180">
          <template #default="scope">
            <div>
              <el-tag size="small" type="info" v-if="scope.row.isAnswerPublic">答案公开</el-tag>
              <el-tag size="small" type="info" v-if="scope.row.isScoreVisible">分数可见</el-tag>
              <el-tag size="small" type="info" v-if="scope.row.isRedoAllowed">允许重做</el-tag>
              <div class="mt-5">最大尝试次数: {{ scope.row.maxAttempts || 1 }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提交情况" min-width="100">
          <template #default="scope">
            <div>
              <el-progress 
                :percentage="calculateSubmissionRate(scope.row)" 
                :status="getSubmissionStatus(scope.row)"
              />
              <div>提交率: {{ calculateSubmissionRate(scope.row) }}%</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <!-- 查看提交按钮 - 仅已发布和已结束的作业显示 -->
            <el-button
              size="small"
              @click="$emit('view-homework-submissions', scope.row)"
              v-if="scope.row.status !== 'DRAFT'"
            >
              查看提交
            </el-button>
            
            <!-- 发布按钮 - 仅草稿状态显示 -->
            <el-button
              size="small"
              type="success"
              @click="handlePublishHomework(scope.row)"
              v-if="scope.row.status === 'DRAFT'"
            >
              发布
            </el-button>
            
            <!-- 编辑按钮 - 所有状态都显示 -->
            <el-button
              size="small"
              type="primary"
              @click="$emit('edit-homework', scope.row)"
            >
              编辑
            </el-button>
            
            <!-- 删除按钮 - 所有状态都显示 -->
            <el-button
              size="small"
              type="danger"
              @click="handleRemoveHomework(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
// import { problemAPI } from '@/api/api'

// 错误处理
let resizeObserver = null

onMounted(() => {
  // 添加ResizeObserver错误处理
  const originalError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    if (message && message.includes('ResizeObserver loop completed with undelivered notifications')) {
      return true // 阻止错误显示
    }
    if (originalError) {
      return originalError.call(this, message, source, lineno, colno, error)
    }
    return false
  }
})

onUnmounted(() => {
  // 清理ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 定义props
const props = defineProps({
  homeworks: {
    type: Array,
    required: true
  }
})

// 定义emits
const emit = defineEmits([
  'show-add-homework',
  'edit-homework',
  'remove-homework',
  'view-homework-submissions',
  'publish-homework'  // 添加发布作业的事件
])
/* eslint-enable no-undef */

const homeworkSearchKeyword = ref('')

// 搜索过滤作业列表
const filteredHomeworks = computed(() => {
  if (!homeworkSearchKeyword.value) {
    return props.homeworks
  }
  
  const keyword = homeworkSearchKeyword.value.toLowerCase()
  return props.homeworks.filter(
    homework => 
      homework.title?.toLowerCase().includes(keyword) || 
      homework.description?.toLowerCase().includes(keyword)
  )
})

// 获取作业状态样式类型
function getStatusType(status) {
  const map = {
    'DRAFT': 'info',
    'PUBLISHED': 'success',
    'ENDED': 'warning'
  }
  return map[status] || 'info'
}

// 获取作业状态文本
function getStatusText(status) {
  const map = {
    'DRAFT': '草稿',
    'PUBLISHED': '已发布',
    'ENDED': '已结束'
  }
  return map[status] || '未知'
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '未设置'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return '日期格式错误'
  }
}

// 计算提交率
function calculateSubmissionRate(homework) {
  // 此处应该使用实际的提交人数和总人数
  // 目前使用模拟数据，实际应用时需要通过API获取
  return homework.submissionRate || 0
}

// 获取提交状态
function getSubmissionStatus(homework) {
  const rate = calculateSubmissionRate(homework)
  if (rate >= 80) return 'success'
  if (rate >= 50) return 'warning'
  return 'exception'
}

// 获取作业行样式
function getHomeworkRowClass(row) {
  if (row.row.status === 'ENDED') return 'homework-ended'
  if (new Date(row.row.endTime) < new Date()) return 'homework-overdue'
  return ''
}

// 处理搜索输入
function handleSearchInput() {
  // 这里可以添加延迟搜索逻辑
}

// 处理清除搜索
function handleSearchClear() {
  homeworkSearchKeyword.value = ''
}

// 处理删除作业
function handleRemoveHomework(homework) {
  if (confirm(`确定要删除作业"${homework.title}"吗？此操作不可撤销。`)) {
    emit('remove-homework', homework)
  }
}

// 处理发布作业
function handlePublishHomework(homework) {
  if (confirm(`确定要发布作业"${homework.title}"吗？发布后学生将能够看到此作业。`)) {
    // 创建一个作业副本并修改状态
    const updatedHomework = { ...homework, status: 'PUBLISHED' }
    emit('publish-homework', updatedHomework)
  }
}
</script>

<style scoped>
.content-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
}

.empty-tip {
  text-align: center;
  padding: 30px;
  color: #909399;
}

.table-toolbar {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}

.homework-title {
  font-weight: 500;
}

.mt-5 {
  margin-top: 5px;
}

:deep(.homework-ended) {
  background-color: #f5f7fa;
}

:deep(.homework-overdue) {
  background-color: #fef0f0;
}
</style> 