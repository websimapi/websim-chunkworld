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

        // Camera settings
        this.camera = {
            // The current position of the camera in world coordinates
            x: 0,
            y: 0,
            // Target position of the camera (player position)
            targetX: 0,
            targetY: 0,
            // How quickly the camera follows the player (0-1)
            followSpeed: 0.1,
            // The percentage of screen edge that triggers camera movement
            edgeThreshold: 0.3,
            // Free roam buffer allows the player to move within this area without moving the camera
            freeRoamBuffer: {
                width: 0,
                height: 0
            }
        };

        // Initialize camera position to player position
        this.camera.x = this.player.x;
        this.camera.y = this.player.y;
        this.camera.targetX = this.player.x;
        this.camera.targetY = this.player.y;

        // Calculate free roam buffer based on screen size
        this.updateFreeRoamBuffer();

        // Create click indicator
        this.createClickIndicator();

        // Debug settings
        this.debugMode = false;
    }

    updateFreeRoamBuffer() {
        // Calculate the free roam buffer based on screen size and edge threshold
        this.camera.freeRoamBuffer = {
            width: this.canvas.width * (1 - this.camera.edgeThreshold * 2),
            height: this.canvas.height * (1 - this.camera.edgeThreshold * 2)
        };
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

        // Update camera to follow player when needed
        this.updateCamera(deltaTime);

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

    updateCamera(deltaTime) {
        // Always set the target to the player's position
        this.camera.targetX = this.player.x;
        this.camera.targetY = this.player.y;

        // Convert player position to screen coordinates
        const playerScreenX = (this.player.x - this.camera.x) * this.isometricRenderer.tileWidth / 2;
        const playerScreenY = (this.player.y - this.camera.y) * this.isometricRenderer.tileHeight / 2;

        // Calculate center of screen
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Calculate distance from player to center
        const distanceX = Math.abs(playerScreenX - centerX);
        const distanceY = Math.abs(playerScreenY - centerY);

        // Check if player is outside free roam buffer
        const halfBufferWidth = this.camera.freeRoamBuffer.width / 2;
        const halfBufferHeight = this.camera.freeRoamBuffer.height / 2;

        // Gradually move camera if player is outside buffer
        if (distanceX > halfBufferWidth || distanceY > halfBufferHeight) {
            // Calculate how far outside the buffer the player is (0-1)
            const outsideFactorX = Math.max(0, (distanceX - halfBufferWidth) / (centerX - halfBufferWidth));
            const outsideFactorY = Math.max(0, (distanceY - halfBufferHeight) / (centerY - halfBufferHeight));

            // Adjust follow speed based on how far outside the buffer the player is
            const adjustedSpeedX = this.camera.followSpeed * outsideFactorX * 5;
            const adjustedSpeedY = this.camera.followSpeed * outsideFactorY * 5;

            // Smoothly move camera toward player
            this.camera.x += (this.camera.targetX - this.camera.x) * adjustedSpeedX * deltaTime * 10;
            this.camera.y += (this.camera.targetY - this.camera.y) * adjustedSpeedY * deltaTime * 10;
        }

        // Debug info
        if (this.debugMode) {
            this.debugCameraInfo = {
                cameraPosition: { x: this.camera.x.toFixed(2), y: this.camera.y.toFixed(2) },
                playerScreenPos: { x: playerScreenX.toFixed(2), y: playerScreenY.toFixed(2) },
                distanceFromCenter: { x: distanceX.toFixed(2), y: distanceY.toFixed(2) },
                freeRoamBuffer: { w: this.camera.freeRoamBuffer.width.toFixed(0), h: this.camera.freeRoamBuffer.height.toFixed(0) }
            };
        }
    }

    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate camera offset based on camera position
        const cameraX = this.canvas.width / 2 - this.camera.x * this.isometricRenderer.tileWidth / 2;
        const cameraY = this.canvas.height / 2 - this.camera.y * this.isometricRenderer.tileHeight / 2;

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

        // If debug mode is on, draw the free roam buffer
        if (this.debugMode) {
            this.renderFreeRoamBuffer();
            this.renderDebugInfo();
        }
    }

    renderFreeRoamBuffer() {
        // Draw the free roam buffer as a rectangle
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const halfWidth = this.camera.freeRoamBuffer.width / 2;
        const halfHeight = this.camera.freeRoamBuffer.height / 2;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            centerX - halfWidth,
            centerY - halfHeight,
            this.camera.freeRoamBuffer.width,
            this.camera.freeRoamBuffer.height
        );
        this.ctx.restore();
    }

    renderDebugInfo() {
        const info = [
            `Player Position: (${this.player.x.toFixed(2)}, ${this.player.y.toFixed(2)})`,
            `Chunk Coordinates: (${Math.floor(this.player.x / this.chunkSystem.chunkSize)}, ${Math.floor(this.player.y / this.chunkSystem.chunkSize)})`,
            `Loaded Chunks: ${Object.keys(this.chunkSystem.chunks).length}`,
            `Camera Position: (${this.camera.x.toFixed(2)}, ${this.camera.y.toFixed(2)})`,
        ];

        if (this.debugCameraInfo) {
            info.push(
                `Free Roam Buffer: ${this.debugCameraInfo.freeRoamBuffer.w}x${this.debugCameraInfo.freeRoamBuffer.h}`,
                `Player Screen Pos: (${this.debugCameraInfo.playerScreenPos.x}, ${this.debugCameraInfo.playerScreenPos.y})`,
                `Distance From Center: (${this.debugCameraInfo.distanceFromCenter.x}, ${this.debugCameraInfo.distanceFromCenter.y})`
            );
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height - 180, 350, 170);

        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = 'white';
        info.forEach((text, index) => {
            this.ctx.fillText(text, 20, this.canvas.height - 160 + index * 20);
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

        // Update free roam buffer for camera
        this.updateFreeRoamBuffer();
    }

    // Toggle debug mode on/off
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
    }

    // Add camera controls
    setCameraFollowSpeed(speed) {
        if (speed >= 0 && speed <= 1) {
            this.camera.followSpeed = speed;
            console.log(`Camera follow speed set to ${speed}`);
        }
    }

    setCameraEdgeThreshold(threshold) {
        if (threshold >= 0.1 && threshold <= 0.49) {
            this.camera.edgeThreshold = threshold;
            this.updateFreeRoamBuffer();
            console.log(`Camera edge threshold set to ${threshold}`);
        }
    }

    // Reset camera to player position
    resetCamera() {
        this.camera.x = this.player.x;
        this.camera.y = this.player.y;
        console.log('Camera reset to player position');
    }
}