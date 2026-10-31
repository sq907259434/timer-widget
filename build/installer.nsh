; 倒计时卡没有注册桌面右键菜单，卸载时只清理可能残留的自身键
; （不要照抄天气卡那份：那份删的是 WeatherWidget 的键，会误伤另一张卡）
!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\DesktopBackground\Shell\TimerWidget"
!macroend
