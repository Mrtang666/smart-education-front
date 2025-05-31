import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/login",
    component: () => import("@/views/auth/loginPage.vue"),
  },
  {
    path: "/teacher/center",
    name: "TeacherCenter",
    component: () => import("@/views/teacher/teacherCenter.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
