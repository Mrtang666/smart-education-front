import { createRouter, createWebHashHistory } from 'vue-router'
import TeacherCenter from '@/views/teacher/teacherCenter.vue'

const routes = [
  {
    path: '/teacher/center',
    name: 'TeacherCenter',
    component: TeacherCenter
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
