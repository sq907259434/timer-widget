const { contextBridge, ipcRenderer } = require("electron");

/* 提示音浮窗专用的最小桥 */
/* 页面里读不到 process（nodeIntegration 关闭），主题只能由 preload 传过去 */
const themeArg = process.argv.find((a) => a.startsWith("--wgt-theme="));
const THEME = themeArg ? themeArg.split("=")[1] : "dark";
/* 可选提示音清单由主进程通过启动参数传进来，避免两边各写一份 */
const soundArg = process.argv.find((a) => a.startsWith("--wgt-sounds="));
let SOUNDS = [];
try { SOUNDS = JSON.parse(decodeURIComponent(soundArg.split("=").slice(1).join("="))); } catch (e) { SOUNDS = []; }

contextBridge.exposeInMainWorld("snd", {
  theme: THEME,
  sounds: SOUNDS,
  get: () => ipcRenderer.invoke("wgt:get-sound"),
  set: (v) => ipcRenderer.send("wgt:set-sound", v),
  close: () => ipcRenderer.send("wgt:close-sound"),
});
