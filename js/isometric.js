export class IsometricRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileWidth = 64;  // Width of a tile in pixels
        this.tileHeight = 32; // Height of a tile in pixels
        this.tileDepth = 16;  // Depth/height of a tile in pixels (for 3D effect)
        
        // Define tile colors
        this.tileColors = {
            grass: '#4CAF50',
            dirt: '#795548',
            stone: '#9E9E9E',
            water: '#2196F3',
            sand: '#FFC107'
        };
        
        this.canvasWidth = ctx.canvas.width;
        this.canvasHeight = ctx.canvas.height;
    }
    
    updateDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }
    
    // Convert 2D coordinates to isometric
    cartesianToIsometric(x, y) {
        return {
            x: (x - y) * this.tileWidth / 2,
            y: (x + y) * this.tileHeight / 2
        };
    }
    
    // Convert isometric coordinates to 2D
    isometricToCartesian(x, y) {
        const tileWidthHalf = this.tileWidth / 2;
        const tileHeightHalf = this.tileHeight / 2;
        
        return {
            x: (x / tileWidthHalf + y / tileHeightHalf) / 2,
            y: (y / tileHeightHalf - x / tileWidthHalf) / 2
        };
    }
    
    renderTile(type, x, y, height, cameraX, cameraY) {
        const iso = this.cartesianToIsometric(x, y);
        const screenX = iso.x + cameraX;
        const screenY = iso.y + cameraY - height * this.tileDepth;
        
        // Don't render if outside the visible area (with some margin)
        if (screenX < -this.tileWidth * 2 || 
            screenX > this.canvasWidth + this.tileWidth * 2 || 
            screenY < -this.tileHeight * 2 - this.tileDepth * height || 
            screenY > this.canvasHeight + this.tileHeight * 2) {
            return;
        }
        
        const color = this.tileColors[type] || '#FF00FF'; // Default to magenta for unknown types
        
        // Draw top face
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2);
        this.ctx.lineTo(screenX, screenY + this.tileHeight);
        this.ctx.lineTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw left face if tile has height
        if (height > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2);
            this.ctx.lineTo(screenX, screenY + this.tileHeight);
            this.ctx.lineTo(screenX, screenY + this.tileHeight + height * this.tileDepth);
            this.ctx.lineTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2 + height * this.tileDepth);
            this.ctx.closePath();
            this.ctx.fillStyle = this.darkenColor(color, 0.7);
            this.ctx.fill();
            this.ctx.stroke();
        }
        
        // Draw right face if tile has height
        if (height > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, screenY + this.tileHeight);
            this.ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2);
            this.ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2 + height * this.tileDepth);
            this.ctx.lineTo(screenX, screenY + this.tileHeight + height * this.tileDepth);
            this.ctx.closePath();
            this.ctx.fillStyle = this.darkenColor(color, 0.85);
            this.ctx.fill();
            this.ctx.stroke();
        }
        
        // Debug: Draw tile coordinates
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#FFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${x},${y}`, screenX, screenY + this.tileHeight / 2);
    }
    
    renderChunk(chunk, cameraX, cameraY) {
        const chunkOffsetX = chunk.x * chunk.size;
        const chunkOffsetY = chunk.y * chunk.size;
        
        // Render tiles back-to-front for proper isometric ordering
        for (let y = 0; y < chunk.size; y++) {
            for (let x = 0; x < chunk.size; x++) {
                const tileX = chunkOffsetX + x;
                const tileY = chunkOffsetY + y;
                const tileData = chunk.getTile(x, y);
                this.renderTile(tileData.type, tileX, tileY, tileData.height, cameraX, cameraY);
            }
        }
    }
    
    renderPlayer(player, cameraX, cameraY) {
        const iso = this.cartesianToIsometric(player.x, player.y);
        const screenX = iso.x + cameraX;
        const screenY = iso.y + cameraY;
        
        // Draw player shadow
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, screenY + 10, 20, 10, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fill();
        
        // Draw player body
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, screenY - 15, 15, 15, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = player.color || '#FF5722';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw player name
        if (player.username) {
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = '#FFF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.username, screenX, screenY - 35);
        }
        
        // Draw movement path indicator if the player is moving
        if (player.movePath && player.movePath.length > 0 && player === window.game?.player) {
            this.renderMovementPath(player, cameraX, cameraY);
        }
    }
    
    renderMovementPath(player, cameraX, cameraY) {
        // Draw the remaining path
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        
        // Start from current position
        const startIso = this.cartesianToIsometric(player.x, player.y);
        this.ctx.moveTo(startIso.x + cameraX, startIso.y + cameraY);
        
        // If player is moving between tiles, draw line to next tile
        if (player.isMoving) {
            const nextIso = this.cartesianToIsometric(player.nextTileX, player.nextTileY);
            this.ctx.lineTo(nextIso.x + cameraX, nextIso.y + cameraY);
        }
        
        // Draw lines to all future path points
        player.movePath.forEach(point => {
            const iso = this.cartesianToIsometric(point.x, point.y);
            this.ctx.lineTo(iso.x + cameraX, iso.y + cameraY);
        });
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // Helper function to darken a color for side faces
    darkenColor(color, factor) {
        // Convert hex to RGB, darken, then convert back to hex
        const hex = color.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        r = Math.floor(r * factor);
        g = Math.floor(g * factor);
        b = Math.floor(b * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
}