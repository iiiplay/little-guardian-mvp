# Android 測試版

執行 `npm run build:android`，產物為 `dist/android/LittleGuardian-0.11.0-test.2.apk` 與 `dist/android/update.json`。
需要 JDK 17、Android SDK platform 35 / build-tools 35.0.1；可透過 `JAVA_HOME`、`ANDROID_HOME` 指定安裝路徑。首次建置需要網路下載 Gradle 與依賴。已快取依賴時可執行 `powershell -ExecutionPolicy Bypass -File build/build-android.ps1 -Offline`。

- 套件：`com.iiiplay.littleguardian`，版本：`0.11.0-test.2`，versionCode 110002，Android 8.0 以上。本版包含 30 關、霜晶遺跡與測試跳關入口。
- 遊戲完整包進 APK，可離線遊玩；此版尚未整合廣告 SDK。
- 手機下載 APK 後開啟，依系統提示允許該下載來源安裝應用程式。
- 使用 Android debug 簽章，供內部測試，並非商店發行版。更新需使用相同套件與簽章；建置電腦的 debug keystore 請保留，勿提交到 Git。
- APK 存檔與瀏覽器版分開；解除安裝會清除 APK 的本機存檔。
- 返回鍵關閉當前面板／暫停戰鬥；主畫面的返回鍵退出。切到背景時暫停、儲存進度並停音，回前景後由玩家繼續。

## 啟動更新

開啟 App → 檢查版本 → 有新版時顯示更新內容 → 玩家選擇下載 → 進度條 → 核對大小、SHA-256、套件名稱、版本碼及相同簽章 → 系統安裝確認。沒有新版直接進遊戲。網路失敗時可離線玩，亦可按「直接開始」略過檢查。安裝來源未授權時會引導至系統設定；拒絕授權仍可遊玩。

舊 `0.10.0-test.1` 沒有更新器，必須手動覆蓋安裝新版一次，**不要先解除安裝**。已裝 `0.10.0-test.2` 或 `0.11.0-test.1` 時，開啟 App 即可在同 Wi-Fi 通道發現 `0.11.0-test.2`。版本碼遞增（100002 → 110001 → 110002），不會重複更新相同版本或降版。

## 直接測試第 30 關

Android debug APK 主畫面 → **測試跳關** → 預設第 30 關 → **開始測試第 30 關**。也可輸入 1～30，或按第 1／21／25／30 關快捷按鈕。

配裝可選「對應等級裝備＋攻擊祝福」（該等級精良劍、普通護甲／飾品、關卡等級−1 點攻擊祝福，第 4 關起帶風芽），或「我的正式裝備與祝福」。兩種都測普通冒險，使用記憶體臨時存檔；測試通關、裝備與獎勵不寫進正式存檔。原有冒險會暫停保留。

測試中 → 右下 **關卡地圖** → **測試跳關／退出** → **返回正式冒險**。若原本正在打關卡，會回到該場暫停中的冒險；關閉 App 再開也會讀回原正式存檔。Android 返回鍵可關閉跳關面板。

一般網頁入口不顯示測試工具；開發者可使用 `http://127.0.0.1:8765/index.html?test=1`。Android 僅 debug 啟動網址加入此旗標，release 不自動開啟。

目前測試通道：`http://192.168.0.33:8765/dist/android/update.json`。手機需連同 Wi-Fi，電腦 HTTP 伺服器需保持開啟；更換電腦 IP 需重新設定通道。Google Drive 資料夾是人工下載備份，**不是自動更新來源**。私人 GitHub 庫也不是匿名更新來源。

每次發佈先遞增 `android/version.properties` 的 `buildNumber`（1～99），修改 `android/update-notes.txt`，再建置。遊戲版本變更時仍以 `package.json` 為準。發佈時先放好 APK，再更新 `update.json`；保留同一把簽章金鑰。版本檔與 APK 由建置產生，不提交 Git。

使用外網 HTTPS 服務時可指定：

```powershell
powershell -ExecutionPolicy Bypass -File build/build-android.ps1 -UpdateManifestUrl 'https://your-host/update.json' -ApkBaseUrl 'https://your-host/'
```

目前尚未配置外網更新服務；不會將 GitHub 憑證或 Google 帳戶憑證包進 APK。此更新器供直接安裝的內測 APK 使用，商店版更新通道需另行整合。

驗證：Gradle 編譯、Android Lint、APK 簽章／套件內容、純 Java 版本／網址／校驗規則、左右劍姿勢與瀏覽器生命週期測試。尚未連接 Android 裝置進行更新安裝的實機測試。
