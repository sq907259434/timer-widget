/* 渲染倒计时卡图标：用 SVG 画，Electron 离屏截图，输出多尺寸 PNG 供打包成 ico */
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const OUT = path.join(__dirname, "_icon");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const SIZES = [256, 128, 64, 48, 32, 24, 16];

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:transparent;overflow:hidden}
  svg{display:block;width:100%;height:100%}
</style></head><body>
<svg id="i" width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="#3A3A3A"/>
      <stop offset="0.46" stop-color="#262626"/>
      <stop offset="1"    stop-color="#161616"/>
    </linearGradient>
    <linearGradient id="hi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.03"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="14" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/></feMerge>
    </filter>
  </defs>

  <!-- 底板 -->
  <rect x="56" y="56" width="912" height="912" rx="240" fill="url(#bg)"/>
  <rect x="56" y="56" width="912" height="912" rx="240" fill="url(#hi)"/>
  <rect x="57.5" y="57.5" width="909" height="909" rx="238.5"
        fill="none" stroke="#ffffff" stroke-opacity="0.13" stroke-width="3"/>

  <!-- 圆环底 -->
  <circle cx="512" cy="512" r="286" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="52"/>

  <!-- 红色进度弧 + 柔光 -->
  <g transform="rotate(-90 512 512)">
    <path d="M 512 226 A 286 286 0 1 1 240 650" fill="none"
          stroke="#FF4646" stroke-opacity="0.55" stroke-width="66"
          stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 512 226 A 286 286 0 1 1 240 650" fill="none"
          stroke="#FF4D4D" stroke-width="52" stroke-linecap="round"/>
  </g>

  <!-- 指针：时针向上、分针右下 -->
  <line x1="512" y1="512" x2="512" y2="358" stroke="#ffffff" stroke-width="38" stroke-linecap="round"/>
  <line x1="512" y1="512" x2="640" y2="676" stroke="#ffffff" stroke-width="38" stroke-linecap="round"/>
  <circle cx="512" cy="512" r="30" fill="#ffffff"/>
</svg>
</body></html>`;

app.on("window-all-closed", () => {});

app.whenReady().then(async () => {
  const f = path.join(OUT, "icon.html");
  fs.writeFileSync(f, html, "utf8");

  /* 只渲染一张 512（小窗口会撞到 Electron 的最小尺寸限制，所以用 nativeImage 缩） */
  const win = new BrowserWindow({
    show: false, width: 256, height: 256, useContentSize: true,
    transparent: true, frame: false,
    webPreferences: { offscreen: true, backgroundThrottling: false },
  });
  await win.loadFile(f);
  win.webContents.setZoomFactor(0.25);   /* 内容 256 -> 输出 512 */
  await new Promise((r) => setTimeout(r, 500));
  const big = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUT, "icon-512.png"), big.toPNG());
  console.log("base", JSON.stringify(big.getSize()));

  for (const px of SIZES) {
    const im = px >= 512 ? big : big.resize({ width: px, height: px, quality: "best" });
    fs.writeFileSync(path.join(OUT, `icon-${px}.png`), im.toPNG());
    console.log("saved", px, JSON.stringify(im.getSize()));
  }
  app.exit(0);
});
