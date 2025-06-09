<!-- 学情分析需要接入ai接口来评价学生的学习情况，并给出改进建议，目前先实现一个简单的学情分析，后续再接入ai接口 ，先这样留着-->
<template>
  <div class="analysis-container">
    <h1 class="page-title">学情分析</h1>
    
    <!-- 课程选择 -->
    <div class="selection-container">
      <el-select v-model="selectedCourseId" placeholder="请选择课程" @change="handleCourseChange">
        <el-option 
          v-for="course in courses" 
          :key="course.id" 
          :label="course.name" 
          :value="course.id" 
        />
      </el-select>
    </div>
    
    <!-- 分析结果区域 -->
    <div v-if="isAnalysisReady" class="analysis-results">
      <!-- 学习概况卡片 -->
      <el-card class="analysis-card overview-card">
        <template #header>
          <span>学习概况</span>
        </template>
        <div class="data-overview">
          <div class="data-item">
            <div class="data-value">{{ analysisData.studentCount || 0 }}</div>
            <div class="data-label">学生总数</div>
          </div>
          <div class="data-item">
            <div class="data-value">{{ analysisData.avgProgress || '0%' }}</div>
            <div class="data-label">平均进度</div>
          </div>
          <div class="data-item">
            <div class="data-value">{{ analysisData.avgMastery || '0%' }}</div>
            <div class="data-label">平均掌握度</div>
          </div>
          <div class="data-item">
            <div class="data-value">{{ analysisData.completionRate || '0%' }}</div>
            <div class="data-label">完成率</div>
          </div>
        </div>
      </el-card>
      
      <!-- 知识点掌握情况 -->
      <el-card class="analysis-card">
        <template #header>
          <span>知识点学习率</span>
        </template>
        <div class="chart-container">
          <div ref="knowledgeMasteryChart" style="width: 100%; height: 400px;"></div>
        </div>
      </el-card>
      
      <!-- 学习进度统计 -->
      <el-card class="analysis-card">
        <template #header>
          <span>学习进度统计数据</span>
        </template>
        <div class="chart-container">
          <div ref="progressChart" style="width: 100%; height: 400px;"></div>
        </div>
      </el-card>
      
      <!-- 薄弱知识点分析 -->
      <el-card class="analysis-card">
        <template #header>
          <span>薄弱知识点分析与改进意见</span>
        </template>
        <div class="weak-points-container">
          <div v-if="weakPoints.length === 0" class="empty-data">暂无薄弱知识点数据</div>
          <div v-for="(point, index) in weakPoints" :key="index" class="weak-point-item">
            <h3>{{ point.name }}</h3>
            <div class="mastery-bar">
              <div class="mastery-progress" :style="{ width: point.masteryRate + '%', backgroundColor: getMasteryColor(point.masteryRate) }"></div>
              <span class="mastery-label">掌握率: {{ point.masteryRate }}%</span>
            </div>
            <div class="improvement-suggestions">
              <h4>改进建议：</h4>
              <p>{{ point.suggestions }}</p>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 学习情况总结 -->
      <el-card class="analysis-card">
        <template #header>
          <span>学习情况总结文本</span>
        </template>
        <div class="summary-container">
          <p v-if="!analysisData.summary" class="empty-data">暂无学习情况总结</p>
          <p v-else>{{ analysisData.summary }}</p>
        </div>
      </el-card>
    </div>
    
    <div v-else-if="selectedCourseId" class="loading-container">
      <el-empty description="正在加载分析数据...">
        <template #image>
          <el-icon><Loading /></el-icon>
        </template>
      </el-empty>
    </div>
    
    <div v-else class="empty-container">
      <el-empty description="请选择课程进行学情分析"></el-empty>
    </div>
  </div>
</template>

<script>
import { courseAPI, knowledgeAPI, learningProgressAPI, teacherAPI, courseSelectionAPI } from '@/api/api';
import * as echarts from 'echarts';

export default {
  name: 'TeacherAnalysis',
  data() {
    return {
      courses: [],
      selectedCourseId: '',
      students: [],
      isLoading: false,
      isAnalysisReady: false,
      
      // 分析数据
      analysisData: {
        studentCount: 0,
        avgProgress: '0%',
        avgMastery: '0%',
        completionRate: '0%',
        summary: ''
      },
      
      // 知识点数据
      knowledgePoints: [],
      weakPoints: [],
      
      // 图表实例
      knowledgeMasteryChart: null,
      progressChart: null
    };
  },
  async created() {
    this.fetchCourses();
  },
  methods: {
    // 获取所有课程
    async fetchCourses() {
      try {
        this.isLoading = true;
        await this.fetchTeacherInfo();
        const courses = await courseAPI.getAllCourses();
        // 处理课程数据
        this.courses = courses.map(course => ({
          id: course.id,
          name: course.name,
          code: course.code
        }));
      } catch (error) {
        console.error('获取课程失败:', error);
        this.$message.error('获取课程列表失败，请稍后再试');
      } finally {
        this.isLoading = false;
      }
    },
    
    // 获取教师信息
    async fetchTeacherInfo() {
      try {
        return await teacherAPI.getSelfTeacherInfo();
      } catch (error) {
        console.error('获取教师信息失败:', error);
        return null;
      }
    },
    
    // 课程变更处理
    async handleCourseChange(courseId) {
      if (!courseId) {
        this.isAnalysisReady = false;
        return;
      }
      
      try {
        this.isLoading = true;
        await this.fetchCourseAnalysisData(courseId);
        this.isAnalysisReady = true;
        this.$nextTick(() => {
          this.initCharts();
        });
      } catch (error) {
        console.error('获取课程分析数据失败:', error);
        this.$message.error('获取分析数据失败，请稍后再试');
        this.isAnalysisReady = false;
      } finally {
        this.isLoading = false;
      }
    },
    
    // 获取课程分析数据
    async fetchCourseAnalysisData(courseId) {
      // 1. 获取课程的知识点
      const knowledgePoints = await knowledgeAPI.getKnowledgeByCourseId(courseId);
      
      // 2. 获取选修该课程的学生
      const students = await courseSelectionAPI.getCourseStudents(courseId);
      this.students = students;
      
      // 3. 收集每个学生的学习进度数据
      const progressPromises = students.map(student => 
        learningProgressAPI.getStudentCourseProgress(student.studentId, courseId)
      );
      const progressResults = await Promise.all(progressPromises);
      
      // 4. 分析数据
      this.processAnalysisData(knowledgePoints, progressResults);
    },
    
    // 处理分析数据
    processAnalysisData(knowledgePoints, progressResults) {
      // 处理知识点掌握情况
      this.knowledgePoints = knowledgePoints.map(point => {
        const masteryData = this.calculateKnowledgeMastery(point.knowledgeId, progressResults);
        return {
          ...point,
          ...masteryData
        };
      });
      
      // 找出薄弱知识点
      this.weakPoints = this.knowledgePoints
        .filter(point => point.masteryRate < 60)
        .map(point => ({
          ...point,
          suggestions: this.generateSuggestions(point)
        }));
      
      // 计算总体数据
      const totalMasteryRates = this.knowledgePoints.reduce((sum, point) => sum + point.masteryRate, 0);
      const avgMastery = this.knowledgePoints.length > 0 ? 
        (totalMasteryRates / this.knowledgePoints.length).toFixed(1) + '%' : '0%';
      
      const totalProgress = progressResults.reduce((sum, studentProgress) => {
        const studentAvgProgress = studentProgress.reduce((s, p) => s + p.masteryLevel, 0) / 
          (studentProgress.length || 1) * 100;
        return sum + studentAvgProgress;
      }, 0);
      const avgProgress = progressResults.length > 0 ? 
        (totalProgress / progressResults.length).toFixed(1) + '%' : '0%';
      
      const completedStudents = progressResults.filter(studentProgress => 
        studentProgress.reduce((s, p) => s + p.masteryLevel, 0) / (studentProgress.length || 1) >= 0.8
      ).length;
      const completionRate = progressResults.length > 0 ? 
        (completedStudents / progressResults.length * 100).toFixed(1) + '%' : '0%';
      
      // 更新分析数据
      this.analysisData = {
        studentCount: this.students.length,
        avgProgress,
        avgMastery,
        completionRate,
        summary: this.generateSummary()
      };
    },
    
    // 计算知识点掌握程度
    calculateKnowledgeMastery(knowledgeId, progressResults) {
      let totalMastery = 0;
      let count = 0;
      
      progressResults.forEach(studentProgress => {
        const progress = studentProgress.find(p => p.knowledgeId === knowledgeId);
        if (progress) {
          totalMastery += progress.masteryLevel * 100;
          count++;
        }
      });
      
      const masteryRate = count > 0 ? (totalMastery / count).toFixed(1) : 0;
      return {
        masteryRate: parseFloat(masteryRate),
        studentCount: count
      };
    },
    
    // 生成改进建议
    generateSuggestions(weakPoint) {
      // 基于掌握程度生成针对性建议
      if (weakPoint.masteryRate < 30) {
        return `该知识点掌握程度较低，建议重新讲解核心概念，并提供更多基础练习题。可以考虑安排额外的辅导课程或提供视频教程辅助学习。`;
      } else if (weakPoint.masteryRate < 50) {
        return `该知识点学生理解一般，建议提供更多例题讲解和相关练习，强化学生对知识点的应用能力。可以组织小组讨论，让学生互相学习。`;
      } else {
        return `该知识点学生基本掌握，但仍需巩固，建议提供一些综合应用题，帮助学生加深理解。可以通过定期复习和随堂测验来强化记忆。`;
      }
    },
    
    // 生成学习情况总结
    generateSummary() {
      const knowledgeCount = this.knowledgePoints.length;
      const weakPointCount = this.weakPoints.length;
      const weakPointRate = knowledgeCount > 0 ? (weakPointCount / knowledgeCount * 100).toFixed(1) : 0;
      
      // 学习总体情况
      let overallStatus;
      if (parseFloat(this.analysisData.avgMastery) > 80) {
        overallStatus = '优秀';
      } else if (parseFloat(this.analysisData.avgMastery) > 60) {
        overallStatus = '良好';
      } else if (parseFloat(this.analysisData.avgMastery) > 40) {
        overallStatus = '一般';
      } else {
        overallStatus = '较差';
      }
      
      // 生成总结
      const summary = `
        学生整体学习情况${overallStatus}，平均知识点掌握度为${this.analysisData.avgMastery}，
        学习进度完成率为${this.analysisData.completionRate}。本次分析涉及${knowledgeCount}个知识点，
        其中有${weakPointCount}个知识点（占${weakPointRate}%）掌握率较低，需要重点关注。
        
        建议针对薄弱知识点进行专项训练，可以通过增加练习题、开展小组讨论、提供补充教材等方式来提高学生的掌握程度。
        同时，应注重督促学习进度较慢的学生，以确保整体学习目标的达成。
      `.replace(/\s+/g, ' ').trim();
      
      return summary;
    },
    
    // 获取掌握程度对应的颜色
    getMasteryColor(rate) {
      if (rate < 30) return '#F56C6C'; // 红色
      if (rate < 60) return '#E6A23C'; // 橙色
      if (rate < 80) return '#909399'; // 灰色
      return '#67C23A'; // 绿色
    },
    
    // 初始化图表
    initCharts() {
      this.initKnowledgeMasteryChart();
      this.initProgressChart();
    },
    
    // 初始化知识点掌握情况图表
    initKnowledgeMasteryChart() {
      if (this.knowledgeMasteryChart) {
        this.knowledgeMasteryChart.dispose();
      }
      
      const chartDom = this.$refs.knowledgeMasteryChart;
      if (!chartDom) return;
      
      this.knowledgeMasteryChart = echarts.init(chartDom);
      
      // 准备数据
      const sortedPoints = [...this.knowledgePoints].sort((a, b) => b.masteryRate - a.masteryRate);
      const knowledgeNames = sortedPoints.map(point => point.name);
      const masteryRates = sortedPoints.map(point => point.masteryRate);
      const colors = sortedPoints.map(point => this.getMasteryColor(point.masteryRate));
      
      // 设置图表选项
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            const data = params[0];
            return `${data.name}: ${data.value}%`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        yAxis: {
          type: 'category',
          data: knowledgeNames,
          axisLabel: {
            width: 100,
            overflow: 'truncate'
          }
        },
        series: [{
          name: '掌握率',
          type: 'bar',
          data: masteryRates,
          itemStyle: {
            color: function(params) {
              return colors[params.dataIndex];
            }
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%'
          }
        }]
      };
      
      this.knowledgeMasteryChart.setOption(option);
      
      // 响应窗口大小变化
      window.addEventListener('resize', () => {
        this.knowledgeMasteryChart.resize();
      });
    },
    
    // 初始化进度统计图表
    initProgressChart() {
      if (this.progressChart) {
        this.progressChart.dispose();
      }
      
      const chartDom = this.$refs.progressChart;
      if (!chartDom) return;
      
      this.progressChart = echarts.init(chartDom);
      
      // 根据进度区间统计学生数量
      const progressRanges = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
      const studentCounts = [0, 0, 0, 0, 0];
      
      this.students.forEach(student => {
        // 获取学生的平均进度
        const studentProgress = this.getStudentAverageProgress(student.studentId);
        
        // 根据进度分配到对应区间
        if (studentProgress < 20) {
          studentCounts[0]++;
        } else if (studentProgress < 40) {
          studentCounts[1]++;
        } else if (studentProgress < 60) {
          studentCounts[2]++;
        } else if (studentProgress < 80) {
          studentCounts[3]++;
        } else {
          studentCounts[4]++;
        }
      });
      
      // 设置图表选项
      const option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '5%',
          left: 'center'
        },
        series: [
          {
            name: '学习进度',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: studentCounts[0], name: progressRanges[0] },
              { value: studentCounts[1], name: progressRanges[1] },
              { value: studentCounts[2], name: progressRanges[2] },
              { value: studentCounts[3], name: progressRanges[3] },
              { value: studentCounts[4], name: progressRanges[4] }
            ]
          }
        ]
      };
      
      this.progressChart.setOption(option);
      
      // 响应窗口大小变化
      window.addEventListener('resize', () => {
        this.progressChart.resize();
      });
    },
    
    // 获取学生的平均学习进度
    getStudentAverageProgress(studentId) {
      // 这里应该根据实际数据结构调整，现在我们简单使用studentId做随机种子
      // 实际应用中应从学习进度数据中计算平均值
      const seed = parseInt(String(studentId).slice(-2)) || 0;
      const random = Math.floor((seed + Math.random() * 100) % 100);
      return random;
    }
  }
}
</script>

<style scoped>
.analysis-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.selection-container {
  margin-bottom: 20px;
}

.analysis-results {
  margin-top: 20px;
}

.analysis-card {
  margin-bottom: 20px;
}

.data-overview {
  display: flex;
  justify-content: space-around;
  text-align: center;
  padding: 20px 0;
}

.data-item {
  padding: 10px 20px;
}

.data-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}

.data-label {
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

.chart-container {
  padding: 10px;
}

.weak-points-container {
  padding: 10px;
}

.weak-point-item {
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
}

.weak-point-item h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
}

.mastery-bar {
  height: 24px;
  background-color: #F2F6FC;
  border-radius: 4px;
  margin-bottom: 15px;
  position: relative;
}

.mastery-progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.mastery-label {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #606266;
  font-size: 12px;
}

.improvement-suggestions {
  background-color: #F8F8F8;
  padding: 10px;
  border-radius: 4px;
}

.improvement-suggestions h4 {
  margin-top: 0;
  margin-bottom: 5px;
  font-size: 14px;
  color: #606266;
}

.improvement-suggestions p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.summary-container {
  padding: 15px;
  line-height: 1.6;
  color: #606266;
}

.loading-container,
.empty-container {
  padding: 40px 0;
  text-align: center;
}

.empty-data {
  color: #909399;
  text-align: center;
  padding: 20px 0;
}
</style>