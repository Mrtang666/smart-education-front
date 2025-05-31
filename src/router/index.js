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
    path: "/teacher/center",
    name: "TeacherCenter",
    component: () => import("@/views/teacher/teacherCenter.vue"),
    meta: { requiresAuth: true }
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
