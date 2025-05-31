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
app.mount("#app");
