# Runo

A dark cinematic side-scroller where a stick-figure wanderer travels through two episodes of the Finnish Kalevala—*The Birth of Väinämöinen* and *The Sampo*. Guide your character rightward through procedurally-painted landscapes of cold seas, forge-fire, and ancient storms. Tap glowing runes to hear verses of the story and watch the world respond: eggs crack and birth new mountains; a magical mill spins faster as you crank it; a goddess's storm pursues you across a darkening sky. Every brushstroke—sky gradients, silhouette layers, particle effects, and ambient soundscape—is generated in code. No external art files. Built on Phaser 3, playable in 8–12 minutes per episode.

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

**Keyboard:**
- **Arrow keys** or **WASD** — move left/right, jump (during Episode 1's sea segment, jump becomes a gentle float)
- **Spacebar** — jump
- **Enter** — advance story text and trigger narrative beats
- **M** (or tap **mute toggle** in top-right corner) — toggle audio on/off (audio is off by default)

**Touch / Mobile:**
- **Bottom-left zones** — tap the left or right half of the screen to walk
- **Bottom-right jump button** — large thumb-friendly button for jumping
- **Jump button in Episode 2** — doubles as the crank handle for the Sampo mill; hold/tap to spin it
- **Tap anywhere** — advance story text
- **Top-right corner** — mute toggle (also works on keyboard)

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

- `index.html` — entry point; loads Phaser 3 from CDN and all game scripts
- `js/` — game logic and rendering
  - `audio.js` — WebAudio synthesizer and ambient soundscape
  - `textures.js` — procedural texture generation (gradients, runes, player, terrain)
  - `runes.js` — rune stone entities and triggers
  - `player.js` — stick-figure controller, movement, and checkpoint respawn
  - `title.js` — title screen and episode select
  - `episode1.js` — Birth of Väinämöinen scene
  - `episode2.js` — The Sampo scene
  - `main.js` — game boot and scene manager

No external dependencies beyond Phaser 3 (loaded from CDN). No build step required.
