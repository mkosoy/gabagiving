# Gabagiving

**Tony Soprano Thanksgiving** — a story-driven retro top-down pixel-art Thanksgiving web game parody for desktop and mobile browsers.

## Play

Open `index.html` through any static web server, or deploy the repository directly to Vercel.

- Move: WASD / arrow keys / mobile touch stick
- Interact and advance dialogue: E, Space, Enter, or mobile A
- B: Augustus bonus on the ending screen
- F: free-roam North Caldwell after finishing the main story
- R: restart
- N toggles sound, M opens menu

The game uses original generated scene art, programmatic character sprites, and synthesized dialogue grunts/music; there are no copied show assets.

## Structure

- `index.html` — static app shell
- `styles.css` — responsive canvas and mobile controls
- `js/game.js` — story scenes, free roam, interactions, minigames, and rendering
- `js/sprites.js` — programmatic pixel characters and props
- `js/audio.js` — synthesized voices, effects, and music
- `assets/` — original generated illustrated backgrounds and parody photo props
