export class UI {
    constructor() {
        this.playerInfoElement = document.getElementById('player-info');
        this.playerNameElement = document.getElementById('player-name');
        this.playerPositionElement = document.getElementById('player-position');
        this.playersListElement = document.getElementById('players-list');
        
        this.networkManager = null;
        this.showingKingdomInfo = false;
    }
    
    initialize(networkManager) {
        this.networkManager = networkManager;
        
        // Initialize player name display
        const username = this.networkManager.getUsername();
        this.playerNameElement.textContent = `Player: ${username}`;
        
        // Setup coordinate toggle button
        this.createCoordinateToggle();
        
        // Setup instructions
        this.createInstructions();
        
        // Setup kingdom info button
        this.createKingdomInfoButton();
        
        // Setup debug button
        this.createDebugButton();
    }
    
    createCoordinateToggle() {
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle Coordinates';
        toggleButton.style.position = 'absolute';
        toggleButton.style.top = '10px';
        toggleButton.style.left = '200px';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.backgroundColor = '#333';
        toggleButton.style.color = 'white';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.zIndex = '100';
        
        toggleButton.onclick = () => {
            // Toggle coordinates in the isometric renderer
            if (window.game && window.game.gameEngine.isometricRenderer) {
                window.game.gameEngine.isometricRenderer.toggleCoordinates();
            }
        };
        
        document.body.appendChild(toggleButton);
    }
    
    createKingdomInfoButton() {
        const infoButton = document.createElement('button');
        infoButton.textContent = 'Kingdom Info';
        infoButton.style.position = 'absolute';
        infoButton.style.top = '10px';
        infoButton.style.left = '350px';
        infoButton.style.padding = '5px 10px';
        infoButton.style.backgroundColor = '#5D4037';
        infoButton.style.color = 'white';
        infoButton.style.border = 'none';
        infoButton.style.borderRadius = '3px';
        infoButton.style.cursor = 'pointer';
        infoButton.style.zIndex = '100';
        
        infoButton.onclick = () => {
            if (!this.showingKingdomInfo) {
                this.showKingdomInfo();
            } else {
                this.hideKingdomInfo();
            }
        };
        
        document.body.appendChild(infoButton);
    }
    
    showKingdomInfo() {
        // Create an info panel
        const infoPanel = document.createElement('div');
        infoPanel.id = 'kingdom-info';
        infoPanel.style.position = 'absolute';
        infoPanel.style.top = '50px';
        infoPanel.style.left = '50%';
        infoPanel.style.transform = 'translateX(-50%)';
        infoPanel.style.width = '500px';
        infoPanel.style.maxWidth = '90%';
        infoPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        infoPanel.style.color = 'white';
        infoPanel.style.padding = '20px';
        infoPanel.style.borderRadius = '5px';
        infoPanel.style.fontSize = '14px';
        infoPanel.style.zIndex = '200';
        
        // Add kingdom information
        infoPanel.innerHTML = `
            <h2 style="text-align: center; margin-bottom: 15px; color: gold;">Welcome to ChunkWorld Kingdom</h2>
            
            <p>You are exploring a procedurally generated medieval kingdom with the following regions:</p>
            
            <h3 style="margin-top: 15px; color: #A8A8A8;">Castle (Center)</h3>
            <p>The heart of the kingdom with castle walls, towers, and interior structures.</p>
            
            <h3 style="margin-top: 10px; color: #7E7E7E;">Castle Grounds</h3>
            <p>The area immediately surrounding the castle with guard towers and decorative gardens.</p>
            
            <h3 style="margin-top: 10px; color: #CD5C5C;">Town</h3>
            <p>A bustling settlement with houses, roads, gardens, and a marketplace.</p>
            
            <h3 style="margin-top: 10px; color: #DAA520;">Farmland</h3>
            <p>The agricultural region with farms, fields, and scattered trees.</p>
            
            <h3 style="margin-top: 10px; color: #4CAF50;">Wilderness</h3>
            <p>The untamed areas beyond the kingdom's borders with forests, mountains, and water.</p>
            
            <p style="margin-top: 20px;">The kingdom is fully explorable. Click any tile to move there and interact with other players in this shared world.</p>
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.display = 'block';
        closeButton.style.margin = '20px auto 0';
        closeButton.style.padding = '8px 20px';
        closeButton.style.backgroundColor = '#5D4037';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '3px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.onclick = () => {
            this.hideKingdomInfo();
        };
        
        infoPanel.appendChild(closeButton);
        document.body.appendChild(infoPanel);
        
        this.showingKingdomInfo = true;
    }
    
    hideKingdomInfo() {
        const infoPanel = document.getElementById('kingdom-info');
        if (infoPanel) {
            document.body.removeChild(infoPanel);
        }
        this.showingKingdomInfo = false;
    }
    
    createInstructions() {
        // Create an instructions panel
        const instructions = document.createElement('div');
        instructions.id = 'instructions';
        instructions.style.position = 'absolute';
        instructions.style.bottom = '10px';
        instructions.style.right = '10px';
        instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        instructions.style.color = 'white';
        instructions.style.padding = '10px';
        instructions.style.borderRadius = '5px';
        instructions.style.fontSize = '14px';
        instructions.style.maxWidth = '300px';
        instructions.style.zIndex = '100';
        instructions.innerHTML = `
            <h3 style="margin-bottom: 5px;">Controls:</h3>
            <p>Click on a tile to move there</p>
            <p>Your character will move one tile at a time</p>
            <p>The camera always stays centered on your character</p>
            <p>Explore the kingdom and interact with other players</p>
            <p>The world is automatically saved</p>
        `;
        
        // Add a dismiss button
        const dismissButton = document.createElement('button');
        dismissButton.textContent = 'Dismiss';
        dismissButton.style.marginTop = '10px';
        dismissButton.style.padding = '5px 10px';
        dismissButton.style.backgroundColor = '#4CAF50';
        dismissButton.style.border = 'none';
        dismissButton.style.borderRadius = '3px';
        dismissButton.style.color = 'white';
        dismissButton.style.cursor = 'pointer';
        dismissButton.onclick = () => {
            instructions.style.display = 'none';
        };
        
        instructions.appendChild(dismissButton);
        document.body.appendChild(instructions);
    }
    
    createDebugButton() {
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Debug Mode';
        debugButton.style.position = 'absolute';
        debugButton.style.top = '10px';
        debugButton.style.left = '480px';
        debugButton.style.padding = '5px 10px';
        debugButton.style.backgroundColor = '#FF5722';
        debugButton.style.color = 'white';
        debugButton.style.border = 'none';
        debugButton.style.borderRadius = '3px';
        debugButton.style.cursor = 'pointer';
        debugButton.style.zIndex = '100';
        
        debugButton.onclick = () => {
            // Toggle debug mode in game engine
            if (window.game && window.game.gameEngine) {
                window.game.gameEngine.toggleDebugMode();
                debugButton.style.backgroundColor = window.game.gameEngine.debugMode ? '#4CAF50' : '#FF5722';
                
                // Also perform reload check if debug is enabled
                if (window.game.gameEngine.debugMode) {
                    this.logGameState();
                }
            }
        };
        
        document.body.appendChild(debugButton);
    }
    
    logGameState() {
        console.log('======= GAME STATE DEBUG INFO =======');
        console.log('Game object exists:', !!window.game);
        if (window.game) {
            console.log('Game engine exists:', !!window.game.gameEngine);
            console.log('Chunk system exists:', !!window.game.chunkSystem);
            console.log('Player exists:', !!window.game.player);
            console.log('Network manager exists:', !!window.game.networkManager);
            
            if (window.game.chunkSystem) {
                console.log('Chunks loaded:', Object.keys(window.game.chunkSystem.chunks).length);
                console.log('Chunk loading distance:', window.game.chunkSystem.loadDistance);
                console.log('Kingdom center:', window.game.chunkSystem.kingdomCenter);
            }
            
            if (window.game.player) {
                console.log('Player position:', { x: window.game.player.x, y: window.game.player.y });
                console.log('Current region:', window.game.player.currentRegion);
                console.log('Is moving:', window.game.player.isMoving);
            }
        }
        console.log('===================================');
    }
    
    update(player, chunkSystem) {
        // Update player position display
        const chunkX = Math.floor(player.x / chunkSystem.chunkSize);
        const chunkY = Math.floor(player.y / chunkSystem.chunkSize);
        const tileX = Math.floor(player.x) % chunkSystem.chunkSize;
        const tileY = Math.floor(player.y) % chunkSystem.chunkSize;
        
        // Determine region type
        const regionType = chunkSystem.determineRegionType(chunkX, chunkY);
        const regionColor = this.getRegionColor(regionType);
        
        this.playerPositionElement.innerHTML = 
            `Position: (${Math.floor(player.x)}, ${Math.floor(player.y)}) | ` +
            `Chunk: (${chunkX}, ${chunkY}) | ` +
            `<span style="color: ${regionColor};">Region: ${regionType}</span>`;
        
        // Update players list
        this.updatePlayersList();
    }
    
    getRegionColor(regionType) {
        // Return color based on region type
        switch(regionType) {
            case 'CASTLE': return '#A8A8A8';
            case 'CASTLE_GROUNDS': return '#7E7E7E';
            case 'TOWN': return '#CD5C5C';
            case 'FARMLAND': return '#DAA520';
            case 'WILDERNESS': return '#4CAF50';
            default: return 'white';
        }
    }
    
    updatePlayersList() {
        if (!this.networkManager) return;
        
        const otherPlayers = this.networkManager.getOtherPlayers();
        
        // Clear current list
        this.playersListElement.innerHTML = '';
        
        // Add header
        const header = document.createElement('div');
        header.textContent = `Players Online: ${otherPlayers.length + 1}`;
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '5px';
        this.playersListElement.appendChild(header);
        
        // Add current player to the list
        const currentPlayerItem = document.createElement('div');
        currentPlayerItem.textContent = `${this.networkManager.getUsername()} (You)`;
        currentPlayerItem.style.color = '#4CAF50';
        this.playersListElement.appendChild(currentPlayerItem);
        
        // Add other players
        otherPlayers.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.textContent = player.username;
            playerItem.style.color = player.color || '#FFFFFF';
            this.playersListElement.appendChild(playerItem);
        });
    }
    
    showMessage(message, duration = 3000) {
        // Create a message element
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.position = 'absolute';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageElement.style.color = 'white';
        messageElement.style.padding = '15px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.fontSize = '18px';
        messageElement.style.zIndex = '100';
        
        document.body.appendChild(messageElement);
        
        // Remove after duration
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, duration);
    }
    
    createCameraControls() {
        // Create camera controls panel
        const cameraPanel = document.createElement('div');
        cameraPanel.id = 'camera-controls';
        cameraPanel.style.position = 'absolute';
        cameraPanel.style.top = '40px';
        cameraPanel.style.left = '10px';
        cameraPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        cameraPanel.style.padding = '10px';
        cameraPanel.style.borderRadius = '5px';
        cameraPanel.style.color = 'white';
        cameraPanel.style.fontSize = '12px';
        cameraPanel.style.zIndex = '100';
        cameraPanel.style.display = 'none'; // Start hidden
        
        // Create header
        const header = document.createElement('div');
        header.textContent = 'Camera Controls';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '10px';
        cameraPanel.appendChild(header);
        
        // Follow speed slider
        this.createSlider(cameraPanel, 'Follow Speed', 0.1, 0, 1, 0.05, (value) => {
            if (window.game && window.game.gameEngine) {
                window.game.gameEngine.setCameraFollowSpeed(parseFloat(value));
            }
        });
        
        // Edge threshold slider
        this.createSlider(cameraPanel, 'Edge Threshold', 0.3, 0.1, 0.49, 0.01, (value) => {
            if (window.game && window.game.gameEngine) {
                window.game.gameEngine.setCameraEdgeThreshold(parseFloat(value));
            }
        });
        
        // Reset camera button
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset Camera';
        resetButton.style.display = 'block';
        resetButton.style.width = '100%';
        resetButton.style.padding = '5px';
        resetButton.style.margin = '10px 0 5px';
        resetButton.style.backgroundColor = '#2196F3';
        resetButton.style.border = 'none';
        resetButton.style.borderRadius = '3px';
        resetButton.style.color = 'white';
        resetButton.style.cursor = 'pointer';
        
        resetButton.onclick = () => {
            if (window.game && window.game.gameEngine) {
                window.game.gameEngine.resetCamera();
            }
        };
        
        cameraPanel.appendChild(resetButton);
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Camera Settings';
        toggleButton.style.position = 'absolute';
        toggleButton.style.top = '10px';
        toggleButton.style.left = '10px';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.backgroundColor = '#2196F3';
        toggleButton.style.color = 'white';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.zIndex = '100';
        
        toggleButton.onclick = () => {
            const panel = document.getElementById('camera-controls');
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
            } else {
                panel.style.display = 'none';
            }
        };
        
        document.body.appendChild(cameraPanel);
        document.body.appendChild(toggleButton);
    }
    
    createSlider(parent, label, defaultValue, min, max, step, onChange) {
        const container = document.createElement('div');
        container.style.marginBottom = '5px';
        
        const labelElement = document.createElement('div');
        labelElement.textContent = label;
        container.appendChild(labelElement);
        
        const sliderContainer = document.createElement('div');
        sliderContainer.style.display = 'flex';
        sliderContainer.style.alignItems = 'center';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = defaultValue;
        slider.style.flex = '1';
        slider.style.margin = '0 10px 0 0';
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = defaultValue;
        valueDisplay.style.minWidth = '30px';
        
        slider.oninput = function() {
            valueDisplay.textContent = this.value;
            onChange(this.value);
        };
        
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        container.appendChild(sliderContainer);
        
        parent.appendChild(container);
        
        return slider;
    }
}