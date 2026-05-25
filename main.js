// ============================================================
// ReVox Main Window Controller
// Handles UI updates, voice control, and user interaction
// ============================================================

class ReVoxUI {
    constructor() {
        this.isVoiceEnabled = false;
        this.gameConnected = false;
        this.eventLog = [];
        this.maxEventLog = 20;
        this.voiceCommands = {
            'save that': { action: 'saveClip', duration: 15 },
            'clip that': { action: 'saveClip', duration: 30 },
            'highlight': { action: 'saveKill', duration: 20 },
            'stop listening': { action: 'disableVoice' }
        };
        
        this.initialize();
    }

    // ----------------------------------------------------------
    // Initialize UI and event listeners
    // ----------------------------------------------------------
    initialize() {
        this.bindElements();
        this.bindEvents();
        this.setupOverwolfListeners();
        this.updateUI();
    }

    // ----------------------------------------------------------
    // DOM Element References
    // ----------------------------------------------------------
    bindElements() {
        this.elements = {
            gameStatus: document.getElementById('gameStatus'),
            voiceStatus: document.getElementById('voiceStatus'),
            gameInfo: document.getElementById('gameInfo'),
            mapName: document.getElementById('mapName'),
            gameMode: document.getElementById('gameMode'),
            kdRatio: document.getElementById('kdRatio'),
            roundNumber: document.getElementById('roundNumber'),
            toggleVoice: document.getElementById('toggleVoice'),
            eventLog: document.getElementById('eventLog'),
            autoClipKills: document.getElementById('autoClipKills'),
            autoClipDeaths: document.getElementById('autoClipDeaths'),
            notifyOnClip: document.getElementById('notifyOnClip')
        };
    }

    // ----------------------------------------------------------
    // Event Listeners
    // ----------------------------------------------------------
    bindEvents() {
        // Voice toggle button
        this.elements.toggleVoice.addEventListener('click', () => {
            this.toggleVoiceControl();
        });

        // Settings checkboxes
        this.elements.autoClipKills.addEventListener('change', (e) => {
            this.saveSetting('autoClipKills', e.target.checked);
        });
        this.elements.autoClipDeaths.addEventListener('change', (e) => {
            this.saveSetting('autoClipDeaths', e.target.checked);
        });
        this.elements.notifyOnClip.addEventListener('change', (e) => {
            this.saveSetting('notifyOnClip', e.target.checked);
        });
    }

    // ----------------------------------------------------------
    // Overwolf Communication
    // ----------------------------------------------------------
    setupOverwolfListeners() {
        overwolf.windows.getCurrentWindow((result) => {
            this.windowId = result.window.id;
        });

        // Listen for messages from background controller
        overwolf.windows.onMessageReceived.addListener((message) => {
            this.handleMessage(message);
        });
    }

    // ----------------------------------------------------------
    // Message Handler
    // ----------------------------------------------------------
    handleMessage(message) {
        const { type, payload } = message;

        switch (type) {
            case 'gameEvent':
                this.handleGameEvent(payload);
                break;
            case 'updateGameInfo':
                this.updateGameInfo(payload);
                break;
            case 'gameConnected':
                this.onGameConnected(payload);
                break;
            case 'gameDisconnected':
                this.onGameDisconnected();
                break;
        }
    }

    // ----------------------------------------------------------
    // Game Event Handler
    // ----------------------------------------------------------
    handleGameEvent(event) {
        const { name, data } = event;
        const timestamp = new Date().toLocaleTimeString();
        
        // Add to event log
        this.addEventToLog(name, data, timestamp);
        
        // Update UI based on event type
        switch (name) {
            case 'kill':
                this.updateKillEvent(data);
                break;
            case 'death':
                this.updateDeathEvent(data);
                break;
            case 'match_info':
                this.updateMatchInfo(data);
                break;
            case 'game_info':
                this.updateGamePhase(data);
                break;
        }
    }

    // ----------------------------------------------------------
    // Event Log Management
    // ----------------------------------------------------------
    addEventToLog(eventName, data, timestamp) {
        const event = {
            id: Date.now(),
            name: eventName,
            data: data,
            timestamp: timestamp
        };

        this.eventLog.unshift(event);
        if (this.eventLog.length > this.maxEventLog) {
            this.eventLog.pop();
        }

        this.renderEventLog();
    }

    renderEventLog() {
        const container = this.elements.eventLog;
        
        if (this.eventLog.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>Game events will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.eventLog.map(event => `
            <div class="event-item ${event.name}">
                <div class="event-time">${event.timestamp}</div>
                <div class="event-desc">${this.formatEventDescription(event)}</div>
            </div>
        `).join('');
    }

    formatEventDescription(event) {
        switch (event.name) {
            case 'kill':
                return `🎯 Kill: ${event.data.killer || 'You'} eliminated ${event.data.victim || 'enemy'}`;
            case 'death':
                return `💀 Death: ${event.data.killer || 'enemy'} eliminated you`;
            case 'match_info':
                return `🏆 Match: ${event.data.map_name || 'Unknown map'}`;
            case 'game_info':
                return `🔄 Phase: ${event.data.phase || 'Unknown'}`;
            default:
                return `${event.name}: ${JSON.stringify(event.data)}`;
        }
    }

    // ----------------------------------------------------------
    // Game Info Updates
    // ----------------------------------------------------------
    updateGameInfo(info) {
        // Update game info fields
        if (info.game_info) {
            this.elements.mapName.textContent = info.game_info.map_name || '-';
            this.elements.gameMode.textContent = info.game_info.game_mode || '-';
            this.elements.roundNumber.textContent = info.game_info.round || '-';
        }
        
        if (info.me) {
            const kills = info.me.kills || 0;
            const deaths = info.me.deaths || 0;
            const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(0);
            this.elements.kdRatio.textContent = kd;
        }
    }

    updateKillEvent(data) {
        // Auto-clip if enabled
        if (this.elements.autoClipKills.checked) {
            this.requestClip('kill', 15);
        }
    }

    updateDeathEvent(data) {
        // Auto-clip if enabled
        if (this.elements.autoClipDeaths.checked) {
            this.requestClip('death', 15);
        }
    }

    updateMatchInfo(data) {
        // Update match-specific info
        console.log('Match info:', data);
    }

    updateGamePhase(data) {
        // Update game phase (lobby, operator_select, round, etc)
        console.log('Game phase:', data);
    }

    // ----------------------------------------------------------
    // Game Connection State
    // ----------------------------------------------------------
    onGameConnected(gameInfo) {
        this.gameConnected = true;
        this.elements.gameStatus.textContent = 'Game: Online';
        this.elements.gameStatus.className = 'status-badge online';
        this.elements.gameInfo.innerHTML = `
            <p><i class="fas fa-check-circle"></i> R6 Siege connected</p>
        `;
    }

    onGameDisconnected() {
        this.gameConnected = false;
        this.elements.gameStatus.textContent = 'Game: Offline';
        this.elements.gameStatus.className = 'status-badge offline';
        this.elements.gameInfo.innerHTML = `
            <p><i class="fas fa-hourglass-start"></i> Waiting for Rainbow Six Siege...</p>
        `;
        this.resetGameInfo();
    }

    resetGameInfo() {
        this.elements.mapName.textContent = '-';
        this.elements.gameMode.textContent = '-';
        this.elements.kdRatio.textContent = '-';
        this.elements.roundNumber.textContent = '-';
    }

    // ----------------------------------------------------------
    // Voice Control
    // ----------------------------------------------------------
    toggleVoiceControl() {
        this.isVoiceEnabled = !this.isVoiceEnabled;
        
        if (this.isVoiceEnabled) {
            this.enableVoiceControl();
        } else {
            this.disableVoiceControl();
        }
        
        this.updateUI();
    }

    enableVoiceControl() {
        // TODO: Implement Web Speech API integration
        // For now, simulate voice control with button clicks
        this.elements.voiceStatus.textContent = 'Voice: Enabled';
        this.elements.voiceStatus.className = 'status-badge enabled';
        this.elements.toggleVoice.innerHTML = '<i class="fas fa-microphone"></i> Disable Voice Control';
        this.elements.toggleVoice.classList.add('btn-danger');
        this.elements.toggleVoice.classList.remove('btn-primary');
        
        // Show voice listening indicator
        this.showNotification('Voice control enabled', 'Say "save that" or "clip that" to capture');
    }

    disableVoiceControl() {
        this.elements.voiceStatus.textContent = 'Voice: Disabled';
        this.elements.voiceStatus.className = 'status-badge disabled';
        this.elements.toggleVoice.innerHTML = '<i class="fas fa-microphone-slash"></i> Enable Voice Control';
        this.elements.toggleVoice.classList.remove('btn-danger');
        this.elements.toggleVoice.classList.add('btn-primary');
    }

    // ----------------------------------------------------------
    // Clip Request
    // ----------------------------------------------------------
    requestClip(eventType, duration) {
        // Send request to background controller
        overwolf.windows.sendMessage(
            this.windowId,
            'saveClip',
            JSON.stringify({ type: eventType, duration: duration }),
            (response) => {
                if (response && response.success) {
                    this.showNotification('Clip saved', `Saved ${duration}s replay`);
                }
            }
        );
        
        // Show local notification
        if (this.elements.notifyOnClip.checked) {
            this.showNotification('Replay captured', `Saving ${duration} seconds...`);
        }
    }

    // ----------------------------------------------------------
    // UI Helpers
    // ----------------------------------------------------------
    updateUI() {
        // Update button states based on current state
        if (this.gameConnected && this.isVoiceEnabled) {
            this.elements.toggleVoice.disabled = false;
        } else if (!this.gameConnected) {
            this.elements.toggleVoice.disabled = true;
        }
    }

    saveSetting(key, value) {
        // Save to localStorage
        localStorage.setItem(`revox_${key}`, value);
        console.log(`Setting saved: ${key} = ${value}`);
    }

    loadSettings() {
        // Load from localStorage
        this.elements.autoClipKills.checked = localStorage.getItem('revox_autoClipKills') !== 'false';
        this.elements.autoClipDeaths.checked = localStorage.getItem('revox_autoClipDeaths') !== 'false';
        this.elements.notifyOnClip.checked = localStorage.getItem('revox_notifyOnClip') !== 'false';
    }

    showNotification(title, message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <strong>${title}</strong>
            <p>${message}</p>
        `;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 15px;
            border-radius: var(--radius);
            box-shadow: 0 5px 15px var(--shadow);
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// ----------------------------------------------------------
// Initialize on DOM ready
// ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    window.revox = new ReVoxUI();
    window.revox.loadSettings();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});