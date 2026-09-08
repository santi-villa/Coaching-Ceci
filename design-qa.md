**Design QA — FAQ y suscripción**

- Source visual truth: `/tmp/codex-clipboard-fe24b8e0-07f1-49c5-b2bd-8038d9c8281f.png`
- Implementation screenshot: `/tmp/cecilia-faq-desktop.png`
- Normalized implementation region: `/tmp/cecilia-faq-desktop-normalized.png`
- Combined comparison: `/tmp/cecilia-faq-comparison.png`
- Mobile evidence: `/tmp/cecilia-faq-mobile.png`
- Viewport: desktop 1280 × 900 CSS px; mobile 390 × 844 CSS px.
- Pixel dimensions and normalization: source 747 × 205 px; desktop browser capture 1266 × 900 px; the 1266 × 340 FAQ/newsletter region was normalized to 747 × 201 px for equal-width comparison. Browser density was 1×.
- State: FAQ cards closed for visual comparison. First FAQ opened separately for interaction verification. Newsletter tested with an invalid empty value so no external submission occurred.

**Findings**

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Playfair Display and Inter preserve the reference's serif questions/headline and compact sans-serif supporting copy. Weight, italics, hierarchy, wrapping, and tracking are aligned.
- Spacing and layout rhythm: desktop uses the requested two-column, two-row FAQ grid with compact cards and a full-width newsletter row below. Mobile collapses cleanly to one FAQ per row and stacks the email field above the button. No horizontal overflow was observed.
- Colors and visual tokens: warm cream, muted brown, soft borders, and turquoise accents use the existing Cecilia Rosso palette while closely matching the reference.
- Image quality and asset fidelity: the existing high-resolution editorial background is preserved. Standard interface icons come from the project's existing icon library and remain sharp at both tested sizes.
- Copy and content: all four reference questions, contextual answers, newsletter heading, supporting copy, placeholder, and CTA are present in natural Argentine Spanish.
- Accessibility and behavior: every question exposes `aria-expanded`; the accordion opens and closes correctly. The email field has a label, inline validation, live status feedback, and a visible focus treatment. Browser console contained no errors or warnings during desktop and mobile checks.

**Full-view comparison evidence**

- `/tmp/cecilia-faq-comparison.png` shows the source above and normalized implementation below. The hierarchy, 2 × 2 card composition, icon placement, rounded email control, and turquoise CTA match the selected visual target.

**Focused region comparison evidence**

- A separate focused crop was not needed because the normalized section comparison renders all typography, icons, borders, and form controls legibly.

**Comparison history**

- Initial implementation review found that the mobile layout needed explicit stacking and that the accordion's icon selector could rotate the leading category icon.
- Fixes made: added mobile single-column rules and targeted only `.faq-chevron` for rotation.
- Post-fix evidence: `/tmp/cecilia-faq-desktop.png`, `/tmp/cecilia-faq-mobile.png`, and `/tmp/cecilia-faq-comparison.png`; desktop and mobile interaction checks passed without console errors.

**Implementation Checklist**

- [x] Two rows and two columns on desktop.
- [x] Matching icon for each FAQ.
- [x] Expandable answers.
- [x] Newsletter email form directly below.
- [x] Responsive mobile layout.
- [x] Input validation and accessible states.

**Follow-up Polish**

- P3: the decorative foliage follows the site's existing background artwork rather than reproducing the reference's exact corner illustration.

final result: passed
