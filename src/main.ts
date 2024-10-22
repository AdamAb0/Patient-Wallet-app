import './app.css'
import App from './App.svelte'

declare module 'libphonenumber-js/max';

const app = new App({
  target: document.body,
  props: {
    url: window.location.pathname
  }
})

export default app

