import os
import glob
import re

files_to_check = glob.glob('app/**/*.tsx', recursive=True) + glob.glob('components/**/*.tsx', recursive=True)

bg_regexes = [
    r'bg-\[\#151515\](?:\/\d+)?', # bg-[#151515] or bg-[#151515]/90
    r'bg-white\/[5|10]', # bg-white/5, bg-white/10
]

for filepath in files_to_check:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # Replace background classes with glass-panel, taking care not to duplicate glass-panel
    for regex in bg_regexes:
        content = re.sub(regex, 'glass-panel', content)
        
    # Clean up duplicate 'glass-panel' classes if they happen to occur
    content = content.replace('glass-panel glass-panel', 'glass-panel')
    content = content.replace('glass-panel hover:glass-panel', 'glass-panel')
    content = content.replace('glass-panel hover:bg-[#202020]', 'glass-panel')
    content = content.replace('glass-panel border border-white/10', 'glass-panel')
    content = content.replace('glass-panel border border-white/5', 'glass-panel')
    content = content.replace('border border-[#2A2A2A] glass-panel', 'glass-panel')
    content = content.replace('glass-panel border border-[#A28B52]/10', 'glass-panel')
    content = content.replace('glass-panel border border-[#A28B52]/20', 'glass-panel')
    
    # Also drop backdrop-blur if it was manually specified since glass-panel has it
    content = re.sub(r'backdrop-blur-(?:sm|md|lg|xl|2xl|3xl)', '', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
