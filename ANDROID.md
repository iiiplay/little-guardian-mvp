# Android 測試版

執行 `npm run build:android`，產物為 `dist/android/LittleGuardian-0.10.0-debug.apk`。
需要 JDK 17、Android SDK platform 35 / build-tools 35.0.1；可透過 `JAVA_HOME`、`ANDROID_HOME` 指定安裝路徑。首次建置需要網路下載 Gradle 與依賴。已快取依賴時可執行 `powershell -ExecutionPolicy Bypass -File build/build-android.ps1 -Offline`。

- 套件：`com.iiiplay.littleguardian`，版本：`0.10.0-test.1`，Android 8.0 以上。
- 遊戲完整包進 APK，可離線遊玩；此版尚未整合廣告 SDK。
- 手機下載 APK 後開啟，依系統提示允許該下載來源安裝應用程式。
- 使用 Android debug 簽章，供內部測試，並非商店發行版。更新需使用相同套件與簽章；建置電腦的 debug keystore 請保留，勿提交到 Git。
- APK 存檔與瀏覽器版分開；解除安裝會清除 APK 的本機存檔。
- 返回鍵關閉當前面板／暫停戰鬥；主畫面的返回鍵退出。切到背景時暫停、儲存進度並停音，回前景後由玩家繼續。

目前驗證：Gradle 編譯、Android Lint、APK 簽章／套件內容，以及瀏覽器模擬的返回與背景生命週期。尚未連接 Android 裝置進行實機測試。
