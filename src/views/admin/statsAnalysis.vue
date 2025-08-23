<template>
  <div class="stats-analysis">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">统计分析</h2>
        <p class="page-subtitle">系统数据概览与趋势分析</p>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <el-row :gutter="24">
        <el-col :span="8">
          <el-card class="stats-card teacher-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-title">教师总数</div>
                <div class="stats-number">{{ stats.teacherCount }}</div>
                <div class="card-subtitle">活跃教师账户</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stats-card student-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-title">学生总数</div>
                <div class="stats-number">{{ stats.studentCount }}</div>
                <div class="card-subtitle">注册学生账户</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stats-card course-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><Collection /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-title">课程总数</div>
                <div class="stats-number">{{ stats.courseCount }}</div>
                <div class="card-subtitle">开设课程数量</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <div class="chart-title">
                  <el-icon><TrendCharts /></el-icon>
                  <span>近期注册趋势</span>
                </div>
                <el-tag type="info" size="small">开发中</el-tag>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder">
                <el-icon class="placeholder-icon"><TrendCharts /></el-icon>
                <p class="placeholder-text">注册趋势图表</p>
                <p class="placeholder-desc">展示用户注册数量变化趋势</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <div class="chart-title">
                  <el-icon><PieChart /></el-icon>
                  <span>课程分布</span>
                </div>
                <el-tag type="info" size="small">开发中</el-tag>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder">
                <el-icon class="placeholder-icon"><PieChart /></el-icon>
                <p class="placeholder-text">课程分布图表</p>
                <p class="placeholder-desc">展示各学科课程分布情况</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据概览区域 -->
    <div class="overview-section">
      <el-card class="overview-card" shadow="never">
        <template #header>
          <div class="overview-header">
            <div class="overview-title">
              <el-icon><DataLine /></el-icon>
              <span>系统运行概览</span>
            </div>
            <el-button type="primary" size="small" @click="loadStats">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </template>
        <div class="overview-content">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-label">系统状态</div>
                <div class="overview-value">
                  <el-tag type="success" size="large">正常运行</el-tag>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-label">今日访问</div>
                <div class="overview-value">1,234</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-label">在线用户</div>
                <div class="overview-value">89</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-label">数据更新时间</div>
                <div class="overview-value">{{ new Date().toLocaleString() }}</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, UserFilled, Collection, TrendCharts, PieChart, DataLine, Refresh } from '@element-plus/icons-vue'
import { statsAPI } from '@/api/api'

const stats = ref({
  teacherCount: 0,
  studentCount: 0,
  courseCount: 0
})

const loadStats = async () => {
  try {
    const response = await statsAPI.getStatsTotal()
    stats.value = response
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stats-analysis {
  padding: 0;
  background: #f5f7fa;
  min-height: 100%;
}

/* 页面标题区域 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 0;
  margin-bottom: 30px;
  color: white;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
  text-align: center;
}

.page-title {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 600;
  color: white;
}

.page-subtitle {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
  font-weight: 400;
}

/* 统计卡片区域 */
.stats-section {
  max-width: 1200px;
  margin: 0 auto 30px;
  padding: 0 30px;
}

.stats-card {
  border-radius: 16px;
  border: none;
  transition: all 0.3s ease;
  overflow: hidden;
}

.stats-card:hover {
  transform: translateY(-4px);
}

.teacher-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.student-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.course-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.card-content {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.card-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.card-icon .el-icon {
  font-size: 28px;
  color: white;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  opacity: 0.9;
}

.stats-number {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 14px;
  opacity: 0.8;
}

/* 图表区域 */
.charts-section {
  max-width: 1200px;
  margin: 0 auto 30px;
  padding: 0 30px;
}

.chart-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.chart-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

.chart-container {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.placeholder-text {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.placeholder-desc {
  font-size: 14px;
  margin: 0;
  opacity: 0.7;
}

/* 数据概览区域 */
.overview-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
}

.overview-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.overview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.overview-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

.overview-content {
  padding: 20px 0;
}

.overview-item {
  text-align: center;
  padding: 20px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 30px 0;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .stats-section,
  .charts-section,
  .overview-section {
    padding: 0 20px;
  }
  
  .card-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .overview-item {
    padding: 16px;
  }
  
  .overview-value {
    font-size: 20px;
  }
}
</style>
