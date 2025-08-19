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
      <!-- 考试统计信息
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
      </div> -->

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
            <el-table-column label="分数" min-width="200" sortable align="center" header-align="center">
              <template #default="scope">
                <div style="display: flex; justify-content: space-around; align-items: center;">
                  <span :class="getScoreClass(scope.row.regularScore)" style="margin-right: 8px;">
                    常规: {{ scope.row.regularScore || 0 }}
                  </span>
                  <span :class="getScoreClass(scope.row.codeScore)" style="margin-right: 8px;">
                    编程: {{ scope.row.codeScore || 0 }}
                  </span>
                  <span :class="getScoreClass(scope.row.score)" style="font-weight: bold;">
                    总分: {{ scope.row.score || '未参加' }}
                  </span>
                </div>
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
              <div class="stat-value">{{ examStudents.filter(s => normalizeStatus(s.status) === '已完成').length }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">平均分</div>
              <div class="stat-value">{{ Number(averageScore) || 0 }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">最高分</div>
              <div class="stat-value">{{ Number(maxScore) || 0 }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">最低分</div>
              <div class="stat-value">{{ Number(minScore) || 0 }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">及格率</div>
              <div class="stat-value">{{ Number(passRate) || 0 }}%</div>
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
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="scope">
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
          <el-form-item label="题型" prop="questionType">
            <el-select v-model="editForm.questionType" placeholder="请选择题型">
              <el-option label="单选题" value="SINGLE_CHOICE" />
              <el-option label="多选题" value="MULTI_CHOICE" />
              <el-option label="填空题" value="FILL_BLANK" />
              <el-option label="简答题" value="ESSAY_QUESTION" />
              <el-option label="判断题" value="TRUE_FALSE" />
              <el-option label="编程题" value="CODE_QUESTION" />
            </el-select>
          </el-form-item>

          <!-- 非编程题的题目内容 -->
          <template v-if="editForm.questionType !== 'CODE_QUESTION'">
            <el-form-item label="题目内容" prop="content">
              <el-input v-model="editForm.content" type="textarea" :rows="3" placeholder="请输入题目内容" />
            </el-form-item>
          </template>

          <!-- 编程题表单 -->
          <template v-if="editForm.questionType === 'CODE_QUESTION'">
            <el-form-item label="标题" prop="title">
              <el-input v-model="editForm.title" placeholder="请输入编程题标题" />
            </el-form-item>
            
            <el-form-item label="描述" prop="description">
              <el-input 
                v-model="editForm.description" 
                type="textarea" 
                :rows="4" 
                placeholder="请输入题目描述，包含题目要求、输入输出格式等" 
              />
            </el-form-item>

            <!-- 示例输入输出 -->
            <el-form-item label="示例输入">
              <div v-for="(input, index) in editForm.sampleInputs" :key="'input-'+index" class="sample-item">
                <el-input 
                  v-model="editForm.sampleInputs[index]" 
                  placeholder="请输入示例输入"
                  style="width: calc(100% - 40px)"
                />
                <el-button 
                  type="danger" 
                  circle 
                  plain 
                  size="small" 
                  @click="editForm.sampleInputs.splice(index, 1);editForm.sampleOutputs.splice(index, 1)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button type="primary" plain @click="editForm.sampleInputs.push('');editForm.sampleOutputs.push('')">
                <el-icon><Plus /></el-icon>添加示例
              </el-button>
            </el-form-item>

            <el-form-item label="示例输出">
              <div v-for="(output, index) in editForm.sampleOutputs" :key="'output-'+index">
                <el-input 
                  v-model="editForm.sampleOutputs[index]" 
                  placeholder="请输入示例输出"
                  :disabled="!editForm.sampleInputs[index]"
                />
              </div>
            </el-form-item>

            <!-- 测试用例输入输出 -->
            <el-form-item label="测试输入">
              <div v-for="(input, index) in editForm.caseInputs" :key="'case-input-'+index" class="sample-item">
                <el-input 
                  v-model="editForm.caseInputs[index]" 
                  placeholder="请输入测试用例输入"
                  style="width: calc(100% - 40px)"
                />
                <el-button 
                  type="danger" 
                  circle 
                  plain 
                  size="small" 
                  @click="editForm.caseInputs.splice(index, 1);editForm.caseOutputs.splice(index, 1)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button type="primary" plain @click="editForm.caseInputs.push('');editForm.caseOutputs.push('')">
                <el-icon><Plus /></el-icon>添加测试用例
              </el-button>
            </el-form-item>

            <el-form-item label="测试输出">
              <div v-for="(output, index) in editForm.caseOutputs" :key="'case-output-'+index">
                <el-input 
                  v-model="editForm.caseOutputs[index]" 
                  placeholder="请输入测试用例输出"
                  :disabled="!editForm.caseInputs[index]"
                />
              </div>
            </el-form-item>
          </template>

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
              <div class="ai-exercises-actions">
                <el-button size="small" type="success" @click="addAllAIQuestions" :loading="addingAllQuestions">
                  <el-icon><Plus /></el-icon>
                  一键添加AI题目
                </el-button>
                <el-button size="small" type="info" @click="toggleAIExercises">
                  {{ showAIExercises ? '收起' : '展开' }}
                </el-button>
              </div>
            </div>

            <div v-show="showAIExercises" class="ai-exercises-list">
              <div
                v-for="(exercise, index) in aiGeneratedExercises"
                :key="index"
                class="ai-exercise-item"
              >
                <div class="exercise-header">
                  <div class="exercise-title">
                    <!-- <span class="exercise-number">题目 {{ index + 1 }}</span> -->
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
                    <!-- <el-button
                      size="small"
                      type="primary"
                      @click="copyExerciseToForm(exercise)"
                      :icon="DocumentCopy"
                    >
                      复制到表单
                    </el-button> -->
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
                  <!-- AI生成的具体题目 -->
                  <div v-if="exercise.content" class="content-section">
                    <div class="content-label">题目内容：</div>
                    <div class="content-text">{{ exercise.content }}</div>
                  </div>

                  <!-- 选择题选项 -->
                  <div v-if="exercise.options && exercise.options.length > 0" class="content-section">
                    <div class="content-label">选项：</div>
                    <div class="options-text">
                      <div
                        v-for="(option, optIndex) in exercise.options"
                        :key="optIndex"
                        class="option-line"
                        :class="{
                          'correct-option': isCorrectOption(exercise, optIndex),
                          'multi-choice-option': exercise.type === 'MULTI_CHOICE'
                        }"
                      >
                        <span class="option-label" :class="exercise.type === 'MULTI_CHOICE' ? 'multi-label' : 'single-label'">
                          {{ String.fromCharCode(65 + optIndex) }}.
                        </span>
                        <span class="option-text">{{ option }}</span>
                        <span v-if="isCorrectOption(exercise, optIndex)" class="correct-indicator">
                          <i class="el-icon-check"></i>
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 答案 -->
                  <div v-if="exercise.expectedAnswer" class="content-section">
                    <div class="content-label">答案：</div>
                    <div class="answer-text">{{ exercise.expectedAnswer }}</div>
                  </div>

                  <!-- 解析 -->
                  <div v-if="exercise.analysis" class="content-section">
                    <div class="content-label">解析：</div>
                    <div class="explanation-text">{{ exercise.analysis }}</div>
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

// localStorage相关的工具函数
const getLastSetScore = (questionType) => {
  try {
    const lastScores = JSON.parse(localStorage.getItem('lastQuestionScores') || '{}')
    return lastScores[questionType] || (questionType === 'CODE_QUESTION' ? 50 : 100)
  } catch (e) {
    console.error('从localStorage获取分数失败:', e)
    return questionType === 'CODE_QUESTION' ? 50 : 100
  }
}

const saveLastSetScore = (questionType, score) => {
  try {
    const lastScores = JSON.parse(localStorage.getItem('lastQuestionScores') || '{}')
    lastScores[questionType] = score
    localStorage.setItem('lastQuestionScores', JSON.stringify(lastScores))
  } catch (e) {
    console.error('保存分数到localStorage失败:', e)
  }
}
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
// import { ArrowLeft, Loading, Refresh, Search, Plus, Delete, MagicStick, DocumentCopy, CopyDocument } from '@element-plus/icons-vue'
import { ArrowLeft, Loading, Refresh, Search, Plus, Delete, MagicStick, CopyDocument } from '@element-plus/icons-vue'
import { examAPI, courseAPI, courseSelectionAPI, knowledgeAPI, studentAssistantAPI, codeQuestionAPI } from '@/api/api'
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
  MarkPointComponent,
  GraphicComponent
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
  GraphicComponent,
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
    if (normalizeStatus(s.status) !== '已完成') return false
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
      if (normalizeStatus(s.status) !== '已完成') return false
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
      if (normalizeStatus(s.status) !== '已完成') return false
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
    if (normalizeStatus(s.status) !== '已完成') return false
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

    // 2. 获取已作答学生的成绩（包括普通题目和编程题）
    try {
      console.log('正在获取已作答学生成绩，examId:', examIdStr)
      
      // 获取普通题目成绩
      const regularScores = await examAPI.getExamStudentScores(examIdStr)
      console.log('获取到的普通题目成绩:', regularScores)
      
      // 获取编程题成绩 - 使用 getQuestionSubmissions 接口
      let codeScores = []
      try {
        // 先获取考试的编程题列表
        const codeQuestions = await codeQuestionAPI.getExamCodeQuestions(examIdStr)
        console.log('获取到的编程题列表:', codeQuestions)
        
        if (Array.isArray(codeQuestions) && codeQuestions.length > 0) {
          // 为每道编程题获取提交记录
          const codeSubmissionsPromises = codeQuestions.map(async (question) => {
            try {
              const submissions = await codeQuestionAPI.getQuestionSubmissions(question.id)
              console.log(`编程题 ${question.id} 的提交记录:`, submissions)
              return { questionId: question.id, submissions: submissions || [] }
            } catch (error) {
              console.warn(`获取编程题 ${question.id} 提交记录失败:`, error)
              return { questionId: question.id, submissions: [] }
            }
          })
          
          const allCodeSubmissions = await Promise.all(codeSubmissionsPromises)
          
          // 按学生ID汇总编程题成绩
          const studentCodeScoreMap = new Map()
          
          allCodeSubmissions.forEach(({ questionId, submissions }) => {
             console.log(`编程题 ${questionId} 的所有提交记录:`, submissions)
             
             // 按学生ID分组提交记录
             const submissionsByStudent = new Map()
             submissions.forEach(submission => {
               const studentId = submission.studentId
               if (!submissionsByStudent.has(studentId)) {
                 submissionsByStudent.set(studentId, [])
               }
               submissionsByStudent.get(studentId).push(submission)
             })
             
             // 对每个学生，只保留最后一次提交
             submissionsByStudent.forEach((studentSubmissions, studentId) => {
               console.log(`学生 ${studentId} 对题目 ${questionId} 的提交记录:`, studentSubmissions)
               
               // 按提交时间排序，取最后一次提交
               const sortedSubmissions = studentSubmissions.sort((a, b) => {
                 const timeA = new Date(a.submitTime || a.createdAt || 0)
                 const timeB = new Date(b.submitTime || b.createdAt || 0)
                 return timeB - timeA // 降序排列，最新的在前
               })
               
               const latestSubmission = sortedSubmissions[0]
               console.log(`学生 ${studentId} 题目 ${questionId} 的最终提交:`, latestSubmission)
               
               if (!studentCodeScoreMap.has(studentId)) {
                 studentCodeScoreMap.set(studentId, { studentId, score: 0, submissions: [] })
               }
               const studentData = studentCodeScoreMap.get(studentId)
               studentData.score += Number(latestSubmission.score || 0)
               studentData.submissions.push({ questionId, ...latestSubmission })
             })
           })
          
          codeScores = Array.from(studentCodeScoreMap.values())
        }
      } catch (error) {
        console.warn('获取编程题成绩失败:', error)
        codeScores = []
      }
      console.log('处理后的编程题成绩:', codeScores)

      // 合并成绩 - 确保包含所有有成绩的学生
      const studentScoreMap = new Map()
      
      // 处理常规题成绩
      regularScores.forEach(student => {
        studentScoreMap.set(student.studentId, {
          ...student,
          regularScore: Number(student.score || 0),
          codeScore: 0,
          score: Number(student.score || 0)
        })
      })
      
      // 处理编程题成绩
      codeScores.forEach(codeStudent => {
        if (studentScoreMap.has(codeStudent.studentId)) {
          // 学生已有常规题成绩，添加编程题成绩
          const existingStudent = studentScoreMap.get(codeStudent.studentId)
          existingStudent.codeScore = Number(codeStudent.score || 0)
          existingStudent.score = existingStudent.regularScore + existingStudent.codeScore
        } else {
          // 学生只有编程题成绩，创建新记录
          studentScoreMap.set(codeStudent.studentId, {
            studentId: codeStudent.studentId,
            fullName: `学生${codeStudent.studentId}`, // 默认姓名，后续会被课程学生数据覆盖
            regularScore: 0,
            codeScore: Number(codeStudent.score || 0),
            score: Number(codeStudent.score || 0),
            status: '已完成'
          })
        }
      })
      
      completedStudentsScores = Array.from(studentScoreMap.values())
      
      console.log('合并后的总成绩:', completedStudentsScores)
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
        // 确保包含常规题和编程题分数
        regularScore: student.regularScore || 0,
        codeScore: student.codeScore || 0,
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
          // 添加常规题和编程题分数
          regularScore: scoreData ? (scoreData.regularScore || 0) : 0,
          codeScore: scoreData ? (scoreData.codeScore || 0) : 0,
          submitTime: scoreData ? (scoreData.updateTime) : null,
          status: scoreData ? normalizeStatus(scoreData.status || (scoreData.updateTime ? '已完成' : '未完成')) : '未完成'
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
        // 确保包含常规题和编程题分数
        regularScore: student.regularScore || 0,
        codeScore: student.codeScore || 0,
        submitTime: student.updateTime || null,
        status: normalizeStatus(student.status || (student.updateTime ? '已完成' : '未完成'))
      }))
    } else {
      console.log('没有任何学生数据')
      // 都没有数据
      examStudents.value = []
    }

    console.log('合并后的学生数据数量:', examStudents.value.length)
    console.log('合并后的学生数据:', examStudents.value)
    
    // 调试：检查状态分布
    const statusDistribution = {}
    examStudents.value.forEach(student => {
      const status = normalizeStatus(student.status)
      statusDistribution[status] = (statusDistribution[status] || 0) + 1
    })
    console.log('学生状态分布:', statusDistribution)
    
    // 调试：检查有效分数的学生
    const validScoreStudents = examStudents.value.filter(s => {
      const status = normalizeStatus(s.status)
      const score = s.score
      return status === '已完成' && score !== null && score !== undefined && score !== '' && !isNaN(Number(score))
    })
    console.log('有效分数的学生数量:', validScoreStudents.length)
    console.log('有效分数的学生:', validScoreStudents.map(s => ({ name: s.fullName, score: s.score, status: s.status })))

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
  console.log('=== 开始生成题型分析数据 ===')
  console.log('examQuestions.value:', examQuestions.value)
  console.log('examQuestions长度:', examQuestions.value ? examQuestions.value.length : 0)
  
  if (!examQuestions.value || examQuestions.value.length === 0) {
    console.log('没有题目数据，清空题型分析数据')
    // 如果没有题目数据，清空数据，让图表显示无数据状态
    questionTypeData.value = []
    return
  }

  // 统计题型分布
  console.log('开始统计题型分布...')
  const typeStats = {}
  examQuestions.value.forEach((question, index) => {
    console.log(`处理第${index + 1}个题目:`, question)
    const type = question.questionType || 'UNKNOWN'
    console.log(`题目类型: ${type}, 分数: ${question.scorePoints}`)
    
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
  
  console.log('题型统计结果:', typeStats)

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
  console.log('生成的题型数据长度:', questionTypeData.value.length)
  console.log('=== 题型分析数据生成完成 ===')

  // 重新渲染题型图表
  nextTick(() => {
    console.log('nextTick中重新初始化题型图表')
    initQuestionTypeChart()
  })
}

// 获取题目列表和统计信息
async function fetchExamQuestions() {
  try {
    isLoadingQuestions.value = true
    const examIdStr = examId ? new BigNumber(examId).toString() : String(examId)
    console.log('开始获取题目数据，examId:', examIdStr)
    console.log('examId类型:', typeof examId, 'examId值:', examId)

    // 获取普通题目列表
    console.log('正在调用 knowledgeAPI.getQuestionsByExamId...')
    const regularQuestions = await knowledgeAPI.getQuestionsByExamId(examIdStr)
    console.log('获取到的普通题目列表:', regularQuestions)
    console.log('普通题目数量:', Array.isArray(regularQuestions) ? regularQuestions.length : '不是数组')

    // 获取编程题目列表
    console.log('正在调用 codeQuestionAPI.getExamCodeQuestions...')
    const codeQuestions = await codeQuestionAPI.getExamCodeQuestions(examIdStr)
    console.log('获取到的编程题目列表:', codeQuestions)
    console.log('编程题目数量:', Array.isArray(codeQuestions) ? codeQuestions.length : '不是数组')

    // 合并并处理题目列表
    console.log('开始合并题目列表...')
    const allQuestions = [
      ...(Array.isArray(regularQuestions) ? regularQuestions : []),
      ...(Array.isArray(codeQuestions) ? codeQuestions.map(q => ({
        ...q,
        questionType: 'CODE_QUESTION',
        content: q.description, // 编程题使用description作为content
        options: [] // 编程题没有选项
      })) : [])
    ]
    
    console.log('合并后的题目列表:', allQuestions)
    console.log('合并后题目总数:', allQuestions.length)

    if (allQuestions.length > 0) {
      examQuestions.value = allQuestions.map(q => ({
        ...q,
        questionId: String(q.questionId || q.id),
        questionContent: q.content || q.description || '题目内容未知',
        questionType: q.questionType || 'UNKNOWN',
        scorePoints: q.scorePoints || 0,
        difficulty: q.difficulty || 'MEDIUM',
        referenceAnswer: q.referenceAnswer || '',
        options: q.options || [],
        createdAt: q.createdAt || q.created_at || '',
        updatedAt: q.updatedAt || q.updated_at || ''
      }))
      console.log('处理后的examQuestions:', examQuestions.value)
      console.log('处理后的题目数量:', examQuestions.value.length)
    } else {
      examQuestions.value = []
      console.log('没有题目数据，设置examQuestions为空数组')
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
    case 'CODE_QUESTION':
      return '编程题'
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
    case 'CODE_QUESTION':
      return '' // 使用默认颜色，突出显示编程题
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
  if (question.questionType === 'CODE_QUESTION') {
    // 编程题显示标题和描述的组合
    const title = question.title || ''
    const description = question.description || ''
    return title + (description ? ': ' + description : '')
  }
  
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

  console.log('questionTypeChart DOM元素存在:', chartDom)
  console.log('DOM元素尺寸:', chartDom.offsetWidth, 'x', chartDom.offsetHeight)
  console.log('DOM元素样式:', window.getComputedStyle(chartDom))
  console.log('DOM元素可见性:', chartDom.offsetParent !== null)
  
  // 确保容器有最小高度
  if (chartDom.offsetHeight === 0) {
    console.warn('图表容器高度为0，设置最小高度')
    chartDom.style.height = '400px'
  }

  if (questionTypeChart) {
    questionTypeChart.dispose()
  }

  try {
    questionTypeChart = echarts.init(chartDom)
    console.log('ECharts实例创建成功:', questionTypeChart)
  } catch (error) {
    console.error('ECharts初始化失败:', error)
    return
  }

  // 检查是否有题型数据
  console.log('题型数据:', questionTypeData.value)
  console.log('题型数据长度:', questionTypeData.value ? questionTypeData.value.length : 0)
  console.log('题目数据长度:', examQuestions.value ? examQuestions.value.length : 0)

  // 如果没有题目数据或题型数据，直接显示无数据状态
  if (!examQuestions.value || examQuestions.value.length === 0) {
    console.log('没有题目数据，显示题型分析无数据状态')
    try {
         const noDataOption = createNoDataOption('题型得分分析', '暂时没有题目数据')
         console.log('无数据选项:', noDataOption)
         questionTypeChart.setOption(noDataOption)
         console.log('无数据状态设置成功')
         
         // 强制重新渲染图表
         setTimeout(() => {
           if (questionTypeChart) {
             questionTypeChart.resize()
             console.log('无数据状态图表resize完成')
           }
         }, 100)
       } catch (error) {
         console.error('设置无数据状态失败:', error)
       }
    return
  }

  // 如果没有题型数据，尝试生成
  if (!questionTypeData.value || questionTypeData.value.length === 0) {
    console.log('题型数据为空，尝试基于题目数据生成')
    generateQuestionTypeAnalysisFromLocalData()

    // 如果生成后仍然没有数据，显示无数据状态
    if (!questionTypeData.value || questionTypeData.value.length === 0) {
      console.log('生成题型数据失败，显示无数据状态')
      try {
         const noDataOption = createNoDataOption('题型得分分析', '暂时没有题目数据')
         console.log('无数据选项:', noDataOption)
         questionTypeChart.setOption(noDataOption)
         console.log('无数据状态设置成功')
         
         // 强制重新渲染图表
         setTimeout(() => {
           if (questionTypeChart) {
             questionTypeChart.resize()
             console.log('无数据状态图表resize完成')
           }
         }, 100)
       } catch (error) {
         console.error('设置无数据状态失败:', error)
       }
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
    try {
       const noDataOption = createNoDataOption('题型得分分析', '暂时没有学生完成')
       console.log('无数据选项:', noDataOption)
       questionTypeChart.setOption(noDataOption)
       console.log('无数据状态设置成功')
       
       // 强制重新渲染图表
       setTimeout(() => {
         if (questionTypeChart) {
           questionTypeChart.resize()
           console.log('无数据状态图表resize完成')
         }
       }, 100)
     } catch (error) {
       console.error('设置无数据状态失败:', error)
     }
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

  try {
    console.log('设置题型图表选项:', option)
    questionTypeChart.setOption(option)
    console.log('题型图表选项设置成功')
    
    // 强制重新渲染图表
    setTimeout(() => {
      if (questionTypeChart) {
        questionTypeChart.resize()
        console.log('题型图表resize完成')
      }
    }, 100)
  } catch (error) {
    console.error('设置题型图表选项失败:', error)
  }
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
      
      // 延迟强制刷新所有图表
      setTimeout(() => {
        refreshAllCharts()
      }, 200)
    } catch (error) {
      console.error('图表初始化失败:', error)
    }
  })
}

// 强制刷新所有图表
function refreshAllCharts() {
  console.log('强制刷新所有图表')
  try {
    if (scoreDistributionChart) {
      scoreDistributionChart.resize()
      console.log('分数分布图表刷新完成')
    }
    if (questionTypeChart) {
      questionTypeChart.resize()
      console.log('题型分析图表刷新完成')
    }
    if (passRateChart) {
      passRateChart.resize()
      console.log('及格率图表刷新完成')
    }
    if (scoreRangeChart) {
      scoreRangeChart.resize()
      console.log('分数段图表刷新完成')
    }
    if (completionChart) {
      completionChart.resize()
      console.log('完成度图表刷新完成')
    }
  } catch (error) {
    console.error('图表刷新失败:', error)
  }
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
  
  try {
    const date = new Date(dateString)
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的日期格式:', dateString)
      return ''
    }
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (error) {
    console.error('日期格式化错误:', error, dateString)
    return ''
  }
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
      // 检查考试状态，如果未发布则显示提示信息
      if (examInfo.status === '未发布') {
        ElMessage.warning('该考试尚未发布，无法查看成绩')
        // 可以选择返回或执行其他操作
        return false
      }

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
      
      // 如果考试已发布，继续执行
      return true
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
    // 出错时默认返回true，允许继续加载其他数据
    return true
  }
}

// 组件挂载时获取数据
onMounted(async () => {
  console.log('页面加载，开始获取考试数据')
  console.log('考试ID:', examId)
  console.log('路由参数:', route.params)
  console.log('路由查询参数:', route.query)

  if (!examId) {
    ElMessage.error('考试ID不存在')
    goBack()
    return
  }

  // 初始化题目统计信息
  initQuestionStatistics()

  // 先获取考试信息（包含courseId），再获取学生成绩
  const shouldContinue = await fetchExamInfo()
  if (shouldContinue) {
    await fetchExamStudents()
    await fetchExamQuestions() // 获取题目列表和统计信息
    
    // 添加调试信息
    console.log('数据加载完成后的状态:')
    console.log('examQuestions.value:', examQuestions.value)
    console.log('examQuestions长度:', examQuestions.value ? examQuestions.value.length : 0)
    console.log('questionTypeData.value:', questionTypeData.value)
    console.log('questionTypeData长度:', questionTypeData.value ? questionTypeData.value.length : 0)
    
    // 延迟初始化图表，确保数据已加载
    setTimeout(() => {
      console.log('延迟初始化所有图表')
      initAllCharts()
    }, 500)
  }
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
  const defaultScorePoints = getLastSetScore('SINGLE_CHOICE') || 100
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
    scorePoints: defaultScorePoints
  }
}

// 已移除“编辑题目”功能

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
const addingAllQuestions = ref(false)
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
  // 编程题特有的字段
  title: '',
  description: '',
  sampleInputs: [''],
  sampleOutputs: [''],
  caseInputs: [''],
  caseOutputs: [''],
  referenceAnswer: '',
  difficulty: 'MEDIUM',
  scorePoints: 100
})

// 监听题型变化，设置默认分数
  watch(() => editForm.value.questionType, (newType) => {
    // 清空参考答案
    editForm.value.referenceAnswer = ''
    
    if (newType === 'CODE_QUESTION') {
      // 初始化编程题的字段
      editForm.value.title = ''
      editForm.value.description = ''
      editForm.value.sampleInputs = ['']
      editForm.value.sampleOutputs = ['']
      editForm.value.caseInputs = ['']
      editForm.value.caseOutputs = ['']
      editForm.value.options = []
      // 使用上次设置的分数
      const lastScore = getLastSetScore(newType)
      if (lastScore) {
        editForm.value.scorePoints = lastScore
      }
    } else if (newType === 'SINGLE_CHOICE' || newType === 'MULTI_CHOICE') {
      // 初始化选择题选项
      editForm.value.title = ''
      editForm.value.description = ''
      editForm.value.options = [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ]
      // 使用上次设置的分数
      const lastScore = getLastSetScore(newType)
      if (lastScore) {
        editForm.value.scorePoints = lastScore
      }
    } else if (newType === 'TRUE_FALSE') {
      // 初始化判断题选项
      editForm.value.title = ''
      editForm.value.description = ''
      editForm.value.options = [
        { key: 'A', text: '正确' },
        { key: 'B', text: '错误' }
      ]
      // 使用上次设置的分数
      const lastScore = getLastSetScore(newType)
      if (lastScore) {
        editForm.value.scorePoints = lastScore
      }
    }
  })

const editRules = {
  content: [
    { required: true, message: '请输入题目内容', trigger: 'blur', validator: (rule, value, callback) => {
      if (editForm.value.questionType !== 'CODE_QUESTION' && !value) {
        callback(new Error('请输入题目内容'))
      } else {
        callback()
      }
    }},
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
    { validator: (rule, value, callback) => {
      const type = editForm.value.questionType;
      // 多选题不限制长度
      if (type === 'MULTI_CHOICE') {
        if (!value) {
          callback(new Error('请选择至少一个正确答案'));
        } else {
          callback();
        }
      } else if (type === 'CODE_QUESTION') {
        // 编程题答案可以比较长
        if (value.length < 1 || value.length > 5000) {
          callback(new Error('参考答案长度应在1到5000个字符之间'));
        } else {
          callback();
        }
      } else {
        // 其他题型限制在2000字符以内
        if (value.length < 1 || value.length > 2000) {
          callback(new Error('参考答案长度应在1到2000个字符之间'));
        } else {
          callback();
        }
      }
    }, trigger: 'blur' }
  ],
  // 编程题特有的验证规则
  title: [
    { required: true, message: '请输入编程题标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度应在1到100个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入题目描述', trigger: 'blur' },
    { min: 1, max: 1000, message: '描述长度应在1到1000个字符之间', trigger: 'blur' }
  ]
}

const editFormRef = ref(null)

// 验证输入输出对是否一一对应
function validateIOPairs() {
  if (editForm.value.questionType !== 'CODE_QUESTION') {
    return true
  }
  
  const sampleInputs = editForm.value.sampleInputs.filter(input => input.trim() !== '')
  const sampleOutputs = editForm.value.sampleOutputs.filter(output => output.trim() !== '')
  const caseInputs = editForm.value.caseInputs.filter(input => input.trim() !== '')
  const caseOutputs = editForm.value.caseOutputs.filter(output => output.trim() !== '')

  if (sampleInputs.length !== sampleOutputs.length) {
    ElMessage.error('示例输入和输出数量必须相同')
    return false
  }

  if (caseInputs.length !== caseOutputs.length) {
    ElMessage.error('测试用例输入和输出数量必须相同')
    return false
  }

  if (sampleInputs.length === 0) {
    ElMessage.error('至少需要一组示例输入输出')
    return false
  }

  if (caseInputs.length === 0) {
    ElMessage.error('至少需要一组测试用例')
    return false
  }

  return true
}

async function saveQuestion() {
  editFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (!validateIOPairs()) return
    try {
      let content = editForm.value.content
      let payload = {}
      
      if (editForm.value.questionType === 'CODE_QUESTION') {
        // 编程题的特殊处理
        payload = {
          title: editForm.value.title,
          description: editForm.value.description,
          sampleInputs: editForm.value.sampleInputs.filter(input => input.trim() !== ''),
          sampleOutputs: editForm.value.sampleOutputs.filter(output => output.trim() !== ''),
          caseInputs: editForm.value.caseInputs.filter(input => input.trim() !== ''),
          caseOutputs: editForm.value.caseOutputs.filter(output => output.trim() !== ''),
          referenceAnswer: editForm.value.referenceAnswer,
          content: editForm.value.description, // 为了兼容现有系统，将description作为content
          questionType: editForm.value.questionType,
          difficulty: editForm.value.difficulty,
          scorePoints: editForm.value.scorePoints,
          examId: examId
        }
      } else {
        // 选择题/多选题/判断题，将选项拼接到content
        if (['SINGLE_CHOICE','MULTI_CHOICE','TRUE_FALSE'].includes(editForm.value.questionType)) {
          content = formatOptionsToContent(editForm.value.content, editForm.value.options)
        }
        payload = {
          ...editForm.value,
          content,
          // 不再传options字段
          options: undefined,
          referenceAnswer: Array.isArray(editForm.value.referenceAnswer)
            ? editForm.value.referenceAnswer.join(',')
            : editForm.value.referenceAnswer,
          examId: examId
        }
      }
      if (payload.questionType === 'CODE_QUESTION') {
        // 编程题使用专门的API
        const codeQuestionData = {
          examId: payload.examId,
          title: payload.title,
          description: payload.description,
          sampleInputs: payload.sampleInputs,
          sampleOutputs: payload.sampleOutputs,
          caseInputs: payload.caseInputs,
          caseOutputs: payload.caseOutputs,
          referenceAnswer: payload.referenceAnswer,
          difficulty: payload.difficulty,
          scorePoints: payload.scorePoints
        }
        
        if (editingQuestion.value && editingQuestion.value.questionId) {
          await codeQuestionAPI.updateCodeQuestion({ ...codeQuestionData, id: editingQuestion.value.questionId })
          ElMessage.success('编程题编辑成功')
        } else {
          await codeQuestionAPI.saveCodeQuestion(codeQuestionData)
          ElMessage.success('编程题添加成功')
        }
      } else {
        // 其他题型使用原有API
        if (editingQuestion.value && editingQuestion.value.questionId) {
          await knowledgeAPI.updateQuestion({ ...payload, questionId: editingQuestion.value.questionId })
          ElMessage.success('题目编辑成功')
          // 保存该题型的最后设置分数
          saveLastSetScore(editForm.value.questionType, editForm.value.scorePoints)
        } else {
          await knowledgeAPI.addQuestion(payload)
          ElMessage.success('题目添加成功')
          // 保存该题型的最后设置分数
          saveLastSetScore(editForm.value.questionType, editForm.value.scorePoints)
        }
      }
      // 保存该题型的分数设置
      saveLastSetScore(editForm.value.questionType, editForm.value.scorePoints)
      
      showEditDialog.value = false
      editingQuestion.value = null
      refreshQuestions()
    } catch (e) {
      ElMessage.error('保存失败，请重试')
    }
  })
}

// 选项操作函数

// 题型切换时自动初始化选项
  watch(() => editForm.value.questionType, (newType) => {
    // 清空参考答案
    editForm.value.referenceAnswer = ''
    
    if (newType === 'CODE_QUESTION') {
      // 初始化编程题的字段
      editForm.value.title = ''
      editForm.value.description = ''
      editForm.value.sampleInputs = ['']
      editForm.value.sampleOutputs = ['']
      editForm.value.caseInputs = ['']
      editForm.value.caseOutputs = ['']
      editForm.value.options = []
      // 使用上次设置的分数
      const lastScore = getLastSetScore(newType)
      if (lastScore) {
        editForm.value.scorePoints = lastScore
      }
    } else if (newType === 'SINGLE_CHOICE' || newType === 'MULTI_CHOICE') {
      // 初始化选择题选项
      editForm.value.title = ''
      editForm.value.description = ''
      editForm.value.options = [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ]
      // 使用上次设置的分数
      const lastScore = getLastSetScore(newType)
      if (lastScore) {
        editForm.value.scorePoints = lastScore
      }
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

        // 显示加载提示
        const loading = ElMessage({
          message: 'AI正在生成习题，请耐心等待...',
          type: 'info',
          duration: 0,
          showClose: true
        })

        let response

        try {
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

          // 解析AI响应数据
          const questions = parseAIResponse(response)

          if (questions.length === 0) {
            ElMessage.error('AI生成的题目格式有误，请重试')
            return
          }

          // 存储生成的题目
          aiGeneratedExercises.value = questions
          ElMessage.success(`成功生成 ${questions.length} 道习题！`)

          // 关闭对话框
          aiDialogVisible.value = false

          // 打开题目编辑对话框显示AI生成的习题
          handleAddQuestion()

        } catch (error) {
          console.error('生成练习失败:', error)

          // 如果是405错误，使用模拟数据
          if (error.response && error.response.status === 405) {
            console.log('后端接口不可用，使用模拟数据演示')
            const mockResponse = generateMockResponse(aiForm.value.generateType)
            const questions = parseAIResponse(mockResponse)
            aiGeneratedExercises.value = questions
            ElMessage.success(`成功生成 ${questions.length} 道习题！（演示模式）`)
            aiDialogVisible.value = false
            handleAddQuestion()
          } else {
            throw error
          }
        } finally {
          loading.close()
        }

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
// function copyExerciseToForm(exercise) {
//   try {
//     // 复制题目内容
//     if (exercise.question || exercise.title || exercise.content) {
//       editForm.value.content = exercise.question || exercise.title || exercise.content
//     }

//     // 根据习题类型设置表单类型
//     if (exercise.type) {
//       editForm.value.questionType = exercise.type
//     } else if (exercise.options && exercise.options.length > 0) {
//       editForm.value.questionType = exercise.options.length > 4 ? 'MULTI_CHOICE' : 'SINGLE_CHOICE'
//     }

//     // 处理选择题选项
//     if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(editForm.value.questionType) && exercise.options) {
//       editForm.value.options = exercise.options.map((option, index) => ({
//         key: String.fromCharCode(65 + index), // A, B, C, D...
//         text: option
//       }))
//     } else if (editForm.value.questionType === 'TRUE_FALSE') {
//       editForm.value.options = [
//         { key: 'A', text: '正确' },
//         { key: 'B', text: '错误' }
//       ]
//     }

//     // 设置答案
//     if (exercise.answer) {
//       editForm.value.referenceAnswer = exercise.answer
//     }

//     // 设置难度
//     if (exercise.difficulty) {
//       const difficultyMap = {
//         '简单': 'EASY',
//         '中等': 'MEDIUM',
//         '困难': 'HARD'
//       }
//       editForm.value.difficulty = difficultyMap[exercise.difficulty] || 'MEDIUM'
//     }

//     // 设置分值
//     if (exercise.score) {
//       editForm.value.scorePoints = exercise.score
//     }

//     ElMessage.success('习题内容已复制到表单')
//   } catch (error) {
//     console.error('复制习题到表单失败:', error)
//     ElMessage.error('复制失败，请手动复制内容')
//   }
// }

// 判断选项是否为正确答案
function isCorrectOption(question, optionIndex) {
  if (!question.expectedAnswer) return false

  const answer = question.expectedAnswer.toUpperCase().trim()
  const optionLetter = String.fromCharCode(65 + optionIndex) // A, B, C, D

  // 单选题：答案应该是单个字母
  if (question.type === 'SINGLE_CHOICE') {
    return answer === optionLetter
  }

  // 多选题：答案可能包含多个字母
  if (question.type === 'MULTI_CHOICE') {
    // 支持多种格式：AB, A,B, A、B, A B等
    const answerLetters = answer.replace(/[,、\s]+/g, '').split('')
    return answerLetters.includes(optionLetter)
  }

  return false
}

// 一键添加所有AI生成的题目
async function addAllAIQuestions() {
  if (!aiGeneratedExercises.value || aiGeneratedExercises.value.length === 0) {
    ElMessage.warning('没有可添加的AI题目')
    return
  }

  try {
    addingAllQuestions.value = true
    
    // 确认对话框
    const confirmResult = await ElMessageBox.confirm(
      `确定要将所有 ${aiGeneratedExercises.value.length} 道AI生成的题目添加到考试中吗？`,
      '确认添加',
      {
        confirmButtonText: '确定添加',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (confirmResult !== 'confirm') {
      return
    }

    let successCount = 0
    let failCount = 0
    const errors = []

    // 遍历所有AI生成的题目
    for (let i = 0; i < aiGeneratedExercises.value.length; i++) {
      const exercise = aiGeneratedExercises.value[i]
      
      try {
        // 构建题目数据
        const questionData = {
          content: exercise.content || exercise.title || '',
          questionType: exercise.type || 'SINGLE_CHOICE',
          referenceAnswer: exercise.expectedAnswer || '',
          difficulty: getDifficultyFromAI(exercise.difficulty),
          scorePoints: 100, // 默认分值
          examId: examId
        }

        // 调试信息
        console.log(`准备添加第 ${i + 1} 道题目:`, {
          content: questionData.content,
          questionType: questionData.questionType,
          referenceAnswer: questionData.referenceAnswer,
          difficulty: questionData.difficulty
        })

        // 处理选择题选项
        if (['SINGLE_CHOICE', 'MULTI_CHOICE', 'TRUE_FALSE'].includes(questionData.questionType)) {
          if (exercise.options && exercise.options.length > 0) {
            // 将选项格式化为content中的格式
            questionData.content = formatOptionsToContent(questionData.content, exercise.options.map((option, index) => ({
              key: String.fromCharCode(65 + index),
              text: option
            })))
          }
        }

        // 调用添加题目API
        await knowledgeAPI.addQuestion(questionData)
        successCount++
        
        // 显示进度
        ElMessage({
          message: `正在添加第 ${i + 1}/${aiGeneratedExercises.value.length} 道题目...`,
          type: 'info',
          duration: 1000
        })

      } catch (error) {
        console.error(`添加第 ${i + 1} 道题目失败:`, error)
        failCount++
        errors.push(`第 ${i + 1} 道题目: ${error.message || '未知错误'}`)
      }
    }

    // 显示结果
    if (successCount > 0) {
      ElMessage.success(`成功添加 ${successCount} 道题目${failCount > 0 ? `，失败 ${failCount} 道` : ''}`)
      
      if (failCount > 0) {
        console.error('添加失败的题目:', errors)
      }
      
      // 刷新题目列表
      refreshQuestions()
      
      // 清空AI生成的题目列表
      aiGeneratedExercises.value = []
    } else {
      ElMessage.error('所有题目添加失败，请检查网络连接或联系管理员')
    }

  } catch (error) {
    console.error('一键添加AI题目失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    addingAllQuestions.value = false
  }
}

// 将AI难度转换为系统难度
function getDifficultyFromAI(aiDifficulty) {
  const difficultyMap = {
    '简单': 'EASY',
    '中等': 'MEDIUM', 
    '困难': 'HARD'
  }
  return difficultyMap[aiDifficulty] || 'MEDIUM'
}

// 复制习题文本到剪贴板
function copyExerciseText(exercise) {
  try {
    let text = ''

    // 题目内容
    if (exercise.content || exercise.title) {
      text += `题目：${exercise.content || exercise.title}\n\n`
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
    if (exercise.expectedAnswer) {
      text += `答案：${exercise.expectedAnswer}\n\n`
    }

    // 解析
    if (exercise.analysis) {
      text += `解析：${exercise.analysis}\n`
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

// 解析AI响应数据（模仿studentCourseDetail.vue的处理方式）
function parseAIResponse(response) {
  try {
    console.log('解析AI响应:', response)

    // 处理不同的响应格式
    let content = ''

    // 如果响应是字符串
    if (typeof response === 'string') {
      content = response
    }
    // 如果响应是对象，尝试获取内容
    else if (typeof response === 'object' && response !== null) {
      // 尝试多种可能的字段名
      content = response.content || response.result || response.data || response.answer || ''

      // 如果还是对象，尝试获取第一个字符串值
      if (typeof content === 'object') {
        const values = Object.values(content)
        content = values.find(v => typeof v === 'string') || ''
      }
    }

    if (!content || typeof content !== 'string') {
      console.error('AI响应格式错误，无法提取文本内容:', response)
      // 尝试直接使用响应对象的字符串表示
      if (response && typeof response === 'object') {
        const responseStr = JSON.stringify(response, null, 2)
        console.log('尝试解析JSON字符串:', responseStr)
        // 如果包含题目相关的关键字，尝试解析
        if (responseStr.includes('题目') || responseStr.includes('答案') || responseStr.includes('解析')) {
          content = responseStr
        } else {
          return []
        }
      } else {
        return []
      }
    }

    const questions = []

    console.log('准备解析的内容:', content)

    // 尝试多种解析方式

    // 方式1: 按行分割内容解析
    const lines = content.split(/[\n\r]+/).filter(line => line.trim())

    let currentQuestion = null
    let questionIndex = 0

    for (const line of lines) {
      const trimmedLine = line.trim()
      console.log('处理行:', trimmedLine)

      // 检测题目开始 - 支持多种格式
      if (trimmedLine.match(/题目\d+[:：]/) || trimmedLine.startsWith('题目[') || trimmedLine.match(/^\d+[.、]/)) {
        // 如果有之前的题目，先保存
        if (currentQuestion) {
          questions.push(currentQuestion)
        }

        // 开始新题目
        questionIndex++
        let title = trimmedLine

        // 提取题目标题
        if (trimmedLine.includes(':') || trimmedLine.includes('：')) {
          const parts = trimmedLine.split(/[:：]/)
          title = parts.length > 1 ? parts.slice(1).join(':').trim() : parts[0].trim()
        }

        currentQuestion = {
          id: questionIndex,
          title: title || `题目${questionIndex}`,
          content: '',
          type: 'SINGLE_CHOICE', // 默认单选题
          options: [],
          expectedAnswer: '',
          analysis: '',
          score: 10,
          sequence: questionIndex
        }

        // 如果标题行就包含了题目内容，直接设置
        if (title && title.length > 10) {
          currentQuestion.content = title
        }
      }
      // 检测题目内容
      else if ((trimmedLine.startsWith('题目内容:') || trimmedLine.startsWith('题目内容：')) && currentQuestion) {
        currentQuestion.content = trimmedLine.replace(/题目内容[:：]/, '').trim()
      }
      // 检测选择题选项 - 支持中英文和更多格式
      else if (trimmedLine.match(/^[A-D][.、]\s*/) && currentQuestion) {
        const optionText = trimmedLine.replace(/^[A-D][.、]\s*/, '').trim()
        if (optionText) {
          currentQuestion.options.push(optionText)
          currentQuestion.type = 'SINGLE_CHOICE' // 先设为单选，后面会根据答案调整
        }
      }
      // 检测其他可能的选项格式
      else if (trimmedLine.match(/^[（(][A-D][）)]\s*/) && currentQuestion) {
        const optionText = trimmedLine.replace(/^[（(][A-D][）)]\s*/, '').trim()
        if (optionText) {
          currentQuestion.options.push(optionText)
          currentQuestion.type = 'SINGLE_CHOICE'
        }
      }
      // 检测答案 - 支持中英文
      else if ((trimmedLine.startsWith('答案:') || trimmedLine.startsWith('答案：')) && currentQuestion) {
        currentQuestion.expectedAnswer = trimmedLine.replace(/答案[:：]/, '').trim()
      }
      // 检测解析 - 支持中英文
      else if ((trimmedLine.startsWith('解析:') || trimmedLine.startsWith('解析：')) && currentQuestion) {
        currentQuestion.analysis = trimmedLine.replace(/解析[:：]/, '').trim()
      }
      // 如果当前有题目但没有内容，且这行不是选项或答案，可能是题目内容
      else if (currentQuestion && !currentQuestion.content && trimmedLine.length > 5 &&
               !trimmedLine.match(/^[A-D][.、]/) &&
               !trimmedLine.startsWith('答案') &&
               !trimmedLine.startsWith('解析')) {
        currentQuestion.content = trimmedLine
      }
      // 检查是否包含连续的选项（如 "A. 选项1 B. 选项2 C. 选项3 D. 选项4"）
      else if (currentQuestion && trimmedLine.match(/[A-D][.、].*[A-D][.、]/)) {
        console.log('发现连续选项行:', trimmedLine)
        // 解析连续选项
        const optionMatches = trimmedLine.match(/([A-D][.、]\s*[^A-D]*?)(?=[A-D][.、]|$)/g)
        if (optionMatches) {
          optionMatches.forEach(match => {
            const optionText = match.replace(/^[A-D][.、]\s*/, '').trim()
            if (optionText && !currentQuestion.options.includes(optionText)) {
              currentQuestion.options.push(optionText)
            }
          })
          currentQuestion.type = 'SINGLE_CHOICE'
          console.log('解析到连续选项:', currentQuestion.options)
        }
      }
    }

    // 保存最后一个题目
    if (currentQuestion) {
      // 在保存前进行题目类型和格式的最终检查
      finalizeQuestion(currentQuestion)
      questions.push(currentQuestion)
    }

    // 对所有题目进行最终处理
    questions.forEach(question => {
      finalizeQuestion(question)
    })

    console.log('第一种方法解析得到的题目:', questions)

    // 如果第一种方法没有解析到题目，尝试第二种方法
    if (questions.length === 0) {
      console.log('第一种方法失败，尝试第二种解析方法')
      return parseAIResponseAlternative(content)
    }

    return questions

  } catch (error) {
    console.error('解析AI响应失败:', error)
    return []
  }
}

// 题目最终处理方法
function finalizeQuestion(question) {
  if (!question) return

  console.log('最终处理题目:', question)

  // 1. 确定题目类型
  if (question.options && question.options.length > 0) {
    // 有选项的是选择题
    if (question.options.length > 2) { // More than 2 options usually means multi-choice or single-choice
      // 检查答案是否包含多个选项（如"AB"、"A,B"等）
      const answer = (question.expectedAnswer || '').toUpperCase().trim()
      if (answer.length > 1 || answer.includes(',') || answer.includes('、')) {
        question.type = 'MULTI_CHOICE'
      } else {
        question.type = 'SINGLE_CHOICE'
      }
    } else {
      question.type = 'SINGLE_CHOICE'
    }
  } else {
    // 没有选项的是填空题或简答题
    if (question.content && question.content.length > 100) {
      question.type = 'ESSAY_QUESTION' // 长文本默认为简答题
    } else {
      question.type = 'FILL_BLANK' // 短文本默认为填空题
    }
  }

  // 2. 处理答案格式和选项提取
  if (question.expectedAnswer) {
    const answerUpper = question.expectedAnswer.toUpperCase().trim()

    // 如果答案看起来像选项标识符，但没有选项，尝试提取选项
    if (answerUpper.match(/^[A-D]+$/) && (!question.options || question.options.length === 0)) {
      console.warn('发现答案是选项标识符但没有选项，尝试提取选项')
      extractOptionsFromContent(question)
    }

    // 格式化答案显示 - 只对选择题进行大写转换
    if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTI_CHOICE') {
      question.expectedAnswer = answerUpper
    } else {
      // 对于非选择题，保持原始答案格式，但去除首尾空格
      question.expectedAnswer = question.expectedAnswer.trim()
    }
  }

  // 3. 如果仍然没有选项但内容中可能包含选项，再次尝试提取
  if ((!question.options || question.options.length === 0) && question.content) {
    // 检查内容是否包含选项格式
    if (question.content.match(/[A-D][.、]/)) {
      console.log('内容中发现选项格式，尝试提取')
      extractOptionsFromContent(question)
    }
  }

  // 4. 确保题目内容不为空
  if (!question.content && question.title) {
    question.content = question.title
  }

  // 5. 处理选项格式
  if (question.options && question.options.length > 0) {
    question.options = question.options.map(option => {
      // 移除选项前的标识符（如果有的话）
      return option.replace(/^[A-D][.、]\s*/, '').trim()
    })
  }

  console.log('处理后的题目:', question)
}

// 从题目内容中提取选项
function extractOptionsFromContent(question) {
  if (!question.content) return

  const content = question.content
  console.log('尝试从内容中提取选项:', content)

  // 方法1: 按行分割查找选项
  const lines = content.split(/[\n\r]+/)
  let options = []

  for (const line of lines) {
    const trimmed = line.trim()
    // 查找选项格式的行
    if (trimmed.match(/^[A-D][.、]\s*/)) {
      const optionText = trimmed.replace(/^[A-D][.、]\s*/, '').trim()
      if (optionText) {
        options.push(optionText)
      }
    }
  }

  // 方法2: 如果按行分割没找到，尝试在单行中查找连续选项
  if (options.length === 0) {
    // 匹配类似 "A. 选项1 B. 选项2 C. 选项3 D. 选项4" 的格式
    const optionPattern = /([A-D][.、]\s*[^A-D]*?)(?=[A-D][.、]|$)/g
    let match

    while ((match = optionPattern.exec(content)) !== null) {
      const optionText = match[1].replace(/^[A-D][.、]\s*/, '').trim()
      if (optionText) {
        options.push(optionText)
      }
    }
  }

  // 方法3: 如果还是没找到，尝试更宽松的匹配
  if (options.length === 0) {
    // 查找包含选项标识符的文本
    const matches = content.match(/[A-D][.、]\s*[^A-D\n\r]+/g)
    if (matches) {
      options = matches.map(match =>
        match.replace(/^[A-D][.、]\s*/, '').trim()
      ).filter(option => option.length > 0)
    }
  }

  if (options.length > 0) {
    question.options = options

    // 从内容中移除选项部分，只保留题目描述
    let cleanContent = content

    // 移除所有选项相关的文本
    options.forEach((option, index) => {
      const letter = String.fromCharCode(65 + index)
      const patterns = [
        new RegExp(`${letter}[.、]\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
        new RegExp(`${letter}[.、]\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
      ]

      patterns.forEach(pattern => {
        cleanContent = cleanContent.replace(pattern, '')
      })
    })

    // 清理多余的空白字符
    cleanContent = cleanContent.replace(/\s+/g, ' ').trim()

    // 如果清理后内容太短，保留原内容
    if (cleanContent.length < 10) {
      cleanContent = content
    }

    question.content = cleanContent

    console.log('从内容中提取到选项:', options)
    console.log('清理后的题目内容:', cleanContent)
  } else {
    console.log('未能从内容中提取到选项')
  }
}

// 备用AI响应解析方法
function parseAIResponseAlternative(content) {
  try {
    console.log('使用备用解析方法:', content)

    // 如果内容看起来像JSON，尝试直接从对象中提取信息
    if (content.includes('{') && content.includes('}')) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const jsonStr = jsonMatch[0]
          const parsed = JSON.parse(jsonStr)
          console.log('解析的JSON对象:', parsed)

          // 尝试从JSON对象中提取题目信息
          if (parsed.answer) {
            return [{
              id: 1,
              title: '题目1',
              content: parsed.answer || '从AI响应中提取的题目内容',
              type: 'SHORT_ANSWER',
              options: [],
              expectedAnswer: '请参考解析',
              analysis: '这是从AI响应中提取的内容',
              score: 10,
              sequence: 1
            }]
          }
        }
      } catch (e) {
        console.log('JSON解析失败，继续其他方法')
      }
    }

    // 简单的文本解析 - 尝试从整个内容中提取题目信息
    if (content.length > 10) {
      const question = {
        id: 1,
        title: 'AI生成的题目',
        content: content,
        type: 'SHORT_ANSWER',
        options: [],
        expectedAnswer: '请根据题目内容作答',
        analysis: '这是AI生成的练习题目',
        score: 10,
        sequence: 1
      }

      // 尝试从内容中提取选项和答案
      extractOptionsFromContent(question)

      // 最终处理
      finalizeQuestion(question)

      return [question]
    }

    return []

  } catch (error) {
    console.error('备用解析方法失败:', error)
    return []
  }
}

// 生成模拟响应数据（用于演示）
function generateMockResponse(type) {
  const sampleQuestions = [
    {
      title: "线性代数基础概念",
      content: "下列关于矩阵的说法正确的是？",
      options: ["矩阵的行数必须等于列数", "矩阵的乘法满足交换律", "单位矩阵的对角线元素都是1", "所有矩阵都有逆矩阵"],
      answer: "C",
      analysis: "单位矩阵是主对角线上的元素都是1，其余元素都是0的方阵。"
    },
    {
      title: "微积分应用",
      content: "函数f(x) = x²在点x=2处的导数值是多少？",
      options: ["2", "4", "8", "16"],
      answer: "B",
      analysis: "f'(x) = 2x，所以f'(2) = 2×2 = 4"
    },
    {
      title: "概率论基础",
      content: "抛掷一枚公平硬币3次，恰好出现2次正面的概率是？",
      options: ["1/8", "3/8", "1/2", "5/8"],
      answer: "B",
      analysis: "使用二项分布公式：C(3,2) × (1/2)³ = 3 × 1/8 = 3/8"
    }
  ]

  // 构造符合解析格式的响应
  let content = ""
  sampleQuestions.forEach((q, index) => {
    const title = type === 'course' ? `${aiForm.value.courseName || '课程'}题目${index + 1}` : q.title
    content += `题目[题目${index + 1}]: ${title}\n`
    content += `题目内容: ${q.content}\n`
    q.options.forEach((option, optIndex) => {
      content += `${String.fromCharCode(65 + optIndex)}. ${option}\n`
    })
    content += `答案: ${q.answer}\n`
    content += `解析: ${q.analysis}\n\n`
  })

  return { content }
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
  width: 100%;
  min-height: 350px;
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

/* 移除重复的chart-container样式定义，避免冲突 */

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

.ai-exercises-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
  position: relative;
}

.option-line:hover {
  background: #e9ecef;
  border-color: #c0c4cc;
}

.option-line.correct-option {
  background: #f0f9ff;
  border-color: #67c23a;
  box-shadow: 0 0 0 1px rgba(103, 194, 58, 0.2);
}

.option-line.multi-choice-option {
  border-left: 3px solid #e6a23c;
}

.option-line.multi-choice-option.correct-option {
  border-left: 3px solid #67c23a;
}

.option-label {
  font-weight: 600;
  color: #409eff;
  margin-right: 8px;
  min-width: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  border-radius: 50%;
  background: #ecf5ff;
  font-size: 12px;
}

.option-label.multi-label {
  border-radius: 3px;
  background: #fdf6ec;
  color: #e6a23c;
}

.option-label.single-label {
  border-radius: 50%;
  background: #ecf5ff;
  color: #409eff;
}

.correct-option .option-label {
  background: #f0f9ff;
  color: #67c23a;
}

.correct-indicator {
  color: #67c23a;
  font-weight: bold;
  margin-left: 8px;
  display: flex;
  align-items: center;
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
