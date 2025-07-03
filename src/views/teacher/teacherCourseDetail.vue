<template>
  <div class="course-detail-container">
    <!-- 课程头部信息 -->
    <div class="course-header" :style="{ backgroundColor: courseColor }">
      <div class="back-button" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回课程列表
      </div>
      <div class="course-info">
        <h1>{{ courseName }}</h1>
        <div class="course-meta">
          <span class="course-category">{{ courseData.category || '未分类' }}</span>
          <span class="course-credit">{{ courseData.credit || 0 }} 学分</span>
        </div>
        <p class="course-description">{{ courseDescription }}</p>
      </div>
      <div class="course-actions">
        <el-button type="primary" @click="showEditCourseDialog">
          <el-icon><Edit /></el-icon>
          编辑课程
        </el-button>
      </div>
    </div>

    <!-- 课程导航栏 -->
    <div class="course-nav">
      <router-link :to="`/teacher/course/${courseId}/content`" custom v-slot="{ navigate, isActive }">
        <div class="nav-item" :class="{ active: isActive }" @click="navigate">
          课程内容
        </div>
      </router-link>
      <router-link :to="`/teacher/course/${courseId}/students`" custom v-slot="{ navigate, isActive }">
        <div class="nav-item" :class="{ active: isActive }" @click="navigate">
          学生管理
        </div>
      </router-link>
      <router-link :to="`/teacher/course/${courseId}/exams`" custom v-slot="{ navigate, isActive }">
        <div class="nav-item" :class="{ active: isActive }" @click="navigate">
          考试管理
        </div>
      </router-link>
      <router-link :to="`/teacher/course/${courseId}/assignments`" custom v-slot="{ navigate, isActive }">
        <div class="nav-item" :class="{ active: isActive }" @click="navigate">
          作业管理
        </div>
      </router-link>
      <router-link :to="`/teacher/course/${courseId}/attendance`" custom v-slot="{ navigate, isActive }">
        <div class="nav-item" :class="{ active: isActive }" @click="navigate">
          考勤管理
        </div>
      </router-link>
    </div>

    <!-- 子路由内容 -->
    <div class="course-content">
      <router-view 
        :course-id="courseId" 
        :course-data="courseData"
      ></router-view>
    </div>

    <!-- 编辑课程对话框 -->
    <el-dialog v-model="editCourseDialogVisible" title="编辑课程" width="600px">
      <el-form :model="editCourseForm" label-width="100px" ref="editCourseFormRef">
        <el-form-item label="课程名称" prop="name" :rules="[{ required: true, message: '请输入课程名称', trigger: 'blur' }]">
          <el-input v-model="editCourseForm.name" placeholder="请输入课程名称"></el-input>
        </el-form-item>
        <el-form-item label="课程分类" prop="category">
          <el-select v-model="editCourseForm.category" placeholder="请选择课程分类" style="width: 100%;">
            <el-option label="计算机科学" value="计算机科学"></el-option>
            <el-option label="数学" value="数学"></el-option>
            <el-option label="物理" value="物理"></el-option>
            <el-option label="化学" value="化学"></el-option>
            <el-option label="生物" value="生物"></el-option>
            <el-option label="AI通识" value="AI通识"></el-option>
            <el-option label="程序设计语言" value="程序设计语言"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="学分" prop="credit">
          <el-input-number v-model="editCourseForm.credit" :min="0" :max="10" :step="0.5"></el-input-number>
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input v-model="editCourseForm.description" type="textarea" rows="4" placeholder="请输入课程描述"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editCourseDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCourseEdit">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import { courseAPI } from '@/api/api'
import BigNumber from 'bignumber.js'

const route = useRoute()
const router = useRouter()

// 课程ID
const courseId = computed(() => route.params.id)

// 课程数据
const courseData = ref({})
const courseName = ref('加载中...')
const courseDescription = ref('正在加载课程信息...')
const courseColor = ref('#409EFF')

// 编辑课程对话框
const editCourseDialogVisible = ref(false)
const editCourseForm = ref({
  name: '',
  category: '',
  credit: 0,
  description: ''
})
const editCourseFormRef = ref(null)

// 获取课程信息
async function fetchCourseData() {
  try {
    const loadingInstance = ElLoading.service({
      target: '.course-detail-container',
      text: '加载课程信息...',
      background: 'rgba(255, 255, 255, 0.7)'
    })
    
    try {
      const response = await courseAPI.getCourseById(courseId.value)
      
      if (response) {
        courseData.value = response
        courseName.value = response.name || '未命名课程'
        courseDescription.value = response.description || '暂无课程介绍'
        
        // 设置课程颜色
        const categoryColors = {
          '计算机科学': '#409EFF',
          '数学': '#67C23A',
          '物理': '#E6A23C',
          '化学': '#F56C6C',
          '生物': '#909399',
          'AI通识': '#9B59B6',
          '程序设计语言': '#3498DB'
        }
        
        courseColor.value = categoryColors[response.category] || '#409EFF'
        
        // 初始化编辑表单
        editCourseForm.value = {
          name: response.name || '',
          category: response.category || '',
          credit: response.credit || 0,
          description: response.description || ''
        }
      } else {
        ElMessage.error('获取课程信息失败')
      }
    } catch (error) {
      console.error('获取课程信息失败:', error)
      ElMessage.error('获取课程信息失败，请稍后重试')
    } finally {
      loadingInstance.close()
    }
  } catch (error) {
    console.error('加载课程信息失败:', error)
  }
}

// 显示编辑课程对话框
function showEditCourseDialog() {
  editCourseDialogVisible.value = true
}

// 保存课程编辑
async function saveCourseEdit() {
  try {
    const updatedCourseData = {
      id: courseId.value ? new BigNumber(courseId.value).toString() : courseId.value.toString(),
      name: editCourseForm.value.name,
      category: editCourseForm.value.category,
      credit: editCourseForm.value.credit,
      description: editCourseForm.value.description
    }
    
    const response = await courseAPI.saveOrUpdateCourse(updatedCourseData)
    
    if (response) {
      ElMessage.success('课程更新成功')
      editCourseDialogVisible.value = false
      
      // 重新加载课程数据
      await fetchCourseData()
    } else {
      ElMessage.error('课程更新失败')
    }
  } catch (error) {
    console.error('更新课程失败:', error)
    ElMessage.error('更新课程失败，请稍后重试')
  }
}

// 返回上一页
function goBack() {
  router.push('/teacher/course')
}

// 页面加载时获取课程信息
onMounted(() => {
  fetchCourseData()
})
</script>

<style scoped>
.course-detail-container {
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

.course-header {
  padding: 30px;
  color: white;
  position: relative;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.course-info {
  max-width: 800px;
  margin: 0 auto;
}

.course-info h1 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 28px;
}

.course-meta {
  margin-bottom: 10px;
  display: flex;
  gap: 15px;
}

.course-category,
.course-credit {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.course-description {
  margin-bottom: 0;
  opacity: 0.9;
  line-height: 1.5;
}

.course-actions {
  position: absolute;
  top: 20px;
  right: 20px;
}

.course-nav {
  display: flex;
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
}

.nav-item {
  padding: 15px 25px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  color: #606266;
}

.nav-item:hover {
  color: #409EFF;
}

.nav-item.active {
  color: #409EFF;
  border-bottom: 2px solid #409EFF;
}

.course-content {
  padding: 20px;
  background-color: white;
  min-height: 500px;
  margin: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style> 