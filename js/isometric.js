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
            sand: '#FFC107',
            castle_wall: '#7E7E7E',       // Gray stone
            castle_floor: '#A8A8A8',      // Light gray floor
            castle_tower: '#555555',      // Dark gray tower
            road: '#8B7355',              // Brown road
            house: '#CD5C5C',             // Red house
            farm: '#DAA520',              // Golden farm
            tree: '#228B22',              // Forest green
            market: '#FFD700',            // Gold market
            bridge: '#8B4513',            // Brown bridge
            garden: '#32CD32'             // Lime green garden
        };

        // Load tile textures (if we want to add them later)
        this.textures = {};

        this.canvasWidth = ctx.canvas.width;
        this.canvasHeight = ctx.canvas.height;

        // Flag to toggle coordinate display
        this.showCoordinates = false;
    }

    updateDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    // Toggle coordinate display
    toggleCoordinates() {
        this.showCoordinates = !this.showCoordinates;
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
        // Formula to convert from isometric screen coordinates to cartesian world coordinates
        const cartX = (2 * y + x) / this.tileWidth;
        const cartY = (2 * y - x) / this.tileWidth;

        return {
            x: cartX,
            y: cartY
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

        // Draw special details based on tile type
        const drawSpecialDetails = () => {
            switch(type) {
                case 'tree':
                    this.drawTree(screenX, screenY, height);
                    break;
                case 'house':
                    this.drawHouse(screenX, screenY, height);
                    break;
                case 'castle_tower':
                    this.drawTower(screenX, screenY, height);
                    break;
                case 'water':
                    this.drawWater(screenX, screenY, height);
                    break;
                case 'farm':
                    this.drawFarm(screenX, screenY, height);
                    break;
                case 'market':
                    this.drawMarket(screenX, screenY, height);
                    break;
                case 'garden':
                    this.drawGarden(screenX, screenY, height);
                    break;
            }
        };

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

        // Add special tile details
        drawSpecialDetails();

        // Debug: Draw tile coordinates
        if (this.showCoordinates) {
            this.ctx.font = '10px Arial';
            this.ctx.fillStyle = '#FFF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${x},${y}`, screenX, screenY + this.tileHeight / 2);
        }
    }

    // Special drawing methods for tile details
    drawTree(x, y, height) {
        // Tree trunk
        this.ctx.beginPath();
        this.ctx.rect(x - 2, y - 10 - height * this.tileDepth, 4, 10);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();

        // Tree leaves
        this.ctx.beginPath();
        this.ctx.arc(x, y - 20 - height * this.tileDepth, 12, 0, Math.PI * 2);
        this.ctx.fillStyle = '#006400';
        this.ctx.fill();
    }

    drawHouse(x, y, height) {
        // Draw a simple house with a roof
        const roofHeight = 10;

        // Draw the roof
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - height * this.tileDepth - roofHeight);
        this.ctx.lineTo(x + 15, y - height * this.tileDepth);
        this.ctx.lineTo(x - 15, y - height * this.tileDepth);
        this.ctx.closePath();
        this.ctx.fillStyle = '#8B0000'; // Dark red roof
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();

        // Draw a window
        this.ctx.beginPath();
        this.ctx.rect(x - 7, y - height * this.tileDepth/2 - 3, 5, 5);
        this.ctx.fillStyle = '#ADD8E6'; // Light blue window
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();

        // Draw a door
        this.ctx.beginPath();
        this.ctx.rect(x + 4, y - 8, 4, 8);
        this.ctx.fillStyle = '#8B4513'; // Brown door
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();
    }

    drawTower(x, y, height) {
        // Draw tower crenellations
        const towertop = y - height * this.tileDepth;

        // Draw crenellations
        for (let i = -15; i <= 15; i += 10) {
            this.ctx.beginPath();
            this.ctx.rect(x + i - 3, towertop - 5, 6, 5);
            this.ctx.fillStyle = '#444';
            this.ctx.fill();
            this.ctx.strokeStyle = '#000';
            this.ctx.stroke();
        }

        // Add a window
        this.ctx.beginPath();
        this.ctx.rect(x - 5, towertop + 5, 10, 10);
        this.ctx.fillStyle = '#333';
        this.ctx.fill();
    }

    drawWater(x, y, height) {
        // Draw some wave ripples
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;

        // Draw animated-looking ripples
        const time = Date.now() / 1000;
        const wave1 = Math.sin(time * 2) * 3;
        const wave2 = Math.cos(time * 3) * 2;

        this.ctx.beginPath();
        this.ctx.moveTo(x - 20, y + wave1);
        this.ctx.bezierCurveTo(x - 10, y - wave2, x + 10, y + wave1, x + 20, y - wave2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x - 15, y + 5 + wave2);
        this.ctx.bezierCurveTo(x - 5, y + 5 - wave1, x + 5, y + 5 + wave2, x + 15, y + 5 - wave1);
        this.ctx.stroke();
    }

    drawFarm(x, y, height) {
        // Draw crop rows
        this.ctx.strokeStyle = '#5D4037';
        this.ctx.lineWidth = 1;

        for (let i = -15; i <= 15; i += 6) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + i, y - 10);
            this.ctx.lineTo(x + i, y + 10);
            this.ctx.stroke();
        }

        // Draw some crops
        for (let i = -12; i <= 12; i += 6) {
            for (let j = -9; j <= 9; j += 6) {
                this.ctx.beginPath();
                this.ctx.arc(x + i, y + j, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = '#7CB342';
                this.ctx.fill();
            }
        }
    }

    drawMarket(x, y, height) {
        // Draw market stalls

        // Draw a central post
        this.ctx.beginPath();
        this.ctx.rect(x - 2, y - 15, 4, 15);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();

        // Draw a canopy
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 15);
        this.ctx.lineTo(x - 15, y - 10);
        this.ctx.lineTo(x + 15, y - 10);
        this.ctx.closePath();
        this.ctx.fillStyle = '#F57F17';
        this.ctx.fill();
        this.ctx.strokeStyle = '#5D4037';
        this.ctx.stroke();

        // Draw some market goods
        for (let i = -10; i <= 10; i += 10) {
            this.ctx.beginPath();
            this.ctx.arc(x + i, y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = i < 0 ? '#F44336' : '#4CAF50';
            this.ctx.fill();
        }
    }

    drawGarden(x, y, height) {
        // Draw some flowers and bushes
        const colors = ['#F44336', '#9C27B0', '#FFEB3B', '#FF9800'];

        for (let i = 0; i < 6; i++) {
            const angle = Math.PI * 2 * i / 6;
            const px = x + Math.cos(angle) * 10;
            const py = y + Math.sin(angle) * 10;

            this.ctx.beginPath();
            this.ctx.arc(px, py, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = colors[i % colors.length];
            this.ctx.fill();
        }

        // Central bush
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#388E3C';
        this.ctx.fill();
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