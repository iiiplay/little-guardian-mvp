"""Crop user-provided sprite sheets without resampling their pixels."""
from pathlib import Path
from PIL import Image
import sys

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('D:/素材/Tiny Adventure Pack Plus/Tiny Adventure Pack Plus')
target = Path(__file__).resolve().parents[1] / 'assets'
for kind, idle, walk in [
    ('skeleton', 'Enemies/Skeleton/Idle/Skel_idle_down.png', 'Enemies/Skeleton/Walk/Skel_walk_down.png'),
    ('ranger', 'Enemies/Goblin/Idle/Goblin_idle_down.png', 'Enemies/Goblin/Bow/Goblin_bow_down.png'),
]:
    for state, filename in [('idle', idle), ('run', walk)]:
        image = Image.open(source / filename).convert('RGBA')
        for frame in range(6):
            # Align the bottom of the 17/18px action sheets; preserve native pixels.
            image.crop((frame * 16, image.height - 16, frame * 16 + 16, image.height)).save(target / f'{kind}_{state}_anim_f{frame}.png')
for key, filename in [('forest_bush', 'Other/Misc/Bush.png'), ('forest_grass', 'Other/Misc/Grass.png'), ('forest_flower', 'Other/Misc/Flower_blue.png'), ('forest_rock', 'Other/Misc/Rock.png')]:
    Image.open(source / filename).save(target / f'{key}.png')
tiles = Image.open(source / 'Tilesets/TS_Dirt.png')
tiles.crop((16, 0, 32, 16)).save(target / 'forest_dirt.png')
tiles.crop((48, 0, 64, 16)).save(target / 'forest_ground.png')
print('Imported 24 native enemy frames and 6 forest assets.')
