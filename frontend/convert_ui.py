import os

# Files to target
files = [
    "app/matches/page.tsx",
    "app/matches/[id]/page.tsx",
    "app/search/page.tsx",
    "app/identity/page.tsx",
    "app/settings/page.tsx",
    "app/history/page.tsx",
    "app/team/page.tsx",
    "components/close-match-modal.tsx",
    "components/inline-team-builder.tsx"
]

replacements = {
    # Main container
    'bg-[#E5DCC5]': 'bg-[#05070B]',
    'text-[#151515]': 'text-white',
    'text-[#202020]': 'text-white',
    
    # Text colors
    'text-black': 'text-white',
    'text-gray-600': 'text-gray-400',
    'text-gray-500': 'text-gray-400',
    'text-gray-700': 'text-gray-300',
    'text-gray-800': 'text-gray-200',
    
    # Backgrounds and borders for cards
    'bg-white ': 'bg-white/5 ',
    'bg-white"': 'bg-white/5"',
    'border-black/10': 'border-white/10',
    'border-black/5': 'border-white/5',
    'border-black/20': 'border-white/20',
    'bg-black/5': 'bg-white/5',
    'bg-black/10': 'bg-white/10',
    'bg-gray-100': 'bg-white/5',
    'bg-gray-200': 'bg-white/10',
    'border-gray-200': 'border-white/10',
    'border-gray-300': 'border-white/20',
    
    # Inverted buttons (was black, now needs to be visible on dark bg)
    'bg-black text-white': 'bg-white text-black',
    'bg-black text-[#E5DCC5]': 'bg-white text-black',
    'bg-[#151515] text-[#E5DCC5]': 'bg-white text-black',
    'bg-[#1a1f2e]': 'bg-white/10',
}

def process_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} (does not exist)")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {filepath}")

for f in files:
    process_file(f)

print("Done!")
