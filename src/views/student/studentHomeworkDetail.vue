<template>
  <div class="homework-detail-container">


    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
      <p style="text-align: center; margin-top: 20px;">正在加载作业详情...</p>
    </div>

    <div v-else-if="!assignmentId" class="error-container">
      <el-empty description="未找到作业ID">
        <el-button type="primary" @click="goBack">返回上一页</el-button>
      </el-empty>
    </div>

    <div v-else>
      <!-- 作业信息头部 -->
      <el-card class="homework-info-card">
        <div class="homework-header">
          <div class="header-left">
            <h2>{{ homeworkInfo.title || '未命名作业' }}</h2>
            <div class="homework-meta">
              <span><i class="el-icon-date"></i> 开始时间: {{ formatDateTime(homeworkInfo.startTime) }}</span>
              <span><i class="el-icon-time"></i> 截止时间: {{ formatDateTime(homeworkInfo.endTime) }}</span>
              <span><i class="el-icon-document"></i> 题目数量: {{ problems.length }} 题</span>
              <span><i class="el-icon-star-on"></i> 总分: {{ totalScore }} 分</span>
              <span v-if="showAutoScore" class="final-score">
                <i class="el-icon-trophy"></i> 我的得分: {{ autoScore }} 分
              </span>
              <span v-else-if="isSubmitted && !homeworkInfo.isScoreVisible" class="score-hidden">
                <i class="el-icon-view"></i> 已完成（分数不公开）
              </span>
              <span v-else-if="isSubmitted" class="score-pending">
                <i class="el-icon-loading"></i> 暂无分数
              </span>
              <span v-if="homeworkInfo.maxAttempts > 0" class="attempts-info">
                <i class="el-icon-refresh"></i> 剩余重做次数: {{ remainingAttempts }} / {{ homeworkInfo.maxAttempts }}
              </span>
            </div>
            <div class="homework-description" v-if="homeworkInfo.description">
              {{ homeworkInfo.description }}
            </div>
          </div>
          <div class="header-right">
            <el-tag
              :type="getHomeworkStatusType()"
              size="large"
              class="status-tag"
            >
              {{ getHomeworkStatusText() }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- 重做状态提示 -->
      <el-alert
        v-if="isRedoing"
        title="重做模式"
        type="warning"
        :closable="false"
        show-icon
        class="redo-alert"
      >
        <template #default>
          <p>您正在重做作业，当前答案仅暂存在本地。完成答题后请点击"重新提交作业"按钮。</p>
          <p>剩余重做次数：{{ remainingAttempts - 1 }} 次</p>
        </template>
      </el-alert>

      <!-- 作业进度 -->
      <el-card class="progress-card" v-if="problems.length > 0">
        <div class="progress-header">
          <h3>作业进度</h3>
          <div class="progress-stats">
            <span>已完成: {{ completedCount }} / {{ problems.length }}</span>
          </div>
        </div>
        <el-progress
          :percentage="progressPercentage"
          :format="percentFormat"
          :status="progressStatus"
          :stroke-width="8"
        ></el-progress>
      </el-card>

      <!-- 题目列表 -->
      <el-card class="problems-card" v-if="!isSubmitted || isRedoing">
        <div class="problems-header">
          <h3>作业题目</h3>
          <div class="problems-nav" v-if="problems.length > 1">
            <el-button-group>
              <el-button
                v-for="(problem, index) in problems"
                :key="problem.problemId"
                size="small"
                :type="currentProblemIndex === index ? 'primary' :
                       isAnswered(problem.problemId) ? 'success' : 'default'"
                @click="currentProblemIndex = index"
              >{{ index + 1 }}</el-button>
            </el-button-group>
          </div>
        </div>

        <div v-if="problems.length === 0" class="empty-container">
          <el-empty description="暂无题目" />
          <div style="margin-top: 10px; font-size: 12px; color: #999;">
            调试信息: problems.length = {{ problems.length }}, isRedoing = {{ isRedoing }}
          </div>
        </div>

        <div v-else class="problems-container">
          <!-- 当前题目 -->
          <div class="current-problem" v-if="currentProblem">
            <div class="problem-header">
              <span class="problem-number">{{ currentProblemIndex + 1 }}.</span>
              <span class="problem-type">
                {{ getProblemTypeText(currentProblem.type) }}
              </span>
              <span class="problem-score">({{ currentProblem.score || 0 }}分)</span>
              <el-tag
                v-if="currentProblem.autoGrading || currentProblem.auto_grading"
                type="info"
                size="mini"
                style="margin-left: 8px;"
              >
                自动判分
              </el-tag>
            </div>

            <div class="problem-title">
              {{ currentProblem.title }}
            </div>

            <div class="problem-content" v-if="currentProblem.content">
              <div v-html="formatProblemContent(currentProblem.content)"></div>
            </div>

            <!-- 答题区域 -->
            <div class="answer-area" v-if="canAnswer">
              <!-- 单选题 -->
              <div v-if="currentProblem.type === 'SINGLE_CHOICE'" class="problem-options">
                <el-radio-group v-model="userAnswers[currentProblem.problemId]">
                  <div v-for="(option, optIndex) in getProblemOptions(currentProblem)" :key="optIndex" class="option-item">
                    <el-radio :value="option.value">
                      <span class="option-label">{{ option.value }}.</span>
                      <span class="option-content">{{ option.content }}</span>
                    </el-radio>
                  </div>
                </el-radio-group>
              </div>

              <!-- 多选题 -->
              <div v-else-if="currentProblem.type === 'MULTI_CHOICE'" class="problem-options">
                <el-checkbox-group v-model="userAnswers[currentProblem.problemId]">
                  <div v-for="(option, optIndex) in getProblemOptions(currentProblem)" :key="optIndex" class="option-item">
                    <el-checkbox :value="option.value">
                      <span class="option-label">{{ option.value }}.</span>
                      <span class="option-content">{{ option.content }}</span>
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>

              <!-- 判断题 -->
              <div v-else-if="currentProblem.type === 'TRUE_FALSE'" class="problem-options">
                <el-radio-group v-model="userAnswers[currentProblem.problemId]">
                  <div class="option-item">
                    <el-radio value="true">
                      <span class="option-content">正确</span>
                    </el-radio>
                  </div>
                  <div class="option-item">
                    <el-radio value="false">
                      <span class="option-content">错误</span>
                    </el-radio>
                  </div>
                </el-radio-group>
              </div>

              <!-- 填空题 -->
              <div v-else-if="currentProblem.type === 'FILL_BLANK'" class="problem-options">
                <el-input
                  v-model="userAnswers[currentProblem.problemId]"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入您的答案"
                ></el-input>
              </div>

              <!-- 简答题 -->
              <div v-else-if="currentProblem.type === 'ESSAY_QUESTION'" class="problem-options">
                <el-input
                  v-model="userAnswers[currentProblem.problemId]"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入您的答案"
                ></el-input>
              </div>

              <!-- 主观题 -->
              <div v-else-if="currentProblem.type === 'SUBJECTIVE'" class="problem-options">
                <el-input
                  v-model="userAnswers[currentProblem.problemId]"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入您的答案"
                ></el-input>
              </div>

              <!-- 答题操作按钮 -->
              <div class="answer-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="saveAnswer(currentProblem)"
                  :disabled="!isAnswerValid(currentProblem) || (isSubmitted && !isRedoing)"
                  :loading="saving"
                >
                  {{ getDraftAnswerButtonText(currentProblem) }}
                </el-button>

                <el-tag
                  v-if="getDraftAnswerStatus(currentProblem.problemId)"
                  :type="getDraftAnswerTagType(currentProblem.problemId)"
                  size="small"
                  style="margin-left: 10px;"
                >
                  {{ getDraftAnswerTagText(currentProblem.problemId) }}
                  <span v-if="submittedAnswers[currentProblem.problemId] && submittedAnswers[currentProblem.problemId].isGraded">
                    - {{ submittedAnswers[currentProblem.problemId].score }}分
                  </span>
                </el-tag>

                <el-button
                  v-if="currentProblemIndex < problems.length - 1"
                  type="default"
                  size="small"
                  @click="nextProblem"
                >下一题</el-button>

                <el-button
                  v-if="currentProblemIndex > 0"
                  type="default"
                  size="small"
                  @click="prevProblem"
                >上一题</el-button>
              </div>
            </div>

            <!-- 已提交或已截止的作业显示答案区域 -->
            <div v-else-if="!isRedoing" class="result-area">
              <div class="my-answer">
                <div class="answer-label">我的答案:</div>
                <div class="answer-content">{{ getDisplayAnswer(currentProblem) || '未作答' }}</div>
              </div>

              <div v-if="showReferenceAnswer && currentProblem.expectedAnswer" class="correct-answer">
                <div class="answer-label">参考答案:</div>
                <div class="answer-content">{{ currentProblem.expectedAnswer }}</div>
              </div>
            </div>
          </div>

          <!-- 题目导航 -->
          <div class="problem-navigation" v-if="problems.length > 1">
            <el-button
              v-if="currentProblemIndex > 0"
              @click="prevProblem"
              icon="el-icon-arrow-left"
            >上一题</el-button>

            <span class="nav-info">{{ currentProblemIndex + 1 }} / {{ problems.length }}</span>

            <el-button
              v-if="currentProblemIndex < problems.length - 1"
              @click="nextProblem"
              icon="el-icon-arrow-right"
            >下一题</el-button>
          </div>
        </div>
      </el-card>

      <!-- 提交作业按钮 -->
      <div class="submit-homework-container" v-if="problems.length > 0">
        <div v-if="(!isSubmitted && canAnswer) || isRedoing">
          <el-button
            type="primary"
            size="large"
            @click="submitHomework"
            :loading="submitting"
            :disabled="getSubmitButtonDisabled()"
          >
            {{ getSubmitButtonText() }}
          </el-button>
          <p class="submit-tip">{{ getSubmitTipText() }}</p>

          <!-- 重做时的取消按钮 -->
          <el-button
            v-if="isRedoing"
            type="default"
            size="large"
            @click="cancelRedo"
            style="margin-left: 10px;"
          >
            取消重做
          </el-button>
        </div>

        <div v-else-if="isSubmitted" class="submitted-info">
          <el-alert
            title="作业已提交"
            type="success"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>您已成功提交作业</p>
              <p v-if="totalFinalScore > 0">总得分：<strong>{{ totalFinalScore }}</strong> / {{ totalScore }} 分</p>
              <p v-else>正在评分中，请稍后查看得分</p>
            </template>
          </el-alert>

          <!-- 详细得分展示 -->
          <div v-if="totalFinalScore > 0" class="score-details">
            <el-card class="score-card">
              <template #header>
                <div class="score-header">
                  <h3><i class="el-icon-data-analysis"></i> 详细得分</h3>
                  <div class="score-summary">
                    <span class="total-score">{{ totalFinalScore }} / {{ totalScore }}</span>
                    <span class="score-percentage">({{ getScorePercentage() }}%)</span>
                  </div>
                </div>
              </template>

              <div class="score-breakdown">
                <div class="score-stats">
                  <div class="stat-item">
                    <div class="stat-value">{{ getCorrectCount() }}</div>
                    <div class="stat-label">答对题数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ problems.length }}</div>
                    <div class="stat-label">总题数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ getAccuracyRate() }}%</div>
                    <div class="stat-label">正确率</div>
                  </div>
                </div>

                <!-- 每题得分详情 -->
                <div class="problem-scores">
                  <h4>各题得分详情</h4>
                  <div class="problem-score-list">
                    <div
                      v-for="(problem, index) in problems"
                      :key="problem.problemId"
                      class="problem-score-item"
                      :class="{ 'correct': isProblemCorrect(problem), 'incorrect': !isProblemCorrect(problem) && hasScore(problem) }"
                    >
                      <div class="problem-info">
                        <span class="problem-number">第{{ index + 1 }}题</span>
                        <span class="problem-type">{{ getProblemTypeText(problem.type) }}</span>
                      </div>
                      <div class="score-info">
                        <span class="earned-score">{{ getProblemScore(problem) }}</span>
                        <span class="total-score">/ {{ problem.score || 0 }}</span>
                        <span class="score-status">
                          <i v-if="isProblemCorrect(problem)" class="el-icon-check correct-icon"></i>
                          <i v-else-if="hasScore(problem)" class="el-icon-close incorrect-icon"></i>
                          <i v-else class="el-icon-time pending-icon"></i>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 得分等级 -->
                <div class="score-grade">
                  <div class="grade-info">
                    <span class="grade-label">成绩等级：</span>
                    <el-tag :type="getGradeType()" size="large">{{ getGradeText() }}</el-tag>
                  </div>
                  <div class="grade-comment">
                    <p>{{ getGradeComment() }}</p>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 重做按钮 -->
          <div v-if="canRedo" class="redo-section">
            <el-button
              type="warning"
              size="large"
              @click="redoHomework"
              :disabled="remainingAttempts <= 0"
            >
              重新做作业 (剩余 {{ remainingAttempts }} 次)
            </el-button>
            <p class="redo-tip">重做作业将清空当前答案，重新开始答题</p>
          </div>


        </div>

        <div v-else class="deadline-passed">
          <el-alert
            title="作业已截止"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>作业提交时间已过，无法继续答题</p>
            </template>
          </el-alert>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { assignmentAPI, problemAPI, studentAnswerAPI } from '@/api/api';
import { getUserInfo } from '@/utils/auth';

export default {
  name: 'StudentHomeworkDetail',
  data() {
    return {
      // 作业信息
      assignmentId: null,
      homeworkInfo: {},
      problems: [],
      loading: true,
      saving: false,
      submitting: false,

      // 答题相关
      currentProblemIndex: 0,
      userAnswers: {},
      answeredProblems: {},

      // 作业状态: 'NOT_STARTED', 'ONGOING', 'ENDED', 'SUBMITTED'
      homeworkStatus: 'ONGOING',

      // 结果相关
      showReferenceAnswer: false,

      // 学生信息
      studentId: null,

      // 答案相关
      submittedAnswers: {}, // 已提交的答案 {problemId: {answerId, answer, score}}
      finalScores: [], // 最终得分列表
      totalFinalScore: 0, // 总得分
      autoScore: 0, // 自动判题分数

      // 提交状态
      isSubmitted: false,

      // 重做相关
      remainingAttempts: 0, // 剩余重做次数
      canRedo: false, // 是否可以重做
      isRedoing: false, // 是否处于重做状态
      tempAnswers: {}, // 重做时的临时答案存储

      // 答题模式：'draft' 草稿模式（暂存答案），'submit' 提交模式（直接提交）
      answerMode: 'draft'
    };
  },
  computed: {
    // 当前题目
    currentProblem() {
      if (this.problems.length === 0) return null;
      return this.problems[this.currentProblemIndex];
    },

    // 总分
    totalScore() {
      return this.problems.reduce((sum, problem) => sum + (problem.score || 0), 0);
    },

    // 已完成题目数量（已提交答案的题目或已暂存的题目）
    completedCount() {
      // 统计暂存答案和已提交答案的总数（避免重复计算）
      const tempAnswerIds = new Set(Object.keys(this.tempAnswers));
      const submittedAnswerIds = new Set(Object.keys(this.submittedAnswers));

      // 合并两个集合
      const allAnsweredIds = new Set([...tempAnswerIds, ...submittedAnswerIds]);

      return allAnsweredIds.size;
    },

    // 进度百分比
    progressPercentage() {
      if (this.problems.length === 0) return 0;
      return Math.round((this.completedCount / this.problems.length) * 100);
    },

    // 进度状态
    progressStatus() {
      if (this.progressPercentage === 100) return 'success';
      if (this.progressPercentage >= 50) return '';
      return 'exception';
    },

    // 是否可以答题
    canAnswer() {
      const now = new Date();
      const endTime = new Date(this.homeworkInfo.endTime);
      return this.homeworkStatus === 'ONGOING' && now <= endTime && (!this.isSubmitted || this.isRedoing);
    },

    // 是否显示自动判题分数
    showAutoScore() {
      return this.isSubmitted && this.autoScore > 0 && this.homeworkInfo.isScoreVisible;
    }
  },
  watch: {
    // 监听路由参数变化
    '$route.params.homeworkId': {
      handler(newHomeworkId) {
        if (newHomeworkId) {
          this.assignmentId = newHomeworkId;
          this.fetchHomeworkDetail();
        }
      },
      immediate: true
    }
  },
  created() {
    // 获取学生信息
    const userInfo = getUserInfo();
    this.studentId = userInfo?.studentId;

    // 如果从 getUserInfo 获取不到 studentId，尝试从 localStorage 直接获取
    if (!this.studentId || this.studentId === 'default-student-id') {
      // 尝试从 localStorage 中的用户信息获取
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        try {
          const parsedUserInfo = JSON.parse(userInfoStr);
          this.studentId = parsedUserInfo.studentId;
        } catch (error) {
          console.error('解析localStorage中的用户信息失败:', error);
        }
      }
    }

    // 从路由参数获取作业ID
    this.assignmentId = this.$route.params.homeworkId;

    console.log('组件创建，路由参数:', this.$route.params);
    console.log('获取到的作业ID:', this.assignmentId);
    console.log('学生ID:', this.studentId);
    console.log('用户信息:', userInfo);

    // 加载作业详情
    if (this.assignmentId && this.studentId) {
      this.fetchHomeworkDetail();
    } else {
      console.error('未获取到作业ID或学生ID');
      this.$message.error('未获取到作业ID或学生信息');
    }
  },
  methods: {
    // 返回到引用地址
    goBack() {
      try {
        const q = this.$route?.query || {}
        // 优先：课程详情
        if (q.courseId) {
          this.$router.push({
            name: 'studentCourseDetail',
            params: { courseId: String(q.courseId) },
            query: q.courseName ? { courseName: q.courseName } : {}
          })
          return
        }
        // 其次：通用引用路由
        if (q.refRouteName) {
          let refParams = {}
          let refQuery = {}
          try { refParams = q.refParams ? JSON.parse(q.refParams) : {} } catch (e) { refParams = {} }
          try { refQuery = q.refQuery ? JSON.parse(q.refQuery) : {} } catch (e) { refQuery = {} }
          this.$router.push({ name: q.refRouteName, params: refParams, query: refQuery })
          return
        }
        // 兜底
        this.$router.back()
      } catch (e) {
        this.$router.back()
      }
    },
    // 获取作业详情
    async fetchHomeworkDetail() {
      try {
        this.loading = true;

        console.log('开始获取作业详情，作业ID:', this.assignmentId);

        if (!this.assignmentId) {
          console.error('作业ID为空');
          this.$message.error('作业ID不能为空');
          return;
        }

        // 获取作业信息
        console.log('正在获取作业信息...');
        const homeworkResponse = await assignmentAPI.getAssignmentById(this.assignmentId);
        console.log('作业信息响应:', homeworkResponse);
        this.homeworkInfo = homeworkResponse || {};

        // 获取题目列表
        console.log('正在获取题目列表...');
        const problemsResponse = await problemAPI.getProblemsByAssignment(this.assignmentId);
        console.log('题目列表响应:', problemsResponse);
        this.problems = Array.isArray(problemsResponse) ? problemsResponse.sort((a, b) => (a.sequence || 0) - (b.sequence || 0)) : [];

        console.log('最终数据:', {
          homeworkInfo: this.homeworkInfo,
          problems: this.problems,
          problemsCount: this.problems.length
        });

        // 调试：检查题目是否包含自动评分信息
        this.problems.forEach((problem, index) => {
          console.log(`题目 ${index + 1} 详细信息:`, {
            problemId: problem.problemId,
            title: problem.title,
            type: problem.type,
            autoGrading: problem.autoGrading || problem.auto_grading,
            auto_grading: problem.auto_grading, // 显示原始字段
            expectedAnswer: problem.expectedAnswer,
            score: problem.score,
            content: problem.content
          });
        });

        // 判断作业状态
        this.determineHomeworkStatus();

        // 初始化用户答案
        this.initializeUserAnswers();

        // 获取已提交的答案
        await this.fetchSubmittedAnswers();

        // 获取最终得分
        await this.fetchFinalScores();

        // 计算重做相关信息
        await this.calculateRedoInfo();

      } catch (error) {
        console.error('获取作业详情失败:', error);
        this.$message.error('获取作业详情失败，请稍后再试');
      } finally {
        this.loading = false;
      }
    },

    // 只获取题目数据（用于重做时）
    async fetchProblemsOnly() {
      try {
        console.log('正在重新获取题目列表...');
        const problemsResponse = await problemAPI.getProblemsByAssignment(this.assignmentId);
        console.log('题目列表响应:', problemsResponse);
        this.problems = Array.isArray(problemsResponse) ? problemsResponse.sort((a, b) => (a.sequence || 0) - (b.sequence || 0)) : [];

        console.log('重新获取的题目数据:', {
          problemsCount: this.problems.length,
          problems: this.problems
        });
      } catch (error) {
        console.error('获取题目数据失败:', error);
        this.$message.error('获取题目数据失败，请刷新页面重试');
      }
    },

    // 获取已提交的答案
    async fetchSubmittedAnswers() {
      try {
        console.log('正在获取已提交的答案...');
        const answers = await studentAnswerAPI.getAnswersByAssignment(this.assignmentId, this.studentId);
        console.log('已提交的答案:', answers);

        // 将答案按题目ID组织
        this.submittedAnswers = {};
        if (Array.isArray(answers)) {
          answers.forEach(answer => {
            if (answer.problemId) {
              this.submittedAnswers[answer.problemId] = {
                answerId: answer.answerId,
                answer: answer.answer,
                score: answer.score,
                isGraded: answer.score !== null && answer.score !== undefined
              };

              // 如果已经提交过答案，更新用户答案显示
              if (answer.answer) {
                this.userAnswers[answer.problemId] = answer.answer;
                this.answeredProblems[answer.problemId] = {
                  answer: answer.answer,
                  timestamp: answer.createdAt || new Date().toISOString(),
                  submitted: true
                };
              }
            }
          });
        }

        console.log('整理后的已提交答案:', this.submittedAnswers);
      } catch (error) {
        console.error('获取已提交答案失败:', error);
        // 不显示错误消息，因为可能是第一次做作业
      }
    },

    // 获取最终得分
    async fetchFinalScores() {
      try {
        console.log('正在获取作业答案和分数...');

        // 使用正确的API获取作业答案，包含autoScore
        const answers = await studentAnswerAPI.getAnswersByAssignment(this.assignmentId, this.studentId);
        console.log('作业答案:', answers);

        // 处理答案数据
        if (Array.isArray(answers)) {
          // 如果不是重做状态，直接使用后端数据
          // 如果是重做状态，需要合并前端已更新的分数
          if (!this.isRedoing) {
            this.finalScores = answers;
          } else {
            // 重做状态下，保留前端已更新的分数，只更新其他数据
            console.log('重做状态下合并分数数据');
            this.mergeFinalScores(answers);
          }

          // 计算自动判题总分
          this.autoScore = answers.reduce((sum, answer) => {
            if (answer && answer.autoScore !== undefined && answer.autoScore !== null) {
              const scoreValue = Number(answer.autoScore);
              return sum + (isNaN(scoreValue) ? 0 : scoreValue);
            }
            return sum;
          }, 0);

          // 计算总得分（兼容原有逻辑）
          this.totalFinalScore = answers.reduce((sum, answer) => {
            if (answer && answer.finalScore !== undefined && answer.finalScore !== null) {
              const scoreValue = Number(answer.finalScore);
              return sum + (isNaN(scoreValue) ? 0 : scoreValue);
            } else if (answer && answer.autoScore !== undefined && answer.autoScore !== null) {
              const scoreValue = Number(answer.autoScore);
              return sum + (isNaN(scoreValue) ? 0 : scoreValue);
            }
            return sum;
          }, 0);

          // 检查是否已提交
          this.isSubmitted = answers.length > 0;
        } else {
          this.finalScores = [];
          this.autoScore = 0;
          this.totalFinalScore = 0;
          this.isSubmitted = false;
          console.log('获取到的答案为空，可能还没有提交');
        }

        console.log('自动判题分数:', this.autoScore);
        console.log('总得分:', this.totalFinalScore);
        console.log('是否已提交:', this.isSubmitted);

        // 调试评分问题
        if (this.isSubmitted) {
          this.debugScoring();
        }
      } catch (error) {
        console.error('获取作业答案失败:', error);
        // 设置默认值，防止页面报错
        this.finalScores = [];
        this.autoScore = 0;
        this.totalFinalScore = 0;
        this.isSubmitted = false;
        // 不显示错误消息，因为可能还没有提交
      }
    },

    // 判断作业状态
    determineHomeworkStatus() {
      const now = new Date();
      const startTime = new Date(this.homeworkInfo.startTime);
      const endTime = new Date(this.homeworkInfo.endTime);

      if (now < startTime) {
        this.homeworkStatus = 'NOT_STARTED';
      } else if (now > endTime) {
        this.homeworkStatus = 'ENDED';
      } else {
        this.homeworkStatus = 'ONGOING';
      }
    },

    // 初始化用户答案
    initializeUserAnswers() {
      this.problems.forEach(problem => {
        if (problem.type === 'MULTI_CHOICE') {
          this.userAnswers[problem.problemId] = [];
        } else {
          this.userAnswers[problem.problemId] = '';
        }
      });
    },

    // 获取作业状态类型
    getHomeworkStatusType() {
      switch (this.homeworkStatus) {
        case 'NOT_STARTED': return 'info';
        case 'ONGOING': return 'warning';
        case 'ENDED': return 'danger';
        case 'SUBMITTED': return 'success';
        default: return 'info';
      }
    },

    // 获取作业状态文本
    getHomeworkStatusText() {
      switch (this.homeworkStatus) {
        case 'NOT_STARTED': return '未开始';
        case 'ONGOING': return '进行中';
        case 'ENDED': return '已截止';
        case 'SUBMITTED': return '已提交';
        default: return '未知状态';
      }
    },

    // 获取题目类型文本
    getProblemTypeText(type) {
      const typeMap = {
        'SINGLE_CHOICE': '单选题',
        'MULTI_CHOICE': '多选题',
        'TRUE_FALSE': '判断题',
        'FILL_BLANK': '填空题',
        'ESSAY_QUESTION': '简答题',
        'SUBJECTIVE': '主观题'
      };
      return typeMap[type] || '未知类型';
    },

    // 格式化题目内容
    formatProblemContent(content) {
      if (!content) return '';

      // 过滤掉选项内容，只保留纯题目文本
      let cleanContent = content;
      
      // 移除 A. B. C. D. 格式的选项
      cleanContent = cleanContent.replace(/([A-H])\.\s*[^A-H]*?(?=\s*[A-H]\.|$)/g, '');
      
      // 移除 A B C D 格式的选项
      cleanContent = cleanContent.replace(/([A-H])\s+[^A-H]*?(?=\s*[A-H]\s|$)/g, '');
      
      // 清理多余的空白字符
      cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

      // 简单的HTML转义和换行处理
      return cleanContent
        .replace(/\n/g, '<br>')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    },

    // 解析题目选项
    getProblemOptions(problem) {
      if (!['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(problem.type)) {
        return [];
      }

      const content = problem.content || '';
      const options = [];

      // 尝试多种格式解析选项
      // 格式1: A. 选项内容 (支持同行多选项)
      const pattern1 = /([A-H])\.\s*([^A-H]*?)(?=\s*[A-H]\.|$)/g;
      let match1;
      while ((match1 = pattern1.exec(content)) !== null) {
        options.push({
          value: match1[1],
          content: match1[2].trim()
        });
      }

      if (options.length > 0) return options;

      // 格式2: A 选项内容 (支持同行多选项)
      const pattern2 = /([A-H])\s+([^A-H]*?)(?=\s*[A-H]\s|$)/g;
      let match2;
      while ((match2 = pattern2.exec(content)) !== null) {
        options.push({
          value: match2[1],
          content: match2[2].trim()
        });
      }

      if (options.length > 0) return options;

      // 格式3: 按行分割，自动分配A、B、C、D
      const lines = content.split(/[\n\r]+/).filter(line => line.trim());
      if (lines.length > 1) {
        return lines.map((line, index) => ({
          value: String.fromCharCode(65 + index), // A, B, C, D...
          content: line.trim()
        }));
      }

      return [];
    },

    // 判断是否已答题（已提交答案或已暂存答案）
    isAnswered(problemId) {
      // 检查是否有暂存答案
      if (Object.prototype.hasOwnProperty.call(this.tempAnswers, problemId)) {
        return true;
      }
      // 检查是否有已提交答案
      return Object.prototype.hasOwnProperty.call(this.submittedAnswers, problemId);
    },

    // 判断答案是否有效
    isAnswerValid(problem) {
      const answer = this.userAnswers[problem.problemId];

      if (problem.type === 'MULTI_CHOICE') {
        return Array.isArray(answer) && answer.length > 0;
      } else {
        return answer && answer.toString().trim() !== '';
      }
    },

    // 保存答案
    async saveAnswer(problem) {
      try {
        this.saving = true;

        const answer = this.userAnswers[problem.problemId];

        // 格式化答案
        let formattedAnswer = answer;
        if (problem.type === 'MULTI_CHOICE' && Array.isArray(answer)) {
          formattedAnswer = answer.join(',');
        } else if (typeof answer !== 'string') {
          formattedAnswer = String(answer);
        }

        // 如果是重做状态或草稿模式，只暂存答案，不提交到后台
        if (this.isRedoing || this.answerMode === 'draft') {
          const targetStorage = this.isRedoing ? this.tempAnswers : this.tempAnswers;

          targetStorage[problem.problemId] = {
            answer: formattedAnswer,
            timestamp: new Date().toISOString(),
            submitted: false,
            isRedoing: this.isRedoing
          };

          this.$message.success('答案已暂存');
          return;
        }

        console.log('提交答案:', {
          studentId: this.studentId,
          problemId: problem.problemId,
          answer: formattedAnswer,
          problemInfo: {
            type: problem.type,
            autoGrading: problem.autoGrading || problem.auto_grading,
            expectedAnswer: problem.expectedAnswer,
            score: problem.score
          }
        });

        // 调用API提交答案
        let result;

        // 如果题目支持自动评分，尝试使用自动评分接口
        // 兼容 autoGrading 和 auto_grading 两种字段名
        const isAutoGrading = problem.autoGrading || problem.auto_grading;
        if (isAutoGrading && problem.expectedAnswer) {
          try {
            result = await studentAnswerAPI.submitAnswerWithAutoGrading(
              this.studentId,
              problem.problemId,
              formattedAnswer,
              true
            );
            console.log('自动评分提交结果:', result);
          } catch (error) {
            console.log('自动评分失败，使用普通提交:', error.message);
            result = await studentAnswerAPI.submitAnswer(
              this.studentId,
              problem.problemId,
              formattedAnswer
            );
          }
        } else {
          result = await studentAnswerAPI.submitAnswer(
            this.studentId,
            problem.problemId,
            formattedAnswer
          );
        }

        console.log('答案提交结果:', result);
        console.log('答案提交结果详细信息:', {
          result,
          hasScore: result && result.score !== undefined,
          score: result ? result.score : 'undefined',
          autoGraded: result ? result.autoGraded : 'undefined'
        });

        // 如果后端没有自动评分，在前端进行评分
        if (isAutoGrading && problem.expectedAnswer && (!result || result.score === undefined)) {
          console.log('后端未返回评分，执行前端自动评分');
          const clientScore = this.performClientSideGrading(formattedAnswer, problem);
          console.log('前端评分结果:', clientScore);

          // 将前端评分结果添加到结果中
          if (result) {
            result.score = clientScore;
            result.autoGraded = true;
            result.gradedByClient = true;
          }
        }

        // 更新本地状态
        this.answeredProblems[problem.problemId] = {
          answer: answer,
          timestamp: new Date().toISOString(),
          submitted: true
        };

        // 更新已提交答案记录，确保数据类型正确
        this.submittedAnswers[problem.problemId] = {
          answerId: result && (result.answerId || result.id) ? String(result.answerId || result.id) : null,
          answer: formattedAnswer,
          timestamp: new Date().toISOString(),
          score: result && result.score !== undefined ? Number(result.score) : null,
          isGraded: result && result.score !== undefined,
          autoGraded: result && result.autoGraded === true,
          gradedByClient: result && result.gradedByClient === true
        };

        // 如果有评分结果，立即更新最终得分
        if (result && result.score !== undefined) {
          this.updateFinalScoreForProblem(problem.problemId, Number(result.score));
        }

        this.$message.success('答案已保存');

      } catch (error) {
        console.error('保存答案失败:', error);
        this.$message.error('保存答案失败，请稍后再试');
      } finally {
        this.saving = false;
      }
    },

    // 下一题
    nextProblem() {
      if (this.currentProblemIndex < this.problems.length - 1) {
        this.currentProblemIndex++;
      }
    },

    // 上一题
    prevProblem() {
      if (this.currentProblemIndex > 0) {
        this.currentProblemIndex--;
      }
    },

    // 提交作业
    async submitHomework() {
      try {
        if (this.isRedoing) {
          // 重做状态下的提交逻辑
          await this.submitRedoHomework();
        } else {
          // 正常提交逻辑
          await this.submitNormalHomework();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('提交作业失败:', error);
          this.$message.error('提交作业失败，请稍后再试');
        }
      } finally {
        this.submitting = false;
      }
    },

    // 正常提交作业
    async submitNormalHomework() {
      // 检查是否有未暂存的答案
      const unsavedAnswers = [];
      this.problems.forEach(problem => {
        const hasAnswer = this.isAnswerValid(problem);
        const isSaved = this.tempAnswers[problem.problemId] || this.submittedAnswers[problem.problemId];
        if (hasAnswer && !isSaved) {
          unsavedAnswers.push(problem.title || `题目${problem.problemId}`);
        }
      });

      if (unsavedAnswers.length > 0) {
        await this.$confirm(
          `以下题目有答案但未暂存：\n${unsavedAnswers.join('\n')}\n\n是否先暂存这些答案？`,
          '发现未暂存的答案',
          {
            confirmButtonText: '先暂存',
            cancelButtonText: '直接提交',
            type: 'warning'
          }
        );

        // 批量暂存未暂存的答案
        for (const problem of this.problems) {
          const hasAnswer = this.isAnswerValid(problem);
          const isSaved = this.tempAnswers[problem.problemId] || this.submittedAnswers[problem.problemId];
          if (hasAnswer && !isSaved) {
            await this.saveAnswer(problem);
          }
        }
      }

      // 确认提交
      const tempAnswerCount = Object.keys(this.tempAnswers).length;
      const confirmMessage = tempAnswerCount > 0
        ? `确定要提交作业吗？将提交 ${tempAnswerCount} 道暂存题目的答案，提交后将无法修改答案。`
        : '确定要提交作业吗？提交后将无法修改答案。';

      await this.$confirm(confirmMessage, '确认提交', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      this.submitting = true;

      try {
        // 批量提交所有暂存的答案
        if (tempAnswerCount > 0) {
          await this.submitAllTempAnswers();
        }

        // 更新作业状态
        this.homeworkStatus = 'SUBMITTED';
        this.isSubmitted = true;

        // 清空暂存答案
        this.tempAnswers = {};

        // 立即重新计算总分
        this.recalculateTotalScore();
      } catch (error) {
        console.error('提交暂存答案失败:', error);
        this.$message.error('提交部分答案失败，请检查后重试');
        throw error;
      }

      // 重新获取最终得分（可能需要等待自动评分）
      setTimeout(async () => {
        await this.fetchFinalScores();
        // 重新计算重做信息
        await this.calculateRedoInfo();

        // 重新计算总分（以防后端数据有更新）
        this.recalculateTotalScore();

        if (this.totalFinalScore > 0) {
          this.$message.success(`作业提交成功！总得分：${this.totalFinalScore}分`);
        } else {
          this.$message.success('作业提交成功！正在评分中...');
        }
      }, 1000);

      this.$message.success('作业提交成功！');
    },

    // 重做状态下提交作业
    async submitRedoHomework() {
      if (Object.keys(this.tempAnswers).length === 0) {
        this.$message.warning('请至少回答一道题目');
        return;
      }

      // 确认重新提交
      await this.$confirm(
        `确定要重新提交作业吗？这将消耗1次重做机会，剩余 ${this.remainingAttempts - 1} 次机会。`,
        '确认重新提交',
        {
          confirmButtonText: '确定提交',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );

      this.submitting = true;

      try {
        // 批量提交所有暂存的答案
        for (const problemId of Object.keys(this.tempAnswers)) {
          const tempAnswer = this.tempAnswers[problemId];
          const problem = this.problems.find(p => p.problemId === problemId);

          if (problem && tempAnswer) {
            // 直接调用后端提交，强制提交到后端
            await this.forceSubmitAnswer(problem, tempAnswer.answer);
          }
        }

        // 更新本地存储的重做次数
        const storageKey = `redo_attempts_${this.studentId}_${this.assignmentId}`;
        try {
          const storedData = localStorage.getItem(storageKey);
          let usedAttempts = 1; // 默认已使用1次

          if (storedData) {
            const data = JSON.parse(storedData);
            usedAttempts = (data.usedAttempts || 1) + 1; // 增加使用次数
          }

          localStorage.setItem(storageKey, JSON.stringify({
            usedAttempts: usedAttempts,
            lastRedoTime: new Date().toISOString()
          }));

          console.log('更新本地重做次数:', usedAttempts);
        } catch (error) {
          console.error('更新本地存储失败:', error);
        }

        // 退出重做状态
        this.isRedoing = false;
        this.tempAnswers = {};

        // 立即重新计算总分
        this.recalculateTotalScore();

        // 重新获取最终得分和重做信息
        setTimeout(async () => {
          await this.fetchFinalScores();
          await this.calculateRedoInfo();

          // 重新计算总分（以防后端数据有更新）
          this.recalculateTotalScore();

          if (this.totalFinalScore > 0) {
            this.$message.success(`作业重新提交成功！新得分：${this.totalFinalScore}分`);
          } else {
            this.$message.success('作业重新提交成功！正在评分中...');
          }
        }, 1000);

        this.$message.success('作业重新提交成功！');

      } catch (error) {
        console.error('重新提交作业失败:', error);
        this.$message.error('重新提交作业失败，请稍后再试');
        throw error;
      }
    },

    // 批量提交所有暂存的答案
    async submitAllTempAnswers() {
      console.log('开始批量提交暂存答案:', this.tempAnswers);

      for (const problemId of Object.keys(this.tempAnswers)) {
        const tempAnswer = this.tempAnswers[problemId];
        const problem = this.problems.find(p => p.problemId === problemId);

        if (problem && tempAnswer) {
          // 使用强制提交方法，确保能够覆盖之前的答案
          await this.forceSubmitAnswer(problem, tempAnswer.answer);
        }
      }

      console.log('所有暂存答案提交完成');
    },

    // 强制提交答案到后端（用于重做时覆盖之前的答案）
    async forceSubmitAnswer(problem, answer) {
      try {
        console.log(`强制提交题目 ${problem.problemId} 的答案:`, answer);

        // 调用API提交答案
        let result;

        // 如果题目支持自动评分，尝试使用自动评分接口
        const isAutoGrading = problem.autoGrading || problem.auto_grading;
        if (isAutoGrading && problem.expectedAnswer) {
          try {
            result = await studentAnswerAPI.submitAnswerWithAutoGrading(
              this.studentId,
              problem.problemId,
              answer,
              true
            );
            console.log('自动评分提交结果:', result);
          } catch (error) {
            console.log('自动评分失败，使用普通提交:', error.message);
            result = await studentAnswerAPI.submitAnswer(
              this.studentId,
              problem.problemId,
              answer
            );
          }
        } else {
          result = await studentAnswerAPI.submitAnswer(
            this.studentId,
            problem.problemId,
            answer
          );
        }

        console.log('强制提交结果:', result);

        // 如果后端没有自动评分，在前端进行评分
        if (isAutoGrading && problem.expectedAnswer && (!result || result.score === undefined)) {
          console.log('后端未返回评分，执行前端自动评分');
          const clientScore = this.performClientSideGrading(answer, problem);
          console.log('前端评分结果:', clientScore);

          if (result) {
            result.score = clientScore;
            result.autoGraded = true;
            result.gradedByClient = true;
          }
        }

        // 强制更新已提交答案记录，覆盖之前的记录
        this.submittedAnswers[problem.problemId] = {
          answerId: result && (result.answerId || result.id) ? String(result.answerId || result.id) : null,
          answer: answer,
          timestamp: new Date().toISOString(),
          score: result && result.score !== undefined ? Number(result.score) : null,
          isGraded: result && result.score !== undefined,
          autoGraded: result && result.autoGraded === true,
          gradedByClient: result && result.gradedByClient === true
        };

        // 强制更新最终得分，覆盖之前的分数
        if (result && result.score !== undefined) {
          this.updateFinalScoreForProblem(problem.problemId, Number(result.score));
        }

        console.log(`题目 ${problem.problemId} 强制提交成功，新分数:`, result?.score);

        return result;

      } catch (error) {
        console.error(`强制提交题目 ${problem.problemId} 失败:`, error);
        throw new Error(`提交题目 ${problem.problemId} 失败: ${error.message}`);
      }
    },

    // 重新计算总分
    recalculateTotalScore() {
      console.log('重新计算总分...');

      // 从已提交答案中重新计算总分
      let newTotalScore = 0;
      const newFinalScores = [];

      Object.keys(this.submittedAnswers).forEach(problemId => {
        const submittedAnswer = this.submittedAnswers[problemId];
        if (submittedAnswer && submittedAnswer.score !== null && submittedAnswer.score !== undefined) {
          const score = Number(submittedAnswer.score);
          if (!isNaN(score)) {
            newTotalScore += score;
            newFinalScores.push({
              problemId: String(problemId),
              finalScore: score,
              timestamp: submittedAnswer.timestamp || new Date().toISOString()
            });
          }
        }
      });

      // 更新总分和分数列表
      this.totalFinalScore = newTotalScore;
      this.finalScores = newFinalScores;

      console.log('重新计算总分完成:', {
        totalFinalScore: this.totalFinalScore,
        finalScores: this.finalScores
      });
    },

    // 合并最终得分（用于重做时保留前端更新的分数）
    mergeFinalScores(backendAnswers) {
      console.log('合并前端和后端分数数据');

      // 创建一个映射来快速查找前端已更新的分数
      const frontendScoreMap = {};
      this.finalScores.forEach(score => {
        if (score && score.problemId) {
          frontendScoreMap[score.problemId] = score;
        }
      });

      // 合并后端数据，但保留前端已更新的分数
      const mergedScores = [];
      backendAnswers.forEach(answer => {
        if (answer && answer.problemId) {
          const frontendScore = frontendScoreMap[answer.problemId];
          if (frontendScore) {
            // 使用前端已更新的分数
            mergedScores.push(frontendScore);
            console.log(`保留题目 ${answer.problemId} 的前端分数:`, frontendScore.finalScore);
          } else {
            // 使用后端分数
            mergedScores.push({
              problemId: String(answer.problemId),
              finalScore: answer.finalScore || answer.autoScore || 0,
              timestamp: answer.updatedAt || answer.createdAt || new Date().toISOString()
            });
          }
        }
      });

      this.finalScores = mergedScores;
      console.log('合并后的分数数据:', this.finalScores);
    },

    // 获取显示的答案
    getDisplayAnswer(problem) {
      const answered = this.answeredProblems[problem.problemId];
      if (!answered) return '';

      const answer = answered.answer;

      if (problem.type === 'MULTI_CHOICE') {
        return Array.isArray(answer) ? answer.join(', ') : '';
      } else if (problem.type === 'TRUE_FALSE') {
        return answer === 'true' ? '正确' : '错误';
      } else {
        return answer;
      }
    },

    // 获取草稿答案按钮文本
    getDraftAnswerButtonText(problem) {
      if (this.isRedoing) {
        return '暂存答案';
      }

      const hasTempAnswer = this.tempAnswers[problem.problemId];
      const hasSubmittedAnswer = this.submittedAnswers[problem.problemId];

      if (hasTempAnswer) {
        return '重新暂存';
      } else if (hasSubmittedAnswer) {
        return '重新保存';
      } else {
        return '暂存答案';
      }
    },

    // 获取草稿答案状态
    getDraftAnswerStatus(problemId) {
      return this.tempAnswers[problemId] || this.submittedAnswers[problemId];
    },

    // 获取草稿答案标签类型
    getDraftAnswerTagType(problemId) {
      if (this.tempAnswers[problemId]) {
        return 'warning'; // 暂存状态用警告色
      } else if (this.submittedAnswers[problemId]) {
        return 'success'; // 已提交状态用成功色
      }
      return 'default';
    },

    // 获取草稿答案标签文本
    getDraftAnswerTagText(problemId) {
      if (this.tempAnswers[problemId]) {
        return '已暂存';
      } else if (this.submittedAnswers[problemId]) {
        return '已提交';
      }
      return '';
    },

    // 获取提交按钮是否禁用
    getSubmitButtonDisabled() {
      if (this.isRedoing) {
        return Object.keys(this.tempAnswers).length === 0;
      } else {
        return this.completedCount === 0;
      }
    },

    // 获取提交按钮文本
    getSubmitButtonText() {
      if (this.isRedoing) {
        return `重新提交作业 (${Object.keys(this.tempAnswers).length}/${this.problems.length})`;
      } else {
        const tempCount = Object.keys(this.tempAnswers).length;
        const totalAnswered = this.completedCount;

        if (tempCount > 0) {
          return `提交作业 (${totalAnswered}/${this.problems.length}, ${tempCount}题暂存)`;
        } else {
          return `提交作业 (${totalAnswered}/${this.problems.length})`;
        }
      }
    },

    // 获取提交提示文本
    getSubmitTipText() {
      if (this.isRedoing) {
        return '重新提交后将消耗一次重做机会';
      } else {
        const tempCount = Object.keys(this.tempAnswers).length;
        if (tempCount > 0) {
          return `提交后将把 ${tempCount} 道暂存题目的答案正式提交，提交后将无法修改答案`;
        } else {
          return '提交后将无法修改答案';
        }
      }
    },

    // 计算重做相关信息
    async calculateRedoInfo() {
      const maxAttempts = this.homeworkInfo.maxAttempts || 0;

      console.log('开始计算重做信息:', {
        maxAttempts,
        isSubmitted: this.isSubmitted,
        studentId: this.studentId,
        assignmentId: this.assignmentId,
        totalFinalScore: this.totalFinalScore
      });

      if (maxAttempts > 0) {
        // 使用前端逻辑计算重做信息
        console.log('使用前端重做逻辑');
        this.calculateRedoInfoFallback(maxAttempts);
      } else {
        this.remainingAttempts = 0;
        this.canRedo = false;
      }

      console.log('最终重做信息:', {
        maxAttempts,
        remainingAttempts: this.remainingAttempts,
        canRedo: this.canRedo,
        isSubmitted: this.isSubmitted
      });
    },

    // 前端重做信息计算（后备方案）
    calculateRedoInfoFallback(maxAttempts) {
      console.log('使用前端重做逻辑');

      // 获取本地存储的重做次数信息
      const storageKey = `redo_attempts_${this.studentId}_${this.assignmentId}`;
      let usedAttempts = 0;

      try {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          const data = JSON.parse(storedData);
          usedAttempts = data.usedAttempts || 0;
          console.log('从本地存储获取已使用次数:', usedAttempts);
        }
      } catch (error) {
        console.error('读取本地存储失败:', error);
      }

      // 如果已提交但本地存储显示未使用过，说明这是第一次提交
      if (this.isSubmitted && usedAttempts === 0) {
        usedAttempts = 1;
        // 保存到本地存储
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            usedAttempts: usedAttempts,
            lastSubmitTime: new Date().toISOString()
          }));
        } catch (error) {
          console.error('保存本地存储失败:', error);
        }
      }

      this.remainingAttempts = Math.max(0, maxAttempts - usedAttempts);
      this.canRedo = this.isSubmitted && this.remainingAttempts > 0;

      console.log('前端计算结果:', {
        maxAttempts,
        usedAttempts,
        remainingAttempts: this.remainingAttempts,
        canRedo: this.canRedo,
        isSubmitted: this.isSubmitted
      });
    },

    // 重做作业
    async redoHomework() {
      try {
        if (this.remainingAttempts <= 0) {
          this.$message.warning('没有剩余的重做次数');
          return;
        }

        // 确认重做
        await this.$confirm(
          `确定要重新做作业吗？您可以重新答题后再提交，这样才会消耗重做机会。`,
          '确认重做',
          {
            confirmButtonText: '开始重做',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        console.log('开始重做作业...');

        // 检查题目数据是否存在
        if (!this.problems || this.problems.length === 0) {
          console.error('题目数据为空，重新获取题目数据');
          await this.fetchProblemsOnly();
        }

        // 进入重做状态
        this.isRedoing = true;

        // 清空所有暂存答案（包括重做和正常暂存的）
        this.tempAnswers = {};

        // 清空当前用户答案，但保留原始提交的答案用于参考
        this.userAnswers = {};

        // 重新判断作业状态
        this.determineHomeworkStatus();

        // 重新初始化用户答案
        this.initializeUserAnswers();

        // 回到第一题
        this.currentProblemIndex = 0;

        // 调试信息
        console.log('重做状态设置完成:', {
          isRedoing: this.isRedoing,
          problemsLength: this.problems.length,
          currentProblemIndex: this.currentProblemIndex,
          currentProblem: this.currentProblem,
          userAnswers: this.userAnswers,
          tempAnswers: this.tempAnswers,
          canAnswer: this.canAnswer
        });

        // 强制触发视图更新
        this.$nextTick(() => {
          this.$forceUpdate();
        });

        this.$message.success('已进入重做模式，您可以重新答题。完成后点击"重新提交作业"按钮。');

      } catch (error) {
        if (error !== 'cancel') {
          console.error('重做作业失败:', error);
          this.$message.error('重做作业失败，请稍后再试');
        }
      }
    },

    // 取消重做
    cancelRedo() {
      this.$confirm('确定要取消重做吗？已暂存的答案将会丢失。', '确认取消', {
        confirmButtonText: '确定',
        cancelButtonText: '继续重做',
        type: 'warning'
      }).then(() => {
        // 退出重做状态
        this.isRedoing = false;

        // 清空临时答案
        this.tempAnswers = {};

        // 恢复原来的用户答案
        this.restoreOriginalAnswers();

        this.$message.info('已取消重做');
      }).catch(() => {
        // 用户选择继续重做，不做任何操作
      });
    },

    // 恢复原始答案
    restoreOriginalAnswers() {
      this.userAnswers = {};

      // 从已提交的答案中恢复
      Object.keys(this.submittedAnswers).forEach(problemId => {
        const submittedAnswer = this.submittedAnswers[problemId];
        if (submittedAnswer && submittedAnswer.answer) {
          // 根据题目类型恢复答案格式
          const problem = this.problems.find(p => p.problemId === problemId);
          if (problem && problem.type === 'MULTI_CHOICE') {
            this.userAnswers[problemId] = submittedAnswer.answer.split(',');
          } else {
            this.userAnswers[problemId] = submittedAnswer.answer;
          }
        }
      });
    },

    // 调试评分问题
    async debugScoring() {
      console.log('=== 开始调试评分问题 ===');

      // 1. 检查题目信息
      console.log('题目信息检查:');
      this.problems.forEach((problem, index) => {
        console.log(`题目 ${index + 1}:`, {
          problemId: problem.problemId,
          type: problem.type,
          autoGrading: problem.autoGrading || problem.auto_grading,
          auto_grading: problem.auto_grading, // 显示原始字段
          expectedAnswer: problem.expectedAnswer,
          score: problem.score,
          hasExpectedAnswer: !!problem.expectedAnswer
        });
      });

      // 2. 检查已提交的答案
      console.log('已提交答案检查:');
      console.log('submittedAnswers:', this.submittedAnswers);

      // 3. 检查最终得分
      console.log('最终得分检查:');
      console.log('finalScores:', this.finalScores);
      console.log('totalFinalScore:', this.totalFinalScore);

      // 4. 检查每个题目的答案和得分匹配情况
      console.log('答案与得分匹配检查:');
      this.problems.forEach((problem, index) => {
        const submittedAnswer = this.submittedAnswers[problem.problemId];
        const finalScore = this.finalScores.find(s => s && s.problemId === problem.problemId);

        console.log(`题目 ${index + 1} 匹配情况:`, {
          problemId: problem.problemId,
          expectedAnswer: problem.expectedAnswer,
          submittedAnswer: submittedAnswer ? submittedAnswer.answer : 'none',
          finalScore: finalScore ? finalScore.finalScore : 'none',
          maxScore: problem.score,
          isAutoGrading: problem.autoGrading || problem.auto_grading,
          shouldBeCorrect: submittedAnswer && problem.expectedAnswer &&
                          this.compareAnswers(submittedAnswer.answer, problem.expectedAnswer, problem.type)
        });
      });

      console.log('=== 调试结束 ===');
    },

    // 比较答案是否正确（用于调试）
    compareAnswers(userAnswer, expectedAnswer, problemType) {
      if (!userAnswer || !expectedAnswer) return false;

      // 标准化答案格式
      const normalizeAnswer = (answer) => {
        return String(answer).trim().toLowerCase();
      };

      const normalizedUser = normalizeAnswer(userAnswer);
      const normalizedExpected = normalizeAnswer(expectedAnswer);

      if (problemType === 'MULTI_CHOICE') {
        // 多选题：比较选项数组
        const userOptions = normalizedUser.split(',').map(s => s.trim()).sort();
        const expectedOptions = normalizedExpected.split(',').map(s => s.trim()).sort();
        return JSON.stringify(userOptions) === JSON.stringify(expectedOptions);
      } else {
        // 其他题型：直接比较
        return normalizedUser === normalizedExpected;
      }
    },

    // 前端自动评分
    performClientSideGrading(userAnswer, problem) {
      if (!problem.expectedAnswer || !userAnswer) {
        console.log('缺少预期答案或用户答案，无法评分');
        return 0;
      }

      const isCorrect = this.enhancedCompareAnswers(userAnswer, problem.expectedAnswer, problem.type);
      const score = isCorrect ? (problem.score || 0) : 0;

      console.log('前端评分详情:', {
        userAnswer,
        expectedAnswer: problem.expectedAnswer,
        problemType: problem.type,
        isCorrect,
        score,
        maxScore: problem.score
      });

      return score;
    },

    // 增强的答案比较逻辑
    enhancedCompareAnswers(userAnswer, expectedAnswer, problemType) {
      if (!userAnswer || !expectedAnswer) return false;

      // 标准化答案格式
      const normalizeAnswer = (answer) => {
        return String(answer).trim().toLowerCase()
          .replace(/\s+/g, ' ') // 多个空格替换为单个空格
          .replace(/[，。！？；：""''（）【】]/g, match => {
            // 中文标点转英文标点
            const map = {
              '，': ',', '。': '.', '！': '!', '？': '?',
              '；': ';', '：': ':', '\u201c': '"', '\u201d': '"',
              '\u2018': "'", '\u2019': "'", '（': '(', '）': ')',
              '【': '[', '】': ']'
            };
            return map[match] || match;
          });
      };

      const normalizedUser = normalizeAnswer(userAnswer);
      const normalizedExpected = normalizeAnswer(expectedAnswer);

      console.log('答案比较:', {
        original: { user: userAnswer, expected: expectedAnswer },
        normalized: { user: normalizedUser, expected: normalizedExpected }
      });

      switch (problemType) {
        case 'MULTI_CHOICE': {
          // 多选题：比较选项数组
          const userOptions = normalizedUser.split(/[,，]/).map(s => s.trim()).filter(s => s).sort();
          const expectedOptions = normalizedExpected.split(/[,，]/).map(s => s.trim()).filter(s => s).sort();
          return JSON.stringify(userOptions) === JSON.stringify(expectedOptions);
        }

        case 'TRUE_FALSE': {
          // 判断题：支持多种表达方式
          const trueValues = ['true', '正确', '对', 'yes', 'y', 't', '1'];
          const falseValues = ['false', '错误', '错', 'no', 'n', 'f', '0'];

          const userIsTrueValue = trueValues.includes(normalizedUser);
          const userIsFalseValue = falseValues.includes(normalizedUser);
          const expectedIsTrueValue = trueValues.includes(normalizedExpected);
          const expectedIsFalseValue = falseValues.includes(normalizedExpected);

          return (userIsTrueValue && expectedIsTrueValue) || (userIsFalseValue && expectedIsFalseValue);
        }

        case 'FILL_BLANK':
          // 填空题：支持模糊匹配
          return normalizedUser === normalizedExpected ||
                 normalizedUser.includes(normalizedExpected) ||
                 normalizedExpected.includes(normalizedUser);

        case 'SINGLE_CHOICE':
        default:
          // 单选题和其他题型：精确匹配
          return normalizedUser === normalizedExpected;
      }
    },



    // 更新单个题目的最终得分
    updateFinalScoreForProblem(problemId, score) {
      console.log(`更新题目 ${problemId} 的得分:`, {
        oldScore: this.finalScores.find(s => s && s.problemId === problemId)?.finalScore,
        newScore: score
      });

      // 查找是否已存在该题目的得分记录
      const existingScoreIndex = this.finalScores.findIndex(s => s && s.problemId === problemId);

      const scoreRecord = {
        problemId: String(problemId),
        finalScore: Number(score),
        timestamp: new Date().toISOString()
      };

      if (existingScoreIndex >= 0) {
        // 更新现有记录
        console.log(`覆盖题目 ${problemId} 的现有得分记录`);
        this.finalScores[existingScoreIndex] = scoreRecord;
      } else {
        // 添加新记录
        console.log(`添加题目 ${problemId} 的新得分记录`);
        this.finalScores.push(scoreRecord);
      }

      // 重新计算总得分
      const oldTotalScore = this.totalFinalScore;
      this.totalFinalScore = this.finalScores.reduce((sum, scoreItem) => {
        if (scoreItem && typeof scoreItem === 'object' && scoreItem.finalScore !== undefined && scoreItem.finalScore !== null) {
          const scoreValue = Number(scoreItem.finalScore);
          return sum + (isNaN(scoreValue) ? 0 : scoreValue);
        }
        return sum;
      }, 0);

      console.log(`总分更新: ${oldTotalScore} -> ${this.totalFinalScore}`);

      // 更新提交状态
      this.isSubmitted = this.finalScores.length > 0;

      console.log('更新题目得分:', {
        problemId,
        score,
        totalFinalScore: this.totalFinalScore,
        finalScores: this.finalScores
      });
    },

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '未设置';

      try {
        const date = new Date(dateTime);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return '时间格式错误';
      }
    },

    // 进度格式化
    percentFormat(percentage) {
      return `${percentage}%`;
    },

    // 获取得分百分比
    getScorePercentage() {
      if (this.totalScore === 0) return 0;
      return Math.round((this.totalFinalScore / this.totalScore) * 100);
    },

    // 获取答对题数
    getCorrectCount() {
      return this.finalScores.filter(score => {
        if (!score || !score.finalScore) return false;
        const problem = this.problems.find(p => p.problemId === score.problemId);
        return problem && score.finalScore === problem.score;
      }).length;
    },

    // 获取正确率
    getAccuracyRate() {
      if (this.problems.length === 0) return 0;
      return Math.round((this.getCorrectCount() / this.problems.length) * 100);
    },

    // 判断题目是否答对
    isProblemCorrect(problem) {
      const score = this.finalScores.find(s => s && s.problemId === problem.problemId);
      return score && score.finalScore === problem.score;
    },

    // 判断题目是否有得分
    hasScore(problem) {
      const score = this.finalScores.find(s => s && s.problemId === problem.problemId);
      return score && score.finalScore !== undefined && score.finalScore !== null;
    },

    // 获取题目得分
    getProblemScore(problem) {
      const score = this.finalScores.find(s => s && s.problemId === problem.problemId);
      return score && score.finalScore !== undefined ? score.finalScore : 0;
    },

    // 获取成绩等级类型
    getGradeType() {
      const percentage = this.getScorePercentage();
      if (percentage >= 90) return 'success';
      if (percentage >= 80) return '';
      if (percentage >= 70) return 'warning';
      if (percentage >= 60) return 'info';
      return 'danger';
    },

    // 获取成绩等级文本
    getGradeText() {
      const percentage = this.getScorePercentage();
      if (percentage >= 90) return '优秀';
      if (percentage >= 80) return '良好';
      if (percentage >= 70) return '中等';
      if (percentage >= 60) return '及格';
      return '不及格';
    },

    // 获取成绩评语
    getGradeComment() {
      const percentage = this.getScorePercentage();
      const correctCount = this.getCorrectCount();
      const totalCount = this.problems.length;

      if (percentage >= 90) {
        return `恭喜你！你在这次作业中表现优秀，答对了 ${correctCount}/${totalCount} 题，正确率达到 ${this.getAccuracyRate()}%。继续保持！`;
      } else if (percentage >= 80) {
        return `很好！你的成绩良好，答对了 ${correctCount}/${totalCount} 题。继续努力，争取更好的成绩！`;
      } else if (percentage >= 70) {
        return `不错！你的成绩中等，答对了 ${correctCount}/${totalCount} 题。还有提升空间，加油！`;
      } else if (percentage >= 60) {
        return `你已经及格了，答对了 ${correctCount}/${totalCount} 题。建议复习错题，提高理解。`;
      } else {
        return `这次成绩不太理想，答对了 ${correctCount}/${totalCount} 题。建议重新学习相关知识点，如果可以重做，不妨再试一次。`;
      }
    }
  }
};
</script>

<style scoped>
.homework-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  padding: 40px;
}

/* 重做状态提示 */
.redo-alert {
  margin-bottom: 20px;
}

/* 作业信息卡片 */
.homework-info-card {
  margin-bottom: 20px;
}

.homework-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.header-left h2 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.homework-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
}

.homework-meta span {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.homework-meta i {
  margin-right: 5px;
  color: #909399;
}

.homework-description {
  color: #606266;
  line-height: 1.6;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.header-right {
  margin-left: 20px;
}

.status-tag {
  font-size: 16px;
  padding: 8px 16px;
}

/* 进度卡片 */
.progress-card {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-header h3 {
  margin: 0;
  color: #303133;
}

.progress-stats {
  font-size: 14px;
  color: #606266;
}

/* 题目卡片 */
.problems-card {
  margin-bottom: 20px;
}

.problems-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.problems-header h3 {
  margin: 0;
  color: #303133;
}

.problems-nav {
  display: flex;
  gap: 5px;
}

.empty-container {
  text-align: center;
  padding: 40px;
}

.problems-container {
  min-height: 400px;
}

/* 当前题目 */
.current-problem {
  margin-bottom: 30px;
}

.problem-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e4e7ed;
}

.problem-number {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  margin-right: 10px;
}

.problem-type {
  background: #409eff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 10px;
}

.problem-score {
  color: #f56c6c;
  font-weight: 600;
}

.problem-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  line-height: 1.6;
}

.problem-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  line-height: 1.8;
  color: #606266;
}

/* 答题区域 */
.answer-area {
  margin-top: 20px;
}

.problem-options {
  margin-bottom: 20px;
}

.option-item {
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 6px;
  transition: background-color 0.3s;
  display: flex;
  align-items: flex-start;
}

.option-item:hover {
  background-color: #f5f7fa;
}

.option-label {
  font-weight: 600;
  color: #409eff;
  margin-right: 8px;
  min-width: 24px;
  flex-shrink: 0;
}

.option-content {
  color: #303133;
  line-height: 1.6;
  flex: 1;
  word-wrap: break-word;
}

.answer-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  margin-top: 20px;
}

/* 结果区域 */
.result-area {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.my-answer, .correct-answer {
  margin-bottom: 15px;
}

.answer-label {
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.answer-content {
  color: #606266;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

/* 题目导航 */
.problem-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.nav-info {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 提交按钮 */
.submit-homework-container {
  text-align: center;
  margin-top: 30px;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 6px;
}

.submit-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.submitted-info, .deadline-passed {
  max-width: 600px;
  margin: 0 auto;
}

.final-score {
  color: #67c23a;
  font-weight: 600;
}

.score-hidden {
  color: #909399;
  font-weight: 600;
}

.score-pending {
  color: #e6a23c;
  font-weight: 600;
}

.attempts-info {
  color: #e6a23c;
  font-weight: 600;
}

.redo-section {
  margin-top: 20px;
  padding: 20px;
  background: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 8px;
  text-align: center;
}

.redo-tip {
  margin-top: 10px;
  color: #e6a23c;
  font-size: 14px;
}

/* 得分详情样式 */
.score-details {
  margin-top: 20px;
}

.score-card {
  max-width: 800px;
  margin: 0 auto;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.score-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.total-score {
  font-size: 24px;
  font-weight: bold;
  color: #67c23a;
}

.score-percentage {
  font-size: 16px;
  color: #909399;
}

.score-breakdown {
  padding: 20px 0;
}

.score-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.problem-scores h4 {
  margin: 20px 0 15px 0;
  color: #303133;
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.problem-score-list {
  display: grid;
  gap: 10px;
}

.problem-score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
  transition: all 0.3s;
}

.problem-score-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.problem-score-item.correct {
  border-color: #67c23a;
  background: #f0f9ff;
}

.problem-score-item.incorrect {
  border-color: #f56c6c;
  background: #fef0f0;
}

.problem-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.problem-number {
  font-weight: 600;
  color: #303133;
}

.problem-type {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.score-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.earned-score {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.score-status {
  margin-left: 10px;
}

.correct-icon {
  color: #67c23a;
  font-size: 16px;
}

.incorrect-icon {
  color: #f56c6c;
  font-size: 16px;
}

.pending-icon {
  color: #e6a23c;
  font-size: 16px;
}

.score-grade {
  margin-top: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  text-align: center;
}

.grade-info {
  margin-bottom: 15px;
}

.grade-label {
  font-size: 16px;
  color: #303133;
  margin-right: 10px;
}

.grade-comment {
  color: #606266;
  line-height: 1.6;
}

.grade-comment p {
  margin: 0;
  font-size: 14px;
}

/* 调试区域样式 */
.debug-redo-section {
  margin-top: 20px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.debug-info p {
  margin: 8px 0;
  font-size: 14px;
}

.debug-info strong {
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .homework-detail-container {
    padding: 10px;
  }

  .homework-header {
    flex-direction: column;
    gap: 15px;
  }

  .header-right {
    margin-left: 0;
    align-self: flex-start;
  }

  .homework-meta {
    flex-direction: column;
    gap: 10px;
  }

  .problems-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .problem-navigation {
    flex-direction: column;
    gap: 15px;
  }
}
</style>