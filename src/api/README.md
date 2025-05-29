# 智慧教育平台前端 API 使用说明

本项目所有前后端接口均已在 `src/api/api.js` 中进行统一封装，接口分为多个模块（如 `authAPI`、`studentAPI`、`teacherAPI`、`courseAPI`、`knowledgeAPI`、`questionAPI`、`examAPI`、`learningPlanAPI`、`attendanceAPI`、`studentExamAPI`、`studentAssistantAPI`、`learningProgressAPI`、`teachingAssistantAPI` 等）。

## 如何引入

在需要调用接口的文件顶部引入对应 API：

```js
import { authAPI, studentAPI, teacherAPI, courseAPI, knowledgeAPI, questionAPI, examAPI, learningPlanAPI, attendanceAPI, studentExamAPI, studentAssistantAPI, learningProgressAPI, teachingAssistantAPI } from '@/api/api';
```

你也可以只引入需要的部分：

```js
import { courseAPI } from '@/api/api';
```

---

## API 分类与接口速查

### 1. 用户认证与注册（authAPI）

- **学生登录**
  ```js
  authAPI.studentLogin(username, password)
  ```
  - 参数：`username` (string), `password` (string)

- **教师登录**
  ```js
  authAPI.teacherLogin(username, password)
  ```
  - 参数：`username` (string), `password` (string)

- **学生注册**
  ```js
  authAPI.studentRegister({ username, password, email, fullName, phone })
  ```
  - 参数：对象，详见 JSDoc

- **教师注册**
  ```js
  authAPI.registerTeacher({ username, password, email, fullName, phone })
  ```

- **刷新 token**
  ```js
  authAPI.studentRefreshToken({ refreshToken })
  authAPI.teacherRefreshToken({ refreshToken })
  ```
  - 参数：对象 `{ refreshToken: string }`

- **修改密码**
  ```js
  authAPI.changeStudentPassword({ username, oldPassword, newPassword })
  authAPI.changeTeacherPassword({ username, oldPassword, newPassword })
  ```

- **检查用户名可用**
  ```js
  authAPI.checkAvailableUsername(username)
  authAPI.checkAvailableUsernameForTeacher(username)
  ```

---

### 2. 学生相关（studentAPI）

- **新增/更新学生信息**
  ```js
  studentAPI.saveOrUpdateStudent({ ... })
  ```
  - 参数：对象，详见 JSDoc

- **根据ID/用户名获取学生信息**
  ```js
  studentAPI.getStudentById(studentId)
  studentAPI.getStudentByUsername(username)
  ```

- **获取当前登录学生信息**
  ```js
  studentAPI.getSelfStudentInfo()
  ```

- **搜索学生**
  ```js
  studentAPI.searchStudents({ keywords, grade, className })
  ```

- **根据姓名/班级获取学生列表**
  ```js
  studentAPI.getStudentsByFullName(fullName)
  studentAPI.getStudentsByClass({ grade, className })
  ```

- **检查邮箱**
  ```js
  studentAPI.checkEmail(email)
  ```

---

### 3. 教师相关（teacherAPI）

- **根据用户名/ID获取教师信息**
  ```js
  teacherAPI.getTeacherByUsername(username)
  teacherAPI.getTeacherById(id)
  ```

- **获取当前登录教师信息**
  ```js
  teacherAPI.getSelfTeacherInfo()
  ```

- **更新教师信息**
  ```js
  teacherAPI.updateTeacher({ ... })
  ```

---

### 4. 课程相关（courseAPI）

- **新增/更新课程**
  ```js
  courseAPI.saveOrUpdateCourse({ ... })
  ```
  - 参数：对象，详见 JSDoc

- **获取/删除课程**
  ```js
  courseAPI.getCourseById(courseId)
  courseAPI.deleteCourse(courseId)
  ```

- **搜索/模糊搜索/按名称/编码/类别获取课程**
  ```js
  courseAPI.searchCourses(keywords, category)
  courseAPI.getCoursesByNameLike(name)
  courseAPI.getCourseByName(name)
  courseAPI.getCourseByCode(code)
  courseAPI.getCoursesByCategory(category)
  courseAPI.getAllCourses()
  ```

- **批量删除课程**
  ```js
  courseAPI.batchDeleteCourses([id1, id2, ...])
  ```

---

### 5. 知识点相关（knowledgeAPI）

- **新增/更新/删除/获取知识点**
  ```js
  knowledgeAPI.saveKnowledge({ ... })
  knowledgeAPI.updateKnowledge({ ... })
  knowledgeAPI.deleteKnowledgeById(id)
  knowledgeAPI.getKnowledgeById(id)
  ```

- **按教师/课程/课程+教师获取知识点**
  ```js
  knowledgeAPI.getKnowledgeByTeacherId(teacherId)
  knowledgeAPI.getKnowledgeByCourseId(courseId)
  knowledgeAPI.getKnowledgeByTeacherInCourse(courseId, teacherId)
  ```

---

### 6. 题目相关（questionAPI）

- **新增/更新/删除/获取题目**
  ```js
  questionAPI.saveQuestion({ ... })
  questionAPI.updateQuestion({ ... })
  questionAPI.deleteQuestionById(id)
  questionAPI.getQuestionById(id)
  ```

- **按教师/知识点/条件获取题目**
  ```js
  questionAPI.getQuestionsByTeacherId(teacherId)
  questionAPI.getQuestionsByKnowledgeId(knowledgeId)
  questionAPI.searchQuestionsInKnowledge(knowledgeId, keyword)
  questionAPI.searchQuestionsInKnowledgeConditionally(knowledgeId, { ... })
  ```

---

### 7. 考试相关（examAPI）

- **新增/更新/删除/获取考试**
  ```js
  examAPI.saveExam({ ... })
  examAPI.updateExam({ ... })
  examAPI.deleteExamById(id)
  examAPI.getExamById(examId)
  ```

- **按教师/课程/课程+教师获取考试**
  ```js
  examAPI.getExamsByTeacher(teacherId)
  examAPI.getExamsInCourse(courseId)
  examAPI.getExamsInCourseByTeacher(courseId, teacherId)
  ```

---

### 8. 学习计划相关（learningPlanAPI）

- **更新进度/获取推荐资源/搜索计划/生成计划/获取历史等**
  ```js
  learningPlanAPI.updatePlanProgress({ ... })
  learningPlanAPI.getPlanRecommendedResources(planId)
  learningPlanAPI.searchLearningPlans(studentId, keywords)
  learningPlanAPI.searchPlanResources(studentId, keywords)
  learningPlanAPI.getPlanResourcesByName(studentId, planName)
  learningPlanAPI.getLearningPlanHistory(studentId)
  learningPlanAPI.generateLearningPlan(studentId, targetGoal, timeFrame, courseIds, knowledgeIds)
  learningPlanAPI.generateLearningPlanByKnowledgeName(studentId, targetGoal, timeFrame, knowledgeNames)
  learningPlanAPI.generateLearningPlanByCourseName(studentId, targetGoal, timeFrame, courseNames)
  learningPlanAPI.getDailyPlanActivities(studentId, date)
  learningPlanAPI.getDailyPlanByName(studentId, planName, date)
  learningPlanAPI.getCurrentLearningPlan(studentId)
  ```

---

### 9. 考勤相关（attendanceAPI）

- **新增/批量新增/更新/获取/搜索/统计考勤**
  ```js
  attendanceAPI.saveAttendance({ ... })
  attendanceAPI.batchSaveAttendance([{ ... }, ...])
  attendanceAPI.updateAttendanceStatus(attendanceId, status, remark)
  attendanceAPI.updateAttendanceByCourseName(studentId, courseName, date, status, remark)
  attendanceAPI.getStudentAttendance(studentId)
  attendanceAPI.getStudentAttendanceByStatus(studentId, status)
  attendanceAPI.getAttendanceStatistics(studentId)
  attendanceAPI.searchAttendance(studentId, { ... })
  attendanceAPI.getStudentAttendanceByDateRange(studentId, startDate, endDate)
  attendanceAPI.getStudentCourseAttendance(studentId, courseId)
  attendanceAPI.getCourseAttendanceStatistics(studentId, courseId)
  attendanceAPI.getAttendanceStatisticsByCourseName(studentId, courseName)
  attendanceAPI.getStudentAttendanceByCourseName(studentId, courseName)
  ```

---

### 10. 学生考试相关（studentExamAPI）

- **提交/批量提交/查询考试与答卷/成绩/分析/建议等**
  ```js
  studentExamAPI.submitAnswer({ ... })
  studentExamAPI.batchSubmitAnswers([{ ... }, ...])
  studentExamAPI.searchExamsAndQuestions(studentId, keywords)
  studentExamAPI.getStudentExamScores(studentId)
  studentExamAPI.searchStudentExamScores(studentId, keywords)
  studentExamAPI.getStudentExamAnswers(studentId, examId)
  studentExamAPI.getStudentAnswersByQuestionContent(studentId, examId, content)
  studentExamAPI.getExamScore(studentId, examId)
  studentExamAPI.getStudentQuestionAnswer(studentId, examId, questionId)
  studentExamAPI.getExamDetail(studentId, examId)
  studentExamAPI.analyzeExamResult(studentId, examId)
  studentExamAPI.generateLearningAdvice(studentId, examId)
  studentExamAPI.getStudentExamAnswersByTitle(studentId, title)
  studentExamAPI.getExamScoreByTitle(studentId, title)
  studentExamAPI.getExamDetailByTitle(studentId, title)
  studentExamAPI.analyzeExamResultByTitle(studentId, title)
  studentExamAPI.generateLearningAdviceByTitle(studentId, title)
  studentExamAPI.intelligentEvaluateAnswerByContent(studentId, title, content)
  studentExamAPI.intelligentEvaluateAnswer(answerId)
  ```

---

### 11. 学生智能助理相关（studentAssistantAPI）

- **提交练习答案/获取提示/提问/查历史/生成练习等**
  ```js
  studentAssistantAPI.submitExerciseAnswers(studentId, exerciseId, answers)
  studentAssistantAPI.getRealTimeHint(studentId, questionId, partialAnswer)
  studentAssistantAPI.askQuestion(studentId, question, courseId)
  studentAssistantAPI.askQuestionByKnowledgeName(studentId, question, knowledgeName)
  studentAssistantAPI.askQuestionByCourseName(studentId, question, courseName)
  studentAssistantAPI.searchQuestionHistory(studentId, keywords, limit)
  studentAssistantAPI.searchLearningResources(studentId, keywords, resourceType, limit)
  studentAssistantAPI.getQuestionHistory(studentId, limit)
  studentAssistantAPI.generateExercise(studentId, courseId, knowledgeIds, difficultyLevel, questionCount)
  studentAssistantAPI.generateWeakPointsExercise(studentId, questionCount)
  studentAssistantAPI.generateExerciseByKnowledgeNames(studentId, knowledgeNames, difficultyLevel, questionCount)
  studentAssistantAPI.generateExerciseByCourseName(studentId, courseName, difficultyLevel, questionCount)
  ```

---

### 12. 学习进度相关（learningProgressAPI）

- **更新/批量更新/获取/统计学习进度等**
  ```js
  learningProgressAPI.updateLearningProgress({ ... })
  learningProgressAPI.updateMasteryLevel(studentId, knowledgeId, score)
  learningProgressAPI.updateMasteryLevelByName(studentId, name, score)
  learningProgressAPI.batchUpdateLearningProgress([{ ... }, ...])
  learningProgressAPI.getStudentProgress(studentId)
  learningProgressAPI.getProgressStatistics(studentId)
  learningProgressAPI.getRecommendedResources(studentId, limit)
  learningProgressAPI.searchRecommendedResources(studentId, keywords, limit)
  learningProgressAPI.getOverallProgress(studentId)
  learningProgressAPI.getStudentKnowledgeProgress(studentId, knowledgeId)
  learningProgressAPI.getStudentKnowledgeProgressByName(studentId, name)
  learningProgressAPI.getStudentCourseProgress(studentId, courseId)
  learningProgressAPI.getCourseProgress(studentId, courseId)
  learningProgressAPI.generateLearningPlan(studentId, courseId)
  learningProgressAPI.getProgressStatisticsByCourse(studentId, courseId)
  learningProgressAPI.getStudentCourseProgressByName(studentId, name)
  learningProgressAPI.getCourseProgressByName(studentId, name)
  learningProgressAPI.generateLearningPlanByCourseName(studentId, name, days)
  ```

---

### 13. 智能备课相关（teachingAssistantAPI）

- **生成智能备课方案**
  ```js
  teachingAssistantAPI.generateLesson({ ... })
  ```

---

## 参数与返回值说明

- 每个 API 方法的参数和返回值结构都已在 `src/api/api.js` 的 JSDoc 注释中详细说明，IDE 悬浮可见。
- 复杂对象参数请参考注释中的字段说明。

---

## 其它说明

- 所有需要 token 的接口已自动携带 token，无需手动传递。
- 登录、注册、刷新 token 等接口无需 token。
- 如需了解更多字段细节，请直接查阅 `src/api/api.js` 对应方法的 JSDoc 注释。

---

如需补充其它说明或有特殊用法需求，请随时联系开发负责人。

---

如需导出为 markdown 文件，可直接复制本内容保存为 `README.md`。
