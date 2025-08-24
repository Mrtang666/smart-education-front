<!-- /**
 * 学生首页组件
 * 
 * 该组件展示学生在该课程中的知识点总览，课程考试和作业和课程考勤
 * 所有数据均通过后端API获取，不使用模拟数据
 * 
 * API依赖:

 * - knowledgeAPI: 获取课程知识点总览
 * - examAPI: 获取课程考试和作业
 * - attendanceAPI: 获取课程考勤
 */ -->
 <!-- 学生端课程文档的下载接口有问题，待完善 -->
<template>
  <div class="course-detail-container">
    <!-- 左侧导航栏 -->
    <div class="sidebar">
      <div class="course-title">
        <div class="course-icon" :style="{ backgroundColor: getCategoryColor(courseCategory) }">{{ getCourseTitleChar() }}</div>
        <div class="course-name">
          {{ courseName }}
          <div class="course-code">({{ courseCode }})</div>
        </div>
      </div>
      
      <div class="nav-item" :class="{ active: activeSection === 'repository' }" @click="setActiveSection('repository')">
        <i class="el-icon-collection"></i>
        <span>知识库</span>
      </div>
      
      <div class="nav-item" :class="{ active: activeSection === 'chapter' }" @click="setActiveSection('knowledge')">
        <i class="el-icon-notebook-1"></i>
        <span>知识点</span>
      </div>
      
      <div class="nav-item" :class="{ active: activeSection === 'assignment' }" @click="setActiveSection('assignment')">
        <i class="el-icon-edit-outline"></i>
        <span>作业</span>
      </div>
      
      <div class="nav-item" :class="{ active: activeSection === 'exam' }" @click="setActiveSection('exam')">
        <i class="el-icon-document-checked"></i>
        <span>考试</span>
      </div>
      
      <div class="nav-item" :class="{ active: activeSection === 'attendance' }" @click="setActiveSection('attendance')">
        <i class="el-icon-date"></i>
        <span>考勤</span>
      </div>
      
      <div class="nav-item" :class="{ active: activeSection === 'document' }" @click="setActiveSection('document')">
        <i class="el-icon-document"></i>
        <span>文档</span>
      </div>

      <div class="nav-item" :class="{ active: activeSection === 'ai-assistant' }" @click="setActiveSection('ai-assistant')">
        <i class="el-icon-chat-dot-round"></i>
        <span>AI助手</span>
      </div>
    </div>
    
    <!-- 右侧内容区 -->
    <div class="content-area">
      <!-- 顶部筛选栏 -->
      <div class="filter-bar" v-if="showFilterBar">
        <div class="filter-label">筛选：</div>
        <el-radio-group v-model="filterType" size="small">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="completed">已完成</el-radio-button>
          <el-radio-button value="uncompleted">未完成</el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- 内容区域 -->
      <div class="section-content">
        <!-- 知识库部分（占位） -->
        <div v-if="activeSection === 'repository'" class="repository-content">
          <div class="repo-header">
            <div class="repo-title-row">
              <h3 class="repo-title">知识库</h3>
              <div class="repo-subject" v-if="repositorySubject">学科：{{ repositorySubject }}</div>
            </div>
            <el-button size="small" type="primary" @click="loadRepository" :loading="repositoryLoading">刷新</el-button>
          </div>
          <el-skeleton :loading="repositoryLoading" animated :rows="3">
            <template #default>
              <el-empty v-if="repositoryUnitsView.length === 0" :description="repositorySubject ? '该学科暂无启用的知识单元' : '未获取到学科'" />
              <el-table v-else :data="repositoryUnitsView" style="width: 100%">
                <el-table-column prop="name" label="知识点名称" min-width="220" />
                <el-table-column prop="subject" label="所属学科" width="160" />
                <el-table-column prop="status" label="状态" width="120">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '禁用' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="200">
                  <template #default="scope">{{ formatDateTime(scope.row.createdAt) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="140">
                  <template #default="scope">
                    <el-button type="primary" size="small" @click="goToKUProblems(scope.row)">查看题目</el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 点击知识单元后在页面下方展示其题目（占位，不接入接口） -->
              <div v-if="selectedKU" class="ku-problems-panel">
                <div class="ku-problems-header">
                  <h4 style="margin:0;">知识单元「{{ selectedKU.name }}」的题目</h4>
                  <div>
                    <el-button size="small" @click="selectedKU = null">收起</el-button>
                  </div>
                </div>
                <el-skeleton :loading="kuProblemsLoadingInline" animated :rows="4">
                  <template #default>
                    <el-empty v-if="kuProblems.length === 0" description="暂无题目" />
                    <el-table v-else :data="kuProblems" style="width: 100%">
                  <el-table-column prop="id" label="题目ID" width="160" />
                  <el-table-column prop="title" label="标题" min-width="200" />
                  <el-table-column prop="content" label="内容" min-width="280" />
                  <el-table-column prop="type" label="题型" width="140" />
                  <el-table-column prop="expectedAnswer" label="答案" min-width="200" />
                    </el-table>
                  </template>
                </el-skeleton>
              </div>
            </template>
          </el-skeleton>
        </div>
        
        <!-- 知识点部分 -->
        <div v-if="activeSection === 'knowledge'" class="knowledge-content">

          <el-skeleton :loading="knowledgePointsLoading" animated>
            <template #template>
              <div style="padding: 20px">
                <el-skeleton-item variant="p" style="width: 100%; height: 30px; margin-bottom: 10px" />
                <el-skeleton-item variant="p" style="width: 90%; height: 20px; margin-bottom: 10px" />
                <el-skeleton-item variant="p" style="width: 90%; height: 20px; margin-bottom: 10px" />
                <el-skeleton-item variant="p" style="width: 90%; height: 20px; margin-bottom: 10px" />
              </div>
            </template>
            <template #default>
              <el-empty v-if="knowledgePoints.length === 0" description="暂无知识点数据"></el-empty>
              <div v-else class="knowledge-grid">
                <!-- 知识点卡片循环 -->
                <div v-for="(point, index) in knowledgePoints" :key="index" 
                    class="knowledge-card"
                    @click="handleKnowledgeCardClick(point)">
                  <div class="knowledge-card-header">
                    <div class="knowledge-card-icon" :style="{ backgroundColor: getKnowledgeDifficultyColor(point.difficultyLevel) }">
                      {{ getKnowledgeIcon(point) }}
                    </div>
                    <!-- 状态标签已移除 -->
                  </div>
                  <div class="knowledge-card-content">
                    <h4 class="knowledge-card-title">{{ point.name }}</h4>
                    <p class="knowledge-card-desc">{{ point.description || '暂无描述' }}</p>
                  </div>
                  <div class="knowledge-card-footer">
                    <el-button
                      type="primary"
                      size="small"
                      plain
                      @click.stop="startLearning(point)"
                    >
                      开始学习
                    </el-button>
                  </div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>
        
        <!-- 考勤部分 -->
        <div v-if="activeSection === 'attendance'" class="attendance-content">
          <div class="attendance-summary">
            <div class="attendance-header">
              <h3>考勤统计</h3>
            </div>
            <div class="attendance-stats">
              <div class="stat-item">
                <div class="stat-value stat-present">{{ attendanceStats.present }}</div>
                <div class="stat-label">
                  <i class="el-icon-check"></i>
                  已到
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-late">{{ attendanceStats.late }}</div>
                <div class="stat-label">
                  <i class="el-icon-time"></i>
                  迟到
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-absent">{{ attendanceStats.absent }}</div>
                <div class="stat-label">
                  <i class="el-icon-close"></i>
                  缺勤
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-leave">{{ attendanceStats.leave }}</div>
                <div class="stat-label">
                  <i class="el-icon-document"></i>
                  请假
                </div>
              </div>
            </div>
          </div>
          
          <div class="attendance-list">
            <div class="attendance-header">
              <h3>考勤记录</h3>
              <div class="attendance-filter">
                <el-select v-model="attendanceStatusFilter" placeholder="状态筛选" size="small" clearable>
                  <el-option label="全部" value=""></el-option>
                  <el-option label="已到" value="已到"></el-option>
                  <el-option label="迟到" value="迟到"></el-option>
                  <el-option label="缺勤" value="缺勤"></el-option>
                  <el-option label="请假" value="请假"></el-option>
                </el-select>
              </div>
            </div>
            <el-skeleton :loading="attendanceLoading" animated :rows="3">
              <template #default>
                <el-empty v-if="attendanceRecords.length === 0" description="暂无考勤记录"></el-empty>
                <el-table v-else :data="filteredAttendanceRecords" style="width: 100%" :row-class-name="getAttendanceRowClass">
                  <el-table-column prop="date" label="日期" width="180"></el-table-column>
                  <el-table-column prop="status" label="状态" width="120">
                    <template #default="scope">
                      <el-tag :type="getAttendanceTagType(scope.row.status)" effect="dark">
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="time" label="时间"></el-table-column>
                  <el-table-column label="操作" width="180">
                    <template #default="scope">
                      <el-button 
                        size="small" 
                        type="primary" 
                        @click="showAttendanceDetail(scope.row)"
                        plain
                      >查看详情</el-button>
                      <el-button 
                        v-if="scope.row.canSignIn"
                        size="small" 
                        type="success" 
                        @click="handleSignIn(scope.row)"
                      >签到</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
            </el-skeleton>
          </div>
          
          <!-- 考勤详情对话框 -->
          <el-dialog
            title="考勤详情"
            v-model="attendanceDialogVisible"
            width="50%"
            custom-class="attendance-detail-dialog"
          >
            <div v-if="selectedAttendance" class="attendance-detail">
              <div class="detail-header" :class="getAttendanceStatusClass(selectedAttendance.status)">
                <div class="detail-status-icon">
                  <i :class="getAttendanceStatusIcon(selectedAttendance.status)"></i>
                </div>
                <div class="detail-status-text">
                  {{ selectedAttendance.status }}
                </div>
              </div>
              <div class="detail-content">
              <div class="detail-item">
                <span class="detail-label">日期：</span>
                <span class="detail-value">{{ selectedAttendance.date }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">状态：</span>
                <span class="detail-value">
                    <el-tag :type="getAttendanceTagType(selectedAttendance.status)" effect="dark">
                    {{ selectedAttendance.status }}
                  </el-tag>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">时间：</span>
                <span class="detail-value">{{ selectedAttendance.time }}</span>
              </div>
              <div class="detail-item" v-if="selectedAttendance.reason">
                <span class="detail-label">原因：</span>
                <span class="detail-value">{{ selectedAttendance.reason }}</span>
              </div>
              <div class="detail-item" v-if="selectedAttendance.note">
                <span class="detail-label">备注：</span>
                <span class="detail-value">{{ selectedAttendance.note }}</span>
                </div>
              </div>
              <div class="detail-actions" v-if="selectedAttendance.canSignIn">
                <el-button type="primary" @click="handleSignIn(selectedAttendance)">立即签到</el-button>
              </div>
            </div>
          </el-dialog>
        </div>
        
        <!-- 作业部分 -->
        <div v-if="activeSection === 'assignment'" class="assignment-content">
          <!-- 作业分类选择 -->
          <div class="assignment-tabs">
            <el-tabs v-model="activeAssignmentTab" @tab-click="handleAssignmentTabClick">
              <el-tab-pane label="教师布置" name="teacher">
                <div class="assignment-list">
                  <el-skeleton :loading="teacherAssignmentsLoading" animated :rows="3">
                    <template #default>
                      <el-empty v-if="teacherAssignments.length === 0" description="暂无教师布置的作业">
                        <template #image>
                          <i class="el-icon-document" style="font-size: 60px; color: #ccc;"></i>
                        </template>
                      </el-empty>
                      <div v-else class="assignment-cards">
                        <div
                          v-for="assignment in teacherAssignments"
                          :key="assignment.assignmentId"
                          class="assignment-card"
                          :class="{ 'completed': isAssignmentCompleted(assignment) }"
                        >
                          <div class="assignment-header">
                            <h3 class="assignment-title">{{ assignment.title }}</h3>
                            <el-tag
                              :type="getAssignmentStatusType(assignment)"
                              size="small"
                            >
                              {{ getAssignmentStatusText(assignment) }}
                            </el-tag>
                          </div>
                          <div class="assignment-info">
                            <p class="assignment-description">{{ assignment.description || '暂无描述' }}</p>
                            <div class="assignment-meta">
                              <span class="meta-item">
                                <i class="el-icon-time"></i>
                                开始时间：{{ formatDateTime(assignment.startTime) }}
                              </span>
                              <span class="meta-item">
                                <i class="el-icon-alarm-clock"></i>
                                截止时间：{{ formatDateTime(assignment.endTime) }}
                              </span>
                              <span v-if="assignment.isRedoAllowed && assignment.maxAttempts > 0" class="meta-item attempts-meta">
                                <i class="el-icon-refresh"></i>
                                重做次数：{{ assignment.remainingAttempts }}/{{ assignment.maxAttempts }} 次
                              </span>
                            </div>
                          </div>
                          <div class="assignment-actions">
                            <el-button
                              type="primary"
                              size="small"
                              @click="viewAssignmentDetail(assignment)"
                            >
                              查看详情
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </template>
                  </el-skeleton>
                </div>
              </el-tab-pane>

              <!-- AI自主练习标签页 -->
              <el-tab-pane label="AI自主练习" name="ai">
                <div class="ai-exercise-section">
                  <!-- AI生成按钮区域 -->
                  <div class="ai-exercise-header">
                    <div class="ai-exercise-intro">
                      <h3>AI智能练习生成</h3>
                      <p>基于当前课程或知识点，AI为您生成个性化练习题目</p>
                    </div>
                    <div class="ai-exercise-buttons">
                      <el-button
                        type="primary"
                        @click="generateAIExerciseByCourse"
                        :loading="aiGenerating"
                        icon="el-icon-magic-stick"
                      >
                        按课程生成练习
                      </el-button>
                      <el-button
                        type="success"
                        @click="showKnowledgeInputDialog"
                        :loading="aiGenerating"
                        icon="el-icon-edit"
                      >
                        按知识点生成练习
                      </el-button>
                    </div>
                  </div>

                  <!-- 生成的练习内容展示区域 -->
                  <div v-if="generatedQuestions.length > 0" class="generated-exercises">
                    <div class="exercises-header">
                      <h3>生成的练习题目 ({{ generatedQuestions.length }}题)</h3>
                      <el-button type="danger" size="small" @click="clearGeneratedQuestions">
                        清空题目
                      </el-button>
                    </div>

                    <div class="exercises-content">
                      <div v-for="(question, index) in generatedQuestions" :key="index" class="question-card">
                        <div class="question-header">
                          <span class="question-number">第{{ index + 1 }}题</span>
                          <div class="question-type-info">
                            <el-tag :type="getQuestionTypeTag(question.type)" size="small">
                              {{ getQuestionTypeText(question.type) }}
                            </el-tag>
                            <span v-if="question.options && question.options.length > 0" class="option-count">
                              ({{ question.options.length }}个选项)
                            </span>
                          </div>
                        </div>

                        <div class="question-content">
                          <div class="question-title" v-if="question.title">
                            <strong>{{ question.title }}</strong>
                          </div>
                          <div class="question-body">
                            {{ question.content }}
                          </div>

                          <!-- 选择题选项 -->
                          <div v-if="question.options && question.options.length > 0" class="question-options">
                            <div class="options-title">选项：</div>
                            <div
                              v-for="(option, optIndex) in question.options"
                              :key="optIndex"
                              class="option-item"
                              :class="{
                                'correct-option': isCorrectOption(question, optIndex),
                                'multi-choice-option': question.type === 'MULTI_CHOICE'
                              }"
                            >
                              <span class="option-label" :class="question.type === 'MULTI_CHOICE' ? 'multi-label' : 'single-label'">
                                {{ String.fromCharCode(65 + optIndex) }}.
                              </span>
                              <span class="option-text">{{ option }}</span>
                              <span v-if="isCorrectOption(question, optIndex)" class="correct-indicator">
                                <i class="el-icon-check"></i>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div class="question-meta">
                          <div class="answer-section">
                            <strong>答案：</strong>
                            <span class="answer-text">{{ question.expectedAnswer }}</span>
                          </div>
                          <div v-if="question.analysis" class="analysis-section">
                            <strong>解析：</strong>
                            <span class="analysis-text">{{ question.analysis }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 空状态 -->
                  <div v-else class="empty-exercises">
                    <el-empty description="暂无生成的练习题目">
                      <template #image>
                        <i class="el-icon-magic-stick" style="font-size: 60px; color: #ccc;"></i>
                      </template>
                      <template #description>
                        <span style="color: #999;">点击上方按钮生成您的第一个AI练习</span>
                      </template>
                    </el-empty>
                  </div>
                </div>
              </el-tab-pane>

            </el-tabs>
          </div>
        </div>
        
        <!-- 考试部分 -->
        <div v-if="activeSection === 'exam'" class="exam-content">
          <el-skeleton :loading="examsLoading" animated :rows="3">
            <template #default>
              <el-empty v-if="filteredExams.length === 0" description="暂无考试数据"></el-empty>
              <el-table v-else :data="filteredExams" style="width: 100%">
                <el-table-column prop="title" label="考试名称" width="250"></el-table-column>
                <el-table-column prop="time" label="考试时间" width="180"></el-table-column>
                <el-table-column prop="location" label="考试地点"></el-table-column>
                <el-table-column prop="status" label="状态" width="120">
                  <template #default="scope">
                    <el-tag :type="getExamTagType(scope.row.status)">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="score" label="分数" width="100"></el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="scope">
                    <el-button size="small" type="primary" @click="viewExam(scope.row)">查看</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-skeleton>
        </div>
        
        <!-- 文档部分 -->
        <div v-if="activeSection === 'document'" class="document-content">
          <div class="document-header">
            <h3>课程文档</h3>
            <div class="document-search">
              <el-input
                v-model="documentSearchKeyword"
                placeholder="搜索文件名"
                prefix-icon="el-icon-search"
                clearable
                @clear="documentSearchKeyword = ''"
                style="width: 250px;"
              />
            </div>
          </div>

          <el-skeleton :loading="documentLoading" animated :rows="3">
            <template #default>
              <el-empty v-if="filteredDocuments.length === 0" description="暂无课程文档"></el-empty>
              <div v-else class="document-list">
                <div v-for="(doc, index) in filteredDocuments" :key="index" class="document-item">
                  <div class="document-icon">
                    <i :class="getDocumentIcon(doc)"></i>
                  </div>
                  <div class="document-info">
                    <div class="document-name">{{ doc }}</div>
                  </div>
                  <div class="document-actions">
                    <el-button type="primary" size="small" @click="downloadDocument(doc)">
                      <i class="el-icon-download"></i> 下载
                    </el-button>
                  </div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>

        <!-- AI助手部分 -->
        <div v-if="activeSection === 'ai-assistant'" class="ai-assistant-content">
          <div class="ai-assistant-container">
            <!-- AI助手头部 -->
            <div class="ai-assistant-header">
              <div class="ai-assistant-title">
                <i class="el-icon-chat-dot-round"></i>
                <h3>AI学习助手</h3>
              </div>
              <div class="ai-assistant-subtitle">
                <span>针对《{{ courseName }}》课程为您提供智能问答服务</span>
              </div>
            </div>

            <!-- 聊天消息区域 -->
            <div class="ai-chat-container">
              <div class="ai-chat-messages" ref="chatMessages">
                <!-- 欢迎消息 -->
                <div v-if="aiMessages.length === 0" class="welcome-message">
                  <div class="ai-message">
                    <div class="ai-avatar">
                      <i class="el-icon-chat-dot-round"></i>
                    </div>
                    <div class="ai-message-content">
                      <div class="ai-message-text">
                        您好！我是您的AI学习助手，可以帮助您解答关于《{{ courseName }}》课程的问题。
                        <br>您可以问我：
                        <ul>
                          <li>课程相关的知识点问题</li>
                          <li>学习方法和建议</li>
                          <li>作业和考试相关问题</li>
                          <li>其他学习困惑</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 聊天消息列表 -->
                <div v-for="(message, index) in aiMessages" :key="index" class="message-item">
                  <!-- 用户消息 -->
                  <div v-if="message.type === 'user'" class="user-message">
                    <div class="user-message-content">
                      <div class="user-message-text">{{ message.content }}</div>
                    </div>
                    <div class="user-avatar">
                      <i class="el-icon-user"></i>
                    </div>
                  </div>

                  <!-- AI消息 -->
                  <div v-else class="ai-message">
                    <div class="ai-avatar">
                      <i class="el-icon-chat-dot-round"></i>
                    </div>
                    <div class="ai-message-content">
                      <div class="ai-message-text" v-html="formatMessage(message.content)"></div>
                      <div class="ai-message-actions">
                        <el-button type="text" size="small" @click="copyMessage(message.content)">
                          <i class="el-icon-document-copy"></i> 复制
                        </el-button>
                        <el-button type="text" size="small" @click="regenerateResponse(index)">
                          <i class="el-icon-refresh"></i> 重新生成
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 加载状态 -->
                <div v-if="aiLoading" class="ai-loading">
                  <div class="ai-avatar">
                    <i class="el-icon-loading"></i>
                  </div>
                  <div class="ai-message-content">
                    <div class="ai-message-text">AI正在思考中...</div>
                  </div>
                </div>
              </div>

              <!-- 快捷问题 -->
              <div class="quick-questions">
                <div class="quick-questions-title">快捷问题：</div>
                <div class="quick-questions-list">
                  <el-button
                    v-for="(question, index) in quickQuestions"
                    :key="index"
                    type="primary"
                    plain
                    size="small"
                    @click="askQuickQuestion(question)"
                    :disabled="aiLoading"
                  >
                    {{ question.length > 7 ? question.substring(0, 7) + '...' : question }}
                  </el-button>
                </div>
              </div>

              <!-- 输入区域 -->
              <div class="ai-input-container">
                <div class="ai-input-wrapper">
                  <el-input
                    v-model="currentQuestion"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入您的问题..."
                    :disabled="aiLoading"
                    @keydown.ctrl.enter="sendQuestion"
                    @keydown.meta.enter="sendQuestion"
                  />
                  <div class="ai-input-actions">
                    <div class="input-tip">Ctrl+Enter 发送</div>
                    <el-button
                      type="primary"
                      @click="sendQuestion"
                      :loading="aiLoading"
                      :disabled="!currentQuestion.trim()"
                    >
                      <i class="el-icon-s-promotion"></i> 发送
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 知识点输入对话框 -->
    <el-dialog v-model="knowledgeInputDialogVisible" title="按知识点生成练习" width="500px">
      <el-form :model="knowledgeForm" :rules="knowledgeRules" ref="knowledgeFormRef" label-width="120px">
        <el-form-item label="知识点名称" prop="knowledgeNames">
          <el-input
            v-model="knowledgeForm.knowledgeNames"
            placeholder="请输入知识点名称，多个知识点用逗号分隔"
            type="textarea"
            :rows="3"
          />
          <div class="form-tip">例如：线性代数，微积分，概率论</div>
        </el-form-item>

        <el-form-item label="难度等级" prop="difficultyLevel">
          <el-select v-model="knowledgeForm.difficultyLevel" placeholder="请选择难度等级">
            <el-option label="简单" value="简单" />
            <el-option label="中等" value="中等" />
            <el-option label="困难" value="困难" />
          </el-select>
        </el-form-item>

        <el-form-item label="题目数量" prop="problemCount">
          <el-input-number
            v-model="knowledgeForm.problemCount"
            :min="1"
            :max="20"
            placeholder="请输入题目数量"
          />
          <div class="form-tip">建议：题目数量越多，生成时间越长。首次使用建议选择5题以下。</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="knowledgeInputDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="generateAIExerciseByKnowledge" :loading="aiGenerating">
            生成练习
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { knowledgeAPI, examAPI, attendanceAPI, docAPI, assignmentAPI, studentAnswerAPI, studentAssistantAPI } from '@/api/api';
import { subjectController, knowledgeUnitController, problemKnowledgeUnit, problemBank } from '@/api/apiLearning';
import { getUserInfo } from '@/utils/auth';
import { marked } from 'marked'

export default {
  name: 'StudentCourseDetail',
  components: {
  },
  data() {
    return {
      courseId: null,
      courseName: '',
      courseCode: '',
      courseCategory: '',
      
      // 知识库
      repositorySubject: '',
      repositoryUnits: [],
      repositoryLoading: false,
      
      // 当前激活的部分
      activeSection: 'knowledge',
      
      // 筛选类型
      filterType: 'all',
      
      // 当前日期
      currentDate: new Date(),
      
      // 知识点数据
      knowledgePoints: [],
      knowledgePointsLoading: false,
      defaultProps: {
        children: 'children',
        label: 'name'
      },
      
      // 考勤数据
      attendanceRecords: [],
      attendanceLoading: false,
      attendanceStatusFilter: '', // 新增：考勤状态筛选
      
      // 作业数据
      assignments: [],
      assignmentsLoading: false,

      // 新的作业分类数据
      activeAssignmentTab: 'teacher', // 当前激活的作业标签页
      teacherAssignments: [], // 教师布置的作业
      teacherAssignmentsLoading: false,

      // AI生成练习相关
      aiGenerating: false,
      generatedQuestions: [],
      // 知识库-行内查看题目（点击后通过接口拉取并展示）
      selectedKU: null,
      kuProblems: [],
      kuProblemsLoadingInline: false,
      knowledgeInputDialogVisible: false,
      knowledgeForm: {
        knowledgeNames: '',
        difficultyLevel: '中等',
        problemCount: 5
      },
      knowledgeRules: {
        knowledgeNames: [
          { required: true, message: '请输入知识点名称', trigger: 'blur' }
        ],
        difficultyLevel: [
          { required: true, message: '请选择难度等级', trigger: 'change' }
        ],
        problemCount: [
          { required: true, message: '请输入题目数量', trigger: 'blur' },
          { type: 'number', min: 1, max: 20, message: '题目数量应在1-20之间', trigger: 'blur' }
        ]
      },
      
      // 考试数据
      exams: [],
      examsLoading: false,
      
      // 考勤对话框
      attendanceDialogVisible: false,
      selectedAttendance: null,
      
      // 文档区数据
      documents: [],
      documentLoading: false,
      documentSearchKeyword: '',

      // AI助手相关数据
      aiMessages: [],
      currentQuestion: '',
      aiLoading: false,
      quickQuestions: [
        'malloc函数是动态分配内存。为什么不能直接定义一个很大的数组（比如int arr[1000];），而非要用int *arr = malloc(1000 * sizeof(int));这么麻烦的方法？它们在实际使用上到底有什么区别？',
        '写了一个想交换两个变量值的函数void swap(int a, int b)，在里面也确实交换了，但为什么主函数里的两个变量值根本没变？看答案要把参数改成指针void swap(int *a, int *b)，这是为什么？函数传参不就是把值传过去吗？',
        '为什么要把函数声明写在.h头文件里，再把函数定义写在另一个.c文件里？把所有代码都写在同一个.c文件里也能运行啊，这样分开写的好处到底是什么？',
        '用fopen打开文件时，模式字符串"r", "w", "a", "r+", "w+"这些有什么区别，什么时候该用哪个？',
        '一个程序里一个数组明明是int arr[5]，但误操作读写了arr[5]甚至arr[10]，有时候程序会崩溃，有时候又能正常运行并输出一个很奇怪的值。这是为什么？难道C语言不检查数组下标吗？'
      ],
      
      // 模拟数据配置
      mockDataConfig: {
        'malloc函数是动态分配内存。为什么不能直接定义一个很大的数组（比如int arr[1000];），而非要用int *arr = malloc(1000 * sizeof(int));这么麻烦的方法？它们在实际使用上到底有什么区别？': [
          '问得非常好！这是一个C语言初学者最经典、也最重要的问题之一。它们最核心的区别在于**内存的分配位置和管理方式**。',
          '简单来说：`int arr[1000];` 是 **"静态"** 或 **"自动"** 分配，而 `malloc` 是 **"动态"** 分配。',
          '为了让您更好地理解，我将通过一个简单的比喻来解释它们的区别：',
          '---',
          '## 一个生动的比喻',
          '想象一下内存就像一家酒店的客房。',
          '* **`int arr[1000];` （在栈上分配）**',
          '这就像你**在旅游旺季之前就预订了一个固定的、包含1000个房间的巨型套房**。',
          '* **优点**：手续简单，入住快（CPU分配速度极快）。',
          '* **缺点**：',
          '    1. **无法改变**：无论你最终来了1个人还是500个人，这个1000间的套房都时刻为你保留着，非常浪费资源（内存）。',
          '    2. **空间有限**：酒店的"预订部"（**栈空间**）大小是有限的。如果你预订的套房太大（比如要100万间房），酒店会直接告诉你"订满了，无法预订"（程序崩溃，称为 **栈溢出 Stack Overflow**）。',
          '    3. **到期退房**：当你离开酒店时（函数执行结束），这个套房会被自动退掉，里面的东西不能带走（数组生命周期随函数结束而结束）。',
          '* **`int *arr = malloc(1000 * sizeof(int));` （在堆上分配）**',
          '这就像你**到了酒店后，根据实际来的人数，临时向酒店经理申请客房**。',
          '* **优点**：',
          '    1. **按需分配**：你来了10个人，就申请10间房。来了1000个人，就申请1000间房。非常灵活，不浪费。',
          '    2. **空间巨大**：酒店的"空闲客房库"（**堆空间**）通常非常大，只要酒店还有空房（内存没被耗尽），经理就能满足你的申请。',
          '    3. **租期灵活**：房间一旦申请到手，你可以一直用到**你亲自去退房**为止（调用 `free(arr)`）。它不会因为你离开酒店大堂（函数结束）而自动退房。这意味着你可以把房间钥匙（指针）传递给其他函数继续使用，实现了数据的"共享"和"持久化"。',
          '* **缺点**：',
          '    1. **手续麻烦**：你需要亲自找经理申请（调用 `malloc`），并且**必须记得亲自退房**（调用 `free`），否则就会造成"内存泄漏"（Memory Leak）——房间一直空着但别人没法用，酒店资源逐渐被耗光。',
          '    2. **速度稍慢**：申请过程需要经理处理（操作系统管理堆），比直接预订要慢一点。',
          '---',
          '## 实际代码中的核心区别总结',
          '| 特性 | `int arr[1000];` (栈内存) | `malloc(...)` (堆内存) |',
          '| :--- | :--- | :--- |',
          '| **分配位置** | **栈 (Stack)** | **堆 (Heap)** |',
          '| **分配方式** | 编译时或函数入口处自动分配 | 在代码运行时手动分配 |',
          '| **内存大小** | 必须是**固定常量** | 可以是**变量**，在运行时决定 |',
          '| **生命周期** | **自动管理**。函数结束，内存自动释放。 | **手动管理**。直到调用 `free()` 才释放。 |',
          '| **灵活性** | 大小固定，无法改变。 | 大小可调 (可用 `realloc` 调整)。 |',
          '| **内存容量** | 较小（通常几MB），易**栈溢出**。 | 很大（取决于系统可用内存）。 |',
          '| **性能** | 分配和释放速度极快（只需移动栈指针）。 | 分配和释放相对较慢（需在堆中查找和管理）。 |',
          '| **所有权** | 属于当前函数。 | 属于程序，指针可以传递，所有权可共享。 |',
          '## 什么时候用哪种？',
          '* **用 `int arr[N];` (栈分配) 当：**',
          '* 数据量很小且确定（比如100个元素）。',
          '* 数组只在当前函数内使用。',
          '* 你不需要改变数组的大小。',
          '* **用 `malloc` (堆分配) 当：**',
          '1. **数据量巨大**：例如一个100万元素的数组，用栈会溢出。',
          '2. **数据大小在运行时才确定**：',
          '    ```c',
          '    int n;',
          '    printf("请输入数组大小: ");',
          '    scanf("%d", &n);',
          '    // int arr[n]; // 虽然有些编译器支持，但这不是标准C写法，且大数组仍会溢出',
          '    int *arr = malloc(n * sizeof(int)); // 正确且安全的方法',
          '    ```',
          '3. **需要让数组的生命周期超越函数**：你希望在一个函数中创建数组，然后返回它给其他函数继续使用。',
          '    ```c',
          '    // 错误！函数结束，栈内存arr就被释放了，返回的指针指向无效内存。',
          '    int* create_bad_array() {',
          '        int arr[100];',
          '        return arr;',
          '    }',
          '    // 正确！堆内存会持续有效，直到被free。',
          '    int* create_good_array(int size) {',
          '        int *arr = malloc(size * sizeof(int));',
          '        return arr; // 返回指向堆内存的指针',
          '    }',
          '    ```',
          '4. **需要调整数组大小**：使用 `realloc` 函数。',
          '## 结论',
          '`malloc` 不是"麻烦"，而是给你提供了**更大的灵活性和控制权**，让你能处理更复杂、数据量更大的任务。而定义普通数组是一种简单、高效但限制较多的方式。',
          '**记住黄金法则：每一个 `malloc` 都必须有一个对应的 `free`，否则就会发生内存泄漏。** 这是使用动态内存所需要付出的最主要的管理代价。'
        ],
        '写了一个想交换两个变量值的函数void swap(int a, int b)，在里面也确实交换了，但为什么主函数里的两个变量值根本没变？看答案要把参数改成指针void swap(int *a, int *b)，这是为什么？函数传参不就是把值传过去吗？': [
          '这个问题问得非常好，它触及了C语言最核心的概念之一：**值传递（Pass by Value）**。你的理解"函数传参不就是把值传过去吗？"完全正确，而这正是问题的根源！',
          '',
          '让我用一个非常形象的比喻来解释，你一定会恍然大悟。',
          '',
          '---',
          '',
          '## 一个生动的比喻：文件和复印件',
          '',
          '想象一下：',
          '',
          '* 主函数（`main`）里的变量 `int x = 5;` 和 `int y = 10;` 就像是**两份原始文件**。',
          '* 当你调用 `swap(x, y)` 时，C语言的做法是：**把这两份原始文件（`x`和`y`）拿去复印了两份**。然后，把你的函数 `swap(int a, int b)` 中的参数 `a` 和 `b` 看作是这两份**复印件**。',
          '',
          '现在，你的函数内部做的事情是：',
          '',
          '```c',
          'void swap(int a, int b) { // a 和 b 是 x 和 y 的复印件',
          '    int temp = a;   // 把复印件a的内容抄到一张废纸上',
          '    a = b;          // 把复印件b的内容抄到复印件a上',
          '    b = temp;       // 再把废纸上的内容抄到复印件b上',
          '} // 函数结束，复印件a和b被扔进碎纸机销毁',
          '```',
          '',
          '你看，你非常努力地交换了两份**复印件**上的所有内容，但这对于桌上的两份**原始文件**（`x`和`y`）有任何影响吗？',
          '',
          '**完全没有！**',
          '',
          '函数结束后，原始文件 `x` 和 `y` 纹丝未动，而你辛苦交换后的复印件已经被销毁了。这就是为什么主函数里的值根本没有改变。',
          '',
          '---',
          '',
          '## 解决方案：传递"原始文件所在抽屉的钥匙"',
          '',
          '那么，如何让函数直接修改原始文件呢？我们不能传递文件本身（复印件），但我们可以**告诉函数原始文件存放在哪个抽屉里**。',
          '',
          '在C语言中，变量的"抽屉地址"就是它的**内存地址**，而"钥匙"就是**指针**。',
          '',
          '当你使用指针时，代码变成了这样：',
          '',
          '```c',
          '// 函数声明改为接收两个指针（两把钥匙）',
          'void swap(int *a, int *b) {',
          '    int temp = *a; // 用钥匙a打开抽屉，拿出里面的值（原始文件），赋给temp',
          '    *a = *b;       // 用钥匙b打开抽屉，拿出里面的值，再用钥匙a打开抽屉，把这个值放进去',
          '    *b = temp;     // 把temp的值，用钥匙b打开抽屉，放进去',
          '}',
          '```',
          '',
          '在主函数中，你这样调用：',
          '',
          '```c',
          'int main() {',
          '    int x = 5, y = 10;',
          '    swap(&x, &y); // 传递的是x和y的地址（相当于说："钥匙给你，抽屉编号是&x和&y"）',
          '    printf("x=%d, y=%d", x, y); // 现在输出的是 x=10, y=5',
          '    return 0;',
          '}',
          '```',
          '',
          '**这个过程依然是"值传递"！** 但这次传递的"值"不再是 `5` 和 `10`，而是两个**地址值**（比如 `0x7ffd5d8c` 和 `0x7ffd5d90`）。',
          '',
          '函数拿到这两个地址值（两把钥匙的复印件），虽然它无法改变钥匙本身（地址），但它可以用这把钥匙去打开对应的抽屉，**直接操作抽屉里的内容（原始数据）**。',
          '',
          '---',
          '',
          '## 核心概念总结',
          '',
          '| 特性 | `swap(int a, int b)` (传值) | `swap(int *a, int *b)` (传地址) |',
          '| :--- | :--- | :--- |',
          '| **传递的内容** | 变量值的**副本** | 变量地址的**副本** |',
          '| **函数内操作对象** | 原始值的**副本** | 通过地址**间接操作原始值** |',
          '| **能否改变实参** | **绝对不能** | **可以** |',
          '| **比喻** | 交换两份**复印件** | 用**钥匙**直接修改**原始文件** |',
          '| **内存示意图** | `a` 和 `b` 是两块**新内存** | `a` 和 `b` 是两块**新内存**，但里面存的是指向`x`,`y`的**地址** |',
          '',
          '所以，你的理解是对的，C语言永远是"值传递"。但通过传递"地址"这个特殊的"值"，我们实现了类似"传引用"的效果，让函数能够修改调用者的变量。',
          '',
          '这就是指针的强大之处，它让你拥有了直接操作内存的能力，也是C语言既让人头疼又极具魅力的原因。'
        ],
        '为什么要把函数声明写在.h头文件里，再把函数定义写在另一个.c文件里？把所有代码都写在同一个.c文件里也能运行啊，这样分开写的好处到底是什么？': [
          '这是一个非常经典的C语言项目组织问题！你的观察很敏锐——确实，把所有代码都写在一个`.c`文件里也能编译运行。但是，当项目变大时，这种"一锅炖"的方式会带来很多问题。让我用一个生动的比喻来解释这种分离的好处。',
          '',
          '---',
          '',
          '## 一个生动的比喻：图书馆和图书',
          '',
          '想象一下，如果图书馆把所有书的内容都印在封面上，会怎么样？',
          '',
          '* **`.h`头文件** 就像是**图书的目录和封面**：',
          '  * 告诉你这本书里有什么函数（目录）',
          '  * 告诉你每个函数的"签名"（参数和返回值类型）',
          '  * 但不告诉你函数的具体实现（书的内容）',
          '',
          '* **`.c`源文件** 就像是**图书的具体内容**：',
          '  * 包含函数的完整实现代码',
          '  * 包含所有的算法和逻辑',
          '',
          '---',
          '',
          '## 分离的核心好处',
          '',
          '### 1. **模块化（Modularization）**',
          '',
          '**问题**：如果把所有代码写在一个文件里，当你想修改一个函数时，你需要：',
          '1. 在几千行代码中找到这个函数',
          '2. 修改它',
          '3. 重新编译整个项目（即使只改了一行）',
          '',
          '**解决方案**：分离后，你可以：',
          '```c',
          '// math.h - 只包含声明',
          'int add(int a, int b);',
          'int multiply(int a, int b);',
          'double sqrt(double x);',
          '',
          '// math.c - 包含实现',
          'int add(int a, int b) {',
          '    return a + b;',
          '}',
          '',
          'int multiply(int a, int b) {',
          '    return a * b;',
          '}',
          '',
          '// 如果只修改了add函数，只需要重新编译math.c',
          '```',
          '',
          '### 2. **编译单元（Compilation Units）和链接（Linking）**',
          '',
          'C语言的编译过程分为两个阶段：',
          '',
          '**第一阶段：编译**',
          '```bash',
          'gcc -c math.c    # 生成 math.o（目标文件）',
          'gcc -c main.c    # 生成 main.o（目标文件）',
          '```',
          '',
          '**第二阶段：链接**',
          '```bash',
          'gcc math.o main.o -o program  # 链接成最终的可执行文件',
          '```',
          '',
          '**关键优势**：',
          '* 如果只修改了`math.c`，只需要重新编译`math.c`，然后重新链接',
          '* 不需要重新编译`main.c`，节省大量时间',
          '',
          '### 3. **信息隐藏（Information Hiding）**',
          '',
          '**头文件只暴露"接口"，隐藏"实现"**：',
          '',
          '```c',
          '// calculator.h - 用户只需要知道这些',
          'int calculate(int a, int b, char operation);',
          '',
          '// calculator.c - 实现细节被隐藏',
          'int calculate(int a, int b, char operation) {',
          '    // 这里可能有复杂的算法，但用户不需要知道',
          '    switch(operation) {',
          '        case \'+\': return add(a, b);',
          '        case \'-\': return subtract(a, b);',
          '        case \'*\': return multiply(a, b);',
          '        case \'/\': return divide(a, b);',
          '        default: return 0;',
          '    }',
          '}',
          '',
          '// 这些辅助函数对用户是隐藏的',
          'static int add(int a, int b) { return a + b; }',
          'static int subtract(int a, int b) { return a - b; }',
          'static int multiply(int a, int b) { return a * b; }',
          'static int divide(int a, int b) { return b != 0 ? a / b : 0; }',
          '```',
          '',
          '### 4. **并行开发（Parallel Development）**',
          '',
          '在团队开发中，不同的人可以同时工作：',
          '',
          '* **程序员A**：负责`math.h`和`math.c`（数学函数）',
          '* **程序员B**：负责`string.h`和`string.c`（字符串处理）',
          '* **程序员C**：负责`main.c`（主程序）',
          '',
          '只要他们约定好接口（头文件），就可以并行开发，互不干扰。',
          '',
          '### 5. **减少编译时间（Incremental Compilation）**',
          '',
          '**大型项目的编译时间对比**：',
          '',
          '| 方式 | 修改一个函数后的编译时间 |',
          '| :--- | :--- |',
          '| **单文件** | 重新编译整个项目（可能需要几分钟） |',
          '| **分离文件** | 只重新编译修改的文件（几秒钟） |',
          '',
          '### 6. **代码重用（Code Reuse）**',
          '',
          '**头文件可以被多个`.c`文件包含**：',
          '',
          '```c',
          '// utils.h - 通用工具函数',
          'void printArray(int arr[], int size);',
          'void sortArray(int arr[], int size);',
          '',
          '// file1.c',
          '#include "utils.h"',
          'void processData1() {',
          '    int data[10];',
          '    // ... 填充数据',
          '    sortArray(data, 10);  // 使用通用函数',
          '    printArray(data, 10);',
          '}',
          '',
          '// file2.c',
          '#include "utils.h"',
          'void processData2() {',
          '    int data[20];',
          '    // ... 填充数据',
          '    sortArray(data, 20);  // 同样的函数，不同的数据',
          '    printArray(data, 20);',
          '}',
          '```',
          '',
          '---',
          '',
          '## 实际项目结构示例',
          '',
          '一个典型的C项目结构：',
          '',
          '```',
          'project/',
          '├── include/           # 头文件目录',
          '│   ├── math.h',
          '│   ├── string.h',
          '│   └── utils.h',
          '├── src/              # 源文件目录',
          '│   ├── math.c',
          '│   ├── string.c',
          '│   ├── utils.c',
          '│   └── main.c',
          '├── obj/              # 编译生成的目标文件',
          '│   ├── math.o',
          '│   ├── string.o',
          '│   ├── utils.o',
          '│   └── main.o',
          '└── Makefile          # 构建脚本',
          '```',
          '',
          '---',
          '',
          '## 什么时候可以写在一个文件里？',
          '',
          '**小项目或学习阶段**：',
          '* 代码量少于100行',
          '* 只有一个人开发',
          '* 不需要维护和扩展',
          '* 学习C语言基础概念时',
          '',
          '**但是，养成好习惯很重要！** 即使在小项目中，也建议分离头文件和源文件，这样：',
          '* 为将来的大项目做准备',
          '* 培养良好的编程习惯',
          '* 代码更容易理解和维护',
          '',
          '---',
          '',
          '## 总结',
          '',
          '| 方面 | 单文件方式 | 分离文件方式 |',
          '| :--- | :--- | :--- |',
          '| **编译速度** | 慢（全量编译） | 快（增量编译） |',
          '| **维护性** | 差（难以定位） | 好（模块清晰） |',
          '| **团队协作** | 困难（冲突多） | 容易（接口清晰） |',
          '| **代码重用** | 困难 | 容易 |',
          '| **项目规模** | 适合小项目 | 适合大项目 |',
          '',
          '**记住**：分离头文件和源文件不是C语言的"要求"，而是软件工程的最佳实践。它让你的代码更专业、更高效、更易维护。',
          '',
          '这就是为什么现代C项目都采用这种组织方式的原因！'
        ],

        '用fopen打开文件时，模式字符串"r", "w", "a", "r+", "w+"这些有什么区别，什么时候该用哪个？': [
          '这个问题是文件操作的核心！这些模式字符串决定了你如何与文件"对话"，用错了会导致数据丢失或其他错误。我来帮你彻底搞清楚。',
          '',
          '首先，记住一个核心概念：文件操作可以类比为**操作一个磁带**（是的，就是老式的录音磁带），有一个"读/写头"的概念。',
          '',
          '---',
          '',
          '## 模式详解与使用场景',
          '',
          '### 1. 基本模式：只读、只写、追加',
          '',
          '| 模式 | 名称 | 如果文件存在 | 如果文件不存在 | 文件指针位置 | 类比 |',
          '| :--- | :--- | :--- | :--- | :--- | :--- |',
          '| **`"r"`** | **Read** (只读) | **打开成功** | **打开失败** (返回NULL) | **文件开头** | 打开一本图书馆的书，**只允许阅读，不允许做任何标记或修改**。 |',
          '| **`"w"`** | **Write** (只写) | **内容被清空！** (从头写) | **创建新文件** | **文件开头** | 拿出一个**新笔记本**（或把旧笔记本的所有页全部撕掉），准备从第一页开始写。**这是最危险的模式，会直接销毁原有内容！** |',
          '| **`"a"`** | **Append** (追加) | **打开成功** | **创建新文件** | **文件末尾** | 打开一个**日记本**，直接翻到最后一页空白页，接着上次的内容继续写。绝对不会影响之前写的内容。 |',
          '',
          '### 2. 增强模式：读写模式 (`+`号)',
          '',
          '`+` 号的意思是**增加功能**。给只读模式加上写的能力，或者给只写模式加上读的能力。',
          '',
          '| 模式 | 名称 | 如果文件存在 | 如果文件不存在 | 文件指针初始位置 | 核心特点 |',
          '| :--- | :--- | :--- | :--- | :--- | :--- |',
          '| **`"r+"`** | **Read/Update** (读写) | **打开成功** | **打开失败** (返回NULL) | **文件开头** | **不会清空文件**。允许读取和**覆盖写入**。 |',
          '| **`"w+"`** | **Write/Update** (写读) | **内容被清空！** | **创建新文件** | **文件开头** | 先像 `"w"` 一样清空文件，然后你可以往里写，写完了还可以把指针移回去读。 |',
          '| **`"a+"`** | **Append/Update** (追加读) | **打开成功** | **创建新文件** | **文件末尾** | 允许在末尾追加内容。**读操作可以从头开始，但所有写操作都强制发生在文件末尾**，与指针位置无关。 |',
          '',
          '---',
          '',
          '## 如何选择？—— 决策流程图',
          '',
          '面对一个任务，你可以这样思考：',
          '',
          '```mermaid',
          'flowchart TD',
          '    A[开始：我需要打开文件] --> B{我想做什么？};',
          '    B -- 仅读取内容 --> C[用 "r" （只读）];',
          '    B -- 创建新文件<br>或覆盖旧文件 --> D[用 "w" （只写）<br>⚠️警告：会清空原文件!];',
          '    B -- 在文件末尾<br>添加新内容 --> E[用 "a" （追加）];',
          '    ',
          '    B -- 需要同时读写 --> F{如何处理现有内容？};',
          '    F -- 保留并修改 --> G[用 "r+" （读写）];',
          '    F -- 丢弃并重新创建 --> H[用 "w+" （写读）<br>⚠️警告：会清空原文件!];',
          '    F -- 在末尾添加<br>同时可读取历史 --> I[用 "a+" （追加读）];',
          '```',
          '',
          '**重要提示**：使用任何 `"w"` 或 `"w+"` 模式时，**务必万分谨慎**，确保你要操作的文件不是重要文件，因为这两个模式会**无条件清空**文件原有内容。',
          '',
          '### 代码示例与常见误区',
          '',
          '```c',
          '#include <stdio.h>',
          '',
          'int main() {',
          '    FILE *fp;',
          '',
          '    // 场景1：读取一个配置文件（文件必须存在）',
          '    fp = fopen("config.ini", "r");',
          '    if (fp == NULL) {',
          '        perror("Error opening file");',
          '        return 1;',
          '    }',
          '    // ... 用 fread 或 fgets 读取操作',
          '    fclose(fp);',
          '',
          '    // 场景2：创建一个新的日志文件（如果已存在则覆盖旧日志）',
          '    fp = fopen("app.log", "w"); // 小心！旧日志会被清空',
          '    // ... 用 fprintf 或 fwrite 写入操作',
          '    fclose(fp);',
          '',
          '    // 场景3：在日志文件末尾追加新日志（最安全的写模式）',
          '    fp = fopen("app.log", "a"); // 不会清空原有日志，只在末尾添加',
          '    fprintf(fp, "New log entry...\\n");',
          '    fclose(fp);',
          '',
          '    // 场景4：修改一个已有的数据文件（例如，修改文件中间的几个字节）',
          '    fp = fopen("data.bin", "r+b"); // "b" 表示二进制模式，用于非文本文件',
          '    fseek(fp, 10, SEEK_SET); // 将指针移动到第10个字节',
          '    fwrite(new_data, sizeof(new_data), 1, fp); // 覆盖写入新数据',
          '    fclose(fp);',
          '',
          '    return 0;',
          '}',
          '```',
          '',
          '### 总结与记忆技巧',
          '',
          '1.  **没有 `+` 号**：功能单一（纯读、纯写、纯追加）。',
          '2.  **有 `+` 号**：读写功能都有。',
          '3.  **开头字母决定对原有内容的态度**：',
          '    *   `r`：尊重原有内容（保留）。',
          '    *   `w`：无视原有内容（清空/重建）。',
          '    *   `a`：保护原有内容（只在末尾添加）。',
          '4.  **最佳实践**：',
          '    *   总是检查 `fopen()` 的返回值是否为 `NULL`。',
          '    *   如果不确定文件是否存在，又不想清空它，可以用 `"a"` 或 `"a+"` 模式，它们会安全地创建新文件。',
          '    *   处理二进制文件（如图片、视频）时，在模式字符串后加个 `b`，如 `"rb"`, `"w+b"`。',
          '',
          '希望这个解释能让你彻底明白！'
        ],
        '一个程序里一个数组明明是int arr[5]，但误操作读写了arr[5]甚至arr[10]，有时候程序会崩溃，有时候又能正常运行并输出一个很奇怪的值。这是为什么？难道C语言不检查数组下标吗？': [
          '这个问题问得非常好，它直接命中了C语言的一个核心特征（也是许多bug的来源）：**C语言不会自动检查数组下标是否越界**。你的观察完全正确：有时崩溃，有时输出奇怪的值。这并不是你的程序或电脑出了问题，而是C语言的工作机制导致的。下面我为你彻底解释一下为什么。',
          '',
          '---',
          '',
          '## 1. 核心原因：C语言信任程序员，追求极致性能',
          '',
          'C语言的设计哲学是"相信程序员是聪明的"，它不会在运行时自动给你加上数组边界检查。因为每次访问数组都检查一次下标，会带来额外的性能开销。C语言的目标之一是高效和底层控制，所以这个责任交给了程序员。',
          '',
          '当你写 `arr[5]` 时，C语言编译器会把它解释为：**"计算 `arr` 的起始地址 + 5 * sizeof(int)`，然后访问那个内存地址的内容。"**',
          '',
          '它**不会**去思考："等等，这个数组只有5个元素，下标5是第6个，这合法吗？"',
          '',
          '---',
          '',
          '## 2. 越界访问时，实际访问了哪里？—— "邻居家的房子"',
          '',
          '想象你的数组是小区里一排连着的5间房子（`arr[0]` 到 `arr[4]`）。',
          '',
          '* `arr[0]` 到 `arr[4]`：是你**合法拥有的房子**，你可以安全地进出。',
          '* `arr[5]`：是你的**邻居家**。你溜进去了。',
          '* `arr[10]`：可能是**小区外的超市甚至更远的地方**。',
          '',
          '现在，关键点在于你的"邻居"是谁？这段内存区域到底存放着什么？这取决于数组的分配方式。',
          '',
          '### 情况一：数组在栈上分配（局部变量）',
          '',
          '```c',
          'void my_function() {',
          '    int arr[5]; // 在栈上分配',
          '    int x = 10; // 另一个局部变量，也可能在栈上',
          '    arr[5] = 100; // 越界写入！',
          '}',
          '```',
          '',
          '编译器会在栈上为函数内的局部变量分配空间。这些变量的位置是相邻的。可能的内存布局如下：',
          '',
          '```',
          '| ... | arr[0] | arr[1] | arr[2] | arr[3] | arr[4] |  x   | ... |',
          '```',
          '',
          '当你访问 `arr[5]` 时，你实际上访问到的就是变量 `x` 的内存空间！你把这个越界写入的操作称为"**缓冲区溢出（Buffer Overflow）**"。',
          '',
          '* **后果**：',
          '    * 如果你**读** `arr[5]`，你会读到一个毫无意义的、类似随机数的值（原来是 `x` 的值，或者是其他函数的遗留数据）。',
          '    * 如果你**写** `arr[5] = 100`，你就**修改了变量 `x` 的值**！这会导致程序出现完全无法理解的逻辑错误，这种bug极难调试。',
          '',
          '### 情况二：数组在堆上分配（malloc）',
          '',
          '```c',
          'int *arr = malloc(5 * sizeof(int)); // 在堆上分配',
          'arr[10] = 100; // 越界写入',
          '```',
          '',
          '堆内存的管理更加复杂。越界访问可能：',
          '',
          '1. 访问到堆管理器用于维护内存的元数据。',
          '2. 访问到其他 `malloc` 分配的内存块。',
          '3. 访问到未分配的内存空间。',
          '',
          '### 情况三：访问了完全不可读写的内存',
          '',
          '如果你的下标非常大，比如 `arr[100000]`，计算出的地址可能超出了操作系统为你程序分配的内存空间。',
          '',
          '* **后果**：当你试图访问这个非法地址时，操作系统会介入，强制终止你的程序，并报错 **"Segmentation fault (core dumped)"** 或 **"段错误"**。这就是程序**崩溃**的情况。',
          '',
          '---',
          '',
          '## 为什么行为"有时"不同？',
          '',
          '因为你的程序每次运行时，内存的布局**并非完全一模一样**。',
          '',
          '1. **地址空间布局随机化 (ASLR)**：现代操作系统为了安全，会随机化程序的内存布局（如栈和堆的起始地址）。所以 `arr[5]` 在第一次运行时可能指向变量 `x`，第二次运行就可能指向别的东西。',
          '',
          '2. **编译器优化**：编译器可能会为了优化而调整局部变量的在栈上的排列顺序。',
          '',
          '3. **程序状态**：你的程序之前执行了不同的操作，导致内存中的内容发生了变化。',
          '',
          '因此，一次越界访问可能这次覆盖了一个无关紧要的数据，程序看似"正常"运行；下一次却覆盖了一个关键的函数返回地址，导致程序立即崩溃。这种不确定性使得越界bug非常可怕。',
          '',
          '---',
          '',
          '## 总结与启示',
          '',
          '| 你的操作 | C语言的观点 | 可能的后果 |',
          '| :--- | :--- | :--- |',
          '| 访问 `arr[5]` | 计算地址 `arr + 5*4`，然后访问 | 修改了其他变量、读取到垃圾值、程序逻辑错误 |',
          '| 访问 `arr[10000]` | 计算地址 `arr + 10000*4`，然后访问 | 访问了非法内存地址，导致**段错误，程序崩溃** |',
          '',
          '**给你的建议：**',
          '',
          '1. **永远记住**：C语言不会帮你检查数组边界，这是你作为程序员的职责。',
          '',
          '2. **谨慎使用裸数组**：在C++中，可以使用更安全的 `std::vector`，它提供了 `at()` 方法进行边界检查（虽然牺牲了一点性能）。',
          '',
          '3. **使用工具检测**：可以使用一些工具如 **Valgrind**、**AddressSanitizer** 等来动态检测程序中的内存错误，包括数组越界。它们是发现这类问题的神器。',
          '',
          '4. **培养好习惯**：在编写循环时，始终明确循环的边界条件。例如：',
          '',
          '```c',
          'for (int i = 0; i < 5; i++) { // 正确：使用数组大小作为边界',
          '    arr[i] = ...;',
          '}',
          '```',
          '',
          '总之，数组越界访问是C/C++程序中最常见也是最危险的bug之一。它就像一颗埋藏在代码里的"地雷"，爆炸的时机和威力难以预测。理解其背后的内存原理，是成为合格C程序员的必经之路。'
        ]
      }
    }
  },
  computed: {
    // 根据筛选条件过滤作业
    filteredAssignments() {
      if (this.filterType === 'all') {
        return this.assignments;
      } else if (this.filterType === 'completed') {
        return this.assignments.filter(item => item.status === '已提交');
      } else {
        return this.assignments.filter(item => item.status !== '已提交');
      }
    },
    // 知识库展示数据：仅显示 state/status 为 1 的
    repositoryUnitsView() {
      if (!Array.isArray(this.repositoryUnits)) return []
      return this.repositoryUnits.filter(u => (u.state === 1) || (u.status === 1))
    },
    
    // 根据筛选条件过滤考试
    filteredExams() {
      if (this.filterType === 'all') {
        return this.exams;
      } else if (this.filterType === 'completed') {
        return this.exams.filter(item => item.status === '已完成');
      } else {
        return this.exams.filter(item => item.status !== '已完成');
      }
    },
    
    // 根据筛选条件过滤考勤记录
    filteredAttendanceRecords() {
      if (!this.attendanceStatusFilter) {
        return this.attendanceRecords;
      }
      return this.attendanceRecords.filter(record => record.status === this.attendanceStatusFilter);
    },
    
    // 是否显示筛选栏
    showFilterBar() {
      return ['assignment', 'exam', 'knowledge'].includes(this.activeSection);
    },
    
    // 考勤统计
    attendanceStats() {
      const stats = {
        present: 0,
        late: 0,
        absent: 0,
        leave: 0
      };
      
      this.attendanceRecords.forEach(record => {
        if (record.status === '已到' || record.status === '出勤') {
          stats.present++;
        } else if (record.status === '迟到') {
          stats.late++;
        } else if (record.status === '缺勤') {
          stats.absent++;
        } else if (record.status === '请假') {
          stats.leave++;
        }
      });
      
      return stats;
    },
    
    // 过滤后的文档列表
    filteredDocuments() {
      if (!this.documentSearchKeyword) {
        return this.documents;
      }
      const keyword = this.documentSearchKeyword.toLowerCase();
      
      return this.documents.filter(doc => {
        return typeof doc === 'string' && doc.toLowerCase().includes(keyword);
      });
    },
  },
  created() {
    // 从路由参数获取课程ID
    this.courseId = this.$route.params.courseId || '1'; // 默认值为1，实际应该从路由获取
    
    // 从路由query参数获取课程名称和其他信息
    if (this.$route.query.courseName) {
      this.courseName = this.$route.query.courseName;
    }
    
    if (this.$route.query.courseCode) {
      this.courseCode = this.$route.query.courseCode;
    }
    
    if (this.$route.query.category) {
      this.courseCategory = this.$route.query.category;
    }
    
    // 加载数据
    this.loadCourseData();
    
    // 如果当前选中的是文档区，则加载文档
    if (this.activeSection === 'document') {
      this.fetchDocuments();
    }
  },
  methods: {
    // 设置当前激活的部分
    setActiveSection(section) {
      this.activeSection = section;
      
      // 如果切换到文档区，则加载文档
      if (section === 'document' && this.documents.length === 0) {
        this.fetchDocuments();
      }
      // 切换到知识库则加载
      if (section === 'repository') {
        this.loadRepository();
      }
    },

    // 显示并加载知识单元题目（使用指定接口级联获取）
    async showKUProblems(ku) {
      this.selectedKU = ku
      this.kuProblems = []
      if (!ku || !ku.id) return
      try {
        this.kuProblemsLoadingInline = true
        // 1) 通过知识单元ID获取题目ID列表
        const idList = await problemKnowledgeUnit.getProblemIdByKnowledgeUnitId(ku.id)
        const rawContainer = Array.isArray(idList)
          ? idList
          : (idList?.problemIds || idList?.problemIdList || idList?.ids || idList?.data || idList?.records || idList?.list || [])
        let problemIds = []
        if (Array.isArray(rawContainer)) {
          // 情况1：数组元素可能直接是ID（number/string）
          // 情况2：数组元素可能是对象，尝试从常见字段中提取
          problemIds = rawContainer.map(item => {
            if (item == null) return null
            if (typeof item === 'number' || typeof item === 'string') return String(item)
            if (typeof item === 'object') {
              return String(item.problemId || item.problem_id || item.id || item.problemID || item.problemid || '')
            }
            return null
          }).filter(v => v && v !== 'null' && v !== 'undefined')
        }
        if (problemIds.length === 0) {
          this.kuProblems = []
          return
        }
        // 2) 逐个根据题目ID获取题目详情
        const results = await Promise.all(problemIds.map(async (pid) => {
          try {
            const detail = await problemBank.getById(pid)
            const d = (detail && (detail.data || detail.result || detail.payload)) || detail || {}
            // 解析选项为数组
            let options = d.options
            if (typeof options === 'string') {
              try {
                if (options.trim().startsWith('[')) options = JSON.parse(options)
                else options = options.split(/\r?\n|\||；|;|、|，/).map(t => t.trim()).filter(Boolean)
              } catch (_) {
                options = options.split(/\r?\n|\||；|;|、|，/).map(t => t.trim()).filter(Boolean)
              }
            }
            return {
              id: d.id ?? pid,
              title: d.title || d.name || '',
              content: d.content || d.question || d.stem || '',
              type: d.type || d.problemType || '',
              options: Array.isArray(options) ? options : (options ? [String(options)] : []),
              expectedAnswer: d.expectedAnswer || d.expected_answer || d.answer || '',
              analysis: d.analysis || '',
              origin: d.origin || ''
            }
          } catch (e) {
            return { id: pid, content: '题目加载失败', type: '', options: [], expectedAnswer: '', analysis: '' }
          }
        }))
        this.kuProblems = results
      } catch (e) {
        console.error('加载知识单元题目失败:', e)
        this.$message.error('加载题目失败，请稍后再试')
      } finally {
        this.kuProblemsLoadingInline = false
      }
    },

    // 跳转到单独页面展示题目
    goToKUProblems(ku) {
      if (!ku || !ku.id) {
        this.$message.warning('无法识别知识单元ID')
        return
      }
      this.$router.push({
        name: 'studentKnowledgeProblems',
        params: { knowledgeUnitId: String(ku.id) }
      })
    },
    
    // 处理知识点点击
    handleKnowledgeCardClick(point) {
      console.log('点击知识点:', point.name, point.knowledgeId);
      // 跳转到知识点详情页面
      this.$router.push({
        path: `/student/knowledge/${point.knowledgeId}`,
        query: {
          courseName: this.courseName,
          courseId: this.courseId,
          knowledgeName: point.name,
          knowledgeDescription: point.description
        }
      });
    },



    // 标记知识点为已完成
    async markAsCompleted(point) {
      try {
        // 设置更新状态
        point.updating = true;

        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.studentId) {
          this.$message.error('无法获取学生信息，请重新登录');
          return;
        }

        // 更新本地状态
        point.completed = true;
        this.$message.success('知识点已标记为完成！');

      } catch (error) {
        console.error('标记完成失败:', error);
        this.$message.error('标记完成失败: ' + (error.message || '未知错误'));
      } finally {
        point.updating = false;
      }
    },

    // 开始学习知识点
    startLearning(point) {
      // 跳转到知识点详情页面开始学习
      this.handleKnowledgeCardClick(point);
    },

    // 复习知识点
    reviewKnowledge(point) {
      // 跳转到知识点详情页面进行复习
      this.handleKnowledgeCardClick(point);
    },
    
    // 获取作业状态对应的标签类型
    getAssignmentTagType(status) {
      const map = {
        '已提交': 'success',
        '进行中': 'warning',
        '未开始': 'info',
        '已逾期': 'danger'
      };
      return map[status] || '';
    },
    
    // 获取考试状态对应的标签类型
    getExamTagType(status) {
      const map = {
        '已完成': 'success',
        '未开始': 'info'
      };
      return map[status] || '';
    },
    
    // 获取考勤状态对应的标签类型
    getAttendanceTagType(status) {
      const map = {
        '出勤': 'success',
        '已到': 'success',
        '迟到': 'warning',
        '缺勤': 'danger',
        '请假': 'info',
        '已结束': 'success',
        '进行中': 'primary',
        '': 'info'
      };
      return map[status] || 'info';
    },
    
    // 检查日期是否有考勤记录
    hasAttendanceRecord(day) {
      const date = this.formatDate(day);
      return this.attendanceRecords.some(record => record.date === date);
    },
    
    // 获取日期的考勤状态
    getAttendanceStatus(day) {
      const date = this.formatDate(day);
      const record = this.attendanceRecords.find(record => record.date === date);
      return record ? record.status : '';
    },
    
    // 获取日期的考勤样式
    getAttendanceClass(day) {
      const date = this.formatDate(day);
      const record = this.attendanceRecords.find(record => record.date === date);
      if (!record) return '';
      
      const map = {
        '已到': 'attendance-present',
        '迟到': 'attendance-late',
        '请假': 'attendance-leave',
        '缺勤': 'attendance-absent',
        '已结束': 'attendance-present'
      };
      
      return map[record.status] || '';
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '未知日期';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        });
      } catch (error) {
        return '日期格式错误';
      }
    },
    
    // 格式化时间
    formatTime(timeString) {
      if (!timeString) return '';
      try {
        const date = new Date(timeString);
        return date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return '时间格式错误';
      }
    },
    
    // 查看作业详情
    viewAssignment(assignment) {
      this.$router.push({
        path: `/student/homework/${assignment.id}`,
        query: {
          courseId: this.courseId,
          courseName: this.courseName,
          assignmentTitle: assignment.title,
          assignmentId: assignment.id
        }
      });
    },
    
    // 加载课程数据
    loadCourseData() {
      // 这里将通过API获取实际数据
      // 获取知识点
      this.fetchKnowledgePoints();
      // 获取考勤记录
      this.fetchAttendanceRecords();
      // 获取作业
      this.fetchAssignments();
      // 获取考试
      this.fetchExams();
      // 获取课程文档
      this.fetchDocuments();
    },
    
    // 获取知识点
    fetchKnowledgePoints() {
      // 设置加载状态
      this.knowledgePointsLoading = true;
      
      // 调用知识点API
      knowledgeAPI.getKnowledgeByCourseId(this.courseId)
        .then(response => {
          // 直接使用API返回的知识点列表，不再按章节分组
          this.organizeKnowledgePoints(response);
        })
        .catch(error => {
          console.error('获取知识点数据失败:', error);
          this.$message.error('获取知识点数据失败，请稍后再试');
        })
        .finally(() => {
          this.knowledgePointsLoading = false;
        });
    },
    
    // 加载知识库（学科和知识单元）
    async loadRepository() {
      try {
        this.repositoryLoading = true
        this.repositoryUnits = []
        this.repositorySubject = ''
        // 先通过课程ID获取学科
        const subject = await subjectController.getSubjectByCourseId(this.courseId)
        let subjectName = ''
        if (subject && subject.name) {
          subjectName = subject.name
        } else if (Array.isArray(subject) && subject[0] && subject[0].name) {
          subjectName = subject[0].name
        }
        this.repositorySubject = subjectName
        if (!subjectName) return
        // 再根据学科名获取所有知识单元
        const units = await knowledgeUnitController.getAllBySubject(subjectName)
        if (Array.isArray(units)) {
          this.repositoryUnits = units
        } else if (units && Array.isArray(units.records)) {
          this.repositoryUnits = units.records
        } else {
          this.repositoryUnits = []
        }
      } catch (e) {
        console.error('加载知识库失败:', e)
        this.$message.error('加载知识库失败，请稍后重试')
      } finally {
        this.repositoryLoading = false
      }
    },
    
    // 组织知识点数据为树形结构
    organizeKnowledgePoints(knowledgeList) {
      if (!Array.isArray(knowledgeList) || knowledgeList.length === 0) {
        this.knowledgePoints = [];
        return;
      }

      // 直接使用API返回的知识点列表，不再按章节分组
      this.knowledgePoints = knowledgeList.map(item => {
        return {
          ...item,
          completed: false, // 默认未完成
          updating: false // 用于按钮加载状态
        };
      });
    },
    
    // 获取考勤记录
    fetchAttendanceRecords() {
      // 设置加载状态
      this.attendanceLoading = true;
      
      // 从本地存储获取学生ID
      const userInfo = getUserInfo();
      if (!userInfo || !userInfo.studentId) {
        console.error('未找到学生ID信息');
        this.$message.error('获取学生信息失败，请重新登录');
        this.attendanceLoading = false;
        return;
      }
      
      // 调用考勤API获取学生特定课程的考勤数据
      attendanceAPI.getStudentCourseAttendance(userInfo.studentId, this.courseId)
        .then(response => {
          if (Array.isArray(response)) {
            // 处理考勤数据
            this.attendanceRecords = response.map(item => {
              return {
                id: item.attendanceId,
                date: this.formatDate(item.attendanceDate), // 使用attendanceDate字段
                status: this.mapAttendanceStatus(item),
                time: this.formatTime(item.createdAt) || '未记录', // 使用创建时间作为考勤时间
                reason: item.reason || '',
                note: item.remark || '', // 使用remark字段
                canSignIn: (item.status === '进行中' || !item.status || item.status.trim() === '') && !item.present, // 允许状态为空或进行中的考勤都可以签到
                originalData: item // 保存原始数据，以备后用
              };
            });
            
            // 按日期排序，最新的在前面
            this.attendanceRecords.sort((a, b) => {
              return new Date(b.originalData.attendanceDate) - new Date(a.originalData.attendanceDate);
            });
          } else {
            this.attendanceRecords = [];
          }
        })
        .catch(error => {
          console.error('获取考勤数据失败:', error);
          this.$message.error('获取考勤数据失败，请稍后再试');
          this.attendanceRecords = [];
        })
        .finally(() => {
          this.attendanceLoading = false;
        });
    },
    
    // 映射考勤状态
    mapAttendanceStatus(item) {
      // 如果有明确的status字段且不为空，优先使用
      if (item.status && item.status.trim() !== '') {
        return item.status;
      }
      
      // 否则根据absent、late、present字段确定状态
      if (item) {
        if (item.present) {
          return '已到';
        } else if (item.late) {
          return '迟到';
        } else if (item.absent) {
          return '缺勤';
        } else {
          // 如果没有明确状态，默认为进行中
          return '进行中';
        }
      }
      
      // 默认返回进行中
      return '进行中';
    },
    
    // 获取作业（保留原方法以兼容）
    fetchAssignments() {
      // 获取教师布置的作业
      this.fetchTeacherAssignments();
    },

    // 获取教师布置的作业
    async fetchTeacherAssignments() {
      this.teacherAssignmentsLoading = true;

      try {
        const response = await assignmentAPI.getAssignmentsByCourseIdAndType(this.courseId, 'TEACHER_ASSIGNED');

        if (Array.isArray(response)) {
          // 获取学生信息
          const userInfo = getUserInfo();

          // 为每个作业获取剩余重做次数
          const assignmentsWithRedoInfo = await Promise.all(
            response.map(async (item) => {
              let remainingAttempts = 0;

              // 如果允许重做，计算剩余重做次数
              if (item.isRedoAllowed && item.maxAttempts > 0) {
                try {
                  // 使用简单的前端逻辑计算重做次数
                  const answers = await studentAnswerAPI.getAnswersByAssignment(item.assignmentId, userInfo.studentId);
                  if (Array.isArray(answers) && answers.length > 0) {
                    // 如果已经有答案，说明至少使用了一次机会
                    remainingAttempts = Math.max(0, item.maxAttempts - 1);
                  } else {
                    // 如果没有答案，说明还没开始做
                    remainingAttempts = item.maxAttempts;
                  }
                } catch (answerError) {
                  console.warn('获取作业答案失败:', answerError);
                  remainingAttempts = item.maxAttempts; // 最后的默认值
                }
              }

              return {
                assignmentId: item.assignmentId,
                title: item.title || '未命名作业',
                description: item.description || '',
                startTime: item.startTime,
                endTime: item.endTime,
                type: item.type,
                status: item.status,
                courseId: item.courseId,
                creatorId: item.creatorId,
                isAnswerPublic: item.isAnswerPublic,
                isScoreVisible: item.isScoreVisible,
                isRedoAllowed: item.isRedoAllowed,
                maxAttempts: item.maxAttempts,
                remainingAttempts: remainingAttempts, // 添加剩余重做次数
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              };
            })
          );

          this.teacherAssignments = assignmentsWithRedoInfo;
        } else {
          this.teacherAssignments = [];
        }
      } catch (error) {
        console.error('获取教师布置作业失败:', error);
        this.$message.error('获取教师布置作业失败，请稍后再试');
        this.teacherAssignments = [];
      } finally {
        this.teacherAssignmentsLoading = false;
      }
    },



    // 处理作业标签页切换
    handleAssignmentTabClick(tab) {
      if (tab.name === 'teacher') {
        this.fetchTeacherAssignments();
      }
    },

    // 判断作业是否已完成
    isAssignmentCompleted(assignment) {
      // 这里可以根据实际业务逻辑判断作业是否完成
      // 暂时根据状态判断
      return assignment.status === 'COMPLETED' || assignment.status === 'SUBMITTED';
    },

    // 获取作业状态对应的标签类型
    getAssignmentStatusType(assignment) {
      const now = new Date();
      const endTime = new Date(assignment.endTime);

      if (this.isAssignmentCompleted(assignment)) {
        return 'success';
      } else if (now > endTime) {
        return 'danger';
      } else {
        return 'warning';
      }
    },

    // 获取作业状态文本
    getAssignmentStatusText(assignment) {
      const now = new Date();
      const startTime = new Date(assignment.startTime);
      const endTime = new Date(assignment.endTime);

      if (this.isAssignmentCompleted(assignment)) {
        return '已完成';
      } else if (now < startTime) {
        return '未开始';
      } else if (now > endTime) {
        return '已逾期';
      } else {
        return '进行中';
      }
    },

    // 查看作业详情
    viewAssignmentDetail(assignment) {
      this.$router.push({
        path: `/student/homework/${assignment.assignmentId}`,
        query: {
          courseId: this.courseId,
          courseName: this.courseName,
          assignmentTitle: assignment.title
        }
      });
    },
    
    // 获取考试
    fetchExams() {
      // 设置加载状态
      this.examsLoading = true;
      
      // 调用考试API获取考试类型的数据
      examAPI.getExamsInCourseByType(this.courseId, 'exam')
        .then(response => {
          if (Array.isArray(response)) {
            // 处理考试数据
            this.exams = response.map(item => {
              return {
                id: item.examId,
                title: item.title,
                time: `${this.formatDateTime(item.startTime)} - ${this.formatDateTime(item.endTime)}`,
                location: item.location || '线上考试',
                status: this.getExamStatus(item),
                score: item.score || null,
                description: item.description,
                startTime: item.startTime,
                endTime: item.endTime,
                originalData: item // 保存原始数据，以备后用
              };
            });
          }
        })
        .catch(error => {
          console.error('获取考试数据失败:', error);
          this.$message.error('获取考试数据失败，请稍后再试');
        })
        .finally(() => {
          this.examsLoading = false;
        });
    },
    
    // 格式化日期时间
    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return '未设置';
      
      try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return '日期格式错误';
      }
    },
    
    // 获取作业状态
    getAssignmentStatus(assignment) {
      const now = new Date();
      const startTime = new Date(assignment.startTime);
      const endTime = new Date(assignment.endTime);
      
      if (assignment.submitted) {
        return '已提交';
      } else if (now < startTime) {
        return '未开始';
      } else if (now > endTime) {
        return '已逾期';
      } else {
        return '进行中';
      }
    },
    
    // 获取考试状态
    getExamStatus(exam) {
      const now = new Date();
      const startTime = new Date(exam.startTime);
      const endTime = new Date(exam.endTime);
      
      if (exam.completed) {
        return '已完成';
      } else if (now < startTime) {
        return '未开始';
      } else if (now > endTime) {
        return '已结束';
      } else {
        return '进行中';
      }
    },
    
    // 获取课程标题的第一个字符
    getCourseTitleChar() {
      if (!this.courseName || this.courseName.length === 0) {
        return '课';
      }
      return this.courseName.charAt(0);
    },
    
    // 获取课程分类的颜色
    getCategoryColor(category) {
      if (!category) return '#3370ff'; // 默认蓝色
      
      // 预定义的颜色列表
      const colors = [
          '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
          '#909399', '#9B59B6', '#3498DB', '#1ABC9C',
          '#27AE60', '#F39C12', '#D35400', '#8E44AD',
          '#16A085', '#2980B9', '#C0392B', '#7F8C8D'
      ];
      
      // 使用分类名的字符串哈希值来确定颜色索引
      let hashCode = 0;
      for (let i = 0; i < category.length; i++) {
          hashCode = ((hashCode << 5) - hashCode) + category.charCodeAt(i);
          hashCode = hashCode & hashCode; // 转换为32位整数
      }
      
      // 确保hashCode为正数
      hashCode = Math.abs(hashCode);
      
      // 使用哈希值对颜色数组取模，得到确定的颜色索引
      const colorIndex = hashCode % colors.length;
      
      return colors[colorIndex];
    },
    
    // 获取知识点的难度颜色
    getKnowledgeDifficultyColor(difficultyLevel) {
      const difficultyColors = {
        '简单': '#67C23A',
        '中等': '#E6A23C',
        '困难': '#F56C6C'
      };
      return difficultyColors[difficultyLevel] || '#909399';
    },
    
    // 获取知识点的图标
    getKnowledgeIcon(point) {
      // 根据知识点名称的第一个字返回图标
      if (point && point.name && point.name.length > 0) {
        return point.name.charAt(0);
      }
      return '知';
    },

    // 显示考勤详情对话框
    showAttendanceDetail(record) {
      this.selectedAttendance = record;
      this.attendanceDialogVisible = true;
    },
    
    // 处理考勤签到
    async handleSignIn(record) {
      try {
        // 获取学生ID
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.studentId) {
          this.$message.error('获取学生信息失败，请重新登录');
          return;
        }
        
        // 显示加载状态
        const loading = this.$loading({
          lock: true,
          text: '正在签到...',
          spinner: 'el-icon-loading',
          background: 'rgba(255, 255, 255, 0.7)'
        });
        
        // 调用签到API
        const result = await attendanceAPI.studentAttendanceSignIn(record.id, userInfo.studentId);
        
        // 关闭加载状态
        loading.close();
        
        // 处理结果
        if (result && result.success) {
          this.$message.success('签到成功');
          // 重新获取考勤记录
          this.fetchAttendanceRecords();
        } else {
          this.$message.error(result.message || '签到失败，请稍后再试');
        }
      } catch (error) {
        console.error('考勤签到失败:', error);
        this.$message.error('签到失败: ' + (error.message || '未知错误'));
      }
    },
    
    // 查看考试详情
    viewExam(exam) {
      this.$router.push({
        path: `/student/exam/${exam.id}`,
        query: {
          courseId: this.courseId,
          courseName: this.courseName,
          examTitle: exam.title,
          examId: exam.id
        }
      });
    },
    
    // 考勤记录表格行样式
    getAttendanceRowClass({ row }) {
      if (row.status === '已到' || row.status === '出勤') {
        return 'attendance-present-row';
      } else if (row.status === '迟到') {
        return 'attendance-late-row';
      } else if (row.status === '缺勤') {
        return 'attendance-absent-row';
      } else if (row.status === '请假') {
        return 'attendance-leave-row';
      }
      return '';
    },

    // 获取考勤状态对应的图标
    getAttendanceStatusIcon(status) {
      const icons = {
        '已到': 'el-icon-check',
        '迟到': 'el-icon-time',
        '缺勤': 'el-icon-close',
        '请假': 'el-icon-document',
        '进行中': 'el-icon-loading',
        '已提交': 'el-icon-document-checked',
        '已逾期': 'el-icon-warning',
        '未开始': 'el-icon-date',
        '已完成': 'el-icon-check-circle',
        '已结束': 'el-icon-check-circle'
      };
      return icons[status] || 'el-icon-info'; // 默认图标
    },

    // 获取考勤状态对应的对话框头部样式
    getAttendanceStatusClass(status) {
      const classes = {
        '已到': 'attendance-present-header',
        '迟到': 'attendance-late-header',
        '缺勤': 'attendance-absent-header',
        '请假': 'attendance-leave-header',
        '进行中': 'attendance-present-header',
        '已提交': 'attendance-present-header',
        '已逾期': 'attendance-late-header',
        '未开始': 'attendance-present-header',
        '已完成': 'attendance-present-header',
        '已结束': 'attendance-present-header'
      };
      return classes[status] || 'attendance-present-header'; // 默认样式
    },
    
    // 获取文档列表
    async fetchDocuments() {
      this.documentLoading = true;
      try {
        console.log('开始获取文档列表');

        // 调用API获取文档列表
        const fileList = await docAPI.listDocs();
        console.log('获取到的文档列表:', fileList);
        
        // 处理文档数据，将可能连在一起的文档名称分开
        const processedDocuments = [];
        
        if (Array.isArray(fileList)) {
          // 遍历文档列表
          fileList.forEach(doc => {
            if (typeof doc === 'string') {
              // 首先尝试按逗号分割
              if (doc.includes(',')) {
                const splitDocs = doc.split(',').map(item => item.trim()).filter(item => item);
                processedDocuments.push(...splitDocs);
                return;
              }
              
              // 检查是否是连续文件名
              const fileExtensions = ['.pdf', '.txt', '.docx', '.pptx', '.xlsx', '.doc', '.ppt', '.xls'];
              let currentString = doc;
              let lastIndex = 0;
              let foundFiles = [];
              
              // 遍历所有可能的文件扩展名
              fileExtensions.forEach(ext => {
                let extIndex = currentString.indexOf(ext);
                while (extIndex !== -1) {
                  // 找到一个文件扩展名
                  const endPos = extIndex + ext.length;
                  const fileName = currentString.substring(lastIndex, endPos);
                  foundFiles.push(fileName.trim());
                  
                  // 更新搜索位置
                  lastIndex = endPos;
                  
                  // 继续查找下一个扩展名
                  extIndex = currentString.indexOf(ext, lastIndex);
                }
              });
              
              // 如果找到了文件，添加到结果中
              if (foundFiles.length > 0) {
                processedDocuments.push(...foundFiles);
              } else {
                // 没有找到文件，作为单个文件添加
                processedDocuments.push(doc);
              }
            } else if (Array.isArray(doc)) {
              // 如果已经是数组格式，处理每个元素
              doc.forEach(item => {
                if (typeof item === 'string') {
                  processedDocuments.push(item);
                }
              });
            }
          });
        }
        
        this.documents = processedDocuments;
        console.log('处理后的文档列表:', this.documents);
      } catch (error) {
        console.error('获取文档列表失败:', error);

        // 根据错误类型显示不同的提示信息
        if (error.message && error.message.includes('文档服务暂时不可用')) {
          this.$message.warning('文档服务暂时不可用，请稍后重试');
        } else {
          this.$message.warning('获取课程文档列表失败，文档功能可能暂时不可用');
        }

        this.documents = [];
      } finally {
        this.documentLoading = false;
      }
    },
    
    // 下载文档
    async downloadDocument(filename) {
      try {
        this.$message.info('文档下载中，请稍候...');
        
        // 使用API下载文档
        const blob = await docAPI.downloadDoc(filename);
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // 清理
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }, 100);
        
        this.$message.success('文档下载成功');
      } catch (error) {
        console.error('下载文档失败:', error);
        this.$message.error('下载文档失败，请稍后重试');
      }
    },

    // 根据文件扩展名获取对应的图标
    getDocumentIcon(filename) {
      if (!filename) return 'el-icon-document';
      
      const extension = filename.split('.').pop().toLowerCase();
      
      const iconMap = {
        'pdf': 'el-icon-document',
        'doc': 'el-icon-document',
        'docx': 'el-icon-document',
        'txt': 'el-icon-document',
        'ppt': 'el-icon-document',
        'pptx': 'el-icon-document',
        'xls': 'el-icon-document',
        'xlsx': 'el-icon-document',
        'png': 'el-icon-picture',
        'jpg': 'el-icon-picture',
        'jpeg': 'el-icon-picture',
        'gif': 'el-icon-picture',
        'zip': 'el-icon-folder',
        'rar': 'el-icon-folder'
      };
      
      return iconMap[extension] || 'el-icon-document';
    },

    // ===== AI生成练习相关方法 =====

    // 显示知识点输入对话框
    showKnowledgeInputDialog() {
      // 重置表单
      this.knowledgeForm = {
        knowledgeNames: '',
        difficultyLevel: '中等',
        problemCount: 5
      };
      this.knowledgeInputDialogVisible = true;
    },

    // 按课程生成练习
    async generateAIExerciseByCourse() {
      try {
        this.aiGenerating = true;

        // 获取用户信息
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.studentId) {
          this.$message.warning('未找到用户信息，请重新登录');
          return;
        }

        // 显示加载提示
        const loading = this.$loading({
          lock: true,
          text: 'AI正在根据课程生成练习题目，请耐心等待...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });

        try {
          // 调用API生成练习
          const response = await studentAssistantAPI.generateExerciseByCourseName(
            userInfo.studentId,
            this.courseName,
            '中等', // 默认中等难度
            5 // 默认5题
          );

          console.log('AI生成练习响应:', response);

          // 解析生成的题目
          const questions = this.parseAIResponse(response);

          if (questions.length === 0) {
            this.$message.error('AI生成的题目格式有误，请重试');
            return;
          }

          // 存储生成的题目
          this.generatedQuestions = questions;
          this.$message.success(`成功生成 ${questions.length} 道练习题！`);

        } catch (error) {
          console.error('生成练习失败:', error);

          // 如果是405错误，使用模拟数据
          if (error.response && error.response.status === 405) {
            console.log('后端接口不可用，使用模拟数据演示');
            const mockResponse = this.generateMockResponse('course');
            const questions = this.parseAIResponse(mockResponse);
            this.generatedQuestions = questions;
            this.$message.success(`成功生成 ${questions.length} 道练习题！（演示模式）`);
          } else {
            this.$message.error('生成练习失败，请稍后重试');
          }
        } finally {
          loading.close();
        }

      } catch (error) {
        console.error('生成练习失败:', error);
        this.$message.error('生成练习失败，请稍后重试');
      } finally {
        this.aiGenerating = false;
      }
    },

    // 按知识点生成练习
    async generateAIExerciseByKnowledge() {
      try {
        // 表单验证
        if (!this.$refs.knowledgeFormRef) return;
        const valid = await this.$refs.knowledgeFormRef.validate();
        if (!valid) return;

        this.aiGenerating = true;

        // 获取用户信息
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.studentId) {
          this.$message.warning('未找到用户信息，请重新登录');
          return;
        }

        // 显示加载提示
        const loading = this.$loading({
          lock: true,
          text: 'AI正在根据知识点生成练习题目，请耐心等待...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });

        try {
          // 处理知识点名称
          const knowledgeNames = this.knowledgeForm.knowledgeNames
            .split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0);

          if (knowledgeNames.length === 0) {
            this.$message.error('请输入有效的知识点名称');
            return;
          }

          // 调用API生成练习
          const response = await studentAssistantAPI.generateExerciseByKnowledgeNames(
            userInfo.studentId,
            knowledgeNames,
            this.knowledgeForm.difficultyLevel,
            this.knowledgeForm.problemCount
          );

          console.log('AI生成练习响应:', response);

          // 解析生成的题目
          const questions = this.parseAIResponse(response);

          if (questions.length === 0) {
            this.$message.error('AI生成的题目格式有误，请重试');
            return;
          }

          // 存储生成的题目
          this.generatedQuestions = questions;
          this.$message.success(`成功生成 ${questions.length} 道练习题！`);

          // 关闭对话框
          this.knowledgeInputDialogVisible = false;

        } catch (error) {
          console.error('生成练习失败:', error);

          // 如果是405错误，使用模拟数据
          if (error.response && error.response.status === 405) {
            console.log('后端接口不可用，使用模拟数据演示');
            const mockResponse = this.generateMockResponse('knowledge');
            const questions = this.parseAIResponse(mockResponse);
            this.generatedQuestions = questions;
            this.$message.success(`成功生成 ${questions.length} 道练习题！（演示模式）`);
            this.knowledgeInputDialogVisible = false;
          } else {
            this.$message.error('生成练习失败，请稍后重试');
          }
        } finally {
          loading.close();
        }

      } catch (error) {
        console.error('生成练习失败:', error);
        this.$message.error('生成练习失败，请稍后重试');
      } finally {
        this.aiGenerating = false;
      }
    },

    // 清空生成的题目
    clearGeneratedQuestions() {
      this.generatedQuestions = [];
      this.$message.info('已清空所有题目');
    },

    // 解析AI响应
    parseAIResponse(response) {
      try {
        console.log('解析AI响应:', response);

        // 处理不同的响应格式
        let content = '';

        // 如果响应是字符串
        if (typeof response === 'string') {
          content = response;
        }
        // 如果响应是对象，尝试获取内容
        else if (typeof response === 'object' && response !== null) {
          // 尝试多种可能的字段名
          content = response.content || response.result || response.data || response.answer || '';

          // 如果还是对象，尝试获取第一个字符串值
          if (typeof content === 'object') {
            const values = Object.values(content);
            content = values.find(v => typeof v === 'string') || '';
          }
        }

        if (!content || typeof content !== 'string') {
          console.error('AI响应格式错误，无法提取文本内容:', response);
          // 尝试直接使用响应对象的字符串表示
          if (response && typeof response === 'object') {
            const responseStr = JSON.stringify(response, null, 2);
            console.log('尝试解析JSON字符串:', responseStr);
            // 如果包含题目相关的关键字，尝试解析
            if (responseStr.includes('题目') || responseStr.includes('答案') || responseStr.includes('解析')) {
              content = responseStr;
            } else {
              return [];
            }
          } else {
            return [];
          }
        }

        const questions = [];

        console.log('准备解析的内容:', content);

        // 尝试多种解析方式

        // 方式1: 按行分割内容解析
        const lines = content.split(/[\n\r]+/).filter(line => line.trim());

        let currentQuestion = null;
        let questionIndex = 0;

        for (const line of lines) {
          const trimmedLine = line.trim();
          console.log('处理行:', trimmedLine);

          // 检测题目开始 - 支持多种格式
          if (trimmedLine.match(/题目\d+[:：]/) || trimmedLine.startsWith('题目[') || trimmedLine.match(/^\d+[.、]/)) {
            // 如果有之前的题目，先保存
            if (currentQuestion) {
              questions.push(currentQuestion);
            }

            // 开始新题目
            questionIndex++;
            let title = trimmedLine;

            // 提取题目标题
            if (trimmedLine.includes(':') || trimmedLine.includes('：')) {
              const parts = trimmedLine.split(/[:：]/);
              title = parts.length > 1 ? parts.slice(1).join(':').trim() : parts[0].trim();
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
            };

            // 如果标题行就包含了题目内容，直接设置
            if (title && title.length > 10) {
              currentQuestion.content = title;
            }
          }
          // 检测题目内容
          else if ((trimmedLine.startsWith('题目内容:') || trimmedLine.startsWith('题目内容：')) && currentQuestion) {
            currentQuestion.content = trimmedLine.replace(/题目内容[:：]/, '').trim();
          }
          // 检测选择题选项 - 支持中英文和更多格式
          else if (trimmedLine.match(/^[A-D][.、]\s*/) && currentQuestion) {
            const optionText = trimmedLine.replace(/^[A-D][.、]\s*/, '').trim();
            if (optionText) {
              currentQuestion.options.push(optionText);
              currentQuestion.type = 'SINGLE_CHOICE'; // 先设为单选，后面会根据答案调整
            }
          }
          // 检测其他可能的选项格式
          else if (trimmedLine.match(/^[（(][A-D][）)]\s*/) && currentQuestion) {
            const optionText = trimmedLine.replace(/^[（(][A-D][）)]\s*/, '').trim();
            if (optionText) {
              currentQuestion.options.push(optionText);
              currentQuestion.type = 'SINGLE_CHOICE';
            }
          }
          // 检测答案 - 支持中英文
          else if ((trimmedLine.startsWith('答案:') || trimmedLine.startsWith('答案：')) && currentQuestion) {
            currentQuestion.expectedAnswer = trimmedLine.replace(/答案[:：]/, '').trim();
          }
          // 检测解析 - 支持中英文
          else if ((trimmedLine.startsWith('解析:') || trimmedLine.startsWith('解析：')) && currentQuestion) {
            currentQuestion.analysis = trimmedLine.replace(/解析[:：]/, '').trim();
          }
          // 如果当前有题目但没有内容，且这行不是选项或答案，可能是题目内容
          else if (currentQuestion && !currentQuestion.content && trimmedLine.length > 5 &&
                   !trimmedLine.match(/^[A-D][.、]/) &&
                   !trimmedLine.startsWith('答案') &&
                   !trimmedLine.startsWith('解析')) {
            currentQuestion.content = trimmedLine;
          }
          // 检查是否包含连续的选项（如 "A. 选项1 B. 选项2 C. 选项3 D. 选项4"）
          else if (currentQuestion && trimmedLine.match(/[A-D][.、].*[A-D][.、]/)) {
            console.log('发现连续选项行:', trimmedLine);
            // 解析连续选项
            const optionMatches = trimmedLine.match(/([A-D][.、]\s*[^A-D]*?)(?=[A-D][.、]|$)/g);
            if (optionMatches) {
              optionMatches.forEach(match => {
                const optionText = match.replace(/^[A-D][.、]\s*/, '').trim();
                if (optionText && !currentQuestion.options.includes(optionText)) {
                  currentQuestion.options.push(optionText);
                }
              });
              currentQuestion.type = 'SINGLE_CHOICE';
              console.log('解析到连续选项:', currentQuestion.options);
            }
          }
        }

        // 保存最后一个题目
        if (currentQuestion) {
          // 在保存前进行题目类型和格式的最终检查
          this.finalizeQuestion(currentQuestion);
          questions.push(currentQuestion);
        }

        // 对所有题目进行最终处理
        questions.forEach(question => {
          this.finalizeQuestion(question);
        });

        console.log('第一种方法解析得到的题目:', questions);

        // 如果第一种方法没有解析到题目，尝试第二种方法
        if (questions.length === 0) {
          console.log('第一种方法失败，尝试第二种解析方法');
          return this.parseAIResponseAlternative(content);
        }

        return questions;

      } catch (error) {
        console.error('解析AI响应失败:', error);
        return [];
      }
    },

    // 题目最终处理方法
    finalizeQuestion(question) {
      if (!question) return;

      console.log('最终处理题目:', question);

      // 1. 确定题目类型
      if (question.options && question.options.length > 0) {
        // 有选项的是选择题
        if (question.options.length >= 4) {
          // 检查答案是否包含多个选项（如"AB"、"A,B"等）
          const answer = question.expectedAnswer.toUpperCase();
          if (answer.length > 1 || answer.includes(',') || answer.includes('、')) {
            question.type = 'MULTI_CHOICE';
          } else {
            question.type = 'SINGLE_CHOICE';
          }
        } else {
          question.type = 'SINGLE_CHOICE';
        }
      } else {
        // 没有选项的是主观题
        if (question.content && question.content.length > 100) {
          question.type = 'ESSAY';
        } else {
          question.type = 'SHORT_ANSWER';
        }
      }

      // 2. 处理答案格式和选项提取
      if (question.expectedAnswer) {
        const answerUpper = question.expectedAnswer.toUpperCase().trim();

        // 如果答案看起来像选项标识符，但没有选项，尝试提取选项
        if (answerUpper.match(/^[A-D]+$/) && (!question.options || question.options.length === 0)) {
          console.warn('发现答案是选项标识符但没有选项，尝试提取选项');
          this.extractOptionsFromContent(question);
        }

        // 格式化答案显示
        if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTI_CHOICE') {
          question.expectedAnswer = answerUpper;
        }
      }

      // 3. 如果仍然没有选项但内容中可能包含选项，再次尝试提取
      if ((!question.options || question.options.length === 0) && question.content) {
        // 检查内容是否包含选项格式
        if (question.content.match(/[A-D][.、]/)) {
          console.log('内容中发现选项格式，尝试提取');
          this.extractOptionsFromContent(question);
        }
      }

      // 4. 确保题目内容不为空
      if (!question.content && question.title) {
        question.content = question.title;
      }

      // 5. 处理选项格式
      if (question.options && question.options.length > 0) {
        question.options = question.options.map(option => {
          // 移除选项前的标识符（如果有的话）
          return option.replace(/^[A-D][.、]\s*/, '').trim();
        });
      }

      console.log('处理后的题目:', question);
    },

    // 从题目内容中提取选项
    extractOptionsFromContent(question) {
      if (!question.content) return;

      const content = question.content;
      console.log('尝试从内容中提取选项:', content);

      // 方法1: 按行分割查找选项
      const lines = content.split(/[\n\r]+/);
      let options = [];

      for (const line of lines) {
        const trimmed = line.trim();
        // 查找选项格式的行
        if (trimmed.match(/^[A-D][.、]\s*/)) {
          const optionText = trimmed.replace(/^[A-D][.、]\s*/, '').trim();
          if (optionText) {
            options.push(optionText);
          }
        }
      }

      // 方法2: 如果按行分割没找到，尝试在单行中查找连续选项
      if (options.length === 0) {
        // 匹配类似 "A. 选项1 B. 选项2 C. 选项3 D. 选项4" 的格式
        const optionPattern = /([A-D][.、]\s*[^A-D]*?)(?=[A-D][.、]|$)/g;
        let match;

        while ((match = optionPattern.exec(content)) !== null) {
          const optionText = match[1].replace(/^[A-D][.、]\s*/, '').trim();
          if (optionText) {
            options.push(optionText);
          }
        }
      }

      // 方法3: 如果还是没找到，尝试更宽松的匹配
      if (options.length === 0) {
        // 查找包含选项标识符的文本
        const matches = content.match(/[A-D][.、]\s*[^A-D\n\r]+/g);
        if (matches) {
          options = matches.map(match =>
            match.replace(/^[A-D][.、]\s*/, '').trim()
          ).filter(option => option.length > 0);
        }
      }

      if (options.length > 0) {
        question.options = options;

        // 从内容中移除选项部分，只保留题目描述
        let cleanContent = content;

        // 移除所有选项相关的文本
        options.forEach((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const patterns = [
            new RegExp(`${letter}[.、]\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
            new RegExp(`${letter}[.、]\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
          ];

          patterns.forEach(pattern => {
            cleanContent = cleanContent.replace(pattern, '');
          });
        });

        // 清理多余的空白字符
        cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

        // 如果清理后内容太短，保留原内容
        if (cleanContent.length < 10) {
          cleanContent = content;
        }

        question.content = cleanContent;

        console.log('从内容中提取到选项:', options);
        console.log('清理后的题目内容:', cleanContent);
      } else {
        console.log('未能从内容中提取到选项');
      }
    },

    // 备用AI响应解析方法
    parseAIResponseAlternative(content) {
      try {
        console.log('使用备用解析方法:', content);

        // 如果内容看起来像JSON，尝试直接从对象中提取信息
        if (content.includes('{') && content.includes('}')) {
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const jsonStr = jsonMatch[0];
              const parsed = JSON.parse(jsonStr);
              console.log('解析的JSON对象:', parsed);

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
                }];
              }
            }
          } catch (e) {
            console.log('JSON解析失败，继续其他方法');
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
          };

          // 尝试从内容中提取选项和答案
          this.extractOptionsFromContent(question);

          // 最终处理
          this.finalizeQuestion(question);

          return [question];
        }

        return [];

      } catch (error) {
        console.error('备用解析方法失败:', error);
        return [];
      }
    },

    // 生成模拟响应数据（用于演示）
    generateMockResponse(type) {
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
      ];

      // 构造符合解析格式的响应
      let content = "";
      sampleQuestions.forEach((q, index) => {
        const title = type === 'course' ? `${this.courseName}课程题目${index + 1}` : q.title;
        content += `题目[题目${index + 1}]: ${title}\n`;
        content += `题目内容: ${q.content}\n`;
        q.options.forEach((option, optIndex) => {
          content += `${String.fromCharCode(65 + optIndex)}. ${option}\n`;
        });
        content += `答案: ${q.answer}\n`;
        content += `解析: ${q.analysis}\n\n`;
      });

      return { content };
    },

    // 获取题目类型标签颜色
    getQuestionTypeTag(type) {
      switch (type) {
        case 'SINGLE_CHOICE':
          return 'primary';
        case 'MULTI_CHOICE':
          return 'success';
        case 'SHORT_ANSWER':
          return 'warning';
        case 'ESSAY':
          return 'info';
        default:
          return 'default';
      }
    },

    // 获取题目类型文本
    getQuestionTypeText(type) {
      switch (type) {
        case 'SINGLE_CHOICE':
          return '单选题';
        case 'MULTI_CHOICE':
          return '多选题';
        case 'SHORT_ANSWER':
          return '简答题';
        case 'ESSAY':
          return '论述题';
        default:
          return '未知类型';
      }
    },

    // 判断选项是否为正确答案
    isCorrectOption(question, optionIndex) {
      if (!question.expectedAnswer) return false;

      const answer = question.expectedAnswer.toUpperCase().trim();
      const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D

      // 单选题：答案应该是单个字母
      if (question.type === 'SINGLE_CHOICE') {
        return answer === optionLetter;
      }

      // 多选题：答案可能包含多个字母
      if (question.type === 'MULTI_CHOICE') {
        // 支持多种格式：AB, A,B, A、B, A B等
        const answerLetters = answer.replace(/[,、\s]+/g, '').split('');
        return answerLetters.includes(optionLetter);
      }

      return false;
    },

    // ===== AI助手相关方法 =====

    // 发送问题
    async sendQuestion() {
      if (!this.currentQuestion.trim() || this.aiLoading) {
        return;
      }

      const question = this.currentQuestion.trim();
      this.currentQuestion = '';

      // 添加用户消息
      this.addAIMessage('user', question);

      // 显示加载状态
      this.aiLoading = true;

      try {
        // 获取用户信息
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.studentId) {
          throw new Error('无法获取学生信息，请重新登录');
        }

        // 准备请求数据
        const askData = {
          question: question,
          courseId: this.courseId
        };

        // 调用AI问答接口
        const response = await studentAssistantAPI.askQuestion(userInfo.studentId, askData);

        // 添加AI回复
        if (response && response.answer) {
          this.addAIMessage('ai', response.answer);
        } else {
          this.addAIMessage('ai', '抱歉，我暂时无法回答这个问题，请稍后再试。');
        }

      } catch (error) {
        console.error('AI问答失败:', error);

        // 根据错误类型提供不同的提示
        let errorMessage = '抱歉，服务暂时不可用，请稍后再试。';
        let toastMessage = 'AI助手暂时不可用，请稍后再试';

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorMessage = '抱歉，AI正在深度思考中，响应时间较长。请稍后再试，或者尝试提出更简洁的问题。';
          toastMessage = 'AI响应超时，请稍后再试或简化问题';
        } else if (error.response?.status === 500) {
          errorMessage = '抱歉，AI服务暂时繁忙，请稍后再试。';
          toastMessage = 'AI服务繁忙，请稍后再试';
        }

        this.addAIMessage('ai', errorMessage);
        this.$message.error(toastMessage);
      } finally {
        this.aiLoading = false;
      }
    },

    // 添加AI消息
    addAIMessage(type, content) {
      this.aiMessages.push({
        type,
        content,
        timestamp: new Date()
      });

      // 滚动到底部
      this.$nextTick(() => {
        this.scrollChatToBottom();
      });
    },

    // 滚动聊天区域到底部
    scrollChatToBottom() {
      const chatMessages = this.$refs.chatMessages;
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    },

    // 快捷问题
    askQuickQuestion(question) {
      // 检查是否有对应的模拟数据
      if (this.mockDataConfig[question]) {
        // 使用模拟数据，以流式方式显示
        this.showMockStreamingResponse(question);
        return;
      }
      
      // 如果没有模拟数据，使用正常的聊天功能
      this.currentQuestion = question;
      this.sendQuestion();
    },

    // 复制消息
    copyMessage(content) {
      // 创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        this.$message.success('已复制到剪贴板');
      } catch (err) {
        this.$message.error('复制失败');
      }

      document.body.removeChild(textArea);
    },

    // 重新生成回复
    async regenerateResponse(messageIndex) {
      if (messageIndex <= 0 || messageIndex >= this.aiMessages.length) {
        return;
      }

      // 找到对应的用户问题
      const userMessage = this.aiMessages[messageIndex - 1];
      if (!userMessage || userMessage.type !== 'user') {
        this.$message.error('无法找到对应的问题');
        return;
      }

      const userQuestion = userMessage.content;

      // 移除当前AI回答
      this.aiMessages.splice(messageIndex, 1);

      // 重新发送请求
      this.aiLoading = true;
      try {
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.studentId) {
          throw new Error('无法获取学生信息，请重新登录');
        }

        const askData = {
          question: userQuestion,
          courseId: this.courseId
        };

        const response = await studentAssistantAPI.askQuestion(userInfo.studentId, askData);

        if (response && response.answer) {
          this.addAIMessage('ai', response.answer);
        } else {
          this.addAIMessage('ai', '抱歉，我暂时无法回答这个问题，请稍后再试。');
        }
      } catch (error) {
        console.error('重新生成失败:', error);
        this.addAIMessage('ai', '抱歉，重新生成失败，请稍后再试。');
        this.$message.error('重新生成失败');
      } finally {
        this.aiLoading = false;
      }
    },

    // 格式化消息内容（支持Markdown）
    formatMessage(content) {
      if (!content) return ''
      // 配置marked选项以更好地渲染Markdown
      marked.setOptions({
        breaks: true, // 允许换行符转换为<br>
        gfm: true,    // 启用GitHub风格的Markdown
        sanitize: false // 允许HTML标签
      })
      // 使用marked库渲染Markdown为HTML
      return marked.parse(content)
    },
    
    // 显示模拟数据的流式响应
    showMockStreamingResponse(question) {
      // 添加用户消息
      this.addAIMessage('user', question);
      
      // 先添加一个空的AI消息，用于流式更新
      this.addAIMessage('ai', '');
      
      // 开始流式显示
      this.aiLoading = true;
      
      // 获取对应的模拟数据并合并为完整的Markdown字符串
      const mockData = this.mockDataConfig[question];
      const fullMarkdown = mockData.join('\n\n'); // 用双换行符连接，确保Markdown段落正确渲染
      
      let charIndex = 0;
      let streamingContent = '';
      
      const streamInterval = setInterval(() => {
        if (charIndex < fullMarkdown.length) {
          streamingContent += fullMarkdown[charIndex];
            charIndex++;
            
            // 更新最后一条AI消息的内容
            if (this.aiMessages.length > 0) {
              const lastMessage = this.aiMessages[this.aiMessages.length - 1];
              if (lastMessage.type === 'ai') {
                lastMessage.content = streamingContent;
              }
            }
            
            // 滚动到底部
            this.$nextTick(() => {
              this.scrollChatToBottom();
            });
        } else {
          // 所有内容显示完成
          clearInterval(streamInterval);
          this.aiLoading = false;
          
          // 确保最后一条消息内容完整
          if (this.aiMessages.length > 0) {
            const lastMessage = this.aiMessages[this.aiMessages.length - 1];
            if (lastMessage.type === 'ai') {
              lastMessage.content = streamingContent;
            }
          }
          
          // 滚动到底部
          this.$nextTick(() => {
            this.scrollChatToBottom();
          });
        }
      }, 30); // 每30ms显示一个字符，模拟真实的打字效果
    }
  }
}
</script>

<style scoped>
.course-detail-container {
  display: flex;
  height: 100vh;
  background-color: #f6f8fa;
}

/* 左侧导航栏样式 */
.sidebar {
  width: 130px;
  background-color: #fff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  padding-top: 20px;
}

.course-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.course-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  margin-bottom: 10px;
  background-color: #3370ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
}

.course-name {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  line-height: 1.4;
}

.course-code {
  font-size: 14px;
  color: #666;
  font-weight: normal;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-item i {
  font-size: 20px;
  margin-bottom: 5px;
}

.nav-item:hover {
  color: #409EFF;
  background-color: #f0f7ff;
}

.nav-item.active {
  color: #409EFF;
  background-color: #f0f7ff;
}

/* 右侧内容区样式 */
.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.filter-label {
  margin-right: 10px;
  color: #606266;
}

.section-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  min-height: 500px;
}

/* 知识库头部：标题、学科、刷新 按一行排布 */
.repo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
}

.repo-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.repo-title {
  margin: 0;
}

.repo-subject {
  color: #606266;
  font-size: 14px;
}

.empty-placeholder {
  text-align: center;
  color: #909399;
  padding: 100px 0;
  font-size: 14px;
}

/* 考勤日历样式 */
.calendar-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 0;
}

.attendance-status {
  text-align: center;
  margin-top: 4px;
}

.attendance-present {
  color: #67C23A;
  font-weight: bold;
}

.attendance-late {
  color: #E6A23C;
  font-weight: bold;
}

.attendance-leave {
  color: #909399;
  font-weight: bold;
}

.attendance-absent {
  color: #F56C6C;
  font-weight: bold;
}

.attendance-summary {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin-bottom: 20px;
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.attendance-filter {
  display: flex;
  gap: 10px;
}

.attendance-stats {
  display: flex;
  justify-content: space-around;
  background-color: #f9fafc;
  border-radius: 8px;
  padding: 20px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.attendance-stats:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-item {
  text-align: center;
  padding: 10px 20px;
  position: relative;
  transition: all 0.3s;
}

.stat-item:hover {
  transform: translateY(-3px);
}

.stat-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background-color: #e0e0e0;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.stat-item:hover .stat-value {
  transform: scale(1.1);
}

.stat-label {
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 为不同状态设置不同颜色 */
.stat-item:nth-child(1) .stat-value {
  color: #67C23A; /* 已到 - 绿色 */
}

.stat-item:nth-child(2) .stat-value {
  color: #E6A23C; /* 迟到 - 黄色 */
}

.stat-item:nth-child(3) .stat-value {
  color: #F56C6C; /* 缺勤 - 红色 */
}

.stat-item:nth-child(4) .stat-value {
  color: #909399; /* 请假 - 灰色 */
}

/* 添加具体的状态类样式 */
.stat-present {
  color: #67C23A !important;
}

.stat-late {
  color: #E6A23C !important;
}

.stat-absent {
  color: #F56C6C !important;
}

.stat-leave {
  color: #909399 !important;
}

.stat-label {
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-label i {
  margin-right: 5px;
}



/* 知识点样式 */
.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 15px;
  padding: 5px;
}

.knowledge-card {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  height: 180px;
  display: flex;
  flex-direction: column;
}

.knowledge-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.knowledge-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.knowledge-card-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  margin-right: 8px;
  background-color: #3370ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.knowledge-card-status {
  margin-left: auto;
}

.knowledge-card-content {
  margin-bottom: 8px;
  flex-grow: 1;
  overflow: hidden;
}

.knowledge-card-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.knowledge-card-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  height: 54px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.knowledge-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
  flex-wrap: wrap;
}

.knowledge-card-footer .el-button {
  padding: 6px 12px;
  font-size: 12px;
  flex: 0 0 auto;
}

.knowledge-card-completed {
  background-color: #f0f7ff;
}

/* 考勤样式 */
.attendance-content {
  padding: 20px 0;
}

.attendance-list {
  margin-top: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.attendance-detail {
  padding: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 6px;
  background-color: #f0f7ff;
  border: 1px solid #d9ecff;
}

.attendance-present-header {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
}

.attendance-present-header .detail-status-icon {
  color: #67C23A;
}

.attendance-late-header {
  background-color: #fffbe6;
  border-color: #ffe58f;
}

.attendance-late-header .detail-status-icon {
  color: #E6A23C;
}

.attendance-absent-header {
  background-color: #fef0f0;
  border-color: #fde2e2;
}

.attendance-absent-header .detail-status-icon {
  color: #F56C6C;
}

.attendance-leave-header {
  background-color: #f9f0f0;
  border-color: #fde2e2;
}

.attendance-leave-header .detail-status-icon {
  color: #909399;
}

.detail-status-icon {
  font-size: 28px;
  margin-right: 15px;
}

.detail-status-text {
  font-size: 18px;
  font-weight: bold;
}

.detail-content {
  padding: 10px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.detail-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.detail-label {
  width: 80px;
  color: #606266;
  font-weight: 500;
}

.detail-value {
  flex: 1;
  color: #303133;
}

.detail-actions {
  text-align: center;
  margin-top: 20px;
}

/* 文档区样式 */
.document-content {
  padding: 20px 0;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.document-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.document-list {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.document-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.document-item:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.document-item:last-child {
  border-bottom: none;
}

.document-icon {
  font-size: 24px;
  color: #409EFF;
  margin-right: 16px;
}

.document-info {
  flex: 1;
  overflow: hidden;
}

.document-name {
  font-size: 15px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-actions {
  margin-left: 16px;
}

/* 考勤记录表格行样式 */
.attendance-present-row {
  background-color: #f0f9eb; /* 已到行背景 */
}

.attendance-late-row {
  background-color: #fffbe6; /* 迟到行背景 */
}

.attendance-absent-row {
  background-color: #fef0f0; /* 缺勤行背景 */
}

.attendance-leave-row {
  background-color: #f9f0f0; /* 请假行背景 */
}

/* AI助手区样式 */
.ai-assistant-content {
  height: calc(100vh - 120px);
  overflow: hidden;
}

.ai-assistant-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.ai-assistant-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.ai-assistant-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.ai-assistant-title i {
  font-size: 24px;
  margin-right: 12px;
}

.ai-assistant-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.ai-assistant-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.ai-chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.welcome-message {
  margin-bottom: 20px;
}

.message-item {
  margin-bottom: 20px;
}

.user-message {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  margin-bottom: 15px;
}

.user-message-content {
  max-width: 70%;
  background: #409eff;
  color: white;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.user-message-text {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  flex-shrink: 0;
}

.ai-message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.ai-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.ai-message-content {
  max-width: 70%;
  background: white;
  padding: 12px 16px;
  border-radius: 4px 18px 18px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.ai-message-text {
  font-size: 13px;
  line-height: 1.4;
  color: #303133;
  word-wrap: break-word;
  white-space: pre-wrap;
}

/* Markdown样式 */
.ai-message-text h1,
.ai-message-text h2,
.ai-message-text h3,
.ai-message-text h4,
.ai-message-text h5,
.ai-message-text h6 {
  margin: 10px 0 6px 0;
  font-weight: 600;
  line-height: 1.3;
  color: #2c3e50;
}

.ai-message-text h1 {
  font-size: 18px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 4px;
}

.ai-message-text h2 {
  font-size: 16px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 3px;
}

.ai-message-text h3 {
  font-size: 15px;
}

.ai-message-text h4 {
  font-size: 14px;
}

.ai-message-text h5 {
  font-size: 13px;
}

.ai-message-text h6 {
  font-size: 12px;
}

.ai-message-text p {
  margin: 4px 0;
  line-height: 1.4;
}

.ai-message-text ul,
.ai-message-text ol {
  margin: 4px 0;
  padding-left: 18px;
}

.ai-message-text li {
  margin: 2px 0;
  line-height: 1.4;
}

.ai-message-text blockquote {
  margin: 6px 0;
  padding: 6px 12px;
  border-left: 3px solid #667eea;
  background-color: #f8f9fa;
  color: #6c757d;
  font-style: italic;
}

.ai-message-text code {
  background-color: #f1f3f4;
  color: #d73a49;
  padding: 1px 4px;
  border-radius: 2px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.ai-message-text pre {
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  padding: 10px;
  overflow-x: auto;
  margin: 6px 0;
}

.ai-message-text pre code {
  background-color: transparent;
  color: #24292e;
  padding: 0;
  border-radius: 0;
  font-size: 12px;
  line-height: 1.3;
}

.ai-message-text table {
  border-collapse: collapse;
  width: 100%;
  margin: 6px 0;
  font-size: 12px;
}

.ai-message-text th,
.ai-message-text td {
  border: 1px solid #dfe2e5;
  padding: 4px 8px;
  text-align: left;
}

.ai-message-text th {
  background-color: #f6f8fa;
  font-weight: 600;
  color: #24292e;
}

.ai-message-text tr:nth-child(even) {
  background-color: #f8f9fa;
}

.ai-message-text strong {
  font-weight: 600;
  color: #24292e;
}

.ai-message-text em {
  font-style: italic;
  color: #6a737d;
}

.ai-message-text a {
  color: #0366d6;
  text-decoration: none;
}

.ai-message-text a:hover {
  text-decoration: underline;
}

.ai-message-text hr {
  border: none;
  border-top: 1px solid #e1e4e8;
  margin: 8px 0;
}

.ai-message-text img {
  max-width: 100%;
  height: auto;
  border-radius: 3px;
  margin: 4px 0;
}

.ai-message-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.ai-message-actions .el-button {
  padding: 4px 8px;
  font-size: 12px;
  height: auto;
}

.ai-loading {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.ai-loading .ai-avatar {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.quick-questions {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  background: white;
}

.quick-questions-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.quick-questions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-questions-list .el-button {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 16px;
}

.ai-input-container {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  background: white;
}

.ai-input-wrapper {
  position: relative;
}

.ai-input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.input-tip {
  font-size: 12px;
  color: #909399;
}

.ai-input-actions .el-button {
  padding: 8px 20px;
}

/* 作业部分样式 */
.assignment-content {
  padding: 20px 0;
}

.assignment-tabs {
  width: 100%;
}

.assignment-list {
  margin-top: 20px;
}

.assignment-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.assignment-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.assignment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.assignment-card.completed {
  border-color: #67c23a;
  background: #f0f9ff;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.assignment-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
  margin-right: 10px;
  line-height: 1.4;
}

.assignment-info {
  margin-bottom: 15px;
}

.assignment-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.assignment-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #909399;
}

.meta-item i {
  margin-right: 5px;
  font-size: 14px;
}

.attempts-meta {
  color: #e6a23c !important;
  font-weight: 600;
}

.assignment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* AI生成练习样式 */
.ai-exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  color: white;
}

.ai-exercise-intro h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.ai-exercise-intro p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.ai-generated-card {
  border-left: 4px solid #667eea;
  background: linear-gradient(135deg, #f5f7ff 0%, #f0f4ff 100%);
}

.ai-generated-card .assignment-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-icon {
  color: #667eea;
  font-size: 16px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* AI生成练习对话框样式 */
.ai-exercise-container {
  display: flex;
  gap: 20px;
  max-height: 600px;
}

.generate-form-section {
  flex: 0 0 400px;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}

.generated-content-section {
  flex: 1;
  overflow-y: auto;
  padding-left: 20px;
}

.section-header {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.questions-container {
  max-height: 500px;
  overflow-y: auto;
}

.question-item {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-number {
  font-weight: bold;
  color: #409eff;
  font-size: 14px;
}

.question-content {
  margin-bottom: 12px;
}

.question-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  font-size: 15px;
}

.question-body {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.question-options {
  margin: 12px 0;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 6px 0;
}

.option-label {
  font-weight: bold;
  color: #409eff;
  margin-right: 8px;
  min-width: 20px;
}

.option-text {
  color: #606266;
  line-height: 1.5;
}

.question-meta {
  border-top: 1px solid #e4e7ed;
  padding-top: 12px;
  margin-top: 12px;
}

.answer-section,
.analysis-section {
  margin-bottom: 8px;
}

.answer-section strong,
.analysis-section strong {
  color: #67c23a;
  margin-right: 8px;
}

.answer-text {
  color: #67c23a;
  font-weight: 500;
}

.analysis-text {
  color: #606266;
  line-height: 1.5;
}

/* AI自主练习样式 */
.ai-exercise-section {
  padding: 20px;
}

.ai-exercise-buttons {
  display: flex;
  gap: 15px;
}

.ai-exercise-buttons .el-button {
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 6px;
}

.generated-exercises {
  margin-top: 30px;
}

.exercises-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e4e7ed;
}

.exercises-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.exercises-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.question-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.question-type-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-count {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.question-number {
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
}

.question-content {
  margin-bottom: 15px;
}

.question-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.question-body {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}

.question-options {
  margin: 15px 0;
}

.options-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  font-size: 14px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
  position: relative;
}

.option-item:hover {
  background: #e9ecef;
  border-color: #c0c4cc;
}

.option-item.correct-option {
  background: #f0f9ff;
  border-color: #67c23a;
  box-shadow: 0 0 0 1px rgba(103, 194, 58, 0.2);
}

.option-item.multi-choice-option {
  border-left: 3px solid #e6a23c;
}

.option-item.multi-choice-option.correct-option {
  border-left: 3px solid #67c23a;
}

.option-label {
  font-weight: 600;
  color: #409eff;
  margin-right: 10px;
  min-width: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
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

.option-text {
  color: #606266;
  line-height: 1.5;
  flex: 1;
}

.correct-option .option-text {
  color: #303133;
  font-weight: 500;
}

.correct-indicator {
  color: #67c23a;
  font-weight: bold;
  margin-left: 8px;
  display: flex;
  align-items: center;
}

.question-meta {
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
  margin-top: 15px;
}

.answer-section {
  margin-bottom: 10px;
}

.answer-section strong {
  color: #67c23a;
}

.answer-text {
  color: #67c23a;
  font-weight: 600;
  margin-left: 5px;
}

.analysis-section strong {
  color: #909399;
}

.empty-exercises {
  text-align: center;
  padding: 60px 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer .el-button {
  margin-left: 10px;
}

/* 知识库-行内题目展示面板 */
.ku-problems-panel {
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.ku-problems-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
</style>