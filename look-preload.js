const { contextBridge, ipcRenderer } = require("electron");

/* 外观浮窗专用的最小桥：只做三件事 */
/* 页面里读不到 process（nodeIntegration 关闭），主题只能由 preload 传过去 */
const themeArg = process.argv.find((a) => a.startsWith("--wgt-theme="));
const THEME = themeArg ? themeArg.split("=")[1] : "dark";

contextBridge.exposeInMainWorld("look", {
  theme: THEME,
  get: () => ipcRenderer.invoke("wgt:get-look"),
  set: (v) => ipcRenderer.invoke("wgt:set-look", v),
  close: () => ipcRenderer.send("wgt:close-look"),
});
