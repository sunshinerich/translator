from PIL import Image

# Open the original icon
img = Image.open("icon.png")

# Resize to 24x24 using Lanczos filter for high quality
tray_icon = img.resize((24, 24), Image.Resampling.LANCZOS)

# Save as tray-icon.png
tray_icon.save("tray-icon.png")
print("Created tray-icon.png (24x24)")
