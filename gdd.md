# Runo

## Brief (from the prompt)
- **Concept:** A dark, painterly 2D side-scroller where a stick figure travels through two episodes of the Finnish Kalevala — cold, hushed, lantern-lit, and ancient.
- **Quality bar:** polished
- **Scope:** M
- **Budget:** default (4.5M cost units)

---

## Core Concept
Runo is a cinematic side-scroller built on Finnish mythology's oldest poem cycle. The player guides a small silhouetted figure left-to-right through vast, procedurally-painted landscapes — dark skies, cold seas, forge-fire glow — touching glowing runes to hear verses of the story and trigger staged visual events. The tone is Limbo's stark silhouettes filtered through a cold Nordic oil painting: moody gradients, particle drifts, hushed motion. No external art files exist; every brushstroke is code.

---

## Core Loop
Walk/jump rightward through a parallax landscape → discover a glowing rune → tap/approach to trigger a story beat (verse text fades in, a visual event plays — egg-crack, forge-spark, storm surge) → continue to the next rune → reach the finale rune to end the episode. Each episode is roughly 5–7 rune beats long, playable in 8–12 minutes.

---

## Win / Lose
**Win:** reach the finale rune of each episode. Finishing Episode 1 unlocks Episode 2. Finishing Episode 2 shows an end card: *"More runos to come."*

**Lose / hazards:** no permadeath. Touching cold water or falling too far respawns the player at the last touched rune (checkpoint). The game communicates this with a brief fade-to-dark and a hushed respawn — no game-over screen, no counter. Dying is just a setback, not a punishment; the tone stays contemplative.

---

## Objects & Entities
- **Player (the Wanderer):** stick-figure silhouette, ~32 px tall. Walks, jumps, swims (Episode 1 sea segment only, slower float physics). Drawn in code, single color.
- **Rune stones:** glowing procedural shapes (pulsing gradient circle + Nordic line glyph drawn on canvas). Two states: unlit (dim amber) and lit (bright gold). Act as story triggers and checkpoints.
- **Platforms / terrain:** layered silhouette polygons — foreground rocks, mid-ground tree-lines, far-background sky gradient. All procedural, distinct palette per episode.
- **Episode 1 entities:** primordial sea surface (sinusoidal wave), the sotka — the sacred goldeneye duck (simple procedural bird shape that nests, then departs), egg fragments (arc-trajectory particles that scatter and form world-shapes), newborn Väinämöinen rising from the water.
- **Episode 2 entities:** forge anvil + bellows (interactive crank object at the Sampo rune), Sampo mill (rotating procedural shape that glows and spins faster as cranked), Louhi's storm (darkness overlay + screen shake + wind-particle system pursuing from the right), shattered Sampo fragments (scatter particles that drift into the sky).
- **Parallax layers:** 4–5 depth layers per episode (sky, far mountains/sea, mid silhouettes, near terrain, foreground detail). All drawn in code.
- **UI chrome:** minimal — story text panel (bottom-center, semi-transparent dark bar), touch zones (invisible tap regions left/right halves + jump button overlay), mute toggle (top-right corner).

---

## Mechanics (cause → effect rules)
- When the player **walks into a rune's trigger radius** → rune lights fully, player halts briefly, story-verse text fades in, visual event begins, rune is marked as checkpoint.
- When the player **presses jump / swipe-up** → player launches (standard arc); in the Episode 1 sea segment, jump becomes a gentle float-up with slower gravity.
- When the player **falls into cold water or off a ledge** → brief fade-to-black, player respawns at last lit rune, fade back in.
- When the player **reaches the Sampo rune (Episode 2)** → crank UI appears; player holds right/tap-hold to crank; Sampo spins faster, forge glow intensifies, ambient WebAudio pitch rises; after threshold → forge cutscene fires, Sampo completes.
- When the player **enters the Louhi storm segment** → darkness vignette closes in from the right, screen shakes rhythmically, wind particles stream left, pace music urgency (WebAudio filter sweep); reaching the sea edge triggers the shattering sequence.
- When the **Sampo shatters** → explosion of gold+grain particles arcing across the sky, screen briefly white-flashes, then settles into a quiet dawn gradient; finale rune appears.
- When the player **touches the finale rune** → episode-end cinematic (text + held visual), then title-card fade.

---

## UI Needs
- [v1] Story-verse text panel — bottom-center, dark semi-transparent bar, fades in/out per rune beat
- [v1] Episode select / title screen — TitleScene with episode cards (Ep2 locked until Ep1 complete)
- [v1] On-screen touch controls — left/right half tap zones, jump button (bottom-right corner), all invisible except jump button icon
- [v1] Mute toggle — top-right, toggles WebAudio on/off (off by default)
- [v1] Respawn fade — full-screen dark overlay, 0.4 s fade out
- [v1] End card — "More runos to come" static screen with title and ambient particle drift
- [later] Progress save (localStorage — episode unlock state persists across sessions)
- [later] Language toggle (Finnish / English verse text)
- [later] Accessibility: text size option, reduced-motion mode (disable screen shake)
- [later] Credits / lore screen accessible from title

---

## Chosen Stack + Why
**Phaser 3 via CDN, no bundler, static files only (index.html + a few .js files).**

Phaser gives a real game loop, scene manager, input handling, and parallax tilemaps without the overhead of a bundler or a framework. Loading it from CDN means zero build step — open index.html and it runs. Static files host for free on GitHub Pages. The no-external-assets constraint is met entirely by Phaser's Graphics and RenderTexture APIs for procedural drawing, its particle system for effects, and the WebAudio API for synthesized sound. A Wordle-style toy wouldn't need Phaser; this game needs a scene graph, parallax layers, physics, and particles — Phaser earns its weight.

---

## Scope Notes

**v1 (shippable):**
- BootScene (procedurally generates all textures into Phaser RenderTextures — sky gradients, terrain silhouettes, rune glyphs, stick figure)
- TitleScene with episode select (Ep2 locked until Ep1 complete, unlock state in memory only for v1)
- Episode1Scene: Birth of Väinämöinen — sea floating segment, duck/egg visual event, world-formation particles, Väinämöinen shore arrival, 5–6 rune story beats, finale card
- Episode2Scene: The Sampo — forge approach, Sampo crank mechanic, Louhi storm escape sequence with screen shake + darkness, shattering finale, 5–6 rune story beats, end card
- Shared PlayerController (walk, jump, float-swim mode, checkpoint respawn)
- Keyboard (arrows/WASD + space) and touch controls (left/right zones, jump button)
- WebAudio ambient drone + event stings, off by default, mute toggle
- No external files whatsoever — 100% self-contained

**Later:**
- Episodes 3–N (Lemminkäinen, the Kantele, the Bear Hunt — the mythology has many more runos)
- localStorage save for episode unlock across sessions
- Finnish-language verse toggle
- Accessibility options (reduced motion, text size)
- Collectible rune fragments that unlock a lore glossary
- Soundscape composer (procedural generative music that evolves per episode mood)

---

## Mobile Considerations
- Touch zones cover the full left half (move left/right) and a jump button in the bottom-right; no hover mechanics anywhere
- Text panel font size minimum 16 px; verse text line-length capped to avoid overflow on narrow viewports
- Screen shake intensity capped on mobile (detect touch device via pointer events) — violent shake on a handheld is nauseating
- Phaser scale manager set to FIT mode so the canvas fills any screen without letterboxing artifacts
- Tap to advance story text works identically to keyboard Enter; no double-tap or long-press required for any core action
- Jump button large enough for a thumb (min 56 px touch target)

---

## Polish Hooks (for the Vibe stage)
- **Parallax breathing:** layers drift very slightly even when the player stands still — the world feels alive and cold
- **Rune pulse:** unlit runes have a slow ambient glow pulse; lit runes emit a brief particle burst on activation
- **Footstep dust:** tiny particle puff at each footfall, color-matched to the terrain palette
- **Water caustics:** sinusoidal highlight lines on the sea surface, procedural, slow-scrolling
- **Forge glow bloom:** during the Sampo crank, a radial orange gradient "bloom" grows behind the mill, intensifying with crank progress
- **Storm vignette gradient:** Louhi's darkness is not a flat overlay but a radial gradient that breathes — contracting and expanding on the screen-shake rhythm
- **End-card particle drift:** finale screen has slow gold motes drifting upward — the Sampo's abundance seeding the world — held for 6–8 seconds before the "more runos" text fades in
- **Title scene atmosphere:** TitleScene has a slow horizontal parallax drift (clouds/stars moving) and a faint ambient drone that cross-fades into Episode 1's soundscape on selection
