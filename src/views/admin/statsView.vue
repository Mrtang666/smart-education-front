<template>
    <div class="stats-view">

        <!-- 时间范围选择 -->
        <div class="filter-section">
            <el-radio-group v-model="periodType" @change="handlePeriodChange">
                <el-radio-button label="daily">日统计</el-radio-button>
                <el-radio-button label="weekly">周统计</el-radio-button>
            </el-radio-group>

            <template v-if="periodType === 'daily'">
                <el-date-picker v-model="selectedDate" type="date" placeholder="选择日期" format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD" :disabled-date="disableFutureDate" @change="fetchStats" />
            </template>
        </div>

        <!-- 基础统计信息 -->
        <el-row :gutter="20" class="stats-row">
            <el-col :span="8">
                <el-card class="stats-card">
                    <div class="stat-item">
                        <div class="stat-label">教师总数</div>
                        <div class="stat-value">{{ teacherCount }}</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8">
                <el-card class="stats-card">
                    <div class="stat-item">
                        <div class="stat-label">学生总数</div>
                        <div class="stat-value">{{ studentCount }}</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8">
                <el-card class="stats-card">
                    <div class="stat-item">
                        <div class="stat-label">课程总数</div>
                        <div class="stat-value">{{ courseCount }}</div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 总体使用情况 -->
        <el-card class="stats-card">
            <template #header>
                <div class="card-header">
                    <span>总体使用情况</span>
                    <div class="time-info">{{ periodType === 'daily' ? selectedDate : '本周' }}</div>
                </div>
            </template>
            <el-row :gutter="20">
                <el-col :span="8">
                    <div class="stat-item">
                        <div class="stat-label">总访问次数</div>
                        <div class="stat-value">{{ totalStats.total || 0 }}</div>
                    </div>
                </el-col>
            </el-row>
        </el-card>

        <!-- 用户类型统计 -->
        <el-row :gutter="20" class="stats-row">
            <el-col :span="12">
                <el-card class="stats-card">
                    <div class="chart-container">
                        <div ref="studentChartRef" style="width: 100%; height: 300px"></div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="12">
                <el-card class="stats-card">
                    <div class="chart-container">
                        <div ref="teacherChartRef" style="width: 100%; height: 300px"></div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { statsAPI, teacherAPI, courseAPI } from '@/api/api'
import * as echarts from 'echarts'

// 基础统计数据
const teacherCount = ref(0)
const studentCount = ref(0)
const courseCount = ref(0)

// 使用统计数据
const periodType = ref('daily')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const totalStats = ref({})
const studentStats = ref({})
const teacherStats = ref({})

// 获取基础统计数据
const fetchBasicStats = async () => {
    try {
        console.log('开始获取基础统计数据...')

        // 获取教师列表并计算总数
        console.log('正在获取教师列表...')
        const teacherResponse = await teacherAPI.getTeacherList()
        console.log('教师列表数据:', teacherResponse)
        teacherCount.value = teacherResponse.data?.length || 0
        console.log('教师总数:', teacherCount.value)

        // 获取学生列表并计算总数
        console.log('正在获取学生列表...')
        const studentResponse = await teacherAPI.getStudentList()
        console.log('学生列表数据:', studentResponse)
        studentCount.value = studentResponse.data?.length || 0
        console.log('学生总数:', studentCount.value)

        // 获取课程列表并计算总数
        console.log('正在获取课程列表...')
        const courseResponse = await courseAPI.getAllCourses()
        console.log('课程列表数据:', courseResponse)
        courseCount.value = courseResponse.length || 0
        console.log('课程总数:', courseCount.value)

        console.log('基础统计数据获取完成')
    } catch (error) {
        console.error('获取基础统计数据失败:', error)
        console.error('错误详情:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        })
        ElMessage.error(`获取基础统计数据失败: ${error.message}`)
    }
}

// Chart references
const studentChartRef = ref(null)
const teacherChartRef = ref(null)
let studentChart = null
let teacherChart = null

// 禁用未来日期
const disableFutureDate = (time) => {
    return time.getTime() > Date.now()
}

// 初始化图表
const initCharts = () => {
    studentChart = echarts.init(studentChartRef.value)
    teacherChart = echarts.init(teacherChartRef.value)

    window.addEventListener('resize', () => {
        studentChart?.resize()
        teacherChart?.resize()
    })
}

// 更新图表数据
const updateCharts = () => {
    // 学生图表配置
    const studentOption = {
        title: {
            text: '学生各模块使用情况',
            left: '0',
            textStyle: {
                fontSize: 16,
                fontWeight: 600,
                color: '#303133'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        series: [{
            type: 'pie',
            radius: '60%',
            data: Object.entries(studentStats.value.moduleStats || {}).map(([name, value]) => ({
                name,
                value
            }))
        }]
    }

    // 教师图表配置
    const teacherOption = {
        title: {
            text: '教师各模块使用情况'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        series: [{
            type: 'pie',
            radius: '60%',
            data: Object.entries(teacherStats.value.moduleStats || {}).map(([name, value]) => ({
                name,
                value
            }))
        }]
    }

    studentChart?.setOption(studentOption)
    teacherChart?.setOption(teacherOption)
}

// 获取统计数据
const fetchStats = async () => {
    try {
        console.log('开始获取统计数据...')
        const params = {
            period: periodType.value
        }

        if (periodType.value === 'daily') {
            params.date = selectedDate.value
        }
        // 周统计只需要 period: 'weekly'
        console.log('统计请求参数:', params)

        // 获取总体统计
        console.log('正在获取总体统计...')
        const totalResponse = await statsAPI.getTotalUsage(params)
        console.log('总体统计响应:', totalResponse)
        totalStats.value = totalResponse

        // 获取学生统计
        console.log('正在获取学生统计...')
        const studentParams = { ...params, userType: 'STUDENT' }
        console.log('学生统计请求参数:', studentParams)
        const studentResponse = await statsAPI.getStatsSummary(studentParams)
        console.log('学生统计响应:', studentResponse)
        studentStats.value = studentResponse

        // 获取教师统计
        console.log('正在获取教师统计...')
        const teacherParams = { ...params, userType: 'TEACHER' }
        console.log('教师统计请求参数:', teacherParams)
        const teacherResponse = await statsAPI.getStatsSummary(teacherParams)
        console.log('教师统计响应:', teacherResponse)
        teacherStats.value = teacherResponse

        // 更新图表
        nextTick(() => {
            updateCharts()
        })
    } catch (error) {
        console.error('获取统计数据失败:', error)
        ElMessage.error('获取统计数据失败')
    }
}

const handlePeriodChange = () => {
    if (periodType.value === 'daily') {
        selectedDate.value = new Date().toISOString().split('T')[0]
    }
    fetchStats()
}

onMounted(() => {
    initCharts()
    fetchBasicStats()
    fetchStats()
})
</script>

<style scoped>
.stats-view {
    padding: 24px;
    background-color: #f5f7fa;
    min-height: calc(100vh - 64px);
}

/* 标题样式 */
.stats-view h2 {
    font-size: 24px;
    color: #303133;
    margin-bottom: 24px;
    font-weight: 600;
    position: relative;
    padding-left: 12px;
}

.stats-view h2::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 20px;
    background-color: #409EFF;
    border-radius: 2px;
}

/* 筛选区域样式 */
.filter-section {
    margin-bottom: 24px;
    display: flex;
    gap: 16px;
    align-items: center;
    background-color: #fff;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

/* 卡片样式 */
.stats-card {
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.stats-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.stats-row {
    margin-top: 24px;
    display: flex;
    flex-wrap: wrap;
}

/* 统计数据项样式 */
.stat-item {
    text-align: center;
    padding: 24px;
    background-color: #fff;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.stat-item:hover {
    background-color: #f5f7fa;
}

.stat-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 12px;
}

.stat-value {
    font-size: 28px;
    font-weight: bold;
    background: linear-gradient(45deg, #409EFF, #36cfc9);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    line-height: 1.2;
}

/* 图表容器样式 */
.chart-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    height: 100%;
}

/* 响应式布局优化 */
@media screen and (max-width: 768px) {
    .stats-view {
        padding: 16px;
    }

    .filter-section {
        flex-direction: column;
        align-items: stretch;
    }

    .stat-item {
        padding: 16px;
    }
}
</style>]]>
