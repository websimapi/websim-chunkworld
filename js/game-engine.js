import { IsometricRenderer } from 'isometric';

export class GameEngine {
    constructor(canvas, ctx, chunkSystem, player, networkManager, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.chunkSystem = chunkSystem;
        this.player = player;
        this.networkManager = networkManager;
        this.ui = ui;
        this.isRunning = false;
        this.lastTime = 0;
        this.isometricRenderer = new IsometricRenderer(ctx);

        // Create click indicator
        this.createClickIndicator();

        // Debug settings
        this.debugMode = false;
    }

    createClickIndicator() {
        this.clickIndicator = {
            active: false,
            x: 0,
            y: 0,
            alpha: 1.0,
            duration: 1.0, // seconds
            currentTime: 0
        };
    }

    showClickAt(worldX, worldY) {
        this.clickIndicator.x = worldX;
        this.clickIndicator.y = worldY;
        this.clickIndicator.active = true;
        this.clickIndicator.alpha = 1.0;
        this.clickIndicator.currentTime = 0;

        // Debug log
        if (this.debugMode) {
            console.log(`Click indicator shown at (${worldX}, ${worldY})`);
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
            console.log('Game engine started');
        }
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop(timestamp) {
        // Calculate delta time in seconds
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Update game state
        this.update(deltaTime);

        // Render game
        this.render();

        // Continue the loop if the game is still running
        if (this.isRunning) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    update(deltaTime) {
        // Update player
        this.player.update(deltaTime);

        // Update chunks based on player position
        this.chunkSystem.update(this.player.x, this.player.y);

        // Update UI
        this.ui.update(this.player, this.chunkSystem);

        // Update click indicator
        if (this.clickIndicator.active) {
            this.clickIndicator.currentTime += deltaTime;
            this.clickIndicator.alpha = 1.0 - (this.clickIndicator.currentTime / this.clickIndicator.duration);

            if (this.clickIndicator.currentTime >= this.clickIndicator.duration) {
                this.clickIndicator.active = false;
            }
        }
    }

    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set up camera centered on player
        const cameraX = this.canvas.width / 2 - this.player.x * this.isometricRenderer.tileWidth / 2;
        const cameraY = this.canvas.height / 2 - this.player.y * this.isometricRenderer.tileHeight / 2;

        // Draw grid for better visibility of tiles
        this.renderGrid(cameraX, cameraY);

        // Render click indicator if active
        if (this.clickIndicator.active) {
            this.renderClickIndicator(cameraX, cameraY);
        }

        // Get visible chunks - debug log if none are loaded
        const visibleChunks = this.chunkSystem.getVisibleChunks();
        if (this.debugMode && visibleChunks.length === 0) {
            console.warn('No visible chunks to render');
        }

        // Render visible chunks
        visibleChunks.forEach(chunk => {
            this.isometricRenderer.renderChunk(chunk, cameraX, cameraY);
        });

        // Render player
        this.isometricRenderer.renderPlayer(this.player, cameraX, cameraY);

        // Render other players
        this.networkManager.getOtherPlayers().forEach(otherPlayer => {
            this.isometricRenderer.renderPlayer(otherPlayer, cameraX, cameraY);
        });

        // Debug information
        if (this.debugMode) {
            this.renderDebugInfo();
        }
    }

    renderDebugInfo() {
        const info = [
            `Player Position: (${this.player.x.toFixed(2)}, ${this.player.y.toFixed(2)})`,
            `Chunk Coordinates: (${Math.floor(this.player.x / this.chunkSystem.chunkSize)}, ${Math.floor(this.player.y / this.chunkSystem.chunkSize)})`,
            `Loaded Chunks: ${Object.keys(this.chunkSystem.chunks).length}`,
            `Camera: (${(this.canvas.width / 2 - this.player.x * this.isometricRenderer.tileWidth / 2).toFixed(0)}, ${(this.canvas.height / 2 - this.player.y * this.isometricRenderer.tileHeight / 2).toFixed(0)})`
        ];

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height - 100, 350, 90);

        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = 'white';
        info.forEach((text, index) => {
            this.ctx.fillText(text, 20, this.canvas.height - 80 + index * 20);
        });
    }

    renderGrid(cameraX, cameraY) {
        const gridSize = 20; // Number of grid cells to render
        const playerTileX = Math.floor(this.player.x);
        const playerTileY = Math.floor(this.player.y);

        // Set grid line style
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;

        // Render grid lines centered around player
        for (let x = playerTileX - gridSize/2; x <= playerTileX + gridSize/2; x++) {
            for (let y = playerTileY - gridSize/2; y <= playerTileY + gridSize/2; y++) {
                const iso = this.isometricRenderer.cartesianToIsometric(x, y);
                const screenX = iso.x + cameraX;
                const screenY = iso.y + cameraY;

                // Draw tile outline
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, screenY);
                this.ctx.lineTo(screenX + this.isometricRenderer.tileWidth / 2, screenY + this.isometricRenderer.tileHeight / 2);
                this.ctx.lineTo(screenX, screenY + this.isometricRenderer.tileHeight);
                this.ctx.lineTo(screenX - this.isometricRenderer.tileWidth / 2, screenY + this.isometricRenderer.tileHeight / 2);
                this.ctx.closePath();
                this.ctx.stroke();
            }
        }
    }

    renderClickIndicator(cameraX, cameraY) {
        const iso = this.isometricRenderer.cartesianToIsometric(this.clickIndicator.x, this.clickIndicator.y);
        const screenX = iso.x + cameraX;
        const screenY = iso.y + cameraY;

        // Draw pulsating circle
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY + this.isometricRenderer.tileHeight / 2, 
                   20 * (1 - this.clickIndicator.alpha * 0.5), 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.clickIndicator.alpha})`;
        this.ctx.fill();

        // Draw tile highlight
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(screenX + this.isometricRenderer.tileWidth / 2, screenY + this.isometricRenderer.tileHeight / 2);
        this.ctx.lineTo(screenX, screenY + this.isometricRenderer.tileHeight);
        this.ctx.lineTo(screenX - this.isometricRenderer.tileWidth / 2, screenY + this.isometricRenderer.tileHeight / 2);
        this.ctx.closePath();
        this.ctx.fillStyle = `rgba(255, 255, 100, ${this.clickIndicator.alpha * 0.3})`;
        this.ctx.fill();
        this.ctx.strokeStyle = `rgba(255, 255, 100, ${this.clickIndicator.alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    handleResize() {
        // Update any size-dependent calculations
        if (this.isometricRenderer) {
            this.isometricRenderer.updateDimensions(this.canvas.width, this.canvas.height);
        }
    }

    // Toggle debug mode on/off
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
    }
}