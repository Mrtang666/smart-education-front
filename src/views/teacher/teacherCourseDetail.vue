<template>
  <div class="course-detail">
    <div class="course-header" :style="{ backgroundColor: courseColor }">
      <div class="back-button" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </div>
      <h1 class="course-title">{{ courseName }}</h1>
      <div class="course-actions">
        <el-button type="primary" plain>
          <el-icon><Edit /></el-icon>
          编辑课程
        </el-button>
      </div>
    </div>

    <div class="course-content">
      <div class="course-tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="课程内容" name="content">
            <div class="content-section">
              <div class="section-header">
                <h3>课程介绍</h3>
              </div>
              <div class="section-body">
                <p>{{ courseDescription || '暂无课程介绍' }}</p>
              </div>
            </div>

            <div class="content-section">
              <div class="section-header">
                <h3>课程资料</h3>
                <el-button type="primary" size="small">
                  <el-icon><Plus /></el-icon>
                  上传资料
                </el-button>
              </div>
              <div class="section-body">
                <div v-if="materials.length === 0" class="empty-tip">
                  暂无课程资料
                </div>
                <div v-else class="materials-list">
                  <div v-for="material in materials" :key="material.id" class="material-item">
                    <el-icon><Document /></el-icon>
                    <span class="material-name">{{ material.name }}</span>
                    <span class="material-size">{{ material.size }}</span>
                    <div class="material-actions">
                      <el-button link type="primary">下载</el-button>
                      <el-button link type="danger">删除</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="学生管理" name="students">
            <div class="content-section">
              <div class="section-header">
                <h3>学生列表</h3>
                <el-button type="primary" size="small">
                  <el-icon><Plus /></el-icon>
                  添加学生
                </el-button>
              </div>
              <div class="section-body">
                <div v-if="students.length === 0" class="empty-tip">
                  暂无学生
                </div>
                <el-table v-else :data="students" style="width: 100%">
                  <el-table-column prop="id" label="学号" width="120" />
                  <el-table-column prop="name" label="姓名" width="120" />
                  <el-table-column prop="gender" label="性别" width="80" />
                  <el-table-column prop="class" label="班级" />
                  <el-table-column label="操作">
                    <template #default="scope">
                      <el-button link type="primary" @click="viewStudent(scope.row)">查看</el-button>
                      <el-button link type="danger" @click="removeStudent(scope.row)">移除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="作业管理" name="homework">
            <div class="content-section">
              <div class="section-header">
                <h3>作业列表</h3>
                <el-button type="primary" size="small">
                  <el-icon><Plus /></el-icon>
                  创建作业
                </el-button>
              </div>
              <div class="section-body">
                <div v-if="homeworks.length === 0" class="empty-tip">
                  暂无作业
                </div>
                <div v-else class="homework-list">
                  <div v-for="homework in homeworks" :key="homework.id" class="homework-item">
                    <div class="homework-info">
                      <h4>{{ homework.title }}</h4>
                      <p>截止日期: {{ homework.deadline }}</p>
                      <p>提交率: {{ homework.submitRate }}</p>
                    </div>
                    <div class="homework-actions">
                      <el-button link type="primary">查看</el-button>
                      <el-button link type="danger">删除</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, Plus, Document } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const courseId = route.params.id

// 课程信息
const courseName = ref('加载中...')
const courseDescription = ref('')
const courseColor = ref('#409EFF')

// 当前激活的标签页
const activeTab = ref('content')

// 课程资料
const materials = ref([])

// 学生列表
const students = ref([])

// 作业列表
const homeworks = ref([])

// 获取课程信息
onMounted(() => {
  // 实际应该从API获取课程信息
  // 这里模拟API调用
  setTimeout(() => {
    console.log('加载课程ID:', courseId)
    courseName.value = '高等数学'
    courseDescription.value = '本课程主要讲授高等数学的基础知识，包括函数、极限、微积分等内容。'
    courseColor.value = '#409EFF'
    
    // 模拟课程资料
    materials.value = [
      { id: 1, name: '第一章 函数与极限.pdf', size: '2.5MB' },
      { id: 2, name: '第二章 导数与微分.pptx', size: '1.8MB' },
    ]
    
    // 模拟学生列表
    students.value = [
      { id: '2021001', name: '张三', gender: '男', class: '计算机科学与技术1班' },
      { id: '2021002', name: '李四', gender: '女', class: '计算机科学与技术1班' },
    ]
    
    // 模拟作业列表
    homeworks.value = [
      { id: 1, title: '第一章习题', deadline: '2023-06-01', submitRate: '85%' },
      { id: 2, title: '第二章习题', deadline: '2023-06-15', submitRate: '70%' },
    ]
  }, 500)
})

// 返回上一页
function goBack() {
  router.push('/teacher/course')
}

// 查看学生
function viewStudent(student) {
  ElMessage.success(`查看学生: ${student.name}`)
}

// 移除学生
function removeStudent(student) {
  ElMessage.warning(`移除学生: ${student.name}`)
}
</script>

<style scoped>
.course-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.course-header {
  padding: 24px 32px;
  color: white;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: absolute;
  left: 32px;
  top: 24px;
}

.back-button:hover {
  opacity: 0.8;
}

.course-title {
  font-size: 24px;
  font-weight: 500;
  margin: 0 auto;
}

.course-content {
  flex: 1;
  padding: 24px 32px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.course-tabs {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.content-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.empty-tip {
  color: #909399;
  text-align: center;
  padding: 32px 0;
}

.materials-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.material-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.material-item:last-child {
  border-bottom: none;
}

.material-name {
  flex: 1;
  margin-left: 12px;
}

.material-size {
  color: #909399;
  margin-right: 16px;
}

.homework-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.homework-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
}

.homework-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.homework-info p {
  margin: 4px 0;
  color: #606266;
  font-size: 14px;
}
</style> 