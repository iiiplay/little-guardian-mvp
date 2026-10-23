---
status: complete
branch: main
release: 0.9.0
---

# 收工記憶：MVP 0.9，20 關、守護精靈與環繞特效

使用者授權本輪完成後 commit／push 並收工；又追加推進 20 關、每十關至少更換區域。已完成，push 後停止工作。下次收到恢復指示才繼續，不自動擴展 100 關。

專案只在 `D:\Project\little-guardian-mvp`，不要碰 Claude 的 `D:\Project\dungeon-100`。遠端 `https://github.com/iiiplay/little-guardian-mvp`、main。本檔隨 0.9 收工提交，最終 hash 以 `git log -1 --oneline` 為準。

## 這次做完

- 0.7 難度、角色原生尺寸、高解析度特效文字一併封存；前兩關保留入門，中後期被動玩法有死亡與救援對照。
- 裝備光暈、特性環繞光點、精靈翅膀與光尾、撿寶入體光流、藥水／吸血／守護全身光暈。出界擊飛保留並增加拋物線、速度線與殘影，活體不放大拉伸。sprite alpha 修正。
- 3 關首通風芽（攻速 +8%），6 關首通金穗（幸運 +3，精良以上 45→48%）。右上星光按鈕與標題入口；一次一位，暫停切換、可休息、不能疊加或刷血。
- 1–10 微光地城，11–20 螢光森林，第二區地面、障礙配置、光點與敵人改變；新骸骨巡守、林地弓手，20 關骸骨守林者有預警骨陣。
- 分區選關、20 級裝備生成／讀取、20 關箱保底。schema 5 沿用原 key；舊版已通過 10 關會開放 11，保留金幣裝備。原始使用者素材只裁切需要的 PNG，來源見 ART_CREDITS.md。

## 驗證入口

`npm run build`、`npm test`（原有 320 戰鬥＋1440 首區難度＋64 精靈＋180 第二區；10000 幸運固定樣本）；另外跑過：

- `node tests/spirits_browser.cjs`：鎖定／解鎖、切換、暫停、存檔、自然時間取得精靈、取得提示返回領祝福、小手機版面。
- `node tests/campaign20_browser.cjs`：舊檔 10→11、分區選關、新素材、自然時間 20 關頭目與最終結算。
- `node tests/clarity_browser.cjs`、`modal_race.cjs`、`treasure_browser.cjs`、`forge_assist_browser.cjs`。
- 第 10 關帶風芽自然時間對照仍為「純看／只大招陣亡，大招＋兩次守護通關」。

報告與截圖在 artifacts：spirits-results、spirits-browser-results、campaign20-results、campaign20-browser-results、difficulty-after、qa-spirit-orbit-mobile、qa-pickup-aura-mobile、qa-flyout-trail-mobile、qa-forest-mobile／desktop、qa-boss20-mobile、qa-chapters-small、qa-spirit-unlock-small、qa-campaign20-win-small。

## 下次接續

詳見 CURRENT_STATE.md 頂端。20 關已可玩，未做實體手機；全主動 bot 很強，第二區 60/60 通關且通常不需救援，純看僅 1/60、加入守護 49/60。後續應按真人試玩調整，不能以 bot 過關自稱趣味性已達標。精靈目前兩位、無養成／抽取；幸運只影響寶箱品質。

HTTP server 仍開在 8765，輸出導至 artifacts/*.log 並被 Git 忽略；Windows PowerShell、Playwright 在 `C:/Users/User/.agents/skills/gstack/node_modules/playwright`。中文 JS 請寫檔執行，勿經 PowerShell 管線送入 Node stdin。

電腦 <http://127.0.0.1:8765/index.html?v=0.9>，同 Wi-Fi 手機 <http://192.168.0.33:8765/index.html?v=0.9>。不要清除瀏覽器資料，以免失去本機存檔。
