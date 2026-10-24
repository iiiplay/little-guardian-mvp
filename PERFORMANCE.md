# MVP 0.9 程式優化 — 2026-10-24

比較基準為已發布的 `5623797`。本輪只減少重複工作，20 關、戰鬥數值、精靈能力、存檔 schema 與特效內容維持原樣。

## 本機量測

| 固定工作負載 | 優化前 | 優化後 |
| --- | ---: | ---: |
| 120 場種子模擬總時間 | 2,465 ms | 483 ms |
| 3,000 次 draw 的主畫布 drawImage | 874,000 | 60,000 |
| 3,000 次 draw 的同步尺寸讀取 | 3,000 | 0 |
| 暖機後文字寬度量測 | 39,000 | 0 |
| 不變的暫停 HUD，更新 100 次的 DOM mutations | 1,900 | 0 |
| 不變的戰鬥 HUD＋觸控目標，更新 100 次的 DOM mutations | 1,700 | 0 |

模擬耗時降低約 80.4%，主畫布圖像呼叫減少 93.1%。第 1／11／20 關同步 `draw()` 呼叫時間中位數分別由約 0.280／0.363／0.368 ms 降到 0.073／0.108／0.071 ms。數值來自相同機器的 headless Chromium／Node 固定工作負載，包含暖機與多批次測量；不是實體手機 FPS，也不是瀏覽器整體 CPU 使用率。冷啟動的地形快取建立仍有成本，不能把主畫布呼叫計數當作所有畫布的零成本。

原始結果見 `artifacts/performance-before.json`、`performance-after.json`、`simulation-performance-before.json`、`simulation-performance-after.json`、`optimization-browser-results.json`。

## 改動與邊界

- **尋路**：以整數格子索引與可重用 typed arrays 取代每次 BFS 的字串 Set／Map／座標陣列。暫存資料放在以地圖為 key 的 WeakMap，不進入存檔；每次搜尋仍讀取當前地圖，不快取路徑。保留上／右／下／左次序與同長度路徑的選擇，支援地圖內容變更。
- **地形**：靜態地板、牆壁及植被先畫到 208×240 的離屏畫布。區域、關卡或地圖內容變更會重建；圖片尚未載好時不會把缺圖永久快取。每個 renderer 增加約 195 KiB 的地形像素儲存，換取每幀少畫數百張圖。
- **光照與特效**：光照保持即時繪製。嘗試一併快取時，震動造成漸層取樣微差，因此沒有保留該做法；精靈、光流、擊飛、傷害與大招的演出沒有減量。
- **文字**：ResizeObserver 更新顯示尺寸，每幀只檢查 DPR 是否變更；不再每幀同步讀取 layout。文字寬度快取最多 256 筆並淘汰舊項，避免長時間遊玩無限制成長。`renderer.destroy()` 會解除觀察與移除文字層。
- **HUD／觸控**：文字、屬性、禁用狀態與樣式只在值改變時寫入；移動座標集中由 `syncTargets()` 更新，並跳過沒變動的座標。目標位置暫存以 WeakMap 持有，不保留已移除的按鈕。

## 相容性驗證

- 2,000 組尋路與舊 BFS 比對，另檢查地圖變更、不可達與同格目標。
- 120 場固定種子的最終狀態 SHA-256 與優化前逐場相同，包含所有戰鬥、掉落、時間與位置欄位；基準固定在 `tests/fixtures/optimization-baseline.json`。
- 20 張地圖與普通／震動／拾取／大招／擊飛／地圖修改／延後載圖，共 141 組世界畫布及文字畫布逐像素相同。
- `npm test` 全通過，包括既有 20 關、裝備、合成、精靈、死亡與救援對照。
- 375×667 與 1280×720 真實按鈕、精靈暫停／切換、大招、移動目標對齊；手機以 1× 自然時間完成第 20 關。另驗證 320×568、DPR 1/2/3、resize、對話框競態與合成回歸。
- 畫面證據：`artifacts/qa-optimization-mobile.png`、`qa-optimization-desktop.png`、`qa-optimization-win-mobile.png`。尚未用實體手機量測效能。

## 重跑

先啟動本機 HTTP server（8765），然後執行：

```text
npm run build
npm test
npm run test:optimization
npm run benchmark
```

`test:optimization` 的獨立畫面及 HUD 參考會讀取 Git 的 `5623797`，因此需保留該發布提交。一般 `npm test` 不依賴 Git 取出舊程式。效能數值會受其他程式負載、瀏覽器及機器影響；優先檢查固定工作量、畫面一致性與結算狀態，避免用不穩定的毫秒門檻當作通過條件。
