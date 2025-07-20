import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import Vant from "vant";
import "vant/lib/index.css";
import { Icon } from "vant";
// 引入Element Plus
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// 引入中文语言包
import zhCn from "element-plus/es/locale/lang/zh-cn";
// 引入Element Plus图标
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
// 引入stagewise工具栏 - 使用组件方式
import { setupStagewise } from "./plugins/stagewise";
// 引入错误处理工具
import { initErrorHandler } from "./utils/errorHandler";
// 不再使用这种初始化方法
// import initStagewise from "./plugins/stagewise-init";

// 初始化错误处理器（处理ResizeObserver等开发环境错误）
initErrorHandler();

const app = createApp(App);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(`ElIcon${key}`, component);
}

// 使用Element Plus，并设置中文
app.use(ElementPlus, {
  locale: zhCn,
});

app.use(Vant);
app.use(Icon);
app.use(router);

// 使用组件方式初始化Stagewise
setupStagewise(app);

// 不再使用这种初始化方法
// initStagewise();

app.mount("#app");
