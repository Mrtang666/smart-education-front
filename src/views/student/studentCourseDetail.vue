<!-- /**
 * 学生首页组件
 * 
 * 该组件展示学生在该课程中的学习进度，课程知识点总览，课程考试和作业和课程考勤
 * 所有数据均通过后端API获取，不使用模拟数据
 * 
 * API依赖:
 * - learningProgressAPI: 获取学生学习进度
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
    </div>
    
    <!-- 右侧内容区 -->
    <div class="content-area">
      <!-- 顶部筛选栏 -->
      <div class="filter-bar" v-if="showFilterBar">
        <div class="filter-label">筛选：</div>
        <el-radio-group v-model="filterType" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
          <el-radio-button label="uncompleted">未完成</el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- 内容区域 -->
      <div class="section-content">
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
                    :class="{ 'knowledge-card-completed': point.completed }"
                    @click="handleKnowledgeCardClick(point)">
                  <div class="knowledge-card-header">
                    <div class="knowledge-card-icon" :style="{ backgroundColor: getKnowledgeDifficultyColor(point.difficultyLevel) }">
                      {{ getKnowledgeIcon(point) }}
                    </div>
                    <div class="knowledge-card-status">
                      <el-tag v-if="point.completed" size="small" type="success">已完成</el-tag>
                      <el-tag v-else size="small" type="info">未完成</el-tag>
                    </div>
                  </div>
                  <div class="knowledge-card-content">
                    <h4 class="knowledge-card-title">{{ point.name }}</h4>
                    <p class="knowledge-card-desc">{{ point.description || '暂无描述' }}</p>
                  </div>
                  <div class="knowledge-card-footer">
                    <el-button type="primary" size="small" plain @click.stop="startLearning(point)">开始学习</el-button>
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
          <el-skeleton :loading="assignmentsLoading" animated :rows="3">
            <template #default>
              <el-empty v-if="filteredAssignments.length === 0" description="暂无作业数据"></el-empty>
              <el-table v-else :data="filteredAssignments" style="width: 100%">
                <el-table-column prop="title" label="作业名称" width="250"></el-table-column>
                <el-table-column prop="deadline" label="截止日期" width="180"></el-table-column>
                <el-table-column prop="status" label="状态" width="120">
                  <template #default="scope">
                    <el-tag :type="getAssignmentTagType(scope.row.status)">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" type="primary" @click="viewAssignment(scope.row)">查看</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-skeleton>
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
      </div>
    </div>
  </div>
</template>

<script>
import { knowledgeAPI, examAPI, attendanceAPI, docAPI } from '@/api/api';
import { getUserInfo } from '@/utils/auth';

export default {
  name: 'StudentCourseDetail',
  data() {
    return {
      courseId: null,
      courseName: '',
      courseCode: '',
      courseCategory: '',
      
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
          // 添加前端需要的属性
          completed: false // 默认未完成，实际应从API获取完成状态
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
    
    // 获取作业
    fetchAssignments() {
      // 设置加载状态
      this.assignmentsLoading = true;
      
      // 调用考试API获取作业类型的数据
      examAPI.getExamsInCourseByType(this.courseId, 'homework')
        .then(response => {
          if (Array.isArray(response)) {
            // 处理作业数据
            this.assignments = response.map(item => {
              return {
                id: item.examId,
                title: item.title,
                deadline: this.formatDateTime(item.endTime),
                status: this.getAssignmentStatus(item),
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
          console.error('获取作业数据失败:', error);
          this.$message.error('获取作业数据失败，请稍后再试');
        })
        .finally(() => {
          this.assignmentsLoading = false;
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
    
    // 开始学习
    startLearning(point) {
      // 复用知识点点击的逻辑，都跳转到知识点详情页面
      this.handleKnowledgeCardClick(point);
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
        this.$message.error('获取文档列表失败，请稍后再试');
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
  text-align: right;
  margin-top: auto;
}

.knowledge-card-footer .el-button {
  padding: 6px 12px;
  font-size: 12px;
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
</style>