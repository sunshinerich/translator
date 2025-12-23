from PIL import Image
import os

sizes = [16, 32, 48, 64, 128, 256, 512]
src = "build/icon.png"
dst_dir = "build/icons"

if not os.path.exists(src):
    print(f"Error: {src} not found")
    exit(1)

img = Image.open(src)

for size in sizes:
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    dst = os.path.join(dst_dir, f"{size}x{size}.png")
    resized.save(dst)
    print(f"Generated {dst}")
