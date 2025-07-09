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
        v-loading="isLoading"
      >
        <el-table-column prop="title" label="作业标题" min-width="180" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="totalScore" label="总分" width="80" />
        <el-table-column label="截止日期" width="180">
          <template #default="scope">
            <div class="deadline-container">
              <div>{{ formatDate(scope.row.endTime) }}</div>
              <div v-if="getDeadlineCountdown(scope.row, currentTime)" class="countdown-text">
                {{ getDeadlineCountdown(scope.row, currentTime) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提交率" width="100">
          <template #default="scope">
            {{ scope.row.submitRate || '0%' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="getHomeworkStatusType(scope.row, currentTime)"
              :effect="getTagEffect(scope.row, currentTime)"
            >
              {{ getHomeworkStatus(scope.row, currentTime) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="$emit('view-homework-submissions', scope.row)">查看提交</el-button>
            <el-button link type="primary" @click="$emit('edit-homework', scope.row)" :disabled="isHomeworkExpired(scope.row, currentTime)">编辑</el-button>
            <el-button link type="danger" @click="$emit('remove-homework', scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-if="homeworks.length > pageSize">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          @update:current-page="$emit('update:current-page', $event)"
          @update:page-size="$emit('update:page-size', $event)"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredHomeworks.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/examManager'

const props = defineProps({
  homeworks: {
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
  'show-add-homework',
  'view-homework-submissions',
  'edit-homework',
  'remove-homework',
  'search-clear',
  'search-input',
  'update:current-page',
  'update:page-size'
])

const homeworkSearchKeyword = ref('')

// 过滤作业列表
const filteredHomeworks = computed(() => {
  if (!homeworkSearchKeyword.value) {
    return props.homeworks
  }
  const keyword = homeworkSearchKeyword.value.toLowerCase()
  return props.homeworks.filter(homework => 
    (homework.title && homework.title.toLowerCase().includes(keyword)) ||
    (homework.description && homework.description.toLowerCase().includes(keyword))
  )
})

// 格式化日期
function formatDate(dateString) {
  return formatDateTime(dateString);
}

// 获取作业状态类型
function getHomeworkStatusType(homework, now) {
  if (!homework.endTime) return 'info'; // 未设置截止日期
  
  const deadline = new Date(homework.endTime);
  
  if (now > deadline) {
    return 'danger'; // 已截止
  } else if (now > new Date(deadline.getTime() - 24 * 60 * 60 * 1000)) {
    return 'warning'; // 即将截止（24小时内）
  } else if (now > new Date(deadline.getTime() - 3 * 24 * 60 * 60 * 1000)) {
    return 'warning'; // 即将截止（3天内）
  } else {
    return 'success'; // 进行中
  }
}

// 获取标签效果
function getTagEffect(homework, now) {
  if (!homework.endTime) return 'plain';
  
  const deadline = new Date(homework.endTime);
  
  if (now > deadline) {
    return 'dark'; // 已截止，深色效果
  } else if (now > new Date(deadline.getTime() - 24 * 60 * 60 * 1000)) {
    return 'light'; // 即将截止（24小时内），浅色效果
  } else {
    return 'plain'; // 进行中，普通效果
  }
}

// 获取作业状态文本
function getHomeworkStatus(homework, now) {
  if (!homework.endTime) return '未设置截止日期';
  
  const deadline = new Date(homework.endTime);
  
  if (now > deadline) {
    return '已截止';
  } else if (now > new Date(deadline.getTime() - 24 * 60 * 60 * 1000)) {
    return '即将截止';
  } else {
    return '进行中';
  }
}

// 获取截止日期倒计时
function getDeadlineCountdown(homework, now) {
  if (!homework.endTime) return null;
  
  const deadline = new Date(homework.endTime);
  
  // 如果已经截止，不显示倒计时
  if (now > deadline) return null;
  
  // 计算剩余时间（毫秒）
  const timeRemaining = deadline.getTime() - now.getTime();
  
  // 转换为天、小时、分钟
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  // 根据剩余时间返回不同格式的倒计时
  if (days > 0) {
    return `剩余 ${days} 天 ${hours} 小时`;
  } else if (hours > 0) {
    return `剩余 ${hours} 小时 ${minutes} 分钟`;
  } else if (minutes > 0) {
    return `剩余 ${minutes} 分钟`;
  } else {
    return `即将截止`;
  }
}

// 判断作业是否已过期
function isHomeworkExpired(homework, now) {
  if (!homework.endTime) return false;
  
  const deadline = new Date(homework.endTime);
  return now > deadline;
}

// 处理作业搜索输入
function handleSearchInput() {
  emit('search-input')
}

// 处理作业搜索清除
function handleSearchClear() {
  homeworkSearchKeyword.value = ''
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

.deadline-container {
  display: flex;
  flex-direction: column;
}

.countdown-text {
  font-size: 12px;
  color: #F56C6C;
  margin-top: 4px;
}
</style> 