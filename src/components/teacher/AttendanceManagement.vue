<template>
  <div class="content-section">
    <div class="section-header">
      <h3>考勤列表</h3>
      <div class="header-actions">
        <el-button type="danger" size="small" v-if="selectedAttendances.length > 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除 ({{ selectedAttendances.length }})
        </el-button>
        <el-button type="primary" size="small" @click="showAddAttendanceDialog">
          <el-icon><Plus /></el-icon>
          发布考勤
        </el-button>
      </div>
    </div>
    <div class="section-body">
      <div class="table-toolbar" v-if="attendanceGroups.length > 0">
        <div class="filter-container">
          <el-select
            v-model="attendanceStatusFilter"
            placeholder="选择考勤状态"
            clearable
            @change="handleStatusFilterChange"
            @clear="clearStatusFilter"
            style="width: 150px; margin-right: 10px;"
          >
            <el-option label="全部" value=""></el-option>
            <el-option label="进行中" value="进行中"></el-option>
            <el-option label="已结束" value="已结束"></el-option>
            
          </el-select>
          
          <el-date-picker
            v-model="attendanceDateFilter"
            type="date"
            placeholder="选择考勤日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleDateFilterChange"
            @clear="clearDateFilter"
            style="width: 180px;"
          />
        </div>
      </div>
      <div v-if="attendanceGroups.length === 0" class="empty-tip">
        暂无考勤记录，请点击"发布考勤"按钮添加
      </div>
      <div v-else class="attendance-list">
        <div v-for="group in filteredAttendanceGroups" :key="group.key" class="attendance-item">
          <el-checkbox v-model="group.selected" @change="handleGroupSelectionChange(group)"></el-checkbox>
          <div class="attendance-content" @click="viewGroupDetail(group)">
            <div class="attendance-header">
              <h4>{{ formatDate(group.attendanceDate) }} {{ group.courseName }} 考勤</h4>
              <el-tag :type="getAttendanceStatusType(group.status)">{{ group.status }}</el-tag>
            </div>
            <div class="attendance-info">
              <p>出勤人数: {{ group.stats.present }} / {{ group.totalStudents }}</p>
              <p>缺勤人数: {{ group.stats.absent }}</p>
              <p>迟到人数: {{ group.stats.late }}</p>
              <p v-if="group.remark"><el-icon><InfoFilled /></el-icon> 备注: {{ group.remark }}</p>
            </div>
            <div class="attendance-actions">
              <el-button link type="primary" @click.stop="editAttendanceGroup(group)">编辑</el-button>
              <el-button link type="danger" @click.stop="removeAttendanceGroup(group)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
      <div class="pagination-container" v-if="attendanceGroups.length > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredAttendanceGroups.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import { Plus, Delete, InfoFilled } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/examManager'
import { ElMessageBox } from 'element-plus'

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
  courses: {
    type: Array,
    required: true
  }
})

// 添加调试日志
console.log('AttendanceManagement组件接收到的考勤数据:', props.attendances)
console.log('AttendanceManagement组件接收到的学生数据:', props.courseStudents)

const emit = defineEmits([
  'batch-remove-attendances',
  'add-attendance',
  'update-attendance',
  'view-attendance-detail',
  'edit-attendance',
  'remove-attendance',
  'selection-change',
  'search-clear',
  'search-input',
  'show-add-attendance-dialog'
])

const currentPage = ref(1)
const pageSize = ref(10)
const attendanceStatusFilter = ref('')
const attendanceDateFilter = ref('')

// 将考勤记录按课程和日期分组
const attendanceGroups = computed(() => {
  if (!props.attendances || props.attendances.length === 0) {
    console.log('没有考勤数据可分组')
    return []
  }
  
  console.log('开始分组考勤数据:', props.attendances.length, '条记录')
  const groups = {}
  
  props.attendances.forEach(attendance => {
    // 确保考勤记录有必要的字段
    if (!attendance.courseId || !attendance.attendanceDate) {
      console.warn('发现无效考勤记录:', attendance)
      return
    }
    
    // 生成分组键：courseId_date
    const key = `${attendance.courseId}_${attendance.attendanceDate}`
    
    if (!groups[key]) {
      groups[key] = {
        key,
        courseId: attendance.courseId,
        courseName: attendance.courseName || '未知课程',
        attendanceDate: attendance.attendanceDate,
        status: attendance.status || '', // 设置状态默认值为空字符串
        remark: attendance.remark || '',
        attendances: [],
        selected: false,
        stats: {
          present: 0,
          absent: 0,
          late: 0
        },
        totalStudents: 0
      }
    }
    
    // 添加到分组
    groups[key].attendances.push(attendance)
    
    // 更新统计数据 - 根据学生的考勤属性来计算，而不是根据状态
    // 这里假设每个考勤记录有一个attendanceResult属性表示学生的出勤结果
    if (attendance.attendanceResult === '出勤') {
      groups[key].stats.present++
    } else if (attendance.attendanceResult === '缺勤') {
      groups[key].stats.absent++
    } else if (attendance.attendanceResult === '迟到') {
      groups[key].stats.late++
    } else {
      // 默认计入出勤
      groups[key].stats.present++
    }
    
    // 更新总学生数
    groups[key].totalStudents = groups[key].attendances.length
    
    // 如果有任何一个考勤被选中，则分组也被选中
    if (attendance.selected) {
      groups[key].selected = true
    }
    
    // 更新组的状态 - 如果任何一个考勤记录是"已结束"状态，则整个组也是"已结束"
    if (attendance.status === '已结束') {
      groups[key].status = '已结束'
    }
  })
  
  const result = Object.values(groups)
  console.log('考勤分组结果:', result.length, '个分组')
  return result
})

// 过滤考勤分组
const filteredAttendanceGroups = computed(() => {
  if (!attendanceStatusFilter.value && !attendanceDateFilter.value) {
    return attendanceGroups.value
  }
  
  return attendanceGroups.value.filter(group => {
    // 状态筛选
    const statusMatch = !attendanceStatusFilter.value || group.status === attendanceStatusFilter.value
    
    // 日期筛选
    const dateMatch = !attendanceDateFilter.value || 
      (group.attendanceDate && group.attendanceDate.includes(attendanceDateFilter.value))
    
    // 同时满足状态和日期筛选条件
    return statusMatch && dateMatch
  })
})

// 格式化日期
function formatDate(dateString) {
  return formatDateTime(dateString)
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

// 处理分组选择变化
function handleGroupSelectionChange(group) {
  // 更新组内所有考勤的选择状态
  group.attendances.forEach(attendance => {
    attendance.selected = group.selected
  })
  
  // 更新选中的考勤列表
  const selected = props.attendances.filter(attendance => attendance.selected)
  emit('selection-change', selected)
}

// 批量删除
function handleBatchDelete() {
  ElMessageBox.confirm('确定要删除选中的考勤记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('batch-remove-attendances')
  }).catch(() => {})
}

// 编辑考勤分组
function editAttendanceGroup(group) {
  // 在调用父组件的编辑方法之前，确保状态已更新
  saveAttendanceGroupStatus(group)
  emit('edit-attendance', group)
}

// 添加新方法：保存考勤组状态
async function saveAttendanceGroupStatus(group) {
  try {
    // 遍历组内所有考勤记录，更新状态
    for (const attendance of group.attendances) {
      // 发出更新事件，由父组件处理API调用
      emit('update-attendance', {
        attendanceId: attendance.attendanceId,
        status: group.status || '', // 使用组的状态，默认为空字符串
        remark: group.remark || ''
      })
    }
    console.log('考勤组状态已保存:', group.key)
  } catch (error) {
    console.error('保存考勤组状态失败:', error)
  }
}

// 查看分组详情
function viewGroupDetail(group) {
  // 在查看详情前，确保状态已更新
  saveAttendanceGroupStatus(group)
  emit('view-attendance-detail', group)
}

// 删除考勤分组
function removeAttendanceGroup(group) {
  ElMessageBox.confirm('确定要删除此考勤记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 删除组内所有考勤
    group.attendances.forEach(attendance => {
      emit('remove-attendance', attendance)
    })
  }).catch(() => {})
}

// 显示添加考勤对话框
function showAddAttendanceDialog() {
  // 发出事件通知父组件，由父组件显示模态框
  emit('show-add-attendance-dialog')
}

// 处理状态过滤
function handleStatusFilterChange() {
  emit('search-input')
}

// 清除状态过滤器
function clearStatusFilter() {
  attendanceStatusFilter.value = ''
  emit('search-clear')
}

// 处理日期过滤
function handleDateFilterChange() {
  emit('search-input')
}

// 清除日期过滤器
function clearDateFilter() {
  attendanceDateFilter.value = ''
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

.filter-container {
  display: flex;
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