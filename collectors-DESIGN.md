# Design System Strategy: The Sustained Precision

## 1. Overview & Creative North Star
**Creative North Star: The Environmental Ledger**

This design system transcends the standard "SaaS dashboard" aesthetic by treating data as a premium asset. We move away from the cluttered, boxy layouts of traditional enterprise software toward a high-end editorial experience that feels authoritative yet breathable. 

The visual identity is anchored in **Sustained Precision**. It balances the organic, life-giving nature of the circular economy with the rigorous, clinical accuracy required for waste management. We achieve this through a "White-Space First" philosophy: utilizing expansive margins, sophisticated Manrope typography for data visualization, and a tonal layering system that replaces rigid borders with soft, atmospheric depth. The interface should feel like a high-end digital publication—quiet, confident, and meticulously organized.

---

## 2. Colors: Tonal Depth & Meaning
The palette is rooted in a clinical white foundation, punctuated by deep forest greens and technical blues.

*   **Primary (`#006b2d`):** Used exclusively for brand identity and active state indicators. It represents growth and the "active" status of the circular loop.
*   **Secondary (`#0858c8`):** Used as a technical accent for data visualization. It provides a professional contrast to the green, ensuring charts remain legible and distinct.
*   **The "No-Line" Rule:** Sectioning must be achieved without 1px solid borders. Use the shift from `surface` (`#f8f9fa`) to `surface_container_low` (`#f3f4f5`) to define areas. Boundaries are felt, not seen.
*   **Surface Hierarchy & Nesting:**
    *   **Level 0 (Canvas):** `surface` or `surface_container_lowest` for the main background.
    *   **Level 1 (Cards/Sidebar):** `surface_container_low` or `surface_container`.
    *   **Level 2 (Active Elements):** `surface_bright` to create a "pop" effect.
*   **The Glass & Gradient Rule:** For primary CTAs and header highlights, utilize a subtle gradient from `primary` (`#006b2d`) to `primary_container` (`#0c873c`). For floating tooltips, use a glassmorphism effect: `surface_container_lowest` at 80% opacity with a `12px` backdrop-blur.

---

## 3. Typography: The Editorial Scale
We use a dual-font strategy to balance character with readability.

*   **Headlines (Manrope):** The `display` and `headline` scales use **Manrope**. Its geometric yet modern construction provides an "architectural" feel to data headers and section titles.
*   **Body & Labels (Inter):** All functional text, data tables, and tooltips use **Inter**. It is chosen for its exceptional legibility at small sizes (`body-sm`: `0.75rem`) and its neutral, "invisible" quality that lets the data shine.
*   **Hierarchy as Brand:** Use `headline-sm` for card titles to create an authoritative presence. Pair this with `label-sm` in `on_surface_variant` for secondary metadata to ensure the user's eye is always drawn to the most critical data point first.

---

## 4. Elevation & Depth
In this system, elevation is a function of light and tone, not structure.

*   **The Layering Principle:** A dashboard card should sit as a `surface_container_lowest` element atop a `surface_container_low` background. This creates a natural "lift" without the need for heavy shadows.
*   **Ambient Shadows:** If an element must float (e.g., a dropdown or modal), use a high-dispersion shadow: `0px 8px 24px rgba(25, 28, 29, 0.06)`. The tint is derived from the `on_surface` color to ensure it feels like a natural shadow cast on a textured surface.
*   **The "Ghost Border" Fallback:** If a separator is required for accessibility in data tables, use the `outline_variant` at **15% opacity**. High-contrast lines are strictly forbidden as they interrupt the visual flow.
*   **Glassmorphism:** Apply to the sidebar or top header when scrolling to maintain a sense of place within the "Ledger," allowing the content's colors to bleed through softly.

---

## 5. Components

### Navigation Sidebar
*   **Background:** `surface_container_lowest`.
*   **Active State:** Use a pill-shaped container (`rounded-full`) in `primary_fixed` (`#8ef9a0`) with `on_primary_fixed` text.
*   **Spacing:** `spacing-4` padding for items to ensure a premium, uncrowded feel.

### Summary Cards
*   **Container:** `surface_container_lowest` with `rounded-xl` corners. 
*   **Layout:** No borders. Use `spacing-6` internal padding. 
*   **Data Highlight:** Large `headline-md` value in `on_surface`, paired with a `label-md` indicator (e.g., "Live now" in `primary` with a small decorative dot).

### Data Visualization (Charts)
*   **Bar/Donut Charts:** Use `primary` and `secondary` for high-contrast data segments.
*   **Grid Lines:** Use `outline_variant` at 10% opacity. 
*   **Legends:** Place legends at the bottom using `label-md` typography to keep the focus on the visual trend.

### Data Tables
*   **Header:** `surface_container_high` with `label-md` (All Caps, 0.05em letter spacing) for a professional, tabular look.
*   **Rows:** Alternate between `surface_container_lowest` and `surface` to eliminate the need for dividers.
*   **Cells:** Use `body-md` for primary content and `body-sm` in `on_surface_variant` for secondary timestamps or IDs.

### Buttons & Chips
*   **Primary Button:** Gradient of `primary` to `primary_container`, `rounded-md`, white text.
*   **Status Chips:** `rounded-full`, using `surface_container_highest` for background and `on_surface_variant` for text, unless indicating a "Success" (Green) or "Error" (Red) state.

---

## 6. Do's and Don'ts

### Do
*   **Do** use white space as a structural element. If a layout feels "off," increase the `spacing` scale values before adding a line.
*   **Do** use `rounded-xl` (`0.75rem`) for main containers to soften the technical nature of the dashboard.
*   **Do** ensure all charts have at least `spacing-8` of breathing room from their card edges.
*   **Do** use Tonal Layering (Surface-Lowest on Surface-Low) for all card-based layouts.

### Don't
*   **Don't** use 1px solid borders to separate sections or cards. 
*   **Don't** use pure black (`#000000`) for text; use `on_surface` (`#191c1d`) to maintain a sophisticated, soft-contrast look.
*   **Don't** use standard "drop shadows" with high opacity.
*   **Don't** crowd the sidebar; if the menu grows, use `label-sm` category headers to group items rather than dividers.