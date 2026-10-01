# Integrate section videos into the page background

## Goal
Remove the detached square-video appearance and make the Courses, Campuses, and How It Works films feel like part of each section.

## Selected direction
Use the approved **Integrated immersive sections** treatment, adapted to Momentum One’s existing navy, teal, gold, white, typography, and real content.

## Changes
- Convert each section heading area into a wide cinematic band instead of a text-and-square layout.
- Let the existing loop fill an offset background region with responsive cropping rather than displaying its square boundary.
- Add directional navy overlays and soft edge masks so the film dissolves into the page background behind the heading.
- Keep headings, supporting copy, and all course, campus, and journey content as readable foreground content.
- Use a deeper treatment for How It Works so the video visually feeds into the existing journey line.
- On phones, use a shallow full-width video band with copy over the calmest area, avoiding a tall square block.
- On desktop, expand the film beyond the content container for a more editorial, cinematic composition.
- Preserve near-viewport loading, tab pausing, poster fallbacks, reduced-motion support, and data-saving behavior.

## Validation
- Review all three sections at 393 × 852 and 1280 × 1800.
- Confirm no hard video edges, detached boxes, text overlap, or reduced readability.
- Confirm nearby videos play, distant videos pause, and reduced-motion mode shows the blended posters without video elements.
- Check the current page for runtime and build errors.

## Technical details
- Extend the shared section-video presentation with immersive/background variants rather than duplicating playback logic.
- Use semantic design tokens and CSS masks/overlays that match each section’s background.
- Keep the existing video assets and all application behavior unchanged.
