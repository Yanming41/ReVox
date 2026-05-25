// ============================================================
// ReVox Background Controller
// Handles game launch detection, game events, and main window lifecycle
// ============================================================

const MAIN_WINDOW = "main";
const DEFAULT_WINDOW_SIZE = { width: 400, height: 600 };
const GAME_ID_R6 = 10826;

let isGameRunning = false;
let mainWindowId = null;

// ----------------------------------------------------------
// App Startup
// ----------------------------------------------------------
overwolf.extensions.onAppLaunchTriggered.addListener(() => {
    console.log("[ReVox] App launched, waiting for game...");
    checkRunningGame();
});

// ----------------------------------------------------------
// Game Events
// ----------------------------------------------------------
overwolf.games.onGameInfoUpdated.addListener((event) => {
    if (event.gameInfo && event.gameInfo.isRunning) {
        const gameId = event.gameInfo.id;
        if (gameId === GAME_ID_R6 && !isGameRunning) {
            onGameStarted(event.gameInfo);
        }
    } else if (!event.gameInfo || !event.gameInfo.isRunning) {
        if (isGameRunning) {
            onGameStopped();
        }
    }
});

// ----------------------------------------------------------
// Game Started
// ----------------------------------------------------------
function onGameStarted(gameInfo) {
    console.log("[ReVox] R6 Siege detected - starting capture");
    isGameRunning = true;
    registerGameEvents();
    openMainWindow();
}

// ----------------------------------------------------------
// Game Stopped
// ----------------------------------------------------------
function onGameStopped() {
    console.log("[ReVox] Game exited");
    isGameRunning = false;
    closeMainWindow();
}

// ----------------------------------------------------------
// Register Overwolf Game Events
// ----------------------------------------------------------
function registerGameEvents() {
    const features = ["kill", "death", "match_info", "game_info"];

    overwolf.games.events.setRequiredFeatures(features, (info) => {
        if (!info.success) {
            console.error("[ReVox] Failed to set features:", info.error);
            return;
        }
        console.log("[ReVox] Game events registered:", features.join(", "));
    });

    overwolf.games.events.onNewEvents.addListener((event) => {
        handleGameEvent(event);
    });
}

// ----------------------------------------------------------
// Game Event Dispatcher
// ----------------------------------------------------------
function handleGameEvent(event) {
    if (!event.events || event.events.length === 0) return;

    event.events.forEach((e) => {
        // Auto-clip on kills - triggered automatically by GEP
        if (e.name === "kill") {
            console.log("[ReVox] Kill detected:", e.data);
            saveReplayClip("kill", e.data);
        }

        // Forward event to main window
        sendToMainWindow("gameEvent", { name: e.name, data: e.data });
        sendToMainWindow("updateGameInfo", event.info);
    });
}

// ----------------------------------------------------------
// Save Replay Clip
// ----------------------------------------------------------
function saveReplayClip(eventType, eventData) {
    const duration = 15; // seconds back
    const clipName = `ReVox_${eventType}_${Date.now()}`;

    // TODO: Request Overwolf replay capture permission
    // Overwolf API requires user consent for media capture
    console.log(`[ReVox] Would save replay: ${clipName} (${duration}s)`, eventData);
}

// ----------------------------------------------------------
// Main Window Management
// ----------------------------------------------------------
function openMainWindow() {
    overwolf.windows.obtainDeclaredWindow(MAIN_WINDOW, (result) => {
        if (result.success) {
            mainWindowId = result.window.id;
        }
        overwolf.windows.restore(MAIN_WINDOW, () => {
            console.log("[ReVox] Main window restored");
        });
    });
}

function closeMainWindow() {
    overwolf.windows.close(MAIN_WINDOW, () => {});
}

function sendToMainWindow(type, payload) {
    if (!mainWindowId) return;
    overwolf.windows.sendMessage(
        mainWindowId,
        type,
        JSON.stringify(payload),
        () => {}
    );
}

// ----------------------------------------------------------
// Check running game on startup
// ----------------------------------------------------------
function checkRunningGame() {
    overwolf.games.getRunningGameInfo((info) => {
        if (info && info.classId === GAME_ID_R6) {
            onGameStarted(info);
        }
    });
}