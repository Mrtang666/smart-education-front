<template>
    <div class="exercise-container">
        <div class="header-row">
            <h2 class="section-title">作业管理</h2>

            <!-- 搜索和操作栏 -->
            <div class="action-bar">
                <div class="search-area">
                    <el-select v-model="selectedCourseId" placeholder="选择课程" @change="handleCourseSelect"
                        class="course-select">
                        <el-option label="全部课程" value="" />
                        <el-option v-for="course in courseList" :key="course.id" :label="course.name"
                            :value="course.id" />
                    </el-select>
                    <el-select v-if="selectedCourseId" v-model="selectedHomeworkId" placeholder="选择作业"
                        @change="handleHomeworkSelect" class="homework-select">
                        <el-option label="全部作业" value="" />
                        <el-option v-for="homework in courseHomeworks" :key="homework.assignmentId" :label="homework.title"
                            :value="homework.assignmentId" />
                    </el-select>
                    <el-input v-model="searchKeyword" placeholder="搜索作业" class="search-input" @input="handleSearch">
                        <template #suffix>
                            <el-icon class="search-icon">
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                </div>
                <div class="action-buttons">
                    <el-button type="primary" @click="showCreateDialog">
                        <el-icon>
                            <Plus />
                        </el-icon>新建作业
                    </el-button>
                </div>
            </div>
        </div>

        <!-- 数据统计图表区域 -->
        <div v-if="!selectedCourseId" class="charts-container">
            <div class="chart-wrapper full-width">
                <div id="courseHomeworkChart" class="chart"></div>
            </div>
        </div>

        <!-- 课程作业统计图表区域 -->
        <div v-if="selectedCourseId" class="charts-container">
            <div class="chart-wrapper">
                <div id="scoreDistributionChart" class="chart"></div>
            </div>
            <div class="chart-wrapper">
                <div id="submissionRateChart" class="chart"></div>
            </div>
        </div>

        <!-- 作业详情区域 -->
        <div v-if="selectedCourseId && selectedHomeworkId && selectedHomework" class="homework-detail-container">
            <h3 class="detail-title">作业详情</h3>
            <el-descriptions :column="2" border>
                <el-descriptions-item label="作业标题">{{ selectedHomework.title }}</el-descriptions-item>
                <el-descriptions-item label="作业状态">
                    <el-tag :type="getStatusType(selectedHomework.status)" effect="dark">
                        <el-icon v-if="selectedHomework.status === 'DRAFT' || selectedHomework.status === '未开始' || selectedHomework.status === '未设置截止日期'">
                            <Calendar />
                        </el-icon>
                        <el-icon v-else-if="selectedHomework.status === 'PUBLISHED' || selectedHomework.status === '进行中' || selectedHomework.status === '即将截止'">
                            <Loading />
                        </el-icon>
                        <el-icon v-else-if="selectedHomework.status === 'ENDED' || selectedHomework.status === '已截止'">
                            <Timer />
                        </el-icon>
                        {{ getStatusText(selectedHomework.status) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="截止时间">
                    {{ formatDateTimeLocal(selectedHomework.endTime) || '未设置截止时间' }}
                </el-descriptions-item>
                <el-descriptions-item label="总分">
                    {{ selectedHomework.totalScore }}分
                </el-descriptions-item>
                <el-descriptions-item label="描述" :span="2">
                    {{ selectedHomework.description || '暂无描述' }}
                </el-descriptions-item>
            </el-descriptions>

            <div class="detail-actions">
                <el-button type="primary" @click.stop="editHomework(selectedHomework)">
                    <el-icon>
                        <View />
                    </el-icon>查看详情
                </el-button>
            </div>
        </div>

        <!-- 作业列表 -->
        <div v-if="!selectedCourseId || (selectedCourseId && !selectedHomeworkId)" v-loading="loading"
            class="homework-table-container">
            <div v-if="loading" class="loading-container">
                <el-skeleton :rows="5" animated />
            </div>
            <div v-else-if="homeworkList.length === 0" class="empty-container">
                <el-empty description="暂无作业" />
            </div>
            <div v-else>
                <el-table :data="homeworkList" style="width: 100%" border stripe
                    :header-cell-style="{ background: '#f5f7fa' }">
                    <el-table-column prop="title" label="作业标题" min-width="180" />
                    <el-table-column prop="description" label="描述" min-width="200">
                        <template #default="scope">
                            {{ scope.row.description || '暂无描述' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="totalScore" label="总分" width="80" />
                    <el-table-column label="截止日期" min-width="180">
                        <template #default="scope">
                            {{ formatDateTimeLocal(scope.row.endTime) || '未设置截止时间' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="所属课程" min-width="150" v-if="!selectedCourseId">
                        <template #default="scope">
                            <el-button link type="primary" @click="goToCourseDetail(scope.row.courseId)">
                                {{ getCourseNameById(scope.row.courseId) }}
                            </el-button>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="140">
                        <template #default="scope">
                            <el-tag :type="getStatusType(scope.row.status)" effect="dark">
                                <el-icon v-if="scope.row.status === '未开始' || scope.row.status === '未设置截止日期'">
                                    <Calendar />
                                </el-icon>
                                <el-icon v-else-if="scope.row.status === '进行中' || scope.row.status === '即将截止'">
                                    <Loading />
                                </el-icon>
                                <el-icon v-else-if="scope.row.status === '已截止'">
                                    <Timer />
                                </el-icon>
                                {{ getHomeworkStatusDescription(scope.row) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" fixed="right">
                        <template #default="scope">
                            <el-button type="primary" link @click.stop="editHomework(scope.row)">
                                <el-icon>
                                    <View />
                                </el-icon>查看详情
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 分页 -->
                <div class="pagination-container" v-if="homeworkList.length > 0">
                    <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize"
                        :current-page="currentPage" @current-change="handlePageChange" />
                </div>
            </div>
        </div>

        <!-- 创建/编辑作业对话框 -->
        <el-dialog v-model="dialogVisible" :title="homeworkFormTitle" width="600px"
            :close-on-click-modal="false">
            <el-form :model="homeworkForm" :rules="rules" ref="homeworkFormRef" label-width="100px">
                <el-form-item label="作业标题" prop="title">
                    <el-input v-model="homeworkForm.title" placeholder="请输入作业标题" />
                </el-form-item>
                <el-form-item label="所属课程" prop="courseId">
                    <el-select v-model="homeworkForm.courseId" placeholder="请选择课程" style="width: 100%">
                        <el-option v-for="course in courseList" :key="course.id" :label="course.name"
                            :value="course.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="总分" prop="totalScore">
                    <el-input-number v-model="homeworkForm.totalScore" :min="1" :max="100" />
                    <span class="unit-label">分</span>
                </el-form-item>
                <el-form-item label="截止日期" prop="endTime">
                    <el-date-picker
                        v-model="homeworkForm.endTime"
                        type="datetime"
                        placeholder="选择截止日期"
                        format="YYYY-MM-DD HH:mm"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        :disabledDate="disablePastDates"
                        :shortcuts="dateShortcuts"
                        style="width: 100%" />
                    <div class="form-tip">设置截止日期后，学生将在此日期前提交作业</div>
                </el-form-item>

                <!-- 状态由系统自动判定，不需要用户手动设置 -->
                <el-form-item label="作业附件">
                    <el-upload
                        action="/api/upload"
                        :auto-upload="true"
                        :file-list="homeworkFileList"
                        :limit="5"
                        :on-success="handleFileUploadSuccess"
                        :on-error="handleFileUploadError"
                        :on-remove="handleFileRemove"
                        :on-exceed="handleFileExceed"
                        :headers="uploadHeaders"
                        multiple
                        list-type="text">
                        <el-button type="primary">选择文件</el-button>
                        <template #tip>
                            <div class="upload-tip">可上传作业附件，最多5个文件，支持常见文档格式</div>
                        </template>
                    </el-upload>
                </el-form-item>
                
                <!-- 作业设置 -->
                <el-form-item label="答案公开" prop="isAnswerPublic">
                    <el-switch 
                        v-model="homeworkForm.isAnswerPublic" 
                        active-text="公开" 
                        inactive-text="不公开" />
                    <div class="form-tip">设置作业完成后是否向学生公开标准答案</div>
                </el-form-item>
                
                <el-form-item label="分数可见" prop="isScoreVisible">
                    <el-switch 
                        v-model="homeworkForm.isScoreVisible" 
                        active-text="可见" 
                        inactive-text="不可见" />
                    <div class="form-tip">设置学生是否可以查看自己的作业分数</div>
                </el-form-item>
                
                <el-form-item label="允许重做" prop="isRedoAllowed">
                    <el-switch 
                        v-model="homeworkForm.isRedoAllowed" 
                        active-text="允许" 
                        inactive-text="不允许" />
                    <div class="form-tip">设置学生是否可以重新提交作业</div>
                </el-form-item>
                
                <el-form-item label="最大尝试次数" prop="maxAttempts" v-if="homeworkForm.isRedoAllowed">
                    <el-input-number 
                        v-model="homeworkForm.maxAttempts" 
                        :min="1" 
                        :max="10" 
                        :step="1" />
                    <span class="unit-label">次</span>
                    <div class="form-tip">学生可以尝试提交作业的最大次数</div>
                </el-form-item>
                
                <el-form-item label="描述" prop="description">
                    <el-input v-model="homeworkForm.description" type="textarea" :rows="3" placeholder="请输入作业描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitHomework">确认</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { assignmentAPI, courseAPI } from '@/api/api'
import { Plus, Search, Timer, Calendar, Loading, View } from '@element-plus/icons-vue'
import { getUserInfo } from '@/utils/auth'
import { useRouter } from 'vue-router'
import { formatDateTime } from '@/utils/examManager'

// 初始化路由
const router = useRouter()

// 用户信息
const userInfo = getUserInfo()
const teacherId = userInfo ? (userInfo.teacherId || userInfo.studentId || userInfo.id) : null

// 根据用户角色自动判定作业类型
const getAssignmentTypeByUserRole = () => {
    // 在教师页面，默认为教师布置类型
    // 如果需要支持学生上传类型，可以根据具体业务逻辑判断
    return 'TEACHER_ASSIGNED'
}

// 课程和作业列表
const courseList = ref([])
const selectedCourseId = ref('')
const courseHomeworks = ref([])
const homeworkList = ref([])
const loading = ref(false)
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchKeyword = ref('')
const selectedHomeworkId = ref('')
const allHomeworks = ref([])
const selectedHomework = ref(null)

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const homeworkFormRef = ref(null)
const homeworkForm = ref({
    title: '',
    description: '',
    courseId: '',
    teacherId: teacherId,
    totalScore: 100,
    endTime: '',
    status: 'DRAFT',
    type: getAssignmentTypeByUserRole() // 根据用户角色自动判定
})
const homeworkFormTitle = ref('创建作业')
const homeworkFileList = ref([])

// 表单验证规则
const rules = {
    title: [
        { required: true, message: '请输入作业标题', trigger: 'blur' },
        { min: 2, max: 50, message: '标题长度应在2-50个字符之间', trigger: 'blur' }
    ],
    courseId: [
        { required: true, message: '请选择所属课程', trigger: 'change' }
    ],
    totalScore: [
        { required: true, message: '请输入总分', trigger: 'blur' },
        { type: 'number', min: 1, max: 100, message: '总分应在1-100之间', trigger: 'blur' }
    ],
    endTime: [
        { required: false, message: '请选择截止日期', trigger: 'change' },
        {
            validator: (rule, value, callback) => {
                if (value) {
                    const now = new Date();
                    const deadline = new Date(value);
                    
                    // 如果选择的截止日期是过去的日期，给出警告
                    if (deadline < now) {
                        callback(new Error('截止日期不能早于当前时间'));
                    } else {
                        callback();
                    }
                } else {
                    // 如果没有设置截止日期，视为有效
                    callback();
                }
            },
            trigger: 'change'
        }
    ],
    // status 由系统自动判定，不需要验证
    isAnswerPublic: [
        { required: true, message: '请选择是否公开答案', trigger: 'change' }
    ],
    isScoreVisible: [
        { required: true, message: '请选择是否显示分数', trigger: 'change' }
    ],
    isRedoAllowed: [
        { required: true, message: '请选择是否允许重做', trigger: 'change' }
    ],
    maxAttempts: [
        { required: true, message: '请输入最大尝试次数', trigger: 'blur' },
        { type: 'number', min: 1, max: 10, message: '最大尝试次数应在1-10之间', trigger: 'blur' }
    ],
    description: [
        { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
    ]
}

// 添加自动更新作业状态的功能
const currentTime = ref(new Date())
let timeInterval = null

// 在组件挂载时设置定时器
onMounted(async () => {
    console.log('作业管理页面组件挂载')
    
    // 先加载课程列表
    try {
        await loadCourses()
        console.log('课程列表加载完成:', courseList.value)
    } catch (error) {
        console.error('加载课程列表失败:', error)
    }
    
    // 然后加载作业列表
    try {
        await loadHomeworks()
        console.log('作业列表加载完成:', homeworkList.value)
    } catch (error) {
        console.error('加载作业列表失败:', error)
    }
    
    // 等待DOM更新后初始化图表
    nextTick(() => {
        console.log('初始化图表')
        initCharts()
    })
    
    // 设置定时器，每分钟更新一次当前时间和作业状态
    timeInterval = setInterval(() => {
        currentTime.value = new Date()
        
        // 更新作业状态
        homeworkList.value.forEach(homework => {
            if (!homework.endTime) {
                homework.status = 'DRAFT'
                return
            }
            
            const deadline = new Date(homework.endTime)
            const now = currentTime.value
            
            if (now > deadline && homework.status !== 'ENDED') {
                homework.status = 'ENDED'
                console.log(`作业状态已更新: ${homework.title} 已截止`)
            } else if (now <= deadline) {
                // 计算剩余时间
                const timeRemaining = deadline.getTime() - now.getTime()
                const hoursRemaining = timeRemaining / (1000 * 60 * 60)
                
                if (hoursRemaining <= 24 && homework.status !== 'PUBLISHED') {
                    homework.status = 'PUBLISHED'
                    console.log(`作业状态已更新: ${homework.title} 即将截止，剩余${Math.round(hoursRemaining)}小时`)
                } else if (hoursRemaining > 24 && homework.status !== 'PUBLISHED') {
                    homework.status = 'PUBLISHED'
                    console.log(`作业状态已更新: ${homework.title} 进行中`)
                }
            }
        })
    }, 60000) // 每分钟更新一次
})

// 在组件卸载时清除定时器
onUnmounted(() => {
    if (timeInterval) {
        clearInterval(timeInterval)
    }
})

// 跳转到课程详情页面
const goToCourseDetail = (courseId) => {
    if (!courseId) return
    router.push(`/teacher/course/${courseId}`)
}

// 加载课程列表
const loadCourses = async () => {
    try {
        const res = await courseAPI.getAllCourses()
        courseList.value = res
    } catch (error) {
        console.error('加载课程失败:', error)
        ElMessage.error('加载课程列表失败')
    }
}

// 加载作业列表
const loadHomeworks = async () => {
    loading.value = true
    try {
        console.log('=== 开始加载作业列表 ===')
        console.log('用户信息:', userInfo)
        console.log('教师ID:', teacherId)

        // 检查token
        const token = localStorage.getItem('token')
        console.log('Token存在:', !!token)
        console.log('Token长度:', token ? token.length : 0)
        if (token) {
            console.log('Token前10位:', token.substring(0, 10))
        }

        // 确保teacherId是有效的
        if (!teacherId) {
            console.error('教师ID不存在')
            console.error('完整用户信息:', JSON.stringify(userInfo, null, 2))
            ElMessage.error('无法获取教师信息，请重新登录')
            loading.value = false
            return
        }

        console.log('正在获取教师作业，教师ID:', teacherId, '类型: homework')

        // 先尝试获取所有作业（不限类型）
        console.log('尝试获取所有作业（不限类型）...')
        let allAssignments = await assignmentAPI.getAssignmentsByCreatorId(teacherId)
        console.log('获取到的所有作业数据:', allAssignments)

        // 根据用户状态决定type参数
        // 教师状态使用 TEACHER_ASSIGNED，学生状态使用 ASSIGNMENT_UPLOAD
        const assignmentType = 'TEACHER_ASSIGNED' // 教师页面使用教师分配类型
        console.log('尝试获取指定类型作业，类型:', assignmentType)
        let res = await assignmentAPI.getAssignmentsByCreatorIdAndType(teacherId, assignmentType)
        console.log('获取到的指定类型作业数据:', res)

        // 如果指定类型作业为空，使用所有作业并过滤
        if (!Array.isArray(res) || res.length === 0) {
            console.log('指定类型作业为空，使用所有作业数据')
            res = allAssignments || []

            // 手动过滤教师分配的作业类型
            if (Array.isArray(res)) {
                res = res.filter(assignment =>
                    assignment.type === 'TEACHER_ASSIGNED' ||
                    assignment.type === 'homework' ||
                    assignment.type === 'assignment' ||
                    (assignment.type && assignment.type.includes('TEACHER_ASSIGNED')) ||
                    !assignment.type // 如果没有type字段，也包含进来
                )
                console.log('过滤后的作业数据:', res)
            }
        }

        // 确保返回数组格式
        if (!Array.isArray(res)) {
            console.log('作业数据格式异常，使用空数组')
            res = []
        }

        console.log('最终作业数据数量:', res.length)

        // 字段映射：将assignmentAPI的字段映射为页面期望的字段
        res = res.map(assignment => ({
            ...assignment,
            // 确保ID字段统一 - 作业管理页面使用assignmentId
            assignmentId: assignment.assignmentId || assignment.id,
            // 确保其他必要字段存在
            title: assignment.title || assignment.name || '未命名作业',
            description: assignment.description || '',
            totalScore: assignment.totalScore || assignment.score || 0,
            endTime: assignment.endTime || assignment.deadline,
            courseId: assignment.courseId || assignment.course_id,
            teacherId: assignment.creatorId || assignment.teacherId,
            // 保持原有字段
            type: assignment.type || 'TEACHER_ASSIGNED' // 使用原始类型或默认为教师分配类型
        }))

        // 存储所有作业供下拉框使用
        allHomeworks.value = res

        // 如果有搜索关键词，进行过滤
        if (searchKeyword.value && res) {
            res = res.filter(homework =>
                homework.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
                (homework.description && homework.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
            )
        }

        // 更新状态 - 根据截止时间判断作业状态
        const now = new Date()
        res.forEach(homework => {
            if (!homework.endTime) {
                homework.status = 'DRAFT'
                return
            }
            
            const deadline = new Date(homework.endTime)
            
            if (now > deadline) {
                homework.status = 'ENDED'
            } else {
                // 计算剩余时间
                const timeRemaining = deadline.getTime() - now.getTime()
                const hoursRemaining = timeRemaining / (1000 * 60 * 60)
                
                if (hoursRemaining <= 24) {
                    homework.status = 'PUBLISHED'
                } else {
                    homework.status = 'PUBLISHED'
                }
            }
        })

        total.value = res.length

        // 分页处理
        const startIndex = (currentPage.value - 1) * pageSize.value
        const endIndex = startIndex + pageSize.value
        homeworkList.value = res.slice(startIndex, endIndex)

        // 重新初始化图表
        nextTick(() => {
            initCharts()
        })
    } catch (error) {
        console.error('=== 加载作业失败详细信息 ===')
        console.error('错误对象:', error)
        console.error('错误消息:', error.message)

        if (error.response) {
            console.error('HTTP状态码:', error.response.status)
            console.error('响应数据:', error.response.data)
            console.error('响应头:', error.response.headers)

            if (error.response.status === 401) {
                ElMessage.error('认证失败，请重新登录')
                // 可以在这里跳转到登录页
            } else if (error.response.status === 403) {
                ElMessage.error('权限不足，无法访问作业数据')
            } else if (error.response.status === 404) {
                ElMessage.error('API接口不存在')
            } else {
                ElMessage.error(`加载作业列表失败: ${error.response.data?.message || error.message}`)
            }
        } else if (error.request) {
            console.error('请求对象:', error.request)
            ElMessage.error('网络请求失败，请检查网络连接')
        } else {
            ElMessage.error(`加载作业列表失败: ${error.message}`)
        }

        homeworkList.value = []
    } finally {
        loading.value = false
    }
}

// 初始化图表
const initCharts = () => {
    const echarts = window.echarts
    if (!echarts) {
        console.error('echarts 未加载')
        return
    }

    // 课程作业数量分布图表
    const courseHomeworkChart = echarts.init(document.getElementById('courseHomeworkChart'))
    
    // 准备图表数据
    const chartData = []
    
    // 使用实际数据：计算每个课程的作业数量
    if (courseList.value.length > 0 && allHomeworks.value.length > 0) {
        // 创建一个映射来统计每个课程的作业数量
        const courseHomeworkCounts = {}
        
        // 初始化每个课程的作业计数为0
        courseList.value.forEach(course => {
            courseHomeworkCounts[course.id] = 0
        })
        
        // 统计每个课程的作业数量
        allHomeworks.value.forEach(homework => {
            if (homework.courseId && courseHomeworkCounts[homework.courseId] !== undefined) {
                courseHomeworkCounts[homework.courseId]++
            }
        })
        
        // 转换为图表所需的数据格式
        courseList.value.forEach(course => {
            chartData.push({
                name: course.name,
                value: courseHomeworkCounts[course.id]
            })
        })
    }
    
    // 如果没有数据，显示暂无数据
    if (chartData.length === 0 || chartData.every(item => item.value === 0)) {
        chartData.push({ name: '暂无数据', value: 1 })
    }
    
    courseHomeworkChart.setOption({
        title: {
            text: '各课程作业数量分布',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            type: 'scroll',
            orient: 'horizontal',
            bottom: 10,
            data: chartData.map(item => item.name)
        },
        series: [
            {
                name: '作业数量',
                type: 'pie',
                radius: ['30%', '60%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{b}: {c} ({d}%)'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '14',
                        fontWeight: 'bold'
                    }
                },
                data: chartData
            }
        ]
    })

    // 监听窗口大小变化，重绘图表
    window.addEventListener('resize', () => {
        courseHomeworkChart.resize()
    })
}

// 初始化课程作业图表
const initCourseCharts = async () => {
    const echarts = window.echarts
    if (!echarts) {
        console.error('echarts 未加载')
        return
    }

    // 学生成绩分布图表
    const scoreChart = echarts.init(document.getElementById('scoreDistributionChart'))
    
    // 成绩区间
    const scoreRanges = ['0-60', '60-70', '70-80', '80-90', '90-100']
    const scoreData = [0, 0, 0, 0, 0]
    
    try {
        // 如果有选中的作业，获取该作业的成绩数据
        if (selectedHomeworkId.value) {
            // 这里可以调用API获取作业成绩数据
            // 例如: const homeworkScores = await examAPI.getExamScores(selectedHomeworkId.value)
            
            // 由于目前没有直接获取作业成绩分布的API，这里先使用模拟数据
            // 实际项目中应替换为真实API调用
            const homeworkScores = [65, 72, 85, 92, 78, 55, 68, 75, 88, 95, 82, 76, 91, 63, 79]
            
            // 统计各分数段的学生人数
            homeworkScores.forEach(score => {
                if (score < 60) scoreData[0]++
                else if (score < 70) scoreData[1]++
                else if (score < 80) scoreData[2]++
                else if (score < 90) scoreData[3]++
                else scoreData[4]++
            })
        }
    } catch (error) {
        console.error('获取作业成绩数据失败:', error)
    }
    
    scoreChart.setOption({
        title: {
            text: '学生成绩分布',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
            type: 'category',
            data: scoreRanges
        },
        yAxis: {
            type: 'value',
            name: '学生人数'
        },
        series: [
            {
                name: '学生人数',
                type: 'bar',
                data: scoreData,
                itemStyle: {
                    color: function (params) {
                        const colorList = ['#FF4D4F', '#FAAD14', '#1890FF', '#52C41A', '#722ED1']
                        return colorList[params.dataIndex]
                    }
                }
            }
        ]
    })

    // 提交率图表
    const submissionRateChart = echarts.init(document.getElementById('submissionRateChart'))
    
    // 准备提交率数据 - 使用模拟数据
    const submissionData = [
        { value: 70, name: '已提交' },
        { value: 30, name: '未提交' }
    ]
    
    submissionRateChart.setOption({
        title: {
            text: '作业提交率',
            left: 'center'
        },
        tooltip: {
            trigger: 'item'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
        },
        series: [
            {
                name: '提交情况',
                type: 'pie',
                radius: '60%',
                data: submissionData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                itemStyle: {
                    color: function(params) {
                        const colors = ['#52C41A', '#FF4D4F'];
                        return colors[params.dataIndex];
                    }
                }
            }
        ]
    })

    // 监听窗口大小变化，重绘图表
    window.addEventListener('resize', () => {
        scoreChart.resize()
        submissionRateChart.resize()
    })
}

// 处理搜索
const handleSearch = () => {
    currentPage.value = 1
    loadHomeworks()
}

// 处理分页
const handlePageChange = (page) => {
    currentPage.value = page
    loadHomeworks()
}

// 获取作业状态描述，添加剩余时间显示
const getHomeworkStatusDescription = (homework) => {
    // 首先显示基础状态文本
    const baseStatus = getStatusText(homework.status);
    
    if (!homework.endTime) {
        return baseStatus + ' (未设置截止日期)';
    }
    
    const now = new Date();
    const deadline = new Date(homework.endTime);
    
    if (now > deadline) {
        // 已截止，显示已过去多长时间
        const passedTime = now.getTime() - deadline.getTime();
        const passedDays = Math.floor(passedTime / (1000 * 60 * 60 * 24));
        const passedHours = Math.floor((passedTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (passedDays > 0) {
            return `${baseStatus} (${passedDays}天${passedHours}小时前截止)`;
        } else {
            return `${baseStatus} (${passedHours}小时前截止)`;
        }
    } else {
        // 未截止，显示剩余多长时间
        const remainingTime = deadline.getTime() - now.getTime();
        const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
        const remainingHours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (remainingDays > 0) {
            return `${baseStatus} (剩余 ${remainingDays}天${remainingHours}小时)`;
        } else if (remainingHours > 0) {
            return `${baseStatus} (剩余 ${remainingHours}小时)`;
        } else {
            const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            return `${baseStatus} (剩余 ${remainingMinutes}分钟)`;
        }
    }
}

// 显示添加作业对话框
const showCreateDialog = () => {
    homeworkFormTitle.value = '创建作业'
    isEdit.value = false
    
    // 获取当前时间，设置默认截止日期为一周后
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    
    // 格式化为YYYY-MM-DD HH:mm:ss格式
    const formattedDeadline = nextWeek.toISOString().slice(0, 19).replace('T', ' ');
    
    homeworkForm.value = {
        assignmentId: null, // 新建作业时设为null
        title: '',
        description: '',
        courseId: selectedCourseId.value || '', // 如果已选择课程，默认使用该课程
        teacherId: teacherId,
        totalScore: 100,
        startTime: now.toISOString(), // 设置开始时间为当前时间
        endTime: formattedDeadline, // 设置默认截止时间为一周后
        status: 'DRAFT',
        type: getAssignmentTypeByUserRole(), // 根据用户角色自动判定
        isAnswerPublic: false, // 默认答案不公开
        isScoreVisible: true, // 默认分数可见
        isRedoAllowed: false, // 默认不允许重做
        maxAttempts: 1 // 默认最大尝试次数为1
    }
    
    homeworkFileList.value = []
    dialogVisible.value = true
}

// 编辑作业 - 跳转到作业详情页面
const editHomework = (homework) => {
    console.log('编辑作业被点击，跳转到详情页面:', homework)

    if (!homework.assignmentId) {
        console.error('作业ID不存在，无法跳转')
        ElMessage.error('作业ID不存在，无法跳转到详情页面')
        return
    }

    // 跳转到作业详情页面
    router.push({
        path: `/teacher/homework/${homework.assignmentId}`,
        query: {
            title: homework.title,
            courseId: homework.courseId,
            from: 'exercise' // 标记来源页面
        }
    })
}

// 提交作业表单
const submitHomework = async () => {
    if (!homeworkFormRef.value) return

    await homeworkFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                // 准备提交数据，确保字段名符合assignmentAPI的期望
                const submitData = {
                    ...homeworkForm.value,
                    // 确保使用正确的ID字段
                    assignmentId: homeworkForm.value.assignmentId,
                    // 确保其他字段正确
                    creatorId: homeworkForm.value.teacherId, // assignmentAPI使用creatorId字段
                    type: homeworkForm.value.type || getAssignmentTypeByUserRole() // 根据用户角色自动判定作业类型
                }
                
                // 处理开始时间 - 确保数据格式正确
                if (submitData.startTime) {
                    // 如果开始时间不是ISO格式字符串，则转换为ISO格式
                    if (!(typeof submitData.startTime === 'string' && submitData.startTime.includes('T'))) {
                        const startDate = new Date(submitData.startTime);
                        submitData.startTime = startDate.toISOString();
                    }
                } else {
                    // 如果没有设置开始时间，默认为当前时间
                    submitData.startTime = new Date().toISOString();
                }
                
                // 处理截止日期 - 确保数据格式正确
                if (submitData.endTime) {
                    // 如果截止日期不是ISO格式字符串，则转换为ISO格式
                    if (!(typeof submitData.endTime === 'string' && submitData.endTime.includes('T'))) {
                        const deadlineDate = new Date(submitData.endTime);
                        submitData.endTime = deadlineDate.toISOString();
                    }
                }
                
                // 根据截止日期自动判断状态
                const now = new Date();
                const deadline = submitData.endTime ? new Date(submitData.endTime) : null;
                
                if (!deadline) {
                    // 如果没有设置截止日期
                    submitData.status = 'PUBLISHED';
                } else if (now > deadline) {
                    // 如果当前时间已经超过截止日期
                    submitData.status = 'ENDED';
                } else {
                    // 计算剩余时间
                    const timeRemaining = deadline.getTime() - now.getTime();
                    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
                    
                    if (hoursRemaining <= 24) {
                        submitData.status = 'PUBLISHED'; // 即将截止仍然是已发布状态
                    } else {
                        submitData.status = 'PUBLISHED';
                    }
                }
                
                // 处理附件 - 如果有新上传的附件
                if (homeworkFileList.value && homeworkFileList.value.length > 0) {
                    // 将附件信息转换为API需要的格式
                    submitData.attachments = homeworkFileList.value.map(file => ({
                        fileName: file.name,
                        fileUrl: file.url || '',
                        fileSize: file.size || 0,
                        fileType: file.type || ''
                    }));
                }
                
                // 记录操作类型，用于日志
                const operationType = isEdit.value ? '更新' : '创建';
                
                console.log(`${operationType}作业数据:`, submitData);

                // 发送API请求
                let response;
                if (isEdit.value) {
                    response = await assignmentAPI.updateAssignment(submitData);
                    ElMessage.success('作业更新成功');
                } else {
                    response = await assignmentAPI.saveAssignment(submitData);
                    ElMessage.success('作业创建成功');
                }
                
                console.log(`${operationType}作业成功，服务器返回:`, response);
                
                // 关闭对话框
                dialogVisible.value = false;
                
                // 刷新作业列表
                if (selectedCourseId.value && selectedCourseId.value === submitData.courseId) {
                    // 如果选择了特定课程，只刷新该课程的作业
                    handleCourseSelect();
                } else {
                    // 否则刷新所有作业
                    loadHomeworks();
                }
            } catch (error) {
                console.error('保存作业失败:', error);
                let errorMessage = '保存作业失败';
                
                // 获取详细的错误信息
                if (error.response && error.response.data) {
                    if (error.response.data.message) {
                        errorMessage += ': ' + error.response.data.message;
                    } else if (error.response.data.error) {
                        errorMessage += ': ' + error.response.data.error;
                    }
                } else if (error.message) {
                    errorMessage += ': ' + error.message;
                }
                
                ElMessage.error(errorMessage);
            }
        } else {
            ElMessage.warning('请完善表单信息');
        }
    });
}



// 格式化日期时间
const formatDateTimeLocal = (dateTimeStr) => {
    return formatDateTime(dateTimeStr)
}

// 获取状态对应的类型
const getStatusType = (status) => {
    switch(status) {
        case 'DRAFT':
            return 'info';
        case 'PUBLISHED':
            return 'primary';
        case 'ENDED':
            return 'success';
        // 兼容旧的中文状态值
        case '未设置截止日期':
        case '未开始':
            return 'info';
        case '进行中':
        case '即将截止':
            return 'primary';
        case '已截止':
            return 'success';
        default:
            return 'info';
    }
}

// 获取状态显示文本
const getStatusText = (status) => {
    switch(status) {
        case 'DRAFT':
            return '草稿';
        case 'PUBLISHED':
            return '已发布';
        case 'ENDED':
            return '已结束';
        // 兼容旧的中文状态值
        case '未设置截止日期':
            return '未设置截止日期';
        case '未开始':
            return '未开始';
        case '进行中':
            return '进行中';
        case '即将截止':
            return '即将截止';
        case '已截止':
            return '已截止';
        default:
            return status || '未知状态';
    }
}

// 处理作业选择
const handleHomeworkSelect = () => {
    if (selectedHomeworkId.value) {
        // 从已加载的作业中查找选中的作业
        selectedHomework.value = courseHomeworks.value.find(homework => homework.assignmentId === selectedHomeworkId.value)

        // 如果找不到，可能需要重新加载
        if (!selectedHomework.value) {
            handleCourseSelect()
        }
    } else {
        // 未选择作业，清空选中的作业
        selectedHomework.value = null
    }
}

// 处理课程选择
const handleCourseSelect = async () => {
    // 重置作业选择
    selectedHomeworkId.value = ''
    selectedHomework.value = null

    if (selectedCourseId.value) {
        // 加载该课程的作业
        try {
            loading.value = true
            console.log('加载课程作业，课程ID:', selectedCourseId.value)
            
            // 使用assignmentAPI获取课程的所有作业数据
            // 教师状态使用 TEACHER_ASSIGNED 类型
            const assignmentType = 'TEACHER_ASSIGNED'
            let res = await assignmentAPI.getAssignmentsByCourseIdAndType(selectedCourseId.value, assignmentType)
            console.log('获取到的课程作业数据，类型:', assignmentType, '数据:', res)

            // assignmentAPI直接返回作业数据，无需筛选
            if (!Array.isArray(res)) {
                res = []
                console.log('课程作业数据格式异常，使用空数组')
            }

            // 字段映射：将assignmentAPI的字段映射为页面期望的字段
            res = res.map(assignment => ({
                ...assignment,
                // 确保ID字段统一 - 作业管理页面使用assignmentId
                assignmentId: assignment.assignmentId || assignment.id,
                // 确保其他必要字段存在
                title: assignment.title || assignment.name || '未命名作业',
                description: assignment.description || '',
                totalScore: assignment.totalScore || assignment.score || 0,
                endTime: assignment.endTime || assignment.deadline,
                courseId: assignment.courseId || assignment.course_id,
                teacherId: assignment.creatorId || assignment.teacherId,
                // 保持原有字段
                type: assignment.type || 'TEACHER_ASSIGNED' // 使用原始类型或默认为教师分配类型
            }))
            
            // 存储该课程的作业列表
            courseHomeworks.value = res

            // 更新作业状态
            const now = new Date()
            courseHomeworks.value.forEach(homework => {
                if (!homework.endTime) {
                    homework.status = 'DRAFT'
                    return
                }
                
                const deadline = new Date(homework.endTime)
                
                if (now > deadline) {
                    homework.status = 'ENDED'
                } else {
                    // 计算剩余时间
                    const timeRemaining = deadline.getTime() - now.getTime()
                    const hoursRemaining = timeRemaining / (1000 * 60 * 60)
                    
                    if (hoursRemaining <= 24) {
                        homework.status = 'PUBLISHED'
                    } else {
                        homework.status = 'PUBLISHED'
                    }
                }
            })

            // 如果有搜索关键词，进行过滤
            let filteredHomeworks = [...courseHomeworks.value]
            if (searchKeyword.value) {
                filteredHomeworks = filteredHomeworks.filter(homework =>
                    homework.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
                    (homework.description && homework.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
                )
            }

            homeworkList.value = filteredHomeworks
            total.value = filteredHomeworks.length

            // 重新初始化图表
            nextTick(async () => {
                await initCourseCharts()
            })
        } catch (error) {
            console.error('加载课程作业失败:', error)
            ElMessage.error('加载课程作业失败')
            courseHomeworks.value = []
            homeworkList.value = []
        } finally {
            loading.value = false
        }
    } else {
        // 加载所有作业
        await loadHomeworks()
        // 确保重新初始化全部课程的图表
        nextTick(() => {
            initCharts()
        })
    }
}

// 根据课程ID获取课程名称
const getCourseNameById = (courseId) => {
    if (!courseId) return '未知课程'
    const course = courseList.value.find(c => c.id === courseId)
    return course ? course.name : '未知课程'
}

// 添加截止日期验证
const disablePastDates = (date) => {
    const now = new Date();
    return date < now;
}

// 添加日期快捷选项
const dateShortcuts = [
    {
        text: '今天',
        value: new Date()
    },
    {
        text: '明天',
        value: new Date(new Date().setDate(new Date().getDate() + 1))
    },
    {
        text: '一周后',
        value: new Date(new Date().setDate(new Date().getDate() + 7))
    }
]

// 文件上传相关处理函数
const handleFileUploadSuccess = (response, file, fileList) => {
    console.log('文件上传成功:', response);
    
    // 将上传成功的文件信息添加到附件列表
    homeworkFileList.value = fileList.map(file => ({
        name: file.name,
        url: file.response?.url || file.url || '',
        size: file.size || 0,
        type: file.type || ''
    }));
    
    ElMessage.success(`文件 ${file.name} 上传成功`);
}

const handleFileUploadError = (error, file) => {
    console.error('文件上传失败:', error);
    ElMessage.error(`文件 ${file.name} 上传失败: ${error.message || '未知错误'}`);
}

const handleFileRemove = (file, fileList) => {
    console.log('文件被移除:', file);
    
    // 更新附件列表
    homeworkFileList.value = fileList.map(file => ({
        name: file.name,
        url: file.response?.url || file.url || '',
        size: file.size || 0,
        type: file.type || ''
    }));
}

const handleFileExceed = () => {
    ElMessage.warning('最多只能上传5个文件');
}

// 上传请求头，添加认证信息
const uploadHeaders = {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'Content-Type': 'multipart/form-data'
}
</script>

<style scoped>
.exercise-container {
    padding: 0;
    height: 100%;
    overflow-y: auto;
    position: relative;
}

.header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    margin-top: -20px;
}

.section-title {
    text-align: left;
    font-size: 22px;
    font-weight: 500;
    margin: 0;
    color: #303133;
    position: relative;
    padding-left: 12px;
    border-left: 4px solid #409EFF;
}

.action-bar {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 90%;
    margin-bottom: 20px;
}

.search-area {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
    flex: 1;
}

.course-select {
    width: 180px;
    flex-shrink: 0;
}

.homework-select {
    width: 180px;
    flex-shrink: 0;
}

.search-input {
    width: 200px;
    flex-shrink: 0;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 10px;
    flex-shrink: 0;
}

.charts-container {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
}

.chart-wrapper {
    flex: 1;
    background-color: #fff;
    border-radius: 4px;
    padding: 16px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.full-width {
    width: 100%;
    max-width: 100%;
}

.chart-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
    color: #303133;
    text-align: center;
}

.chart {
    height: 300px;
}

.loading-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 4px;
}

.empty-container {
    padding: 40px 0;
    background-color: #fff;
    border-radius: 4px;
}

.homework-table-container {
    background-color: #fff;
    border-radius: 4px;
    padding: 16px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}

.homework-detail-container {
    background-color: #fff;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 24px;
}

.detail-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
    color: #303133;
}

.detail-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

.unit-label {
    margin-left: 8px;
    color: #606266;
}

.upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
}
</style>

