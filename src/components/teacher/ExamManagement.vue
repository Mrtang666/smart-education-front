<template>
  <div class="content-section">
    <div class="section-header">
      <h3>考试列表</h3>
      <el-button type="primary" size="small" @click="$emit('show-add-exam')">
        <el-icon><Plus /></el-icon>
        创建考试
      </el-button>
    </div>
    <div class="section-body">
      <div class="table-toolbar" v-if="exams.length > 0">
        <el-input
          v-model="examSearchKeyword"
          placeholder="搜索考试标题或描述"
          prefix-icon="Search"
          clearable
          @clear="handleSearchClear"
          @input="handleSearchInput"
          style="width: 250px;"
        />
      </div>
      <div v-if="exams.length === 0" class="empty-tip">
        暂无考试，请点击"创建考试"按钮添加
      </div>
      <el-table
        v-else
        :data="filteredExams"
        style="width: 100%"
        v-loading="isLoading"
      >
        <el-table-column prop="title" label="考试标题" min-width="180" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="totalScore" label="总分" width="80" />
        <el-table-column prop="durationMinutes" label="时长(分钟)" width="120" />
        <el-table-column label="考试时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.startTime) }} 至 {{ formatDate(scope.row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getExamStatusType(scope.row.status, scope.row, currentTime)">{{ getExamStatus(scope.row, currentTime) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="$emit('view-exam-scores', scope.row)">查看成绩</el-button>
            <el-button link type="primary" @click="$emit('edit-exam', scope.row)">编辑</el-button>
            <el-button link type="danger" @click="$emit('remove-exam', scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-if="exams.length > pageSize">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          @update:current-page="$emit('update:current-page', $event)"
          @update:page-size="$emit('update:page-size', $event)"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredExams.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { getExamStatusType, getExamStatus } from '@/utils/examManager'
import { formatDateTime } from '@/utils/examManager'

const props = defineProps({
  exams: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  currentTime: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'show-add-exam',
  'view-exam-scores',
  'edit-exam',
  'remove-exam',
  'search-clear',
  'search-input',
  'update:current-page',
  'update:page-size'
])

const examSearchKeyword = ref('')

// 过滤考试列表
const filteredExams = computed(() => {
  if (!examSearchKeyword.value) {
    return props.exams
  }
  const keyword = examSearchKeyword.value.toLowerCase()
  return props.exams.filter(exam => 
    (exam.title && exam.title.toLowerCase().includes(keyword)) ||
    (exam.description && exam.description.toLowerCase().includes(keyword))
  )
})

// 格式化日期
function formatDate(dateString) {
  return formatDateTime(dateString);
}

// 处理考试搜索输入
function handleSearchInput() {
  emit('search-input')
}

// 处理考试搜索清除
function handleSearchClear() {
  examSearchKeyword.value = ''
  emit('search-clear')
}
</script>

<style scoped>
.content-section {
  margin-bottom: 40px;
  text-align: left;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-left: 4px solid #409EFF;
  padding-left: 15px;
  text-align: left;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  text-align: left;
}

.section-body {
  padding-left: 19px;
  text-align: left;
}

.empty-tip {
  color: #909399;
  text-align: left;
  padding: 20px 0;
  font-size: 14px;
}

.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 