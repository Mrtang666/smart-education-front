<template>
    <div class="exam-container">
        <h2 class="section-title">考试管理</h2>
        
        <!-- 搜索和操作栏 -->
        <div class="action-bar">
            <div class="search-area">
                <el-select v-model="selectedCourse" placeholder="选择课程" @change="handleCourseChange" class="course-select">
                    <el-option label="全部课程" value="" />
                    <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
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
                    <el-icon><Plus /></el-icon>新建考试
                </el-button>
            </div>
        </div>

        <!-- 数据统计图表区域 -->
        <div class="charts-container">
            <div class="chart-wrapper">
                <div class="chart-title">考试分数分布</div>
                <div id="scoreDistributionChart" class="chart"></div>
            </div>
            <div class="chart-wrapper">
                <div class="chart-title">考试时长统计</div>
                <div id="durationChart" class="chart"></div>
            </div>
        </div>

        <!-- 考试列表 -->
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="examList.length === 0" class="empty-container">
            <el-empty description="暂无考试" />
        </div>
        <div v-else class="exam-table-container">
            <el-table 
                :data="examList" 
                style="width: 100%" 
                border 
                stripe
                :header-cell-style="{background:'#f5f7fa'}"
            >
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
                        {{ formatDateTime(scope.row.startTime) }} 至 {{ formatDateTime(scope.row.endTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                    <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" link @click="editExam(scope.row)">
                            <el-icon><Edit /></el-icon>编辑
                        </el-button>
                        <el-button type="success" link @click="viewResults(scope.row)">
                            <el-icon><DataAnalysis /></el-icon>成绩
                        </el-button>
                        <el-button type="danger" link @click="confirmDeleteExam(scope.row)">
                            <el-icon><Delete /></el-icon>删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container" v-if="examList.length > 0">
                <el-pagination 
                    background 
                    layout="prev, pager, next" 
                    :total="total" 
                    :page-size="pageSize"
                    :current-page="currentPage"
                    @current-change="handlePageChange" 
                />
            </div>
        </div>

        <!-- 创建/编辑考试对话框 -->
        <el-dialog 
            v-model="dialogVisible" 
            :title="isEdit ? '编辑考试' : '创建考试'" 
            width="600px"
            :close-on-click-modal="false"
        >
            <el-form :model="examForm" :rules="rules" ref="examFormRef" label-width="100px">
                <el-form-item label="考试标题" prop="title">
                    <el-input v-model="examForm.title" placeholder="请输入考试标题" />
                </el-form-item>
                <el-form-item label="所属课程" prop="courseId">
                    <el-select v-model="examForm.courseId" placeholder="请选择课程">
                        <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="总分" prop="totalScore">
                    <el-input-number v-model="examForm.totalScore" :min="1" :max="1000" />
                </el-form-item>
                <el-form-item label="考试时长" prop="durationMinutes">
                    <el-input-number v-model="examForm.durationMinutes" :min="1" :max="300" />
                    <span class="unit-label">分钟</span>
                </el-form-item>
                <el-form-item label="考试时间" prop="examTime">
                    <el-date-picker
                        v-model="examForm.examTime"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        format="YYYY-MM-DD HH:mm"
                        value-format="YYYY-MM-DD HH:mm:ss"
                    />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="examForm.status" placeholder="请选择状态">
                        <el-option label="草稿" value="草稿" />
                        <el-option label="已发布" value="已发布" />
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
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { examAPI ,courseAPI} from '@/api/api'
import { Plus, Edit, Delete, Search, DataAnalysis } from '@element-plus/icons-vue'
import { getUserInfo } from '@/utils/auth'

// 用户信息
const userInfo = getUserInfo()
const teacherId = userInfo ? userInfo.teacherId : null

// 课程列表
const courseList = ref([])
const selectedCourse = ref('')
const searchKeyword = ref('')

// 考试列表
const examList = ref([])
const loading = ref(false)
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

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
    status: '草稿'
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

// 初始化
onMounted(async () => {
    await loadCourses()
    await loadExams()
    nextTick(() => {
        initCharts()
    })
})

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
        let res
        if (selectedCourse.value) {
            res = await examAPI.getExamsInCourseByTeacher(selectedCourse.value, teacherId)
        } else {
            res = await examAPI.getExamsByTeacher(teacherId)
        }
        
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
    
    // 分数分布图表
    const scoreChart = echarts.init(document.getElementById('scoreDistributionChart'))
    scoreChart.setOption({
        title: {
            text: '考试分数分布',
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
            data: ['0-60', '60-70', '70-80', '80-90', '90-100']
        },
        yAxis: {
            type: 'value',
            name: '学生人数'
        },
        series: [
            {
                name: '学生人数',
                type: 'bar',
                data: [5, 12, 18, 23, 10],
                itemStyle: {
                    color: function(params) {
                        const colorList = ['#FF4D4F', '#FAAD14', '#1890FF', '#52C41A', '#722ED1']
                        return colorList[params.dacourseAPItaIndex]
                    }
                }
            }
        ]
    })
    
    // 考试时长统计图
    const durationChart = echarts.init(document.getElementById('durationChart'))
    durationChart.setOption({
        title: {
            text: '考试时长统计',
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
                name: '考试时长',
                type: 'pie',
                radius: '60%',
                data: [
                    { value: 10, name: '30分钟以内' },
                    { value: 15, name: '30-60分钟' },
                    { value: 20, name: '60-90分钟' },
                    { value: 8, name: '90-120分钟' },
                    { value: 5, name: '120分钟以上' }
                ],
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
        durationChart.resize()
    })
}

// 处理课程变更
const handleCourseChange = () => {
    currentPage.value = 1
    loadExams()
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
        courseId: selectedCourse.value || '',
        teacherId: teacherId,
        totalScore: 100,
        durationMinutes: 60,
        examTime: [],
        status: '草稿'
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
    ElMessage.info('查看成绩功能开发中')
    // 这里可以跳转到成绩页面或显示成绩对话框
    console.log(exam);
    
}

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ''
    const date = new Date(dateTimeStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取状态对应的类型
const getStatusType = (status) => {
    switch (status) {
        case '草稿': return 'info'
        case '已发布': return 'success'
        case '已结束': return 'warning'
        default: return 'info'
    }
}
</script>

<style scoped>
.exam-container {
    padding: 0;
    height: 100%;
    overflow-y: auto;
    position: relative;
}

.section-title {
    text-align: left;
    font-size: 22px;
    font-weight: 500;
    margin: 0 0 24px 0;
    color: #303133;
    position: relative;
    padding-left: 12px;
    border-left: 4px solid #409EFF;
}

.action-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.search-area {
    display: flex;
    gap: 10px;
}

.course-select {
    width: 180px;
}

.search-input {
    width: 240px;
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
</style>
