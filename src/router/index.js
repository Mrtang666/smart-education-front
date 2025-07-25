import { createRouter, createWebHashHistory } from "vue-router";
import { getValidToken } from "@/utils/auth";

const routes = [
  {
    path: "/admin",
    component: () => import("@/views/admin/adminCenter.vue"),
    redirect: "/admin/teacher",
    meta: { requiresAuth: true },
    children: [
      {
        path: "teacher",
        component: () => import("@/views/admin/teacherManage.vue"),
      },
      {
        path: "student",
        component: () => import("@/views/admin/studentManage.vue"),
      },
      {
        path: "stats",
        component: () => import("@/views/admin/statsView.vue"),
      },
      {
        path: "setting",
        component: () => import("@/views/admin/systemSetting.vue"),
      }
    ]
  },
  {
    path: "/passwordchange",
    component: () => import("@/components/auth/passwordChange.vue"),
    meta: { requiresAuth: false }
  },
  {
    path: "/login",
    component: () => import("@/views/auth/loginPage.vue"),
    meta: { requiresAuth: false }
  },
  {
    path: "/register",
    component: () => import("@/views/auth/registerPage.vue"),
    meta: { requiresAuth: false }
  },
  {
    path: "/teacher",
    component: () => import("@/views/teacher/teacherCenter.vue"),
    redirect: "/teacher/center",
    meta: { requiresAuth: true },
    children: [
      {
        path: "course",
        component: () => import("@/views/teacher/teacherCourse.vue"),
      },
      {
        path: "course/:courseId",
        component: () => import("@/views/teacher/teacherCourseDetail.vue"),
        props: true,
        name: "teacherCourseDetail"
      },
      {
        path: "center",
        component: () => import("@/views/teacher/teacherHome.vue"),
      },
      {
        path: "knowledge",
        component: () => import("@/views/teacher/teacherKnowledge.vue"),
      },
      {
        path: "knowledge/:knowledgeId",
        component: () => import("@/views/teacher/teacherKnowledgeDetail.vue"),
        props: true,
        name: "teacherKnowledgeDetail"
      },
      {
        path: "exam",
        component: () => import("@/views/teacher/teacherExam.vue"),
      },
      {
        path: "exam/scores/:examId",
        component: () => import("@/views/teacher/teacherExamScores.vue"),
        props: true,
        name: "teacherExamScores"
      },
      {
        path: "exercise",
        component: () => import("@/views/teacher/teacherExercise.vue"),
      }, 
      {
        path: "homework/:id",
        component: () => import("@/views/teacher/HomeworkDetail.vue"),
        props: true,
        name: "HomeworkDetail"
      },
      {
        path: "student-exam-detail/:studentId/:examId",
        component: () => import("@/views/teacher/StudentExamDetail.vue"),
        props: true,
        name: "StudentExamDetail"
      },
      {
        path: "analysis",
        component: () => import("@/views/teacher/teacherAnalysis.vue"),
      },
      {
        path: "setting",
        component: () => import("@/views/teacher/teacherSetting.vue"),
      },
      
      
      // {
      //   path: "examCheck",
      //   component: () => import("@/views/teacher/teacherExamCheck.vue"),
      // },
      // {
      //   path: "exercise",
      //   component: () => import("@/views/teacher/teacherExercise.vue"),
      // },
      // {
      //   path: "exerciseCheck",
      //   component: () => import("@/views/teacher/teacherExerciseCheck.vue"),
      // },
      // {
      //   path: "attendanceManagement",
      //   component: () => import("@/views/teacher/teacherAttendanceManagement.vue"),
      // },
      // {
      //   path: "class",
      //   component: () => import("@/views/teacher/teacherClass.vue"),
      // },
      // {
      //   path: "studentAnalysis",
      //   component: () => import("@/views/teacher/StudentAnalysis.vue"),
      // },
    ]
  },
  {
    path: "/student",
    component: () => import("@/views/student/studentCenter.vue"),
    redirect: "/student/center",
    meta: { requiresAuth: true },
    children: [
      {
        path: "knowledge/:knowledgeId",
        component: () => import("@/views/student/studentKnowledgeDetail.vue"),
        props: true,
        name: "studentKnowledgeDetail"
      },
      {
        path: "homework/:homeworkId",
        component: () => import("@/views/student/studentHomeworkDetail.vue"),
        props: true,
        name: "studentHomeworkDetail"
      },
      {
        path: "exam/:examId",
        component: () => import("@/views/student/studentExamDetail.vue"),
        props: true,
        name: "studentExamDetail"
      },
      {
        path: "center",
        component: () => import("@/views/student/studentHome.vue"),
      },
      // {
      //   path: "homework",
      //   component: () => import("@/views/student/studentHomework.vue"),
      // },
      {
        path: "exam",
        component: () => import("@/views/student/studentExam.vue"),
      },
      {
        path: "settings",
        component: () => import("@/views/student/studentSetting.vue"),
      },
      {
        path: "course",
        component: () => import("@/views/student/studentCourse.vue"),
      },
      {
        path: "course/:courseId",
        component: () => import("@/views/student/studentCourseDetail.vue"),
        props: true,
        name: "studentCourseDetail"
      },
      {
        path: "learning",
        component: () => import("@/views/student/studentLearning.vue"),
      },
      // {
      //   path: "exam",
      //   component: () => import("@/views/student/studentExam.vue"),
      // },
      // {
      //   path: "exam/:examId",
      //   component: () => import("@/views/student/studentExamDetail.vue"),
      //   props: true,
      //   name: "studentExamDetail"
      // },

      {
        path: "plan",
        component: () => import("@/views/student/studentPlan.vue"),
      },
    ]
  },
  {
    path: "/",
    redirect: "/login"
  },
  // 教师课程详情路由
  {
    path: '/teacher/course/:id',
    name: 'TeacherCourseDetail',
    component: () => import('@/views/teacher/teacherCourseDetail.vue'),
    // children: [
    //   {
    //     path: '',
    //     redirect: 'content'
    //   },
    //   {
    //     path: 'content',
    //     name: 'CourseContent',
    //     component: () => import('@/components/teacher/CourseContent.vue')
    //   },
    //   {
    //     path: 'students',
    //     name: 'CourseStudents',
    //     component: () => import('@/components/teacher/StudentManagement.vue')
    //   },
    //   {
    //     path: 'exams',
    //     name: 'CourseExams',
    //     component: () => import('@/components/teacher/ExamManagement.vue')
    //   },
    //   {
    //     path: 'homework',
    //     name: 'CourseHomework',
    //     component: () => import('@/components/teacher/HomeworkManagement.vue')
    //   },
    //   {
    //     path: 'attendance',
    //     name: 'CourseAttendance',
    //     component: () => import('@/components/teacher/AttendanceManagement.vue')
    //   }
    // ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 检查该路由是否需要登录权限
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 获取token
    const token = getValidToken();
    if (!token) {
      // 如果没有token，重定向到登录页面
      next({
        path: '/login',
        // 保存我们所在的位置，以便以后再来
        query: { redirect: to.fullPath }
      });
    } else {
      // 有token，正常跳转
      next();
    }
  } else {
    // 不需要登录权限的路由，直接跳转
    next();
  }
});

export default router;
