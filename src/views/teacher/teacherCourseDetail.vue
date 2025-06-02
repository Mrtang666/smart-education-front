<template>
  <div class="course-detail">
    <div class="course-header" :style="{ backgroundColor: courseColor }">
      <div class="back-button" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </div>
      <h1 class="course-title">{{ courseName }}</h1>
      <div class="course-actions">
        <el-button type="primary" plain @click="showEditCourseDialog">
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
                <h3>课程知识点</h3>
                <el-button type="primary" size="small" @click="showAddKnowledgeDialog">
                  <el-icon><Plus /></el-icon>
                  添加知识点
                </el-button>
              </div>
              <div class="section-body">
                <div v-if="courseKnowledges.length === 0" class="empty-tip">
                  暂无知识点，请点击"添加知识点"按钮添加
                </div>
                <div v-else class="knowledge-list">
                  <div v-for="knowledge in courseKnowledges" :key="knowledge.knowledgeId" class="knowledge-item">
                    <div class="knowledge-header">
                      <h4>{{ knowledge.name }}</h4>
                      <el-tag :type="getDifficultyTagType(knowledge.difficultyLevel)">{{ knowledge.difficultyLevel }}</el-tag>
                    </div>
                    <div class="knowledge-description">
                      <p>{{ knowledge.description || '暂无描述' }}</p>
                    </div>
                    <div class="knowledge-footer">
                      <span class="teach-plan-label">教学计划:</span>
                      <span class="teach-plan-content">{{ knowledge.teachPlan || '暂无教学计划' }}</span>
                    </div>
                    <div class="knowledge-actions">
                      <el-button link type="primary" @click="editKnowledge(knowledge)">编辑</el-button>
                      <el-button link type="danger" @click="removeKnowledge(knowledge)">删除</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                <el-button type="primary" size="small" @click="showUploadDialog">
                  <el-icon><Upload /></el-icon>
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
                    <span class="material-size">{{ formatFileSize(material.size) }}</span>
                    <div class="material-actions">
                      <el-button link type="primary" @click="downloadMaterial(material)">
                        <el-icon><Download /></el-icon> 下载
                      </el-button>
                      <el-button link type="danger" @click="removeMaterial(material)">
                        <el-icon><Delete /></el-icon> 删除
                      </el-button>
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

    <!-- 编辑课程对话框 -->
    <el-dialog v-model="editCourseDialogVisible" title="编辑课程" width="600px">
      <el-form :model="editCourseForm" label-width="100px">
        <el-form-item label="课程名称">
          <el-input v-model="editCourseForm.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="课程分类">
          <el-select v-model="editCourseForm.category" placeholder="请选择课程分类">
            <el-option v-for="option in categoryOptions" :key="option.value" :label="option.label" :value="option.value">
              <div class="category-option">
                <div class="category-color-dot" :style="{ backgroundColor: option.color }"></div>
                <span>{{ option.label }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="学分">
          <el-select v-model="editCourseForm.credit">
            <el-option v-for="option in creditOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="课程描述">
          <el-input v-model="editCourseForm.description" type="textarea" :rows="3" placeholder="请输入课程描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editCourseDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCourseEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加知识点对话框 -->
    <el-dialog v-model="addKnowledgeDialogVisible" title="创建知识点" width="500px">
      <el-form :model="newKnowledge" label-width="80px" :rules="knowledgeRules" ref="knowledgeFormRef">
        <el-form-item label="名称" prop="name">
          <el-input v-model="newKnowledge.name" placeholder="请输入知识点名称" />
        </el-form-item>
        <el-form-item label="所属课程">
          <el-input v-model="courseName" disabled />
        </el-form-item>
        <el-form-item label="难度等级" prop="difficultyLevel">
          <el-select v-model="newKnowledge.difficultyLevel" placeholder="请选择难度等级">
            <el-option label="简单" value="简单"></el-option>
            <el-option label="中等" value="中等"></el-option>
            <el-option label="困难" value="困难"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newKnowledge.description" type="textarea" placeholder="请输入知识点描述" :rows="3" />
        </el-form-item>
        <el-form-item label="教学计划">
          <el-input v-model="newKnowledge.teachPlan" type="textarea" placeholder="请输入教学计划" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addKnowledgeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveKnowledge">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 上传资料对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传资料" width="500px">
      <el-form :model="uploadForm" label-width="80px" :rules="uploadRules" ref="uploadFormRef">
        <el-form-item label="文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleChange"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :file-list="fileList"
            :limit="1"
            accept=".pdf,.pptx,.docx,.txt"
          >
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="uploadForm.name" placeholder="请输入资料名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="请输入资料描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadMaterial" :loading="isUploading">上传</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Plus, Document, Upload, Download, Delete } from '@element-plus/icons-vue'
import { courseAPI, knowledgeAPI, materialAPI } from '@/api/api'
import BigNumber from 'bignumber.js'

const route = useRoute()
const router = useRouter()
const courseId = route.params.courseId // 从路由参数中获取课程ID

// 处理 ResizeObserver 警告
const originalError = window.console.error;
window.console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
    // 忽略 ResizeObserver 警告
    return;
  }
  originalError(...args);
};

// 课程信息
const courseName = ref('加载中...')
const courseDescription = ref('')
const courseColor = ref('#409EFF')
const courseData = ref(null)

// 当前激活的标签页
const activeTab = ref('content')

// 课程资料
const materials = ref([])
const uploadDialogVisible = ref(false)
const uploadForm = ref({
  file: null,
  name: '',
  description: ''
})
const uploadRef = ref(null)
const fileList = ref([])
const isUploading = ref(false)
const uploadFormRef = ref(null)

// 学生列表
const students = ref([])

// 作业列表
const homeworks = ref([])

// 课程知识点列表
const courseKnowledges = ref([])

// 编辑课程对话框
const editCourseDialogVisible = ref(false)
const editCourseForm = ref({
  name: '',
  category: '',
  credit: 3,
  description: ''
})

// 添加知识点对话框
const addKnowledgeDialogVisible = ref(false)
const knowledgeFormRef = ref(null)
const newKnowledge = ref({
  name: '',
  difficultyLevel: '中等',
  description: '',
  teachPlan: '',
  knowledgeId: null // 确保清除之前可能存在的ID
})

// 知识点表单验证规则
const knowledgeRules = {
  name: [
    { required: true, message: '请输入知识点名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  difficultyLevel: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ]
}

// 课程分类选项
const categoryOptions = [
  { label: '计算机科学', value: '计算机科学', color: '#409EFF' },
  { label: '数学', value: '数学', color: '#67C23A' },
  { label: '物理', value: '物理', color: '#E6A23C' },
  { label: '化学', value: '化学', color: '#F56C6C' },
  { label: '生物', value: '生物', color: '#909399' },
  { label: 'AI通识', value: 'AI通识', color: '#9B59B6' },
  { label: '程序设计语言', value: '程序设计语言', color: '#3498DB' },
  { label: '其他', value: '其他', color: '#DCDFE6' }
]

// 学分选项
const creditOptions = [
  { label: '1学分', value: 1 },
  { label: '2学分', value: 2 },
  { label: '3学分', value: 3 },
  { label: '4学分', value: 4 },
  { label: '5学分', value: 5 }
]

// 上传表单验证规则
const uploadRules = {
  file: [
    { required: true, message: '请选择要上传的文件', trigger: 'change' }
  ]
}

// 获取课程信息
onMounted(async () => {
  if (!courseId) {
    ElMessage.error('课程ID不存在')
    goBack()
    return
  }

  const loadingInstance = ElLoading.service({
    target: '.course-detail',
    text: '加载课程信息...',
    background: 'rgba(255, 255, 255, 0.7)'
  })

  try {
    // 通过API获取课程信息
    const response = await courseAPI.getCourseById(courseId)
    
    if (response) {
      courseData.value = response
      courseName.value = response.name || '未命名课程'
      courseDescription.value = response.description || '暂无课程介绍'
      
      // 设置课程颜色
      // 这里可以根据课程类别设置不同的颜色
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
      
      // 初始化编辑表单数据
      editCourseForm.value = {
        name: response.name || '',
        category: response.category || '',
        credit: response.credit || 3,
        description: response.description || ''
      }
      
      console.log('课程数据加载成功:', response)
      
      // 加载课程知识点
      await fetchCourseKnowledges()
      
      // 加载课程资料
      await fetchCourseMaterials()
      
      students.value = [
        { id: '2021001', name: '张三', gender: '男', class: '计算机科学与技术1班' },
        { id: '2021002', name: '李四', gender: '女', class: '计算机科学与技术1班' },
      ]
      
      homeworks.value = [
        { id: 1, title: '第一章习题', deadline: '2023-06-01', submitRate: '85%' },
        { id: 2, title: '第二章习题', deadline: '2023-06-15', submitRate: '70%' },
      ]
    } else {
      ElMessage.error('获取课程信息失败')
      goBack()
    }
  } catch (error) {
    console.error('获取课程信息失败:', error)
    ElMessage.error('获取课程信息失败，请稍后重试')
    goBack()
  } finally {
    loadingInstance.close()
  }
})

// 获取课程知识点
async function fetchCourseKnowledges() {
  try {
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
    console.log('获取课程知识点，课程ID:', courseIdStr)
    
    const response = await knowledgeAPI.getKnowledgeByCourseId(courseIdStr)
    console.log('获取到的知识点数据:', response)
    
    if (Array.isArray(response)) {
      // 确保所有知识点ID都是字符串形式
      courseKnowledges.value = response.map(knowledge => ({
        ...knowledge,
        knowledgeId: knowledge.knowledgeId ? new BigNumber(knowledge.knowledgeId).toString() : knowledge.knowledgeId
      }));
    } else {
      courseKnowledges.value = []
    }
  } catch (error) {
    console.error('获取课程知识点失败:', error)
    ElMessage.error('获取课程知识点失败，请稍后重试')
    courseKnowledges.value = []
  }
}

// 获取课程资料
async function fetchCourseMaterials() {
  try {
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
    console.log('获取课程资料，课程ID:', courseIdStr)
    
    const response = await materialAPI.getMaterialsByCourseId(courseIdStr)
    console.log('获取到的课程资料:', response)
    
    if (Array.isArray(response)) {
      // 确保所有资料ID都是字符串形式
      materials.value = response.map(material => ({
        ...material,
        id: material.id ? new BigNumber(material.id).toString() : material.id
      }));
    } else {
      materials.value = []
    }
  } catch (error) {
    console.error('获取课程资料失败:', error)
    ElMessage.error('获取课程资料失败，请稍后重试')
    materials.value = []
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
      id: courseId ? new BigNumber(courseId).toString() : courseId.toString(),
      name: editCourseForm.value.name,
      category: editCourseForm.value.category,
      credit: editCourseForm.value.credit,
      description: editCourseForm.value.description
    }
    
    const response = await courseAPI.saveOrUpdateCourse(updatedCourseData)
    
    if (response) {
      // 更新页面上的课程信息
      courseName.value = response.name || '未命名课程'
      courseDescription.value = response.description || '暂无课程介绍'
      
      // 更新课程颜色
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
      
      ElMessage.success('课程更新成功')
      editCourseDialogVisible.value = false
    } else {
      ElMessage.error('课程更新失败')
    }
  } catch (error) {
    console.error('更新课程失败:', error)
    ElMessage.error('更新课程失败，请稍后重试')
  }
}

// 显示添加知识点对话框
function showAddKnowledgeDialog() {
  // 重置表单
  newKnowledge.value = {
    name: '',
    difficultyLevel: '中等',
    description: '',
    teachPlan: '',
    knowledgeId: null // 确保清除之前可能存在的ID
  }
  
  addKnowledgeDialogVisible.value = true
}

// 保存知识点
async function saveKnowledge() {
  knowledgeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 从localstorage中获取教师ID
        const userInfoStr = localStorage.getItem('user_info')
        if (!userInfoStr) {
          throw new Error('未找到用户信息，请重新登录')
        }
        
        const userInfo = JSON.parse(userInfoStr)
        if (!userInfo || !userInfo.teacherId) {
          throw new Error('用户信息不完整或不是教师账号')
        }
        
        // 确保教师ID是字符串形式
        const teacherId = userInfo.teacherId ? new BigNumber(userInfo.teacherId).toString() : userInfo.teacherId
        
        // 判断是创建新知识点还是更新已有知识点
        if (newKnowledge.value.knowledgeId) {
          // 更新已有知识点
          const knowledgeData = {
            knowledgeId: newKnowledge.value.knowledgeId ? new BigNumber(newKnowledge.value.knowledgeId).toString() : newKnowledge.value.knowledgeId,
            name: newKnowledge.value.name,
            description: newKnowledge.value.description || '',
            difficultyLevel: newKnowledge.value.difficultyLevel,
            teacherId: teacherId,
            teachPlan: newKnowledge.value.teachPlan || ''
          }
          
          await knowledgeAPI.updateKnowledge(knowledgeData)
          
          // 重新获取课程知识点列表
          await fetchCourseKnowledges()
          
          ElMessage.success('知识点更新成功')
          addKnowledgeDialogVisible.value = false
        } else {
          // 创建新知识点
          const knowledgeData = {
            name: newKnowledge.value.name,
            description: newKnowledge.value.description || '',
            difficultyLevel: newKnowledge.value.difficultyLevel,
            teacherId: teacherId,
            teachPlan: newKnowledge.value.teachPlan || ''
          }
          
          // 先创建知识点
          const createdKnowledge = await knowledgeAPI.saveKnowledge(knowledgeData)
          console.log('创建知识点成功:', createdKnowledge)
          
          if (createdKnowledge && createdKnowledge.knowledgeId) {
            // 将知识点添加到课程，确保ID是字符串形式
            const knowledgeId = new BigNumber(createdKnowledge.knowledgeId).toString();
            const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
            
            await knowledgeAPI.appendKnowledgeToCourse(knowledgeId, courseIdStr)
            
            // 重新获取课程知识点列表
            await fetchCourseKnowledges()
            
            ElMessage.success('知识点创建并添加到课程成功')
            addKnowledgeDialogVisible.value = false
          } else {
            throw new Error('创建知识点失败')
          }
        }
      } catch (error) {
        console.error('保存知识点失败:', error)
        ElMessage.error(`保存知识点失败: ${error.message || '请稍后重试'}`)
      }
    }
  })
}

// 编辑知识点
function editKnowledge(knowledge) {
  // 这里可以实现编辑知识点的功能
  // 可以复用添加知识点的对话框，只需要预填充表单数据
  newKnowledge.value = {
    name: knowledge.name,
    difficultyLevel: knowledge.difficultyLevel,
    description: knowledge.description || '',
    teachPlan: knowledge.teachPlan || '',
    knowledgeId: knowledge.knowledgeId ? new BigNumber(knowledge.knowledgeId).toString() : knowledge.knowledgeId // 保存原知识点ID，用于更新
  }
  
  addKnowledgeDialogVisible.value = true
  ElMessage.info('请在表单中修改知识点信息后点击确认')
}

// 删除知识点
function removeKnowledge(knowledge) {
  ElMessageBox.confirm(
    `确定要删除知识点"${knowledge.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保课程ID和知识点ID都是字符串形式
      const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
      const knowledgeIdStr = knowledge.knowledgeId ? new BigNumber(knowledge.knowledgeId).toString() : knowledge.knowledgeId;
      
      await knowledgeAPI.deleteKnowledgeFromCourseById(courseIdStr, knowledgeIdStr)
      // 重新获取课程知识点列表
      await fetchCourseKnowledges()
      ElMessage.success('知识点删除成功')
    } catch (error) {
      console.error('删除知识点失败:', error)
      ElMessage.error('删除知识点失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 根据难度等级获取标签类型
function getDifficultyTagType(level) {
  switch(level) {
    case '简单':
      return 'success'
    case '中等':
      return 'warning'
    case '困难':
      return 'danger'
    default:
      return 'info'
  }
}

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

// 显示上传资料对话框
function showUploadDialog() {
  uploadForm.value = {
    file: null,
    name: '',
    description: ''
  }
  fileList.value = []
  uploadDialogVisible.value = true
}

// 文件上传前的验证
function beforeUpload(file) {
  // 限制文件大小为50MB
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过50MB')
    return false
  }
  
  // 保存文件到表单
  uploadForm.value.file = file
  uploadForm.value.name = file.name
  
  return false // 阻止自动上传
}

// 文件选择变化处理
function handleChange(file) {
  // 更新文件列表
  fileList.value = [file]
  
  // 保存文件到表单
  uploadForm.value.file = file.raw
  uploadForm.value.name = file.name
}

// 文件移除处理
function handleRemove() {
  // 清空文件列表
  fileList.value = []
  
  // 清空表单中的文件
  uploadForm.value.file = null
}

// 上传文件
async function uploadMaterial() {
  // 表单验证
  if (!uploadFormRef.value) return
  
  uploadFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请填写完整的表单信息')
      return
    }
    
    if (!uploadForm.value.file) {
      ElMessage.warning('请选择要上传的文件')
      return
    }
    
    try {
      isUploading.value = true
      
      // 创建FormData对象
      const formData = new FormData()
      formData.append('file', uploadForm.value.file)
      formData.append('name', uploadForm.value.name)
      formData.append('description', uploadForm.value.description || '')
      
      // 确保courseId是字符串形式
      const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString()
      
      // 上传文件
      await materialAPI.uploadMaterial(formData, courseIdStr)
      
      ElMessage.success('资料上传成功')
      uploadDialogVisible.value = false
      
      // 重新获取课程资料列表
      await fetchCourseMaterials()
    } catch (error) {
      console.error('上传资料失败:', error)
      ElMessage.error('上传资料失败，请稍后重试')
    } finally {
      isUploading.value = false
    }
  })
}

// 下载资料
async function downloadMaterial(material) {
  try {
    // 确保资料ID是字符串形式
    const materialIdStr = material.id ? new BigNumber(material.id).toString() : material.id.toString()
    
    // 获取下载链接
    const downloadInfo = await materialAPI.getMaterialDownloadUrl(materialIdStr)
    
    if (downloadInfo && downloadInfo.downloadUrl) {
      // 创建一个临时链接并触发下载
      const link = document.createElement('a')
      link.href = downloadInfo.downloadUrl
      link.download = downloadInfo.name || material.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      ElMessage.success('资料下载中...')
    } else {
      throw new Error('获取下载链接失败')
    }
  } catch (error) {
    console.error('下载资料失败:', error)
    ElMessage.error('下载资料失败，请稍后重试')
  }
}

// 删除资料
function removeMaterial(material) {
  ElMessageBox.confirm(
    `确定要删除资料"${material.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保资料ID是字符串形式
      const materialIdStr = material.id ? new BigNumber(material.id).toString() : material.id.toString()
      
      await materialAPI.deleteMaterial(materialIdStr)
      
      // 重新获取课程资料列表
      await fetchCourseMaterials()
      
      ElMessage.success('资料删除成功')
    } catch (error) {
      console.error('删除资料失败:', error)
      ElMessage.error('删除资料失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 格式化文件大小
function formatFileSize(size) {
  if (!size) return '未知大小'
  
  // 如果已经是格式化后的字符串，直接返回
  if (typeof size === 'string' && (size.includes('KB') || size.includes('MB') || size.includes('GB'))) {
    return size
  }
  
  // 转换为数字
  const sizeNum = Number(size)
  if (isNaN(sizeNum)) return size
  
  if (sizeNum < 1024) {
    return sizeNum + ' B'
  } else if (sizeNum < 1024 * 1024) {
    return (sizeNum / 1024).toFixed(1) + ' KB'
  } else if (sizeNum < 1024 * 1024 * 1024) {
    return (sizeNum / (1024 * 1024)).toFixed(1) + ' MB'
  } else {
    return (sizeNum / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }
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

/* 知识点列表样式 */
.knowledge-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.knowledge-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.knowledge-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.knowledge-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.knowledge-description {
  margin-bottom: 12px;
}

.knowledge-description p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.knowledge-footer {
  margin-bottom: 12px;
  font-size: 13px;
}

.teach-plan-label {
  color: #909399;
  margin-right: 4px;
}

.teach-plan-content {
  color: #606266;
}

.knowledge-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.category-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style> 