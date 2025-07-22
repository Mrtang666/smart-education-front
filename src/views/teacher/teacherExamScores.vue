<!-- 待数据测试 -->
<template>
  <div class="exam-scores-page">
    <div class="page-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="page-title">{{ examTitle }} - 考试成绩</h1>
      </div>
      <div class="course-info">
        <span>所属课程: {{ courseName }}</span>
      </div>
    </div>

    <div class="page-content">
      <!-- 考试统计信息 -->
      <div class="statistics-container" v-if="examStatistics.totalStudents > 0">
        <div class="statistics-cards">
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.totalStudents }}</div>
            <div class="stat-label">总学生数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.submittedStudents }}</div>
            <div class="stat-label">已提交</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.averageScore.toFixed(1) }}</div>
            <div class="stat-label">平均分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.maxScore }}</div>
            <div class="stat-label">最高分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.minScore }}</div>
            <div class="stat-label">最低分</div>
          </div>
        </div>
      </div>

      <!-- 图表分析区域 -->
      <div class="charts-section">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="chart-container">
              <div id="scoreDistributionChart" style="height: 350px;"></div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="chart-container">
              <div id="questionTypeChart" style="height: 350px;"></div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="8">
            <div class="chart-container">
              <div id="passRateChart" style="height: 300px;"></div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="chart-container">
              <div id="scoreRangeChart" style="height: 300px;"></div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="chart-container">
              <div id="completionChart" style="height: 300px;"></div>
            </div>
          </el-col>
        </el-row>


      </div>

      <div class="scores-container">
        <div class="scores-header">
          <div class="header-left">
            <h2>学生成绩列表</h2>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索学生姓名或学号"
              prefix-icon="Search"
              clearable
              @clear="handleSearchClear"
              @input="handleSearchInput"
              style="width: 250px;"
            />
          </div>
        </div>

        <div class="scores-body">
          <el-table
            :data="filteredStudents"
            style="width: 100%"
            v-loading="isLoading"
            :empty-text="isLoading ? '加载中...' : '还没有学生完成作答哦'"
          >
            <el-table-column label="用户名" min-width="120" sortable align="center" header-align="center">
              <template #default="scope">
                {{ scope.row.studentId }}
              </template>
            </el-table-column>
            <el-table-column label="姓名" min-width="120" sortable align="center" header-align="center">
              <template #default="scope">
                {{ scope.row.fullName }}
              </template>
            </el-table-column>
            <el-table-column label="邮箱" min-width="200" sortable align="center" header-align="center">
              <template #default="scope">
                {{ scope.row.email }}
              </template>
            </el-table-column>
            <el-table-column prop="score" label="分数" min-width="100" sortable align="center" header-align="center">
              <template #default="scope">
                <span :class="getScoreClass(scope.row.score)">{{ scope.row.score || '未参加' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="提交时间" min-width="180" sortable align="center" header-align="center">
              <template #default="scope">
                {{ formatDateTime(scope.row.submitTime) || '未提交' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="120" align="center" header-align="center">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status || '未知' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="150" fixed="right" align="center" header-align="center">
              <template #default="scope">
                <el-button link type="primary" @click="viewStudentDetail(scope.row)" :disabled="!scope.row.score">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container" v-if="examStudents.length > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredStudents.length"
            />
          </div>
        </div>
      </div>

      <div class="scores-analysis" v-if="examStudents.length > 0">
        <div class="analysis-header">
          <h2>成绩分析</h2>
        </div>
        <div class="analysis-body">
          <div class="statistics-cards">
            <div class="stat-card">
              <div class="stat-title">参考人数</div>
              <div class="stat-value">{{ examStudents.filter(s => s.status === '已完成').length }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">平均分</div>
              <div class="stat-value">{{ averageScore }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">最高分</div>
              <div class="stat-value">{{ maxScore }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">最低分</div>
              <div class="stat-value">{{ minScore }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">及格率</div>
              <div class="stat-value">{{ passRate }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 题目列表区域 -->
      <div class="questions-container">
        <div class="questions-header">
          <h2>考试题目列表</h2>
          <div class="header-actions">
            <el-button @click="refreshQuestions" :loading="isLoadingQuestions" type="primary">
              <el-icon><Refresh /></el-icon>
              刷新题目
            </el-button>
          </div>
        </div>

        <!-- 题目管理工具栏 -->
        <div class="question-toolbar" style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
          <el-button type="primary" @click="handleAddQuestion">添加题目</el-button>
          <el-button type="success" @click="showAIDialog" :icon="MagicStick">AI生成习题</el-button>
          <el-button type="danger" :disabled="!selectedQuestions.length" @click="handleBatchDelete">批量删除 ({{ selectedQuestions.length }})</el-button>
        </div>

        <!-- 题目统计信息 -->
        <div class="question-statistics">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="题目总数" :value="questionStatistics.totalCount" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总分数" :value="questionStatistics.totalScore" suffix="分" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="平均分值" :value="questionStatistics.averageScore" suffix="分" :precision="1" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="题目类型" :value="Object.keys(questionStatistics.typeStatistics || {}).length" suffix="种" />
            </el-col>
          </el-row>
        </div>

        <!-- 题目搜索和筛选 -->
        <div class="question-search" v-if="examQuestions.length > 0">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-input
                v-model="questionSearchKeyword"
                placeholder="搜索题目内容"
                @input="handleQuestionSearch"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="6">
              <el-select v-model="questionFilterType" placeholder="筛选题目类型" @change="handleQuestionFilter" clearable>
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
                <el-input-number v-model="questionMinScore" :min="0" :max="100" placeholder="最小分值" style="width: 120px;" />
                <span style="margin: 0 10px;">-</span>
                <el-input-number v-model="questionMaxScore" :min="0" :max="100" placeholder="最大分值" style="width: 120px;" />
                <el-button @click="handleQuestionScoreFilter" style="margin-left: 10px;">筛选</el-button>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 题目列表 -->
        <div class="questions-body">
          <div v-if="examQuestions.length === 0" class="empty-questions">
            <el-empty description="暂无题目数据" :image-size="200">
              <template #description>
                <p>暂无考试题目数据</p>
                <p class="empty-sub-text">请检查考试配置或联系管理员</p>
              </template>
            </el-empty>
          </div>
          
          <div v-else-if="filteredQuestions.length === 0" class="empty-questions">
            <el-empty description="暂无符合条件的题目" :image-size="200">
              <template #description>
                <p>没有找到符合条件的题目</p>
                <p class="empty-sub-text">请尝试调整搜索条件或筛选条件</p>
              </template>
            </el-empty>
          </div>
          
          <div v-else class="questions-list">
            <div class="questions-summary">
              共找到 {{ filteredQuestions.length }} 道题目
            </div>
            <el-table
              :data="filteredQuestions"
              style="width: 100%"
              border
              stripe
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column label="序号" type="index" width="60" />
              <el-table-column prop="content" label="题目内容" min-width="200">
                <template #default="scope">
                  <span>{{ truncateText(getQuestionContent(scope.row), 50) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="questionType" label="题型" width="100">
                <template #default="scope">
                  <el-tag size="small" :type="getQuestionTypeTagType(scope.row.questionType)">
                    {{ getQuestionTypeText(scope.row.questionType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="difficulty" label="难度" width="100">
                <template #default="scope">
                  <el-tag size="small" :type="getDifficultyType(scope.row.difficulty)">
                    {{ getDifficultyText(scope.row.difficulty) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="scorePoints" label="分值" width="80" />
              <el-table-column prop="referenceAnswer" label="参考答案" min-width="120">
                <template #default="scope">
                  <span>{{ truncateText(scope.row.referenceAnswer, 30) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right">
                <template #default="scope">
                  <el-button size="small" @click="editQuestion(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteQuestion(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 学生详情对话框 -->
    <el-dialog v-model="studentDetailVisible" :title="`${currentStudent?.fullName || '学生'} 的考试详情`" width="600px">
      <div v-if="currentStudent" class="student-detail">
        <div class="detail-header">
          <div class="detail-info">
            <div class="info-item">
              <span class="label">学号:</span>
              <span class="value">{{ currentStudent.studentId }}</span>
            </div>
            <div class="info-item">
              <span class="label">姓名:</span>
              <span class="value">{{ currentStudent.fullName }}</span>
            </div>
            <div class="info-item">
              <span class="label">分数:</span>
              <span class="value" :class="getScoreClass(currentStudent.score)">{{ currentStudent.score || '未参加' }}</span>
            </div>
            <div class="info-item">
              <span class="label">提交时间:</span>
              <span class="value">{{ formatDateTime(currentStudent.submitTime) || '未提交' }}</span>
            </div>
          </div>
        </div>
        <div class="detail-content">
          <h3>答题详情</h3>
          <div class="loading-container" v-if="isLoadingDetail">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
          <div v-else-if="studentAnswers.length > 0" class="answers-list">
            <div v-for="(answer, index) in studentAnswers" :key="answer.answerId" class="answer-item">
              <div class="question-content">
                <div class="question-number">问题 {{ index + 1 }}</div>
                <div class="question-text">{{ answer.questionContent }}</div>
              </div>
              <div class="answer-content">
                <div class="answer-label">学生答案:</div>
                <div class="answer-text">{{ answer.answerContent || '未作答' }}</div>
              </div>
              <div class="score-info">
                <div class="score-label">得分:</div>
                <div class="score-value" :class="getDetailScoreClass(answer.score, answer.totalScore)">
                  {{ answer.score || 0 }} / {{ answer.totalScore || 0 }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">暂无答题详情数据</div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="studentDetailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 题目编辑弹窗 -->
    <el-dialog v-model="showEditDialog" :title="editingQuestion ? '编辑题目' : '添加题目'" width="800px">
      <div class="edit-form">
        <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="90px">
          <el-form-item label="题目内容" prop="content">
            <el-input v-model="editForm.content" type="textarea" :rows="3" placeholder="请输入题目内容" />
          </el-form-item>
          <el-form-item label="题型" prop="questionType">
            <el-select v-model="editForm.questionType" placeholder="请选择题型">
              <el-option label="单选题" value="SINGLE_CHOICE" />
              <el-option label="多选题" value="MULTI_CHOICE" />
              <el-option label="填空题" value="FILL_BLANK" />
              <el-option label="简答题" value="ESSAY_QUESTION" />
              <el-option label="判断题" value="TRUE_FALSE" />
            </el-select>
          </el-form-item>

          <!-- 选项编辑区，仅选择题/多选题/判断题显示 -->
          <template v-if="['SINGLE_CHOICE','MULTI_CHOICE','TRUE_FALSE'].includes(editForm.questionType)">
            <el-form-item label="选项">
              <div v-for="(option, index) in editForm.options" :key="option.key" style="display:flex;align-items:center;margin-bottom:8px;">
                <div style="width:24px;">{{ option.key }}.</div>
                <el-input v-model="option.text" placeholder="请输入选项内容" :disabled="editForm.questionType==='TRUE_FALSE'" style="flex:1;" />
                <el-button @click="removeOption(index)" type="danger" circle plain v-if="editForm.options.length > 2 && editForm.questionType!=='TRUE_FALSE'">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button @click="addOption" type="primary" plain v-if="editForm.questionType!=='TRUE_FALSE' && editForm.options.length < 6">
                <el-icon><Plus /></el-icon>添加选项
              </el-button>
            </el-form-item>
          </template>

          <!-- 参考答案 -->
          <el-form-item label="参考答案" prop="referenceAnswer">
            <template v-if="['SINGLE_CHOICE','TRUE_FALSE'].includes(editForm.questionType)">
              <el-select v-model="editForm.referenceAnswer" placeholder="请选择正确答案">
                <el-option v-for="option in editForm.options" :key="option.key" :label="option.key" :value="option.key" />
              </el-select>
            </template>
            <template v-else-if="editForm.questionType==='MULTI_CHOICE'">
              <el-select v-model="editForm.referenceAnswer" multiple placeholder="请选择所有正确答案">
                <el-option v-for="option in editForm.options" :key="option.key" :label="option.key" :value="option.key" />
              </el-select>
            </template>
            <template v-else>
              <el-input v-model="editForm.referenceAnswer" type="textarea" :rows="2" placeholder="请输入参考答案" />
            </template>
          </el-form-item>

          <el-form-item label="难度" prop="difficulty">
            <el-select v-model="editForm.difficulty" placeholder="请选择难度">
              <el-option label="简单" value="EASY" />
              <el-option label="中等" value="MEDIUM" />
              <el-option label="困难" value="HARD" />
            </el-select>
          </el-form-item>
          <el-form-item label="分值" prop="scorePoints">
            <el-input-number v-model="editForm.scorePoints" :min="1" :max="100" />
          </el-form-item>
        </el-form>

        <!-- AI生成习题展示区域 -->
        <div v-if="aiGeneratedExercises && aiGeneratedExercises.length > 0" class="ai-exercises-section">
          <el-divider>
            <el-icon class="ai-icon"><MagicStick /></el-icon>
            AI生成的习题参考
          </el-divider>

          <div class="ai-exercises-container">
            <div class="ai-exercises-header">
              <span class="ai-exercises-title">以下是AI生成的习题，您可以参考并复制内容到上方表单中</span>
              <el-button size="small" type="info" @click="toggleAIExercises">
                {{ showAIExercises ? '收起' : '展开' }}
              </el-button>
            </div>

            <div v-show="showAIExercises" class="ai-exercises-list">
              <div
                v-for="(exercise, index) in aiGeneratedExercises"
                :key="index"
                class="ai-exercise-item"
              >
                <div class="exercise-header">
                  <div class="exercise-title">
                    <span class="exercise-number">题目 {{ index + 1 }}</span>
                    <el-tag
                      v-if="exercise.difficulty"
                      :type="getAIDifficultyType(exercise.difficulty)"
                      size="small"
                      class="difficulty-tag"
                    >
                      {{ exercise.difficulty }}
                    </el-tag>
                    <el-tag
                      v-if="exercise.type"
                      type="info"
                      size="small"
                      class="type-tag"
                    >
                      {{ getAITypeText(exercise.type) }}
                    </el-tag>
                  </div>
                  <div class="exercise-actions">
                    <el-button
                      size="small"
                      type="primary"
                      @click="copyExerciseToForm(exercise)"
                      :icon="DocumentCopy"
                    >
                      复制到表单
                    </el-button>
                    <el-button
                      size="small"
                      @click="copyExerciseText(exercise)"
                      :icon="CopyDocument"
                    >
                      复制文本
                    </el-button>
                  </div>
                </div>

                <div class="exercise-content">
                  <!-- 题目内容 -->
                  <div class="content-section">
                    <div class="content-label">题目内容：</div>
                    <div class="content-text">{{ exercise.question || exercise.title || exercise.content || '暂无题目内容' }}</div>
                  </div>

                  <!-- 选项 -->
                  <div v-if="exercise.options && exercise.options.length > 0" class="content-section">
                    <div class="content-label">选项：</div>
                    <div class="options-text">
                      <div
                        v-for="(option, optIndex) in exercise.options"
                        :key="optIndex"
                        class="option-line"
                      >
                        {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                      </div>
                    </div>
                  </div>

                  <!-- 答案 -->
                  <div v-if="exercise.answer" class="content-section">
                    <div class="content-label">答案：</div>
                    <div class="answer-text">{{ exercise.answer }}</div>
                  </div>

                  <!-- 解析 -->
                  <div v-if="exercise.explanation" class="content-section">
                    <div class="content-label">解析：</div>
                    <div class="explanation-text">{{ exercise.explanation }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="saveQuestion">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- AI生成习题对话框 -->
    <el-dialog v-model="aiDialogVisible" title="AI生成习题" width="600px">
      <el-form :model="aiForm" :rules="aiRules" ref="aiFormRef" label-width="120px">
        <el-form-item label="生成方式" prop="generateType">
          <el-radio-group v-model="aiForm.generateType">
            <el-radio value="course">基于课程生成</el-radio>
            <el-radio value="knowledge">基于知识点生成</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="aiForm.generateType === 'course'" label="课程名称" prop="courseName">
          <el-select v-model="aiForm.courseName" placeholder="请选择课程" filterable>
            <el-option
              v-for="course in courseList"
              :key="course.courseId || course.id"
              :label="course.courseName || course.name"
              :value="course.courseName || course.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="aiForm.generateType === 'knowledge'" label="知识点" prop="knowledgeInput">
          <el-input
            v-model="aiForm.knowledgeInput"
            type="textarea"
            :rows="3"
            placeholder="请输入知识点，多个知识点用逗号分隔，例如：函数的概念，函数的性质，函数的图像"
          />
          <div class="form-tip">请输入相关知识点，多个知识点用逗号分隔</div>
        </el-form-item>

        <el-form-item label="难度等级" prop="difficultyLevel">
          <el-select v-model="aiForm.difficultyLevel" placeholder="请选择难度等级">
            <el-option label="简单" value="简单" />
            <el-option label="中等" value="中等" />
            <el-option label="困难" value="困难" />
          </el-select>
        </el-form-item>

        <el-form-item label="题目数量" prop="problemCount">
          <el-input-number v-model="aiForm.problemCount" :min="1" :max="10" />
          <div class="form-tip">建议生成1-10道题目</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="aiDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="generateAIExercises" :loading="aiGenerating">
            {{ aiGenerating ? '生成中...' : '开始生成' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Loading, Refresh, Search, Plus, Delete, MagicStick, DocumentCopy, CopyDocument } from '@element-plus/icons-vue'
import { examAPI, courseAPI, courseSelectionAPI, knowledgeAPI, studentAssistantAPI } from '@/api/api'
import { getTeacherId, refreshUserInfo } from '@/utils/auth'
import BigNumber from 'bignumber.js'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册 ECharts 组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
  CanvasRenderer
])

const route = useRoute()
const router = useRouter()
const examId = route.params.examId
const examTitle = ref(route.query.title || '考试成绩')
const courseName = ref(route.query.courseName && route.query.courseName !== '未知课程' ? route.query.courseName : '加载中...')
const courseId = ref(null) // 存储课程ID

// 学生成绩列表
const examStudents = ref([])
const isLoading = ref(true)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 考试统计信息
const examStatistics = ref({
  totalStudents: 0,
  submittedStudents: 0,
  averageScore: 0,
  maxScore: 0,
  minScore: 0,
  scoreDistribution: []
})

// 学生详情
const studentDetailVisible = ref(false)
const currentStudent = ref(null)
const studentAnswers = ref([])
const isLoadingDetail = ref(false)

// 题目列表相关
const examQuestions = ref([])
const questionStatistics = ref({
  totalCount: 0,
  totalScore: 0,
  averageScore: 0,
  typeStatistics: {}
})
const questionSearchKeyword = ref('')
const questionFilterType = ref(null)
const questionMinScore = ref(0)
const questionMaxScore = ref(100)
const isLoadingQuestions = ref(false)
const questionStats = ref({}) // 存储每个题目的答题统计

// 图表相关
// const chartContainer = ref(null)
let scoreDistributionChart = null
let questionTypeChart = null
let passRateChart = null
let scoreRangeChart = null
let completionChart = null

// 过滤学生列表
const filteredStudents = computed(() => {
  if (!searchKeyword.value) {
    return examStudents.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return examStudents.value.filter(student => 
    (student.studentId && student.studentId.toString().includes(keyword)) ||
    (student.fullName && student.fullName.toLowerCase().includes(keyword))
  )
})

// 过滤题目列表
const filteredQuestions = computed(() => {
  let questions = examQuestions.value

  // 关键词搜索
  if (questionSearchKeyword.value) {
    const keyword = questionSearchKeyword.value.toLowerCase()
    questions = questions.filter(question => 
      getQuestionContent(question).toLowerCase().includes(keyword) ||
      (question.referenceAnswer && question.referenceAnswer.toLowerCase().includes(keyword))
    )
  }

  // 题目类型筛选
  if (questionFilterType.value) {
    questions = questions.filter(question => question.questionType === questionFilterType.value)
  }

  // 分值范围筛选
  if (questionMinScore.value > 0 || questionMaxScore.value < 100) {
    questions = questions.filter(question => {
      const score = question.scorePoints || 0
      return score >= questionMinScore.value && score <= questionMaxScore.value
    })
  }

  return questions
})

// 计算统计数据
const averageScore = computed(() => {
  const completedStudents = examStudents.value.filter(s => {
    if (s.status !== '已完成') return false
    let score = s.score
    if (score === null || score === undefined || score === '') return false
    if (typeof score === 'string') {
      score = parseFloat(score.trim())
    }
    return !isNaN(score) && isFinite(score) && score >= 0
  })

  if (completedStudents.length === 0) return 0

  const sum = completedStudents.reduce((acc, student) => {
    let score = student.score
    if (typeof score === 'string') {
      score = parseFloat(score.trim())
    }
    return acc + Number(score)
  }, 0)

  return (sum / completedStudents.length).toFixed(1)
})

const maxScore = computed(() => {
  const scores = examStudents.value
    .filter(s => {
      if (s.status !== '已完成') return false
      let score = s.score
      if (score === null || score === undefined || score === '') return false
      if (typeof score === 'string') {
        score = parseFloat(score.trim())
      }
      return !isNaN(score) && isFinite(score) && score >= 0
    })
    .map(s => {
      let score = s.score
      if (typeof score === 'string') {
        score = parseFloat(score.trim())
      }
      return Number(score)
    })
  return scores.length > 0 ? Math.max(...scores) : 0
})

const minScore = computed(() => {
  const scores = examStudents.value
    .filter(s => {
      if (s.status !== '已完成') return false
      let score = s.score
      if (score === null || score === undefined || score === '') return false
      if (typeof score === 'string') {
        score = parseFloat(score.trim())
      }
      return !isNaN(score) && isFinite(score) && score >= 0
    })
    .map(s => {
      let score = s.score
      if (typeof score === 'string') {
        score = parseFloat(score.trim())
      }
      return Number(score)
    })
  return scores.length > 0 ? Math.min(...scores) : 0
})

const passRate = computed(() => {
  const completedStudents = examStudents.value.filter(s => {
    if (s.status !== '已完成') return false
    let score = s.score
    if (score === null || score === undefined || score === '') return false
    if (typeof score === 'string') {
      score = parseFloat(score.trim())
    }
    return !isNaN(score) && isFinite(score) && score >= 0
  })

  if (completedStudents.length === 0) return 0

  const passedStudents = completedStudents.filter(s => {
    let score = s.score
    if (typeof score === 'string') {
      score = parseFloat(score.trim())
    }
    return Number(score) >= 60
  })

  return ((passedStudents.length / completedStudents.length) * 100).toFixed(1)
})

// 获取考试学生列表和成绩
async function fetchExamStudents() {
  try {
    isLoading.value = true
    console.log('开始获取学生数据，courseId:', courseId.value)

    // 确保examId是字符串形式
    const examIdStr = examId ? new BigNumber(examId).toString() : examId.toString()

    // 新的逻辑：
    // 1. 获取课程的所有学生（从courseSelectionAPI）
    // 2. 获取已作答学生的成绩（从examAPI.getExamStudentScores）
    // 3. 合并数据，显示完整的学生列表

    let allCourseStudents = []
    let completedStudentsScores = []

    // 1. 获取课程的所有学生
    if (courseId.value) {
      try {
        console.log('正在获取课程学生列表，courseId:', courseId.value)
        allCourseStudents = await courseSelectionAPI.getCourseStudents(courseId.value)
        console.log('获取到的课程学生列表:', allCourseStudents)
      } catch (error) {
        console.warn('获取课程学生列表失败:', error)
        allCourseStudents = []
      }
    } else {
      console.warn('没有courseId，无法获取课程学生列表')
    }

    // 2. 获取已作答学生的成绩
    try {
      console.log('正在获取已作答学生成绩，examId:', examIdStr)
      completedStudentsScores = await examAPI.getExamStudentScores(examIdStr)
      console.log('获取到的已作答学生成绩:', completedStudentsScores)
    } catch (error) {
      console.warn('获取已作答学生成绩失败:', error)
      completedStudentsScores = []
    }

    // 3. 合并数据
    console.log('开始合并学生数据')
    await mergeStudentData(allCourseStudents, completedStudentsScores)

    // 4. 如果最终没有学生数据，使用后备方案
    if (examStudents.value.length === 0 && Array.isArray(completedStudentsScores) && completedStudentsScores.length > 0) {
      console.log('使用后备方案：只显示已作答学生')
      examStudents.value = completedStudentsScores.map(student => ({
        ...student,
        studentId: String(student.studentId),
        fullName: student.fullName || student.name || `学生${student.studentId}`,
        score: typeof student.score === 'number' ? student.score : parseFloat(student.score) || null,
        status: student.status || '已完成'
      }))
    }

    // 5. 最终检查，确保有数据显示
    console.log('最终学生数据数量:', examStudents.value.length)

    // 获取考试统计信息和题型分析
    await Promise.all([
      fetchExamStatistics(examIdStr),
      fetchQuestionTypeAnalysis(examIdStr)
    ])



    // 初始化图表（确保数据加载完成后再初始化）
    await nextTick()
    console.log('数据加载完成，开始初始化图表')
    initAllCharts()
  } catch (error) {
    console.error('获取考试学生列表失败:', error)
    ElMessage.error('获取考试学生列表失败，请稍后重试')
    examStudents.value = []

    // 即使数据获取失败，也要尝试获取统计信息和题型分析
    const examIdStr = examId ? new BigNumber(examId).toString() : examId.toString()
    try {
      await Promise.all([
        fetchExamStatistics(examIdStr),
        fetchQuestionTypeAnalysis(examIdStr)
      ])
    } catch (statsError) {
      console.error('获取统计信息失败:', statsError)
      // 确保统计信息有默认值
      calculateStatisticsFromStudentData()
    }

    // 即使数据获取失败，也要初始化图表显示无数据状态
    await nextTick()
    console.log('数据获取失败，但仍要初始化图表显示无数据状态')
    initAllCharts()
  } finally {
    isLoading.value = false
  }
}

// 合并学生数据：课程学生列表 + 已作答学生成绩
async function mergeStudentData(allCourseStudents, completedStudentsScores) {
  try {
    console.log('开始合并学生数据')
    console.log('课程学生数量:', Array.isArray(allCourseStudents) ? allCourseStudents.length : 0)
    console.log('已作答学生数量:', Array.isArray(completedStudentsScores) ? completedStudentsScores.length : 0)

    // 确保输入参数是数组
    const courseStudents = Array.isArray(allCourseStudents) ? allCourseStudents : []
    const scoreStudents = Array.isArray(completedStudentsScores) ? completedStudentsScores : []

    // 创建已作答学生的成绩映射（以studentId为key）
    const scoresMap = new Map()
    console.log('开始创建成绩映射，成绩数据:', scoreStudents)
    scoreStudents.forEach((scoreData, index) => {
      if (scoreData && scoreData.studentId) {
        const studentId = String(scoreData.studentId)
        scoresMap.set(studentId, scoreData)
        console.log(`成绩映射${index}:`, {
          原始studentId: scoreData.studentId,
          转换后studentId: studentId,
          成绩数据: scoreData
        })
      } else {
        console.warn(`成绩数据${index}缺少studentId:`, scoreData)
      }
    })
    console.log('最终成绩映射表:', scoresMap)
    console.log('成绩映射表的所有key:', Array.from(scoresMap.keys()))

    // 合并数据：以课程学生为基础，添加成绩信息
    if (courseStudents.length > 0) {
      console.log('使用课程学生列表作为基础')
      examStudents.value = courseStudents.map((student, index) => {
        console.log(`学生${index}原始数据:`, student)

        // 使用数据库ID作为内部标识
        const internalId = String(student.studentId)
        let scoreData = scoresMap.get(internalId)

        // 如果直接匹配失败，尝试其他可能的匹配方式
        if (!scoreData) {
          // 尝试使用用户名匹配
          if (student.username) {
            for (const [, value] of scoresMap.entries()) {
              if (value.fullName === student.username || value.studentName === student.username) {
                scoreData = value
                console.log(`通过用户名匹配到成绩:`, student.username, value)
                break
              }
            }
          }

          // 尝试使用邮箱匹配
          if (!scoreData && student.email) {
            for (const [, value] of scoresMap.entries()) {
              if (value.email === student.email) {
                scoreData = value
                console.log(`通过邮箱匹配到成绩:`, student.email, value)
                break
              }
            }
          }
        }

        console.log(`学生${index}ID匹配:`, {
          原始studentId: student.studentId,
          转换后internalId: internalId,
          用户名: student.username,
          邮箱: student.email,
          找到成绩数据: !!scoreData,
          成绩数据: scoreData
        })

        const result = {
          // 使用用户名作为学号显示（因为没有真正的学号字段）
          studentId: student.username || `学生${index + 1}`,
          // 使用fullName作为姓名
          fullName: student.fullName || student.username || `学生${index + 1}`,
          // 邮箱
          email: student.email || '',
          // 年级和班级（如果为null则显示为空）
          grade: student.grade || '未设置',
          className: student.className || '未设置',
          // 电话
          phone: student.phone || '',
          // 内部ID用于成绩匹配
          _internalId: internalId,
          // 成绩相关信息
          score: scoreData ? (() => {
            let score = scoreData.score
            if (score === null || score === undefined || score === '') return null
            if (typeof score === 'string') {
              score = parseFloat(score.trim())
            }
            return !isNaN(score) && isFinite(score) ? Number(score) : null
          })() : null,
          submitTime: scoreData ? scoreData.submitTime : null,
          status: normalizeStatus(scoreData ? (scoreData.status || '已完成') : '未完成')
        }

        console.log(`学生${index}处理后数据:`, result)
        return result
      })
    } else if (scoreStudents.length > 0) {
      console.log('只有已作答学生数据，使用作为基础')
      // 如果没有课程学生数据，只显示已作答的学生
      examStudents.value = scoreStudents.map(student => ({
        ...student,
        studentId: String(student.studentId),
        fullName: student.fullName || student.name || `学生${student.studentId}`,
        score: (() => {
          let score = student.score
          if (score === null || score === undefined || score === '') return null
          if (typeof score === 'string') {
            score = parseFloat(score.trim())
          }
          return !isNaN(score) && isFinite(score) ? Number(score) : null
        })(),
        status: normalizeStatus(student.status || '已完成')
      }))
    } else {
      console.log('没有任何学生数据')
      // 都没有数据
      examStudents.value = []
    }

    console.log('合并后的学生数据数量:', examStudents.value.length)
    console.log('合并后的学生数据:', examStudents.value)

    // 强制触发响应式更新
    nextTick(() => {
      console.log('强制更新表格数据')
    })
  } catch (error) {
    console.error('合并学生数据失败:', error)
    examStudents.value = []
  }
}



// 获取考试统计信息（基于现有数据计算）
async function fetchExamStatistics(examIdStr) {
  console.log('计算考试统计信息，examId:', examIdStr)
  // 直接基于学生成绩数据计算统计信息
  calculateStatisticsFromStudentData()
}

// 基于学生数据计算统计信息
function calculateStatisticsFromStudentData() {
  console.log('开始计算统计信息，学生数据:', examStudents.value)

  const completedStudents = examStudents.value.filter(s => {
    // 更严格的数据验证
    if (s.status !== '已完成') return false

    let score = s.score
    if (score === null || score === undefined || score === '') return false

    // 处理字符串类型的分数
    if (typeof score === 'string') {
      score = parseFloat(score.trim())
    }

    // 确保是有效数字
    return !isNaN(score) && isFinite(score) && score >= 0
  })

  console.log('已完成考试的学生:', completedStudents)

  const scores = completedStudents.map(s => {
    let score = s.score
    if (typeof score === 'string') {
      score = parseFloat(score.trim())
    }
    return Number(score)
  }).filter(score => !isNaN(score) && isFinite(score))

  console.log('有效分数列表:', scores)

  examStatistics.value = {
    totalStudents: examStudents.value.length,
    submittedStudents: completedStudents.length,
    averageScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    maxScore: scores.length > 0 ? Math.max(...scores) : 0,
    minScore: scores.length > 0 ? Math.min(...scores) : 0,
    scoreDistribution: []
  }

  console.log('计算完成的统计信息:', examStatistics.value)
}

// 获取题型分析数据
const questionTypeData = ref([])
async function fetchQuestionTypeAnalysis(examIdStr) {
  try {
    const analysis = await examAPI.getExamQuestionTypeAnalysis(examIdStr)
    console.log('获取到的题型分析数据:', analysis)

    if (Array.isArray(analysis) && analysis.length > 0) {
      questionTypeData.value = analysis
    } else {
      // 如果API返回空数据，尝试基于现有数据生成简化的题型分析
      console.log('API返回空数据，尝试基于现有数据生成题型分析')
      generateQuestionTypeAnalysisFromLocalData()
    }
  } catch (error) {
    console.warn('获取题型分析失败，尝试基于现有数据生成:', error)
    // 如果API失败，基于现有数据生成简化的题型分析
    generateQuestionTypeAnalysisFromLocalData()
  }
}

// 基于现有数据生成题型分析
function generateQuestionTypeAnalysisFromLocalData() {
  if (!examQuestions.value || examQuestions.value.length === 0) {
    console.log('没有题目数据，清空题型分析数据')
    // 如果没有题目数据，清空数据，让图表显示无数据状态
    questionTypeData.value = []
    return
  }

  // 统计题型分布
  const typeStats = {}
  examQuestions.value.forEach(question => {
    const type = question.questionType || 'UNKNOWN'
    if (!typeStats[type]) {
      typeStats[type] = {
        questionType: type,
        count: 0,
        totalPossibleScore: 0,
        averageScore: 0
      }
    }
    typeStats[type].count++
    typeStats[type].totalPossibleScore += Number(question.scorePoints || 0)
  })

  // 计算每种题型的平均分（基于已完成的学生）
  const completedStudents = examStudents.value.filter(s => {
    const score = typeof s.score === 'number' ? s.score : parseFloat(s.score);
    return s.status === '已完成' && !isNaN(score) && score !== null && score !== undefined;
  })

  Object.keys(typeStats).forEach(type => {
    // 只有当有学生完成考试时才计算平均得分
    if (completedStudents.length > 0) {
      const totalExamScore = examQuestions.value.reduce((sum, q) => sum + Number(q.scorePoints || 0), 0)
      const avgExamScore = completedStudents.reduce((sum, s) => {
        const score = typeof s.score === 'number' ? s.score : parseFloat(s.score) || 0
        return sum + score
      }, 0) / completedStudents.length

      // 按题型分数比例计算平均得分
      const scoreRatio = totalExamScore > 0 ? avgExamScore / totalExamScore : 0
      typeStats[type].averageScore = Math.round(typeStats[type].totalPossibleScore * scoreRatio * 10) / 10
    } else {
      // 如果没有完成的学生，平均得分为0，不显示虚假数据
      typeStats[type].averageScore = 0
    }
  })

  questionTypeData.value = Object.values(typeStats)
  console.log('基于现有数据生成的题型分析:', questionTypeData.value)

  // 重新渲染题型图表
  nextTick(() => {
    initQuestionTypeChart()
  })
}

// 获取题目列表和统计信息
async function fetchExamQuestions() {
  try {
    isLoadingQuestions.value = true
    const examIdStr = examId ? new BigNumber(examId).toString() : String(examId)
    console.log('开始获取题目数据，examId:', examIdStr)

    // 获取题目列表 - 使用knowledgeAPI中的方法
    const questions = await knowledgeAPI.getQuestionsByExamId(examIdStr)
    console.log('获取到的题目列表:', questions)
    if (Array.isArray(questions)) {
      examQuestions.value = questions.map(q => ({
        ...q,
        questionId: String(q.questionId || q.id),
        questionContent: q.content || '题目内容',
        questionType: q.questionType || 'UNKNOWN',
        scorePoints: q.scorePoints || 0,
        difficulty: q.difficulty || 'MEDIUM',
        referenceAnswer: q.referenceAnswer || '',
        options: q.options || [],
        createdAt: q.createdAt || q.created_at || '',
        updatedAt: q.updatedAt || q.updated_at || ''
      }))
    } else {
      examQuestions.value = []
    }

    // 计算题目统计信息
    calculateQuestionStatistics()

    // 如果题型分析数据为空，尝试基于题目数据重新生成
    if (!questionTypeData.value || questionTypeData.value.length === 0) {
      console.log('题目数据加载完成，重新生成题型分析')
      generateQuestionTypeAnalysisFromLocalData()
    }

  } catch (error) {
    console.error('获取题目列表失败:', error)
    ElMessage.error('获取题目列表失败，请稍后重试')
    examQuestions.value = []
    questionStatistics.value = { totalCount: 0, totalScore: 0, averageScore: 0, typeStatistics: {} }
    questionStats.value = {}
  } finally {
    isLoadingQuestions.value = false
  }
}

// 计算题目统计信息
function calculateQuestionStatistics() {
  if (examQuestions.value.length === 0) {
    questionStatistics.value = { totalCount: 0, totalScore: 0, averageScore: 0, typeStatistics: {} }
    questionStats.value = {}
    console.log('题目统计信息：暂无题目数据')
    return
  }

  const totalCount = examQuestions.value.length
  // 修正：累加时强制转为数字，防止前导0
  const totalScore = examQuestions.value.reduce((sum, q) => sum + Number(q.scorePoints || 0), 0)
  const averageScore = totalCount > 0 ? (totalScore / totalCount).toFixed(1) : 0

  // 统计题型分布
  const typeStatistics = {}
  examQuestions.value.forEach(q => {
    const type = q.questionType || 'UNKNOWN'
    if (!typeStatistics[type]) {
      typeStatistics[type] = {
        count: 0,
        totalScore: 0
      }
    }
    typeStatistics[type].count++
    // 修正：累加时强制转为数字
    typeStatistics[type].totalScore += Number(q.scorePoints || 0)
  })

  questionStatistics.value = {
    totalCount,
    totalScore, // 这里已经是数字
    averageScore: parseFloat(averageScore),
    typeStatistics
  }

  // 初始化题目统计（这里可以根据实际需求从后端获取）
  questionStats.value = {}
  examQuestions.value.forEach(q => {
    questionStats.value[q.questionId] = {
      answerCount: 0, // 这里可以从后端获取实际数据
      correctRate: 0, // 这里可以从后端获取实际数据
      avgScore: 0     // 这里可以从后端获取实际数据
    }
  })

  console.log('题目统计信息计算完成:', questionStatistics.value)
}

// 刷新题目列表
function refreshQuestions() {
  fetchExamQuestions()
}

// 处理题目搜索
function handleQuestionSearch() {
  console.log('题目搜索关键词:', questionSearchKeyword.value)
}

// 处理题目筛选
function handleQuestionFilter(value) {
  console.log('题目类型筛选:', value)
}

// 处理题目分数筛选
function handleQuestionScoreFilter() {
  console.log('题目分数筛选:', questionMinScore.value, '-', questionMaxScore.value)
}

// 获取题目类型文本
function getQuestionTypeText(type) {
  switch(type) {
    case 'SINGLE_CHOICE':
      return '单选题'
    case 'MULTI_CHOICE':
      return '多选题'
    case 'FILL_BLANK':
      return '填空题'
    case 'ESSAY_QUESTION':
      return '简答题'
    case 'TRUE_FALSE':
      return '判断题'
    default:
      return '未知题型'
  }
}

// 获取题目类型标签类型
function getQuestionTypeTagType(type) {
  switch(type) {
    case 'SINGLE_CHOICE':
      return 'info'
    case 'MULTI_CHOICE':
      return 'warning'
    case 'FILL_BLANK':
      return 'success'
    case 'ESSAY_QUESTION':
      return 'primary'
    case 'TRUE_FALSE':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取题目难度文本
function getDifficultyText(difficulty) {
  switch(difficulty) {
    case 'EASY':
      return '简单'
    case 'MEDIUM':
      return '中等'
    case 'HARD':
      return '困难'
    default:
      return '未知难度'
  }
}

// 获取题目难度类型
function getDifficultyType(difficulty) {
  switch(difficulty) {
    case 'EASY':
      return 'success'
    case 'MEDIUM':
      return 'warning'
    case 'HARD':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取题目内容（处理富文本）
function getQuestionContent(question) {
  if (question.content) {
    // 去除HTML标签，获取纯文本内容
    return question.content.replace(/<[^>]*>/g, '').trim()
  }
  if (question.questionContent) {
    return question.questionContent.replace(/<[^>]*>/g, '').trim()
  }
  return '题目内容'
}

// 文本截断函数
function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 查看学生详情
async function viewStudentDetail(student) {
  currentStudent.value = student
  studentDetailVisible.value = true
  studentAnswers.value = []

  try {
    isLoadingDetail.value = true

    // 确保ID是字符串形式
    const studentIdStr = student.studentId ? new BigNumber(student.studentId).toString() : String(student.studentId)
    const examIdStr = examId ? new BigNumber(examId).toString() : String(examId)

    console.log('获取学生答题详情，学生ID:', studentIdStr, '考试ID:', examIdStr)

    // 调用API获取学生答题详情
    const response = await examAPI.getStudentExamAnswers(examIdStr, studentIdStr)
    console.log('获取到的学生答题详情:', response)

    if (Array.isArray(response)) {
      studentAnswers.value = response.map(answer => ({
        ...answer,
        answerId: String(answer.answerId || answer.id),
        questionId: String(answer.questionId),
        questionContent: answer.questionContent || answer.question || '题目内容',
        answerContent: answer.answerContent || answer.answer || '未作答',
        score: answer.score || 0,
        totalScore: answer.totalScore || answer.maxScore || 0,
        questionType: answer.questionType || 'unknown'
      }))
    } else {
      studentAnswers.value = []
    }

  } catch (error) {
    console.error('获取学生答题详情失败:', error)
    ElMessage.error('获取学生答题详情失败，请稍后重试')
    studentAnswers.value = []
  } finally {
    isLoadingDetail.value = false
  }
}

// 初始化成绩分布图表
function initScoreDistributionChart() {
  console.log('初始化成绩分布图表')
  const chartDom = document.getElementById('scoreDistributionChart')
  if (!chartDom) {
    console.error('找不到scoreDistributionChart DOM元素')
    return
  }
  // 如果已经初始化过，先销毁
  if (scoreDistributionChart) {
    scoreDistributionChart.dispose()
  }
  scoreDistributionChart = echarts.init(chartDom)
  // 检查是否有学生数据
  const validStudents = examStudents.value.filter(s => {
    const score = typeof s.score === 'number' ? s.score : parseFloat(s.score);
    return !isNaN(score) && score !== null && score !== undefined;
  })
  console.log('有效学生数据数量:', validStudents.length)
  console.log('所有学生数据:', examStudents.value.map(s => ({ studentId: s.studentId, score: s.score, scoreType: typeof s.score })))
  console.log('有效学生数据:', validStudents.map(s => ({ studentId: s.studentId, score: s.score, scoreType: typeof s.score })))
  if (validStudents.length === 0) {
    // 显示无数据状态
    console.log('显示成绩分布无数据状态')
    scoreDistributionChart.setOption(createNoDataOption('分数分布', '暂时没有学生完成'))
    return
  }
  // 计算成绩分布
  const scoreRanges = [
    { min: 0, max: 59, label: '0-59分' },
    { min: 60, max: 69, label: '60-69分' },
    { min: 70, max: 79, label: '70-79分' },
    { min: 80, max: 89, label: '80-89分' },
    { min: 90, max: 100, label: '90-100分' }
  ]
  const distribution = scoreRanges.map(range => {
    return {
      range: range.label,
      count: validStudents.filter(s => {
        const score = typeof s.score === 'number' ? s.score : parseFloat(s.score);
        return score >= range.min && score <= range.max;
      }).length
    }
  })
  const option = {
    title: {
      text: '分数分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: distribution.map(item => item.range)
    },
    yAxis: {
      type: 'value',
      name: '学生数量'
    },
    series: [
      {
        name: '学生数量',
        type: 'bar',
        data: distribution.map(item => item.count),
        itemStyle: {
          color: function(params) {
            const colors = ['#F56C6C', '#E6A23C', '#67C23A', '#409EFF', '#9B59B6']
            return colors[params.dataIndex]
          }
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }
  scoreDistributionChart.setOption(option)
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    if (scoreDistributionChart) {
      scoreDistributionChart.resize()
    }
  })
}

// 初始化题型得分分析图表
function initQuestionTypeChart() {
  console.log('初始化题型得分分析图表')
  const chartDom = document.getElementById('questionTypeChart')
  if (!chartDom) {
    console.error('找不到questionTypeChart DOM元素')
    return
  }

  if (questionTypeChart) {
    questionTypeChart.dispose()
  }

  questionTypeChart = echarts.init(chartDom)

  // 检查是否有题型数据
  console.log('题型数据:', questionTypeData.value)
  console.log('题型数据长度:', questionTypeData.value ? questionTypeData.value.length : 0)
  console.log('题目数据长度:', examQuestions.value ? examQuestions.value.length : 0)

  // 如果没有题目数据或题型数据，直接显示无数据状态
  if (!examQuestions.value || examQuestions.value.length === 0) {
    console.log('没有题目数据，显示题型分析无数据状态')
    questionTypeChart.setOption(createNoDataOption('题型得分分析', '暂时没有题目数据'))
    return
  }

  // 如果没有题型数据，尝试生成
  if (!questionTypeData.value || questionTypeData.value.length === 0) {
    console.log('题型数据为空，尝试基于题目数据生成')
    generateQuestionTypeAnalysisFromLocalData()

    // 如果生成后仍然没有数据，显示无数据状态
    if (!questionTypeData.value || questionTypeData.value.length === 0) {
      console.log('生成题型数据失败，显示无数据状态')
      questionTypeChart.setOption(createNoDataOption('题型得分分析', '暂时没有题目数据'))
      return
    }
  }

  // 使用真实的题型数据
  const questionTypes = questionTypeData.value.map(item => ({
    type: getQuestionTypeText(item.questionType) || '未知题型',
    totalScore: item.totalScore || item.totalPossibleScore || 0,
    avgScore: item.averageScore || 0,
    count: item.count || 0
  }))

  console.log('处理后的题型数据:', questionTypes)

  // 如果没有有效数据，显示提示
  if (questionTypes.length === 0 || questionTypes.every(t => t.totalScore === 0 && t.avgScore === 0)) {
    console.log('题型数据为空或无效，显示无数据状态')
    questionTypeChart.setOption(createNoDataOption('题型得分分析', '暂时没有学生完成'))
    return
  }

  const option = {
    title: {
      text: '题型得分分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>'
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value}分<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['满分', '平均得分'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: questionTypes.map(item => item.type),
      axisLabel: {
        interval: 0,
        rotate: questionTypes.length > 3 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      name: '分数',
      nameTextStyle: {
        color: '#666'
      }
    },
    series: [
      {
        name: '满分',
        type: 'bar',
        data: questionTypes.map(item => item.totalScore),
        itemStyle: {
          color: '#E6A23C'
        },
        barWidth: '30%'
      },
      {
        name: '平均得分',
        type: 'bar',
        data: questionTypes.map(item => item.avgScore),
        itemStyle: {
          color: '#67C23A'
        },
        barWidth: '30%'
      }
    ]
  }

  questionTypeChart.setOption(option)
}

// 初始化及格率统计图表
function initPassRateChart() {
  console.log('初始化及格率统计图表')
  const chartDom = document.getElementById('passRateChart')
  if (!chartDom) {
    console.error('找不到passRateChart DOM元素')
    return
  }

  if (passRateChart) {
    passRateChart.dispose()
  }

  passRateChart = echarts.init(chartDom)

  // 检查是否有有效的成绩数据
  const validStudents = examStudents.value.filter(s =>
    s.score !== undefined && s.score !== null && typeof s.score === 'number'
  )

  console.log('及格率图表有效学生数据数量:', validStudents.length)

  if (validStudents.length === 0) {
    // 显示无数据状态
    console.log('显示及格率无数据状态')
    passRateChart.setOption(createNoDataOption('及格率统计', '暂时没有学生完成'))
    return
  }

  const passCount = validStudents.filter(s => s.score >= 60).length
  const failCount = validStudents.filter(s => s.score < 60).length

  const option = {
    title: {
      text: '及格率统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: '及格情况',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: [
          { value: passCount, name: '及格', itemStyle: { color: '#67C23A' } },
          { value: failCount, name: '不及格', itemStyle: { color: '#F56C6C' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c}人\n({d}%)'
        }
      }
    ]
  }

  passRateChart.setOption(option)
}

// 初始化分数段分布图表
function initScoreRangeChart() {
  console.log('初始化分数段分布图表')
  const chartDom = document.getElementById('scoreRangeChart')
  if (!chartDom) {
    console.error('找不到scoreRangeChart DOM元素')
    return
  }

  if (scoreRangeChart) {
    scoreRangeChart.dispose()
  }

  scoreRangeChart = echarts.init(chartDom)

  // 检查是否有有效的成绩数据
  const validStudents = examStudents.value.filter(s =>
    s.score !== undefined && s.score !== null && typeof s.score === 'number'
  )

  console.log('分数段图表有效学生数据数量:', validStudents.length)

  if (validStudents.length === 0) {
    // 显示无数据状态
    console.log('显示分数段分布无数据状态')
    scoreRangeChart.setOption(createNoDataOption('分数段分布', '暂时没有学生完成'))
    return
  }

  const ranges = [
    { name: '优秀(90-100)', min: 90, max: 100, color: '#9B59B6' },
    { name: '良好(80-89)', min: 80, max: 89, color: '#409EFF' },
    { name: '中等(70-79)', min: 70, max: 79, color: '#67C23A' },
    { name: '及格(60-69)', min: 60, max: 69, color: '#E6A23C' },
    { name: '不及格(0-59)', min: 0, max: 59, color: '#F56C6C' }
  ]

  const data = ranges.map(range => ({
    name: range.name,
    value: validStudents.filter(s =>
      s.score >= range.min && s.score <= range.max
    ).length,
    itemStyle: { color: range.color }
  }))

  const option = {
    title: {
      text: '分数段分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}人 ({d}%)'
    },
    series: [
      {
        name: '分数段',
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{c}人'
        }
      }
    ]
  }

  scoreRangeChart.setOption(option)
}

// 初始化答题完成度图表
function initCompletionChart() {
  console.log('初始化答题完成度图表')
  const chartDom = document.getElementById('completionChart')
  if (!chartDom) {
    console.error('找不到completionChart DOM元素')
    return
  }

  if (completionChart) {
    completionChart.dispose()
  }

  completionChart = echarts.init(chartDom)

  // 检查是否有学生数据
  console.log('答题完成度图表学生数据数量:', examStudents.value ? examStudents.value.length : 0)
  if (!examStudents.value || examStudents.value.length === 0) {
    // 显示无数据状态
    console.log('显示答题完成度无数据状态')
    completionChart.setOption(createNoDataOption('答题完成度', '暂时没有学生完成'))
    return
  }

  const completedCount = examStudents.value.filter(s => s.status === '已完成').length
  const incompleteCount = examStudents.value.length - completedCount

  const option = {
    title: {
      text: '答题完成度',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}人 ({d}%)'
    },
    series: [
      {
        name: '完成情况',
        type: 'pie',
        radius: '70%',
        center: ['50%', '50%'],
        data: [
          {
            value: completedCount,
            name: '已完成',
            itemStyle: { color: '#67C23A' }
          },
          {
            value: incompleteCount,
            name: '未完成',
            itemStyle: { color: '#F56C6C' }
          }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{c}人\n{d}%'
        }
      }
    ]
  }

  completionChart.setOption(option)
}



// 创建无数据图表配置的通用函数
function createNoDataOption(title, message = '暂时没有学生完成') {
  return {
    title: {
      text: title,
      left: 'center',
      top: '20px',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#bbb'
      }
    },
    graphic: [
      {
        type: 'group',
        left: 'center',
        top: 'middle',
        children: [
          {
            type: 'text',
            style: {
              text: '🧐',
              fontSize: 60,
              fill: '#e0e0e0',
              textAlign: 'center'
            },
            top: -30
          },
          {
            type: 'text',
            style: {
              text: message,
              fontSize: 20,
              fill: '#bbb',
              textAlign: 'center',
              fontWeight: 'bold'
            },
            top: 40
          }
        ]
      }
    ],
    backgroundColor: '#fafbfc'
  }
}

// 统一初始化所有图表
function initAllCharts() {
  console.log('开始初始化所有图表，学生数据数量:', examStudents.value.length)
  console.log('题目数据数量:', examQuestions.value.length)
  console.log('题型数据数量:', questionTypeData.value.length)

  // 确保DOM元素存在后再初始化图表
  nextTick(() => {
    try {
      initScoreDistributionChart()

      // 处理题型图表数据
      if (questionTypeData.value.length === 0 && examQuestions.value.length > 0) {
        console.log('题型数据为空但有题目数据，先生成题型分析')
        generateQuestionTypeAnalysisFromLocalData()
      }

      // 初始化题型图表
      initQuestionTypeChart()

      initPassRateChart()
      initScoreRangeChart()
      initCompletionChart()
      console.log('所有图表初始化完成')
    } catch (error) {
      console.error('图表初始化失败:', error)
    }
  })
}

// 响应窗口大小变化
window.addEventListener('resize', () => {
  if (scoreDistributionChart) scoreDistributionChart.resize()
  if (questionTypeChart) questionTypeChart.resize()
  if (passRateChart) passRateChart.resize()
  if (scoreRangeChart) scoreRangeChart.resize()
  if (completionChart) completionChart.resize()
})

// 处理搜索输入
function handleSearchInput() {
  currentPage.value = 1
}

// 处理清除搜索
function handleSearchClear() {
  searchKeyword.value = ''
  currentPage.value = 1
}

// 获取分数样式
function getScoreClass(score) {
  if (score === undefined || score === null) return ''
  if (score < 60) return 'score-fail'
  if (score < 70) return 'score-pass'
  if (score < 80) return 'score-good'
  if (score < 90) return 'score-great'
  return 'score-excellent'
}

// 获取详情分数样式
function getDetailScoreClass(score, totalScore) {
  if (score === undefined || score === null) return ''
  const percentage = (score / totalScore) * 100
  if (percentage < 60) return 'score-fail'
  if (percentage < 70) return 'score-pass'
  if (percentage < 80) return 'score-good'
  if (percentage < 90) return 'score-great'
  return 'score-excellent'
}

// 标准化状态显示
function normalizeStatus(status) {
  switch(status) {
    case '未参与':
    case '未完成':
    case '未开始':
      return '未完成'
    case '已完成':
    case 'completed':
    case 'finished':
      return '已完成'
    case '进行中':
    case 'in_progress':
    case 'ongoing':
      return '进行中'
    default:
      return status || '未完成'
  }
}

// 获取状态类型
function getStatusType(status) {
  const normalizedStatus = normalizeStatus(status)
  switch(normalizedStatus) {
    case '已完成':
      return 'success'
    case '进行中':
      return 'warning'
    case '未完成':
      return 'info'
    default:
      return 'info'
  }
}

// 格式化日期时间
function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 返回上一页
function goBack() {
  router.go(-1)
}

// 获取考试基本信息
async function fetchExamInfo() {
  try {
    const examIdStr = examId ? new BigNumber(examId).toString() : String(examId)
    const examInfo = await examAPI.getExamById(examIdStr)
    console.log('获取到的考试信息:', examInfo)

    if (examInfo) {
      examTitle.value = examInfo.title || route.query.title || '考试成绩'

      // 保存课程ID
      if (examInfo.courseId) {
        courseId.value = examInfo.courseId
      }

      // 更新课程名称
      if (examInfo.courseName) {
        courseName.value = examInfo.courseName
      } else if (examInfo.courseTitle) {
        courseName.value = examInfo.courseTitle
      } else if (examInfo.course && examInfo.course.name) {
        courseName.value = examInfo.course.name
      } else if (examInfo.course && examInfo.course.courseName) {
        courseName.value = examInfo.course.courseName
      } else if (route.query.courseName && route.query.courseName !== '未知课程') {
        courseName.value = route.query.courseName
      } else if (examInfo.courseId) {
        // 如果有课程ID但没有课程名称，尝试获取课程信息
        try {
          const courseInfo = await courseAPI.getCourseById(examInfo.courseId)
          if (courseInfo && (courseInfo.courseName || courseInfo.name)) {
            courseName.value = courseInfo.courseName || courseInfo.name
          }
        } catch (courseError) {
          console.warn('获取课程信息失败:', courseError)
          // 保持默认的课程名称
        }
      }

      // 最终检查，如果课程名称仍然是加载中或未知课程，设置一个默认值
      if (courseName.value === '加载中...' || courseName.value === '未知课程') {
        courseName.value = '智慧教育课程'
      }
    }
  } catch (error) {
    console.warn('getExamById API调用失败，使用路由参数:', error)
    // 获取考试信息失败不影响主要功能，使用路由参数的默认值
    examTitle.value = route.query.title || '考试成绩'
    if (route.query.courseName && route.query.courseName !== '未知课程') {
      courseName.value = route.query.courseName
    } else {
      courseName.value = '智慧教育课程'
    }
  }
}

// 组件挂载时获取数据
onMounted(async () => {
  console.log('页面加载，开始获取考试数据')
  console.log('考试ID:', examId)

  if (!examId) {
    ElMessage.error('考试ID不存在')
    goBack()
    return
  }

  // 初始化题目统计信息
  initQuestionStatistics()

  // 先获取考试信息（包含courseId），再获取学生成绩
  await fetchExamInfo()
  await fetchExamStudents()
  await fetchExamQuestions() // 获取题目列表和统计信息
})

// 初始化题目统计信息
function initQuestionStatistics() {
  questionStatistics.value = {
    totalCount: 0,
    totalScore: 0,
    averageScore: 0,
    typeStatistics: {}
  }
  questionStats.value = {}
  console.log('题目统计信息初始化完成')
}

// 题目多选相关
const selectedQuestions = ref([])

function handleSelectionChange(selection) {
  selectedQuestions.value = selection
}

function handleAddQuestion() {
  editingQuestion.value = null
  showEditDialog.value = true
  // 清空表单
  editForm.value = {
    content: '',
    questionType: 'SINGLE_CHOICE',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ],
    referenceAnswer: '',
    difficulty: 'MEDIUM',
    scorePoints: 100
  }
}

function editQuestion(question) {
  editingQuestion.value = { ...question }
  showEditDialog.value = true
  editForm.value = {
    content: question.content || '',
    questionType: question.questionType || 'SINGLE_CHOICE',
    options: Array.isArray(question.options)
      ? question.options
      : [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' }
        ],
    referenceAnswer: question.referenceAnswer || '',
    difficulty: question.difficulty || 'MEDIUM',
    scorePoints: question.scorePoints || 100
  }
}

function deleteQuestion(question) {
  ElMessageBox.confirm('确定要删除该题目吗？', '提示', {
    type: 'warning',
  }).then(async () => {
    // 调用删除API
    await knowledgeAPI.deleteQuestion(question.questionId)
    ElMessage.success('删除成功')
    refreshQuestions()
  })
}

function handleBatchDelete() {
  ElMessageBox.confirm(`确定要批量删除选中的${selectedQuestions.value.length}道题目吗？`, '提示', {
    type: 'warning',
  }).then(async () => {
    const ids = selectedQuestions.value.map(q => q.questionId)
    // 调用批量删除API（如有）或循环删除
    for (const id of ids) {
      await knowledgeAPI.deleteQuestion(id)
    }
    ElMessage.success('批量删除成功')
    refreshQuestions()
  })
}

// 题目编辑弹窗相关
const showEditDialog = ref(false)
const editingQuestion = ref(null)

// AI生成习题相关
const aiDialogVisible = ref(false)
const aiGenerating = ref(false)
const aiGeneratedExercises = ref([])
const showAIExercises = ref(true)
const courseList = ref([])
const aiFormRef = ref(null)
const aiForm = ref({
  generateType: 'course',
  courseName: '',
  knowledgeInput: '',
  difficultyLevel: '中等',
  problemCount: 5
})

const aiRules = {
  generateType: [
    { required: true, message: '请选择生成方式', trigger: 'change' }
  ],
  courseName: [
    { required: true, message: '请选择课程', trigger: 'change' }
  ],
  knowledgeInput: [
    { required: true, message: '请输入知识点', trigger: 'blur' },
    { min: 2, max: 500, message: '知识点长度应在2到500个字符之间', trigger: 'blur' }
  ],
  difficultyLevel: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  problemCount: [
    { required: true, message: '请输入题目数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 10, message: '题目数量应在1到10之间', trigger: 'blur' }
  ]
}

const editForm = ref({
  content: '',
  questionType: 'SINGLE_CHOICE',
  options: [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' }
  ],
  referenceAnswer: '',
  difficulty: 'MEDIUM',
  scorePoints: 100
})

const editRules = {
  content: [
    { required: true, message: '请输入题目内容', trigger: 'blur' },
    { min: 1, max: 300, message: '题目内容长度应在1到300个字符之间', trigger: 'blur' }
  ],
  questionType: [
    { required: true, message: '请选择题型', trigger: 'change' }
  ],
  difficulty: [
    { required: true, message: '请选择难度', trigger: 'change' }
  ],
  scorePoints: [
    { required: true, message: '请输入分值', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '分值应在1到100之间', trigger: 'blur' }
  ],
  referenceAnswer: [
    { required: true, message: '请输入参考答案', trigger: 'blur' },
    { min: 1, max: 300, message: '参考答案长度应在1到300个字符之间', trigger: 'blur' }
  ]
}

const editFormRef = ref(null)

async function saveQuestion() {
  editFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      let content = editForm.value.content
      // 选择题/多选题/判断题，将选项拼接到content
      if (['SINGLE_CHOICE','MULTI_CHOICE','TRUE_FALSE'].includes(editForm.value.questionType)) {
        content = formatOptionsToContent(editForm.value.content, editForm.value.options)
      }
      const payload = {
        ...editForm.value,
        content,
        // 不再传options字段
        options: undefined,
        referenceAnswer: Array.isArray(editForm.value.referenceAnswer)
          ? editForm.value.referenceAnswer.join(',')
          : editForm.value.referenceAnswer,
        examId: examId
      }
      if (editingQuestion.value && editingQuestion.value.questionId) {
        await knowledgeAPI.updateQuestion({ ...payload, questionId: editingQuestion.value.questionId })
        ElMessage.success('题目编辑成功')
      } else {
        await knowledgeAPI.addQuestion(payload)
        ElMessage.success('题目添加成功')
      }
      showEditDialog.value = false
      editingQuestion.value = null
      refreshQuestions()
    } catch (e) {
      ElMessage.error('保存失败，请重试')
    }
  })
}

// 题型切换时自动初始化选项
watch(() => editForm.value.questionType, (newType) => {
  editForm.value.referenceAnswer = ''
  if (newType === 'SINGLE_CHOICE') {
    editForm.value.options = [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ]
  } else if (newType === 'MULTI_CHOICE') {
    editForm.value.options = [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ]
  } else if (newType === 'TRUE_FALSE') {
    editForm.value.options = [
      { key: 'A', text: '正确' },
      { key: 'B', text: '错误' }
    ]
  } else {
    editForm.value.options = []
  }
})

// 选项增删
function addOption() {
  const keys = ['A', 'B', 'C', 'D', 'E', 'F']
  if (editForm.value.options.length < keys.length) {
    const nextKey = keys[editForm.value.options.length]
    editForm.value.options.push({ key: nextKey, text: '' })
  }
}
function removeOption(index) {
  if (editForm.value.options.length > 2) {
    if (editForm.value.referenceAnswer === editForm.value.options[index].key) {
      editForm.value.referenceAnswer = ''
    }
    editForm.value.options.splice(index, 1)
    // 重新排序key
    const keys = ['A', 'B', 'C', 'D', 'E', 'F']
    editForm.value.options.forEach((option, idx) => {
      option.key = keys[idx]
    })
  }
}

function formatOptionsToContent(content, options) {
  if (!Array.isArray(options) || options.length === 0) return content
  const optionLines = options.map(opt => `${opt.key}. ${opt.text || ''}`)
  return [content, ...optionLines].join('\n')
}

// ==================== AI生成习题相关方法 ====================

// 显示AI生成对话框
function showAIDialog() {
  aiDialogVisible.value = true
  // 获取课程列表
  fetchCourseList()
}

// 获取课程列表
async function fetchCourseList() {
  try {
    // 使用getAllCourses获取所有课程，与HomeworkDetail.vue保持一致
    const courses = await courseAPI.getAllCourses()
    courseList.value = Array.isArray(courses) ? courses : []
    console.log('获取课程列表成功:', courseList.value)
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败，请检查网络连接')
    courseList.value = []
  }
}

// 生成AI习题
async function generateAIExercises() {
  if (!aiFormRef.value) return

  await aiFormRef.value.validate(async (valid) => {
    if (valid) {
      aiGenerating.value = true
      try {
        let teacherId = getTeacherId()

        // 如果获取不到教师ID，尝试刷新用户信息
        if (!teacherId) {
          console.log('未找到教师ID，尝试刷新用户信息...')
          const userInfo = await refreshUserInfo()
          if (userInfo && userInfo.teacherId) {
            teacherId = userInfo.teacherId
          } else {
            ElMessage.error('未找到教师信息，请重新登录')
            return
          }
        }

        let response

        if (aiForm.value.generateType === 'course') {
          // 基于课程生成习题
          response = await studentAssistantAPI.generateExerciseByCourseName(
            teacherId,
            aiForm.value.courseName,
            aiForm.value.difficultyLevel,
            aiForm.value.problemCount
          )
        } else {
          // 基于知识点生成习题
          const knowledgeArray = aiForm.value.knowledgeInput
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)

          response = await studentAssistantAPI.generateExerciseByKnowledgeNames(
            teacherId,
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
          aiGeneratedExercises.value = [response].filter(Boolean)
        }

        ElMessage.success(`成功生成 ${aiGeneratedExercises.value.length} 道习题`)
        aiDialogVisible.value = false

        // 打开题目编辑对话框显示AI生成的习题
        handleAddQuestion()

      } catch (error) {
        console.error('AI生成习题失败:', error)
        let errorMessage = 'AI生成习题失败'

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

// 切换AI习题显示状态
function toggleAIExercises() {
  showAIExercises.value = !showAIExercises.value
}

// 获取AI难度标签类型
function getAIDifficultyType(difficulty) {
  const typeMap = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  }
  return typeMap[difficulty] || 'info'
}

// 获取AI题目类型文本
function getAITypeText(type) {
  const typeMap = {
    'SINGLE_CHOICE': '单选题',
    'MULTI_CHOICE': '多选题',
    'FILL_BLANK': '填空题',
    'ESSAY_QUESTION': '简答题',
    'TRUE_FALSE': '判断题'
  }
  return typeMap[type] || type
}

// 复制习题到表单
function copyExerciseToForm(exercise) {
  try {
    // 复制题目内容
    if (exercise.question || exercise.title || exercise.content) {
      editForm.value.content = exercise.question || exercise.title || exercise.content
    }

    // 根据习题类型设置表单类型
    if (exercise.type) {
      editForm.value.questionType = exercise.type
    } else if (exercise.options && exercise.options.length > 0) {
      editForm.value.questionType = exercise.options.length > 4 ? 'MULTI_CHOICE' : 'SINGLE_CHOICE'
    }

    // 处理选择题选项
    if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(editForm.value.questionType) && exercise.options) {
      editForm.value.options = exercise.options.map((option, index) => ({
        key: String.fromCharCode(65 + index), // A, B, C, D...
        text: option
      }))
    } else if (editForm.value.questionType === 'TRUE_FALSE') {
      editForm.value.options = [
        { key: 'A', text: '正确' },
        { key: 'B', text: '错误' }
      ]
    }

    // 设置答案
    if (exercise.answer) {
      editForm.value.referenceAnswer = exercise.answer
    }

    // 设置难度
    if (exercise.difficulty) {
      const difficultyMap = {
        '简单': 'EASY',
        '中等': 'MEDIUM',
        '困难': 'HARD'
      }
      editForm.value.difficulty = difficultyMap[exercise.difficulty] || 'MEDIUM'
    }

    // 设置分值
    if (exercise.score) {
      editForm.value.scorePoints = exercise.score
    }

    ElMessage.success('习题内容已复制到表单')
  } catch (error) {
    console.error('复制习题到表单失败:', error)
    ElMessage.error('复制失败，请手动复制内容')
  }
}

// 复制习题文本到剪贴板
function copyExerciseText(exercise) {
  try {
    let text = ''

    // 题目内容
    if (exercise.question || exercise.title || exercise.content) {
      text += `题目：${exercise.question || exercise.title || exercise.content}\n\n`
    }

    // 选项
    if (exercise.options && exercise.options.length > 0) {
      text += '选项：\n'
      exercise.options.forEach((option, index) => {
        text += `${String.fromCharCode(65 + index)}. ${option}\n`
      })
      text += '\n'
    }

    // 答案
    if (exercise.answer) {
      text += `答案：${exercise.answer}\n\n`
    }

    // 解析
    if (exercise.explanation) {
      text += `解析：${exercise.explanation}\n`
    }

    // 复制到剪贴板
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
      ElMessage.success('习题内容已复制到剪贴板')
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      ElMessage.success('习题内容已复制到剪贴板')
    }
  } catch (error) {
    console.error('复制习题文本失败:', error)
    ElMessage.error('复制失败，请手动复制内容')
  }
}
</script>

<style scoped>
.exam-scores-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  padding: 0 10px;
  color: #303133;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 0;
  box-shadow: none;
  border: none;
  background-color: transparent;
  text-align: left;
  min-height: 32px;
  flex-shrink: 0;
  line-height: 32px;
}

.header-content {
  display: flex;
  align-items: center;
  height: 32px;
}

.back-button {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #409EFF;
  margin-right: 16px;
  position: static;
  transition: transform 0.3s;
  line-height: 32px;
  height: 32px;
}

.back-button:hover {
  opacity: 0.8;
  transform: translateX(-5px);
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  text-shadow: none;
  color: #303133;
  line-height: 32px;
  height: 32px;
  font-size: 22px;
}

.course-info {
  margin-top: 8px;
  color: #606266;
  font-size: 14px;
}

.page-content {
  flex: 1;
  padding: 32px 40px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.scores-container {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.scores-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.scores-body {
  width: 100%;
}

.scores-body .el-table {
  width: 100% !important;
}

.scores-body .el-table__header-wrapper,
.scores-body .el-table__body-wrapper {
  width: 100% !important;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.scores-analysis {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.analysis-header {
  margin-bottom: 20px;
}

.analysis-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.statistics-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.stat-card {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  flex: 1;
  min-width: 120px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.statistics-container {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 图表区域样式 */
.charts-section {
  margin-bottom: 20px;
}

.chart-container {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 100%;
}

.chart-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 图表无数据状态样式 */
.chart-no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}

.chart-no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ddd;
}

.chart-no-data-text {
  margin-bottom: 8px;
  font-weight: 500;
}

.chart-no-data-desc {
  font-size: 14px;
  color: #bbb;
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  margin-top: 20px;
  height: 350px;
  width: 100%;
}

.student-detail {
  padding: 0 10px;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
}

.info-item .label {
  font-weight: bold;
  width: 80px;
  color: #606266;
}

.info-item .value {
  flex: 1;
  color: #303133;
}

.detail-content h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #303133;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
  gap: 10px;
}

.answers-list {
  max-height: 400px;
  overflow-y: auto;
}

.answer-item {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.question-content {
  margin-bottom: 10px;
}

.question-number {
  font-weight: bold;
  margin-bottom: 5px;
  color: #409EFF;
}

.question-text {
  color: #303133;
  margin-bottom: 10px;
}

.answer-content {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.answer-label {
  font-weight: 500;
  margin-bottom: 5px;
  color: #606266;
}

.answer-text {
  color: #303133;
  white-space: pre-wrap;
}

.score-info {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.score-label {
  font-weight: 500;
  color: #606266;
  margin-right: 10px;
}

.no-data {
  text-align: center;
  padding: 30px 0;
  color: #909399;
}

/* 分数样式 */
.score-fail {
  color: #F56C6C;
  font-weight: bold;
}

.score-pass {
  color: #E6A23C;
  font-weight: bold;
}

.score-good {
  color: #67C23A;
  font-weight: bold;
}

.score-great {
  color: #409EFF;
  font-weight: bold;
}

.score-excellent {
  color: #9B59B6;
  font-weight: bold;
}

/* 表格对齐样式 */
:deep(.el-table .el-table__header-wrapper) {
  text-align: center;
}

:deep(.el-table .el-table__body-wrapper) {
  text-align: center;
}

:deep(.el-table th) {
  text-align: center !important;
}

:deep(.el-table td) {
  text-align: center !important;
}

/* 题目列表样式 */
.questions-container {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  margin-top: 20px;
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.questions-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
}

.question-statistics {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #EBEEF5;
}

.question-search {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #EBEEF5;
}

.score-range {
  display: flex;
  align-items: center;
  margin-top: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.score-range span {
  font-size: 14px;
  color: #606266;
  margin-right: 5px;
}

.questions-body {
  overflow-y: auto;
}

.questions-list .el-collapse-item {
  border-bottom: 1px solid #EBEEF5;
}

.questions-list .el-collapse-item__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  padding: 15px 20px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
  gap: 10px;
}

.header-main {
  display: flex;
  align-items: center;
  flex-grow: 1;
  margin-right: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.question-index {
  font-weight: bold;
  margin-right: 10px;
  color: #409EFF;
  flex-shrink: 0;
}

.question-type {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
  flex-shrink: 0;
}

.question-content {
  flex-grow: 1;
  color: #303133;
  font-size: 15px;
  margin-right: 10px;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-score {
  font-weight: bold;
  color: #409EFF;
  font-size: 15px;
  flex-shrink: 0;
}

.question-difficulty {
  flex-shrink: 0;
  margin-left: 10px;
}

.question-content-detail {
  padding: 15px 20px;
  border-top: 1px solid #EBEEF5;
}

.question-title-full {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  line-height: 1.5;
  word-wrap: break-word;
}

.question-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  color: #606266;
  font-size: 14px;
  flex-wrap: wrap;
  gap: 8px;
}

.question-info .el-tag {
  margin-right: 8px;
}

.question-score-info {
  font-weight: 500;
  color: #409EFF;
  margin-left: 10px;
}

.question-answer {
  margin-top: 15px;
  padding: 15px;
  background-color: #F5F7FA;
  border-radius: 8px;
  border: 1px solid #EBEEF5;
}

.answer-label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.answer-content {
  color: #303133;
  white-space: pre-wrap;
  line-height: 1.5;
  word-wrap: break-word;
}

.question-stats {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #EBEEF5;
}

.stats-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  font-weight: 500;
}

.stats-content {
  font-size: 14px;
  color: #303133;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stats-content span {
  background-color: #F5F7FA;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
}

.empty-questions {
  padding: 30px 0;
  text-align: center;
}

.empty-sub-text {
  font-size: 14px;
  color: #909399;
  margin-top: 10px;
}

.questions-summary {
  margin-bottom: 15px;
  padding: 10px 15px;
  background-color: #F5F7FA;
  border-radius: 6px;
  border: 1px solid #EBEEF5;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .questions-container {
    padding: 20px;
  }
  
  .questions-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .question-content {
    max-width: 100%;
    white-space: normal;
  }
  
  .question-item-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .question-difficulty {
    margin-left: 0;
    margin-top: 10px;
  }
  
  .score-range {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stats-content {
    flex-direction: column;
    gap: 10px;
  }
}

/* AI习题展示区域样式 */
.ai-exercises-section {
  margin-top: 30px;
  padding-top: 20px;
}

.ai-exercises-section .el-divider {
  margin: 20px 0;
}

.ai-exercises-section .ai-icon {
  color: #409EFF;
  margin-right: 8px;
}

.ai-exercises-container {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafbfc;
}

.ai-exercises-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.ai-exercises-title {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.ai-exercises-list {
  padding: 0;
}

.ai-exercise-item {
  border-bottom: 1px solid #e4e7ed;
  background: white;
  transition: all 0.2s ease;
}

.ai-exercise-item:last-child {
  border-bottom: none;
  border-radius: 0 0 8px 8px;
}

.ai-exercise-item:hover {
  background: #f8f9fa;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.exercise-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.exercise-number {
  font-weight: 600;
  color: #409EFF;
  font-size: 14px;
}

.difficulty-tag,
.type-tag {
  font-size: 12px;
}

.exercise-actions {
  display: flex;
  gap: 8px;
}

.exercise-content {
  padding: 0 20px 20px 20px;
}

.content-section {
  margin-bottom: 15px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.content-label {
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
  font-size: 13px;
}

.content-text,
.answer-text,
.explanation-text {
  color: #606266;
  line-height: 1.6;
  font-size: 14px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
}

.options-text {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
  border-left: 3px solid #67C23A;
}

.option-line {
  color: #606266;
  line-height: 1.6;
  font-size: 14px;
  margin-bottom: 5px;
}

.option-line:last-child {
  margin-bottom: 0;
}

.answer-text {
  border-left-color: #E6A23C;
  font-weight: 500;
}

.explanation-text {
  border-left-color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}
</style>