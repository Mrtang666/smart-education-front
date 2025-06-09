<template>
  <router-view />
  <StagewiseToolbar v-if="isDevelopment" :config="stagewiseConfig" />
</template>

<script>
import { StagewiseToolbar } from '@stagewise/toolbar-vue';
import { stagewiseConfig } from './plugins/stagewise';

export default {
  components: {
    StagewiseToolbar
  },
  data() {
    return {
      isDevelopment: process.env.NODE_ENV === 'development',
      stagewiseConfig
    };
  }
};
</script>

<style>
body {
  margin: 0;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
}

html {
  overflow-y: auto;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
