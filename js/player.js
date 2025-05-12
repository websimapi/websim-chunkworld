export class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.speed = 150; // Units per second
        this.direction = { x: 0, y: 0 };
        this.username = '';
        this.color = '#FF5722'; // Default color
        this.networkManager = null;
        this.clientId = null;
    }
    
    initialize(networkManager) {
        this.networkManager = networkManager;
        this.clientId = this.networkManager.getClientId();
        this.username = this.networkManager.getUsername();
        
        // Set a player color based on username (simple hash)
        this.color = this.getColorFromUsername(this.username);
        
        // Update initial position to network
        this.updateNetworkPosition();
    }
    
    update(deltaTime) {
        // Update position based on direction and speed
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            // Normalize diagonal movement
            const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
            const normalizedX = this.direction.x / length;
            const normalizedY = this.direction.y / length;
            
            this.x += normalizedX * this.speed * deltaTime;
            this.y += normalizedY * this.speed * deltaTime;
            
            // Only update network position when actually moving
            this.updateNetworkPosition();
        }
    }
    
    setDirection(x, y) {
        this.direction.x = x;
        this.direction.y = y;
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
    
    // Apply changes from a network update (used for reconciliation if needed)
    applyNetworkUpdate(data) {
        // This could be used for server reconciliation in a more complex game
        // For this demo, we trust the client positions
    }
}