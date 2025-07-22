<template>
  <div class="stats-analysis">
    <h2>统计分析</h2>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="stats-card">
          <template #header>
            <div class="card-header">
              <span>教师总数</span>
            </div>
          </template>
          <div class="stats-number">{{ stats.teacherCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stats-card">
          <template #header>
            <div class="card-header">
              <span>学生总数</span>
            </div>
          </template>
          <div class="stats-number">{{ stats.studentCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stats-card">
          <template #header>
            <div class="card-header">
              <span>课程总数</span>
            </div>
          </template>
          <div class="stats-number">{{ stats.courseCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近期注册趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- TODO: 添加注册趋势图表 -->
            <el-empty description="图表开发中..." />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>课程分布</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- TODO: 添加课程分布图表 -->
            <el-empty description="图表开发中..." />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
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
  padding: 20px;
}

.stats-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-number {
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  color: #409EFF;
}

.chart-row {
  margin-top: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
