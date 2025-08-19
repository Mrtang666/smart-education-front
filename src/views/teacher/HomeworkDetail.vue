<template>
  <div class="homework-detail">
    <!-- 顶部导航 -->
    <div class="course-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="course-title">{{ homeworkTitle }}
          <el-tag size="small" class="status-tag" :type="getStatusTagType(homeworkData.status)">
            {{ getStatusText(homeworkData.status) }}
          </el-tag>
        </h1>
      </div>
      <div class="course-actions">
        <el-button type="success" @click="saveHomework" :loading="isSaving">
          <el-icon><Check /></el-icon>
          保存作业
        </el-button>
        <el-button type="primary" @click="publishHomework" v-if="homeworkData.status === 'DRAFT'">
          <el-icon><Upload /></el-icon>
          发布作业
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="course-content" v-loading="isLoading">
      <div class="course-tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <HomeworkBasicInfo 
              :homework-data="homeworkData" 
              @update:homework-data="updateHomeworkData" 
            />
          </el-tab-pane>
          
          <el-tab-pane label="题目管理" name="problems">
            <div class="problem-management-enhanced">
              <!-- 题目管理工具栏 -->
              <div class="problem-toolbar">
                <div class="toolbar-left">
                  <el-button type="primary" @click="showAddProblemDialog">
                    <el-icon><Plus /></el-icon>
                    添加题目
                  </el-button>
                  <el-button type="success" @click="showAIGenerateDialog" :disabled="homeworkData.status !== 'DRAFT'">
                    <el-icon><MagicStick /></el-icon>
                    AI生成习题
                  </el-button>
                  <el-button @click="showImportDialog" :disabled="homeworkData.status !== 'DRAFT'">
                    <el-icon><Upload /></el-icon>
                    导入题目
                  </el-button>
                  <el-button @click="exportProblems" :disabled="problems.length === 0">
                    <el-icon><Download /></el-icon>
                    导出题目
                  </el-button>
                </div>

                <div class="toolbar-right">
                  <el-button
                    type="danger"
                    @click="batchDeleteProblems"
                    :disabled="selectedProblems.length === 0 || homeworkData.status !== 'DRAFT'"
                  >
                    <el-icon><Delete /></el-icon>
                    批量删除 ({{ selectedProblems.length }})
                  </el-button>

                </div>
              </div>

              <!-- 题目统计信息 -->
              <div class="problem-statistics" v-if="problemStatistics">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-statistic title="题目总数" :value="problemStatistics.totalCount" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="总分数" :value="problemStatistics.totalScore" suffix="分" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="学生平均分" :value="getAverageScoreNumber()" suffix="分" :precision="1" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="题目类型" :value="Object.keys(problemStatistics.typeStatistics || {}).length" suffix="种" />
                  </el-col>
                </el-row>
              </div>

              <!-- 题型统计图表 -->
              <div class="problem-charts" v-if="problemStatistics && Object.keys(problemStatistics.typeStatistics || {}).length > 0">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-card class="chart-card">
                      <template #header>
                        <div class="chart-header">
                          <span>题型数量分布</span>
                          <el-tooltip content="显示各题型的题目数量分布" placement="top">
                            <el-icon><QuestionFilled /></el-icon>
                          </el-tooltip>
                        </div>
                      </template>
                      <div ref="typeCountChart" class="chart-container"></div>
                    </el-card>
                  </el-col>
                  <el-col :span="12">
                    <el-card class="chart-card">
                      <template #header>
                        <div class="chart-header">
                          <span>题型分值分布</span>
                          <el-tooltip content="显示各题型的分值占比分布" placement="top">
                            <el-icon><QuestionFilled /></el-icon>
                          </el-tooltip>
                        </div>
                      </template>
                      <div ref="typeScoreChart" class="chart-container"></div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>

              <!-- 题目搜索和筛选 -->
              <div class="problem-search">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-input
                      v-model="searchKeyword"
                      placeholder="搜索题目标题或内容"
                      @input="handleSearch"
                      clearable
                    >
                      <template #prefix>
                        <el-icon><Search /></el-icon>
                      </template>
                    </el-input>
                  </el-col>
                  <el-col :span="6">
                    <el-select v-model="filterType" placeholder="筛选题目类型" @change="handleFilter" clearable>
                      <el-option label="单选题" value="SINGLE_CHOICE" />
                      <el-option label="多选题" value="MULTI_CHOICE" />
                      <el-option label="填空题" value="FILL_BLANK" />
                      <el-option label="简答题" value="ESSAY_QUESTION" />
                      <el-option label="判断题" value="TRUE_FALSE" />
                    </el-select>
                  </el-col>
                  <el-col :span="10">
                    <div class="score-range">
                      <span>分值范围：</span>
                      <el-input-number v-model="minScore" :min="0" :max="100" placeholder="最小分值" style="width: 120px;" />
                      <span style="margin: 0 10px;">-</span>
                      <el-input-number v-model="maxScore" :min="0" :max="100" placeholder="最大分值" style="width: 120px;" />
                      <el-button @click="handleScoreFilter" style="margin-left: 10px;">筛选</el-button>
                    </div>
                  </el-col>
                </el-row>
              </div>

              <!-- AI生成习题展示区域 -->
              <div v-if="aiGeneratedExercises.length > 0" class="ai-exercises-container">
                <div class="ai-exercises-header">
                  <h3 class="ai-exercises-title">
                    <el-icon class="ai-icon"><MagicStick /></el-icon>
                    AI生成的习题
                  </h3>
                  <div class="ai-exercises-actions">
                    <el-button size="small" @click="clearAIExercises">清空</el-button>
                    <el-button type="primary" size="small" @click="showAIGenerateDialog">重新生成</el-button>
                  </div>
                </div>

                <div class="ai-exercises-list">
                  <div
                    v-for="(exercise, index) in aiGeneratedExercises"
                    :key="index"
                    class="exercise-item"
                  >
                    <div class="exercise-header">
                      <!-- <div class="exercise-title">
                        <span class="exercise-number">题目 {{ index + 1 }}</span>
                        <el-tag
                          v-if="exercise.difficulty"
                          :type="getDifficultyType(exercise.difficulty)"
                          size="small"
                          class="difficulty-tag"
                        >
                          {{ exercise.difficulty }}
                        </el-tag>
                      </div> -->
                      <el-button
                        type="primary"
                        size="small"
                        @click="copyExercise(exercise)"
                        :icon="DocumentCopy"
                      >
                        复制
                      </el-button>
                    </div>

                    <div class="exercise-content">
                      <!-- 题目内容 -->
                      <!-- <div class="content-line">
                        {{ exercise.question || exercise.title || '暂无题目内容' }}
                      </div> -->

                      <!-- 选项 -->
                      <div v-if="exercise.options && exercise.options.length > 0" class="content-line">
                        <span
                          v-for="(option, optIndex) in exercise.options"
                          :key="optIndex"
                          class="option-inline"
                        >
                          {{ String.fromCharCode(65 + optIndex) }}.{{ option }}
                          <span v-if="optIndex < exercise.options.length - 1" class="option-separator"> </span>
                        </span>
                      </div>

                      <!-- 答案 -->
                      <div v-if="exercise.answer" class="content-line answer-line">
                        {{ exercise.answer }}
                      </div>

                      <!-- 解析 -->
                      <div v-if="exercise.explanation" class="content-line explanation-line">
                        {{ exercise.explanation }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 题目列表组件 -->
              <ProblemManagement
                :homework-id="homeworkId"
                :problems="filteredProblems"
                :selected-problems="selectedProblems"
                @update:problems="updateProblems"
                @edit-problem="editProblem"
                @delete-problem="deleteProblem"
                @copy-problem="copyProblem"
                @selection-change="handleProblemSelection"
                @sequence-change="handleSequenceChange"
              />
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="学生提交情况" name="submissions" v-if="homeworkData.status !== 'DRAFT'">
            <div class="submissions-container">
              <div v-if="!submissions || submissions.length === 0" class="empty-content">
                <el-empty description="暂无提交数据" :image-size="200">
                  <template #description>
                    <p>暂无学生提交数据</p>
                    <p class="empty-sub-text">学生提交作业后，您可以在此查看提交情况</p>
                  </template>
                </el-empty>
              </div>

              <div v-else class="submissions-content">
                <div class="submissions-header">
                  <h3>学生提交详情</h3>
                  <el-button @click="fetchSubmissions" :loading="isLoading" type="primary">
                    <el-icon><Refresh /></el-icon>
                    刷新数据
                  </el-button>
                </div>

                <el-table :data="submissions" style="width: 100%" stripe>
                  <el-table-column label="学生姓名" min-width="150">
                    <template #default="scope">
                      {{ scope.row.studentName || '获取中...' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="totalScore" label="总分" width="120" sortable>
                    <template #default="scope">
                      {{ scope.row.totalScore || 0 }}分
                    </template>
                  </el-table-column>
                  <el-table-column prop="submittedAt" label="提交时间" min-width="180" sortable>
                    <template #default="scope">
                      {{ scope.row.submittedAt ? new Date(scope.row.submittedAt).toLocaleString() : '未提交' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="答题数量" width="120">
                    <template #default="scope">
                      {{ scope.row.answers ? scope.row.answers.length : 0 }}题
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="150" fixed="right">
                    <template #default="scope">
                      <el-button size="small" type="primary" @click="viewStudentExamDetail(scope.row.studentId)">
                        查看详情
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 统计信息卡片 -->
      <div class="stats-section" v-if="homeworkData.status !== 'DRAFT'">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-card class="stats-card">
              <template #header>
                <div class="card-header">
                  <span>提交情况</span>
                  <el-tooltip content="学生已提交作业的比例">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <div class="stats-content">
                <div class="stats-number">{{ getSubmissionCount() }} / {{ totalStudentsCount }}</div>
                <el-progress :percentage="getSubmissionPercentage()" :status="getSubmissionStatus()" />
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="8">
            <el-card class="stats-card">
              <template #header>
                <div class="card-header">
                  <span>平均分数</span>
                  <el-tooltip content="已批改作业的平均得分">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <div class="stats-content">
                <div class="stats-number">{{ getAverageScore() }}<span class="stats-unit"> 分</span></div>
                <div class="stats-progress-bar">
                  <div class="progress-bar" :style="{width: getScorePercentage() + '%'}"></div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="8">
            <el-card class="stats-card">
              <template #header>
                <div class="card-header">
                  <span>剩余时间</span>
                  <el-tooltip content="距离作业截止时间">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <div class="stats-content">
                <div v-if="isHomeworkEnded()" class="stats-number ended">已结束</div>
                <div v-else class="stats-number">{{ getRemainingTimeText() }}</div>
                <div class="stats-subtitle">截止日期：{{ formatDate(homeworkData.endTime) }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
    
    <!-- 添加题目对话框 -->
    <el-dialog
      v-model="addProblemDialogVisible"
      :title="problemDialogTitle"
      width="800px"
      destroy-on-close
      top="5vh"
    >
      <ProblemForm
        :problem-data="currentProblem"
        :homework-id="homeworkId"
        :ai-generated-exercises="aiGeneratedExercises"
        @save="saveProblem"
        @cancel="addProblemDialogVisible = false"
      />
    </el-dialog>

    <!-- 智能分析详情对话框 -->
    <el-dialog v-model="analysisDialogVisible" title="智能分析详情" width="60%">
      <div v-if="currentAnalysis">
        <pre>{{ JSON.stringify(currentAnalysis, null, 2) }}</pre>
      </div>
      <div v-else>
        <el-empty description="暂无分析数据" />
      </div>
    </el-dialog>

    <!-- 学习建议对话框 -->
    <el-dialog v-model="adviceDialogVisible" title="学习建议" width="50%">
      <div v-if="currentAdvice && currentAdvice.length > 0">
        <el-card v-for="(advice, index) in currentAdvice" :key="index" style="margin-bottom: 10px;">
          <p>{{ advice }}</p>
        </el-card>
      </div>
      <div v-else>
        <el-empty description="暂无学习建议" />
      </div>
    </el-dialog>

    <!-- 考试详情对话框 -->
    <el-dialog v-model="examDetailsDialogVisible" title="考试详情" width="70%">
      <div v-if="currentExamDetails">
        <pre>{{ JSON.stringify(currentExamDetails, null, 2) }}</pre>
      </div>
      <div v-else>
        <el-empty description="暂无考试详情" />
      </div>
    </el-dialog>

    <!-- 题目导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入题目" width="60%">
      <div class="import-dialog-content">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <p>请选择JSON格式的题目文件进行导入。文件格式应包含题目数组，每个题目包含标题、内容、类型、分值等字段。</p>
        </el-alert>

        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".json"
          :on-change="handleFileChange"
          :file-list="fileList"
          drag
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传JSON文件，且不超过10MB
            </div>
          </template>
        </el-upload>

        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>预览导入的题目 ({{ importPreview.length }} 道)</h4>
          <el-table :data="importPreview" style="width: 100%" max-height="300">
            <el-table-column prop="title" label="题目标题" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                {{ getProblemTypeText(scope.row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="score" label="分值" width="80" />
          </el-table>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmImport"
            :disabled="importPreview.length === 0"
            :loading="importing"
          >
            确认导入 ({{ importPreview.length }} 道题目)
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- AI生成习题对话框 -->
    <el-dialog v-model="aiDialogVisible" title="AI生成习题" width="600px" :close-on-click-modal="false">
      <el-form :model="aiForm" :rules="aiRules" ref="aiFormRef" label-width="120px">
        <el-form-item label="生成方式" prop="generateType">
          <el-radio-group v-model="aiForm.generateType" @change="handleGenerateTypeChange">
            <el-radio label="course">基于课程</el-radio>
            <el-radio label="knowledge">基于知识点</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="aiForm.generateType === 'course'" label="课程名称" prop="courseName">
          <el-select v-model="aiForm.courseName" placeholder="请选择课程" style="width: 100%">
            <el-option
              v-for="course in courseList"
              :key="course.id"
              :label="course.name"
              :value="course.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="aiForm.generateType === 'knowledge'" label="知识点" prop="knowledgeInput">
          <el-input
            v-model="aiForm.knowledgeInput"
            type="textarea"
            :rows="3"
            placeholder="请输入知识点，多个知识点用逗号分隔，例如：函数的概念，函数的性质，函数的图像"
            style="width: 100%"
            maxlength="500"
            show-word-limit
          />
          <div class="form-tip">请输入相关知识点，多个知识点用逗号分隔，系统将基于这些知识点生成习题</div>
        </el-form-item>

        <el-form-item label="难度等级" prop="difficultyLevel">
          <el-select v-model="aiForm.difficultyLevel" placeholder="请选择难度等级" style="width: 100%">
            <el-option label="简单" value="简单" />
            <el-option label="中等" value="中等" />
            <el-option label="困难" value="困难" />
          </el-select>
        </el-form-item>

        <el-form-item label="题目数量" prop="problemCount">
          <el-input-number
            v-model="aiForm.problemCount"
            :min="1"
            :max="10"
            style="width: 100%"
          />
          <div class="form-tip">建议生成1-10道题目</div>
        </el-form-item>

        <el-alert
          title="温馨提示"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            AI生成习题可能需要30-60秒时间，请耐心等待，不要重复点击生成按钮。
          </template>
        </el-alert>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="aiDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="generateAIExercises" :loading="aiGenerating">
            <el-icon v-if="!aiGenerating"><MagicStick /></el-icon>
            {{ aiGenerating ? '生成中...' : '开始生成' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled, ArrowLeft, /* Edit, */ Check, Upload, Refresh, Plus, Download, Delete, Search, MagicStick, DocumentCopy } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { assignmentAPI, problemAPI, courseSelectionAPI, studentAnswerAPI, studentExamAPI, teacherAPI, studentAssistantAPI, courseAPI } from '@/api/api'

// 组件引用
import HomeworkBasicInfo from '@/components/teacher/HomeworkBasicInfo.vue'
import ProblemManagement from '@/components/teacher/ProblemManagement.vue'
import ProblemForm from '@/components/teacher/ProblemForm.vue'
// 提交列表组件将在后续开发
// import SubmissionsList from '@/components/teacher/SubmissionsList.vue'

// ==================== 工具函数 ====================

// 根据题目类型判定是否支持自动评分
function getAutoGrading(type) {
  // 单选题、多选题、填空题、判断题支持自动评分
  const autoGradingTypes = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'FILL_BLANK', 'TRUE_FALSE']
  return autoGradingTypes.includes(type)
}

// ==================== 路由和状态管理 ====================

const route = useRoute()
const router = useRouter()

// 获取路由参数
const homeworkId = ref(route.params.id)
const courseId = ref(route.query.courseId)
// const courseName = ref(route.query.courseName || '课程')

// 页面状态
const activeTab = ref('basic')
const isSaving = ref(false)
const isLoading = ref(true)

// 从 localStorage 获取当前用户角色
const userRole = JSON.parse(localStorage.getItem('user_role'))[0]; // 解析为数组并获取第一个元素

// 获取用户信息
import { getUserInfo } from '@/utils/auth'
const userInfo = getUserInfo()
const teacherId = userInfo ? (userInfo.teacherId || userInfo.studentId || userInfo.id) : null

// 作业数据
const homeworkData = ref({
  assignmentId: '',
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  type: 'TEACHER_ASSIGNED',
  courseId: '',
  creatorId: '',
  isAnswerPublic: false,
  isScoreVisible: true,
  isRedoAllowed: false,
  maxAttempts: 1,
  status: 'DRAFT',
  originType: userRole === 'ROLE_TEACHER' ? 'TEACHER_ASSIGNED' : 'STUDENT_UPLOAD' // 根据用户角色设置 originType
})

// 计算属性
const homeworkTitle = computed(() => homeworkData.value.title || '作业详情')

// 筛选后的题目列表
const filteredProblems = computed(() => {
  let filtered = [...problems.value]

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(problem =>
      problem.title?.toLowerCase().includes(keyword) ||
      problem.content?.toLowerCase().includes(keyword)
    )
  }

  // 类型筛选
  if (filterType.value) {
    filtered = filtered.filter(problem => problem.type === filterType.value)
  }

  // 分值范围筛选
  if (minScore.value !== null || maxScore.value !== null) {
    filtered = filtered.filter(problem => {
      const score = problem.score || 0
      const min = minScore.value || 0
      const max = maxScore.value || 100
      return score >= min && score <= max
    })
  }

  return filtered
})

// 题目相关
const problems = ref([])
const addProblemDialogVisible = ref(false)
const problemDialogTitle = ref('添加题目')
const currentProblem = ref(null)

// 提交情况
const submissions = ref([])

// 课程学生总数
const totalStudentsCount = ref(0)

// 图表相关
const typeCountChart = ref(null)          // 题型数量图表DOM引用
const typeScoreChart = ref(null)          // 题型分值图表DOM引用
let typeCountChartInstance = null         // 题型数量图表实例
let typeScoreChartInstance = null         // 题型分值图表实例

// 对话框控制
const analysisDialogVisible = ref(false)
const adviceDialogVisible = ref(false)
const examDetailsDialogVisible = ref(false)

// 当前显示的数据
const currentAnalysis = ref(null)
const currentAdvice = ref([])
const currentExamDetails = ref(null)

// 题目管理增强功能
const selectedProblems = ref([])           // 选中的题目列表
const problemStatistics = ref(null)       // 题目统计信息
const searchKeyword = ref('')             // 搜索关键词
const filterType = ref('')                // 筛选类型
const minScore = ref(null)                // 最小分值
const maxScore = ref(null)                // 最大分值
const importDialogVisible = ref(false)    // 导入对话框显示状态
const fileList = ref([])                  // 上传文件列表
const importPreview = ref([])             // 导入预览数据
const importing = ref(false)              // 导入中状态

// AI生成习题相关
const aiDialogVisible = ref(false)        // AI生成对话框显示状态
const aiGenerating = ref(false)           // AI生成中状态
const aiGeneratedExercises = ref([])      // AI生成的习题列表
const courseList = ref([])                // 课程列表
const aiFormRef = ref(null)               // AI表单引用
const aiForm = ref({                      // AI生成表单数据
  generateType: 'course',                 // 'course' 或 'knowledge'
  courseName: '',
  knowledgeInput: '',                     // 改为输入框形式
  difficultyLevel: '中等',
  problemCount: 5
})

// AI表单验证规则
const aiRules = {
  generateType: [
    { required: true, message: '请选择生成方式', trigger: 'change' }
  ],
  courseName: [
    { required: true, message: '请选择课程', trigger: 'change' }
  ],
  knowledgeInput: [
    { required: true, message: '请输入知识点', trigger: 'blur' },
    { min: 2, message: '知识点内容至少2个字符', trigger: 'blur' }
  ],
  difficultyLevel: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  problemCount: [
    { required: true, message: '请输入题目数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 10, message: '题目数量应在1-10之间', trigger: 'blur' }
  ]
}

// 返回上一页
function goBack() {
  router.push(`/teacher/course/${courseId.value}?tab=homework`)
}

// 获取作业状态文本
function getStatusText(status) {
  const statusMap = {
    'DRAFT': '草稿',
    'PUBLISHED': '已发布',
    'ENDED': '已结束'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    'DRAFT': 'info',
    'PUBLISHED': 'success', 
    'ENDED': 'warning'
  }
  return typeMap[status] || 'info'
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '未设置'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
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

// 获取剩余时间文本
function getRemainingTimeText() {
  if (!homeworkData.value.endTime) return '未设置截止日期'
  
  const endTime = new Date(homeworkData.value.endTime)
  const now = new Date()
  const diff = endTime - now
  
  if (diff <= 0) return '已截止'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

// 判断作业是否已结束
function isHomeworkEnded() {
  if (!homeworkData.value.endTime) return false
  return new Date() > new Date(homeworkData.value.endTime)
}

// 获取提交数量（从API获取的真实数据）
function getSubmissionCount() {
  // 返回已提交作业的学生数量
  return submissions.value.length || 0
}

// 获取总学生数（从API获取）
async function getTotalStudentsCount() {
  try {
    if (!courseId.value) {
      console.warn('课程ID不存在，无法获取学生总数')
      return 0
    }

    const students = await courseSelectionAPI.getCourseStudents(courseId.value)
    const count = Array.isArray(students) ? students.length : 0
    console.log(`课程 ${courseId.value} 的学生总数: ${count}`)
    return count
  } catch (error) {
    console.error('获取课程学生总数失败:', error)
    // 发生错误时返回0，避免显示错误的统计数据
    return 0
  }
}

// 获取提交百分比
function getSubmissionPercentage() {
  const count = getSubmissionCount()
  const total = totalStudentsCount.value
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

// 获取提交状态
function getSubmissionStatus() {
  const percentage = getSubmissionPercentage()
  if (percentage >= 80) return 'success'
  if (percentage >= 40) return 'warning'
  return 'exception'
}

// 获取平均分数（从API数据计算真实平均分）
function getAverageScore() {
  if (submissions.value.length === 0) return '暂无'

  // 过滤掉没有有效分数的提交
  const validSubmissions = submissions.value.filter(submission => {
    return submission.totalScore !== null && submission.totalScore !== undefined && submission.totalScore >= 0
  })

  if (validSubmissions.length === 0) return '暂无'

  // 计算所有有效学生的总分
  const totalScore = validSubmissions.reduce((sum, submission) => {
    return sum + (submission.totalScore || 0)
  }, 0)

  // 计算平均分并保留一位小数
  const average = totalScore / validSubmissions.length
  return Math.round(average * 10) / 10
}

// 获取平均分数的数值版本（用于统计组件）
function getAverageScoreNumber() {
  if (submissions.value.length === 0) return 0

  // 过滤掉没有有效分数的提交
  const validSubmissions = submissions.value.filter(submission => {
    return submission.totalScore !== null && submission.totalScore !== undefined && submission.totalScore >= 0
  })

  if (validSubmissions.length === 0) return 0

  // 计算所有有效学生的总分
  const totalScore = validSubmissions.reduce((sum, submission) => {
    return sum + (submission.totalScore || 0)
  }, 0)

  // 计算平均分并保留一位小数
  const average = totalScore / validSubmissions.length
  return Math.round(average * 10) / 10
}





// 查看学生考卷详情（跳转到学生考卷详情页面）
function viewStudentExamDetail(studentId) {
  // 跳转到学生考卷详情页面，传递学生ID和作业ID
  router.push({
    path: `/teacher/student-exam-detail/${studentId}/${homeworkId.value}`,
    query: {
      studentId: studentId,
      examId: homeworkId.value,
      homeworkTitle: homeworkData.value.title || '作业详情'
    }
  })
}

// ==================== 题目管理增强功能 ====================

// 获取题目统计信息
async function refreshProblemStatistics() {
  try {
    if (!homeworkId.value) return

    const stats = await problemAPI.getProblemStatistics(homeworkId.value)
    problemStatistics.value = stats
    console.log('题目统计信息:', stats)

    // 更新图表
    nextTick(() => {
      updateCharts()
    })
  } catch (error) {
    console.error('获取题目统计失败:', error)
    // 如果API不存在，使用本地计算
    calculateLocalStatistics()

    // 更新图表
    nextTick(() => {
      updateCharts()
    })
  }
}

// 本地计算统计信息（备用方案）
function calculateLocalStatistics() {
  const stats = {
    totalCount: problems.value.length,
    totalScore: problems.value.reduce((sum, p) => sum + (p.score || 0), 0),
    averageScore: 0,
    typeStatistics: {}
  }

  if (stats.totalCount > 0) {
    stats.averageScore = stats.totalScore / stats.totalCount
  }

  // 按类型统计
  problems.value.forEach(problem => {
    const type = problem.type || 'UNKNOWN'
    stats.typeStatistics[type] = (stats.typeStatistics[type] || 0) + 1
  })

  problemStatistics.value = stats
}

// 批量删除题目
async function batchDeleteProblems() {
  if (selectedProblems.value.length === 0) {
    ElMessage.warning('请先选择要删除的题目')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedProblems.value.length} 道题目吗？`,
      '批量删除题目',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const problemIds = selectedProblems.value.map(p => p.problemId)

    try {
      // 尝试使用批量删除API
      const result = await problemAPI.batchDeleteProblems(problemIds)

      if (result.success) {
        ElMessage.success(`成功删除 ${result.successCount} 道题目`)
        if (result.failedCount > 0) {
          ElMessage.warning(`${result.failedCount} 道题目删除失败`)
        }
      }
    } catch (error) {
      // 如果批量删除API不存在，使用单个删除
      console.warn('批量删除API不可用，使用单个删除:', error)
      await batchDeleteProblemsOneByOne(problemIds)
    }

    // 刷新题目列表和统计
    await fetchProblems()
    await refreshProblemStatistics()
    selectedProblems.value = []

  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除题目失败:', error)
      ElMessage.error('批量删除失败: ' + (error.message || '请稍后重试'))
    }
  }
}

// 逐个删除题目（备用方案）
async function batchDeleteProblemsOneByOne(problemIds) {
  let successCount = 0
  let failedCount = 0

  for (const problemId of problemIds) {
    try {
      await problemAPI.deleteProblem(problemId)
      successCount++
    } catch (error) {
      console.error(`删除题目 ${problemId} 失败:`, error)
      failedCount++
    }
  }

  if (successCount > 0) {
    ElMessage.success(`成功删除 ${successCount} 道题目`)
  }
  if (failedCount > 0) {
    ElMessage.warning(`${failedCount} 道题目删除失败`)
  }
}

// 复制题目
async function copyProblem(problem) {
  try {
    // 创建复制的题目数据
    const copiedProblem = {
      ...problem,
      problemId: undefined, // 清除原ID，让后端生成新ID
      title: `${problem.title} (副本)`,
      sequence: problems.value.length + 1,
      autoGrading: getAutoGrading(problem.type) // 根据题目类型自动设置自动评分
    }

    const result = await problemAPI.saveProblem(copiedProblem)
    if (result) {
      ElMessage.success('题目复制成功')
      await fetchProblems()
      await refreshProblemStatistics()
    }
  } catch (error) {
    console.error('复制题目失败:', error)
    ElMessage.error('复制题目失败: ' + (error.message || '请稍后重试'))
  }
}

// 处理题目选择变化
function handleProblemSelection(selectedItems) {
  selectedProblems.value = selectedItems
}

// 处理题目顺序变化
async function handleSequenceChange(newSequences) {
  try {
    // 尝试使用API更新顺序
    try {
      await problemAPI.updateProblemSequences(homeworkId.value, newSequences)
      ElMessage.success('题目顺序更新成功')
    } catch (error) {
      console.warn('顺序更新API不可用，使用本地更新:', error)
      // 本地更新顺序
      newSequences.forEach(seq => {
        const problem = problems.value.find(p => p.problemId === seq.problemId)
        if (problem) {
          problem.sequence = seq.sequence
        }
      })
      // 重新排序
      problems.value.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    }

    await fetchProblems() // 刷新列表
  } catch (error) {
    console.error('更新题目顺序失败:', error)
    ElMessage.error('更新顺序失败: ' + (error.message || '请稍后重试'))
  }
}

// 搜索处理
function handleSearch() {
  // 搜索是通过计算属性 filteredProblems 自动处理的
  console.log('搜索关键词:', searchKeyword.value)
}

// 类型筛选处理
function handleFilter() {
  console.log('筛选类型:', filterType.value)
}

// 分值筛选处理
function handleScoreFilter() {
  console.log('分值范围:', minScore.value, '-', maxScore.value)
}

// 导出题目
async function exportProblems() {
  try {
    const selectedIds = selectedProblems.value.length > 0
      ? selectedProblems.value.map(p => p.problemId)
      : null

    try {
      // 尝试使用导出API
      const result = await problemAPI.exportProblems(homeworkId.value, selectedIds)

      // 创建下载链接
      const dataStr = JSON.stringify(result, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `题目导出_${homeworkData.value.title || 'homework'}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      ElMessage.success('题目导出成功')
    } catch (error) {
      console.warn('导出API不可用，使用本地导出:', error)
      // 本地导出
      exportProblemsLocally(selectedIds)
    }
  } catch (error) {
    console.error('导出题目失败:', error)
    ElMessage.error('导出失败: ' + (error.message || '请稍后重试'))
  }
}

// 本地导出题目（备用方案）
function exportProblemsLocally(selectedIds) {
  const exportData = {
    exportTime: new Date().toISOString(),
    assignmentInfo: {
      id: homeworkId.value,
      title: homeworkData.value.title,
      description: homeworkData.value.description
    },
    problems: selectedIds
      ? problems.value.filter(p => selectedIds.includes(p.problemId))
      : problems.value
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `题目导出_${homeworkData.value.title || 'homework'}_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('题目导出成功')
}

// 显示导入对话框
function showImportDialog() {
  importDialogVisible.value = true
  fileList.value = []
  importPreview.value = []
}

// 处理文件变化
function handleFileChange(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)

      // 解析导入数据
      let problems = []
      if (Array.isArray(data)) {
        problems = data
      } else if (data.problems && Array.isArray(data.problems)) {
        problems = data.problems
      } else {
        throw new Error('文件格式不正确，应包含题目数组')
      }

      // 验证题目数据
      const validProblems = problems.filter(problem => {
        return problem.title && problem.content && problem.type
      })

      if (validProblems.length === 0) {
        throw new Error('文件中没有有效的题目数据')
      }

      importPreview.value = validProblems.map(problem => ({
        ...problem,
        score: problem.score || 10,
        assignmentId: homeworkId.value,
        autoGrading: getAutoGrading(problem.type) // 根据题目类型自动设置自动评分
      }))

      ElMessage.success(`成功解析 ${validProblems.length} 道题目`)

    } catch (error) {
      console.error('解析文件失败:', error)
      ElMessage.error('文件解析失败: ' + error.message)
      importPreview.value = []
    }
  }

  reader.readAsText(file.raw)
}

// 确认导入
async function confirmImport() {
  if (importPreview.value.length === 0) {
    ElMessage.warning('没有可导入的题目')
    return
  }

  importing.value = true

  try {
    try {
      // 尝试使用批量导入API
      const result = await problemAPI.importProblems(homeworkId.value, importPreview.value)

      if (result.success) {
        ElMessage.success(`成功导入 ${result.successCount} 道题目`)
        if (result.failedCount > 0) {
          ElMessage.warning(`${result.failedCount} 道题目导入失败`)
        }
      }
    } catch (error) {
      console.warn('批量导入API不可用，使用逐个保存:', error)
      // 逐个保存题目
      await importProblemsOneByOne()
    }

    // 刷新题目列表和统计
    await fetchProblems()
    await refreshProblemStatistics()

    // 关闭对话框
    importDialogVisible.value = false
    fileList.value = []
    importPreview.value = []

  } catch (error) {
    console.error('导入题目失败:', error)
    ElMessage.error('导入失败: ' + (error.message || '请稍后重试'))
  } finally {
    importing.value = false
  }
}

// 逐个导入题目（备用方案）
async function importProblemsOneByOne() {
  let successCount = 0
  let failedCount = 0

  for (const problem of importPreview.value) {
    try {
      await problemAPI.saveProblem(problem)
      successCount++
    } catch (error) {
      console.error('保存题目失败:', error)
      failedCount++
    }
  }

  if (successCount > 0) {
    ElMessage.success(`成功导入 ${successCount} 道题目`)
  }
  if (failedCount > 0) {
    ElMessage.warning(`${failedCount} 道题目导入失败`)
  }
}

// 获取题目类型文本（用于导入预览）
function getProblemTypeText(type) {
  const typeMap = {
    'SINGLE_CHOICE': '单选题',
    'MULTI_CHOICE': '多选题',
    'FILL_BLANK': '填空题',
    'ESSAY_QUESTION': '简答题',
    'TRUE_FALSE': '判断题'
  }
  return typeMap[type] || '未知类型'
}

// 获取分数百分比
function getScorePercentage() {
  const score = getAverageScore()
  if (score === '暂无') return 0

  // 获取作业的总分值作为基准
  const maxPossibleScore = getMaxPossibleScore()
  if (maxPossibleScore > 0) {
    return Math.min(Math.round((score / maxPossibleScore) * 100), 100)
  }

  // 如果无法获取总分值，假设满分为100
  return Math.min(Math.round((score / 100) * 100), 100)
}

// 获取作业的最大可能分数
function getMaxPossibleScore() {
  if (problems.value && problems.value.length > 0) {
    return problems.value.reduce((sum, problem) => {
      return sum + (parseFloat(problem.score) || 0)
    }, 0)
  }
  return 100 // 默认满分
}

// 重新计算学生分数（用于验证和修正）
function recalculateStudentScore(submission) {
  if (!submission.answers || submission.answers.length === 0) {
    return 0
  }

  // 重新计算总分，优先使用 finalScore
  const recalculatedScore = submission.answers.reduce((sum, answer) => {
    const score = parseFloat(answer.finalScore) || parseFloat(answer.autoScore) || parseFloat(answer.score) || 0
    return sum + score
  }, 0)

  console.log(`学生 ${submission.studentId} 分数重新计算: 原分数=${submission.totalScore}, 重新计算=${recalculatedScore}`)

  return recalculatedScore
}

// 验证并修正所有学生的分数
function validateAndFixScores() {
  submissions.value.forEach(submission => {
    const recalculatedScore = recalculateStudentScore(submission)

    // 如果重新计算的分数与原分数差异较大，使用重新计算的分数
    if (Math.abs(recalculatedScore - (submission.totalScore || 0)) > 0.1) {
      console.log(`修正学生 ${submission.studentId} 的分数: ${submission.totalScore} -> ${recalculatedScore}`)
      submission.totalScore = recalculatedScore
    }
  })
}



// // 答案比较函数
// function compareAnswers(userAnswer, expectedAnswer, questionType) {
//   if (!userAnswer || !expectedAnswer) return false

//   // 标准化答案（去除空格，转换为大写）
//   const normalizeAnswer = (answer) => {
//     return String(answer).trim().toUpperCase()
//   }

//   const normalizedUser = normalizeAnswer(userAnswer)
//   const normalizedExpected = normalizeAnswer(expectedAnswer)

//   switch (questionType) {
//     case 'SINGLE_CHOICE':
//     case 'TRUE_FALSE':
//       return normalizedUser === normalizedExpected

//     case 'MULTI_CHOICE': {
//       // 多选题需要处理逗号分隔的选项
//       const userOptions = normalizedUser.split(',').sort().join(',')
//       const expectedOptions = normalizedExpected.split(',').sort().join(',')
//       return userOptions === expectedOptions
//     }

//     case 'FILL_BLANK': {
//       // 填空题支持多个可能的答案（用|分隔）
//       const possibleAnswers = normalizedExpected.split('|')
//       return possibleAnswers.some(possible => normalizedUser === possible.trim())
//     }

//     default:
//       return normalizedUser === normalizedExpected
//   }
// }

// ==================== 图表相关功能 ====================

// 题型文本映射
const problemTypeMap = {
  'SINGLE_CHOICE': '单选题',
  'MULTI_CHOICE': '多选题',
  'FILL_BLANK': '填空题',
  'ESSAY_QUESTION': '简答题',
  'TRUE_FALSE': '判断题'
}

// 初始化图表
function initCharts() {
  console.log('开始初始化图表...')

  nextTick(() => {
    // 等待DOM完全渲染和CSS样式应用
    setTimeout(() => {
      console.log('DOM元素检查:')
      console.log('typeCountChart:', typeCountChart.value)
      console.log('typeScoreChart:', typeScoreChart.value)

      if (typeCountChart.value) {
        try {
          if (typeCountChartInstance) {
            typeCountChartInstance.dispose()
            typeCountChartInstance = null
          }

          // 检查容器尺寸
          const containerWidth = typeCountChart.value.offsetWidth
          const containerHeight = typeCountChart.value.offsetHeight
          console.log('题型数量图表容器尺寸:', { width: containerWidth, height: containerHeight })

          // 如果容器尺寸为0，等待更长时间
          if (containerWidth === 0 || containerHeight === 0) {
            console.log('容器尺寸为0，延迟初始化...')
            setTimeout(() => initCharts(), 500)
            return
          }

          console.log('创建题型数量图表实例...')
          typeCountChartInstance = echarts.init(typeCountChart.value)
          console.log('题型数量图表实例创建成功')

        } catch (error) {
          console.error('创建题型数量图表失败:', error)
        }
      } else {
        console.error('typeCountChart DOM元素不存在')
      }

      if (typeScoreChart.value) {
        try {
          if (typeScoreChartInstance) {
            typeScoreChartInstance.dispose()
            typeScoreChartInstance = null
          }

          // 检查容器尺寸
          const containerWidth = typeScoreChart.value.offsetWidth
          const containerHeight = typeScoreChart.value.offsetHeight
          console.log('题型分值图表容器尺寸:', { width: containerWidth, height: containerHeight })

          // 如果容器尺寸为0，等待更长时间
          if (containerWidth === 0 || containerHeight === 0) {
            console.log('容器尺寸为0，延迟初始化...')
            setTimeout(() => initCharts(), 500)
            return
          }

          console.log('创建题型分值图表实例...')
          typeScoreChartInstance = echarts.init(typeScoreChart.value)
          console.log('题型分值图表实例创建成功')

        } catch (error) {
          console.error('创建题型分值图表失败:', error)
        }
      } else {
        console.error('typeScoreChart DOM元素不存在')
      }

      // 延迟更新真实数据并强制resize
      setTimeout(() => {
        console.log('开始更新真实图表数据...')
        updateCharts()

        // 设置容器尺寸观察器
        setupResizeObserver()

        // 多次resize确保图表正确显示
        setTimeout(() => {
          if (typeCountChartInstance) {
            typeCountChartInstance.resize()
            console.log('题型数量图表已resize')
          }
          if (typeScoreChartInstance) {
            typeScoreChartInstance.resize()
            console.log('题型分值图表已resize')
          }
        }, 100)

        // 再次resize确保万无一失
        setTimeout(() => {
          if (typeCountChartInstance) {
            typeCountChartInstance.resize()
          }
          if (typeScoreChartInstance) {
            typeScoreChartInstance.resize()
          }
        }, 500)

        // 最后一次resize，确保图表完全正确显示
        setTimeout(() => {
          if (typeCountChartInstance) {
            typeCountChartInstance.resize()
          }
          if (typeScoreChartInstance) {
            typeScoreChartInstance.resize()
          }
          console.log('图表最终resize完成')
        }, 1000)

      }, 300)

    }, 500) // 增加延迟时间，确保CSS样式完全应用
  })
}

// 更新图表数据
function updateCharts() {
  console.log('=== 开始更新图表数据 ===')
  console.log('图表实例状态:')
  console.log('typeCountChartInstance:', typeCountChartInstance)
  console.log('typeScoreChartInstance:', typeScoreChartInstance)
  console.log('problemStatistics:', problemStatistics.value)
  console.log('problems:', problems.value)

  // 检查图表实例是否存在
  if (!typeCountChartInstance || !typeScoreChartInstance) {
    console.log('图表实例不存在，跳过更新')
    return
  }

  // 准备题型数量数据
  let typeCountData = []

  // 如果有统计数据，使用统计数据
  if (problemStatistics.value && problemStatistics.value.typeStatistics) {
    typeCountData = Object.entries(problemStatistics.value.typeStatistics).map(([type, count]) => ({
      name: problemTypeMap[type] || type,
      value: count
    }))
    console.log('使用统计数据:', typeCountData)
  }
  // 否则从题目列表计算
  else if (problems.value && problems.value.length > 0) {
    const typeCountMap = {}
    problems.value.forEach(problem => {
      const type = problem.type || 'UNKNOWN'
      typeCountMap[type] = (typeCountMap[type] || 0) + 1
    })
    typeCountData = Object.entries(typeCountMap).map(([type, count]) => ({
      name: problemTypeMap[type] || type,
      value: count
    }))
    console.log('从题目列表计算:', typeCountData)
  }
  // 如果没有数据，使用测试数据
  else {
    typeCountData = [
      { name: '单选题', value: 2 },
      { name: '多选题', value: 1 }
    ]
    console.log('使用测试数据:', typeCountData)
  }

  // 计算题型分值数据
  const typeScoreData = calculateTypeScoreData()

  console.log('最终题型数量数据:', typeCountData)
  console.log('最终题型分值数据:', typeScoreData)

  // 更新题型数量图表
  if (typeCountChartInstance && typeCountData.length > 0) {
    try {
      console.log('开始设置题型数量图表...')
      const countOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}道题 ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: '10%',
          left: 'center'
        },
        series: [
          {
            name: '题目数量',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: typeCountData,
            label: {
              show: true,
              formatter: '{b}: {c}道'
            },
            itemStyle: {
              borderRadius: 5,
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        ],
        color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
      }

      typeCountChartInstance.setOption(countOption, true)
      console.log('题型数量图表设置成功')

      // 立即resize
      typeCountChartInstance.resize()

      // 延迟resize确保正确显示
      setTimeout(() => {
        typeCountChartInstance.resize()
        console.log('题型数量图表延迟resize完成')
      }, 100)

      // 再次延迟resize
      setTimeout(() => {
        typeCountChartInstance.resize()
      }, 300)

    } catch (error) {
      console.error('设置题型数量图表失败:', error)
    }
  } else {
    console.log('跳过题型数量图表更新:', {
      hasInstance: !!typeCountChartInstance,
      hasData: typeCountData.length > 0,
      data: typeCountData
    })
  }

  // 更新题型分值图表
  if (typeScoreChartInstance) {
    try {
      console.log('开始设置题型分值图表...')

      // 如果没有分值数据，使用测试数据
      let finalScoreData = typeScoreData
      if (!finalScoreData || finalScoreData.length === 0) {
        finalScoreData = [
          { name: '单选题', value: 20 },
          { name: '多选题', value: 15 }
        ]
        console.log('使用分值测试数据:', finalScoreData)
      }

      const scoreOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}分 ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: '10%',
          left: 'center'
        },
        series: [
          {
            name: '分值分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: finalScoreData,
            label: {
              show: true,
              formatter: '{b}: {c}分'
            },
            itemStyle: {
              borderRadius: 5,
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        ],
        color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
      }

      typeScoreChartInstance.setOption(scoreOption, true)
      console.log('题型分值图表设置成功')

      // 立即resize
      typeScoreChartInstance.resize()

      // 延迟resize确保正确显示
      setTimeout(() => {
        typeScoreChartInstance.resize()
        console.log('题型分值图表延迟resize完成')
      }, 100)

      // 再次延迟resize
      setTimeout(() => {
        typeScoreChartInstance.resize()
      }, 300)

    } catch (error) {
      console.error('设置题型分值图表失败:', error)
    }
  } else {
    console.log('跳过题型分值图表更新:', {
      hasInstance: !!typeScoreChartInstance
    })
  }
}

// 计算题型分值数据
function calculateTypeScoreData() {
  if (!problems.value || problems.value.length === 0) {
    return []
  }

  const typeScoreMap = {}

  problems.value.forEach(problem => {
    const type = problem.type || 'UNKNOWN'
    const score = problem.score || 0

    if (!typeScoreMap[type]) {
      typeScoreMap[type] = 0
    }
    typeScoreMap[type] += score
  })

  return Object.entries(typeScoreMap).map(([type, totalScore]) => ({
    name: problemTypeMap[type] || type,
    value: totalScore
  }))
}

// 窗口大小变化时重新调整图表
function handleResize() {
  console.log('窗口大小变化，调整图表尺寸...')
  if (typeCountChartInstance) {
    typeCountChartInstance.resize()
  }
  if (typeScoreChartInstance) {
    typeScoreChartInstance.resize()
  }
}

// 设置容器尺寸观察器
function setupResizeObserver() {
  if (typeof ResizeObserver !== 'undefined') {
    // 观察题型数量图表容器
    if (typeCountChart.value) {
      const resizeObserver1 = new ResizeObserver(() => {
        console.log('题型数量图表容器尺寸变化')
        if (typeCountChartInstance) {
          setTimeout(() => {
            typeCountChartInstance.resize()
          }, 50)
        }
      })
      resizeObserver1.observe(typeCountChart.value)
    }

    // 观察题型分值图表容器
    if (typeScoreChart.value) {
      const resizeObserver2 = new ResizeObserver(() => {
        console.log('题型分值图表容器尺寸变化')
        if (typeScoreChartInstance) {
          setTimeout(() => {
            typeScoreChartInstance.resize()
          }, 50)
        }
      })
      resizeObserver2.observe(typeScoreChart.value)
    }
  }
}

// 调试函数：检查图表状态
function debugChartStatus() {
  console.log('=== 图表调试信息 ===')
  console.log('typeCountChart DOM:', typeCountChart.value)
  console.log('typeScoreChart DOM:', typeScoreChart.value)
  console.log('typeCountChartInstance:', typeCountChartInstance)
  console.log('typeScoreChartInstance:', typeScoreChartInstance)
  console.log('problemStatistics:', problemStatistics.value)
  console.log('problems:', problems.value)
  console.log('problems length:', problems.value?.length)

  if (problems.value && problems.value.length > 0) {
    const typeCount = {}
    const typeScore = {}
    problems.value.forEach(p => {
      const type = p.type || 'UNKNOWN'
      typeCount[type] = (typeCount[type] || 0) + 1
      typeScore[type] = (typeScore[type] || 0) + (p.score || 0)
    })
    console.log('计算的题型数量:', typeCount)
    console.log('计算的题型分值:', typeScore)
  }
  console.log('==================')
}

// 获取作业详情
async function fetchHomeworkDetail() {
  try {
    isLoading.value = true
    const assignmentIdStr = homeworkId.value ? String(homeworkId.value) : ''
    
    if (!assignmentIdStr) {
      ElMessage.error('作业ID无效')
      router.back()
      return
    }
    
    const response = await assignmentAPI.getAssignmentById(assignmentIdStr)
    if (response) {
      homeworkData.value = {
        assignmentId: response.assignmentId,
        title: response.title || '',
        description: response.description || '',
        startTime: response.startTime || new Date().toISOString(),
        endTime: response.endTime || '',
        type: response.type || 'TEACHER_ASSIGNED',
        courseId: response.courseId || courseId.value,
        creatorId: response.creatorId || '',
        isAnswerPublic: response.isAnswerPublic || false,
        isScoreVisible: response.isScoreVisible || true,
        isRedoAllowed: response.isRedoAllowed || false,
        maxAttempts: response.maxAttempts || 1,
        status: response.status || 'DRAFT',
        originType: userRole === 'ROLE_TEACHER' ? 'TEACHER_ASSIGNED' : 'STUDENT_UPLOAD' // 根据用户角色设置 originType
      }
      
      // 获取题目列表
      await fetchProblems()

      // 获取题目统计信息
      await refreshProblemStatistics()

      // 获取课程学生总数
      totalStudentsCount.value = await getTotalStudentsCount()

      // 如果作业已发布，获取提交情况
      if (homeworkData.value.status !== 'DRAFT') {
        await fetchSubmissions()
      }
    } else {
      ElMessage.error('未找到作业详情')
      router.back()
    }
  } catch (error) {
    console.error('获取作业详情失败:', error)
    ElMessage.error(`获取作业详情失败: ${error.message || '请稍后重试'}`)
  } finally {
    isLoading.value = false
  }
}

// 获取题目列表
async function fetchProblems() {
  try {
    const assignmentIdStr = homeworkId.value ? String(homeworkId.value) : ''
    if (!assignmentIdStr) return

    const response = await problemAPI.getProblemsByAssignment(assignmentIdStr)
    problems.value = Array.isArray(response) ? response : []

    // 获取题目后更新图表
    nextTick(() => {
      updateCharts()
    })
  } catch (error) {
    console.error('获取题目列表失败:', error)
    ElMessage.error(`获取题目列表失败: ${error.message || '请稍后重试'}`)
  }
}

// 获取提交情况
async function fetchSubmissions() {
  try {
    console.log('=== 开始获取提交情况 ===')
    if (!homeworkId.value) {
      console.warn('作业ID不存在，无法获取提交情况')
      submissions.value = []
      return
    }
    console.log(`作业ID: ${homeworkId.value}`)

    // 方法1: 使用 studentAnswerAPI 获取基础答案数据
    const answers = await studentAnswerAPI.getAnswersByAssignment(homeworkId.value)

    if (Array.isArray(answers)) {
      // 按学生ID分组，统计每个学生的提交情况
      const submissionMap = new Map()

      // 处理基础答案数据
      answers.forEach(answer => {
        const studentId = answer.studentId
        if (!submissionMap.has(studentId)) {
          submissionMap.set(studentId, {
            studentId: studentId,
            answers: [],
            totalScore: 0,
            submittedAt: answer.createdAt || answer.updatedAt,
            examDetails: null, // 存储考试详情
            analysisResult: null, // 存储智能分析结果
            learningAdvice: null // 存储学习建议
          })
        }

        const submission = submissionMap.get(studentId)
        submission.answers.push(answer)

        // 使用答案的最终得分，优先使用 finalScore，其次是 autoScore，最后是 score
        const answerScore = parseFloat(answer.finalScore) || parseFloat(answer.autoScore) || parseFloat(answer.score) || 0
        submission.totalScore += answerScore

        // 记录答案详情用于调试
        console.log(`学生 ${studentId} 答案: 题目ID=${answer.problemId}, finalScore=${answer.finalScore}, autoScore=${answer.autoScore}, score=${answer.score}, 使用得分=${answerScore}, 累计总分=${submission.totalScore}`)

        // 更新最新提交时间
        if (answer.updatedAt && (!submission.submittedAt || answer.updatedAt > submission.submittedAt)) {
          submission.submittedAt = answer.updatedAt
        }
      })

      // 方法2: 为每个学生获取详细的考试信息（如果作业ID可以作为考试ID使用）
      console.log(`准备为 ${submissionMap.size} 个学生获取详细信息`)
      const submissionPromises = Array.from(submissionMap.values()).map(async (submission) => {
        try {
          console.log(`处理学生提交数据:`, submission)

          // 获取学生姓名
          try {
            console.log(`开始获取学生 ${submission.studentId} 的信息...`)
            const studentInfo = await teacherAPI.getStudentById(submission.studentId)
            console.log(`学生 ${submission.studentId} 的完整信息:`, studentInfo)
            submission.studentName = studentInfo.fullName || `学生${submission.studentId}`
            console.log(`成功获取学生 ${submission.studentId} 姓名: ${submission.studentName}`)
          } catch (error) {
            console.error(`获取学生 ${submission.studentId} 姓名失败:`, error)
            console.error('错误详情:', error.response?.data || error.message)
            submission.studentName = `学生${submission.studentId}`
          }

          // 获取学生的考试详情（可选，失败不影响学生姓名显示）
          try {
            const examDetails = await studentExamAPI.getExamDetail(submission.studentId, homeworkId.value)
            submission.examDetails = examDetails
          } catch (error) {
            console.warn(`获取学生 ${submission.studentId} 考试详情失败:`, error.message)
            submission.examDetails = null
          }

          // 获取学生的考试成绩（可选，失败不影响学生姓名显示）
          try {
            const examScore = await studentExamAPI.getExamScore(submission.studentId, homeworkId.value)
            if (examScore && examScore.totalScore !== undefined) {
              // 比较基础计算分数和API分数，使用更合理的那个
              const apiScore = parseFloat(examScore.totalScore) || 0
              const calculatedScore = submission.totalScore || 0

              // 如果API分数明显更合理（非零且不同），则使用API分数
              if (apiScore > 0 && (calculatedScore === 0 || Math.abs(apiScore - calculatedScore) > 0.1)) {
                console.log(`学生 ${submission.studentId}: 使用API分数 ${apiScore} 替代计算分数 ${calculatedScore}`)
                submission.totalScore = apiScore
              }
            }
          } catch (error) {
            console.warn(`获取学生 ${submission.studentId} 考试成绩失败:`, error.message)
          }

          // 获取智能分析结果（可选，失败不影响学生姓名显示）
          try {
            const analysisResult = await studentExamAPI.analyzeExamResult(submission.studentId, homeworkId.value)
            submission.analysisResult = analysisResult
          } catch (error) {
            console.warn(`获取学生 ${submission.studentId} 智能分析失败:`, error.message)
            submission.analysisResult = null
          }

          // 获取学习建议（可选，失败不影响学生姓名显示）
          try {
            const learningAdvice = await studentExamAPI.generateLearningAdvice(submission.studentId, homeworkId.value)
            submission.learningAdvice = learningAdvice
          } catch (error) {
            console.warn(`获取学生 ${submission.studentId} 学习建议失败:`, error.message)
            submission.learningAdvice = null
          }

        } catch (error) {
          console.warn(`获取学生 ${submission.studentId} 的详细信息失败:`, error.message)
          // 即使获取详细信息失败，也保留基础的提交数据
          submission.studentName = `学生${submission.studentId}`
        }

        return submission
      })

      // 等待所有详细信息获取完成，使用 Promise.allSettled 确保不会因为单个失败而中断
      const results = await Promise.allSettled(submissionPromises)
      const enhancedSubmissions = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)

      // 记录失败的情况
      const failedResults = results.filter(result => result.status === 'rejected')
      if (failedResults.length > 0) {
        console.warn(`${failedResults.length} 个学生信息处理失败:`, failedResults.map(r => r.reason))
      }

      submissions.value = enhancedSubmissions

      console.log(`获取到 ${submissions.value.length} 个学生的提交情况（包含详细信息）`)

      // 调试信息：打印每个学生的分数和姓名
      submissions.value.forEach(submission => {
        console.log(`学生 ${submission.studentId} (${submission.studentName}) 总分: ${submission.totalScore}, 答案数量: ${submission.answers.length}`)
      })

      // 验证并修正分数
      validateAndFixScores()

      // 计算并打印平均分调试信息
      const validSubmissions = submissions.value.filter(s => s.totalScore !== null && s.totalScore !== undefined && s.totalScore >= 0)
      if (validSubmissions.length > 0) {
        const totalScore = validSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0)
        const average = totalScore / validSubmissions.length
        console.log(`平均分计算: 总分=${totalScore}, 有效提交数=${validSubmissions.length}, 平均分=${average.toFixed(1)}`)
      }
    } else {
      submissions.value = []
      console.log('暂无学生提交数据')
    }
  } catch (error) {
    console.error('获取提交情况失败:', error)
    submissions.value = []
  }
}

// 更新作业数据
function updateHomeworkData(newData) {
  // 只复制修改的字段，而不是整个对象引用
  if (newData) {
    homeworkData.value = {
      ...homeworkData.value,
      title: newData.title,
      description: newData.description,
      startTime: newData.startTime,
      endTime: newData.endTime,
      isAnswerPublic: newData.isAnswerPublic,
      isScoreVisible: newData.isScoreVisible,
      isRedoAllowed: newData.isRedoAllowed,
      maxAttempts: newData.maxAttempts,
      originType: newData.originType // 更新 originType
    }
  }
}

// 更新题目列表
function updateProblems(newProblems) {
  problems.value = [...newProblems]
}

// 保存作业
async function saveHomework() {
  try {
    isSaving.value = true
    
    // 验证必填字段
    if (!homeworkData.value.title) {
      ElMessage.warning('请填写作业标题')
      activeTab.value = 'basic'
      return
    }
    
    if (!homeworkData.value.endTime) {
      ElMessage.warning('请设置截止日期')
      activeTab.value = 'basic'
      return
    }
    
    // 准备请求数据
    const assignmentData = {
      assignmentId: homeworkData.value.assignmentId,
      title: homeworkData.value.title,
      description: homeworkData.value.description || '',
      startTime: homeworkData.value.startTime || new Date().toISOString(),
      endTime: homeworkData.value.endTime,
      type: homeworkData.value.type || 'TEACHER_ASSIGNED',
      courseId: homeworkData.value.courseId || courseId.value,
      creatorId: homeworkData.value.creatorId,
      isAnswerPublic: homeworkData.value.isAnswerPublic || false,
      isScoreVisible: homeworkData.value.isScoreVisible || true,
      isRedoAllowed: homeworkData.value.isRedoAllowed || false,
      maxAttempts: homeworkData.value.maxAttempts || 1,
      status: homeworkData.value.status || 'DRAFT',
      originType: homeworkData.value.originType || 'TEACHER_ASSIGNED' // 保存 originType
    }
    
    // 调用API更新作业
    const response = await assignmentAPI.updateAssignment(assignmentData)
    
    if (response) {
      // 更新本地数据
      homeworkData.value = {
        ...homeworkData.value,
        ...response
      }
      
      ElMessage.success('作业保存成功')
    } else {
      ElMessage.error('作业保存失败')
    }
  } catch (error) {
    console.error('保存作业失败:', error)
    ElMessage.error(`保存作业失败: ${error.message || '请稍后重试'}`)
  } finally {
    isSaving.value = false
  }
}

// 发布作业
async function publishHomework() {
  try {
    if (problems.value.length === 0) {
      ElMessage.warning('作业至少需要包含一道题目才能发布')
      activeTab.value = 'problems'
      return
    }
    
    // 确认发布
    await ElMessageBox.confirm(
      '发布后学生将能够看到此作业。确定要发布吗？',
      '发布作业',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 更新状态为已发布
    homeworkData.value.status = 'PUBLISHED'
    
    // 保存作业
    await saveHomework()
    
    ElMessage.success('作业已成功发布')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布作业失败:', error)
      ElMessage.error(`发布作业失败: ${error.message || '请稍后重试'}`)
    }
  }
}

// 显示添加题目对话框
function showAddProblemDialog() {
  problemDialogTitle.value = '添加题目'
  const defaultType = 'SINGLE_CHOICE'
  currentProblem.value = {
    title: '',
    content: '',
    type: defaultType,
    options: [],
    expectedAnswer: '',
    score: 10,
    assignmentId: homeworkId.value,
    autoGrading: getAutoGrading(defaultType) // 根据默认题目类型设置自动评分
  }
  addProblemDialogVisible.value = true
}

// 编辑题目
function editProblem(problem) {
  problemDialogTitle.value = '编辑题目'
  currentProblem.value = { ...problem }
  addProblemDialogVisible.value = true
}

// 删除题目
async function deleteProblem(problem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除题目"${problem.title || '未命名题目'}"吗？`,
      '删除题目',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用API删除题目
    await problemAPI.deleteProblem(problem.problemId)
    
    // 更新本地列表
    problems.value = problems.value.filter(p => p.problemId !== problem.problemId)
    
    ElMessage.success('题目删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除题目失败:', error)
      ElMessage.error(`删除题目失败: ${error.message || '请稍后重试'}`)
    }
  }
}

// 保存题目
async function saveProblem(problemData) {
  try {
    // 确保在保存题目时包含所有必需字段
    const problemToSave = {
      problemId: problemData.problemId || null, // 如果有问题ID则传入
      assignmentId: homeworkId.value, // 作业ID
      originType: homeworkData.value.originType, // originType
      title: problemData.title, // 题目标题
      content: problemData.content, // 题目内容
      type: problemData.type, // 题目类型
      autoGrading: getAutoGrading(problemData.type), // 根据题目类型自动判定是否支持自动评分
      expectedAnswer: problemData.expectedAnswer || '', // 标准答案
      score: problemData.score || 10, // 题目分值
      sequence: problems.value.length + 1, // 设置题目序号
      createdAt: new Date().toISOString(), // 创建时间
      updatedAt: new Date().toISOString() // 更新时间
    }
    
    const response = await problemAPI.saveProblem(problemToSave)
    if (response) {
      ElMessage.success('题目保存成功')
      await fetchProblems() // 刷新题目列表
      addProblemDialogVisible.value = false // 关闭对话框
    } else {
      ElMessage.error('题目保存失败')
    }
  } catch (error) {
    console.error('保存题目失败:', error)

    // 处理特定的后端验证错误
    let errorMessage = '保存题目失败'

    if (error.response && error.response.data) {
      const responseData = error.response.data

      // 检查是否是参考答案长度限制错误
      if (responseData.message && responseData.message.includes('参考答案长度')) {
        errorMessage = '后端限制：参考答案长度应在1到300个字符之间。如需更长答案，请联系管理员调整后端限制。'
      } else if (responseData.message) {
        errorMessage = responseData.message
      } else if (typeof responseData === 'string') {
        errorMessage = responseData
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
  }
}

// 页面加载时获取数据
onMounted(async () => {
  try {
    await fetchHomeworkDetail()

    // 初始化图表
    nextTick(() => {
      initCharts()
      // 添加窗口大小变化监听
      window.addEventListener('resize', handleResize)

      // 调试信息
      setTimeout(() => {
        debugChartStatus()
      }, 1000)
    })
  } catch (error) {
    console.error('页面初始化失败:', error)
  }
})

// 组件卸载时清理图表资源
onUnmounted(() => {
  if (typeCountChartInstance) {
    typeCountChartInstance.dispose()
    typeCountChartInstance = null
  }
  if (typeScoreChartInstance) {
    typeScoreChartInstance.dispose()
    typeScoreChartInstance = null
  }

  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize)
})

// ==================== AI生成习题相关方法 ====================

// 显示AI生成习题对话框
const showAIGenerateDialog = async () => {
  aiDialogVisible.value = true
  // 重置表单
  aiForm.value = {
    generateType: 'course',
    courseName: '',
    knowledgeInput: '',
    difficultyLevel: '中等',
    problemCount: 5
  }

  // 加载课程列表
  await loadCourseList()
}

// 加载课程列表
const loadCourseList = async () => {
  try {
    const res = await courseAPI.getAllCourses()
    courseList.value = res || []
    console.log('加载课程列表成功:', courseList.value)
  } catch (error) {
    console.error('加载课程列表失败:', error)
    ElMessage.error('加载课程列表失败')
    courseList.value = []
  }
}

// 处理生成方式变化
const handleGenerateTypeChange = () => {
  // 清空相关字段
  if (aiForm.value.generateType === 'course') {
    aiForm.value.courseName = ''
  } else if (aiForm.value.generateType === 'knowledge') {
    aiForm.value.knowledgeInput = ''
  }
}


// 生成AI习题
const generateAIExercises = async () => {
  if (!aiFormRef.value) return

  await aiFormRef.value.validate(async (valid) => {
    if (valid) {
      aiGenerating.value = true
      try {
        let response

        if (aiForm.value.generateType === 'course') {
          // 基于课程生成习题
          response = await studentAssistantAPI.generateExerciseByCourseName(
            teacherId, // 注意：这里使用teacherId作为studentId参数
            aiForm.value.courseName,
            aiForm.value.difficultyLevel,
            aiForm.value.problemCount
          )
        } else {
          // 基于知识点生成习题
          // 将输入的知识点字符串转换为数组
          const knowledgeArray = aiForm.value.knowledgeInput
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)

          response = await studentAssistantAPI.generateExerciseByKnowledgeNames(
            teacherId, // 注意：这里使用teacherId作为studentId参数
            knowledgeArray,
            aiForm.value.difficultyLevel,
            aiForm.value.problemCount
          )
        }

        console.log('AI生成习题响应:', response)

        // 处理响应数据
        if (response && Array.isArray(response)) {
          aiGeneratedExercises.value = response
        } else if (response && response.exercises && Array.isArray(response.exercises)) {
          aiGeneratedExercises.value = response.exercises
        } else if (response && response.data && Array.isArray(response.data)) {
          aiGeneratedExercises.value = response.data
        } else {
          // 如果响应格式不符合预期，尝试解析
          aiGeneratedExercises.value = [response].filter(Boolean)
        }

        ElMessage.success(`成功生成 ${aiGeneratedExercises.value.length} 道习题`)
        aiDialogVisible.value = false

        // 滚动到AI习题展示区域
        nextTick(() => {
          const aiContainer = document.querySelector('.ai-exercises-container')
          if (aiContainer) {
            aiContainer.scrollIntoView({ behavior: 'smooth' })
          }
        })

      } catch (error) {
        console.error('AI生成习题失败:', error)
        let errorMessage = 'AI生成习题失败'

        // 特殊处理超时错误
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
          errorMessage = 'AI生成习题超时，请稍后重试。生成过程可能需要较长时间，请耐心等待。'
        } else if (error.response && error.response.data) {
          if (error.response.data.message) {
            errorMessage += ': ' + error.response.data.message
          } else if (error.response.data.error) {
            errorMessage += ': ' + error.response.data.error
          }
        } else if (error.message) {
          errorMessage += ': ' + error.message
        }

        ElMessage.error(errorMessage)
      } finally {
        aiGenerating.value = false
      }
    } else {
      ElMessage.warning('请完善表单信息')
    }
  })
}

// 复制习题内容
const copyExercise = async (exercise) => {
  try {
    // 构建要复制的文本内容
    let copyText = `题目：${exercise.question || exercise.title || '暂无题目内容'}\n`

    if (exercise.options && exercise.options.length > 0) {
      copyText += '\n选项：\n'
      exercise.options.forEach((option, index) => {
        copyText += `${String.fromCharCode(65 + index)}. ${option}\n`
      })
    }

    if (exercise.answer) {
      copyText += `\n答案：${exercise.answer}\n`
    }

    if (exercise.explanation) {
      copyText += `\n解析：${exercise.explanation}\n`
    }

    // 使用现代浏览器的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(copyText)
    } else {
      // 降级方案：使用传统的 document.execCommand
      const textArea = document.createElement('textarea')
      textArea.value = copyText
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }

    ElMessage.success('习题内容已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}



// 清空AI生成的习题
const clearAIExercises = () => {
  aiGeneratedExercises.value = []
  ElMessage.success('已清空AI生成的习题')
}

// 获取难度等级对应的标签类型
// const getDifficultyType = (difficulty) => {
//   switch(difficulty) {
//     case '简单':
//       return 'success'
//     case '中等':
//       return 'warning'
//     case '困难':
//       return 'danger'
//     default:
//       return 'info'
//   }
// }
</script>

<style scoped>
.homework-detail {
  padding: 20px;
  height: calc(100vh - 84px);
  overflow-y: auto;
}

/* 顶部导航样式 */
.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
}

.back-button {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 15px;
  color: #409EFF;
  font-size: 14px;
}

.back-button .el-icon {
  margin-right: 5px;
}

.course-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.status-tag {
  margin-left: 10px;
  position: relative;
  top: -3px;
}

.course-actions {
  display: flex;
  gap: 10px;
}

/* 内容区域样式 */
.course-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.course-tabs {
  padding: 20px;
}

.empty-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.empty-sub-text {
  color: #909399;
  font-size: 14px;
  margin-top: 8px;
}

/* 统计卡片样式 */
.stats-section {
  margin-top: 20px;
  padding: 0 20px 20px;
}

.stats-card {
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #606266;
}

.card-header i {
  margin-left: 8px;
  font-size: 16px;
  color: #909399;
}

.stats-content {
  padding: 10px;
  text-align: center;
}

.stats-number {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.stats-unit {
  font-size: 16px;
  color: #909399;
}

.stats-subtitle {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.stats-number.ended {
  color: #f56c6c;
}

.stats-progress-bar {
  height: 6px;
  background-color: #f5f7fa;
  border-radius: 3px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-bar {
  height: 100%;
  background-color: #67c23a;
  border-radius: 3px;
}

/* 提交情况相关样式 */
.submissions-container {
  padding: 20px;
  width: 100%;
}

.submissions-container .el-table {
  width: 100% !important;
}

.submissions-container .el-table th,
.submissions-container .el-table td {
  text-align: center;
}

.submissions-container .el-table th.el-table__cell:first-child,
.submissions-container .el-table td.el-table__cell:first-child {
  text-align: left;
}

.submissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.submissions-header h3 {
  margin: 0;
  color: #303133;
}

.submissions-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

/* 对话框内容样式 */
.el-dialog pre {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}

.el-dialog .el-card {
  border: 1px solid #e4e7ed;
}

.el-dialog .el-card p {
  margin: 0;
  line-height: 1.6;
}

/* 题目管理增强功能样式 */
.problem-management-enhanced {
  padding: 20px;
}

.problem-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
}

.problem-statistics {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.problem-search {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.score-range {
  display: flex;
  align-items: center;
  gap: 5px;
}

.score-range span {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

/* 统计卡片样式优化 */
.el-statistic {
  text-align: center;
}

.el-statistic .el-statistic__head {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.el-statistic .el-statistic__content {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .problem-toolbar {
    flex-direction: column;
    gap: 15px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }

  .problem-search .el-row {
    flex-direction: column;
  }

  .problem-search .el-col {
    width: 100% !important;
    margin-bottom: 10px;
  }

  .score-range {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 导入对话框样式 */
.import-dialog-content {
  padding: 20px 0;
}

.import-preview {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.import-preview h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.el-upload {
  width: 100%;
}

.el-upload .el-upload-dragger {
  width: 100%;
}

/* 图表相关样式 */
.problem-charts {
  margin-top: 20px;
  margin-bottom: 20px;
}

.chart-card {
  height: 500px;
  overflow: hidden;
}

.chart-card .el-card__body {
  height: calc(100% - 60px);
  padding: 20px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.chart-header .el-icon {
  color: #909399;
  cursor: help;
  font-size: 16px;
}

.chart-container {
  width: 100%;
  height: 400px;
  min-height: 400px;
}

/* 响应式图表 */
@media (max-width: 1200px) {
  .chart-card {
    height: 450px;
  }

  .chart-container {
    height: 350px;
    min-height: 350px;
  }
}

@media (max-width: 768px) {
  .problem-charts .el-col {
    margin-bottom: 20px;
  }

  .chart-card {
    height: 400px;
  }

  .chart-container {
    height: 300px;
    min-height: 300px;
  }

  .chart-header {
    font-size: 14px;
  }
}

/* AI生成习题样式 */
.ai-exercises-container {
  margin-top: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fffa 0%, #f0fff4 100%);
  border: 2px solid #52c41a;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.1);
}

.ai-exercises-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #d9f7be;
}

.ai-exercises-title {
  display: flex;
  align-items: center;
  margin: 0;
  color: #389e0d;
  font-size: 18px;
  font-weight: 600;
}

.ai-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #52c41a;
}

.ai-exercises-actions {
  display: flex;
  gap: 10px;
}

.ai-exercises-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exercise-item {
  background: white;
  border: 1px solid #e8f5e8;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.exercise-item:hover {
  box-shadow: 0 4px 16px rgba(82, 196, 26, 0.12);
  transform: translateY(-1px);
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(90deg, #f6ffed 0%, #f0fff4 100%);
  border-bottom: 1px solid #e8f5e8;
}

.exercise-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exercise-number {
  font-weight: 600;
  color: #389e0d;
  font-size: 16px;
}

.difficulty-tag {
  font-size: 12px;
}

.exercise-content {
  padding: 20px;
}

.content-line {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #262626;
  font-size: 14px;
}

.content-line:last-child {
  margin-bottom: 0;
}

.content-line:first-child {
  font-weight: 500;
  color: #303133;
  font-size: 15px;
}

.answer-line {
  color: #1890ff;
  font-weight: 500;
}

.explanation-line {
  color: #ad6800;
  font-style: italic;
}

.option-inline {
  margin-right: 16px;
}

.option-separator {
  margin-right: 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>









