<template>
    <div class="stats-view">
        <!-- 页面标题区域 -->
        <div class="page-header">
            <div class="header-content">
                <h2 class="page-title">统计视图</h2>
                <p class="page-subtitle">详细数据统计与可视化分析</p>
            </div>
        </div>

        <!-- 时间范围选择 -->
        <div class="filter-section">
            <div class="filter-content">
                <div class="filter-title">
                    <el-icon><Calendar /></el-icon>
                    <span>时间范围选择</span>
                </div>
                <div class="filter-controls">
                    <el-radio-group v-model="periodType" @change="handlePeriodChange" size="large">
                        <el-radio-button label="daily">日统计</el-radio-button>
                        <el-radio-button label="weekly">周统计</el-radio-button>
                    </el-radio-group>

                    <template v-if="periodType === 'daily'">
                        <el-date-picker 
                            v-model="selectedDate" 
                            type="date" 
                            placeholder="选择日期" 
                            format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD" 
                            :disabled-date="disableFutureDate" 
                            @change="fetchStats"
                            size="large"
                            style="margin-left: 16px;"
                        />
                    </template>
                </div>
            </div>
        </div>

        <!-- 基础统计信息 -->
        <div class="stats-section">
            <el-row :gutter="24">
                <el-col :span="8">
                    <el-card class="stats-card teacher-card" shadow="hover">
                        <div class="stat-item">
                            <div class="stat-icon">
                                <el-icon><User /></el-icon>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">教师总数</div>
                                <div class="stat-value">{{ teacherCount }}</div>
                                <div class="stat-subtitle">活跃教师账户</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="8">
                    <el-card class="stats-card student-card" shadow="hover">
                        <div class="stat-item">
                            <div class="stat-icon">
                                <el-icon><UserFilled /></el-icon>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">学生总数</div>
                                <div class="stat-value">{{ studentCount }}</div>
                                <div class="stat-subtitle">注册学生账户</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="8">
                    <el-card class="stats-card course-card" shadow="hover">
                        <div class="stat-item">
                            <div class="stat-icon">
                                <el-icon><Collection /></el-icon>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">课程总数</div>
                                <div class="stat-value">{{ courseCount }}</div>
                                <div class="stat-subtitle">开设课程数量</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 总体使用情况 -->
        <div class="overview-section">
            <el-card class="overview-card" shadow="never">
                <template #header>
                    <div class="overview-header">
                        <div class="overview-title">
                            <el-icon><DataLine /></el-icon>
                            <span>总体使用情况</span>
                        </div>
                        <div class="time-info">
                            <el-tag type="info" size="large">
                                {{ periodType === 'daily' ? selectedDate : '本周' }}
                            </el-tag>
                        </div>
                    </div>
                </template>
                <div class="overview-content">
                    <div class="usage-stat">
                        <div class="usage-icon">
                            <el-icon><View /></el-icon>
                        </div>
                        <div class="usage-info">
                            <div class="usage-label">总访问次数</div>
                            <div class="usage-value">{{ totalStats.total || 0 }}</div>
                            <div class="usage-desc">系统总访问量统计</div>
                        </div>
                    </div>
                </div>
            </el-card>
        </div>

        <!-- 用户类型统计图表 -->
        <div class="charts-section">
            <el-row :gutter="24">
                <el-col :span="12">
                    <el-card class="chart-card student-chart" shadow="never">
                        <template #header>
                            <div class="chart-header">
                                <div class="chart-title">
                                    <el-icon><PieChart /></el-icon>
                                    <span>学生各模块使用情况</span>
                                </div>
                                <el-tag type="success" size="small">实时数据</el-tag>
                            </div>
                        </template>
                        <div class="chart-container">
                            <div ref="studentChartRef" style="width: 100%; height: 300px"></div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="12">
                    <el-card class="chart-card teacher-chart" shadow="never">
                        <template #header>
                            <div class="chart-header">
                                <div class="chart-title">
                                    <el-icon><PieChart /></el-icon>
                                    <span>教师各模块使用情况</span>
                                </div>
                                <el-tag type="warning" size="small">实时数据</el-tag>
                            </div>
                        </template>
                        <div class="chart-container">
                            <div ref="teacherChartRef" style="width: 100%; height: 300px"></div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 数据刷新控制 -->
        <div class="control-section">
            <el-card class="control-card" shadow="never">
                <div class="control-content">
                    <div class="control-info">
                        <el-icon><InfoFilled /></el-icon>
                        <span>数据自动刷新，如需手动更新请点击下方按钮</span>
                    </div>
                    <el-button type="primary" size="large" @click="fetchStats" :loading="false">
                        <el-icon><Refresh /></el-icon>
                        刷新统计数据
                    </el-button>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
    Calendar, User, UserFilled, Collection, DataLine, 
    View, PieChart, InfoFilled, Refresh 
} from '@element-plus/icons-vue'
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

/* 页面标题区域样式 */
.page-header {
    margin-bottom: 24px;
    padding: 24px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.page-title {
    font-size: 28px;
    color: #303133;
    font-weight: 700;
    margin-bottom: 8px;
}

.page-subtitle {
    font-size: 16px;
    color: #606266;
    margin-bottom: 0;
}

/* 筛选区域样式 */
.filter-section {
    margin-bottom: 24px;
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-content {
    display: flex;
    align-items: center;
}

.filter-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    color: #303133;
    font-weight: 600;
    margin-right: 16px;
}

.filter-title .el-icon {
    margin-right: 8px;
    font-size: 20px;
    color: #409EFF;
}

.filter-controls {
    display: flex;
    align-items: center;
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
    display: flex;
    align-items: center;
    padding: 24px;
    background-color: #fff;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.stat-item:hover {
    background-color: #f5f7fa;
}

.stat-icon {
    margin-right: 16px;
    font-size: 36px;
    color: #409EFF;
}

.stat-content {
    text-align: left;
}

.stat-label {
    font-size: 16px;
    color: #303133;
    margin-bottom: 8px;
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

.stat-subtitle {
    font-size: 14px;
    color: #909399;
    margin-top: 4px;
}

/* 总体使用情况样式 */
.overview-section {
    margin-bottom: 24px;
}

.overview-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.overview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.overview-title {
    display: flex;
    align-items: center;
}

.overview-title .el-icon {
    margin-right: 8px;
    font-size: 20px;
    color: #67C23A;
}

.overview-content {
    padding: 20px;
}

.usage-stat {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 8px;
    border: 1px solid #ebeef5;
}

.usage-icon {
    margin-right: 16px;
    font-size: 36px;
    color: #67C23A;
}

.usage-info {
    text-align: left;
}

.usage-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
}

.usage-value {
    font-size: 28px;
    font-weight: bold;
    background: linear-gradient(45deg, #67C23A, #90ED7D);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    line-height: 1.2;
}

.usage-desc {
    font-size: 12px;
    color: #909399;
}

/* 用户类型统计图表样式 */
.charts-section {
    margin-bottom: 24px;
}

.chart-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.chart-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.chart-title {
    display: flex;
    align-items: center;
}

.chart-title .el-icon {
    margin-right: 8px;
    font-size: 20px;
    color: #409EFF;
}

.chart-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    height: 100%;
}

/* 数据刷新控制样式 */
.control-section {
    margin-top: 24px;
}

.control-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.control-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
}

.control-info {
    display: flex;
    align-items: center;
    color: #909399;
    font-size: 14px;
    margin-bottom: 16px;
}

.control-info .el-icon {
    margin-right: 8px;
    font-size: 18px;
}

/* 响应式布局优化 */
@media screen and (max-width: 768px) {
    .stats-view {
        padding: 16px;
    }

    .page-header {
        padding: 16px;
    }

    .page-title {
        font-size: 24px;
    }

    .page-subtitle {
        font-size: 14px;
    }

    .filter-section {
        flex-direction: column;
        align-items: stretch;
        padding: 16px;
    }

    .filter-content {
        flex-direction: column;
        align-items: flex-start;
    }

    .filter-title {
        margin-bottom: 12px;
    }

    .filter-controls {
        width: 100%;
        justify-content: center;
    }

    .filter-controls .el-radio-group {
        width: 100%;
    }

    .filter-controls .el-date-picker {
        width: 100%;
    }

    .stats-card {
        margin-bottom: 16px;
    }

    .stat-item {
        padding: 16px;
    }

    .stat-icon {
        font-size: 30px;
        margin-right: 12px;
    }

    .stat-label {
        font-size: 14px;
    }

    .stat-value {
        font-size: 24px;
    }

    .stat-subtitle {
        font-size: 12px;
    }

    .overview-header {
        flex-direction: column;
        align-items: flex-start;
        padding: 12px 16px;
    }

    .overview-title {
        margin-bottom: 8px;
    }

    .overview-title .el-icon {
        font-size: 18px;
    }

    .overview-content {
        padding: 16px;
    }

    .usage-stat {
        flex-direction: column;
        align-items: flex-start;
        padding: 12px;
    }

    .usage-icon {
        font-size: 30px;
        margin-right: 0;
        margin-bottom: 8px;
    }

    .usage-info {
        text-align: left;
    }

    .usage-label {
        font-size: 13px;
    }

    .usage-value {
        font-size: 24px;
    }

    .usage-desc {
        font-size: 11px;
    }

    .chart-header {
        flex-direction: column;
        align-items: flex-start;
        padding: 12px 16px;
    }

    .chart-title {
        margin-bottom: 8px;
    }

    .chart-title .el-icon {
        font-size: 18px;
    }

    .chart-container {
        padding: 16px;
    }

    .control-content {
        padding: 16px;
    }

    .control-info {
        font-size: 13px;
        margin-bottom: 12px;
    }

    .control-info .el-icon {
        font-size: 16px;
    }
}
</style>
