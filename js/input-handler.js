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
        // Calculate the center of the screen
        const centerX = this.gameEngine.canvas.width / 2;
        const centerY = this.gameEngine.canvas.height / 2;
        
        // Get screen offset from center
        const offsetX = screenX - centerX;
        const offsetY = screenY - centerY;
        
        // Convert screen offset to isometric world offset using the renderer
        const worldOffset = this.gameEngine.isometricRenderer.isometricToCartesian(offsetX, offsetY);
        
        // Add the offset to player's position to get the clicked world position
        return {
            x: this.player.x + worldOffset.x,
            y: this.player.y + worldOffset.y
        };
    }
    
    setMovementTarget(x, y) {
        // Set the target for the player to move to
        this.player.setMovementTarget(x, y);
        
        // Visual feedback for click
        this.gameEngine.ui.showMessage(`Moving to (${x}, ${y})`, 1000);
    }
}