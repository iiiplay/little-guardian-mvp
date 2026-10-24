# 美術來源

- 原有地城、騎士、史萊姆、哥布林與飛行怪素材：o_lobster，原作者頁面 <https://o-lobster.itch.io/>。沿用原專案既有素材與署名。
- 螢光森林新增骸骨與弓手動畫、灌木、岩石、花、草地及土色圖塊：使用者提供的 **Tiny Adventure Pack Plus**，來源目錄 `D:\素材\Tiny Adventure Pack Plus\Tiny Adventure Pack Plus`。
- 新精靈、裝備光暈、環繞光點、拾取光流與速度線由程式繪製。
- 霜晶遺跡：`assets/frost_wisp.png`、`assets/crystal_golem.png` 由內建 image_gen 依本專案需求產生；不是 o_lobster 原作。原始提示與處理方式見 [生成紀錄](assets/GENERATED_ICE.md)。冰晶地形、冰紋與寒霜投射物由程式繪製。

`build/import_adventure_assets.py` 從原始六影格圖集中依 16px 寬度裁切，保留像素，沒有重採樣放大。較高的動作影格以下緣對齊。裁切完成的 PNG 已存入 `assets`，一般 `npm run build` 只讀專案內素材，不依賴使用者電腦上的素材路徑。
