# 小小守護者 MVP 0.6 — 2026-10-23

## 0.6：回應 60 分回饋，重做擊退、全屏法術與角色尺寸

最新使用者明確要求真實擊退、全屏法術、角色縮放／被打出畫面感、大角色與 UI 優化，並以「go」授權實作。新增 knockback/drift，牆壁檢查與分段移動防穿牆，普通／星擊／爆炸／大招力度不同，頭目抗性。重擊死亡生成 flyout 視覺屍體，畫面座標飛出且逐漸放大旋轉；不再參與傷害與掉落結算。英雄受擊也有位移與擠壓，攻擊有蓄力／伸展。

ultimate 狀態屬於 engine，core 僅 play 可調用。開局 100 能量，0.48 秒後單次全場傷害 max(55, attack×5)，1.3 秒演出，時間／擊殺／手動拾取／星擊回能。施法前段停住移動與攻擊，短護盾保護；暫停及背景切換凍結時序。UI 新增紫色星界裁決按鈕，蓄能條、READY、禁用狀態；施法期間隱藏地圖觸控覆蓋層。render 的大招包含魔法陣、巨劍、光柱、鏡頭推近與角色放大，減少動態偏好關閉鏡頭縮放和飛出旋轉。audio 新增 charge/ultimate 聲。

勇者尺寸 28（原 16）、敵人 25、頭目 38；手機勇者約 48 CSS px。UI 壓縮標頭和文字，主要操作為大招／守護／背包／地圖；角色觸控區 50px，syncTargets 逐幀對齊移動角色。修掉舊 CSS 的 min-height:580px 導致小手機溢出，desktop 與 320×568、375×667 已檢查。

npm test 含既有檢查、新增撞牆／位移／全場傷害時序／單次結算，以及 60 次大招完整通關。連同 120 基礎、20 裝備、120 主動觀看對照，共 320 次關卡模擬。combat_test 的範圍攻擊 fixture 在第三擊前維持近鄰，因前兩擊現在會真的推開敵人。音效測試擴為八種。新增 tests/spectacle_browser.cjs 和 spectacle_test.cjs；截圖 qa-spectacle-mobile/desktop/small、qa-ultimate-charge-mobile、qa-ultimate-impact-mobile。既有合成 UI 回歸通過，詳細結果見 artifacts。

仍為 10 關，實體手機與真人評分尚未驗證；未自稱達 90 分。專案獨立在 little-guardian-mvp，沒有修改 dungeon-100。保留 1c8b182 的 0.2 基準；0.3～0.6 變更納入本次 0.6 封存提交。手機同區網 http://192.168.0.33:8765/index.html?v=0.6 。

## 0.5：回應「50 分、單調、打擊感與參與不足」

已重做主動操作循環，詳細操作見 README 的 0.5 段落。星能容量 3／6 秒回 1，手動拾取 +1；0.55 秒施放間隔，5 秒連擊窗口，第三擊範圍流星；打斷蓄力有額外傷害。手動撿 5 件觸發 8 秒雙倍攻速。每場兩個友善炸藥桶可點擊引爆並連鎖。第二波加速、第三波精英、哥布林瞄準與飛行怪衝刺。護甲祝福每點增加 0.5 反傷以維持防禦流通關能力。

render.js 新增碎屑、震動、受擊壓縮、爆炸；ui.js 加入短命中停頓、星能與連擊 HUD、參與戰績。src/audio.js 新增獨立 Web Audio 分層音效庫、輸出壓縮器與節點清理。開始按鈕解鎖聲音，音效可關閉。減少動態偏好停用震動、停頓與 CSS 動畫。desktop stage 高度調整以容納新 HUD，避免 720px 高度溢出。最終回歸發現快速 map→build 會被待處理的 pause 模式更新覆蓋；dialog() 現在接管開啟當下的模式，tests/modal_race.cjs 在同一幀重現並驗證修正。

驗證：既有 492 項與 120 基礎關卡／20 配裝關卡通過；新增 tests/combat_test.cjs 包含能量、連擊、狂熱、重複操作、桶爆炸回歸與 120 主動／觀看對照（全部通關，平均 39.7 / 88.6 秒）。裝備、開箱、合成瀏覽器回歸通過；combat_browser.cjs 使用實際按鈕跑自然時間主動通關，測三種 viewport、暫停、減少動態、聲音開關。audio_test.cjs 離線渲染六種提示音，檢查非靜音、無削波、聲部衰減；輸出 artifacts/combat-sound-preview.wav，未聲稱真人聽感驗收。所有音效由程式合成，沒有背景配樂。

關鍵證據：artifacts/combat-balance.json、combat-browser-results.json、audio-results.json、qa-combat-mobile.png、qa-combat-desktop.png、qa-combat-result-mobile.png。index.html / dist/game.html 已重建。仍保留 1c8b182 的 0.2 基準提交，0.3～0.5 尚未提交；不修改 Claude 的 dungeon-100。

仍需真人試玩評分；不能以測試通過自稱 90 分。仍為 10 關／5 張地圖，沒有擴充 100 關，未用實體手機或手機喇叭驗證。熟練主動操作可短於一分鐘，後續需按真人體驗調整。手機同區網 http://192.168.0.33:8765/index.html ，電腦 http://127.0.0.1:8765/index.html 。

以下為歷史紀錄，舊版本「每關僅三次補刀」已被 0.5 星能系統取代。

## 0.4：玩家撿寶、合成武器、偶爾補刀
最新使用者方向明確為「幫忙撿寶、合成武器，偶爾幫忙打怪」，不增加走路控制或大量必選事件。
兩把同品質武器可合成高一階，保留主武器特性，等級取較高者，史詩為上限。素材不能是已穿戴武器（主武器可以），合成預覽清楚列出將消耗物品，確認後消耗兩把、自動穿戴並一次存檔，沒有金幣費用。新增 src/forge-ui.js。
玩家可點敵人放星光補刀，每關 3 次、8 秒模擬時間冷卻，造成 max(18, 2×勇者攻擊力) 傷害，打斷蓄力並暈眩 1.2 秒，擊殺正常掉寶。觸控目標跟隨敵人；寶物優先，鎖住的寶箱不攔截點擊。新的武器／護甲／飾品掉落權重 60／20／20%。
存檔 schema 4，沿用舊 key；nextItemId 保持單調遞增，gearDrops 獨立追蹤開箱保底，合成不影響保底。0.2 基準提交仍為 1c8b182；0.3 與 0.4 新改動均尚未提交，未改 Claude 的目錄。
新增 tests/forge_assist_test.cjs（32 項）與 tests/forge_assist_browser.cjs。npm test 共 492 項，含 120 次基礎關卡與 20 次特性配裝完整模擬。裝備、開箱、合成、補刀瀏覽器流程通過，375x667 / 320x568 / 1280x720 畫面已檢查。證據：artifacts/qa-assist-mobile.png、qa-forge-mobile.png、qa-forge-small.png、qa-forge-desktop.png、forge-assist-browser-results.json。

## Git 與 0.3 更新
已依使用者要求先初始化獨立 Git repository 並提交 0.2：1c8b182（feat: checkpoint MVP 0.2 with auto adventure, loot and equipment）。main 分支，無遠端。0.3 在此提交之後繼續開發，目前為尚未提交的新變更。

裝備新增回甘吸血、跳跳雷連鎖、刺刺反傷、暖光波次回血；舊裝備以原 ID 決定合法特性，schema 3 沿用同一存檔 key。武器微光、護甲小刺、雷擊線與特性文字可見。每第 5 件與第 10 關箱至少稀有。手動開箱顯示品質揭曉與一鍵穿戴，暫停戰鬥，8 秒未操作自動收好繼續，背景停止倒數。勇者代開不打斷觀看。

新增 src/treasure-ui.js、tests/traits_test.cjs、tests/treasure_browser.cjs。40 項特性與遷移檢查含 20 次配裝全關卡，另有既有 120 次基礎關卡模擬。開箱及背包瀏覽器流程與 375x667 / 320x568 / 1280x720 檢查通過。artifacts/qa-treasure-mobile.png、qa-treasure-desktop.png 為揭曉畫面；treasure-browser-results.json 記錄結果。

## 0.2 更新
玩家可點地圖掉落物撿金幣／藥水，沒點 8 秒自動收取。第一波清完開放手動開寶箱，獲得一件裝備，沒點則離場前代開。武器／護甲／飾品三欄，4 種品質、裝備等級 1–10。第一件保證武器，之後隨機。可開背包比較、裝備、卸下，替換不刪除舊裝，裝備立即生效；背包暫停遊戲，關閉回到先前流程。生命比例在換裝時保持，避免刷血。裝備立即保存，失敗也保留，重玩可拿新裝。舊 localStorage key 保留，schema 升為 2，自動遷移舊存檔的關卡與祝福。
新增 src/equipment.js、src/gear-ui.js、tests/equipment_test.cjs、tests/equipment_browser.cjs。額外 25 項核心測試與實際瀏覽器撿寶／開箱／三欄穿戴／替換／存檔恢復測試已通過；截圖為 artifacts/qa-loot-mobile.png、qa-equipment-mobile.png、qa-equipment-desktop.png、qa-equipment-small.png。未含出售、強化、商店或完整外觀換裝。

以下為 0.1 基礎功能與歷史驗證紀錄；新裝備沒有自動穿戴，因此未穿裝的關卡基礎數值不變，但新增藥水會影響存活率。

## 最新需求
使用 dungeon crawler 素材，做可愛、手機可玩、少操作、觀看為主且偶爾介入的短局自動探險。長期目標 100 關，這次 MVP 10 關。上層 docs/spec.md 的手動回合制方向已被這次對話取代，但保留不改。

## 已實作
騎士自動 BFS 尋路、攻擊、三波遭遇、開箱、離場；3 種敵人，第 4 關起地刺，第 10 關史萊姆頭目。每關 2 次回血／無敵救援，18 秒冷卻。首通三選一永久升級、12 秒自動預設升級與前進、免費重配祝福、1×/2×、音效開關、暫停、背景暫停、選關、重試、版本化本機存檔。重玩不重領首通獎勵；刷新過關畫面會補發一次預設祝福。

## 遊玩與驗證
專案已搬至 D:\Project\little-guardian-mvp，與 Claude 使用的 dungeon-100 分開。此專案所有建置輸出都留在本目錄，不再寫入父目錄。
根目錄 index.html 與 dist/game.html 為相同的 91 KB 左右單檔發行版；支援離線雙擊。
在 little-guardian-mvp 目錄用 python -m http.server 8765 --bind 0.0.0.0 開發測試。
npm run build 會同時重建兩個發行入口。npm test 是 395 項檢查，含 120 次種子完整關卡與存檔、重複結算、救援、失敗及重試驗證。tests/browser_qa.cjs 透過 HTTP 測 375x667 / 1280x720，自然計時過關、實際按鈕、暫停、升級、存檔恢復、失敗重試，另測 file:// 離線入口。測試環境有現成 Playwright；未加入遊戲執行依賴。
artifacts/ 內含畫面截圖、balance-results.json、browser-results.json。純攻擊升級搭配低血時救援，120 次模擬全部通關；單關約 55–76 秒，純防禦路線頭目約 212 秒。全看不介入的預設攻擊路線可能在第 8、10 關失敗，符合救援用途。

## 邊界與後續
僅 10 關、5 張配置重組，未製作後續 90 關。金幣只有紀錄用途，沒有商店。存檔不含戰鬥中的即時位置，重開會從已解鎖關卡開始。未部署到公開網址，也未用實體手機測試。原素材未修改，遊戲含 o_lobster 署名。Git 狀態見本檔頂端。
