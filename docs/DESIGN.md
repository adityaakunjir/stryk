# STRYK Design System

## Core Identity & Aesthetic
STRYK uses a **Minimal Premium** design language. The aesthetic is heavily inspired by luxury streetwear, modern gaming, and high-end matchmaking apps. It combines rich, dark muddy backgrounds with striking metallic gold gradients and electric neon green accents.

## Mixed Color Scheme
The core identity of STRYK relies on the interplay between two dominant colors:

1. **Dark Khaki Gold (`#A28B52`)**
   - **Role:** Premium framing, typography accents, borders, icons, and ambient glows.
   - **Usage:** This is the foundational accent color. It provides warmth and luxury. Used heavily in headers, subtitles (e.g., "DISCOVER LOBBIES"), search bar borders, and drop shadows.

2. **Feint Neon Green (`#D4F829`)**
   - **Role:** Primary Action, Focus, and Active States.
   - **Usage:** This color dictates action. It is strictly used for primary CTA buttons (e.g., "CREATE LOBBY", "JOIN MATCH", "CONTINUE"), input focus rings, and active tab indicators (the neon green glow under the active filter pill).

## Gradients & Surfaces

### Backgrounds
- **Primary App Background:** Utilizes a custom golden-streak marble image (`home_page_bg.webp` or `create_card_bg.webp`) with a base hex of `#E5DCC5`.
- **Modals & Cards:** Deep, rich muddy-brown/black gradients to contrast the bright marble.
  - Typical Gradient: `bg-gradient-to-b from-[#1A1814] to-[#110F0D]`
  - Typical Border: `border border-[#A28B52]/20`
  - Typical Shadow: `shadow-[0_24px_60px_rgba(162,139,82,0.15)]`

### Metallic Gold Gradients
- **Text Highlights:** `bg-gradient-to-b from-[#E8C878] to-[#8A6A28]` (Used on massive headers like "MATCHES" with `text-transparent bg-clip-text`).
- **Secondary Premium Buttons:** `bg-gradient-to-b from-[#EAC775] to-[#CFA855]` (Used for the active "ALL LOBBIES" tab).

## Typography
- **Headings:** Massive, tightly-tracked (`tracking-[-0.05em]`), italicized, and bold (`font-black`) using the `font-display` utility.
- **Labels & Subtitles:** Widely-tracked (`tracking-[0.15em]`), uppercase, smaller font sizes (`text-[10px]` to `text-[12px]`) to create a structured, tactical feel.
- **Body Text:** Clean, legible warm beige (`#EFE8D6`) or muted gray (`#888888` / `#A0A0A0`) for secondary information. Text over bright buttons (Neon Green or Gold) must be stark black (`#111111` or `#1A1A1A`) for high contrast.

## UI Components
- **Buttons:** Heavily rounded pills (`rounded-full`) or custom squircle shapes. Primary actions must command attention (Neon Green).
- **Inputs:** Dark, inset fields (`bg-[#161410]`) with thick padding (`h-14`), rounded corners (`rounded-[1.25rem]`), and striking Neon Green focus rings.
- **Shadows:** Avoid generic black drop shadows. Use colored, ambient glows (e.g., `rgba(162,139,82,0.3)` for gold elements, or `rgba(212,248,41,0.25)` for neon green elements) to make the UI feel like it is emitting light.
