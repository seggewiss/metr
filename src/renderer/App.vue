<!-- File: metronome-app/src/renderer/App.vue -->
<template>
  <div id="app">
    <Metronome />
  </div>
</template>

<script>
import Metronome from './components/Metronome.vue'

export default {
  name: 'App',
  components: {
    Metronome
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}
</style>