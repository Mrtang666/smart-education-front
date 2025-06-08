import { createRouter, createWebHashHistory } from "vue-router";
import { getValidToken } from "@/utils/auth";

const routes = [
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
        path: "center",
        component: () => import("@/views/student/studentHome.vue"),
      },
      {
        path: "homework",
        component: () => import("@/views/student/studentHomework.vue"),
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
      // {
      //   path: "learning",
      //   component: () => import("@/views/student/studentLearning.vue"),
      // },
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
      // {
      //   path: "schedule",
      //   component: () => import("@/views/student/studentSchedule.vue"),
      // },
      // {
      //   path: "report",
      //   component: () => import("@/views/student/studentReport.vue"),
      // },
    ]
  },
  {
    path: "/",
    redirect: "/login"
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
