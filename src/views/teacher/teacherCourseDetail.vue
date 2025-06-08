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
                  <div v-for="knowledge in courseKnowledges" :key="knowledge.knowledgeId" class="knowledge-item" @click="viewKnowledgeDetail(knowledge)">
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
                      <el-button link type="primary" @click.stop="editKnowledge(knowledge)">编辑</el-button>
                      <el-button link type="danger" @click.stop="removeKnowledge(knowledge)">删除</el-button>
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
                <div class="course-description-container">
                  <div class="course-tags-container">
                    <div 
                      v-for="(tag, index) in extractTags(courseDescription)" 
                      :key="index"
                      class="rendered-tag"
                      :style="{ 
                        backgroundColor: getCategoryColor(tag) + '30', 
                        color: getCategoryColor(tag)
                      }"
                    >
                      {{ tag }}
                    </div>
                  </div>
                  <p class="course-desc">{{ formatDescription(courseDescription) || '暂无课程介绍' }}</p>
                </div>
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
                <div class="header-actions">
                  <el-button type="danger" size="small" v-if="selectedStudents.length > 0" @click="batchRemoveStudents">
                    <el-icon><Delete /></el-icon>
                    批量删除 ({{ selectedStudents.length }})
                  </el-button>
                  <el-button type="primary" size="small" @click="showAddStudentDialog">
                  <el-icon><Plus /></el-icon>
                  添加学生
                </el-button>
                </div>
              </div>
              <div class="section-body">
                <div class="table-toolbar" v-if="courseStudents.length > 0">
                  <el-input
                    v-model="studentSearchKeyword"
                    placeholder="搜索学生姓名或学号"
                    prefix-icon="Search"
                    clearable
                    @clear="handleSearchClear"
                    @input="handleSearchInput"
                    style="width: 250px;"
                  />
                </div>
                <div v-if="courseStudents.length === 0" class="empty-tip">
                  暂无学生，请点击"添加学生"按钮添加
                </div>
                <el-table
                  v-else
                  :data="filteredStudents"
                  style="width: 100%"
                  @selection-change="handleSelectionChange"
                  v-loading="isLoadingStudents"
                >
                  <el-table-column type="selection" width="55" />
                  <el-table-column prop="studentId" label="学号" width="120" />
                  <el-table-column prop="fullName" label="姓名" width="120" />
                  <el-table-column prop="email" label="邮箱" />
                  <el-table-column prop="phone" label="电话" width="120" />
                  <el-table-column prop="grade" label="年级" width="100" />
                  <el-table-column prop="className" label="班级" width="120" />
                  <el-table-column label="操作" width="150" fixed="right">
                    <template #default="scope">
                      <el-button link type="primary" @click="viewStudent(scope.row)">查看</el-button>
                      <el-button link type="danger" @click="removeStudent(scope.row)">移除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="pagination-container" v-if="courseStudents.length > pageSize">
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
          </el-tab-pane>

          <el-tab-pane label="考试管理" name="exams">
            <div class="content-section">
              <div class="section-header">
                <h3>考试列表</h3>
                <el-button type="primary" size="small" @click="showAddExamDialog">
                  <el-icon><Plus /></el-icon>
                  创建考试
                </el-button>
              </div>
              <div class="section-body">
                <div class="table-toolbar" v-if="exams.length > 0">
                  <el-input
                    v-model="examSearchKeyword"
                    placeholder="搜索考试标题或描述"
                    prefix-icon="Search"
                    clearable
                    @clear="handleExamSearchClear"
                    @input="handleExamSearchInput"
                    style="width: 250px;"
                  />
                </div>
                <div v-if="exams.length === 0" class="empty-tip">
                  暂无考试，请点击"创建考试"按钮添加
                </div>
                <el-table
                  v-else
                  :data="filteredExams"
                  style="width: 100%"
                  v-loading="isLoadingExams"
                >
                  <el-table-column prop="title" label="考试标题" min-width="180" />
                  <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                  <el-table-column prop="totalScore" label="总分" width="80" />
                  <el-table-column prop="durationMinutes" label="时长(分钟)" width="120" />
                  <el-table-column label="考试时间" width="200">
                    <template #default="scope">
                      {{ formatDate(scope.row.startTime) }} 至 {{ formatDate(scope.row.endTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="100">
                    <template #default="scope">
                      <el-tag :type="getExamStatusType(scope.row.status, scope.row, currentTime.value)">{{ getExamStatus(scope.row, currentTime.value) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="200" fixed="right">
                    <template #default="scope">
                      <el-button link type="primary" @click="viewExamScores(scope.row)">查看成绩</el-button>
                      <el-button link type="primary" @click="editExam(scope.row)">编辑</el-button>
                      <el-button link type="danger" @click="removeExam(scope.row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="pagination-container" v-if="exams.length > examPageSize">
                  <el-pagination
                    v-model:current-page="examCurrentPage"
                    v-model:page-size="examPageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredExams.length"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="作业管理" name="homework">
            <div class="content-section">
              <div class="section-header">
                <h3>作业列表</h3>
                <el-button type="primary" size="small" @click="showAddHomeworkDialog">
                  <el-icon><Plus /></el-icon>
                  创建作业
                </el-button>
              </div>
              <div class="section-body">
                <div class="table-toolbar" v-if="homeworks.length > 0">
                  <el-input
                    v-model="homeworkSearchKeyword"
                    placeholder="搜索作业标题或描述"
                    prefix-icon="Search"
                    clearable
                    @clear="handleHomeworkSearchClear"
                    @input="handleHomeworkSearchInput"
                    style="width: 250px;"
                  />
                </div>
                <div v-if="homeworks.length === 0" class="empty-tip">
                  暂无作业，请点击"创建作业"按钮添加
                </div>
                <el-table
                  v-else
                  :data="filteredHomeworks"
                  style="width: 100%"
                  v-loading="isLoadingHomeworks"
                >
                  <el-table-column prop="title" label="作业标题" min-width="180" />
                  <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                  <el-table-column prop="totalScore" label="总分" width="80" />
                  <el-table-column label="截止日期" width="180">
                    <template #default="scope">
                      {{ formatDate(scope.row.deadline) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="提交率" width="100">
                    <template #default="scope">
                      {{ scope.row.submitRate || '0%' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="100">
                    <template #default="scope">
                      <el-tag :type="getHomeworkStatusType(scope.row, currentTime.value)">{{ getHomeworkStatus(scope.row, currentTime.value) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="250" fixed="right">
                    <template #default="scope">
                      <el-button link type="primary" @click="viewHomeworkSubmissions(scope.row)">查看提交</el-button>
                      <el-button link type="primary" @click="editHomework(scope.row)">编辑</el-button>
                      <el-button link type="danger" @click="removeHomework(scope.row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="pagination-container" v-if="homeworks.length > homeworkPageSize">
                  <el-pagination
                    v-model:current-page="homeworkCurrentPage"
                    v-model:page-size="homeworkPageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredHomeworks.length"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="考勤管理" name="attendance">
            <div class="content-section">
              <div class="section-header">
                <h3>考勤列表</h3>
                <el-button type="primary" size="small" @click="showAddAttendanceDialog">
                  <el-icon><Plus /></el-icon>
                  添加考勤
                </el-button>
              </div>
              <div class="section-body">
                <div class="table-toolbar" v-if="attendances.length > 0">
                  <el-input
                    v-model="attendanceSearchKeyword"
                    placeholder="搜索考勤日期或状态"
                    prefix-icon="Search"
                    clearable
                    @clear="handleAttendanceSearchClear"
                    @input="handleAttendanceSearchInput"
                    style="width: 250px;"
                  />
                </div>
                <div v-if="attendances.length === 0" class="empty-tip">
                  暂无考勤记录，请点击"添加考勤"按钮添加
                </div>
                <div v-else class="attendance-list">
                  <div v-for="attendance in filteredAttendances" :key="attendance.attendanceId" class="attendance-item" @click="viewAttendanceDetail(attendance)">
                    <div class="attendance-header">
                      <h4>{{ formatDate(attendance.attendanceDate) }} 考勤</h4>
                      <el-tag :type="getAttendanceStatusType(attendance.status)">{{ attendance.status }}</el-tag>
                    </div>
                    <div class="attendance-info">
                      <p>出勤人数: {{ getAttendanceStats(attendance).present }} / {{ courseStudents.length }}</p>
                      <p>缺勤人数: {{ getAttendanceStats(attendance).absent }}</p>
                      <p>迟到人数: {{ getAttendanceStats(attendance).late }}</p>
                    </div>
                    <div class="attendance-actions">
                      <el-button link type="primary" @click.stop="editAttendance(attendance)">编辑</el-button>
                      <el-button link type="danger" @click.stop="removeAttendance(attendance)">删除</el-button>
                    </div>
                  </div>
                </div>
                <div class="pagination-container" v-if="attendances.length > attendancePageSize">
                  <el-pagination
                    v-model:current-page="attendanceCurrentPage"
                    v-model:page-size="attendancePageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredAttendances.length"
                  />
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
    <el-dialog v-model="addKnowledgeDialogVisible" title="知识点管理" width="600px">
      <el-tabs v-model="knowledgeDialogTab">
        <el-tab-pane label="添加已有知识点" name="add">
          <el-form label-width="100px">
            <el-form-item label="搜索知识点">
              <el-input v-model="knowledgeSearchKeyword" placeholder="输入关键词搜索知识点" clearable>
                <template #append>
                  <el-button @click="searchExistingKnowledge">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="searchExistingKnowledge">
                <el-icon><Search /></el-icon> 搜索知识点
              </el-button>
            </el-form-item>
            
            <div class="knowledge-search-results" v-if="searchedKnowledges.length > 0">
              <el-table 
                :data="searchedKnowledges" 
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
            </div>
            <div v-else-if="knowledgeSearchKeyword && !isSearching" class="empty-search-results">
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

    <!-- 添加考勤对话框 -->
    <el-dialog v-model="addAttendanceDialogVisible" :title="attendanceFormTitle" width="600px">
      <el-form :model="attendanceForm" label-width="100px" :rules="attendanceRules" ref="attendanceFormRef">
        <el-form-item label="考勤日期" prop="attendanceDate">
          <el-date-picker
            v-model="attendanceForm.attendanceDate"
            type="date"
            placeholder="选择考勤日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="考勤状态" prop="status">
          <el-select v-model="attendanceForm.status" placeholder="请选择考勤状态">
            <el-option label="进行中" value="进行中"></el-option>
            <el-option label="已结束" value="已结束"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="attendanceForm.remark" type="textarea" :rows="3" placeholder="请输入考勤备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addAttendanceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAttendance" :loading="isSavingAttendance">保存</el-button>
        </div>
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

    <!-- 添加作业对话框 -->
    <el-dialog v-model="addHomeworkDialogVisible" title="添加作业" width="600px">
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
        <el-form-item label="总分" prop="totalScore">
          <el-input-number v-model="homeworkForm.totalScore" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker
            v-model="homeworkForm.deadline"
            type="datetime"
            placeholder="选择截止日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Plus, Document, Upload, Download, Delete, Search } from '@element-plus/icons-vue'
import { courseAPI, knowledgeAPI, courseFileAPI, studentAPI, courseSelectionAPI, examAPI, attendanceAPI } from '@/api/api'
import BigNumber from 'bignumber.js'
import { getExamStatusType, getExamStatus, updateExamsStatus, formatDateTime } from '@/utils/examManager'

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

// 课程学生列表
const courseStudents = ref([])
const selectedStudents = ref([])
const currentStudent = ref(null)
const isLoadingStudents = ref(false)
const studentSearchKeyword = ref('')
const filteredStudents = computed(() => {
  if (!studentSearchKeyword.value) {
    return courseStudents.value
  }
  const keyword = studentSearchKeyword.value.toLowerCase()
  return courseStudents.value.filter(student => 
    (student.studentId && student.studentId.toString().includes(keyword)) ||
    (student.fullName && student.fullName.toLowerCase().includes(keyword)) ||
    (student.email && student.email.toLowerCase().includes(keyword)) ||
    (student.className && student.className.toLowerCase().includes(keyword)) ||
    (student.grade && student.grade.toLowerCase().includes(keyword))
  )
})

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
  totalScore: 100,
  deadline: '',
  homeworkId: null,
  type: 'homework' // 添加type字段，指定为作业类型
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

// 过滤作业列表
const filteredHomeworks = computed(() => {
  if (!homeworkSearchKeyword.value) {
    return homeworks.value
  }
  const keyword = homeworkSearchKeyword.value.toLowerCase()
  return homeworks.value.filter(homework => 
    (homework.title && homework.title.toLowerCase().includes(keyword)) ||
    (homework.description && homework.description.toLowerCase().includes(keyword))
  )
})

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
  totalScore: [
    { required: true, message: '请输入总分', trigger: 'blur' },
    { type: 'number', min: 1, message: '总分必须大于0', trigger: 'blur' }
  ],
  deadline: [
    { required: true, message: '请选择截止日期', trigger: 'change' }
  ]
}

// 获取课程作业列表
async function fetchCourseHomeworks() {
  try {
    isLoadingHomeworks.value = true
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
    console.log('获取课程作业，课程ID:', courseIdStr)
    
    // 修改为使用getExamsInCourseByType接口，指定type为'homework'
    const response = await examAPI.getExamsInCourseByType(courseIdStr, 'homework')
    console.log('获取到的作业数据:', response)
    
    if (Array.isArray(response)) {
      // 确保所有ID都是字符串形式
      homeworks.value = response.map(homework => ({
        ...homework,
        homeworkId: homework.examId ? new BigNumber(homework.examId).toString() : homework.examId
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
    totalScore: 100,
    deadline: '',
    homeworkId: null,
    type: 'homework' // 添加type字段，指定为作业类型
  }
  
  homeworkFileList.value = []
  addHomeworkDialogVisible.value = true
}

// 编辑作业
function editHomework(homework) {
  homeworkFormTitle.value = '编辑作业'
  // 填充表单数据
  homeworkForm.value = {
    title: homework.title,
    description: homework.description || '',
    totalScore: homework.totalScore,
    deadline: homework.deadline,
    homeworkId: homework.homeworkId ? new BigNumber(homework.homeworkId).toString() : homework.homeworkId,
    type: 'homework' // 确保type字段设置为作业类型
  }
  
  // 如果有附件，加载附件列表
  homeworkFileList.value = homework.attachments ? homework.attachments.map(attachment => ({
    name: attachment.fileName,
    url: attachment.fileUrl
  })) : []
  
  addHomeworkDialogVisible.value = true
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
            examId: homeworkForm.value.homeworkId,
            title: homeworkForm.value.title,
            description: homeworkForm.value.description,
            totalScore: homeworkForm.value.totalScore,
            deadline: homeworkForm.value.deadline,
            type: 'homework'
          }
          
          await examAPI.updateExam(homeworkData)
          ElMessage.success('作业更新成功')
        } else {
          // 创建新作业
          const homeworkData = {
            title: homeworkForm.value.title,
            description: homeworkForm.value.description,
            courseId: courseIdStr,
            teacherId: teacherId,
            totalScore: homeworkForm.value.totalScore,
            deadline: homeworkForm.value.deadline,
            type: 'homework'
          }
          
          await examAPI.saveExam(homeworkData)
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
function removeHomework(homework) {
  ElMessageBox.confirm(
    `确定要删除作业"${homework.title}"吗？删除后将无法恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保homeworkId是字符串形式
      const homeworkIdStr = homework.homeworkId ? new BigNumber(homework.homeworkId).toString() : homework.homeworkId
      
      await examAPI.deleteExamById(homeworkIdStr)
      
      // 重新获取作业列表
      await fetchCourseHomeworks()
      
      ElMessage.success('作业删除成功')
    } catch (error) {
      console.error('删除作业失败:', error)
      ElMessage.error('删除作业失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 查看作业提交情况
async function viewHomeworkSubmissions(homework) {
  currentHomework.value = homework
  homeworkSubmissionsDialogVisible.value = true
  
  try {
    isLoadingHomeworkSubmissions.value = true
    
    // 确保homeworkId是字符串形式
    const homeworkIdStr = homework.homeworkId ? new BigNumber(homework.homeworkId).toString() : homework.homeworkId
    
    const submissions = await examAPI.getExamStudents(homeworkIdStr)
    
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
    await examAPI.gradeExamAnswer({
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

// 获取作业状态类型
function getHomeworkStatusType(homework, now) {
  const deadline = homework.deadline ? new Date(homework.deadline) : null
  
  if (deadline) {
    if (now > deadline) {
      return 'danger' // 已截止
    } else if (now > new Date(deadline.getTime() - 24 * 60 * 60 * 1000)) {
      return 'warning' // 即将截止（24小时内）
    } else {
      return 'success' // 进行中
    }
  }
  
  return 'info' // 未知状态
}

// 获取作业状态文本
function getHomeworkStatus(homework, now) {
  const deadline = homework.deadline ? new Date(homework.deadline) : null
  
  if (deadline) {
    if (now > deadline) {
      return '已截止'
    } else if (now > new Date(deadline.getTime() - 24 * 60 * 60 * 1000)) {
      return '即将截止'
    } else {
      return '进行中'
    }
  }
  
  return '未知'
}

// 获取提交状态类型
// function getSubmissionStatusType(submission, homework) {
//   if (!submission.submitted) {
//     return 'danger' // 未提交
//   }
  
//   const deadline = homework.deadline ? new Date(homework.deadline) : null
//   const submitTime = submission.submitTime ? new Date(submission.submitTime) : null
  
//   if (deadline && submitTime) {
//     if (submitTime > deadline) {
//       return 'warning' // 逾期提交
//     } else {
//       return 'success' // 按时提交
//     }
//   }
  
//   return 'info' // 未知状态
// }

// 获取提交状态文本
function getSubmissionStatus(submission, homework) {
  if (!submission.submitted) {
    return '未提交'
  }
  
  const deadline = homework.deadline ? new Date(homework.deadline) : null
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
const isLoadingAttendances = ref(false)
const attendanceSearchKeyword = ref('')
const attendanceCurrentPage = ref(1)
const attendancePageSize = ref(10)
const attendanceStudents = ref([])
const attendanceDetailSearchKeyword = ref('')

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

// 过滤考试列表
const filteredExams = computed(() => {
  if (!examSearchKeyword.value) {
    return exams.value
  }
  const keyword = examSearchKeyword.value.toLowerCase()
  return exams.value.filter(exam => 
    (exam.title && exam.title.toLowerCase().includes(keyword)) ||
    (exam.description && exam.description.toLowerCase().includes(keyword))
  )
})

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

// // 更新考试状态的方法
// async function updateExamsStatus(exams, now) {
//   if (!exams || exams.length === 0) return true
  
//   const examUpdates = []
  
//   for (const exam of exams) {
//     const startTime = exam.startTime ? new Date(exam.startTime) : null
//     const endTime = exam.endTime ? new Date(exam.endTime) : null
//     let newStatus = null
    
//     if (startTime && endTime) {
//       // 根据当前时间判断状态
//       if (now < startTime && exam.status !== '未开始') {
//         newStatus = '未开始'
//       } else if (now >= startTime && now <= endTime && exam.status !== '进行中') {
//         newStatus = '进行中'
//       } else if (now > endTime && exam.status !== '已结束') {
//         newStatus = '已结束'
//       }
      
//       // 如果状态需要更新
//       if (newStatus && newStatus !== exam.status) {
//         examUpdates.push({
//           exam,
//           newStatus
//         })
//       }
//     }
//   }
  
//   // 批量更新考试状态
//   if (examUpdates.length > 0) {
//     try {
//       for (const update of examUpdates) {
//         const examData = {
//           examId: update.exam.examId,
//           title: update.exam.title,
//           description: update.exam.description,
//           courseId: update.exam.courseId,
//           teacherId: update.exam.teacherId,
//           totalScore: update.exam.totalScore,
//           durationMinutes: update.exam.durationMinutes,
//           startTime: update.exam.startTime,
//           endTime: update.exam.endTime,
//           status: update.newStatus
//         }
        
//         await examAPI.updateExam(examData)
        
//         // 更新本地状态
//         const index = exams.findIndex(e => e.examId === update.exam.examId)
//         if (index !== -1) {
//           exams[index].status = update.newStatus
//         }
//       }
      
//       console.log(`已自动更新 ${examUpdates.length} 个考试的状态`)
//       return true
//     } catch (error) {
//       console.error('自动更新考试状态失败:', error)
//       return false
//     }
//   }
//   return false
// }

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
    
    const response = await courseFileAPI.getCourseFiles(courseIdStr)
    console.log('获取到的课程资料:', response)
    
    if (Array.isArray(response)) {
      // 确保所有资料ID都是字符串形式
      materials.value = response.map(material => ({
        ...material,
        id: material.fileId ? new BigNumber(material.fileId).toString() : material.fileId,
        name: material.fileName
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
  
  // 重置搜索和选择状态
  knowledgeSearchKeyword.value = ''
  searchedKnowledges.value = []
  selectedKnowledges.value = []
  knowledgeDialogTab.value = 'add'
  
  addKnowledgeDialogVisible.value = true
}

// 搜索已有知识点
async function searchExistingKnowledge() {
  if (!knowledgeSearchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
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
    
    // 搜索知识点
    const results = await knowledgeAPI.getKnowledgeByTeacherId(knowledgeSearchKeyword.value, teacherId)
    
    // 过滤掉已经在课程中的知识点
    const courseKnowledgeIds = courseKnowledges.value.map(k => k.knowledgeId)
    searchedKnowledges.value = results.filter(knowledge => 
      !courseKnowledgeIds.includes(knowledge.knowledgeId)
    )
    
    if (searchedKnowledges.value.length === 0 && results.length > 0) {
      ElMessage.info('搜索到的知识点已全部在当前课程中')
    }
  } catch (error) {
    console.error('搜索知识点失败:', error)
    ElMessage.error(`搜索知识点失败: ${error.message || '请稍后重试'}`)
    searchedKnowledges.value = []
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

// 提取描述中的标签
function extractTags(description) {
  if (!description) return [];
  
  const tags = [];
  const regex = /#([^#]+)#/g;
  let match;
  
  while ((match = regex.exec(description)) !== null) {
    tags.push(match[1].trim());
  }
  
  return tags;
}

// 处理课程描述显示，去掉所有#标签#
function formatDescription(description) {
  if (!description) return '';
  
  // 去掉所有#标签#内容
  return description.replace(/#([^#]+)#/g, '').trim() || '暂无描述';
}

// 根据分类名生成确定的随机颜色
function getCategoryColor(category) {
  if (!category) return '#DCDFE6'; // 默认浅灰色
  
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
}

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
      
      // 修正API参数顺序：应该是从课程中移除学生，而不是从学生中移除课程
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
      
      // 创建FormData对象
      const formData = new FormData()
      formData.append('file', uploadForm.value.file)
      formData.append('fileName', uploadForm.value.name)
      formData.append('description', uploadForm.value.description || '')
      
      // 确保courseId是字符串形式
      const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString()
      
      // 上传文件
      await courseFileAPI.uploadCourseFile(courseIdStr, formData)
      
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
    const fileIdStr = material.id || material.fileId
    if (!fileIdStr) {
      ElMessage.error('文件ID无效，无法下载')
      return
    }
    
    // 显示下载中提示
    const loadingInstance = ElLoading.service({
      text: '文件下载中...',
      background: 'rgba(255, 255, 255, 0.7)'
    })
    
    // 获取下载链接并下载文件
    const blob = await courseFileAPI.downloadCourseFile(fileIdStr)
    
    // 检查blob是否有效
    if (!blob || blob.size === 0) {
      throw new Error('下载的文件为空或无效')
    }
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
    link.href = url
    link.download = material.name || material.fileName || `下载文件_${new Date().getTime()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    // 延迟释放URL对象，确保下载开始
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
    
    ElMessage.success('文件下载成功')
    loadingInstance.close()
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
      
      await courseFileAPI.deleteCourseFile(fileIdStr)
      
      // 重新获取课程资料列表
      await fetchCourseMaterials()
      
      ElMessage.success('资料已删除')
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

// // 获取考试状态类型
// function getExamStatusType(status, exam, now) {
//   // 根据考试的开始和结束时间自动判断状态
//   const startTime = exam ? new Date(exam.startTime) : null;
//   const endTime = exam ? new Date(exam.endTime) : null;
  
//   if (startTime && endTime) {
//     if (now < startTime) {
//       return 'info'; // 未开始
//     } else if (now >= startTime && now <= endTime) {
//       return 'warning'; // 进行中
//     } else if (now > endTime) {
//       return 'success'; // 已结束
//     }
//   }
  
//   // 如果无法判断，则使用数据库中存储的状态
//   switch(status) {
//     case '未开始':
//       return 'info'
//     case '进行中':
//       return 'warning'
//     case '已结束':
//       return 'success'
//     default:
//       return 'info'
//   }
// }

// // 获取考试状态文本
// function getExamStatus(exam) {
//   const now = currentTime.value;
//   const startTime = exam ? new Date(exam.startTime) : null;
//   const endTime = exam ? new Date(exam.endTime) : null;
  
//   if (startTime && endTime) {
//     if (now < startTime) {
//       return '未开始';
//     } else if (now >= startTime && now <= endTime) {
//       return '进行中';
//     } else if (now > endTime) {
//       return '已结束';
//     }
//   }
  
//   // 如果无法判断，则使用数据库中存储的状态
//   return exam.status || '未知';
// }

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
        description: response.description || ''
      }
      
      console.log('课程数据加载成功:', response)
      
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
const attendanceForm = ref({
  attendanceDate: '',
  status: '进行中',
  remark: ''
})
const attendanceFormTitle = ref('添加考勤')
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

// 保存考勤
async function saveAttendance() {
  attendanceFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        isSavingAttendance.value = true
        // 确保courseId是字符串形式
        const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString()
        
        // 创建考勤数据对象
        const attendanceData = {
          courseId: courseIdStr,
          attendanceDate: attendanceForm.value.attendanceDate,
          status: attendanceForm.value.status,
          remark: attendanceForm.value.remark || ''
        }
        
        // 提交数据到API
        await attendanceAPI.saveAttendance(attendanceData)
        
        // 重新获取考勤列表
        await fetchCourseAttendances()
        
        ElMessage.success('添加考勤成功')
        addAttendanceDialogVisible.value = false
      } catch (error) {
        console.error('添加考勤失败:', error)
        ElMessage.error('添加考勤失败，请稍后重试')
      } finally {
        isSavingAttendance.value = false
      }
    } else {
      return false
    }
  })
}

// 编辑考勤
function editAttendance(attendance) {
  // 这里可以实现编辑考勤的功能
  // 可以复用添加考勤的对话框，只需要预填充表单数据
  attendanceForm.value = {
    attendanceDate: attendance.attendanceDate,
    status: attendance.status,
    remark: attendance.remark
  }
  
  addAttendanceDialogVisible.value = true
  ElMessage.info('请在表单中修改考勤信息后点击确认')
}

// 删除考勤
function removeAttendance(attendance) {
  ElMessageBox.confirm(
    `确定要删除考勤"${attendance.attendanceDate}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保courseId和attendanceId都是字符串形式
      const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
      const attendanceIdStr = attendance.attendanceId ? new BigNumber(attendance.attendanceId).toString() : attendance.attendanceId;
      
      await courseSelectionAPI.deleteAttendanceById(courseIdStr, attendanceIdStr)
      // 重新获取考勤列表
      await fetchCourseAttendances()
      ElMessage.success('考勤删除成功')
    } catch (error) {
      console.error('删除考勤失败:', error)
      ElMessage.error('删除考勤失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 根据考勤状态获取标签类型
function getAttendanceStatusType(status) {
  switch(status) {
    case '进行中':
      return 'warning'
    case '已结束':
      return 'success'
    default:
      return 'info'
  }
}

// 获取考勤列表
async function fetchCourseAttendances() {
  try {
    isLoadingAttendances.value = true
    // 确保courseId是字符串形式
    const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
    console.log('获取考勤列表，课程ID:', courseIdStr)
    
    // 调用API获取课程考勤数据
    const response = await attendanceAPI.getCourseAttendance(courseIdStr);
    console.log('获取到的考勤数据:', response);
    
    if (Array.isArray(response)) {
      // 确保所有ID都是字符串形式
      attendances.value = response.map(attendance => ({
        ...attendance,
        attendanceId: attendance.attendanceId ? new BigNumber(attendance.attendanceId).toString() : attendance.attendanceId,
        courseId: attendance.courseId ? new BigNumber(attendance.courseId).toString() : attendance.courseId,
        recordedBy: attendance.recordedBy ? new BigNumber(attendance.recordedBy).toString() : attendance.recordedBy
      }));
    } else {
      attendances.value = []
    }
  } catch (error) {
    console.error('获取考勤列表失败:', error)
    ElMessage.error('获取考勤列表失败，请稍后重试')
    attendances.value = []
  } finally {
    isLoadingAttendances.value = false
  }
}

// 显示添加考勤对话框
function showAddAttendanceDialog() {
  // 重置表单
  attendanceForm.value = {
    attendanceDate: new Date().toISOString().split('T')[0], // 今天的日期
    status: '进行中',
    remark: ''
  }
  attendanceFormTitle.value = '添加考勤'
  addAttendanceDialogVisible.value = true
}

// 查看考勤详情
async function viewAttendanceDetail(attendance) {
  currentAttendance.value = attendance
  attendanceDetailDialogVisible.value = true
}

// 更新学生考勤状态
function updateStudentAttendanceStatus(row) {
  // 这里可以实现更新学生考勤状态的功能
  // 可以复用添加考勤的对话框，只需要预填充表单数据
  attendanceForm.value = {
    attendanceDate: currentAttendance.value.attendanceDate,
    status: row.attendanceStatus,
    remark: currentAttendance.value.remark
  }
  
  addAttendanceDialogVisible.value = true
  ElMessage.info('请在表单中修改考勤信息后点击确认')
}

// 更新学生考勤备注
function updateStudentAttendanceRemark(row) {
  // 这里可以实现更新学生考勤备注的功能
  // 可以复用添加考勤的对话框，只需要预填充表单数据
  attendanceForm.value = {
    attendanceDate: currentAttendance.value.attendanceDate,
    status: currentAttendance.value.status,
    remark: row.remark
  }
  
  addAttendanceDialogVisible.value = true
  ElMessage.info('请在表单中修改考勤信息后点击确认')
}

// 结束考勤
function finishAttendance() {
  ElMessageBox.confirm(
    `确定要结束考勤"${currentAttendance.value.attendanceDate}"吗？`,
    '结束确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 确保courseId和attendanceId都是字符串形式
      const courseIdStr = courseId ? new BigNumber(courseId).toString() : courseId.toString();
      const attendanceIdStr = currentAttendance.value.attendanceId ? new BigNumber(currentAttendance.value.attendanceId).toString() : currentAttendance.value.attendanceId;
      
      await courseSelectionAPI.finishAttendance(courseIdStr, attendanceIdStr)
      // 重新获取考勤列表
      await fetchCourseAttendances();
      
      ElMessage.success('考勤已结束');
      attendanceDetailDialogVisible.value = false;
    } catch (error) {
      console.error('结束考勤失败:', error);
      ElMessage.error('结束考勤失败，请稍后重试');
    }
  }).catch(() => {
    // 用户取消结束
  })
}

// 过滤考勤列表
const filteredAttendances = computed(() => {
  if (!attendanceSearchKeyword.value) {
    return attendances.value
  }
  const keyword = attendanceSearchKeyword.value.toLowerCase()
  return attendances.value.filter(attendance => 
    (attendance.attendanceDate && attendance.attendanceDate.toLowerCase().includes(keyword)) ||
    (attendance.status && attendance.status.toLowerCase().includes(keyword))
  )
})

// 获取考勤统计数据
function getAttendanceStats(attendance) {
  // 根据考勤数据统计学生出勤情况
  
  // 如果考勤记录中有学生考勤状态数据
  if (attendance.studentRecords && Array.isArray(attendance.studentRecords)) {
    const present = attendance.studentRecords.filter(record => record.status === '出勤').length;
    const absent = attendance.studentRecords.filter(record => record.status === '缺勤').length;
    const late = attendance.studentRecords.filter(record => record.status === '迟到').length;
    
    return {
      present,
      absent,
      late
    };
  } else {
    // 如果考勤记录中没有详细的学生考勤状态，则使用考勤记录上的汇总数据
    if (attendance.presentCount !== undefined && 
        attendance.absentCount !== undefined && 
        attendance.lateCount !== undefined) {
      return {
        present: attendance.presentCount,
        absent: attendance.absentCount,
        late: attendance.lateCount
      };
    }
    
    // 如果没有任何统计数据，则显示总人数和0
    return {
      present: 0,
      absent: 0,
      late: 0
    };
  }
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

// 考勤表单验证规则
const attendanceRules = {
  attendanceDate: [
    { required: true, message: '请选择考勤日期', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择考勤状态', trigger: 'change' }
  ]
}
</script>

<style scoped>
.course-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  margin-top: 20px;
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
  align-items: center;
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
</style> 