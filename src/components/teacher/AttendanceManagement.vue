<template>
  <div class="content-section">
    <div class="section-header">
      <h3>考勤列表</h3>
      <div class="header-actions">
        <el-button type="danger" size="small" v-if="selectedAttendances.length > 0" @click="$emit('batch-remove-attendances')">
          <el-icon><Delete /></el-icon>
          批量删除 ({{ selectedAttendances.length }})
        </el-button>
        <el-button type="primary" size="small" @click="$emit('show-add-attendance')">
          <el-icon><Plus /></el-icon>
          添加考勤
        </el-button>
      </div>
    </div>
    <div class="section-body">
      <div class="table-toolbar" v-if="attendances.length > 0">
        <el-input
          v-model="attendanceSearchKeyword"
          placeholder="搜索考勤日期或状态"
          prefix-icon="Search"
          clearable
          @clear="handleSearchClear"
          @input="handleSearchInput"
          style="width: 250px;"
        />
      </div>
      <div v-if="attendances.length === 0" class="empty-tip">
        暂无考勤记录，请点击"添加考勤"按钮添加
      </div>
      <div v-else class="attendance-list">
        <div v-for="attendance in filteredAttendances" :key="attendance.attendanceId" class="attendance-item">
          <el-checkbox v-model="attendance.selected" @change="handleAttendanceSelectionChange"></el-checkbox>
          <div class="attendance-content" @click="$emit('view-attendance-detail', attendance)">
            <div class="attendance-header">
              <h4>{{ formatDate(attendance.attendanceDate) }} 考勤</h4>
              <el-tag :type="getAttendanceStatusType(attendance.status)">{{ attendance.status }}</el-tag>
            </div>
            <div class="attendance-info">
              <p>出勤人数: {{ getAttendanceStats(attendance).present }} / {{ courseStudents.length }}</p>
              <p>缺勤人数: {{ getAttendanceStats(attendance).absent }}</p>
              <p>迟到人数: {{ getAttendanceStats(attendance).late }}</p>
            </div>
            <div class="attendance-actions">
              <el-button link type="primary" @click.stop="$emit('edit-attendance', attendance)">编辑</el-button>
              <el-button link type="danger" @click.stop="$emit('remove-attendance', attendance)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
      <div class="pagination-container" v-if="attendances.length > pageSize">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          @update:current-page="$emit('update:current-page', $event)"
          @update:page-size="$emit('update:page-size', $event)"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredAttendances.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/examManager'

const props = defineProps({
  attendances: {
    type: Array,
    required: true
  },
  selectedAttendances: {
    type: Array,
    required: true
  },
  courseStudents: {
    type: Array,
    required: true
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits([
  'batch-remove-attendances',
  'show-add-attendance',
  'view-attendance-detail',
  'edit-attendance',
  'remove-attendance',
  'selection-change',
  'search-clear',
  'search-input',
  'update:current-page',
  'update:page-size'
])

const attendanceSearchKeyword = ref('')

// 过滤考勤列表
const filteredAttendances = computed(() => {
  if (!attendanceSearchKeyword.value) {
    return props.attendances
  }
  const keyword = attendanceSearchKeyword.value.toLowerCase()
  return props.attendances.filter(attendance => 
    (attendance.attendanceDate && attendance.attendanceDate.toLowerCase().includes(keyword)) ||
    (attendance.status && attendance.status.toLowerCase().includes(keyword))
  )
})

// 格式化日期
function formatDate(dateString) {
  return formatDateTime(dateString);
}

// 获取考勤状态类型
function getAttendanceStatusType(status) {
  switch(status) {
    case '进行中':
      return 'warning'
    case '已结束':
      return 'success'
    default:
      return 'info'
  }
}

// 获取考勤统计信息
function getAttendanceStats(attendance) {
  // 默认统计数据
  const stats = {
    present: 0,
    absent: 0,
    late: 0
  }
  
  // 如果有学生考勤记录，则统计
  if (attendance.attendanceRecords && Array.isArray(attendance.attendanceRecords)) {
    attendance.attendanceRecords.forEach(record => {
      if (record.attendanceStatus === '出勤') {
        stats.present++
      } else if (record.attendanceStatus === '缺勤') {
        stats.absent++
      } else if (record.attendanceStatus === '迟到') {
        stats.late++
      }
    })
  }
  
  return stats
}

// 处理考勤选择变化
function handleAttendanceSelectionChange() {
  // 筛选出被选中的考勤记录
  const selected = props.attendances.filter(attendance => attendance.selected)
  emit('selection-change', selected)
}

// 处理搜索输入
function handleSearchInput() {
  emit('search-input')
}

// 处理搜索清除
function handleSearchClear() {
  attendanceSearchKeyword.value = ''
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

.header-actions {
  display: flex;
  gap: 10px;
}

.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attendance-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attendance-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  transition: all 0.3s;
  cursor: pointer;
}

.attendance-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.attendance-content {
  flex-grow: 1;
  margin-left: 12px;
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.attendance-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.attendance-info {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.attendance-info p {
  margin: 4px 0;
}

.attendance-actions {
  display: flex;
  justify-content: flex-end;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 