export class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = null;
        this.targetY = null;
        this.movePath = [];
        this.moveSpeed = 3; // Tiles per second
        this.isMoving = false;
        this.moveProgress = 0;
        this.currentTileX = 0;
        this.currentTileY = 0;
        this.nextTileX = 0;
        this.nextTileY = 0;
        this.username = '';
        this.color = '#FF5722'; // Default color
        this.networkManager = null;
        this.clientId = null;
        this.lastStepTime = 0;
        this.stepSoundCooldown = 300; // ms
        
        // Load step sound
        this.stepSound = new Audio('assets/step.wav');
        this.stepSound.volume = 0.3;
    }
    
    initialize(networkManager) {
        this.networkManager = networkManager;
        this.clientId = this.networkManager.getClientId();
        this.username = this.networkManager.getUsername();
        
        // Set a player color based on username (simple hash)
        this.color = this.getColorFromUsername(this.username);
        
        // Set initial position to tile coordinates
        this.currentTileX = Math.round(this.x);
        this.currentTileY = Math.round(this.y);
        this.x = this.currentTileX;
        this.y = this.currentTileY;
        
        // Update initial position to network
        this.updateNetworkPosition();
    }
    
    update(deltaTime) {
        // If we have a movement path, follow it tile by tile
        if (this.isMoving) {
            // Update move progress
            this.moveProgress += deltaTime * this.moveSpeed;
            
            if (this.moveProgress >= 1) {
                // We've reached the next tile
                this.moveProgress = 0;
                this.x = this.nextTileX;
                this.y = this.nextTileY;
                this.currentTileX = this.nextTileX;
                this.currentTileY = this.nextTileY;
                this.isMoving = false;
                
                // Update network position when we reach a tile
                this.updateNetworkPosition();
                
                // Continue to next tile in path if we have one
                this.continueMovePath();
            } else {
                // Interpolate position between current and next tile
                this.x = this.currentTileX + (this.nextTileX - this.currentTileX) * this.moveProgress;
                this.y = this.currentTileY + (this.nextTileY - this.currentTileY) * this.moveProgress;
                
                // Play step sound with cooldown
                const now = Date.now();
                if (now - this.lastStepTime > this.stepSoundCooldown) {
                    this.stepSound.currentTime = 0;
                    this.stepSound.play().catch(err => console.log("Sound play error:", err));
                    this.lastStepTime = now;
                }
            }
        }
    }
    
    setMovementTarget(targetX, targetY) {
        // If we're already moving to this target, do nothing
        if (this.targetX === targetX && this.targetY === targetY && this.isMoving) {
            return;
        }
        
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Calculate path to target (simple direct path for now)
        this.calculatePath(targetX, targetY);
        
        // Start moving along the path
        this.continueMovePath();
    }
    
    calculatePath(targetX, targetY) {
        // Clear any existing path
        this.movePath = [];
        
        // Get current position in tile coordinates
        const startX = Math.round(this.x);
        const startY = Math.round(this.y);
        
        // Simple implementation: just add tiles in a straight line
        // In a more complex game, you'd use A* pathfinding
        
        // Calculate Manhattan distance
        const dx = targetX - startX;
        const dy = targetY - startY;
        
        // Create path by moving one tile at a time (horizontal first, then vertical)
        // This creates a simple L-shaped path
        
        // Add horizontal steps
        const xDir = dx > 0 ? 1 : -1;
        for (let i = 0; i < Math.abs(dx); i++) {
            this.movePath.push({
                x: startX + xDir * (i + 1),
                y: startY
            });
        }
        
        // Add vertical steps
        const yDir = dy > 0 ? 1 : -1;
        const endX = dx !== 0 ? targetX : startX;
        for (let i = 0; i < Math.abs(dy); i++) {
            this.movePath.push({
                x: endX,
                y: startY + yDir * (i + 1)
            });
        }
        
        // In a more advanced implementation, check for obstacles
        // and use proper pathfinding algorithm
    }
    
    continueMovePath() {
        // If we have more tiles in the path, move to the next one
        if (this.movePath.length > 0) {
            const nextTile = this.movePath.shift();
            this.moveToTile(nextTile.x, nextTile.y);
        }
    }
    
    moveToTile(tileX, tileY) {
        // Set up movement to next tile
        this.currentTileX = Math.round(this.x);
        this.currentTileY = Math.round(this.y);
        this.nextTileX = tileX;
        this.nextTileY = tileY;
        this.moveProgress = 0;
        this.isMoving = true;
    }
    
    stopMovement() {
        this.isMoving = false;
        this.movePath = [];
        this.targetX = null;
        this.targetY = null;
        this.moveProgress = 0;
        
        // Snap to nearest tile
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.currentTileX = this.x;
        this.currentTileY = this.y;
        
        this.updateNetworkPosition();
    }
    
    updateNetworkPosition() {
        if (this.networkManager) {
            this.networkManager.updatePlayerPosition(this.x, this.y);
        }
    }
    
    // Get a deterministic color based on username
    getColorFromUsername(username) {
        // Simple hash function to generate a color
        const hash = username.split('').reduce((acc, char) => {
            return acc + char.charCodeAt(0);
        }, 0);
        
        // List of nice colors
        const colors = [
            '#F44336', // Red
            '#E91E63', // Pink
            '#9C27B0', // Purple
            '#673AB7', // Deep Purple
            '#3F51B5', // Indigo
            '#2196F3', // Blue
            '#03A9F4', // Light Blue
            '#00BCD4', // Cyan
            '#009688', // Teal
            '#4CAF50', // Green
            '#8BC34A', // Light Green
            '#CDDC39', // Lime
            '#FFC107', // Amber
            '#FF9800', // Orange
            '#FF5722'  // Deep Orange
        ];
        
        return colors[hash % colors.length];
    }
    
    // Apply changes from a network update
    applyNetworkUpdate(data) {
        // If we receive a position update from the network and we're not moving,
        // update our position to match
        if (!this.isMoving && data.x !== undefined && data.y !== undefined) {
            this.x = data.x;
            this.y = data.y;
            this.currentTileX = Math.round(this.x);
            this.currentTileY = Math.round(this.y);
        }
    }
}