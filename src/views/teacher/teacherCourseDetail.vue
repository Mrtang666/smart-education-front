<!-- 课程文档的删除功能和下载功能有问题，待完善 -->
/* eslint-disable no-unused-vars */
<template>
  <div class="course-detail">
    <div class="course-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="course-title">{{ courseName }} 课程详情</h1>
      </div>
      <div class="course-actions">
        <el-button type="primary" plain @click="showEditCourseDialog">
          <el-icon><Edit /></el-icon>
          编辑课程
        </el-button>
        <el-tag v-if="courseSubjectName" type="info" effect="light" style="margin-left: 10px;">
          学科：{{ courseSubjectName }}
        </el-tag>
        <el-button
          v-if="courseSubjectId"
          type="danger"
          plain
          size="small"
          style="margin-left: 10px;"
          @click="unbindCourseSubject"
        >解除绑定</el-button>
      </div>
    </div>

    <div class="course-content">
      <div class="course-tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="课程内容" name="content">
            <!-- 课程内容组件 -->
            <CourseContent 
              :courseKnowledges="courseKnowledges"
              :courseDescription="courseDescription"
              :materials="materials"
              :documents="documents"
              @show-add-knowledge="showAddKnowledgeDialog"
              @view-knowledge="viewKnowledgeDetail"
              @edit-knowledge="editKnowledge"
              @remove-knowledge="removeKnowledge"
              @show-upload="showUploadDialog"
              @download-material="downloadMaterial"
              @remove-material="removeMaterial"
              @show-upload-doc="showUploadDocDialog"
              @download-doc="downloadDoc"
              @remove-doc="removeDoc"
            />
          </el-tab-pane>

          <el-tab-pane label="学生管理" name="students">
            <!-- 学生管理组件 -->
            <StudentManagement
              :courseStudents="courseStudents"
              :selectedStudents="selectedStudents"
              :isLoading="isLoadingStudents"
              :currentPage="currentPage"
              :pageSize="pageSize"
              :courseId="courseId"
              :courseName="courseName"
              @batch-remove-students="batchRemoveStudents"
              @show-add-student="showAddStudentDialog"
              @view-student="viewStudent"
              @remove-student="removeStudent"
              @selection-change="handleSelectionChange"
              @search-clear="handleSearchClear"
              @search-input="handleSearchInput"
            />
          </el-tab-pane>

          <el-tab-pane label="考试管理" name="exams">
            <!-- 考试管理组件 -->
            <ExamManagement 
              :exams="exams"
              :isLoading="isLoadingExams"
              :currentPage="examCurrentPage"
              :pageSize="examPageSize"
              :currentTime="currentTime"
              @show-add-exam="showAddExamDialog"
              @view-exam-scores="viewExamScores"
              @edit-exam="editExam"
              @remove-exam="removeExam"
              @search-clear="handleExamSearchClear"
              @search-input="handleExamSearchInput"
            />
          </el-tab-pane>

          <el-tab-pane label="作业管理" name="homework">
            <!-- 作业管理组件 -->
            <HomeworkManagement 
              :homeworks="homeworks"
              :isLoading="isLoadingHomeworks"
              :currentPage="homeworkCurrentPage"
              :pageSize="homeworkPageSize"
              :currentTime="currentTime"
              @show-add-homework="showAddHomeworkDialog"
              @view-homework-submissions="viewHomeworkSubmissions"
              @edit-homework="editHomework"
              @remove-homework="removeHomework"
              @search-clear="handleHomeworkSearchClear"
              @search-input="handleHomeworkSearchInput"
              @publish-homework="publishHomework"
            />
          </el-tab-pane>

          <el-tab-pane label="考勤管理" name="attendance">
            <!-- 考勤管理组件 -->
            <AttendanceManagement 
              :attendances="attendances"
              :selectedAttendances="selectedAttendances"
              :courseStudents="courseStudents"
              :courses="[{ id: courseId, name: courseName }]"
              @batch-remove-attendances="batchRemoveAttendances"
              @add-attendance="addAttendance"
              @update-attendance="updateAttendance"
              @view-attendance-detail="viewAttendanceDetail"
              @edit-attendance="editAttendance"
              @remove-attendance="removeAttendance"
              @selection-change="handleAttendanceSelectionChange"
              @search-clear="handleAttendanceSearchClear"
              @search-input="handleAttendanceSearchInput"
              @show-add-attendance-dialog="showAddAttendanceDialog"
            />
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
        <el-form-item label="所属学科">
          <el-select v-model="editCourseForm.subjectId" placeholder="请选择所属学科" filterable :loading="subjectsLoading" style="width: 100%" @visible-change="onEditDialogSubjectDropdown">
            <el-option v-for="s in subjectOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
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
    <el-dialog v-model="addKnowledgeDialogVisible" title="知识点管理" width="600px">
      <el-tabs v-model="knowledgeDialogTab">
        <el-tab-pane label="添加已有知识点" name="add">
          <el-form label-width="100px">
            <el-form-item label="搜索知识点">
              <el-input 
                v-model="knowledgeSearchKeyword" 
                placeholder="输入关键词搜索知识点" 
                clearable
                @input="handleKnowledgeSearchInput"
                @clear="handleKnowledgeSearchClear"
              >
                <template #append>
                  <el-button @click="searchExistingKnowledge">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            
            <div class="knowledge-search-results" v-if="searchedKnowledges.length > 0">
              <el-table 
                :data="currentPageKnowledges" 
                style="width: 100%" 
                @row-click="selectKnowledge" 
                :row-class-name="getRowClassName"
                @selection-change="handleKnowledgeSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="name" label="名称" width="180" />
                <el-table-column prop="difficultyLevel" label="难度" width="100">
                  <template #default="scope">
                    <el-tag :type="getDifficultyTagType(scope.row.difficultyLevel)">{{ scope.row.difficultyLevel }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" />
              </el-table>
              
              <!-- 添加分页控件 -->
              <div class="pagination-container" v-if="searchedKnowledges.length > knowledgePageSize">
                <el-pagination
                  v-model:current-page="knowledgeCurrentPage"
                  v-model:page-size="knowledgePageSize"
                  :page-sizes="[5, 10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="knowledgeTotalCount"
                  @size-change="handleKnowledgePageSizeChange"
                  @current-change="handleKnowledgePageChange"
                />
              </div>
            </div>
            <div v-else-if="!knowledgeSearchKeyword && !isSearching && !hasLoadedKnowledges" class="empty-search-results">
              正在加载知识点...
            </div>
            <div v-else-if="isSearching" class="searching-indicator">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="hasLoadedKnowledges && searchedKnowledges.length === 0" class="empty-search-results">
              没有找到匹配的知识点
            </div>
            
            <div v-if="selectedKnowledges.length > 0" class="selected-knowledge-list">
              <div class="selected-header">
                <h4>已选择的知识点 ({{ selectedKnowledges.length }})</h4>
                <el-button type="primary" size="small" @click="addSelectedKnowledgesToCourse" :disabled="selectedKnowledges.length === 0">
                  确认添加到课程
                </el-button>
              </div>
              <el-tag 
                v-for="knowledge in selectedKnowledges" 
                :key="knowledge.knowledgeId" 
                closable 
                @close="removeSelectedKnowledge(knowledge)"
                class="selected-knowledge-tag"
                :type="getDifficultyTagType(knowledge.difficultyLevel)"
              >
                {{ knowledge.name }}
              </el-tag>
            </div>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="addKnowledgeDialogVisible = false">取消</el-button>
            </div>
          </template>
        </el-tab-pane>
        
        <el-tab-pane label="创建新知识点" name="create">
          <el-form :model="newKnowledge" label-width="100px" :rules="knowledgeRules" ref="knowledgeFormRef">
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
            <el-form-item>
              <el-button type="primary" @click="saveKnowledge">创建知识点</el-button>
            </el-form-item>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="addKnowledgeDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="saveKnowledge">创建并添加</el-button>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
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

    <!-- 添加学生对话框 -->
    <el-dialog v-model="addStudentDialogVisible" title="添加学生" width="600px">
      <el-tabs v-model="studentDialogTab">
        <el-tab-pane label="搜索已有学生" name="search">
          <el-form label-width="100px">
            <el-form-item label="搜索学生">
              <el-input v-model="studentSearchInput" placeholder="输入学号、姓名或班级搜索" clearable>
                <template #append>
                  <el-button @click="searchStudents" :loading="isSearchingStudents">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            
            <div class="student-search-results" v-if="searchedStudents.length > 0">
              <el-alert
                v-if="!selectedStudentsToAdd.length"
                type="info"
                :closable="false"
                show-icon
              >
                点击下方学生行可选择学生，选中后将显示在下方的已选择列表中
              </el-alert>
              <el-table 
                :data="searchedStudents" 
                style="width: 100%" 
                @row-click="selectStudent" 
                :row-class-name="getStudentRowClassName"
                highlight-current-row
              >
                <el-table-column type="selection" width="55" :selectable="isStudentSelectable" />
                <el-table-column prop="studentId" label="学号" width="120" />
                <el-table-column prop="fullName" label="姓名" width="120" />
                <el-table-column prop="grade" label="年级" width="100" />
                <el-table-column prop="className" label="班级" />
              </el-table>
            </div>
            <div v-else-if="studentSearchInput && !isSearchingStudents && searchTriggered" class="empty-search-results">
              没有找到匹配的学生
            </div>
            
            <div v-if="selectedStudentsToAdd.length > 0" class="selected-students-list">
              <div class="selected-header">
                <h4>已选择的学生 ({{ selectedStudentsToAdd.length }})</h4>
                <el-button type="primary" size="small" @click="addSelectedStudentsToCourse" :disabled="selectedStudentsToAdd.length === 0">
                  确认添加到课程
                </el-button>
              </div>
              <el-tag 
                v-for="student in selectedStudentsToAdd" 
                :key="student.studentId" 
                closable 
                @close="removeSelectedStudent(student)"
                class="selected-student-tag"
              >
                {{ student.fullName }} ({{ student.studentId }})
              </el-tag>
            </div>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="addStudentDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="addSelectedStudentsToCourse" :disabled="selectedStudentsToAdd.length === 0">
                确认添加到课程 <span v-if="selectedStudentsToAdd.length > 0">({{ selectedStudentsToAdd.length }})</span>
              </el-button>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 学生详情对话框 -->
    <el-dialog v-model="studentDetailDialogVisible" title="学生详情" width="500px">
      <div v-if="currentStudent" class="student-detail">
        <div class="detail-item">
          <span class="label">学号:</span>
          <span class="value">{{ currentStudent.studentId }}</span>
        </div>
        <div class="detail-item">
          <span class="label">姓名:</span>
          <span class="value">{{ currentStudent.fullName }}</span>
        </div>
        <div class="detail-item">
          <span class="label">邮箱:</span>
          <span class="value">{{ currentStudent.email || '未设置' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">电话:</span>
          <span class="value">{{ currentStudent.phone || '未设置' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">年级:</span>
          <span class="value">{{ currentStudent.grade || '未设置' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">班级:</span>
          <span class="value">{{ currentStudent.className || '未设置' }}</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="studentDetailDialogVisible = false">关闭</el-button>
          <el-button type="danger" @click="removeCurrentStudent">从课程中移除</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加考试对话框 -->
    <el-dialog v-model="addExamDialogVisible" :title="examFormTitle" width="600px">
      <el-form :model="examForm" label-width="100px" :rules="examRules" ref="examFormRef">
        <el-form-item label="考试标题" prop="title">
          <el-input v-model="examForm.title" placeholder="请输入考试标题" />
        </el-form-item>
        <el-form-item label="所属课程">
          <el-input v-model="courseName" disabled />
        </el-form-item>
        <el-form-item label="考试描述">
          <el-input v-model="examForm.description" type="textarea" :rows="3" placeholder="请输入考试描述" />
        </el-form-item>
        <el-form-item label="总分" prop="totalScore">
          <el-input-number v-model="examForm.totalScore" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="考试时长" prop="durationMinutes">
          <el-input-number v-model="examForm.durationMinutes" :min="1" :max="1440" />
          <span class="form-hint">分钟</span>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="examForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="examForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <div class="form-tip">
          <el-alert
            title="考试状态将根据开始和结束时间自动判断"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addExamDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveExam" :loading="isSavingExam">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加作业对话框 -->
    <el-dialog v-model="addHomeworkDialogVisible" :title="homeworkFormTitle" width="600px">
      <el-form :model="homeworkForm" label-width="100px" :rules="homeworkRules" ref="homeworkFormRef">
        <el-form-item label="作业标题" prop="title">
          <el-input v-model="homeworkForm.title" placeholder="请输入作业标题" />
        </el-form-item>
        <el-form-item label="所属课程">
          <el-input v-model="courseName" disabled />
        </el-form-item>
        <el-form-item label="作业描述">
          <el-input v-model="homeworkForm.description" type="textarea" :rows="3" placeholder="请输入作业描述" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="homeworkForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="截止日期" prop="endTime">
          <el-date-picker
            v-model="homeworkForm.endTime"
            type="datetime"
            placeholder="选择截止日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="最大尝试次数" prop="maxAttempts">
          <el-input-number v-model="homeworkForm.maxAttempts" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="选项">
          <el-checkbox v-model="homeworkForm.isAnswerPublic">公开答案</el-checkbox>
          <el-checkbox v-model="homeworkForm.isScoreVisible">分数可见</el-checkbox>
          <el-checkbox v-model="homeworkForm.isRedoAllowed">允许重做</el-checkbox>
        </el-form-item>
        <el-form-item label="作业文件">
          <el-upload
            ref="homeworkUploadRef"
            :auto-upload="false"
            :on-change="handleHomeworkFileChange"
            :on-remove="handleHomeworkFileRemove"
            :before-upload="beforeHomeworkFileUpload"
            :file-list="homeworkFileList"
            :limit="1"
            accept=".pdf,.pptx,.docx,.txt"
          >
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addHomeworkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveHomework" :loading="isSavingHomework">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 作业提交情况对话框 -->
    <el-dialog v-model="homeworkSubmissionsDialogVisible" title="作业提交情况" width="600px">
      <div class="homework-submissions-container">
        <div class="homework-submissions-header">
          <div class="homework-submissions-search">
            <el-input
              v-model="homeworkSubmissionSearchKeyword"
              placeholder="搜索学生姓名或学号"
              prefix-icon="Search"
              clearable
              @clear="handleHomeworkSubmissionSearchClear"
              @input="handleHomeworkSubmissionSearchInput"
              style="width: 250px;"
            />
          </div>
          <el-button type="primary" @click="exportHomeworkScores">导出成绩</el-button>
        </div>
        <div class="homework-submissions-body">
          <div v-if="homeworkSubmissions.length === 0" class="empty-homework-submissions">
            暂无作业提交记录
          </div>
          <div v-else class="homework-submissions-list">
            <div v-for="submission in filteredHomeworkSubmissions" :key="submission.submissionId" class="homework-submission-item">
              <div class="submission-header">
                <div class="submission-info">
                  <span class="student-name">{{ submission.fullName }}</span>
                  <span class="submission-time">{{ formatDate(submission.submitTime) }}</span>
                </div>
                <div class="submission-actions">
                  <el-button link type="primary" @click="updateSubmissionScore(submission)">评分</el-button>
                  <el-button link type="primary" @click="viewSubmissionDetail(submission)">查看</el-button>
                </div>
              </div>
              <div class="submission-score">
                <span class="score-label">分数:</span>
                <span class="score-value">{{ submission.score !== undefined ? submission.score : '未评分' }}</span>
              </div>
              <div class="submission-status">
                <span class="status-label">状态:</span>
                <span class="status-value">{{ getSubmissionStatus(submission, currentHomework.value) }}</span>
              </div>
            </div>
          </div>
          <div class="pagination-container" v-if="homeworkSubmissions.length > homeworkSubmissionPageSize">
            <el-pagination
              v-model:current-page="homeworkSubmissionCurrentPage"
              v-model:page-size="homeworkSubmissionPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredHomeworkSubmissions.length"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="homeworkSubmissionsDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 考勤模态框 -->
    <el-dialog
      v-model="addAttendanceDialogVisible"
      :title="isEditingAttendance ? '编辑考勤' : '发布考勤'"
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form :model="attendanceForm" label-width="120px" ref="attendanceFormRef">
        <el-form-item label="课程">
          <el-select v-model="attendanceForm.courseId" placeholder="请选择课程" :disabled="isEditingAttendance">
            <el-option
              v-for="course in [{ id: courseId, name: courseName }]"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="考勤日期">
          <el-date-picker
            v-model="attendanceForm.attendanceDate"
            type="date"
            placeholder="选择考勤日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled="isEditingAttendance"
          />
        </el-form-item>
        
        <el-form-item label="考勤备注">
          <el-input
            v-model="attendanceForm.remark"
            type="textarea"
            placeholder="请输入考勤备注"
            :rows="2"
          />
        </el-form-item>
        
        <el-form-item label="迟到阈值(分钟)">
          <el-input-number v-model="attendanceForm.lateThreshold" :min="1" :max="60" />
        </el-form-item>
        
        <el-form-item label="缺勤阈值(分钟)">
          <el-input-number v-model="attendanceForm.absentThreshold" :min="1" :max="180" />
        </el-form-item>
        
        <el-form-item label="选择学生">
          <div class="student-selection-header">
            <el-checkbox
              v-model="allStudentsSelected"
              @change="handleSelectAllStudents"
              :indeterminate="isIndeterminate"
            >
              全选
            </el-checkbox>
            <span class="selected-count">已选择 {{ selectedStudentsCount }}/{{ availableStudents.length }} 名学生</span>
          </div>
          
          <div class="student-selection-list">
            <el-checkbox-group v-model="attendanceForm.selectedStudentIds">
              <el-checkbox
                v-for="student in availableStudents"
                :key="student.studentId"
                :value="student.studentId"
                border
              >
                {{ student.fullName || student.username }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addAttendanceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAttendance" :loading="isSubmittingAttendance">
            {{ isEditingAttendance ? '保存修改' : '发布考勤' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 考勤详情对话框 -->
    <el-dialog v-model="attendanceDetailDialogVisible" :title="`${currentAttendance ? formatDate(currentAttendance.attendanceDate) : ''} 考勤详情`" width="800px">
      <div v-if="currentAttendance" class="attendance-detail">
        <div class="detail-header">
          <div class="detail-item">
            <span class="label">考勤日期:</span>
            <span class="value">{{ formatDate(currentAttendance.attendanceDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">考勤状态:</span>
            <span class="value">
              <el-tag :type="getAttendanceStatusType(currentAttendance.status)">{{ currentAttendance.status }}</el-tag>
            </span>
          </div>
          <div class="detail-item">
            <span class="label">备注:</span>
            <span class="value">{{ currentAttendance.remark || '无' }}</span>
          </div>
        </div>
        
        <div class="detail-content">
          <div class="table-toolbar">
            <el-input
              v-model="attendanceDetailSearchKeyword"
              placeholder="搜索学生姓名或学号"
              prefix-icon="Search"
              clearable
              @clear="handleAttendanceDetailSearchClear"
              @input="handleAttendanceDetailSearchInput"
              style="width: 250px;"
            />
          </div>
          
          <el-table
            :data="filteredAttendanceStudents"
            style="width: 100%"
            v-loading="isLoadingAttendanceStudents"
          >
            <el-table-column prop="studentId" label="学号" width="120" />
            <el-table-column prop="fullName" label="姓名" width="120" />
            <el-table-column prop="className" label="班级" width="120" />
            <el-table-column label="考勤状态" width="120">
              <template #default="scope">
                <el-select 
                  v-model="scope.row.attendanceStatus" 
                  placeholder="选择状态"
                  :disabled="currentAttendance.status === '已结束'"
                  @change="updateStudentAttendanceStatus(scope.row)"
                >
                  <el-option label="出勤" value="出勤"></el-option>
                  <el-option label="缺勤" value="缺勤"></el-option>
                  <el-option label="迟到" value="迟到"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="200">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.remark" 
                  placeholder="备注信息"
                  :disabled="currentAttendance.status === '已结束'"
                  @blur="updateStudentAttendanceRemark(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container" v-if="attendanceStudents.length > attendanceDetailPageSize">
            <el-pagination
              v-model:current-page="attendanceDetailCurrentPage"
              v-model:page-size="attendanceDetailPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredAttendanceStudents.length"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="attendanceDetailDialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            v-if="currentAttendance && currentAttendance.status === '进行中'" 
            @click="finishAttendance"
          >
            结束考勤
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 上传文档对话框 -->
    <el-dialog v-model="uploadDocDialogVisible" title="上传文档" width="500px">
      <el-form :model="uploadDocForm" label-width="80px" :rules="uploadDocRules" ref="uploadDocFormRef">
        <el-form-item label="文件" prop="file">
          <el-upload
            ref="uploadDocRef"
            :auto-upload="false"
            :on-change="handleDocChange"
            :on-remove="handleDocRemove"
            :before-upload="beforeDocUpload"
            :file-list="docFileList"
            :limit="1"
            accept=".pdf,.pptx,.docx,.txt"
          >
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="uploadDocForm.name" placeholder="请输入文档名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadDocForm.description" type="textarea" :rows="3" placeholder="请输入文档描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDocDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadDoc" :loading="isUploadingDoc">上传</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/* eslint-disable */
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit,  Search } from '@element-plus/icons-vue'
import { courseAPI, knowledgeAPI, courseFileAPI, studentAPI, courseSelectionAPI, examAPI, attendanceAPI, docAPI, assignmentAPI, problemAPI } from '@/api/api'
import { subjectController } from '@/api/apiLearning'
import BigNumber from 'bignumber.js'
import { getExamStatus, updateExamsStatus, formatDateTime } from '@/utils/examManager'
import fileDownloadService from '@/services/fileDownloadService'

// 导入组件
import CourseContent from '@/components/teacher/CourseContent.vue'
import StudentManagement from '@/components/teacher/StudentManagement.vue'
import ExamManagement from '@/components/teacher/ExamManagement.vue'
import HomeworkManagement from '@/components/teacher/HomeworkManagement.vue'
import AttendanceManagement from '@/components/teacher/AttendanceManagement.vue'

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
const courseSubjectName = ref('')
const courseSubjectId = ref('')

// 学科选择（编辑课程对话框）
const subjectsLoading = ref(false)
const subjectOptions = ref([])

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

// 课程学生列表
const courseStudents = ref([])
const selectedStudents = ref([])
const currentStudent = ref(null)
const isLoadingStudents = ref(false)
const studentSearchKeyword = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 作业列表
const homeworks = ref([])
const isLoadingHomeworks = ref(false)
const homeworkSearchKeyword = ref('')
const homeworkCurrentPage = ref(1)
const homeworkPageSize = ref(10)
const addHomeworkDialogVisible = ref(false)
const homeworkFormRef = ref(null)
const homeworkForm = ref({
  title: '',
  description: '',
  endTime: '',
  startTime: new Date().toISOString(), // 默认开始时间为当前时间
  maxAttempts: 1,
  type: 'TEACHER_ASSIGNED', // 教师端默认设为教师布置类型
  isAnswerPublic: false,
  isScoreVisible: true,
  isRedoAllowed: false,
  status: 'DRAFT' // 默认为草稿状态
})
const homeworkFormTitle = ref('创建作业')
const isSavingHomework = ref(false)
const homeworkFileList = ref([])
const homeworkUploadRef = ref(null)
const currentHomework = ref(null)
const homeworkSubmissionsDialogVisible = ref(false)
const homeworkSubmissions = ref([])
const isLoadingHomeworkSubmissions = ref(false)
const homeworkSubmissionSearchKeyword = ref('')
const homeworkSubmissionCurrentPage = ref(1)
const homeworkSubmissionPageSize = ref(10)
const isExportingScores = ref(false)

// 过滤作业提交列表
const filteredHomeworkSubmissions = computed(() => {
  if (!homeworkSubmissionSearchKeyword.value) {
    return homeworkSubmissions.value
  }
  const keyword = homeworkSubmissionSearchKeyword.value.toLowerCase()
  return homeworkSubmissions.value.filter(submission => 
    (submission.studentId && submission.studentId.toString().includes(keyword)) ||
    (submission.fullName && submission.fullName.toLowerCase().includes(keyword))
  )
})

// 作业表单验证规则
const homeworkRules = {
  title: [
    { required: true, message: '请输入作业标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择截止日期', trigger: 'change' }
  ],
  maxAttempts: [
    { required: true, message: '请设置最大尝试次数', trigger: 'blur' },
    { type: 'number', min: 1, message: '最大尝试次数必须大于0', trigger: 'blur' }
  ]
}

// 获取课程作业列表
async function fetchCourseHomeworks() {
  try {
    isLoadingHomeworks.value = true
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
    console.log('获取课程作业，课程ID:', courseIdStr)
    
    // 使用getAssignmentsByCourseIdAndType接口获取教师布置类型的作业
    const response = await assignmentAPI.getAssignmentsByCourseIdAndType(courseIdStr, 'TEACHER_ASSIGNED')
    console.log('获取到的作业数据:', response)
    
    if (Array.isArray(response)) {
      // 确保所有ID都是字符串形式并正确映射字段名
      homeworks.value = response.map(assignment => ({
        // 基础标识字段
        assignmentId: assignment.assignmentId,
        homeworkId: assignment.assignmentId, // 兼容旧代码
        
        // 基本信息
        title: assignment.title || '',
        description: assignment.description || '',
        type: assignment.type || 'TEACHER_ASSIGNED',
        
        // 课程和创建者信息
        courseId: assignment.courseId,
        creatorId: assignment.creatorId,
        
        // 时间设置
        startTime: assignment.startTime || '',
        endTime: assignment.endTime || '',
        
        // 选项设置
        isAnswerPublic: assignment.isAnswerPublic || false,
        isScoreVisible: assignment.isScoreVisible || true,
        isRedoAllowed: assignment.isRedoAllowed || false,
        maxAttempts: assignment.maxAttempts || 1,
        
        // 状态信息
        status: assignment.status || 'DRAFT',
        
        // 额外数据（用于展示）
        submissionRate: 0, // 提交率，需要从后端获取或计算
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      }));
    } else {
      homeworks.value = []
    }
  } catch (error) {
    console.error('获取课程作业失败:', error)
    ElMessage.error('获取课程作业失败，请稍后重试')
    homeworks.value = []
  } finally {
    isLoadingHomeworks.value = false
  }
}

// 显示添加作业对话框
function showAddHomeworkDialog() {
  homeworkFormTitle.value = '创建作业'
  // 重置表单
  homeworkForm.value = {
    title: '',
    description: '',
    endTime: '',
    startTime: new Date().toISOString(), // 默认开始时间为当前时间
    maxAttempts: 1,
    type: 'TEACHER_ASSIGNED', // 教师端默认设为教师布置类型
    isAnswerPublic: false,
    isScoreVisible: true,
    isRedoAllowed: false,
    status: 'DRAFT' // 默认为草稿状态
  }
  
  homeworkFileList.value = []
  addHomeworkDialogVisible.value = true
}

// 编辑作业
function editHomework(homework) {
  // 导航到作业详情页面
  router.push({
    name: 'HomeworkDetail',
    params: { id: homework.assignmentId },
    query: { 
      courseId: courseId,
      courseName: courseName
    }
  })
}

// 保存作业
async function saveHomework() {
  homeworkFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        isSavingHomework.value = true
        
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
        
        // 确保courseId是字符串形式
        const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString()
        
        if (homeworkForm.value.homeworkId) {
          // 更新作业
          const homeworkData = {
            assignmentId: homeworkForm.value.homeworkId, // 使用homeworkId作为assignmentId
            type: homeworkForm.value.type, // 保留原始类型
            creatorId: teacherId,
            courseId: courseIdStr,
            title: homeworkForm.value.title,
            description: homeworkForm.value.description || '',
            isAnswerPublic: homeworkForm.value.isAnswerPublic || false,
            isScoreVisible: homeworkForm.value.isScoreVisible || true,
            isRedoAllowed: homeworkForm.value.isRedoAllowed || false,
            maxAttempts: homeworkForm.value.maxAttempts || 1,
            startTime: homeworkForm.value.startTime || new Date().toISOString(),
            endTime: homeworkForm.value.endTime,
            status: homeworkForm.value.status // 保留原始状态
          }
          
          await assignmentAPI.updateAssignment(homeworkData)
          ElMessage.success('作业更新成功')
        } else {
          // 创建新作业
          const homeworkData = {
            type: 'TEACHER_ASSIGNED', // 新建时设为教师布置类型
            creatorId: teacherId,
            courseId: courseIdStr,
            title: homeworkForm.value.title,
            description: homeworkForm.value.description || '',
            isAnswerPublic: homeworkForm.value.isAnswerPublic || false,
            isScoreVisible: homeworkForm.value.isScoreVisible || true,
            isRedoAllowed: homeworkForm.value.isRedoAllowed || false,
            maxAttempts: homeworkForm.value.maxAttempts || 1,
            startTime: homeworkForm.value.startTime || new Date().toISOString(),
            endTime: homeworkForm.value.endTime,
            status: 'DRAFT' // 新建时设为草稿状态
          }
          
          await assignmentAPI.saveAssignment(homeworkData)
          ElMessage.success('作业创建成功')
        }
        
        // 重新获取作业列表
        await fetchCourseHomeworks()
        
        // 关闭对话框
        addHomeworkDialogVisible.value = false
      } catch (error) {
        console.error('保存作业失败:', error)
        ElMessage.error(`保存作业失败: ${error.message || '请稍后重试'}`)
      } finally {
        isSavingHomework.value = false
      }
    }
  })
}

// 删除作业
async function removeHomework(homework) {
  try {
    // 使用 ElMessageBox 进行确认
    await ElMessageBox.confirm(
      `确定要删除作业"${homework.title}"吗？删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 显示加载状态
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在删除作业...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    try {
      // 确保作业ID是字符串形式
      const assignmentId = homework.assignmentId ? new BigNumber(homework.assignmentId).toString() : homework.assignmentId
      
      // 调用API删除作业
      await assignmentAPI.deleteAssignment(assignmentId)
      
      // 从列表中移除该作业
      homeworks.value = homeworks.value.filter(item => item.assignmentId !== homework.assignmentId)
      
      ElMessage.success('作业删除成功')
    } finally {
      loadingInstance.close()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除作业失败:', error)
      ElMessage.error(`删除作业失败: ${error.message || '请稍后重试'}`)
    }
  }
}

// 查看作业提交情况
async function viewHomeworkSubmissions(homework) {
  currentHomework.value = homework
  homeworkSubmissionsDialogVisible.value = true
  
  try {
    isLoadingHomeworkSubmissions.value = true
    
    // 确保homeworkId是字符串形式
    const assignmentIdStr = homework.homeworkId ? new BigNumber(homework.homeworkId).toString() : homework.homeworkId
    
    // 这里可能需要修改为使用assignmentAPI的相应方法
    // 暂时仍使用assignmentAPI.getAssignmentsByCreatorId，但实际应用中可能需要替换
    const submissions = await assignmentAPI.getAssignmentsByCreatorId(assignmentIdStr)
    
    // 确保所有ID都是字符串形式
    homeworkSubmissions.value = submissions.map(submission => ({
      ...submission,
      submissionId: submission.answerId ? new BigNumber(submission.answerId).toString() : submission.answerId,
      studentId: submission.studentId ? new BigNumber(submission.studentId).toString() : submission.studentId,
      homeworkId: submission.examId ? new BigNumber(submission.examId).toString() : submission.examId
    }))
  } catch (error) {
    console.error('获取作业提交列表失败:', error)
    ElMessage.error('获取作业提交列表失败，请稍后重试')
    homeworkSubmissions.value = []
  } finally {
    isLoadingHomeworkSubmissions.value = false
  }
}

// 更新提交分数
async function updateSubmissionScore(submission) {
  try {
    await assignmentAPI.gradeAssignmentAnswer({
      answerId: submission.submissionId,
      score: submission.score,
      feedback: submission.feedback
    })
    
    ElMessage.success('评分已保存')
  } catch (error) {
    console.error('更新提交分数失败:', error)
    ElMessage.error('更新提交分数失败，请稍后重试')
  }
}

// 查看提交详情
function viewSubmissionDetail() {
  // 这里可以实现查看提交详情的功能
  // 可以弹出一个对话框展示提交的内容和附件
  ElMessage.info('查看提交详情功能待实现')
}

// 导出作业成绩
function exportHomeworkScores() {
  if (!currentHomework.value) return
  
  isExportingScores.value = true
  
  try {
    // 创建CSV内容
    let csvContent = "学号,姓名,提交时间,分数,状态\n"
    
    homeworkSubmissions.value.forEach(submission => {
      const status = getSubmissionStatus(submission, currentHomework.value)
      const submitTime = submission.submitTime ? formatDate(submission.submitTime) : '未提交'
      const score = submission.score !== undefined ? submission.score : ''
      
      csvContent += `${submission.studentId},${submission.fullName},${submitTime},${score},${status}\n`
    })
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // 创建下载链接
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // 设置下载属性
    link.setAttribute('href', url)
    link.setAttribute('download', `${currentHomework.value.title}_成绩.csv`)
    link.style.visibility = 'hidden'
    
    // 添加到文档并触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('成绩导出成功')
  } catch (error) {
    console.error('导出成绩失败:', error)
    ElMessage.error('导出成绩失败，请稍后重试')
  } finally {
    isExportingScores.value = false
  }
}

// 作业文件上传相关方法
function handleHomeworkFileChange(file) {
  console.log('文件变更:', file)
}

function handleHomeworkFileRemove(file) {
  console.log('移除文件:', file)
}

function beforeHomeworkFileUpload(file) {
  // 限制文件大小为20MB
  const maxSize = 20 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过20MB')
    return false
  }
  
  return true
}

// 处理作业搜索输入
function handleHomeworkSearchInput() {
  // 重置分页到第一页
  homeworkCurrentPage.value = 1
}

// 处理作业搜索清除
function handleHomeworkSearchClear() {
  homeworkSearchKeyword.value = ''
  homeworkCurrentPage.value = 1
}

// 处理作业提交搜索输入
function handleHomeworkSubmissionSearchInput() {
  // 重置分页到第一页
  homeworkSubmissionCurrentPage.value = 1
}

// 处理作业提交搜索清除
function handleHomeworkSubmissionSearchClear() {
  homeworkSubmissionSearchKeyword.value = ''
  homeworkSubmissionCurrentPage.value = 1
}

// 获取提交状态文本
function getSubmissionStatus(submission, homework) {
  if (!submission.submitted) {
    return '未提交'
  }
  
  const deadline = homework.endTime ? new Date(homework.endTime) : null
  const submitTime = submission.submitTime ? new Date(submission.submitTime) : null
  
  if (deadline && submitTime) {
    if (submitTime > deadline) {
      return '逾期提交'
    } else {
      return '按时提交'
    }
  }
  
  return '已提交'
}

// 获取截止日期倒计时
function getDeadlineCountdown(homework, now) {
  if (!homework.endTime) return null;
  
  const endTime = new Date(homework.endTime);
  
  // 如果已经截止，不显示倒计时
  if (now > endTime) return null;
  
  // 计算剩余时间（毫秒）
  const timeRemaining = endTime.getTime() - now.getTime();
  
  // 转换为天、小时、分钟
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  // 根据剩余时间返回不同格式的倒计时
  if (days > 0) {
    return `剩余 ${days} 天 ${hours} 小时`;
  } else if (hours > 0) {
    return `剩余 ${hours} 小时 ${minutes} 分钟`;
  } else if (minutes > 0) {
    return `剩余 ${minutes} 分钟`;
  } else {
    return `即将截止`;
  }
}

// 获取标签效果
function getTagEffect(homework, now) {
  if (!homework.endTime) return 'plain';
  
  const endTime = new Date(homework.endTime);
  
  if (now > endTime) {
    return 'dark'; // 已截止，深色效果
  } else if (now > new Date(endTime.getTime() - 24 * 60 * 60 * 1000)) {
    return 'light'; // 即将截止（24小时内），浅色效果
  } else {
    return 'plain'; // 进行中，普通效果
  }
}

// 判断作业是否已过期
function isHomeworkExpired(homework, now) {
  if (!homework.endTime) return false;
  
  const endTime = new Date(homework.endTime);
  return now > endTime;
}

// 课程知识点列表
const courseKnowledges = ref([])

// 编辑课程对话框
const editCourseDialogVisible = ref(false)
const editCourseForm = ref({
  name: '',
  category: '',
  credit: 3,
  description: '',
  subjectId: ''
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

// 知识点对话框tab
const knowledgeDialogTab = ref('add')
// 知识点搜索关键词
const knowledgeSearchKeyword = ref('')
// 搜索到的知识点列表
const searchedKnowledges = ref([])
// 已选择的知识点列表
const selectedKnowledges = ref([])
// 是否正在搜索
const isSearching = ref(false)
// 知识点分页相关
const knowledgeCurrentPage = ref(1)
const knowledgePageSize = ref(10)
const knowledgeTotalCount = ref(0)
// 是否已加载知识点列表
const hasLoadedKnowledges = ref(false)

// 计算当前页的知识点
const currentPageKnowledges = computed(() => {
  const startIndex = (knowledgeCurrentPage.value - 1) * knowledgePageSize.value
  const endIndex = startIndex + knowledgePageSize.value
  return searchedKnowledges.value.slice(startIndex, endIndex)
})

// 处理知识点分页变化
function handleKnowledgePageChange(page) {
  knowledgeCurrentPage.value = page
}

// 处理知识点每页条数变化
function handleKnowledgePageSizeChange(size) {
  knowledgePageSize.value = size
  knowledgeCurrentPage.value = 1
}

// 添加学生对话框
const addStudentDialogVisible = ref(false)
const studentDialogTab = ref('search')
const studentSearchInput = ref('')
const searchedStudents = ref([])
const selectedStudentsToAdd = ref([])
const isSearchingStudents = ref(false)
const searchTriggered = ref(false)
const studentDetailDialogVisible = ref(false)

// 考试列表
const exams = ref([])
const isLoadingExams = ref(false)
const examSearchKeyword = ref('')
const examCurrentPage = ref(1)
const examPageSize = ref(10)

// 考勤列表
const attendances = ref([])
const attendanceSearchKeyword = ref('')
const attendanceCurrentPage = ref(1)
const attendanceStudents = ref([])
const attendanceDetailSearchKeyword = ref('')
const selectedAttendances = ref([]) // 添加选中考勤数组

// 添加计算属性跟踪当前时间
const currentTime = ref(new Date())

// 定时更新当前时间
let timeInterval = null

// 考试表单
const addExamDialogVisible = ref(false)
const examFormRef = ref(null)
const examForm = ref({
  title: '',
  description: '',
  totalScore: 100,
  durationMinutes: 120,
  startTime: '',
  endTime: '',
  examId: null,
  type: 'exam' // 添加type字段，指定为考试类型
})
const examFormTitle = ref('创建考试')
const isSavingExam = ref(false)

// 设置定时器，每分钟更新一次当前时间
timeInterval = setInterval(() => {
  currentTime.value = new Date()
  // 检查是否需要更新考试状态
  updateExamsStatus(exams.value, currentTime.value).then(updatedExams => {
    if (updatedExams) {
      // 如果有更新，重新加载考试列表
      fetchCourseExams()
    }
  })
}, 60000) // 每分钟更新一次

onUnmounted(() => {
  // 清除定时器
  if (timeInterval) {
    clearInterval(timeInterval)
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
    
    // 直接设置空数组，避免调用后端API
    materials.value = []
    console.log('课程资料接口已禁用，返回空数组')
    
  } catch (error) {
    console.error('获取课程资料失败:', error)
    ElMessage.error('获取课程资料失败，请稍后重试')
    materials.value = []
  }
}

// 获取课程学生
async function fetchCourseStudents() {
  try {
    isLoadingStudents.value = true
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
    console.log('获取课程学生，课程ID:', courseIdStr)
    
    const response = await courseSelectionAPI.getCourseStudents(courseIdStr)
    console.log('获取到的课程学生:', response)
    
    if (Array.isArray(response)) {
      // 确保所有ID都是字符串形式
      courseStudents.value = response.map(student => ({
        ...student,
        studentId: student.studentId ? new BigNumber(student.studentId).toString() : student.studentId
      }));
    } else {
      courseStudents.value = []
    }
  } catch (error) {
    console.error('获取课程学生失败:', error)
    ElMessage.error('获取课程学生失败，请稍后重试')
    courseStudents.value = []
  } finally {
    isLoadingStudents.value = false
  }
}

// 获取课程考试
async function fetchCourseExams() {
  try {
    isLoadingExams.value = true
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
    console.log('获取课程考试，课程ID:', courseIdStr)
    
    // 修改为使用getExamsInCourseByType接口，指定type为'exam'
    const response = await examAPI.getExamsInCourseByType(courseIdStr, 'exam')
    console.log('获取到的考试数据:', response)
    
    if (Array.isArray(response)) {
      // 确保所有ID都是字符串形式
      exams.value = response.map(exam => ({
        ...exam,
        examId: exam.examId ? new BigNumber(exam.examId).toString() : exam.examId
      }));
      
      // 获取考试后立即检查状态
      updateExamsStatus()
    } else {
      exams.value = []
    }
  } catch (error) {
    console.error('获取课程考试失败:', error)
    ElMessage.error('获取课程考试失败，请稍后重试')
    exams.value = []
  } finally {
    isLoadingExams.value = false
  }
}

// 显示编辑课程对话框
function showEditCourseDialog() {
  editCourseDialogVisible.value = true
  // 打开时加载学科选项并预选
  onEditDialogSubjectDropdown(true)
}

// 下拉展开时加载学科
async function onEditDialogSubjectDropdown(visible) {
  if (!visible) return
  try {
    subjectsLoading.value = true
    const data = await subjectController.getAll()
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.records) ? data.records : [])
    subjectOptions.value = list.map(item => ({ id: item.id, name: item.name }))
  } catch (e) {
    console.error('获取全部学科失败:', e)
    subjectOptions.value = []
  } finally {
    subjectsLoading.value = false
  }
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
      ElMessage.success('课程更新成功')
      editCourseDialogVisible.value = false
      
      // 重新加载课程数据
      const loadingInstance = ElLoading.service({
        target: '.course-detail',
        text: '刷新课程信息...',
        background: 'rgba(255, 255, 255, 0.7)'
      })
      
      try {
        // 重新获取课程信息
        const refreshedResponse = await courseAPI.getCourseById(courseId)
        
        if (refreshedResponse) {
          courseData.value = refreshedResponse
          courseName.value = refreshedResponse.name || '未命名课程'
          courseDescription.value = refreshedResponse.description || '暂无课程介绍'
          
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
          
          courseColor.value = categoryColors[refreshedResponse.category] || '#409EFF'
          
          // 重新获取课程知识点
          await fetchCourseKnowledges()
          
          // 重新获取课程资料
          await fetchCourseMaterials()
        }
      } catch (error) {
        console.error('刷新课程信息失败:', error)
        ElMessage.error('课程已更新，但刷新信息失败，请手动刷新页面')
      } finally {
        loadingInstance.close()
      }
      
      // 若选择了学科，绑定课程与学科关系
      try {
        if (editCourseForm.value.subjectId) {
          const sId = new BigNumber(editCourseForm.value.subjectId).toString()
          const cId = new BigNumber(courseId).toString()
          // 校验学科存在
          const subjectDetail = await subjectController.getById(sId)
          if (!subjectDetail || !subjectDetail.id) {
            throw new Error('所选学科不存在或已被删除')
          }
          await subjectController.addRelation(sId, cId)
          ElMessage.success('已绑定课程与学科关系')

          // 绑定成功后刷新页面学科展示
          try {
            const latestSubject = await subjectController.getSubjectByCourseId(cId)
            if (latestSubject && latestSubject.name) {
              courseSubjectName.value = latestSubject.name
              courseSubjectId.value = latestSubject.id || ''
            } else if (latestSubject && latestSubject[0] && latestSubject[0].name) {
              courseSubjectName.value = latestSubject[0].name
              courseSubjectId.value = latestSubject[0].id || ''
            }
          } catch (refreshErr) {
            console.warn('刷新课程关联学科失败:', refreshErr)
          }
        }
      } catch (relErr) {
        console.error('绑定课程与学科关系失败:', relErr)
      }
    } else {
      ElMessage.error('课程更新失败')
    }
  } catch (error) {
    console.error('更新课程失败:', error)
    ElMessage.error('更新课程失败，请稍后重试')
  }
}

// 显示添加知识点对话框
async function showAddKnowledgeDialog() {
  // 重置表单
  newKnowledge.value = {
    name: '',
    difficultyLevel: '中等',
    description: '',
    teachPlan: '',
    knowledgeId: null // 确保清除之前可能存在的ID
  }
  
  // 重置搜索和选择状态
  knowledgeSearchKeyword.value = ''
  searchedKnowledges.value = []
  selectedKnowledges.value = []
  knowledgeDialogTab.value = 'add'
  knowledgeCurrentPage.value = 1
  
  addKnowledgeDialogVisible.value = true
  
  // 打开对话框后立即加载所有知识点
  try {
    isSearching.value = true
    
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
    
    // 获取该教师的所有知识点
    const results = await knowledgeAPI.getKnowledgeByTeacherId(teacherId)
    
    // 过滤掉已经在课程中的知识点
    const courseKnowledgeIds = courseKnowledges.value.map(k => k.knowledgeId)
    const filteredResults = results.filter(knowledge => 
      !courseKnowledgeIds.includes(knowledge.knowledgeId)
    )
    
    searchedKnowledges.value = filteredResults
    knowledgeTotalCount.value = filteredResults.length
    
    if (filteredResults.length === 0 && results.length > 0) {
      ElMessage.info('您的所有知识点已全部在当前课程中')
    }
    
    hasLoadedKnowledges.value = true
  } catch (error) {
    console.error('获取知识点失败:', error)
    ElMessage.error(`获取知识点失败: ${error.message || '请稍后重试'}`)
    searchedKnowledges.value = []
    knowledgeTotalCount.value = 0
  } finally {
    isSearching.value = false
  }
}

// 搜索已有知识点
async function searchExistingKnowledge() {
  try {
    isSearching.value = true
    
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
    
    let results = []
    
    if (knowledgeSearchKeyword.value.trim()) {
      // 如果有搜索关键词，使用searchKnowledge接口
      results = await knowledgeAPI.searchKnowledge(knowledgeSearchKeyword.value)
    } else {
      // 如果没有搜索关键词，获取该教师的所有知识点
      results = await knowledgeAPI.getKnowledgeByTeacherId(teacherId)
    }
    
    // 过滤掉已经在课程中的知识点
    const courseKnowledgeIds = courseKnowledges.value.map(k => k.knowledgeId)
    const filteredResults = results.filter(knowledge => 
      !courseKnowledgeIds.includes(knowledge.knowledgeId)
    )
    
    searchedKnowledges.value = filteredResults
    knowledgeTotalCount.value = filteredResults.length
    knowledgeCurrentPage.value = 1 // 重置为第一页
    
    if (filteredResults.length === 0 && results.length > 0) {
      ElMessage.info('搜索到的知识点已全部在当前课程中')
    }
    
    // 标记已加载知识点列表
    hasLoadedKnowledges.value = true
  } catch (error) {
    console.error('搜索知识点失败:', error)
    ElMessage.error(`搜索知识点失败: ${error.message || '请稍后重试'}`)
    searchedKnowledges.value = []
    knowledgeTotalCount.value = 0
  } finally {
    isSearching.value = false
  }
}

// 修改选择知识点函数，支持表格多选
// 选择知识点
function selectKnowledge(row) {
  // 检查是否已经选择了该知识点
  const index = selectedKnowledges.value.findIndex(k => k.knowledgeId === row.knowledgeId)
  
  if (index === -1) {
    // 添加到已选择列表
    selectedKnowledges.value.push(row)
  } else {
    // 从已选择列表中移除
    selectedKnowledges.value.splice(index, 1)
  }
}

// 添加表格选择变化处理函数
function handleKnowledgeSelectionChange(selection) {
  // 直接用选中的行替换已选择的知识点列表
  selectedKnowledges.value = selection
}

// 获取行样式类名
function getRowClassName(row) {
  return selectedKnowledges.value.some(k => k.knowledgeId === row.row.knowledgeId) ? 'selected-row' : ''
}

// 移除已选择的知识点
function removeSelectedKnowledge(knowledge) {
  const index = selectedKnowledges.value.findIndex(k => k.knowledgeId === knowledge.knowledgeId)
  if (index !== -1) {
    selectedKnowledges.value.splice(index, 1)
  }
}

// 添加选中的知识点到课程
async function addSelectedKnowledgesToCourse() {
  if (selectedKnowledges.value.length === 0) {
    ElMessage.warning('请选择至少一个知识点')
    return
  }
  const loadingInstance = ElLoading.service({
    target: '.el-dialog',
    text: '添加知识点中...',
    background: 'rgba(255, 255, 255, 0.7)'
  })
  try {
    
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString()
    
    // 批量添加知识点到课程
    const promises = selectedKnowledges.value.map(knowledge => 
      knowledgeAPI.appendKnowledgeToCourse(knowledge.knowledgeId, courseIdStr)
    )
    
    await Promise.all(promises)
    
    // 重新获取课程知识点列表
    await fetchCourseKnowledges()
    
    ElMessage.success(`成功添加 ${selectedKnowledges.value.length} 个知识点到课程`)
    addKnowledgeDialogVisible.value = false
  } catch (error) {
    console.error('添加知识点失败:', error)
    ElMessage.error(`添加知识点失败: ${error.message || '请稍后重试'}`)
  } finally {
    loadingInstance.close()
  }
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
  
  // 切换到创建新知识点标签页
  knowledgeDialogTab.value = 'create'
  
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
      // 确保courseId和knowledgeId都是字符串形式
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

// 格式化文件大小
// function formatFileSize(size) {
//   if (!size) return '未知大小'
  
//   // 如果已经是格式化后的字符串，直接返回
//   if (typeof size === 'string' && (size.includes('KB') || size.includes('MB') || size.includes('GB'))) {
//     return size
//   }
  
//   // 转换为数字
//   const sizeNum = Number(size)
//   if (isNaN(sizeNum)) return size
  
//   if (sizeNum < 1024) {
//     return sizeNum + ' B'
//   } else if (sizeNum < 1024 * 1024) {
//     return (sizeNum / 1024).toFixed(1) + ' KB'
//   } else if (sizeNum < 1024 * 1024 * 1024) {
//     return (sizeNum / (1024 * 1024)).toFixed(1) + ' MB'
//   } else {
//     return (sizeNum / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
//   }
// }

// // 提取描述中的标签
// function extractTags(description) {
//   if (!description) return [];
  
//   const tags = [];
//   const regex = /#([^#]+)#/g;
//   let match;
  
//   while ((match = regex.exec(description)) !== null) {
//     tags.push(match[1].trim());
//   }
  
//   return tags;
// }

// 处理课程描述显示，去掉所有#标签#
// function formatDescription(description) {
//   if (!description) return '';
  
//   // 去掉所有#标签#内容
//   return description.replace(/#([^#]+)#/g, '').trim() || '暂无描述';
// }

// // 根据分类名生成确定的随机颜色
// function getCategoryColor(category) {
//   if (!category) return '#DCDFE6'; // 默认浅灰色
  
//   // 预定义的颜色列表
//   const colors = [
//     '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
//     '#909399', '#9B59B6', '#3498DB', '#1ABC9C',
//     '#27AE60', '#F39C12', '#D35400', '#8E44AD',
//     '#16A085', '#2980B9', '#C0392B', '#7F8C8D'
//   ];
  
//   // 使用分类名的字符串哈希值来确定颜色索引
//   let hashCode = 0;
//   for (let i = 0; i < category.length; i++) {
//     hashCode = ((hashCode << 5) - hashCode) + category.charCodeAt(i);
//     hashCode = hashCode & hashCode; // 转换为32位整数
//   }
  
//   // 确保hashCode为正数
//   hashCode = Math.abs(hashCode);
  
//   // 使用哈希值对颜色数组取模，得到确定的颜色索引
//   const colorIndex = hashCode % colors.length;
  
//   return colors[colorIndex];
// }

// 显示添加学生对话框
function showAddStudentDialog() {
  // 重置表单
  studentSearchInput.value = ''
  searchedStudents.value = []
  selectedStudentsToAdd.value = []
  studentDialogTab.value = 'search'
  searchTriggered.value = false
  
  addStudentDialogVisible.value = true
}

// 解除课程与学科绑定
async function unbindCourseSubject() {
  if (!courseSubjectId.value) {
    ElMessage.warning('当前课程未绑定学科')
    return
  }
  try {
    await ElMessageBox.confirm('确定要解除课程与当前学科的绑定吗？', '解除绑定', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (_) {
    return
  }

  const loading = ElLoading.service({ text: '正在解除绑定...' })
  try {
    const sId = String(courseSubjectId.value)
    const cId = String(route.params.courseId)
    await subjectController.deleteRelation(sId, cId)

    // 清空本地展示
    courseSubjectName.value = ''
    courseSubjectId.value = ''
    ElMessage.success('已解除课程与学科的绑定')
  } catch (e) {
    console.error('解除绑定失败:', e)
    ElMessage.error('解除绑定失败，请稍后再试')
  } finally {
    loading.close()
  }
}

// 搜索学生
async function searchStudents() {
  if (!studentSearchInput.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  try {
    isSearchingStudents.value = true
    searchTriggered.value = true
    
    const response = await studentAPI.searchStudents({
      keywords: studentSearchInput.value
    })
    console.log('搜索到的学生:', response)
    
    if (Array.isArray(response)) {
      // 过滤掉已经在课程中的学生
      const courseStudentIds = courseStudents.value.map(s => s.studentId)
      searchedStudents.value = response.filter(student => 
        !courseStudentIds.includes(student.studentId)
      )
      
      if (searchedStudents.value.length === 0 && response.length > 0) {
        ElMessage.info('搜索到的学生已全部在当前课程中')
      }
    } else {
      searchedStudents.value = []
    }
  } catch (error) {
    console.error('搜索学生失败:', error)
    ElMessage.error(`搜索学生失败: ${error.message || '请稍后重试'}`)
    searchedStudents.value = []
  } finally {
    isSearchingStudents.value = false
  }
}

// 选择学生
function selectStudent(row) {
  // 检查是否已经选择了该学生
  const index = selectedStudentsToAdd.value.findIndex(s => s.studentId === row.studentId)
  
  if (index === -1) {
    // 添加到已选择列表
    selectedStudentsToAdd.value.push(row)
  } else {
    // 从已选择列表中移除
    selectedStudentsToAdd.value.splice(index, 1)
  }
}

// 获取学生行样式类名
function getStudentRowClassName(row) {
  return selectedStudentsToAdd.value.some(s => s.studentId === row.row.studentId) ? 'selected-row' : ''
}

// 判断学生是否可选择
function isStudentSelectable(row) {
  // 过滤掉已经在课程中的学生
  const courseStudentIds = courseStudents.value.map(s => s.studentId)
  return !courseStudentIds.includes(row.studentId)
}

// 移除已选择的学生
function removeSelectedStudent(student) {
  const index = selectedStudentsToAdd.value.findIndex(s => s.studentId === student.studentId)
  if (index !== -1) {
    selectedStudentsToAdd.value.splice(index, 1)
  }
}

// 添加选中的学生到课程
async function addSelectedStudentsToCourse() {
  if (selectedStudentsToAdd.value.length === 0) {
    ElMessage.warning('请选择至少一个学生')
    return
  }
  
  const loadingInstance = ElLoading.service({
    target: '.el-dialog',
    text: '添加学生中...',
    background: 'rgba(255, 255, 255, 0.7)'
  })
  
  try {
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString()
    
    // 批量添加学生到课程
    const promises = selectedStudentsToAdd.value.map(student => 
      courseSelectionAPI.selectCourse(student.studentId, courseIdStr)
    )
    
    await Promise.all(promises)
    
    // 重新获取课程学生列表
    await fetchCourseStudents()
    
    ElMessage.success(`成功添加 ${selectedStudentsToAdd.value.length} 个学生到课程`)
    addStudentDialogVisible.value = false
  } catch (error) {
    console.error('添加学生失败:', error)
    ElMessage.error(`添加学生失败: ${error.message || '请稍后重试'}`)
  } finally {
    loadingInstance.close()
  }
}

// 查看学生详情
function viewStudent(student) {
  currentStudent.value = student
  studentDetailDialogVisible.value = true
}

// 移除当前学生
function removeCurrentStudent() {
  if (!currentStudent.value) return
  
  removeStudent(currentStudent.value)
  studentDetailDialogVisible.value = false
}

// 移除学生
function removeStudent(student) {
  ElMessageBox.confirm(
    `确定要将学生"${student.fullName}"从课程中移除吗？`,
    '移除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保ID是字符串形式
      const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString()
      const studentIdStr = student.studentId ? new BigNumber(student.studentId).toString() : student.studentId
      
      // 调用批量删除API，传入单个学生ID作为数组
      await courseSelectionAPI.batchDeleteCourseStudents(courseIdStr, [studentIdStr])
      
      // 重新获取课程学生列表
      await fetchCourseStudents()
      
      // 如果当前正在查看该学生的详情，则关闭详情对话框
      if (currentStudent.value && currentStudent.value.studentId === student.studentId) {
        studentDetailDialogVisible.value = false
      }
      
      ElMessage.success('已成功将学生从课程中移除')
    } catch (error) {
      console.error('移除学生失败:', error)
      ElMessage.error('移除学生失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消移除
  })
}

// 批量移除学生
function batchRemoveStudents() {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请先选择要移除的学生')
    return
  }
  
  ElMessageBox.confirm(
    `确定要将选中的 ${selectedStudents.value.length} 名学生从课程中移除吗？`,
    '批量移除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保courseId是字符串形式
      const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString()
      
      // 获取所有学生ID
      const studentIds = selectedStudents.value.map(student => 
        student.studentId ? new BigNumber(student.studentId).toString() : student.studentId
      )
      
      // 批量移除学生
      await courseSelectionAPI.batchDeleteCourseStudents(courseIdStr, studentIds)
      
      // 重新获取课程学生列表
      await fetchCourseStudents()
      
      // 清空选中状态
      selectedStudents.value = []
      
      ElMessage.success(`已成功将 ${studentIds.length} 名学生从课程中移除`)
    } catch (error) {
      console.error('批量移除学生失败:', error)
      ElMessage.error('批量移除学生失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消移除
  })
}

// 处理表格选择变化
function handleSelectionChange(selection) {
  selectedStudents.value = selection
}

// 处理搜索输入
function handleSearchInput() {
  // 重置分页到第一页
  currentPage.value = 1
}

// 处理清除搜索
function handleSearchClear() {
  studentSearchKeyword.value = ''
  currentPage.value = 1
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
      
      // 显示禁用消息
      console.error('上传资料失败:', '上传文件功能已禁用')
      ElMessage.error('上传文件功能已禁用')
      
      // 关闭对话框
      uploadDialogVisible.value = false
      
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
    const fileIdStr = material.id || material.fileId
    if (!fileIdStr) {
      ElMessage.error('文件ID无效，无法下载')
      return
    }
    
    // 显示禁用消息
    console.error('下载资料失败:', '下载文件功能已禁用')
    ElMessage.error('下载文件功能已禁用')
    
  } catch (error) {
    console.error('下载资料失败:', error)
    ElMessage.error(`下载资料失败: ${error.message || '请稍后重试'}`)
  }
}

// 删除资料
function removeMaterial(material) {
  ElMessageBox.confirm(
    `确定要删除文件"${material.name || material.fileName}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保资料ID是字符串形式
      const fileIdStr = material.id || material.fileId
      
      console.error('结束考勤失败:', '删除文件功能已禁用')
      ElMessage.error('删除文件功能已禁用')
      
      // 重新获取课程资料列表
      await fetchCourseMaterials()
      
    } catch (error) {
      console.error('删除资料失败:', error)
      ElMessage.error('删除资料失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除操作
  })
}

// 显示添加考试对话框
function showAddExamDialog() {
  examFormTitle.value = '创建考试'
  // 重置表单
  examForm.value = {
    title: '',
    description: '',
    totalScore: 100,
    durationMinutes: 120,
    startTime: '',
    endTime: '',
    examId: null,
    type: 'exam' // 添加type字段，指定为考试类型
  }
  
  addExamDialogVisible.value = true
}

// 编辑考试
function editExam(exam) {
  examFormTitle.value = '编辑考试'
  // 填充表单数据
  examForm.value = {
    title: exam.title,
    description: exam.description || '',
    totalScore: exam.totalScore,
    durationMinutes: exam.durationMinutes,
    startTime: exam.startTime,
    endTime: exam.endTime,
    examId: exam.examId ? new BigNumber(exam.examId).toString() : exam.examId,
    type: 'exam' // 确保type字段设置为考试类型
  }
  
  addExamDialogVisible.value = true
}

// 保存考试
async function saveExam() {
  examFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        isSavingExam.value = true
        
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
        
        // 确保courseId是字符串形式
        const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString()
        
        // 根据开始和结束时间自动判断状态
        const now = currentTime.value;
        const startTime = new Date(examForm.value.startTime);
        const endTime = new Date(examForm.value.endTime);
        
        let status = '未知';
        if (now < startTime) {
          status = '未开始';
        } else if (now >= startTime && now <= endTime) {
          status = '进行中';
        } else if (now > endTime) {
          status = '已结束';
        }
        
        if (examForm.value.examId) {
          // 更新考试
          const examData = {
            examId: examForm.value.examId,
            title: examForm.value.title,
            description: examForm.value.description,
            courseId: courseIdStr,
            teacherId: teacherId,
            totalScore: examForm.value.totalScore,
            durationMinutes: examForm.value.durationMinutes,
            startTime: examForm.value.startTime,
            endTime: examForm.value.endTime,
            status: status, // 使用自动判断的状态
            type: 'exam' // 添加type字段，指定为考试类型
          }
          
          await examAPI.updateExam(examData)
          ElMessage.success('考试更新成功')
  } else {
          // 创建新考试
          const examData = {
            title: examForm.value.title,
            description: examForm.value.description,
            courseId: courseIdStr,
            teacherId: teacherId,
            totalScore: examForm.value.totalScore,
            durationMinutes: examForm.value.durationMinutes,
            startTime: examForm.value.startTime,
            endTime: examForm.value.endTime,
            status: status, // 使用自动判断的状态
            type: 'exam' // 添加type字段，指定为考试类型
          }
          
          await examAPI.saveExam(examData)
          ElMessage.success('考试创建成功')
        }
        
        // 重新获取考试列表
        await fetchCourseExams()
        
        // 关闭对话框
        addExamDialogVisible.value = false
      } catch (error) {
        console.error('保存考试失败:', error)
        ElMessage.error(`保存考试失败: ${error.message || '请稍后重试'}`)
      } finally {
        isSavingExam.value = false
      }
    }
  })
}

// 删除考试
function removeExam(exam) {
  ElMessageBox.confirm(
    `确定要删除考试"${exam.title}"吗？删除后将无法恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保examId是字符串形式
      const examIdStr = exam.examId ? new BigNumber(exam.examId).toString() : exam.examId
      
      await examAPI.deleteExamById(examIdStr)
      
      // 重新获取考试列表
      await fetchCourseExams()
      
      ElMessage.success('考试删除成功')
    } catch (error) {
      console.error('删除考试失败:', error)
      ElMessage.error('删除考试失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 查看考试成绩
async function viewExamScores(exam) {
  // 如果考试状态是未开始，提示未开始
  if (exam.status === '未开始' || getExamStatus(exam, currentTime.value) === '未开始') {
    ElMessage.warning('考试尚未开始，暂无成绩数据')
    return
  }
  
  // 跳转到考试成绩页面
  router.push({
    path: `/teacher/exam/scores/${exam.examId}`,
    query: {
      title: exam.title,
      courseId: exam.courseId,
      courseName: courseName.value
    }
  })
}

// 处理考试搜索输入
function handleExamSearchInput() {
  // 重置分页到第一页
  examCurrentPage.value = 1
}

// 处理考试搜索清除
function handleExamSearchClear() {
  examSearchKeyword.value = ''
  examCurrentPage.value = 1
}

// 格式化日期
function formatDate(dateString) {
  return formatDateTime(dateString);
}

// 考试表单验证规则
const examRules = {
  title: [
    { required: true, message: '请输入考试标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  totalScore: [
    { required: true, message: '请输入总分', trigger: 'blur' },
    { type: 'number', min: 1, message: '总分必须大于0', trigger: 'blur' }
  ],
  durationMinutes: [
    { required: true, message: '请输入考试时长', trigger: 'blur' },
    { type: 'number', min: 1, message: '考试时长必须大于0', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
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
        description: response.description || '',
        subjectId: courseSubjectId.value || ''
      }
      
      console.log('课程数据加载成功:', response)
      
      // 加载课程关联的学科
      try {
        const subject = await subjectController.getSubjectByCourseId(courseId)
        if (subject && subject.name) {
          courseSubjectName.value = subject.name
          courseSubjectId.value = subject.id || ''
        } else if (subject && subject[0] && subject[0].name) {
          // 兼容数组返回
          courseSubjectName.value = subject[0].name
          courseSubjectId.value = subject[0].id || ''
        } else {
          courseSubjectName.value = ''
          courseSubjectId.value = ''
        }
      } catch (e) {
        console.warn('获取课程关联学科失败:', e)
        courseSubjectName.value = ''
        courseSubjectId.value = ''
      }
      
      // 加载课程知识点
      await fetchCourseKnowledges()
      
      // 加载课程资料
      await fetchCourseMaterials()
      
      // 加载课程学生
      await fetchCourseStudents()
      
      // 加载课程考试
      await fetchCourseExams()
      
      // 加载课程作业
      await fetchCourseHomeworks()

      // 加载课程考勤
      await fetchCourseAttendances()

      // 加载文档列表
      await fetchDocuments()
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
  
  // 设置定时器，每分钟更新一次当前时间
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
    // 检查是否需要更新考试状态
    updateExamsStatus(exams.value, currentTime.value).then(updatedExams => {
      if (updatedExams) {
        // 如果有更新，重新加载考试列表
        fetchCourseExams()
      }
    })
  }, 60000) // 每分钟更新一次
})

onUnmounted(() => {
  // 清除定时器
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// 查看知识点详情
function viewKnowledgeDetail(knowledge) {
  // 确保知识点ID是字符串形式
  const knowledgeIdStr = knowledge.knowledgeId ? new BigNumber(knowledge.knowledgeId).toString() : knowledge.knowledgeId
  
  // 跳转到知识点详情页面
  router.push({
    path: `/teacher/knowledge/${knowledgeIdStr}`,
    query: {
      courseName: courseName.value,
      courseId: courseId,
      knowledgeName: knowledge.name
    }
  })
}

// 添加考勤对话框
const addAttendanceDialogVisible = ref(false)
const attendanceFormRef = ref(null)
const isSavingAttendance = ref(false)

// 考勤详情对话框
const attendanceDetailDialogVisible = ref(false)
const isLoadingAttendanceStudents = ref(false)
const attendanceDetailCurrentPage = ref(1)
const attendanceDetailPageSize = ref(10)
const currentAttendance = ref(null)

// 过滤考勤学生列表
const filteredAttendanceStudents = computed(() => {
  if (!attendanceDetailSearchKeyword.value) {
    return attendanceStudents.value
  }
  const keyword = attendanceDetailSearchKeyword.value.toLowerCase()
  return attendanceStudents.value.filter(student => 
    (student.studentId && student.studentId.toString().includes(keyword)) ||
    (student.fullName && student.fullName.toLowerCase().includes(keyword)) ||
    (student.className && student.className.toLowerCase().includes(keyword))
  )
})

// 处理考勤搜索输入
function handleAttendanceDetailSearchInput() {
  // 重置分页到第一页
  attendanceDetailCurrentPage.value = 1
}

// 处理考勤搜索清除
function handleAttendanceDetailSearchClear() {
  attendanceDetailSearchKeyword.value = ''
  attendanceDetailCurrentPage.value = 1
}

// 处理考勤搜索输入
function handleAttendanceSearchInput() {
  // 重置分页到第一页
  attendanceCurrentPage.value = 1
}

// 处理考勤搜索清除
function handleAttendanceSearchClear() {
  attendanceSearchKeyword.value = ''
  attendanceCurrentPage.value = 1
}

// 处理考勤选择变化
function handleAttendanceSelectionChange() {
  selectedAttendances.value = attendances.value.filter(item => item.selected)
}

// 批量删除考勤
function batchRemoveAttendances() {
  if (selectedAttendances.value.length === 0) {
    ElMessage.warning('请先选择要删除的考勤记录')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedAttendances.value.length} 条考勤记录吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 获取所有选中的考勤ID
      const attendanceIds = selectedAttendances.value.map(attendance => 
        attendance.attendanceId ? new BigNumber(attendance.attendanceId).toString() : attendance.attendanceId
      )
      
      // 调用批量删除API
      await attendanceAPI.batchDeleteAttendance(attendanceIds)
      
      // 重新获取考勤列表
      await fetchCourseAttendances()
      
      // 清空选择
      selectedAttendances.value = []
      
      ElMessage.success(`已成功删除 ${attendanceIds.length} 条考勤记录`)
    } catch (error) {
      console.error('批量删除考勤失败:', error)
      ElMessage.error('批量删除考勤失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 处理知识点搜索输入
function handleKnowledgeSearchInput() {
  // 如果输入框不为空，延迟500ms后执行搜索，避免频繁请求
  if (knowledgeSearchKeyword.value.trim()) {
    clearTimeout(knowledgeSearchTimer)
    knowledgeSearchTimer = setTimeout(() => {
      searchExistingKnowledge()
    }, 500)
  }
}

// 处理知识点搜索清空
function handleKnowledgeSearchClear() {
  // 清空搜索框后，显示所有知识点
  searchExistingKnowledge()
}

// 知识点搜索定时器
let knowledgeSearchTimer = null

// 添加考勤
async function addAttendance(attendanceFormData) {
  try {
    // 确保courseId是字符串形式
    const courseIdStr = attendanceFormData.courseId ? new BigNumber(attendanceFormData.courseId).toString() : attendanceFormData.courseId.toString()
    
    // 获取选中的学生列表
    const selectedStudents = attendanceFormData.selectedStudentIds || []
    
    if (selectedStudents.length === 0) {
      ElMessage.warning('请至少选择一名学生')
      return
    }
    
    // 显示加载状态
    const loadingInstance = ElLoading.service({
      text: '正在发布考勤...',
      background: 'rgba(255, 255, 255, 0.7)'
    })
    
    try {
      // 批量创建考勤记录
      const attendanceList = selectedStudents.map(studentId => ({
        courseId: courseIdStr,
        studentId: String(studentId),
        status: '', // 设置状态为空字符串
        attendanceDate: attendanceFormData.attendanceDate,
        remark: attendanceFormData.remark || '',
        type: 'attendance'
      }))
      
      console.log('创建考勤列表:', attendanceList)
      
      // 批量保存考勤记录
      await attendanceAPI.batchSaveAttendance(attendanceList)
      
      loadingInstance.close()
      ElMessage.success('考勤发布成功')
      
      // 重新获取考勤列表
      await fetchCourseAttendances()
    } catch (error) {
      loadingInstance.close()
      throw error
    }
  } catch (error) {
    console.error('发布考勤失败:', error)
    ElMessage.error(`发布考勤失败: ${error.message || '请稍后重试'}`)
  }
}

// 更新考勤
async function updateAttendance(attendanceFormData) {
  try {
    // 检查是否是单个考勤记录的更新请求
    if (attendanceFormData.attendanceId) {
      // 单个考勤状态更新
      await attendanceAPI.updateAttendanceStatus(
        attendanceFormData.attendanceId,
        attendanceFormData.status,
        attendanceFormData.remark || ''
      )
      console.log('单个考勤状态已更新:', attendanceFormData.attendanceId)
      
      // 重新获取考勤列表
      await fetchCourseAttendances()
      return
    }
    
    // 以下是整个考勤组的更新逻辑
    // 解析考勤组ID (格式: courseId_date)
    const [courseIdStr, attendanceDate] = attendanceFormData.id.split('_')
    
    if (!courseIdStr || !attendanceDate) {
      ElMessage.error('无效的考勤记录')
      return
    }
    
    // 获取该组所有考勤记录
    const groupAttendances = attendances.value.filter(
      a => a.courseId === courseIdStr && a.attendanceDate === attendanceDate
    )
    
    // 获取选中的学生ID
    const selectedStudentIds = new Set(attendanceFormData.selectedStudentIds || [])
    
    // 显示加载状态
    const loadingInstance = ElLoading.service({
      text: '正在更新考勤...',
      background: 'rgba(255, 255, 255, 0.7)'
    })
    
    // 更新现有考勤记录的备注
    for (const attendance of groupAttendances) {
      // 更新考勤备注
      await attendanceAPI.updateAttendanceStatus(
        attendance.attendanceId,
        attendance.status,
        attendanceFormData.remark || ''
      )
    }
    
    // 找出需要添加的学生（在selectedStudentIds中但不在现有考勤记录中）
    const existingStudentIds = new Set(groupAttendances.map(a => a.studentId))
    const studentsToAdd = Array.from(selectedStudentIds).filter(id => !existingStudentIds.has(id))
    
    // 为新增的学生创建考勤记录
    if (studentsToAdd.length > 0) {
      const newAttendances = studentsToAdd.map(studentId => ({
        courseId: courseIdStr,
        studentId: String(studentId),
        status: '', // 设置状态为空字符串
        attendanceDate: attendanceDate,
        remark: attendanceFormData.remark || ''
      }))
      
      // 批量保存新增考勤记录
      await attendanceAPI.batchSaveAttendance(newAttendances)
    }
    
    // 找出需要删除的考勤记录（在现有考勤记录中但不在selectedStudentIds中）
    const attendancesToDelete = groupAttendances.filter(
      a => !selectedStudentIds.has(a.studentId)
    )
    
    // 删除不再需要的考勤记录
    for (const attendance of attendancesToDelete) {
      await attendanceAPI.deleteAttendance(attendance.attendanceId)
    }
    
    // 重新获取考勤列表
    await fetchCourseAttendances()
    
    loadingInstance.close()
    ElMessage.success('考勤更新成功')
  } catch (error) {
    console.error('更新考勤失败:', error)
    ElMessage.error(`更新考勤失败: ${error.message || '请稍后重试'}`)
  }
}

// 考勤模态框相关状态
const isEditingAttendance = ref(false)
const isSubmittingAttendance = ref(false)
const allStudentsSelected = ref(false)
const isIndeterminate = ref(false)

// 考勤表单数据
const attendanceForm = ref({
  id: null,
  courseId: '',
  attendanceDate: new Date().toISOString().split('T')[0], // 默认今天
  remark: '',
  lateThreshold: 5, // 默认迟到阈值5分钟
  absentThreshold: 15, // 默认缺勤阈值15分钟
  selectedStudentIds: []
})

// 可用的学生列表
const availableStudents = computed(() => {
  // 确保返回的是有效的数组
  return courseStudents.value && courseStudents.value.length > 0 
    ? courseStudents.value.filter(student => student.studentId)
    : []
})

// 已选择的学生数量
const selectedStudentsCount = computed(() => {
  return attendanceForm.value && attendanceForm.value.selectedStudentIds 
    ? attendanceForm.value.selectedStudentIds.length 
    : 0
})

// 监听学生选择变化，更新全选状态
watch(() => attendanceForm.value.selectedStudentIds, (val) => {
  updateStudentSelectionStatus()
}, { deep: true })

// 添加一个空的fetchCourseAttendances函数以解决未定义错误
async function fetchCourseAttendances() {
  try {
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
    console.log('获取课程考勤，课程ID:', courseIdStr)
    
    const response = await attendanceAPI.getCourseAttendance(courseIdStr)
    console.log('获取到的考勤数据:', response)
    
    if (Array.isArray(response)) {
      // 确保所有ID都是字符串形式，并添加默认值防止undefined
      attendances.value = response.map(attendance => ({
        ...attendance,
        attendanceId: attendance.attendanceId ? new BigNumber(attendance.attendanceId).toString() : attendance.attendanceId,
        studentId: attendance.studentId ? new BigNumber(attendance.studentId).toString() : attendance.studentId,
        courseId: attendance.courseId ? new BigNumber(attendance.courseId).toString() : attendance.courseId,
        selected: false, // 添加选中状态
        status: attendance.status || '', // 确保状态有默认值，设为空字符串
        type: attendance.type || 'attendance', // 添加默认类型
      }));
    } else {
      attendances.value = []
    }
  } catch (error) {
    console.error('获取课程考勤失败:', error)
    ElMessage.error('获取课程考勤失败，请稍后重试')
    attendances.value = []
  }
}

// 显示添加考勤对话框
function showAddAttendanceDialog() {
  // 重置表单
  attendanceForm.value = {
    courseId: courseId,
    attendanceDate: new Date().toISOString().split('T')[0], // 默认今天
    remark: '',
    lateThreshold: 5, // 默认迟到阈值5分钟
    absentThreshold: 15, // 默认缺勤阈值15分钟
    selectedStudentIds: [],
    type: 'attendance', // 添加默认类型
  }
  
  // 确保课程学生数据已加载
  if (courseStudents.value.length === 0) {
    fetchCourseStudents().then(() => {
      // 获取学生后再设置选中状态
      if (courseStudents.value && courseStudents.value.length > 0) {
        attendanceForm.value.selectedStudentIds = courseStudents.value.map(student => student.studentId)
        updateStudentSelectionStatus()
      }
    })
  } else {
    // 默认选中所有学生
    if (courseStudents.value && courseStudents.value.length > 0) {
      attendanceForm.value.selectedStudentIds = courseStudents.value.map(student => student.studentId)
    }
    
    // 更新全选状态
    updateStudentSelectionStatus()
  }
  
  // 设置为新建模式
  isEditingAttendance.value = false
  
  // 显示对话框
  addAttendanceDialogVisible.value = true
}

// 更新学生选择状态
function updateStudentSelectionStatus() {
  if (!availableStudents.value || availableStudents.value.length === 0) {
    allStudentsSelected.value = false
    isIndeterminate.value = false
    return
  }
  
  const checkedCount = attendanceForm.value.selectedStudentIds.length
  allStudentsSelected.value = checkedCount === availableStudents.value.length && availableStudents.value.length > 0
  isIndeterminate.value = checkedCount > 0 && checkedCount < availableStudents.value.length
}

// 处理全选学生
function handleSelectAllStudents(val) {
  if (val) {
    // 全选
    attendanceForm.value.selectedStudentIds = availableStudents.value.map(student => student.studentId)
  } else {
    // 全不选
    attendanceForm.value.selectedStudentIds = []
  }
  isIndeterminate.value = false
}

// 提交考勤
async function submitAttendance() {
  try {
    isSubmittingAttendance.value = true
    
    if (!attendanceForm.value || !attendanceForm.value.selectedStudentIds || attendanceForm.value.selectedStudentIds.length === 0) {
      ElMessage.warning('请至少选择一名学生')
      isSubmittingAttendance.value = false
      return
    }
    
    // 确保courseId是字符串形式
    const courseIdStr = attendanceForm.value.courseId ? 
      new BigNumber(attendanceForm.value.courseId).toString() : 
      attendanceForm.value.courseId.toString()
    
    // 准备考勤数据
    const attendanceData = {
      courseId: courseIdStr,
      attendanceDate: attendanceForm.value.attendanceDate,
      remark: attendanceForm.value.remark || '',
      selectedStudentIds: attendanceForm.value.selectedStudentIds,
      lateThreshold: attendanceForm.value.lateThreshold || 5,
      absentThreshold: attendanceForm.value.absentThreshold || 15,
      type: 'attendance', // 添加默认类型
    }
    
    console.log('提交考勤数据:', attendanceData)
    
    if (isEditingAttendance.value && attendanceForm.value.id) {
      // 更新考勤
      await updateAttendance(attendanceData)
    } else {
      // 添加考勤
      await addAttendance(attendanceData)
    }
    
    // 关闭对话框
    addAttendanceDialogVisible.value = false
    
    // 重新获取考勤列表
    await fetchCourseAttendances()
    
    ElMessage.success(isEditingAttendance.value ? '考勤更新成功' : '考勤发布成功')
  } catch (error) {
    console.error(isEditingAttendance.value ? '更新考勤失败:' : '发布考勤失败:', error)
    ElMessage.error(`${isEditingAttendance.value ? '更新考勤失败' : '发布考勤失败'}: ${error.message || '请稍后重试'}`)
  } finally {
    isSubmittingAttendance.value = false
  }
}

// 查看考勤详情
async function viewAttendanceDetail(group) {
  try {
    isLoadingAttendanceStudents.value = true
    
    // 防止group为undefined
    if (!group) {
      ElMessage.error('考勤数据无效')
      isLoadingAttendanceStudents.value = false
      return
    }
    
    // 设置当前考勤，添加默认值防止undefined
    currentAttendance.value = {
      ...group,
      attendanceId: group.key || '', // 使用分组键作为考勤ID
      status: group.status || '', // 设置状态默认值为空字符串
      type: group.type || 'attendance', // 添加默认类型
    }
    
    // 获取该考勤组的所有学生记录
    if (Array.isArray(group.attendances)) {
      attendanceStudents.value = group.attendances.map(attendance => {
        // 查找对应的学生信息
        const student = courseStudents.value.find(s => s.studentId === attendance.studentId) || {}
        
        return {
          ...attendance,
          ...student,
          attendanceStatus: group.status || '', // 设置状态默认值为空字符串
          type: attendance.type || 'attendance', // 添加默认类型
        }
      });
    } else {
      attendanceStudents.value = []
      console.error('考勤学生数据格式错误:', group)
    }
    
    // 重置搜索和分页
    attendanceDetailSearchKeyword.value = ''
    attendanceDetailCurrentPage.value = 1
    
    // 显示考勤详情对话框
    attendanceDetailDialogVisible.value = true
  } catch (error) {
    console.error('获取考勤详情失败:', error)
    ElMessage.error('获取考勤详情失败，请稍后重试')
  } finally {
    isLoadingAttendanceStudents.value = false
  }
}

// 编辑考勤
function editAttendance(group) {
  // 设置为编辑模式
  isEditingAttendance.value = true
  
  // 填充表单
  attendanceForm.value = {
    id: group.key, // 使用分组键作为ID
    courseId: group.courseId,
    attendanceDate: group.attendanceDate,
    remark: group.remark || '',
    lateThreshold: 5, // 默认值，实际应从后端获取
    absentThreshold: 15, // 默认值，实际应从后端获取
    selectedStudentIds: group.attendances.map(a => a.studentId)
  }
  
  // 更新全选状态
  allStudentsSelected.value = courseStudents.value.length > 0 && 
    attendanceForm.value.selectedStudentIds.length === courseStudents.value.length
  isIndeterminate.value = attendanceForm.value.selectedStudentIds.length > 0 && 
    attendanceForm.value.selectedStudentIds.length < courseStudents.value.length
  
  // 显示对话框
  addAttendanceDialogVisible.value = true
}

// 更新学生考勤状态
async function updateStudentAttendanceStatus(student) {
  try {
    // 确保attendanceId是字符串形式
    const attendanceIdStr = student.attendanceId ? 
      new BigNumber(student.attendanceId).toString() : 
      student.attendanceId
    
    // 获取当前考勤组的状态
    const status = currentAttendance.value ? currentAttendance.value.status : ''
    
    console.log('更新考勤状态:', attendanceIdStr, status)
    
    // 调用API更新考勤状态
    await attendanceAPI.updateAttendanceStatus(
      attendanceIdStr,
      status,
      student.remark || ''
    )
    
    // 更新本地数据
    const index = attendances.value.findIndex(a => a.attendanceId === student.attendanceId)
    if (index !== -1) {
      attendances.value[index].status = status
    }
    
    ElMessage.success('考勤状态更新成功')
  } catch (error) {
    console.error('更新考勤状态失败:', error)
    ElMessage.error('更新考勤状态失败，请稍后重试')
  }
}

// 更新学生考勤备注
async function updateStudentAttendanceRemark(student) {
  try {
    // 确保attendanceId是字符串形式
    const attendanceIdStr = student.attendanceId ? 
      new BigNumber(student.attendanceId).toString() : 
      student.attendanceId
    
    // 获取当前考勤组的状态
    const status = currentAttendance.value ? currentAttendance.value.status : ''
    
    console.log('更新考勤备注:', attendanceIdStr, student.remark)
    
    // 调用API更新考勤备注
    await attendanceAPI.updateAttendanceStatus(
      attendanceIdStr,
      status,
      student.remark || ''
    )
    
    // 更新本地数据
    const index = attendances.value.findIndex(a => a.attendanceId === student.attendanceId)
    if (index !== -1) {
      attendances.value[index].remark = student.remark
      attendances.value[index].status = status
    }
    
    ElMessage.success('考勤备注更新成功')
  } catch (error) {
    console.error('更新考勤备注失败:', error)
    ElMessage.error('更新考勤备注失败，请稍后重试')
  }
}

// 结束考勤
async function finishAttendance() {
  try {
    if (!currentAttendance.value) return
    
    // 显示加载状态
    const loadingInstance = ElLoading.service({
      text: '正在结束考勤...',
      background: 'rgba(255, 255, 255, 0.7)'
    })
    
    // 获取该考勤组的所有考勤记录
    const attendanceIds = attendanceStudents.value.map(student => student.attendanceId)
    
    console.log('结束考勤，考勤ID列表:', attendanceIds)
    
    // 批量更新考勤状态为已结束
    const updatePromises = attendanceIds.map(id => 
      attendanceAPI.updateAttendanceStatus(id, '已结束')
    )
    
    await Promise.all(updatePromises)
    
    // 更新当前考勤状态
    currentAttendance.value.status = '已结束'
    
    // 重新获取考勤列表
    await fetchCourseAttendances()
    
    // 关闭考勤详情对话框
    attendanceDetailDialogVisible.value = false
    
    loadingInstance.close()
    ElMessage.success('考勤已结束')
  } catch (error) {
    console.error('结束考勤失败:', error)
    ElMessage.error('结束考勤失败，请稍后重试')
  }
}

// 获取考勤状态类型
function getAttendanceStatusType(status) {
  switch(status) {
    case '进行中':
      return 'warning'
    case '已结束':
      return 'success'
    case '出勤':
      return 'success'
    case '缺勤':
      return 'danger'
    case '迟到':
      return 'warning'
    default:
      return 'info'
  }
}

// 移除考勤
function removeAttendance(attendance) {
  ElMessageBox.confirm(
    `确定要删除此考勤记录吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保attendanceId是字符串形式
      const attendanceIdStr = attendance.attendanceId ? 
        new BigNumber(attendance.attendanceId).toString() : 
        attendance.attendanceId
      
      // 调用API删除考勤
      await attendanceAPI.deleteAttendance(attendanceIdStr)
      
      // 重新获取考勤列表
      await fetchCourseAttendances()
      
      ElMessage.success('考勤记录删除成功')
    } catch (error) {
      console.error('删除考勤失败:', error)
      ElMessage.error('删除考勤失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 下载文档
async function downloadDoc(filename) {
  if (!filename || typeof filename !== 'string') {
    ElMessage.error('文件名无效')
    return
  }

  try {
    ElMessage.info('开始下载文档...')

    // 使用GET请求，参数通过查询参数传递
    const apiUrl = `http://118.89.136.119:8000/docs/download?filename=${encodeURIComponent(filename)}`
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream'
      }
    })

    if (!response.ok) {
      let errorMessage = `下载失败: ${response.status} ${response.statusText}`

      try {
        const errorData = await response.json()
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(err => err.msg || err).join(', ')
          }
        }
      } catch (e) {
        // 如果无法解析JSON，使用默认错误消息
      }

      throw new Error(errorMessage)
    }

    // 获取文件内容
    const blob = await response.blob()

    if (!blob || blob.size === 0) {
      throw new Error('下载的文件为空')
    }

    // 创建下载链接
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    // 清理DOM和URL对象
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
      URL.revokeObjectURL(downloadUrl)
    }, 100)

    ElMessage.success('文档下载成功')

  } catch (error) {
    console.error('下载文档失败:', error)

    // 根据错误类型提供不同的提示
    let userMessage = '下载文档失败，请稍后重试'

    if (error.message.includes('404')) {
      userMessage = '文档不存在或已被删除'
    } else if (error.message.includes('403')) {
      userMessage = '没有权限访问该文档'
    } else if (error.message.includes('422')) {
      userMessage = '请求参数错误'
    } else if (error.message.includes('网络')) {
      userMessage = '网络连接异常，请检查网络设置'
    } else if (error.message.includes('timeout')) {
      userMessage = '下载超时，请稍后重试'
    } else if (error.message) {
      userMessage = error.message
    }

    ElMessage.error(userMessage)
  }
}

// 文档列表
const documents = ref([])
const uploadDocDialogVisible = ref(false)
const uploadDocForm = ref({
  file: null
})
const uploadDocFormRef = ref(null)
const docFileList = ref([])
const isUploadingDoc = ref(false)

// 文档上传表单验证规则
const uploadDocRules = {
  file: [
    { required: true, message: '请选择要上传的文件', trigger: 'change' }
  ]
}

// 获取文档列表
async function fetchDocuments() {
  try {
    console.log('开始获取文档列表');

    // 调用API获取文档列表，API层已经处理好数据格式
    const fileList = await docAPI.listDocs();
    console.log('获取到的文档列表:', fileList);

    // 直接使用API返回的文件列表
    documents.value = Array.isArray(fileList) ? fileList : [];

    console.log('设置的文档列表:', documents.value);

    // 如果文档列表为空，显示提示信息
    if (documents.value.length === 0) {
      console.info('当前没有课程文档');
    }
  } catch (error) {
    console.error('获取文档列表失败:', error);

    // 根据错误类型显示不同的提示信息
    if (error.message && error.message.includes('文档服务暂时不可用')) {
      ElMessage.warning('文档服务暂时不可用，请稍后重试');
    } else {
      ElMessage.warning('获取课程文档列表失败，文档功能可能暂时不可用');
    }

    documents.value = [];
  }
}

// 显示上传文档对话框
function showUploadDocDialog() {
  uploadDocForm.value = {
    file: null
  }
  docFileList.value = []
  uploadDocDialogVisible.value = true
}

// 文档上传前的验证
function beforeDocUpload(file) {
  // 限制文件大小为50MB
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过50MB')
    return false
  }
  
  // 保存文件到表单
  uploadDocForm.value.file = file
  
  return false // 阻止自动上传
}

// 文档选择变化处理
function handleDocChange(file) {
  // 更新文件列表
  docFileList.value = [file]
  
  // 保存文件到表单
  uploadDocForm.value.file = file.raw
}

// 文档移除处理
function handleDocRemove() {
  // 清空文件列表
  docFileList.value = []
  
  // 清空表单中的文件
  uploadDocForm.value.file = null
}

// 上传文档
async function uploadDoc() {
  // 表单验证
  if (!uploadDocFormRef.value) return
  
  uploadDocFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请选择要上传的文件')
      return
    }
    
    if (!uploadDocForm.value.file) {
      ElMessage.warning('请选择要上传的文件')
      return
    }
    
    try {
      isUploadingDoc.value = true
      
      // 上传文件
      await docAPI.uploadDoc(uploadDocForm.value.file)
      
      ElMessage.success('文档上传成功')
      uploadDocDialogVisible.value = false
      
      // 重新获取文档列表
      await fetchDocuments()
    } catch (error) {
      console.error('上传文档失败:', error)
      ElMessage.error('上传文档失败，请稍后重试')
    } finally {
      isUploadingDoc.value = false
    }
  })
}

// 删除文档
function removeDoc(filename) {
  ElMessageBox.confirm(
    `确定要删除文件"${filename}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await docAPI.deleteDoc(filename)
      
      // 重新获取文档列表
      await fetchDocuments()
      
      ElMessage.success('文档已删除')
    } catch (error) {
      console.error('删除文档失败:', error)
      ElMessage.error('删除文档失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除操作
  })
}

// 发布作业
async function publishHomework(homework) {
  try {
    // 显示加载中
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在发布作业...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    try {
      // 确保ID是字符串形式
      const assignmentId = homework.assignmentId ? new BigNumber(homework.assignmentId).toString() : homework.assignmentId
      
      // 创建更新对象
      const updateData = {
        assignmentId: assignmentId,
        type: homework.type,
        creatorId: homework.creatorId,
        courseId: homework.courseId,
        title: homework.title,
        description: homework.description || '',
        isAnswerPublic: homework.isAnswerPublic || false,
        isScoreVisible: homework.isScoreVisible || true,
        isRedoAllowed: homework.isRedoAllowed || false,
        maxAttempts: homework.maxAttempts || 1,
        startTime: homework.startTime || new Date().toISOString(),
        endTime: homework.endTime,
        status: 'PUBLISHED' // 将状态设置为已发布
      }
      
      // 调用API更新作业状态
      await assignmentAPI.updateAssignment(updateData)
      
      // 更新本地状态
      const index = homeworks.value.findIndex(item => item.assignmentId === homework.assignmentId)
      if (index !== -1) {
        homeworks.value[index].status = 'PUBLISHED'
      }
      
      ElMessage.success('作业已成功发布')
    } finally {
      loadingInstance.close()
    }
  } catch (error) {
    console.error('发布作业失败:', error)
    ElMessage.error(`发布作业失败: ${error.message || '请稍后重试'}`)
  }
}


</script>

<style scoped>
.deadline-container {
  display: flex;
  flex-direction: column;
}

.countdown-text {
  font-size: 12px;
  color: #F56C6C;
  margin-top: 4px;
}

.course-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
 /* overflow: hidden;  */
}

.course-header {
  padding: 0 10px;
  color: #303133;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0;
  box-shadow: none;
  border: none;
  background-color: transparent;
  text-align: left;
  min-height: 32px;
  height: 32px;
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

.course-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  text-shadow: none;
  color: #303133;
  line-height: 32px;
  height: 32px;
  font-size: 22px;
}

.course-content {
  flex: 1;
  padding: 32px 40px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.course-tabs {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
  transform: scale(1.05);
  transform-origin: top center;
}

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

.materials-list {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.material-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.material-item:hover {
  background-color: #f5f7fa;
}

.material-item:last-child {
  border-bottom: none;
}

.material-name {
  flex: 1;
  margin-left: 16px;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-size {
  color: #909399;
  margin-right: 20px;
  font-size: 13px;
  min-width: 60px;
}

.material-actions {
  display: flex;
  gap: 8px;
}

.homework-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.homework-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.homework-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.homework-info h4 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.homework-info p {
  margin: 6px 0;
  color: #606266;
  font-size: 14px;
}

/* 知识点列表样式 */
.knowledge-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.knowledge-item {
  border: none;
  border-radius: 12px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.knowledge-item:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-3px);
  background-color: #f9fbfe;
}

.knowledge-item::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 15px;
  width: 8px;
  height: 8px;
  border-top: 2px solid #c0c4cc;
  border-right: 2px solid #c0c4cc;
  transform: translateY(-50%) rotate(45deg);
  opacity: 0;
  transition: opacity 0.3s;
}

.knowledge-item:hover::after {
  opacity: 1;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.knowledge-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.knowledge-description {
  margin-bottom: 16px;
}

.knowledge-description p {
  margin: 0;
  color: #606266;
  font-size: 15px;
  line-height: 1.6;
}

.knowledge-footer {
  margin-bottom: 16px;
  font-size: 14px;
}

.teach-plan-label {
  color: #909399;
  margin-right: 6px;
  font-weight: 500;
}

.teach-plan-content {
  color: #606266;
}

.knowledge-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
  margin-top: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.category-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.knowledge-search-results {
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.empty-search-results {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.selected-knowledge-list {
  margin-top: 20px;
  border-top: 1px solid #EBEEF5;
  padding-top: 15px;
}

.selected-knowledge-list h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.selected-knowledge-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

:deep(.selected-row) {
  background-color: #F0F9EB;
}

.el-tabs {
  margin-bottom: 20px;
}

.course-description-container {
  display: flex;
  flex-direction: column;
}

.course-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.course-tags-container .rendered-tag {
  display: inline-block;
  white-space: nowrap;
  padding: 4px 15px;
  border-radius: 30px;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 400;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.course-tags-container .rendered-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
}

.course-desc {
  margin: 0;
  font-size: 15px;
  color: #606266;
  line-height: 1.6;
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

.student-search-results {
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.empty-search-results {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.selected-students-list {
  margin-top: 20px;
  border-top: 1px solid #EBEEF5;
  padding-top: 15px;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.selected-header h4 {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.selected-student-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

:deep(.selected-row) {
  background-color: #F0F9EB !important;
}

:deep(.el-alert) {
  margin-bottom: 10px;
}

.student-detail {
  padding: 10px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
}

.detail-item .label {
  font-weight: bold;
  width: 80px;
  color: #606266;
}

.detail-item .value {
  flex: 1;
  color: #303133;
}

.form-hint {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}

.form-tip {
  margin-bottom: 20px;
}

:deep(.form-tip .el-alert) {
  margin-left: 100px;
  width: calc(100% - 100px);
}

.attendance-list {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.attendance-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.attendance-item:hover {
  background-color: #f5f7fa;
}

.attendance-item:last-child {
  border-bottom: none;
}

.attendance-content {
  flex: 1;
  margin-left: 15px;
  cursor: pointer;
}

.attendance-item .el-checkbox {
  margin-top: 6px;
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.attendance-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.attendance-info {
  margin-bottom: 16px;
}

.attendance-info p {
  margin: 6px 0;
  color: #606266;
  font-size: 15px;
  line-height: 1.6;
}

.attendance-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
  margin-top: 10px;
}

.attendance-detail {
  padding: 10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
}

.detail-item .label {
  font-weight: bold;
  width: 80px;
  color: #606266;
}

.detail-item .value {
  flex: 1;
  color: #303133;
}

.attendance-detail .table-toolbar {
  margin-bottom: 16px;
}

.attendance-detail .pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.attendance-detail .empty-search-results {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.attendance-detail .selected-students-list {
  margin-top: 20px;
  border-top: 1px solid #EBEEF5;
  padding-top: 15px;
}

.attendance-detail .selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.attendance-detail .selected-header h4 {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.attendance-detail .selected-student-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

:deep(.attendance-detail .selected-row) {
  background-color: #F0F9EB !important;
}

:deep(.attendance-detail .el-alert) {
  margin-bottom: 10px;
}

.searching-indicator {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

/* 学生选择样式 */
.student-selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.selected-count {
  font-size: 14px;
  color: #606266;
}

.student-selection-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 10px;
}

.student-selection-list .el-checkbox {
  margin-right: 15px;
  margin-bottom: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 