import os
import glob

files_to_check = glob.glob('app/**/*.tsx', recursive=True) + glob.glob('components/**/*.tsx', recursive=True)

for filepath in files_to_check:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # Remove inline style
    target1 = 'style={{ backgroundImage: "url(\'/create_card_bg.webp\')" }}'
    if target1 in content:
        content = content.replace(target1, '')
        modified = True
        
    # Remove tailwind class
    target2 = "bg-[url('/create_card_bg.webp')]"
    if target2 in content:
        content = content.replace(target2, '')
        modified = True
        
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Removed marble bg from {filepath}")

print("Done removing marble backgrounds.")
