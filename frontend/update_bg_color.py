import os
import glob

all_pages = glob.glob('app/**/page.tsx', recursive=True) + glob.glob('components/**/*.tsx', recursive=True)
files = [f for f in all_pages if 'home\\page.tsx' not in f and 'home/page.tsx' not in f]

def process_file(filepath):
    if not os.path.exists(filepath):
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace the deep black with the preferred softer black
    new_content = content.replace('bg-[#05070B]', 'bg-[#151515]')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated background in {filepath}")

for f in files:
    process_file(f)

print("Done updating background colors!")
