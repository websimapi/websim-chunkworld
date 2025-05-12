export class ChunkSystem {
    constructor(networkManager) {
        this.networkManager = networkManager;
        this.chunks = {}; // Map of loaded chunks: 'x,y' -> chunk
        this.chunkSize = 16; // Size of chunk in tiles
        this.loadDistance = 2; // How many chunks to load around player
        this.currentChunkX = 0;
        this.currentChunkY = 0;
        this.tileTypes = ['grass', 'dirt', 'stone', 'water', 'sand'];
    }

    async initialize() {
        console.log('Initializing chunk system...');
        // Subscribe to chunk updates from other players
        this.networkManager.subscribeToChunkUpdates(this.handleChunkUpdate.bind(this));
    }

    // Get chunk coordinates from world coordinates
    getChunkCoords(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.chunkSize),
            y: Math.floor(worldY / this.chunkSize)
        };
    }

    // Get chunk key from chunk coordinates
    getChunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    // Get the chunk at given coordinates, generating or loading as needed
    async getChunk(chunkX, chunkY) {
        const key = this.getChunkKey(chunkX, chunkY);

        if (!this.chunks[key]) {
            // Try to load from database first
            const loadedChunk = await this.loadChunkFromDB(chunkX, chunkY);

            if (loadedChunk) {
                this.chunks[key] = loadedChunk;
            } else {
                // Generate a new chunk if not found in DB
                this.chunks[key] = this.generateChunk(chunkX, chunkY);
                // Save the newly generated chunk to the database
                this.saveChunkToDB(this.chunks[key]);
            }
        }

        return this.chunks[key];
    }

    // Generate a new chunk
    generateChunk(chunkX, chunkY) {
        console.log(`Generating new chunk at ${chunkX}, ${chunkY}`);

        const chunk = {
            x: chunkX,
            y: chunkY,
            size: this.chunkSize,
            tiles: [],
            modified: false,
            lastUpdated: Date.now()
        };

        // Initialize tiles with random terrain
        for (let y = 0; y < this.chunkSize; y++) {
            chunk.tiles[y] = [];
            for (let x = 0; x < this.chunkSize; x++) {
                // Simple terrain generation, can be improved with noise functions
                const tileType = this.generateTileType(chunkX * this.chunkSize + x, chunkY * this.chunkSize + y);
                const height = this.generateTileHeight(chunkX * this.chunkSize + x, chunkY * this.chunkSize + y);

                chunk.tiles[y][x] = {
                    type: tileType,
                    height: height,
                    modified: false
                };
            }
        }

        // Add getTile method to chunk
        chunk.getTile = (x, y) => {
            if (x >= 0 && x < chunk.size && y >= 0 && y < chunk.size) {
                return chunk.tiles[y][x];
            }
            return null;
        };

        // Add setTile method to chunk
        chunk.setTile = (x, y, type, height) => {
            if (x >= 0 && x < chunk.size && y >= 0 && y < chunk.size) {
                chunk.tiles[y][x].type = type;
                chunk.tiles[y][x].height = height;
                chunk.tiles[y][x].modified = true;
                chunk.modified = true;
                chunk.lastUpdated = Date.now();
                return true;
            }
            return false;
        };

        return chunk;
    }

    // Simple terrain generation based on coordinates
    generateTileType(worldX, worldY) {
        // This is a simple terrain generation algorithm
        // In a real game, you might use noise functions for more natural-looking terrain
        const seed = worldX * 10000 + worldY;
        const rand = this.seededRandom(seed);

        if (rand < 0.6) return 'grass';
        if (rand < 0.75) return 'dirt';
        if (rand < 0.85) return 'stone';
        if (rand < 0.95) return 'sand';
        return 'water';
    }

    // Generate height for a tile
    generateTileHeight(worldX, worldY) {
        // Simple height generation
        const seed = worldX * 20000 + worldY;
        const rand = this.seededRandom(seed);

        // Most tiles are flat (height 0)
        if (rand < 0.8) return 0;
        // Some small hills
        if (rand < 0.9) return 1;
        // Occasional higher hills
        if (rand < 0.98) return 2;
        // Rare mountains
        return 3;
    }

    // Simple seeded random function
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    // Update chunks based on player position
    async update(playerX, playerY) {
        const { x: chunkX, y: chunkY } = this.getChunkCoords(playerX, playerY);

        // If player moved to a different chunk
        if (chunkX !== this.currentChunkX || chunkY !== this.currentChunkY) {
            this.currentChunkX = chunkX;
            this.currentChunkY = chunkY;

            // Load chunks around player
            await this.loadChunksAroundPlayer(chunkX, chunkY);

            // Unload distant chunks
            this.unloadDistantChunks(chunkX, chunkY);
        }

        // Save any modified chunks periodically
        this.saveModifiedChunks();
    }

    // Load chunks around player
    async loadChunksAroundPlayer(centerX, centerY) {
        const chunksToLoad = [];

        for (let y = centerY - this.loadDistance; y <= centerY + this.loadDistance; y++) {
            for (let x = centerX - this.loadDistance; x <= centerX + this.loadDistance; x++) {
                const key = this.getChunkKey(x, y);
                if (!this.chunks[key]) {
                    chunksToLoad.push({ x, y });
                }
            }
        }

        // Load chunks in parallel
        await Promise.all(chunksToLoad.map(coords => 
            this.getChunk(coords.x, coords.y)
        ));
    }

    // Unload chunks that are too far from player
    unloadDistantChunks(centerX, centerY) {
        for (const key in this.chunks) {
            const [x, y] = key.split(',').map(Number);
            const distance = Math.max(Math.abs(x - centerX), Math.abs(y - centerY));

            if (distance > this.loadDistance + 1) {
                // Save chunk before unloading if it was modified
                if (this.chunks[key].modified) {
                    this.saveChunkToDB(this.chunks[key]);
                }

                // Delete from memory
                delete this.chunks[key];
            }
        }
    }

    // Save modified chunks to database
    saveModifiedChunks() {
        for (const key in this.chunks) {
            const chunk = this.chunks[key];
            if (chunk.modified) {
                this.saveChunkToDB(chunk);
                chunk.modified = false;
            }
        }
    }

    // Get visible chunks for rendering
    getVisibleChunks() {
        return Object.values(this.chunks);
    }

    // Handle chunk updates from other players
    handleChunkUpdate(chunkData) {
        const { x, y, tiles } = chunkData;
        const key = this.getChunkKey(x, y);

        if (this.chunks[key]) {
            // Update existing chunk with new data
            for (let tileY = 0; tileY < this.chunkSize; tileY++) {
                for (let tileX = 0; tileX < this.chunkSize; tileX++) {
                    if (tiles[tileY] && tiles[tileY][tileX]) {
                        this.chunks[key].tiles[tileY][tileX] = {
                            ...this.chunks[key].tiles[tileY][tileX],
                            ...tiles[tileY][tileX]
                        };
                    }
                }
            }
            this.chunks[key].lastUpdated = Date.now();
        } else {
            // If chunk isn't loaded, we'll load it normally next time it's needed
        }
    }

    // Load chunk from database
    async loadChunkFromDB(chunkX, chunkY) {
        try {
            const chunkData = await this.networkManager.loadChunkFromDB(chunkX, chunkY);

            if (chunkData) {
                console.log(`Loaded chunk ${chunkX},${chunkY} from database`);

                // Create chunk object with methods
                const chunk = {
                    ...chunkData,
                    modified: false,
                    lastUpdated: Date.now()
                };

                // Add getTile method to chunk
                chunk.getTile = (x, y) => {
                    if (x >= 0 && x < chunk.size && y >= 0 && y < chunk.size) {
                        return chunk.tiles[y][x];
                    }
                    return null;
                };

                // Add setTile method to chunk
                chunk.setTile = (x, y, type, height) => {
                    if (x >= 0 && x < chunk.size && y >= 0 && y < chunk.size) {
                        chunk.tiles[y][x].type = type;
                        chunk.tiles[y][x].height = height;
                        chunk.tiles[y][x].modified = true;
                        chunk.modified = true;
                        chunk.lastUpdated = Date.now();
                        return true;
                    }
                    return false;
                };

                return chunk;
            }
        } catch (error) {
            console.error(`Failed to load chunk ${chunkX},${chunkY} from database:`, error);
        }

        return null;
    }

    // Save chunk to database
    async saveChunkToDB(chunk) {
        try {
            await this.networkManager.saveChunkToDB(chunk);
            console.log(`Saved chunk ${chunk.x},${chunk.y} to database`);
        } catch (error) {
            console.error(`Failed to save chunk ${chunk.x},${chunk.y} to database:`, error);
        }
    }
}