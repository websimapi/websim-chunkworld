import { GameEngine } from 'game-engine';
import { ChunkSystem } from 'chunk-system';
import { Player } from 'player';
import { InputHandler } from 'input-handler';
import { NetworkManager } from 'networking';
import { UI } from 'ui';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        this.ui = new UI();
        this.networkManager = new NetworkManager();
        this.chunkSystem = new ChunkSystem(this.networkManager);
        this.player = new Player();
        this.gameEngine = new GameEngine(this.canvas, this.ctx, this.chunkSystem, this.player, this.networkManager, this.ui);
        
        // Create input handler but defer initialization
        this.inputHandler = new InputHandler(this.player, this.gameEngine);
        
        window.addEventListener('resize', () => this.resize());
        
        // Make game instance globally accessible
        window.game = this;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize network and systems first
            await this.networkManager.initialize();
            await this.chunkSystem.initialize();
            
            // Explicitly trigger a chunk update to ensure chunks load
            await this.chunkSystem.update(this.player.x, this.player.y);
            console.log('Initial chunk update completed');
            
            this.player.initialize(this.networkManager);
            this.ui.initialize(this.networkManager);
            
            // Initialize input handler after game engine is ready
            this.inputHandler.initialize();
            
            // Start the game engine last
            this.gameEngine.start();
            console.log('Game initialized successfully!');
            
            // Show welcome message
            this.gameEngine.ui.showMessage('Welcome to ChunkWorld Kingdom!', 3000);
            
            // Show camera info message after a short delay
            setTimeout(() => {
                this.gameEngine.ui.showMessage('The camera will follow you as you explore. Adjust settings with the Camera Settings button.', 5000);
            }, 4000);
            
            // Schedule a second chunk update after a short delay
            setTimeout(async () => {
                await this.chunkSystem.update(this.player.x, this.player.y);
                console.log('Follow-up chunk update completed');
            }, 1000);
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Update rendering if game is already running
        if (this.gameEngine) {
            this.gameEngine.handleResize();
        }
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});