from PIL import Image, ImageDraw
import os

def add_corners(im, rad):
    circle = Image.new('L', (rad * 2, rad * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, rad * 2 - 1, rad * 2 - 1), fill=255)
    
    alpha = Image.new('L', im.size, 255)
    w, h = im.size
    
    # Top-left
    alpha.paste(circle.crop((0, 0, rad, rad)), (0, 0))
    # Top-right
    alpha.paste(circle.crop((rad, 0, rad * 2, rad)), (w - rad, 0))
    # Bottom-left
    alpha.paste(circle.crop((0, rad, rad, rad * 2)), (0, h - rad))
    # Bottom-right
    alpha.paste(circle.crop((rad, rad, rad * 2, rad * 2)), (w - rad, h - rad))
    
    im.putalpha(alpha)
    return im

def process_icons():
    src = "icon.png"
    original = "icon-original.png"
    
    # Backup original if not already done
    if not os.path.exists(original):
        if os.path.exists(src):
            os.rename(src, original)
            print(f"Renamed {src} to {original}")
        else:
            print(f"Error: {src} not found")
            return
    
    # Use original as source
    img = Image.open(original).convert("RGBA")
    size = img.size[0]
    
    # Calculate radius (e.g., 20% of width)
    radius = int(size * 0.2)
    
    # Apply rounded corners
    rounded_img = add_corners(img.copy(), radius)
    
    # Save root icon (for window icon)
    rounded_img.save("icon.png")
    print("Updated icon.png")
    
    # Generate Tray Icon (24x24)
    tray_size = 24
    tray_img = rounded_img.resize((tray_size, tray_size), Image.Resampling.LANCZOS)
    tray_img.save("tray-icon.png")
    print("Updated tray-icon.png")
    
    # Ensure build directory exists
    if not os.path.exists("build"):
        os.makedirs("build")
        
    # Save build icons
    rounded_img.save("build/icon.png")
    rounded_img.save("build/icon.ico")
    print("Updated build/icon.png and build/icon.ico")
    
    # Generate sized icons for Linux
    sizes = [16, 32, 48, 64, 128, 256, 512]
    icons_dir = "build/icons"
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
        
    for s in sizes:
        resized = rounded_img.resize((s, s), Image.Resampling.LANCZOS)
        dst = os.path.join(icons_dir, f"{s}x{s}.png")
        resized.save(dst)
        print(f"Generated {dst}")

if __name__ == "__main__":
    process_icons()
