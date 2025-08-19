<template>
  <div class="ku-problems-page">
    <div class="header">
      <h3 style="margin:0">知识单元题目</h3>
      <!-- <div class="sub">知识单元ID：{{ knowledgeUnitId }}</div> -->
      <div class="actions">
        <el-button size="small" @click="goBack">返回</el-button>
        <el-button size="small" type="primary" @click="loadProblems" :loading="loading">刷新</el-button>
      </div>
    </div>

    <el-skeleton :loading="loading" animated :rows="4">
      <template #default>
        <el-empty v-if="problems.length === 0" description="暂无题目" />
        <el-table v-else :data="problems" style="width: 100%">
          <!-- <el-table-column prop="id" label="题目ID" width="180" /> -->
          <el-table-column prop="title" label="标题" min-width="220" />
          <el-table-column prop="content" label="内容" min-width="300" />
          <el-table-column prop="type" label="题型" width="140" />
          <el-table-column prop="expectedAnswer" label="答案" min-width="220" />
        </el-table>
      </template>
    </el-skeleton>
  </div>
</template>

<script>
import { problemKnowledgeUnit, problemBank } from '@/api/apiLearning'

export default {
  name: 'StudentKnowledgeProblems',
  props: {
    knowledgeUnitId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      problems: []
    }
  },
  created() {
    // 兼容从 query 传入
    const kuId = this.knowledgeUnitId || this.$route.params.knowledgeUnitId || this.$route.query.knowledgeUnitId
    if (kuId) {
      this.internalKnowledgeUnitId = String(kuId)
      this.loadProblems()
    }
  },
  methods: {
    goBack() {
      try {
        const q = this.$route?.query || {}
        // 优先：按课程详情页返回
        if (q.courseId) {
          this.$router.push({
            name: 'studentCourseDetail',
            params: { courseId: String(q.courseId) },
            query: q.courseName ? { courseName: q.courseName } : {}
          })
          return
        }

        // 其次：如果提供了通用引用路由信息，则按引用跳转
        if (q.refRouteName) {
          let refParams = {}
          let refQuery = {}
          try { refParams = q.refParams ? JSON.parse(q.refParams) : {} } catch (e) { refParams = {} }
          try { refQuery = q.refQuery ? JSON.parse(q.refQuery) : {} } catch (e) { refQuery = {} }
          this.$router.push({ name: q.refRouteName, params: refParams, query: refQuery })
          return
        }

        // 兜底：浏览器后退
        this.$router.back()
      } catch (e) {
        // 发生异常时也回退
        this.$router.back()
      }
    },
    async loadProblems() {
      try {
        this.loading = true
        this.problems = []
        const kuId = this.internalKnowledgeUnitId || this.knowledgeUnitId || this.$route.params.knowledgeUnitId
        if (!kuId) return

        // 1) 获取题目ID列表
        const idList = await problemKnowledgeUnit.getProblemIdByKnowledgeUnitId(kuId)
        const container = Array.isArray(idList)
          ? idList
          : (idList?.problemIds || idList?.problemIdList || idList?.ids || idList?.data || idList?.records || idList?.list || [])
        const problemIds = Array.isArray(container) ? container : []

        if (problemIds.length === 0) {
          this.problems = []
          return
        }

        // 2) 获取题目详情
        const results = await Promise.all(problemIds.map(async (pid) => {
          try {
            const detail = await problemBank.getById(pid)
            const d = (detail && (detail.data || detail.result || detail.payload)) || detail || {}
            let options = d.options
            if (typeof options === 'string') {
              try {
                if (options.trim().startsWith('[')) options = JSON.parse(options)
                else options = options.split(/\r?\n|\||；|;|、|，/).map(t => t.trim()).filter(Boolean)
              } catch (_) {
                options = options.split(/\r?\n|\||；|;|、|，/).map(t => t.trim()).filter(Boolean)
              }
            }
            return {
              id: d.id ?? pid,
              title: d.title || d.name || '',
              content: d.content || d.question || d.stem || '',
              type: d.type || d.problemType || '',
              options: Array.isArray(options) ? options : (options ? [String(options)] : []),
              expectedAnswer: d.expectedAnswer || d.expected_answer || d.answer || '',
              analysis: d.analysis || '',
              origin: d.origin || ''
            }
          } catch (e) {
            return { id: pid, content: '题目加载失败', type: '', options: [], expectedAnswer: '', analysis: '' }
          }
        }))
        this.problems = results
      } catch (e) {
        console.error('加载题目失败:', e)
        this.$message.error('加载题目失败，请稍后再试')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.ku-problems-page {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.header .sub {
  color: #909399;
  font-size: 13px;
}
.header .actions {
  margin-left: auto;
}
</style>
