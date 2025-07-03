<template>
  <div class="content-section">
    <div class="section-header">
      <h3>学生列表</h3>
      <div class="header-actions">
        <el-button type="danger" size="small" v-if="selectedStudents.length > 0" @click="$emit('batch-remove-students')">
          <el-icon><Delete /></el-icon>
          批量删除 ({{ selectedStudents.length }})
        </el-button>
        <el-button type="primary" size="small" @click="$emit('show-add-student')">
          <el-icon><Plus /></el-icon>
          添加学生
        </el-button>
      </div>
    </div>
    <div class="section-body">
      <div class="table-toolbar" v-if="courseStudents.length > 0">
        <el-input
          v-model="studentSearchKeyword"
          placeholder="搜索学生姓名或学号"
          prefix-icon="Search"
          clearable
          @clear="handleSearchClear"
          @input="handleSearchInput"
          style="width: 250px;"
        />
      </div>
      <div v-if="courseStudents.length === 0" class="empty-tip">
        暂无学生，请点击"添加学生"按钮添加
      </div>
      <el-table
        v-else
        :data="filteredStudents"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        v-loading="isLoading"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="fullName" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="$emit('view-student', scope.row)">查看</el-button>
            <el-button link type="danger" @click="$emit('remove-student', scope.row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-if="courseStudents.length > pageSize">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          @update:current-page="$emit('update:current-page', $event)"
          @update:page-size="$emit('update:page-size', $event)"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredStudents.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  courseStudents: {
    type: Array,
    required: true
  },
  selectedStudents: {
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
  }
})

const emit = defineEmits([
  'batch-remove-students', 
  'show-add-student', 
  'view-student', 
  'remove-student',
  'selection-change',
  'search-clear',
  'search-input',
  'update:current-page',
  'update:page-size'
])

const studentSearchKeyword = ref('')

// 过滤学生列表
const filteredStudents = computed(() => {
  if (!studentSearchKeyword.value) {
    return props.courseStudents
  }
  const keyword = studentSearchKeyword.value.toLowerCase()
  return props.courseStudents.filter(student => 
    (student.studentId && student.studentId.toString().includes(keyword)) ||
    (student.fullName && student.fullName.toLowerCase().includes(keyword)) ||
    (student.email && student.email.toLowerCase().includes(keyword)) ||
    (student.className && student.className.toLowerCase().includes(keyword)) ||
    (student.grade && student.grade.toLowerCase().includes(keyword))
  )
})

// 处理搜索输入
function handleSearchInput() {
  emit('search-input')
}

// 处理清除搜索
function handleSearchClear() {
  studentSearchKeyword.value = ''
  emit('search-clear')
}

// 处理表格选择变化
function handleSelectionChange(selection) {
  emit('selection-change', selection)
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

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 