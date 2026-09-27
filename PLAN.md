# Runo: Improvement Plan

This plan covers the work to make Runo pleasant to play, and to grow it from two songs into a longer cycle of the Kalevala. It keeps what already works (the painted-in-code look, the ambient drone and stings, the hushed pace) and fixes what fights the player.

Phases 1 to 3 are done on this branch. Phases 4 to 6 are the road ahead, split into tracks that can run in parallel.

---

## 1. Diagnosis: why it felt bad

| Symptom (as reported) | Root cause | Where |
|---|---|---|
| Bumped off the logs | When a rune fired, the scene stopped calling the player update but never zeroed velocity, so the Wanderer kept sliding during the verse and walked off the log. The logs were also 4 px physics strips that counted as "sea", so the player stood on them with swim physics, and hit their sides when swimming. | `episode1.js` `_checkRunes`, `update`; `player.js` |
| Words vanish before they can be read | Any tap anywhere, Space (which is also jump) and Enter all dismissed the verse instantly. Walking into a rune while holding jump or tapping a move zone closed it before it faded in. There was no way to read a verse again. | `episode1.js` / `episode2.js` input handlers; `runes.js` `StoryPanel` |
| Strange swimming | The sea had no buoyancy: the player sank slowly to the bottom of the screen and respawned about every two seconds. Jump worked infinitely in mid-air while in "swim mode", which switched on and off at a fixed height line. Vertical damping ran per frame, so it changed with frame rate. Body gravity also stacked on world gravity (1000 total), so jumps were short and low. | `player.js` `update` |
| (found on the way) Distant hills and shore trees in Episode 1 never appeared | They were drawn at world x 2600+ on layers with scroll factors 0.15 and 0.35, which never scroll that far. | `episode1.js` `_buildParallax` |
| (found) The Episode 1 shore sat below sea level | Shore tops at y 500 against a sea surface at y 340. | `episode1.js` `_buildWorld` |
| (found) Cranking the Sampo walked the player away from the forge | Crank was "hold right", which also moved the player out of range. | `episode2.js` `_updateSampoCrank` |
| (found) Two verses at once could freeze the player forever | A second verse replaced the first without running its completion callback. | `runes.js` `StoryPanel.show` |
| (found) Respawn could stack | `respawn` was called every frame while below the world, starting overlapping fades. | `runes.js` `RespawnSystem` |

---

## 2. Principles

1. **Keep the soul.** Same silhouettes, palette families, drone and stings. New sound is additive (the kantele).
2. **Never punish reading.** A verse holds the world still, can't be skipped by accident, and can be read again.
3. **Water is a place, not a trap.** It holds you up; it can push you (rapids, heaving sea), but it never drowns you.
4. **Very Kalevala.** Verse in trochaic Kalevala meter with alliteration and parallelism, not rhymed couplets. Finnish beside English. Finnish names, places, creatures and objects: sotka, kantele, sauna smoke, revontulet, Ohto the bear, käspaikka weave.
5. **Every song has a verb.** Each runo adds one mechanic that *is* the story: floating, cranking, singing, playing, surviving.

---

## 3. Phases

### Phase 1: Feel (done)

| Item | Acceptance check |
|---|---|
| Freeze really freezes: input ignored, horizontal speed zeroed on ground, gravity and buoyancy still act | Hold → into a rune on a log: Wanderer stays on the log for the whole verse |
| Buoyant water: spring to floating depth, bob with waves, kick up out of water near the surface, hold ↓ to dive a little, clamber out when swimming into a bank | Idle in the sea for a minute: no respawn; can reach every log |
| One-way logs and ledges; solid ground bodies reach the bottom so steps are clean walls | Swim under a log and kick up onto it; no side snags |
| Jump feel: coyote time, jump buffer, variable height, quick taps never lost, presses during a verse swallowed | Tap jump at a ledge edge just after leaving it: still jumps |
| Frame-rate independent damping and acceleration | Same feel at 30 and 60 fps |
| Respawn guarded against stacking | One fade per fall |

### Phase 2: Readability and language (done)

| Item | Acceptance check |
|---|---|
| Verse panel at the top of the screen (every level keeps its sky clear), lines fade in one by one | Action at ground level stays visible during every verse |
| Minimum reading time; advance only with Enter / E, or a tap once "jatka · continue" shows; Space never advances | Holding Space into a rune does not close the verse |
| Verses queue instead of replacing each other | Opening verse plus an early rune: both show, player unfreezes |
| Re-read any lit rune: stand near it and press E, or tap it | Hint appears over lit runes |
| Bilingual verse: Finnish beside English, or either alone (L key or the FI · EN button); saved | Setting survives reload |
| Progress saved in localStorage (with a safe in-memory fallback); `?unlock=all` for testing | Finish I, reload, II is open |
| Mute button shows the real state; M toggles sound | |

### Phase 3: New runos (done)

| Runo | Source | Mechanic | Beats |
|---|---|---|---|
| **III · Laulukilpa**, The Singing Contest | Runo 3 | Call-and-response singing duel with four rune glyphs (← ↑ → ↓ or tap). Slippery ice on the frozen lake, open ice-holes. | Joukahainen's envy · the ice road under the northern lights · sleighs collide, shaft on shaft · his boasts · Väinämöinen sings: sleigh to log, horse to stone, bow to rainbow, cap to cloud, Joukahainen to his beard in the swamp · the plea, the offer of Aino · Aino weeps |
| **IV · Kantele**, The Pike-Bone Harp | Runos 40–41 | Swim upstream against the rapids until they are sung calm; gather jaw, teeth and horsehair; play a five-string kantele (1–5 or tap) to call the forest. | Setting out · "Koski, kuohu, vesi valkea" · the great pike and the fiery sword · building the kantele · squirrel, swan, eagle, elk, Ohto the bear, wolf and fish come to listen · tears become blue pearls; the sotka from Runo I dives for them |
| **V · Kullervo**, Kalervo's Son | Runos 31–36 | Seven palettes. Rough heaving sea; timed fire vents; climbing the great oak (required, it is the only way to the rock face); a wall of fire to outrun; Musti the dog follows you home. | The feud · barrel on the sea · the pyre · the oak and the carvings · the stone in the bread, the father's knife · cattle into wolves and bears · Untamola burns · the empty house · the heath and the sword · Väinämöinen's warning |

Shared engine work that made this cheap: `js/kit.js` (scene setup, full-height ground, one-way ledges, parallax ridges and forests, aurora, weather, bursts, finale and end card) and a silhouette library (spruce, birch, Scots pine, wolf, bear, elk, horse, cow, dog, squirrel, swan, eagle, pike, boat, sleigh, kantele, log house). Audio gained a Karplus-Strong kantele tuned D E F G A, sung notes for the duel, and stings for fire, sword, howl, sinking.

### Phase 4: Polish (next)

- **Per-song music.** A slow generative kantele line over each drone, in the episode's mode; a quiet runo-singer's call-and-response in III.
- **Parallax breathing.** The empty `_idleDrift` hook in the old Episode 1 was never filled. Give far layers a tiny sway.
- **Bake static layers.** Parallax forests are Graphics redrawn every frame. Bake them to textures in tiles no wider than 2048 px for low-end phones.
- **Footfall sounds** per surface: snow crunch, ice tick, wet stone.
- **Episode II shore.** The Sampo's escape runs on land; add the sea crossing the verses describe, using the new water.
- **Aurora** also on the title screen, reusing `EpisodeKit.aurora`.

### Phase 5: Accessibility and settings (next)

- Reduced motion: no shake, no flashes (respect `prefers-reduced-motion`).
- Text size: small, medium, large for verse.
- Slower duel: a setting that stretches the singing contest's tempo; the contest already shortens phrases after misses.
- Hold-to-crank alternative for the Sampo (tap rhythm) for players who cannot hold a key.
- A **Runokirja** (song book) on the title screen with every verse unlocked so far, in both languages.

### Phase 6: More runos (backlog)

| Runo | Mechanic idea |
|---|---|
| **Aino** (Runos 4–5) | A quiet walk to the lake; the maiden becomes a salmon. Swim as the salmon, then Väinämöinen's failed fishing. |
| **Lemminkäinen in Tuonela** (Runos 14–15) | The black river of Tuonela and its swan; his mother rakes his body from the river with a copper rake and sings him whole: collect the pieces while the current pulls. |
| **Karhunpeijaiset**, the Bear Feast (Runo 46) | The honouring of Ohto: a procession and songs, not a hunt; calls back the duel's glyph singing. |
| **Marjatta** (Runo 50) | The cranberry, the child, and Väinämöinen sailing away in a copper boat, leaving the kantele for the people. The natural ending of the cycle. |

---

## 4. Orchestration

The work splits into tracks that touch different files, so several people or agent sessions can run at once without stepping on each other.

| Track | Owns | Depends on | Notes |
|---|---|---|---|
| A. Engine and feel | `js/player.js`, `js/runes.js`, `js/kit.js` | nothing | Changes here affect every episode. Merge first; everyone else rebases. |
| B. Audio | `js/audio.js` | nothing | Keep existing sounds; add functions, never change old ones' character. |
| C. Content: one track per runo | `js/episodeN.js` only | A (kit API) | Each runo is one file plus one line in `index.html`, `main.js`, and the title's episode list. |
| D. Art library | `Silhouettes` in `js/kit.js`, `_generateKalevala` in `js/textures.js` | nothing | Additive only; new shapes get new names. |
| E. Title, settings, save | `js/title.js`, `RunoSave` / `RunoLang` in `js/runes.js` | A | Settings are Phase 5. |
| F. Verse and language review | verse strings in `js/episode*.js` | C | A native Finnish speaker should review the Finnish (see Language notes). |

**Order.** A and B first (small, shared). Then C, D and F in parallel, one branch per runo. E any time after A.

**The gate for every change:**

1. `npm install` once, then `npm run playtest`. Every episode must reach its finale with no page errors. Use `npm run playtest -- 3` for one episode.
2. A short manual pass on a phone in landscape: tap-to-read, jump button, the duel stones, the kantele strings.
3. The checklist below for the episode touched.

**Definition of done** for a new runo: it plays start to finish in `npm run playtest`; every rune has Finnish and English lines of equal count; it has one mechanic that *is* the story; the end card names the next song; its palette differs from its neighbours.

---

## 5. Manual playtest checklist

- [ ] Walk into every rune while holding jump: the verse stays up until Enter or a tap after "jatka" appears.
- [ ] Stand still in any water for 30 s: no drowning, gentle bob.
- [ ] Swim under a log and kick up onto it; walk its length; nothing pushes you off.
- [ ] Re-read a lit rune with E, and by tapping it.
- [ ] Cycle FI · EN, EN, FI with L; reload; the choice is kept.
- [ ] Episode II: hold Space at the Sampo; the smith stays put while it spins.
- [ ] Episode III: slide on the ice; fall into an ice-hole and climb out; miss a note in the duel on purpose and see the phrase replay.
- [ ] Episode IV: the rapids push back before the charm and barely after; build and play the kantele until everyone arrives.
- [ ] Episode V: fire vents can be passed by waiting; the oak can be climbed; the fire wall can be outrun; Musti follows you.
- [ ] Finish each episode; the next card unlocks; progress survives reload.

---

## 6. Language notes

- Kalevala verse is trochaic tetrameter (eight syllables, stress on odd syllables), bound by alliteration and by parallelism: each line says the thing again in new words. It does not rhyme. The English lines follow the same meter.
- Some Finnish lines are Lönnrot's own, lightly adapted from the 1849 *Kalevala* (public domain): for example "Mieleni minun tekevi", "Tuli sotka, suora lintu", "Aisa aisahan osasi", "Jauhoi purnun puhtehessa", "Kullervo, Kalervon poika". The rest were composed for the game in the same meter and style.
- The opening English lines of Runo I follow W. F. Kirby's 1907 translation (public domain). Other English lines are original.
- **Recommended:** a native Finnish speaker reviews all Finnish lines before a public release (track F).
