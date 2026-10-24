# 霜晶遺跡：生成素材紀錄

2026-10-24，使用內建 `image_gen`，透明背景。保留生成的原始 PNG，沒有取代既有素材；遊戲以關閉平滑的 canvas 繪製成 16px／32px 敵人，冰靈浮動及守衛移動起伏由程式控制。這兩張是靜態立繪，不是手繪六影格動畫。

## assets/frost_wisp.png

Prompt:

> Use case: stylized-concept. Asset type: one production game sprite PNG for a tiny top-down pixel dungeon game, enemy frost wisp. Primary request: create a SINGLE small floating ice spirit, full body centered, facing toward the viewer with a slight right-facing 3/4 angle, two bright purple eyes in a dark face under an icy cyan hood, short tapering ghost tail, two simple icy hands. Style: authentic very low resolution pixel art, deliberately designed on a 16x16 logical pixel grid and enlarged with hard square pixel edges. Very simple silhouette, dark navy one-pixel outline, 6 to 8 flat colors, cyan, pale ice blue and dark indigo. The creature fills 85% of canvas. Transparent background with no shadow or glow outside the sprite. No text, no UI, no frame, no scenery, no repeated sprites, no antialiasing, no smooth illustration. Keep recognizable when drawn at 16x16 pixels. This is a standalone enemy asset, not a sprite sheet.

## assets/crystal_golem.png

Prompt:

> Use case: stylized-concept. Asset type: standalone game enemy sprite PNG. Create ONE chunky ice crystal golem guardian for a tiny pixel top-down dungeon game. Full body centered, squat stocky torso, enormous block fists, short legs, angular icy shoulder crystals and a small head with two amber eyes. Facing down toward viewer, slight three-quarter view. Design as a real 24x24 logical pixel sprite enlarged with hard square pixel edges: simple bold readable silhouette, dark midnight blue pixel outline, only 8 flat colors in slate navy, cyan and white plus two amber eyes. Golem fills 85% of image with symmetrical transparent margins. Genuine transparent background. No platform, scenery, text, frames, UI, shadow outside sprite, gradient, blur or glow. Must remain recognizable rendered 16px tall as a regular guard and 32px tall as the crystal boss. One creature only; NOT a spritesheet.

輸出兩張皆為 1254×1254 RGBA。已核對透明像素、實際遊戲尺寸的可讀性、手機／桌面畫面，以及死亡擊飛也使用正確素材。原始生成圖比提示要求的邏輯格線更細緻；目前遊戲透過 nearest-neighbor 縮繪，仍屬待實機測試的第一版素材。
