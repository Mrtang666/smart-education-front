import axios from "axios";
import {
  getValidToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
} from "@/utils/auth";
import { authAPI } from "./api";

// 创建带鉴权与刷新逻辑的 Axios 实例（与 src/api/api.js 保持一致的基址与超时）
const createAuthorizedAxios = () => {
  const instance = axios.create({
    baseURL: "http://118.89.136.119:8081",
    timeout: 10000,
  });

  // 携带当前可用的 access token
  instance.interceptors.request.use(
    (config) => {
      const token = getValidToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
        // dev 日志（避免在生产环境输出）
        if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
          console.debug("[studentHttp] attach token", (token || "").slice(0, 10) + "...");
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 自动处理 401，使用刷新 token 续期
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config || {};
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) throw new Error("缺少刷新token");
          const { accessToken, refreshToken: newRefreshToken } = await authAPI.teacherRefreshToken({ refreshToken });
          setToken(accessToken);
          setRefreshToken(newRefreshToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshErr) {
          // 刷新失败，向上抛出错误，交由调用方处理（可能跳转登录）
          return Promise.reject(refreshErr);
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const http = createAuthorizedAxios();

// 学生端专用：与 src/api/api.js 的学生拦截器策略一致，使用学生刷新接口
const createStudentAuthorizedAxios = () => {
  const instance = axios.create({
    baseURL: "http://118.89.136.119:8081",
    timeout: 30000, // 增加超时时间到30秒，AI生成需要更长时间
  });

  // 调试函数：检查本地存储的token状态
  const debugTokenState = () => {
    if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const userRole = localStorage.getItem('user_role');
      console.debug("[DEBUG] Token state:", {
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length || 0,
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length || 0,
        userRole: userRole,
        accessTokenPreview: accessToken ? `${accessToken.slice(0, 20)}...` : 'null'
      });
    }
  };

  instance.interceptors.request.use(
    (config) => {
      debugTokenState(); // 每次请求前检查token状态
      const token = getValidToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
        // dev 日志（避免在生产环境输出）
        if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
          console.debug("[studentHttp] attach token", (token || "").slice(0, 10) + "...");
        }
      } else {
        console.warn("[studentHttp] No valid token found for request:", config.url);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (
        error.response &&
        error.response.status === 401 &&
        !originalRequest?._retry
      ) {
        originalRequest._retry = true;
        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) {
            throw new Error("没有刷新token可用");
          }
          const { accessToken, refreshToken: newRefreshToken } =
            await authAPI.studentRefreshToken({ refreshToken });
          if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
            console.debug("[studentHttp] token refreshed");
          }
          setToken(accessToken);
          setRefreshToken(newRefreshToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // 学生端刷新失败，跳转登录
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const studentHttp = createStudentAuthorizedAxios();

// 题库相关接口
export const problemBank = {
  /**
   * 更新题目
   * POST /api/problemBank/update/{id}
   */
  async update(id, data) {
    const problemId = String(id);
    return (await http.post(`/api/problemBank/update/${problemId}`, data)).data;
  },

  /**
   * 新增题目
   * POST /api/problemBank/save
   */
  async save(data) {
    return (await http.post(`/api/problemBank/save`, data)).data;
  },

  /**
   * 批量新增题目
   * POST /api/problemBank/batchSave
   */
  async batchSave(list) {
    return (await http.post(`/api/problemBank/batchSave`, list)).data;
  },

  /**
   * 根据ID获取题目
   * GET /api/problemBank/{id}
   */
  async getById(id) {
    const problemId = String(id);
    return (await http.get(`/api/problemBank/${problemId}`)).data;
  },

  /**
   * 关键字搜索题目
   * GET /api/problemBank/search?keyword=xxx
   */
  async search(keyword) {
    return (
      await http.get(`/api/problemBank/search`, { params: { keyword } })
    ).data;
  },

  /**
   * 分页获取题库
   * GET /api/problemBank/page?pageNum=&pageSize=
   */
  async page(pageNum, pageSize) {
    return (
      await http.get(`/api/problemBank/page`, { params: { pageNum, pageSize } })
    ).data;
  },

  /**
   * 删除题目
   * DELETE /api/problemBank/delete/{id}
   */
  async delete(id) {
    const problemId = String(id);
    return (await http.delete(`/api/problemBank/delete/${problemId}`)).data;
  },
};


// 知识单元相关接口（knowledge-unit-controller）
export const knowledgeUnitController = {
  /**
   * 批量更新知识单元状态
   * POST /api/knowledgeUnit/batchUpdateStatus/{status}
   */
  async batchUpdateStatus(status, idList) {
    const pathStatus = String(status);
    return (
      await http.post(`/api/knowledgeUnit/batchUpdateStatus/${pathStatus}`, idList)
    ).data;
  },

  /**
   * 批量新增知识单元
   * POST /api/knowledgeUnit/batchAdd
   */
  async batchAdd(list) {
    return (await http.post(`/api/knowledgeUnit/batchAdd`, list)).data;
  },

  /**
   * 根据目标分析出知识单元并写入数据库（状态：AI待审）
   * POST /api/knowledgeUnit/analyse-knowledge?target=&subject=
   */
  async analyseKnowledge(target, subject) {
    return (
      await http.post(`/api/knowledgeUnit/analyse-knowledge`, null, {
        params: { target, subject },
      })
    ).data;
  },

  /**
   * 新增知识单元
   * POST /api/knowledgeUnit/add
   */
  async add(data) {
    return (await http.post(`/api/knowledgeUnit/add`, data)).data;
  },

  /**
   * 搜索知识单元
   * GET /api/knowledgeUnit/search?keyword=
   */
  async search(keyword) {
    return (
      await http.get(`/api/knowledgeUnit/search`, { params: { keyword } })
    ).data;
  },

  /**
   * 根据 subject 名分页获取所有预置知识单元
   * GET /api/knowledgeUnit/preset/{subject}?current=&size=
   */
  async getPresetBySubject(subject, current = 1, size = 10) {
    return (
      await http.get(`/api/knowledgeUnit/preset/${encodeURIComponent(subject)}`, {
        params: { current, size },
      })
    ).data;
  },

  /**
   * 分页获取所有待审知识单元
   * GET /api/knowledgeUnit/pending?current=&size=
   */
  async getPending(current = 1, size = 10) {
    return (
      await http.get(`/api/knowledgeUnit/pending`, { params: { current, size } })
    ).data;
  },

  /**
   * 根据 subject 名分页获取该 subject 所有待审知识单元
   * GET /api/knowledgeUnit/pending/{subject}?current=&size=
   */
  async getPendingBySubject(subject, current = 1, size = 10) {
    return (
      await http.get(
        `/api/knowledgeUnit/pending/${encodeURIComponent(subject)}`,
        {
          params: { current, size },
        }
      )
    ).data;
  },

  /**
   * 根据 subject 名获取所有知识单元
   * GET /api/knowledgeUnit/getAll/subject/{subject}
   */
  async getAllBySubject(subject) {
    return (
      await http.get(
        `/api/knowledgeUnit/getAll/subject/${encodeURIComponent(subject)}`
      )
    ).data;
  },

  /**
   * 根据 id 获取知识单元
   * GET /api/knowledgeUnit/get/{id}
   */
  async getById(id) {
    const kuId = String(id);
    return (await http.get(`/api/knowledgeUnit/get/${kuId}`)).data;
  },

  /**
   * 分页获取所有废弃知识单元
   * GET /api/knowledgeUnit/deprecated?current=&size=
   */
  async getDeprecated(current = 1, size = 10) {
    return (
      await http.get(`/api/knowledgeUnit/deprecated`, {
        params: { current, size },
      })
    ).data;
  },

  /**
   * 批量删除知识单元
   * DELETE /api/knowledgeUnit/batchDelete
   */
  async batchDelete(idList) {
    return (
      await http.delete(`/api/knowledgeUnit/batchDelete`, { data: idList })
    ).data;
  },
};

// 题目-知识单元关系接口
export const problemKnowledgeUnit = {
  /**
   * 批量添加题目与知识单元关系
   * POST /api/problemKnowledgeUnit/batchAdd
   */
  async batchAdd(list) {
    return (await http.post(`/api/problemKnowledgeUnit/batchAdd`, list)).data;
  },

  /**
   * 添加题目与知识单元关系
   * POST /api/problemKnowledgeUnit/add
   */
  async add(data) {
    return (await http.post(`/api/problemKnowledgeUnit/add`, data)).data;
  },

  /**
   * 根据 knowledgeUnitId 获取所有题目ID
   * GET /api/problemKnowledgeUnit/getProblemIdByKnowledgeUnitId/{knowledgeUnitId}
   */
  async getProblemIdByKnowledgeUnitId(knowledgeUnitId) {
    const kuId = String(knowledgeUnitId);
    return (
      await http.get(
        `/api/problemKnowledgeUnit/getProblemIdByKnowledgeUnitId/${kuId}`
      )
    ).data;
  },

  /**
   * 根据 problemId 获取所有知识单元ID
   * GET /api/problemKnowledgeUnit/getKnowledgeUnitIdByProblemId/{problemId}
   */
  async getKnowledgeUnitIdByProblemId(problemId) {
    const pId = String(problemId);
    return (
      await http.get(
        `/api/problemKnowledgeUnit/getKnowledgeUnitIdByProblemId/${pId}`
      )
    ).data;
  },

  /**
   * 删除该题目的所有题目与知识单元关系
   * DELETE /api/problemKnowledgeUnit/deleteByProblemId/{problemId}
   */
  async deleteByProblemId(problemId) {
    const pId = String(problemId);
    return (
      await http.delete(`/api/problemKnowledgeUnit/deleteByProblemId/${pId}`)
    ).data;
  },

  /**
   * 删除该知识单元的所有题目与知识单元关系
   * DELETE /api/problemKnowledgeUnit/deleteByKnowledgeUnitId/{knowledgeUnitId}
   */
  async deleteByKnowledgeUnitId(knowledgeUnitId) {
    const kuId = String(knowledgeUnitId);
    return (
      await http.delete(
        `/api/problemKnowledgeUnit/deleteByKnowledgeUnitId/${kuId}`
      )
    ).data;
  },

  /**
   * 删除指定题目与知识单元的关系
   * DELETE /api/problemKnowledgeUnit/delete/{problemId}/{knowledgeUnitId}
   */
  async deleteRelation(problemId, knowledgeUnitId) {
    const pId = String(problemId);
    const kuId = String(knowledgeUnitId);
    return (
      await http.delete(`/api/problemKnowledgeUnit/delete/${pId}/${kuId}`)
    ).data;
  },
};

// 课程（subject）相关接口
export const subjectController = {
  /**
   * 更新课程
   * PUT /api/subject/update
   */
  async update(data) {
    return (await http.put(`/api/subject/update`, data)).data;
  },

  /**
   * 新增课程
   * POST /api/subject/add
   */
  async add(data) {
    return (await http.post(`/api/subject/add`, data)).data;
  },

  /**
   * 添加课程和科目的关联关系
   * POST /api/subject/addRelation/{subjectId}/{courseId}
   */
  async addRelation(subjectId, courseId) {
    const sId = String(subjectId);
    const cId = String(courseId);
    return (await http.post(`/api/subject/addRelation/${sId}/${cId}`)).data;
  },

  /**
   * 获取课程
   * GET /api/subject/{id}
   */
  async getById(id) {
    const sId = String(id);
    return (await http.get(`/api/subject/${sId}`)).data;
  },

  /**
   * 搜索课程
   * GET /api/subject/search/{keywords}
   */
  async search(keywords) {
    return (await http.get(`/api/subject/search/${encodeURIComponent(keywords)}`)).data;
  },

  /**
   * 根据 courseId 获取关联的课程
   * GET /api/subject/getSubjectByCourseId/{courseId}
   */
  async getSubjectByCourseId(courseId) {
    const cId = String(courseId);
    return (await http.get(`/api/subject/getSubjectByCourseId/${cId}`)).data;
  },

  /**
   * 根据 subjectId 获取关联的课程列表
   * GET /api/subject/getCoursesBySubjectId/{subjectId}
   */
  async getCoursesBySubjectId(subjectId) {
    const sId = String(subjectId);
    return (await http.get(`/api/subject/getCoursesBySubjectId/${sId}`)).data;
  },

  /**
   * 删除课程与科目关系
   * DELETE /api/subject/deleteRelation/{subjectId}/{courseId}
   */
  async deleteRelation(subjectId, courseId) {
    const sId = String(subjectId);
    const cId = String(courseId);
    return (await http.delete(`/api/subject/deleteRelation/${sId}/${cId}`)).data;
  },

  /**
   * 删除课程
   * DELETE /api/subject/delete/{id}
   */
  async delete(id) {
    const sId = String(id);
    return (await http.delete(`/api/subject/delete/${sId}`)).data;
  },
};

// 学习计划接口集合
export const learningPlanController = {
  /**
   * 更新学习计划（不更新 planId 和 studentId）
   * PUT /api/learning-plan/update-plan
   */
  async updatePlan(data) {
    return (await studentHttp.put(`/api/learning-plan/update-plan`, data)).data;
  },

  /**
   * 添加学习计划
   * POST /api/learning-plan/add-plan/{studentId}
   */
  async addPlan(studentId, data) {
    const sId = String(studentId);
    return (await studentHttp.post(`/api/learning-plan/add-plan/${sId}`, data)).data;
  },

  /**
   * 按名称搜索学生学习计划
   * GET /api/learning-plan/student/{studentId}/search?keywords=
   */
  async searchStudentPlans(studentId, keywords) {
    const sId = String(studentId);
    return (
      await studentHttp.get(`/api/learning-plan/student/${sId}/search`, {
        params: { keywords },
      })
    ).data;
  },

  /**
   * 查询某学生未完成的学习计划
   * GET /api/learning-plan/student/{studentId}/incomplete
   */
  async getIncompletePlans(studentId) {
    const sId = String(studentId);
    return (await studentHttp.get(`/api/learning-plan/student/${sId}/incomplete`)).data;
  },

  /**
   * 获取学生已经结束的学习计划（历史）
   * GET /api/learning-plan/student/{studentId}/history
   */
  async getHistoryPlans(studentId) {
    const sId = String(studentId);
    return (await studentHttp.get(`/api/learning-plan/student/${sId}/history`)).data;
  },

  /**
   * AI 生成学习计划并持久化到数据库
   * GET /api/learning-plan/student/{studentId}/generate?targetGoal=&timeFrame=&courseId=
   */
  async generatePlan(studentId, targetGoal, timeFrame, courseId) {
    const sId = String(studentId);
    
    // 为AI生成接口创建专门的配置，使用更长的超时时间
    const aiConfig = {
      timeout: 60000, // AI生成接口使用60秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    return (
      await studentHttp.get(`/api/learning-plan/student/${sId}/generate`, {
        params: { targetGoal, timeFrame, courseId },
        ...aiConfig
      })
    ).data;
  },

  /**
   * 获取特定日期生效的学习计划内容
   * GET /api/learning-plan/student/{studentId}/day?date=
   */
  async getPlanOfDay(studentId, date) {
    const sId = String(studentId);
    return (
      await studentHttp.get(`/api/learning-plan/student/${sId}/day`, {
        params: { date },
      })
    ).data;
  },

  /**
   * 获取学生的当前学习计划
   * GET /api/learning-plan/student/{studentId}/current
   */
  async getCurrentPlan(studentId) {
    const sId = String(studentId);
    return (await studentHttp.get(`/api/learning-plan/student/${sId}/current`)).data;
  },

  /**
   * 自动获取当前学习计划（从本地存储获取studentId）
   * GET /api/learning-plan/student/{studentId}/current
   */
  async getCurrentPlanAuto() {
    // 从本地存储获取学生ID
    const { getStudentId } = await import('@/utils/auth');
    const studentId = getStudentId();
    
    if (!studentId) {
      throw new Error('无法获取学生ID，请重新登录');
    }
    
    return (await studentHttp.get(`/api/learning-plan/student/${studentId}/current`)).data;
  },

  /**
   * 查询某学生已完成的学习计划
   * GET /api/learning-plan/student/{studentId}/complete
   */
  async getCompletedPlans(studentId) {
    const sId = String(studentId);
    return (await studentHttp.get(`/api/learning-plan/student/${sId}/complete`)).data;
  },

  /**
   * 删除学习计划
   * DELETE /api/learning-plan/{planId}
   */
  async deletePlan(planId) {
    const pId = String(planId);
    return (await studentHttp.delete(`/api/learning-plan/${pId}`)).data;
  },
};


