import re
import os

def process_file(filepath, height_class, img_class_pattern):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find the image tag
    # Capture group 1: src
    # Capture group 2: alt
    # We use the specific class pattern to ensure we only target the right images
    pattern = r'<img src="([^"]+)" alt="([^"]+)"\s+class="' + re.escape(img_class_pattern) + r'">'
    
    def replacement(match):
        src = match.group(1)
        alt = match.group(2)
        
        return f'''<div class="relative {height_class} w-full overflow-hidden bg-gray-900">
                            <img src="{src}" class="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-50" alt="">
                            <img src="{src}" alt="{alt}" class="relative z-10 w-full h-full object-contain">
                        </div>'''

    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"No changes made to {filepath}")

# Process index.html
# Class: h-48 w-full object-cover
# New Height Class: h-64 (to match projects.html settings)
process_file(r'c:\Users\DELL\OneDrive\Desktop\robogenix\index.html', 'h-64', 'h-48 w-full object-cover')
