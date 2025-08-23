const AutoImport = require("unplugin-auto-import/webpack");
const Components = require("unplugin-vue-components/webpack");
const { ElementPlusResolver } = require("unplugin-vue-components/resolvers");
const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  // 设置网页标题
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title = '慧课';
        return args;
      });
  },
  devServer: {
    port: 8080,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: (error) => {
          const ignoreErrors = [
            "ResizeObserver loop completed with undelivered notifications",
            "ResizeObserver loop limit exceeded",
          ];
          return !ignoreErrors.some((ignoreError) =>
            error.message.includes(ignoreError)
          );
        },
      },
    },
  },
  configureWebpack: {
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
        // 自动导入 Element Plus 相关函数，如 ElMessage
        imports: [
          "vue",
          "vue-router",
          {
            "element-plus": [
              "ElMessage",
              "ElMessageBox",
              "ElNotification",
              "ElLoading",
            ],
          },
        ],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  },
});
