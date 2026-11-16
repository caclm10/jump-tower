# Jump Tower

**Carry a little light a long way.** An original single-player precision platformer about a lantern courier climbing from a forgotten village to a beacon above the clouds.

## Play now — no installation

Open **`dist/index.html`** in a modern desktop browser. That one file contains the entire game. You can copy it to another computer, disconnect the internet, and double-click it. No server, Node.js, account, downloads, or network connection is needed to play.

The root `index.html` also works directly from `file://`, provided its `js/` folder and `style.css` stay beside it. Use the same file location and browser to keep access to your save. Local-file storage policies differ between browsers; if storage is denied, the game displays a notice and remains playable for the current session.

## Controls

| Key | Action |
| --- | --- |
| A / D or Left / Right | Walk; select the direction of your next jump |
| Hold Space | Charge a jump while grounded; charging stops walking |
| Release Space | Jump with the direction held at that instant |
| Escape | Pause / resume; back out of a submenu |
| R | Restart from the village, after confirmation |
| H | Hide / show the HUD |
| Tab / Enter | Navigate / activate menu buttons |

Release Space without a direction for a vertical jump. A full charge takes **0.72 seconds** and can be held indefinitely. Shorter charges make shorter, lower jumps. Once airborne, horizontal momentum is locked: there is no air steering or double jump. Walls stop horizontal momentum, and platforms have solid sides and undersides. Take a run along a ledge to find a clear launch position if a platform hangs overhead.

**There are no checkpoints, deaths, or automatic respawns.** Missing a ledge can drop you through several areas. Resting ledges are places to breathe, not reset points. Every lower area stays accessible. Three optional gold-rimmed routes trade narrow landings for fewer jumps.

## The journey

The tower has **50 named areas**, ten regions, 300 jumps along its main route, nine optional shortcut ledges, and a destination 20,000 game pixels above the village (displayed as 2,000 m).

1. Mosslight Village
2. The Root Archives
3. Lantern Hollows
4. The Hollow Keep
5. Copperwind Bluffs
6. The Glass Orchard
7. Moonbell Spires
8. The Cloudsea
9. Astral Gardens
10. The Last Light

Each region has its own original palette and scenery. Platform widths narrow as you climb, while authored switchbacks, varied rises, lamps, doors, crystals, and bells mark the route. Wind and frost are visual themes; neither silently changes the physics.

The intended first-time experience is a demanding, potentially multi-hour climb. **The requested 1–3 hour first-time duration has not been established by human playtesting.** The zero-fall automated main-route run takes about 7 minutes 52 seconds; real completion time depends heavily on falls and practice.

## Saving and settings

Progress saves every four seconds, on landings, when pausing or leaving, on restart, and on victory. The save includes position and velocity, region, highest altitude, active playtime, jumps, falls, and completion. Loading a saved airborne position resumes that trajectory. A fall is counted once when you drop more than eight pixels below your departure height; ordinary descent onto the same or a higher platform does not count. A deeper fall has a separate sound cue.

Continue restores your journey. Starting over or resetting progress requires confirmation. Sound and music have separate volume controls; HUD, particles, and landing shake can be disabled. Settings survive resetting the run. Muting, blocked audio, corrupt saves, or unavailable storage do not prevent play. Time stops in menus, while paused, and when the tab is hidden. Losing window focus pauses automatically.

Audio is synthesized locally with Web Audio: charging, jumping, landing, falling, menu selection, an ambient melody, and victory. It starts after a user interaction. There are no downloaded audio files or third-party art assets.

## Project structure

| Path | Responsibility |
| --- | --- |
| `index.html`, `style.css` | Offline entry point, responsive frame, menus, HUD styling |
| `js/config.js` | Physics constants, world dimensions, save format |
| `js/world.js` | Fifty authored layouts, rise rhythms, region palettes, shortcuts, spatial buckets |
| `js/physics.js` | Player state, charging, deterministic integration, swept collisions |
| `js/session.js` | Play / pause / restart / victory transitions and statistics |
| `js/camera.js` | Smoothed, bounded vertical camera |
| `js/renderer.js` | Cached pixel scenery, culled platforms, courier animations, particles |
| `js/audio.js` | Web Audio synthesis and separate audio buses |
| `js/save.js` | Validated localStorage persistence with safe fallbacks |
| `js/ui.js` | Functional menus, confirmations, settings, HUD |
| `js/game.js` | Keyboard events, fixed-step loop, interpolation, lifecycle |
| `tools/validate-levels.js` | Physics-based route search and continuous replay |
| `tools/build.js` | Dependency-free single-file distribution builder |
| `tests/run.js` | Automated physics, persistence, lifecycle, world, and offline checks |
| `tests/browser.cjs` | Optional Playwright browser acceptance tests |
| `tests/route.json` | Reproducible input sequence for the complete main-route replay |
| `tests/*-report.json` | Executed level and browser validation results |
| `dist/index.html` | Ready-to-play, self-contained distribution |

Classic scripts share the `JT` namespace intentionally: ES module imports and runtime fetches can fail when opened locally. No runtime package dependencies are needed. The game fills the browser window edge to edge, without website headers, footers, or outer borders. Rendering uses a 480-pixel-wide canvas with viewport height adapted to the window’s aspect ratio, preserving square pixels and the complete playable shaft. Nearest-neighbor scaling keeps the artwork sharp; menu sizing adapts to the available space.

## Physics and performance

Physics runs at **120 fixed steps per second**, independent of rendering. `requestAnimationFrame` interpolates the player and camera between those steps. A frame's catch-up time is bounded to avoid an unbounded backlog. Camera smoothing never changes collision coordinates or delays input.

The integrator uses semi-implicit Euler with gravity 440 px/s², maximum jump speed 316 px/s, horizontal jump speed 130 px/s, and terminal fall speed 680 px/s. Approximate flat-ground jump heights range from 12 to 112 pixels; full-charge horizontal travel is about 186 pixels. Available distance to an elevated ledge is shorter. Charge is sampled at release; movement keys released later in the same render frame cannot change that direction.

Platforms use 160-pixel spatial buckets. Physics and rendering visit only nearby buckets; scenery is cached per region. The entire tower is never rasterized or drawn at once. HUD text updates ten times per second. The hidden tab does no drawing or simulation. All visuals and level geometry are built locally; decorative hashing never randomizes gameplay.

To tune physics, edit `js/config.js`, then rerun the tests and level validator. The validator uses the production integrator, solid collisions, grounded charge/release, and actual walking inputs. Do not adjust reachability using unrelated distance thresholds.

## Adding areas

1. In `js/world.js`, add a six-entry `layouts` row of platform **center X** coordinates and one area name in `names`. All positions are authored in world pixels, bottom to top.
2. Add an entry to `rhythm`, selecting a `rises` profile. A profile contains six positive rises totaling exactly **400 pixels**. You may author another profile if needed.
3. Increase `areaCount` in `js/config.js`. Floor and world bounds are derived from that count. Regions group five consecutive areas; add a palette and subtitle for a new region as needed.
4. Keep the final platform centered on X = 240: the summit landing and beacon use that location. Other resting ledges follow their layout's last coordinate.
5. For an optional route, add `[areaIndex, firstCenterX, secondCenterX]` to the shortcut tuple list in `world.js`. This inserts narrow ledges at +100, +200, and +300 pixels, using the first, second, and first center. Its source is the previous resting platform; its destination is the area’s final resting platform. All ledges participate in collision checks.
6. Run `node tools/validate-levels.js`. It must find and continuously replay a route through every mandatory platform to victory, plus each optional route. Fix failed layouts, not the validator. Update the tests’ expected area and route counts when intentionally expanding the tower. Review the falling lanes and visual silhouette manually, then rebuild.

No unrestricted random map generation is used. Width tapering and curated rise profiles are shared design rules applied to the authored layout rows.

## Development commands

Node.js 20 or newer is needed **only for development**, not for playing.

```sh
node --test tests/run.js
node tools/validate-levels.js
node tools/build.js
```

Equivalent commands are `npm test`, `npm run validate`, and `npm run build`. They require no `npm install`.

The builder inlines the local CSS and scripts into `dist/index.html`. The finished HTML is about **59 KB**, well below the 2 MB preferred budget. Distribute that file directly.

The optional browser suite requires a development-only Playwright installation and a Chromium binary:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/browser.cjs
```

Minimal Linux environments may also need Chromium's system libraries. `PLAYWRIGHT_MODULE` can point to an existing Playwright installation, `PLAYWRIGHT_BROWSERS_PATH` can select a browser cache, and `QA_OUTPUT` selects the screenshot directory (default `/tmp/jump-tower-browser-qa`). None of these tools ship in the offline game.

## Verification and remaining manual checks

See [QA.md](QA.md) for the exact executed checks, browser coverage, and limits. Automated reachability proves a complete main-route traversal and all three shortcuts with the actual physics. Human difficulty tuning, a representative office-laptop performance trial, subjective audio review, and Firefox/Safari-specific checks remain manual work; they are not claimed as completed.
