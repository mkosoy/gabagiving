# Gabagiving

**Tony Soprano Thanksgiving** — a story-driven retro top-down pixel-art Thanksgiving web game parody for desktop and mobile browsers.

## Play

Open `index.html` through any static web server, or deploy the repository directly to Vercel.

## The open world

After the story, the game opens into a GTA-style open world spanning five connected regions: North Caldwell, Manhattan (the Seinfeld side), the Pine Barrens, the Jersey Shore, and Atlantic City — travel through the Holland Tunnel and the Garden State Parkway.

- Missions: chained jobs from Newman, Kramer, and Silvio — deliveries, tail missions, timed runs, survival heat. Look for the pulsing **!**
- Crime: punch pedestrians (some fight back), steal cars with distinct handling, smash meters, rob the armored car — heat rises, cops chase, patrol cars ram you at heat 4+, Pay'n'Spray or laying low clears it
- Money: missions, blackjack, slots, craps, arm wrestling, high striker, claw machine, pier fishing, yard sales, scratch tickets, hidden gabagool packages (find all ten)
- Banking: Silvio's office safe at the Bing — bust-proof, pays interest
- Cheat codes: type GABAGOOL, SERENITY, or FEAST while exploring
- Secrets: cheat the wild turkey at your own risk

## Controls

- Move: WASD / arrow keys / mobile touch stick — Shift sprints
- Interact / advance dialogue: E, Space, Enter, or mobile A
- F: punch / car horn — R: car radio — Space in a car: handbrake
- B: switch Tony / George — T: fast travel — H: help card
- N toggles sound, M opens menu

The game uses original generated scene art, programmatic character sprites, and synthesized dialogue grunts/music; there are no copied show assets.

## Structure

- `index.html` — static app shell
- `styles.css` — responsive canvas and mobile controls
- `js/game.js` — story scenes, free roam, interactions, minigames, and rendering
- `js/sprites.js` — programmatic pixel characters and props
- `js/audio.js` — synthesized voices, effects, and music
- `assets/` — original generated illustrated backgrounds and parody photo props
