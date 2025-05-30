const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080
  },
  configureWebpack: {
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
        // 自动导入 Element Plus 相关函数，如 ElMessage
        imports: ['vue', 'vue-router', {
          'element-plus': ['ElMessage', 'ElMessageBox', 'ElNotification', 'ElLoading']
        }]
      }),
      Components({
        resolvers: [ElementPlusResolver()]
      })
    ]
  }
})