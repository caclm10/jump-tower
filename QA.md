# Jump Tower verification

## Executed automated checks

`node --test tests/run.js` executes 23 tests covering:

- Tap, half-charge, and full-charge jump heights; horizontal distance and symmetry.
- Fixed airborne momentum, rejected airborne charging, and no double jumps.
- Charge clamping, indefinite holding, release, and grounded movement locking.
- Fast-fall landing without tunneling; solid side and underside collisions.
- Physically continuous falls through multiple areas without a respawn.
- World walls, ceiling, and floor.
- Grounded and airborne save/load, corrupted and invalid data, blocked storage, validated settings.
- Pause/resume, frozen playtime, charge cancellation, and restart.
- Camera smoothing and bounds; identical fixed-step results at 30, 60, and 144 render FPS.
- Fifty areas, six main-route platforms per area, ten regions, and the distant summit.
- A complete continuous main-route replay to victory, using production physics.
- Local-only classic-script entry points and absence of runtime network-loading APIs.
- Fall counting for short setbacks, excluding normal jump descent.

`node tools/validate-levels.js` searches charge durations, launch positions, and directions by executing **the same physics and collision code as the game**. It walks to launch points using actual movement inputs. It then replays the entire 300-jump main route through `Session.tick` from the village to victory, without teleportation. Each of three optional routes is also checked continuously from its reachable main-route source to its destination (12 optional jumps total). All ledges, including optional ones, participate in collision detection during every trial.

The main route is deliberately a connected chain: checking and replaying its 300 edges proves connectivity to the summit; an all-pairs geometric graph is unnecessary. The search is finite rather than a symbolic proof of every possible trajectory. A failed search must be investigated, and a successful replay provides a concrete, reproducible traversal. `tests/route.json` records that traversal; `tests/level-report.json` records the result.

## Executed browser acceptance

`tests/browser.cjs` was run in **headless Chromium 159.0.8154.6 on Linux** with networking disabled. Both root `index.html` and bundled `dist/index.html` were opened using **`file://`**, with no server.

Verified:

- Launch, functional menus, controls, settings sliders/toggles, and menu content fitting the game frame.
- Real keyboard charge/release and a successful first-platform landing.
- Correct direction capture when Space and a movement key are released between simulation steps.
- Pause/resume, frozen player and statistics while paused, and HUD toggling.
- Restart confirmation, cancellation, and actual restart.
- Save, reload, Continue, and persistent volume/particle settings.
- A browser execution of all 300 main-route jumps through the production session, followed by the actual rendered victory screen.
- Victory statistics and both actions fit without scrolling; completion survives reload and Continue.
- Edge-to-edge game and canvas bounds, with no website header or footer, at 1920×1080, 1366×768, 1280×720, and 1024×650.
- Reset Progress requires confirmation; cancellation preserves the run and confirmation removes it.
- Corrupted browser saves recover to a usable main menu.
- Play remains available when localStorage throws and Web Audio is absent.
- No uncaught JavaScript exceptions and **zero external network requests** during those tests.

`tests/browser-report.json` records results. Screenshots were captured and visually inspected for the menu, village, frozen region, astral region, and victory. Region screenshots use explicit visual test fixtures; they are not presented as manual playthroughs. The full replay starts from the actual village state and never teleports.

## Scope and limits

- The automated main-route traversal takes about **7 minutes 52 seconds of simulated playtime**, with 300 jumps and zero falls. It is a tool-assisted, carefully chosen route rather than a first-time human playthrough.
- The desired **1–3 hour first-time completion time is a design target, not a measured result**. Human playtesting is needed to establish difficulty, fatigue, fairness under imperfect inputs, and overall pacing.
- Smooth 60 FPS is the implementation target. Caching, culling, small canvas size, a bounded fixed-step loop, and a tiny distribution support that target, but no performance guarantee is made for untested office laptops or browser/OS combinations.
- Firefox and Safari were not executed here. The game uses standard Canvas 2D, classic scripts, keyboard events, requestAnimationFrame, localStorage, and optional Web Audio. Local-file storage persistence and browser audio policies require manual checks on those browsers.
- Audio paths were exercised for exceptions and fallback behavior; subjective listening and volume balance remain manual checks.
- Automated collision checks and route replay establish the required path. They do not enumerate every possible trick jump, grazing contact, or sequence a human might attempt.

Recommended manual review: play from the village with both keyboard mappings, deliberately fall across region boundaries, close/reopen the same file, listen at several volume levels, test fullscreen and focus changes, and complete human playthroughs before making duration or hardware-performance claims.
