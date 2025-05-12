export class InputHandler {
    constructor(player, gameEngine) {
        this.player = player;
        this.gameEngine = gameEngine;
        this.keys = {};
        this.clickTarget = null;
        this.tileSize = 1; // One unit in world coordinates
        this.initialized = false;
    }
    
    initialize() {
        if (this.initialized) return;
        
        // Initialize input handlers
        this.initMouseEvents();
        this.initialized = true;
        console.log('Input handler initialized');
    }
    
    initMouseEvents() {
        // Add mouse event listeners
        this.gameEngine.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.gameEngine.canvas.style.cursor = 'pointer'; // Change cursor to indicate clickable
    }
    
    handleClick(e) {
        // Get click coordinates relative to canvas
        const rect = this.gameEngine.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        const worldPos = this.screenToWorld(clickX, clickY);
        
        // Round to nearest tile
        const tileX = Math.round(worldPos.x);
        const tileY = Math.round(worldPos.y);
        
        console.log(`Click at screen (${clickX}, ${clickY}) -> world (${tileX}, ${tileY})`);
        
        // Show click indicator
        this.gameEngine.showClickAt(tileX, tileY);
        
        // Set as movement target
        this.setMovementTarget(tileX, tileY);
    }
    
    screenToWorld(screenX, screenY) {
        // Convert screen coordinates to isometric world coordinates
        const cameraX = this.gameEngine.canvas.width / 2 - this.player.x * this.gameEngine.isometricRenderer.tileWidth / 2;
        const cameraY = this.gameEngine.canvas.height / 2 - this.player.y * this.gameEngine.isometricRenderer.tileHeight / 2;
        
        // Adjust screen coordinates to be relative to camera position
        const adjustedX = screenX - cameraX;
        const adjustedY = screenY - cameraY;
        
        // Use the isometric renderer to convert to world coordinates
        return this.gameEngine.isometricRenderer.isometricToCartesian(adjustedX, adjustedY);
    }
    
    setMovementTarget(x, y) {
        // Set the target for the player to move to
        this.player.setMovementTarget(x, y);
        
        // Visual feedback for click
        this.gameEngine.ui.showMessage(`Moving to (${x}, ${y})`, 1000);
    }
}