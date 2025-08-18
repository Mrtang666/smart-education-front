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
            <div>
              <h3 style="margin: 0;">知识库</h3>
              <div class="repo-subject" v-if="repositorySubject">学科：{{ repositorySubject }}</div>
            </div>
            <el-button size="small" type="primary" @click="loadRepository" :loading="repositoryLoading">刷新</el-button>
          </div>
          <el-skeleton :loading="repositoryLoading" animated :rows="3">
            <template #default>
              <el-empty v-if="repositoryUnitsView.length === 0" :description="repositorySubject ? '该学科暂无启用的知识单元' : '未获取到学科'" />
              <el-table v-else :data="repositoryUnitsView" style="width: 100%">
                <el-table-column prop="id" label="ID" width="120" />
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
              <div v-if="aiMessages.length === 0" class="quick-questions">
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
                    {{ question }}
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
        '这门课程的主要内容是什么？',
        '如何提高学习效率？',
        '作业提交的注意事项有哪些？',
        '考试重点是什么？',
        '有什么好的学习方法推荐？'
      ],
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
      // 使用marked库渲染Markdown为HTML
      return marked.parse(content)
    },
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
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  word-wrap: break-word;
  white-space: pre-wrap;
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