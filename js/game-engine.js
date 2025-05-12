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
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
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
    }

    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set up camera centered on player
        const cameraX = this.canvas.width / 2 - this.player.x;
        const cameraY = this.canvas.height / 2 - this.player.y;

        // Render visible chunks
        this.chunkSystem.getVisibleChunks().forEach(chunk => {
            this.isometricRenderer.renderChunk(chunk, cameraX, cameraY);
        });

        // Render player
        this.isometricRenderer.renderPlayer(this.player, cameraX, cameraY);

        // Render other players
        this.networkManager.getOtherPlayers().forEach(otherPlayer => {
            this.isometricRenderer.renderPlayer(otherPlayer, cameraX, cameraY);
        });
    }

    handleResize() {
        // Update any size-dependent calculations
        if (this.isometricRenderer) {
            this.isometricRenderer.updateDimensions(this.canvas.width, this.canvas.height);
        }
    }
}