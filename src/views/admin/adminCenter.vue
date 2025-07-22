<template>
  <div class="admin-center">
    <h1>慧课平台后台管理中心</h1>
    <el-container>
      <el-aside width="200px">
        <el-menu
          router
          :default-active="$route.path"
          class="admin-menu"
        >
          <el-menu-item index="/admin/teacher">
            <el-icon><User /></el-icon>
            <span>教师管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/student">
            <el-icon><UserFilled /></el-icon>
            <span>学生管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/stats">
            <el-icon><DataLine /></el-icon>
            <span>统计分析</span>
          </el-menu-item>
          <el-menu-item index="/admin/setting">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { User, UserFilled, DataLine, Setting } from '@element-plus/icons-vue'
</script>

<style scoped>
.admin-center {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

h1 {
  margin: 20px;
  color: #333;
}

.el-container {
  flex: 1;
  overflow: hidden;
}

.el-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e6e6e6;
}

.admin-menu {
  border-right: none;
}

.el-main {
  padding: 20px;
  background-color: #fff;
}

.el-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
