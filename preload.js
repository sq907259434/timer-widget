const { contextBridge, ipcRenderer } = require("electron");

/* 是否使用系统磨砂：由主进程按 Windows 版本决定，通过启动参数传进来 */
const ACRYLIC = process.argv.some((a) => a === "--wgt-acrylic=1");

/* 初始主题（light / dark）：主进程已经按"跟随系统/手动"解析过，这里只认结果 */
function argVal(name, dflt) {
  const hit = process.argv.find((a) => a.startsWith(name + "="));
  return hit ? hit.slice(name.length + 1) : dflt;
}
const THEME = argVal("--wgt-theme", "dark");

contextBridge.exposeInMainWorld("wgt", {
  acrylic: ACRYLIC,
  close: () => ipcRenderer.send("wgt:close"),
  menu: () => ipcRenderer.send("wgt:menu"),
  /* 鼠标指上来时临时浮到最前，移开还原（临时状态，不写存档） */
  raise: () => ipcRenderer.send("wgt:raise"),
  rest: () => ipcRenderer.send("wgt:rest"),
  /* 拖动窗口：页面只报"按下/松开"，位移由主进程每 8ms 跟着系统光标搬窗口。
     贴进桌面层后卡片是 Progman 的子窗口，系统自带的 -webkit-app-region: drag
     在子窗口上不生效，所以整条拖动自己实现。 */
  dragBegin: () => ipcRenderer.send("wgt:drag-begin"),
  dragEnd: () => ipcRenderer.send("wgt:drag-end"),
  /* 桌面快照背景：主进程裁好一块"卡片底下的桌面"推过来 */
  backdropNow: () => ipcRenderer.invoke("wgt:backdrop-now"),
  onBackdrop: (fn) => ipcRenderer.on("wgt:backdrop", (_e, p) => fn(p || {})),
  onBdFull: (fn) => ipcRenderer.on("wgt:bd-full", (_e, p) => fn(p && { ...p, png: new Uint8Array(p.png) })),
  onBdPos: (fn) => ipcRenderer.on("wgt:bd-pos", (_e, p) => fn(p || {})),
  onBdDragEnd: (fn) => ipcRenderer.on("wgt:bd-drag-end", () => fn()),
  /* 外观（透明度/磨砂） */
  getLook: () => ipcRenderer.invoke("wgt:get-look"),
  setLook: (v) => ipcRenderer.invoke("wgt:set-look", v),
  onShowLook: (fn) => ipcRenderer.on("wgt:show-look", () => fn()),
  /* 右键菜单里的预设时长（分钟） */
  onPreset: (fn) => ipcRenderer.on("wgt:preset", (_e, m) => fn(Number(m) || 0)),
  /* 右键菜单里的"重置计时" */
  onReset: (fn) => ipcRenderer.on("timer:reset", () => fn()),
  /* 右键菜单「再看一次引导」 */
  onHint: (fn) => ipcRenderer.on("timer:hint", () => fn()),
  /* 到点提示音：设置（静音/循环/选哪版）+ 换音 + 试听 */
  getSound: () => ipcRenderer.invoke("wgt:get-sound"),
  onSound: (fn) => ipcRenderer.on("wgt:sound", (_e, v) => fn(v || {})),
  onPreview: (fn) => ipcRenderer.on("timer:preview", (_e, name) => fn(name)),
  setSound: (name) => ipcRenderer.send("wgt:set-sound", name),
  onShowSound: (fn) => ipcRenderer.on("timer:show-sound", () => fn()),
  /* 右键菜单切 分 / 秒 */
  onUnit: (fn) => ipcRenderer.on("timer:unit", (_e, u) => fn(u)),
  /* 日间/夜间：主进程决定，页面只负责换皮 */
  theme: THEME,
  onTheme: (fn) => ipcRenderer.on("wgt:theme", (_e, t) => fn(t)),
  /* 倒计时到点：主进程弹通知 + 响铃（info 里带设定分钟数 / 超时分钟数） */
  done: (info) => ipcRenderer.send("timer:done", info || {}),
  /* 用户点掉提醒 → 让主进程立刻停声 */
  dismiss: () => ipcRenderer.send("timer:dismiss"),
  /* 系统从睡眠/休眠回来，页面要按时间戳重算 */
  onResume: (fn) => ipcRenderer.on("wgt:resume", () => fn()),
  /* 用户点了系统通知 → 页面也要收掉红闪 */
  onDismiss: (fn) => ipcRenderer.on("timer:dismiss", () => fn()),
  /* 桌面层输入桥：子窗口拿不到键盘焦点，双击改时间由幽灵输入窗代收 */
  imeBegin: (rect) => ipcRenderer.send("wgt:ime-begin", rect),
  imeEnd: () => ipcRenderer.send("wgt:ime-end"),
  onImeText: (fn) => ipcRenderer.on("timer:ime-text", (_e, v) => fn(v)),
  onImeCommit: (fn) => ipcRenderer.on("timer:ime-commit", () => fn()),
  onImeCancel: (fn) => ipcRenderer.on("timer:ime-cancel", () => fn()),
  onImeBlur: (fn) => ipcRenderer.on("timer:ime-blur", () => fn()),
});
