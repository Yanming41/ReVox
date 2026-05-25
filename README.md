# ReVox (声刻)

**Voice-triggered replay capture for Rainbow Six Siege**

> Re = Replay / Record / Recall  
> Vox = Voice (Latin: "voice")  
> Together: "Use your voice to relive epic moments"  
> 中文名 **声刻** = 用声音铭刻精彩瞬间

[![Platform](https://img.shields.io/badge/platform-Overwolf-blue)](https://www.overwolf.com/)
[![Game](https://img.shields.io/badge/game-R6%20Siege-orange)](https://www.ubisoft.com/en-us/game/rainbow-six/siege)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Status](https://img.shields.io/badge/status-whitelist%20pending-yellow)]()

---

## Features

- Voice-triggered replay capture (say "save that" or "clip that")
- Automatic kill/death detection via Overwolf GEP
- Real-time game info display (map, mode, K/D, round)
- Customizable auto-clip settings
- Lightweight overlay UI

## Prerequisites

- Overwolf Client (Developers build)
- Overwolf Developer Whitelist approval
- Rainbow Six Siege (Game ID: 10826)

> **Note:** This app requires Overwolf whitelist approval to load as an unpacked extension. Without whitelist, the `verified_contents.json` signature check will fail.

## Project Structure

```
ReVox/
├── manifest.json      # Overwolf app manifest
├── background.html    # Background controller page
├── background.js      # Background controller logic
│                      #   - Game launch detection
│                      #   - Game events registration (GEP)
│                      #   - Window lifecycle management
├── main.html          # Main overlay window
├── main.js            # Main window UI controller
│                      #   - Voice control interface
│                      #   - Event log rendering
│                      #   - Settings management
├── main.css           # Main window styles
├── icons/             # App icons (128x128)
│   ├── icon_128.png
│   └── icon_128_gray.png
└── README.md
```

## Game Events (R6 Siege)

ReVox listens to the following Overwolf Game Events:

| Event | Description | Auto-clip support |
|---|---|---|
| `kill` | Player kill event | Yes |
| `death` | Player death event | Yes |
| `match_info` | Match metadata (map, mode, ID) | - |
| `game_info` | Game phase (lobby, operator_select, round) | - |
| `me` | Local player stats | - |
| `roster` | Team roster information | - |

## Voice Commands

| Command | Action | Duration |
|---|---|---|
| "save that" | Save replay clip | 15s |
| "clip that" | Save longer replay | 30s |
| "highlight" | Save last kill | 20s |
| "stop listening" | Disable voice control | - |

## Development

1. Install [Overwolf Client](https://www.overwolf.com/)
2. Enable developer mode (Chrome DevTools registry key)
3. Request whitelist from Overwolf team
4. Load unpacked extension in Overwolf

## Name Origin

| Language | Name | Meaning |
|---|---|---|
| English | **ReVox** | Re (Replay/Record/Recall) + Vox (Voice, Latin) = "Use voice to relive" |
| Chinese | **声刻** | 声 (Voice) + 刻 (Engrave) = "Engrave moments with voice" |

The name is intentionally short (5 letters), distinctive, and the "Re" prefix works both as a word root and as the English word "re-" (again/anew).

## License

MIT