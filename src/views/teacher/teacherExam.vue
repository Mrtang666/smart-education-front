<template>
    <div class="exam-container">
        <div class="header-row">
            <h2 class="section-title">考试管理</h2>

            <!-- 搜索和操作栏 -->
            <div class="action-bar">
                <div class="search-area">
                    <el-select v-model="selectedCourseId" placeholder="选择课程" @change="handleCourseSelect"
                        class="course-select">
                        <el-option label="全部课程" value="" />
                        <el-option v-for="course in courseList" :key="course.id" :label="course.name"
                            :value="course.id" />
                    </el-select>
                    <el-select v-if="selectedCourseId" v-model="selectedExamId" placeholder="选择考试"
                        @change="handleExamSelect" class="exam-select">
                        <el-option label="全部考试" value="" />
                        <el-option v-for="exam in courseExams" :key="exam.examId" :label="exam.title"
                            :value="exam.examId" />
                    </el-select>
                    <el-input v-model="searchKeyword" placeholder="搜索考试" class="search-input" @input="handleSearch">
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
                        </el-icon>新建考试
                    </el-button>
                </div>
            </div>
        </div>

        <!-- 数据统计图表区域 -->
        <div v-if="!selectedCourseId" class="charts-container">
            <div class="chart-wrapper full-width">
                <div id="courseExamChart" class="chart"></div>
            </div>
        </div>

        <!-- 课程考试统计图表区域 -->
        <div v-if="selectedCourseId" class="charts-container">
            <div class="chart-wrapper">
                <div id="scoreDistributionChart" class="chart"></div>
            </div>
            <div class="chart-wrapper">
                <div id="knowledgeChart" class="chart"></div>
            </div>
        </div>

        <!-- 考试详情区域 -->
        <div v-if="selectedCourseId && selectedExamId && selectedExam" class="exam-detail-container">
            <h3 class="detail-title">考试详情</h3>
            <el-descriptions :column="2" border>
                <el-descriptions-item label="考试标题">{{ selectedExam.title }}</el-descriptions-item>
                <el-descriptions-item label="考试状态">
                    <el-tag :type="getStatusType(selectedExam.status)" effect="dark">
                        <el-icon v-if="selectedExam.status === '未开始'">
                            <Calendar />
                        </el-icon>
                        <el-icon v-else-if="selectedExam.status === '进行中'">
                            <Loading />
                        </el-icon>
                        <el-icon v-else-if="selectedExam.status === '已结束'">
                            <Timer />
                        </el-icon>
                        {{ selectedExam.status }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="考试时间">
                    {{ formatDateTimeLocal(selectedExam.startTime) }} 至 {{ formatDateTimeLocal(selectedExam.endTime) }}
                </el-descriptions-item>
                <el-descriptions-item label="总分/时长">
                    {{ selectedExam.totalScore }}分 / {{ selectedExam.durationMinutes }}分钟
                </el-descriptions-item>
                <el-descriptions-item label="描述" :span="2">
                    {{ selectedExam.description || '暂无描述' }}
                </el-descriptions-item>
            </el-descriptions>

            <div class="detail-actions">
                <el-button type="primary" @click="editExam(selectedExam)">
                    <el-icon>
                        <Edit />
                    </el-icon>编辑考试
                </el-button>
                <el-button type="success" @click="viewResults(selectedExam)">
                    <el-icon>
                        <DataAnalysis />
                    </el-icon>查看成绩
                </el-button>
                <el-button type="danger" @click="confirmDeleteExam(selectedExam)">
                    <el-icon>
                        <Delete />
                    </el-icon>删除考试
                </el-button>
            </div>
        </div>

        <!-- 考试列表 -->
        <div v-if="!selectedCourseId || (selectedCourseId && !selectedExamId)" v-loading="loading"
            class="exam-table-container">
            <div v-if="loading" class="loading-container">
                <el-skeleton :rows="5" animated />
            </div>
            <div v-else-if="examList.length === 0" class="empty-container">
                <el-empty description="暂无考试" />
            </div>
            <div v-else>
                <el-table :data="examList" style="width: 100%" border stripe
                    :header-cell-style="{ background: '#f5f7fa' }">
                    <el-table-column prop="title" label="考试标题" min-width="180" />
                    <el-table-column prop="description" label="描述" min-width="200">
                        <template #default="scope">
                            {{ scope.row.description || '暂无描述' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="totalScore" label="总分" width="80" />
                    <el-table-column prop="durationMinutes" label="时长(分钟)" width="120" />
                    <el-table-column label="考试时间" min-width="240">
                        <template #default="scope">
                            {{ formatDateTimeLocal(scope.row.startTime) }} 至 {{ formatDateTimeLocal(scope.row.endTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="所属课程" min-width="150" v-if="!selectedCourseId">
                        <template #default="scope">
                            <el-button link type="primary" @click="goToCourseDetail(scope.row.courseId)">
                                {{ getCourseNameById(scope.row.courseId) }}
                            </el-button>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100">
                        <template #default="scope">
                            <el-tag :type="getStatusType(scope.row.status)" effect="dark">
                                <el-icon v-if="scope.row.status === '未开始'">
                                    <Calendar />
                                </el-icon>
                                <el-icon v-else-if="scope.row.status === '进行中'">
                                    <Loading />
                                </el-icon>
                                <el-icon v-else-if="scope.row.status === '已结束'">
                                    <Timer />
                                </el-icon>
                                {{ scope.row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="220" fixed="right">
                        <template #default="scope">
                            <el-button type="primary" link @click="editExam(scope.row)">
                                <el-icon>
                                    <Edit />
                                </el-icon>编辑
                            </el-button>
                            <el-button type="success" link @click="viewResults(scope.row)">
                                <el-icon>
                                    <DataAnalysis />
                                </el-icon>成绩
                            </el-button>
                            <el-button type="danger" link @click="confirmDeleteExam(scope.row)">
                                <el-icon>
                                    <Delete />
                                </el-icon>删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 分页 -->
                <div class="pagination-container" v-if="examList.length > 0">
                    <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize"
                        :current-page="currentPage" @current-change="handlePageChange" />
                </div>
            </div>
        </div>

        <!-- 创建/编辑考试对话框 -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑考试' : '创建考试'" width="600px"
            :close-on-click-modal="false">
            <el-form :model="examForm" :rules="rules" ref="examFormRef" label-width="100px">
                <el-form-item label="考试标题" prop="title">
                    <el-input v-model="examForm.title" placeholder="请输入考试标题" />
                </el-form-item>
                <el-form-item label="所属课程" prop="courseId">
                    <el-input v-model="examForm.courseId" placeholder="请输入课程ID" />
                </el-form-item>
                <el-form-item label="总分" prop="totalScore">
                    <el-input-number v-model="examForm.totalScore" :min="1" :max="1000" />
                </el-form-item>
                <el-form-item label="考试时长" prop="durationMinutes">
                    <el-input-number v-model="examForm.durationMinutes" :min="1" :max="300" />
                    <span class="unit-label">分钟</span>
                </el-form-item>
                <el-form-item label="考试时间" prop="examTime">
                    <el-date-picker v-model="examForm.examTime" type="datetimerange" range-separator="至"
                        start-placeholder="开始时间" end-placeholder="结束时间" format="YYYY-MM-DD HH:mm"
                        value-format="YYYY-MM-DD HH:mm:ss" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="examForm.status" placeholder="请选择状态">
                        <el-option label="未开始" value="未开始" />
                        <el-option label="进行中" value="进行中" />
                        <el-option label="已结束" value="已结束" />
                    </el-select>
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="examForm.description" type="textarea" :rows="3" placeholder="请输入考试描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitExam">确认</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { examAPI, courseAPI, knowledgeAPI } from '@/api/api'
import { Plus, Edit, Delete, Search, DataAnalysis, Timer, Calendar, Loading } from '@element-plus/icons-vue'
import { getUserInfo } from '@/utils/auth'
import { useRouter } from 'vue-router'
import { getExamStatusType, updateExamsStatus, formatDateTime, setExamStatus } from '@/utils/examManager'

// 初始化路由
const router = useRouter()

// 用户信息
const userInfo = getUserInfo()
const teacherId = userInfo ? userInfo.teacherId : null

// 课程和考试列表
const courseList = ref([])
const selectedCourseId = ref('')
const courseExams = ref([])
const examList = ref([])
const loading = ref(false)
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchKeyword = ref('')
const selectedExamId = ref('')
const allExams = ref([])
const selectedExam = ref(null)

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const examFormRef = ref(null)
const examForm = ref({
    title: '',
    description: '',
    courseId: '',
    teacherId: teacherId,
    totalScore: 100,
    durationMinutes: 60,
    examTime: [],
    status: '未开始'
})

// 表单验证规则
const rules = {
    title: [{ required: true, message: '请输入考试标题', trigger: 'blur' }],
    courseId: [{ required: true, message: '请选择所属课程', trigger: 'change' }],
    totalScore: [{ required: true, message: '请输入总分', trigger: 'blur' }],
    durationMinutes: [{ required: true, message: '请输入考试时长', trigger: 'blur' }],
    examTime: [{ required: true, message: '请选择考试时间', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 添加自动更新考试状态的功能
const currentTime = ref(new Date())
let timeInterval = null

// 在组件挂载时设置定时器
onMounted(async () => {
    await loadCourses()
    await loadExams()
    nextTick(() => {
        initCharts()
    })
    
    // 设置定时器，每分钟更新一次当前时间和考试状态
    timeInterval = setInterval(() => {
        currentTime.value = new Date()
        updateExamsStatus(allExams.value, currentTime.value).then(updatedExams => {
            if (updatedExams) {
                loadExams()
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

// 加载考试列表
const loadExams = async () => {
    loading.value = true
    try {
        let res = await examAPI.getExamsByTeacher(teacherId)

        // 存储所有考试供下拉框使用
        allExams.value = res

        // 如果有搜索关键词，进行过滤
        if (searchKeyword.value) {
            res = res.filter(exam =>
                exam.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
                (exam.description && exam.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
            )
        }

        total.value = res.length

        // 分页处理
        const startIndex = (currentPage.value - 1) * pageSize.value
        const endIndex = startIndex + pageSize.value
        examList.value = res.slice(startIndex, endIndex)

        // 重新初始化图表
        nextTick(() => {
            initCharts()
        })
    } catch (error) {
        console.error('加载考试失败:', error)
        ElMessage.error('加载考试列表失败')
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

    // 课程考试数量分布图表
    const courseExamChart = echarts.init(document.getElementById('courseExamChart'))
    
    // 准备图表数据
    const chartData = []
    
    // 使用实际数据：计算每个课程的考试数量
    if (courseList.value.length > 0 && allExams.value.length > 0) {
        // 创建一个映射来统计每个课程的考试数量
        const courseExamCounts = {}
        
        // 初始化每个课程的考试计数为0
        courseList.value.forEach(course => {
            courseExamCounts[course.id] = 0
        })
        
        // 统计每个课程的考试数量
        allExams.value.forEach(exam => {
            if (exam.courseId && courseExamCounts[exam.courseId] !== undefined) {
                courseExamCounts[exam.courseId]++
            }
        })
        
        // 转换为图表所需的数据格式
        courseList.value.forEach(course => {
            chartData.push({
                name: course.name,
                value: courseExamCounts[course.id]
            })
        })
    }
    
    // 如果没有数据，显示暂无数据
    if (chartData.length === 0 || chartData.every(item => item.value === 0)) {
        chartData.push({ name: '暂无数据', value: 1 })
    }
    
    courseExamChart.setOption({
        title: {
            text: '各课程考试数量分布',
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
                name: '考试数量',
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
        courseExamChart.resize()
    })
}

// 初始化课程考试图表
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
        // 如果有选中的考试，获取该考试的成绩数据
        if (selectedExamId.value) {
            // 这里可以调用API获取考试成绩数据
            // 例如: const examScores = await examAPI.getExamScores(selectedExamId.value)
            
            // 由于目前没有直接获取考试成绩分布的API，这里先使用模拟数据
            // 实际项目中应替换为真实API调用
            const examScores = [65, 72, 85, 92, 78, 55, 68, 75, 88, 95, 82, 76, 91, 63, 79]
            
            // 统计各分数段的学生人数
            examScores.forEach(score => {
                if (score < 60) scoreData[0]++
                else if (score < 70) scoreData[1]++
                else if (score < 80) scoreData[2]++
                else if (score < 90) scoreData[3]++
                else scoreData[4]++
            })
        }
    } catch (error) {
        console.error('获取考试成绩数据失败:', error)
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

    // 知识点覆盖图表
    const knowledgeChart = echarts.init(document.getElementById('knowledgeChart'))
    
    // 准备知识点数据
    const knowledgeData = []
    
    try {
        if (selectedCourseId.value) {
            // 获取课程的知识点
            const courseKnowledges = await knowledgeAPI.getKnowledgeByCourseId(selectedCourseId.value)
            
            // 如果有知识点数据，转换为图表所需格式
            if (courseKnowledges && courseKnowledges.length > 0) {
                // 按难度等级分组统计知识点
                const difficultyGroups = {}
                
                courseKnowledges.forEach(knowledge => {
                    const difficulty = knowledge.difficultyLevel || '未分类'
                    if (!difficultyGroups[difficulty]) {
                        difficultyGroups[difficulty] = 0
                    }
                    difficultyGroups[difficulty]++
                })
                
                // 转换为图表数据格式
                for (const difficulty in difficultyGroups) {
                    knowledgeData.push({
                        name: difficulty,
                        value: difficultyGroups[difficulty]
                    })
                }
            }
        }
    } catch (error) {
        console.error('获取课程知识点数据失败:', error)
    }
    
    // 如果没有数据，显示暂无数据
    if (knowledgeData.length === 0) {
        knowledgeData.push({ name: '暂无数据', value: 1 })
    }
    
    knowledgeChart.setOption({
        title: {
            text: '考试知识点覆盖',
            left: 'center'
        },
        tooltip: {
            trigger: 'item'
        },
        legend: {
            orient: 'vertical',
            left: 'left'
        },
        series: [
            {
                name: '知识点覆盖',
                type: 'pie',
                radius: '60%',
                data: knowledgeData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    })

    // 监听窗口大小变化，重绘图表
    window.addEventListener('resize', () => {
        scoreChart.resize()
        knowledgeChart.resize()
    })
}

// 处理搜索
const handleSearch = () => {
    currentPage.value = 1
    loadExams()
}

// 处理分页
const handlePageChange = (page) => {
    currentPage.value = page
    loadExams()
}

// 显示创建对话框
const showCreateDialog = () => {
    isEdit.value = false
    examForm.value = {
        title: '',
        description: '',
        courseId: '',
        teacherId: teacherId,
        totalScore: 100,
        durationMinutes: 60,
        examTime: [],
        status: '未开始'
    }
    dialogVisible.value = true
}

// 编辑考试
const editExam = (exam) => {
    isEdit.value = true
    examForm.value = {
        examId: exam.examId,
        title: exam.title,
        description: exam.description || '',
        courseId: exam.courseId,
        teacherId: exam.teacherId,
        totalScore: exam.totalScore,
        durationMinutes: exam.durationMinutes,
        examTime: [exam.startTime, exam.endTime],
        status: exam.status
    }
    dialogVisible.value = true
}

// 提交考试表单
const submitExam = async () => {
    if (!examFormRef.value) return

    await examFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const submitData = {
                    ...examForm.value,
                    startTime: examForm.value.examTime[0],
                    endTime: examForm.value.examTime[1]
                }
                delete submitData.examTime
                
                // 根据开始和结束时间自动判断状态
                setExamStatus(submitData)

                if (isEdit.value) {
                    await examAPI.updateExam(submitData)
                    ElMessage.success('考试更新成功')
                } else {
                    await examAPI.saveExam(submitData)
                    ElMessage.success('考试创建成功')
                }

                dialogVisible.value = false
                loadExams()
            } catch (error) {
                console.error('保存考试失败:', error)
                ElMessage.error('保存考试失败')
            }
        }
    })
}

// 确认删除考试
const confirmDeleteExam = (exam) => {
    ElMessageBox.confirm(`确定要删除考试 "${exam.title}" 吗?`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            await examAPI.deleteExamById(exam.examId)
            ElMessage.success('删除成功')
            loadExams()
        } catch (error) {
            console.error('删除考试失败:', error)
            ElMessage.error('删除考试失败')
        }
    }).catch(() => {
        // 用户取消删除
    })
}

// 查看考试成绩
const viewResults = (exam) => {
    // 如果考试状态是未开始，提示未开始
    if (exam.status === '未开始') {
        ElMessage.warning('考试尚未开始，暂无成绩数据')
        return
    }
    
    // 跳转到考试成绩页面
    router.push({
        path: `/teacher/exam/scores/${exam.examId}`,
        query: {
            title: exam.title,
            courseId: exam.courseId,
            courseName: getCourseNameById(exam.courseId)
        }
    })
}

// 格式化日期时间
const formatDateTimeLocal = (dateTimeStr) => {
    return formatDateTime(dateTimeStr)
}

// 获取状态对应的类型
const getStatusType = (status) => {
    return getExamStatusType(status)
}

// 处理考试选择
const handleExamSelect = () => {
    if (selectedExamId.value) {
        // 从已加载的考试中查找选中的考试
        selectedExam.value = courseExams.value.find(exam => exam.examId === selectedExamId.value)

        // 如果找不到，可能需要重新加载
        if (!selectedExam.value) {
            handleCourseSelect()
        }
    } else {
        // 未选择考试，清空选中的考试
        selectedExam.value = null
    }
}

// 处理课程选择
const handleCourseSelect = async () => {
    // 重置考试选择
    selectedExamId.value = ''
    selectedExam.value = null

    if (selectedCourseId.value) {
        // 加载该课程的考试
        try {
            loading.value = true
            const res = await examAPI.getExamsInCourse(selectedCourseId.value)
            courseExams.value = res

            // 如果有搜索关键词，进行过滤
            let filteredExams = res
            if (searchKeyword.value) {
                filteredExams = filteredExams.filter(exam =>
                    exam.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
                    (exam.description && exam.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
                )
            }

            examList.value = filteredExams
            total.value = filteredExams.length

            // 重新初始化图表
            nextTick(async () => {
                await initCourseCharts()
            })
        } catch (error) {
            console.error('加载课程考试失败:', error)
            ElMessage.error('加载课程考试失败')
        } finally {
            loading.value = false
        }
    } else {
        // 加载所有考试
        await loadExams()
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
</script>

<style scoped>
.exam-container {
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
    margin-top: -
    20px;
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

.exam-select {
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

.exam-table-container {
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

.unit-label {
    margin-left: 8px;
    color: #606266;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}

.exam-detail-container {
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
</style>
