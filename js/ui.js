export class UI {
    constructor() {
        this.playerInfoElement = document.getElementById('player-info');
        this.playerNameElement = document.getElementById('player-name');
        this.playerPositionElement = document.getElementById('player-position');
        this.playersListElement = document.getElementById('players-list');
        
        this.networkManager = null;
    }
    
    initialize(networkManager) {
        this.networkManager = networkManager;
        
        // Initialize player name display
        const username = this.networkManager.getUsername();
        this.playerNameElement.textContent = `Player: ${username}`;
        
        // Setup instructions
        this.createInstructions();
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
        instructions.innerHTML = `
            <h3 style="margin-bottom: 5px;">Controls:</h3>
            <p>WASD or Arrow Keys: Move</p>
            <p>On mobile: Virtual joystick</p>
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
    
    update(player, chunkSystem) {
        // Update player position display
        const chunkX = Math.floor(player.x / chunkSystem.chunkSize);
        const chunkY = Math.floor(player.y / chunkSystem.chunkSize);
        const tileX = Math.floor(player.x) % chunkSystem.chunkSize;
        const tileY = Math.floor(player.y) % chunkSystem.chunkSize;
        
        this.playerPositionElement.textContent = `Position: (${Math.floor(player.x)}, ${Math.floor(player.y)}) | Chunk: (${chunkX}, ${chunkY})`;
        
        // Update players list
        this.updatePlayersList();
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
}