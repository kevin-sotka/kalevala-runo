# Runo

A dark, cinematic side-scroller through the *Kalevala*, Finland's national epic. A stick-figure wanderer walks, swims and sings through five songs (runot), each painted entirely in code: cold seas, forge-fire, northern lights over a frozen lake, a midsummer night that never ends, and the long burning road of Kullervo. Touch glowing runes to hear the verses, in Finnish beside English, and watch the world answer. Built on Phaser 3. No external art or audio files.

| | Song | What you do |
|---|---|---|
| I | **Väinämöisen synty** · The Birth of Väinämöinen | Float on the first sea; the sotka nests, the eggs break into the world |
| II | **Sampo** | Walk to the forge, turn the Sampo, flee Louhi's storm |
| III | **Laulukilpa** · The Singing Contest | Cross the frozen lake, then out-sing Joukahainen into the swamp |
| IV | **Kantele** · The Pike-Bone Harp | Fight the rapids, fell the great pike, build and play the kantele |
| V | **Kullervo** · Kalervo's Son | Survive sea, fire and oak; outrun burning Untamola; walk home with Musti |

See **[PLAN.md](PLAN.md)** for what was fixed, why, and what comes next.

---

## How to Play Locally

### Using Python's built-in server (recommended)
```bash
cd /Users/kevinsotka/Meatbag_Labs/kalevala-runo
python3 -m http.server 8765
```
Then open http://localhost:8765 in your browser.

### Alternative: Open directly
Since there are no module imports or external assets, you can also open `index.html` directly in your browser:
```
Open /Users/kevinsotka/Meatbag_Labs/kalevala-runo/index.html in your browser
```

Any static server (Node.js `http-server`, Ruby's WEBrick, PHP's built-in server, etc.) also works—just serve the folder and open the root URL.

---

## Controls

**Keyboard**
- **← → / A D**: walk (and swim)
- **Space / ↑ / W**: jump. In water, kick up out of the water near the surface. Hold **↓ / S** to dive a little.
- **Enter / E**: continue a verse once "jatka · continue" shows. Near a lit rune, **E** reads it again.
- **L**: verse language: Finnish beside English, English only, Finnish only (saved)
- **M**: sound on/off
- Episode II: hold **Space** at the Sampo to turn it
- Episode III: sing back Joukahainen's phrase with **← ↑ → ↓**
- Episode IV: play the kantele with **1 2 3 4 5** (or A S D F G)

**Touch** (landscape)
- Left third / middle third of the screen: walk left / right
- Round button, bottom right: jump (and turn the Sampo)
- Tap to continue a verse; tap a lit rune to read it again
- Tap the glyph stones (III) and the strings (IV)
- Top right: **FI · EN** language and sound

Progress and the language choice are saved in the browser. Add `?unlock=all` to the URL to open every song.

---

## Playtest

The game itself needs no build. For the automated playtest (headless Chromium plays every episode to its finale):

```bash
npm install
npm run playtest          # all five
npm run playtest -- 3     # just one
```

---

## Deploy

Runo is 100% static—no build step, no server-side code, no external assets. It's ready for any static host.

### GitHub Pages (recommended for free hosting)
1. Create a repository on GitHub (e.g., `kalevala-runo`)
2. Clone it locally or initialize a new one in this folder
3. Commit all files:
   ```bash
   git add .
   git commit -m "Initial Runo release"
   git push -u origin main
   ```
4. Go to **Settings → Pages** in your GitHub repository
5. Set **Source** to `main` branch, root (`/`) folder
6. GitHub will build and serve your game at `https://<username>.github.io/kalevala-runo/`

### Vercel or Netlify
Both offer free tiers and deploy static sites with zero configuration:
- **Vercel:** Connect your GitHub repo, Vercel auto-deploys on push
- **Netlify:** Drag-and-drop the entire folder, or connect your repo

Both will serve your game publicly within seconds.

### Custom hosting
Upload the entire folder to any web host (shared hosting, VPS, etc.) and serve it as static files. The only requirement is that `index.html` is accessible at the root of your domain.

---

## Credits

Stories from the *Kalevala*, the Finnish national epic. Built by the SodClaw Game Foundry.

---

## What's Included

- `index.html`: entry point; loads Phaser 3 from CDN and the game scripts
- `js/`
  - `audio.js`: WebAudio drones, stings, and a synthesized five-string kantele
  - `textures.js`: BootScene; generates every texture in code
  - `runes.js`: rune stones, the bilingual verse panel, respawn, save, language and sound buttons
  - `player.js`: the Wanderer: walking, jumping, buoyant swimming, touch controls
  - `kit.js`: shared episode building blocks and the silhouette library
  - `title.js`: title screen and song select
  - `episode1.js` to `episode5.js`: the five songs
  - `main.js`: game config and scene list
- `tools/playtest.mjs`: headless autoplay test (dev only)
- `PLAN.md`: diagnosis, phases, orchestration plan
- `gdd.md`: the original game design document

Verses: some Finnish lines are Elias Lönnrot's (*Kalevala*, 1849), lightly adapted; the rest are composed in Kalevala meter for the game. The opening English lines follow W. F. Kirby's 1907 translation. Both are in the public domain.
