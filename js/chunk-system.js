export class ChunkSystem {
    constructor(networkManager) {
        this.networkManager = networkManager;
        this.chunks = {}; // Map of loaded chunks: 'x,y' -> chunk
        this.chunkSize = 16; // Size of chunk in tiles
        this.loadDistance = 2; // How many chunks to load around player

        // Kingdom configuration
        this.kingdomCenter = { x: 0, y: 0 }; // Center of the kingdom (in chunk coordinates)
        this.kingdomRadius = 5; // Kingdom radius in chunks

        // Define tile types for the kingdom
        this.tileTypes = {
            GRASS: 'grass',
            STONE: 'stone',
            DIRT: 'dirt',
            WATER: 'water',
            SAND: 'sand',
            CASTLE_WALL: 'castle_wall',
            CASTLE_FLOOR: 'castle_floor',
            CASTLE_TOWER: 'castle_tower',
            ROAD: 'road',
            HOUSE: 'house',
            FARM: 'farm',
            TREE: 'tree',
            MARKET: 'market',
            BRIDGE: 'bridge',
            GARDEN: 'garden'
        };

        this.currentChunkX = 0;
        this.currentChunkY = 0;
    }

    async initialize() {
        console.log('Initializing kingdom chunk system...');
        // Subscribe to chunk updates from other players
        this.networkManager.subscribeToChunkUpdates(this.handleChunkUpdate.bind(this));

        // Add additional colors to the isometric renderer
        this.extendIsometricRendererColors();

        // Manually load chunks around start position to ensure the world loads
        console.log('Pre-loading initial chunks...');
        await this.loadChunksAroundPlayer(0, 0);
    }

    extendIsometricRendererColors() {
        // Wait for the game to be initialized and then extend the colors
        setTimeout(() => {
            if (window.game && window.game.gameEngine.isometricRenderer) {
                const renderer = window.game.gameEngine.isometricRenderer;

                // Add kingdom-specific colors to the renderer
                renderer.tileColors = {
                    ...renderer.tileColors,
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

                console.log('Extended isometric renderer with kingdom colors');
            }
        }, 1000); // Wait a second for the game to initialize
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

    // Generate a new chunk based on its position in the kingdom
    generateChunk(chunkX, chunkY) {
        console.log(`Generating new kingdom chunk at ${chunkX}, ${chunkY}`);

        const chunk = {
            x: chunkX,
            y: chunkY,
            size: this.chunkSize,
            tiles: [],
            modified: false,
            lastUpdated: Date.now()
        };

        // Determine what type of region this chunk is in the kingdom
        const regionType = this.determineRegionType(chunkX, chunkY);

        // Generate appropriate terrain based on region type
        this.generateTerrain(chunk, regionType, chunkX, chunkY);

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

    // Determine what region of the kingdom a chunk belongs to
    determineRegionType(chunkX, chunkY) {
        // Calculate distance from kingdom center (in chunk coordinates)
        const dx = chunkX - this.kingdomCenter.x;
        const dy = chunkY - this.kingdomCenter.y;
        const distanceSquared = dx * dx + dy * dy;

        // Center chunk is the castle
        if (chunkX === this.kingdomCenter.x && chunkY === this.kingdomCenter.y) {
            return 'CASTLE';
        }

        // Chunks adjacent to castle are castle grounds
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
            return 'CASTLE_GROUNDS';
        }

        // Ring around castle is town
        if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
            return 'TOWN';
        }

        // Beyond town but within kingdom is farmland
        if (distanceSquared <= this.kingdomRadius * this.kingdomRadius) {
            return 'FARMLAND';
        }

        // Outside kingdom border is wilderness
        return 'WILDERNESS';
    }

    // Generate terrain based on region type
    generateTerrain(chunk, regionType, chunkX, chunkY) {
        // Create empty tiles array
        for (let y = 0; y < chunk.size; y++) {
            chunk.tiles[y] = [];
            for (let x = 0; x < chunk.size; x++) {
                // Default to grass
                chunk.tiles[y][x] = {
                    type: this.tileTypes.GRASS,
                    height: 0,
                    modified: false
                };
            }
        }

        // Call appropriate terrain generator based on region type
        switch (regionType) {
            case 'CASTLE':
                this.generateCastle(chunk);
                break;
            case 'CASTLE_GROUNDS':
                this.generateCastleGrounds(chunk, chunkX, chunkY);
                break;
            case 'TOWN':
                this.generateTown(chunk, chunkX, chunkY);
                break;
            case 'FARMLAND':
                this.generateFarmland(chunk, chunkX, chunkY);
                break;
            case 'WILDERNESS':
                this.generateWilderness(chunk, chunkX, chunkY);
                break;
        }
    }

    // Generate castle in the center chunk
    generateCastle(chunk) {
        // Castle walls
        for (let y = 0; y < chunk.size; y++) {
            for (let x = 0; x < chunk.size; x++) {
                // Castle floor inside
                chunk.tiles[y][x].type = this.tileTypes.CASTLE_FLOOR;
                chunk.tiles[y][x].height = 1;

                // Castle walls around the perimeter
                if (x === 0 || x === chunk.size - 1 || y === 0 || y === chunk.size - 1) {
                    chunk.tiles[y][x].type = this.tileTypes.CASTLE_WALL;
                    chunk.tiles[y][x].height = 2;
                }

                // Castle towers at corners
                if ((x === 0 || x === chunk.size - 1) && (y === 0 || y === chunk.size - 1)) {
                    chunk.tiles[y][x].type = this.tileTypes.CASTLE_TOWER;
                    chunk.tiles[y][x].height = 3;
                }
            }
        }

        // Create castle entrance (gate) at the bottom
        const gateX = Math.floor(chunk.size / 2);
        const gateY = chunk.size - 1;
        chunk.tiles[gateY][gateX].type = this.tileTypes.ROAD;
        chunk.tiles[gateY][gateX].height = 1;

        // Create some interior castle features
        this.createCastleInterior(chunk);
    }

    // Create interior features in the castle
    createCastleInterior(chunk) {
        const center = Math.floor(chunk.size / 2);

        // Main keep or throne room in the center
        for (let y = center - 2; y <= center + 2; y++) {
            for (let x = center - 2; x <= center + 2; x++) {
                if (x >= 0 && x < chunk.size && y >= 0 && y < chunk.size) {
                    if ((x === center - 2 || x === center + 2) || (y === center - 2 || y === center + 2)) {
                        // Keep walls
                        chunk.tiles[y][x].type = this.tileTypes.STONE;
                        chunk.tiles[y][x].height = 2;
                    } else {
                        // Keep floor
                        chunk.tiles[y][x].type = this.tileTypes.CASTLE_FLOOR;
                        chunk.tiles[y][x].height = 1;
                    }
                }
            }
        }

        // Create garden in one corner
        for (let y = 2; y < 6; y++) {
            for (let x = 2; x < 6; x++) {
                chunk.tiles[y][x].type = this.tileTypes.GARDEN;
                chunk.tiles[y][x].height = 1;
            }
        }

        // Create training grounds in another corner
        for (let y = 2; y < 6; y++) {
            for (let x = chunk.size - 6; x < chunk.size - 2; x++) {
                chunk.tiles[y][x].type = this.tileTypes.DIRT;
                chunk.tiles[y][x].height = 1;
            }
        }
    }

    // Generate castle grounds (areas immediately adjacent to the castle)
    generateCastleGrounds(chunk, chunkX, chunkY) {
        // First, create a base of stone roads and grass
        for (let y = 0; y < chunk.size; y++) {
            for (let x = 0; x < chunk.size; x++) {
                // Mostly grass
                chunk.tiles[y][x].type = this.tileTypes.GRASS;
                chunk.tiles[y][x].height = 0;
            }
        }

        // Determine direction from castle center
        const dx = chunkX - this.kingdomCenter.x;
        const dy = chunkY - this.kingdomCenter.y;

        // Create a road connecting to the castle
        this.createRoadToCastle(chunk, dx, dy);

        // Add some decorative elements and guard towers
        this.addCastleGroundsFeatures(chunk, dx, dy);
    }

    // Create a road leading to the castle
    createRoadToCastle(chunk, dx, dy) {
        // Create a main road leading to the castle gate
        const roadWidth = 3;

        if (dx === 0 && dy === 1) { // South of castle
            // Main road from bottom to top
            const centerX = Math.floor(chunk.size / 2);
            for (let y = 0; y < chunk.size; y++) {
                for (let x = centerX - 1; x <= centerX + 1; x++) {
                    chunk.tiles[y][x].type = this.tileTypes.ROAD;
                }
            }
        } else {
            // Create connecting roads based on direction
            if (dx === 0) { // North or South
                const centerX = Math.floor(chunk.size / 2);
                for (let x = centerX - 1; x <= centerX + 1; x++) {
                    const yRange = dy < 0 ? [0, Math.floor(chunk.size / 2)] : [Math.floor(chunk.size / 2), chunk.size - 1];
                    for (let y = yRange[0]; y <= yRange[1]; y++) {
                        chunk.tiles[y][x].type = this.tileTypes.ROAD;
                    }
                }
            }

            if (dy === 0) { // East or West
                const centerY = Math.floor(chunk.size / 2);
                for (let y = centerY - 1; y <= centerY + 1; y++) {
                    const xRange = dx < 0 ? [0, Math.floor(chunk.size / 2)] : [Math.floor(chunk.size / 2), chunk.size - 1];
                    for (let x = xRange[0]; x <= xRange[1]; x++) {
                        chunk.tiles[y][x].type = this.tileTypes.ROAD;
                    }
                }
            }

            // Diagonal connections
            if (dx !== 0 && dy !== 0) {
                const startX = dx < 0 ? 0 : Math.floor(chunk.size / 2);
                const endX = dx < 0 ? Math.floor(chunk.size / 2) : chunk.size - 1;
                const startY = dy < 0 ? 0 : Math.floor(chunk.size / 2);
                const endY = dy < 0 ? Math.floor(chunk.size / 2) : chunk.size - 1;

                // Create diagonal road
                const xStep = (endX - startX) / (endY - startY);
                for (let y = startY; y <= endY; y++) {
                    const x = Math.floor(startX + xStep * (y - startY));
                    for (let rx = Math.max(0, x - 1); rx <= Math.min(chunk.size - 1, x + 1); rx++) {
                        chunk.tiles[y][rx].type = this.tileTypes.ROAD;
                    }
                }
            }
        }
    }

    // Add features to castle grounds
    addCastleGroundsFeatures(chunk, dx, dy) {
        const rand = this.seededRandom((chunk.x * 10000) + chunk.y);

        // Add a guard tower
        let towerX, towerY;

        // Position the tower based on direction from castle
        if (dx < 0) { // West
            towerX = chunk.size - 4;
        } else { // East
            towerX = 3;
        }

        if (dy < 0) { // North
            towerY = chunk.size - 4;
        } else { // South
            towerY = 3;
        }

        // Create a small guard tower
        for (let y = towerY - 1; y <= towerY + 1; y++) {
            for (let x = towerX - 1; x <= towerX + 1; x++) {
                if (x >= 0 && x < chunk.size && y >= 0 && y < chunk.size) {
                    if (x === towerX && y === towerY) {
                        chunk.tiles[y][x].type = this.tileTypes.CASTLE_TOWER;
                        chunk.tiles[y][x].height = 2;
                    } else {
                        chunk.tiles[y][x].type = this.tileTypes.STONE;
                        chunk.tiles[y][x].height = 1;
                    }
                }
            }
        }

        // Add some decorative trees
        for (let i = 0; i < 15; i++) {
            const x = Math.floor(this.seededRandom((chunk.x * 10000) + chunk.y + i * 50) * chunk.size);
            const y = Math.floor(this.seededRandom((chunk.x * 20000) + chunk.y + i * 50) * chunk.size);

            // Don't place trees on roads or too close to the tower
            if (chunk.tiles[y][x].type === this.tileTypes.GRASS && 
                Math.abs(x - towerX) > 3 && Math.abs(y - towerY) > 3) {
                chunk.tiles[y][x].type = this.tileTypes.TREE;
                chunk.tiles[y][x].height = 1;
            }
        }
    }

    // Generate town surrounding the castle
    generateTown(chunk, chunkX, chunkY) {
        // Create base terrain
        for (let y = 0; y < chunk.size; y++) {
            for (let x = 0; x < chunk.size; x++) {
                chunk.tiles[y][x].type = this.tileTypes.GRASS;
                chunk.tiles[y][x].height = 0;
            }
        }

        // Create town roads in a grid pattern
        this.createTownRoads(chunk);

        // Add houses and buildings along the roads
        this.addTownBuildings(chunk, chunkX, chunkY);
    }

    // Create roads in town chunks
    createTownRoads(chunk) {
        // Create a grid of roads
        for (let i = 3; i < chunk.size; i += 6) {
            // Horizontal roads
            for (let x = 0; x < chunk.size; x++) {
                chunk.tiles[i][x].type = this.tileTypes.ROAD;
            }

            // Vertical roads
            for (let y = 0; y < chunk.size; y++) {
                chunk.tiles[y][i].type = this.tileTypes.ROAD;
            }
        }
    }

    // Add buildings to town chunks
    addTownBuildings(chunk, chunkX, chunkY) {
        // Determine if this is a special town chunk
        const isMarketChunk = chunkX === this.kingdomCenter.x + 1 && chunkY === this.kingdomCenter.y + 1;

        // Go through grid cells created by roads
        for (let blockY = 0; blockY < chunk.size; blockY += 6) {
            for (let blockX = 0; blockX < chunk.size; blockX += 6) {
                // Skip if we're at the edge of the chunk
                if (blockX + 4 >= chunk.size || blockY + 4 >= chunk.size) continue;

                // Use a seeded random to determine block type
                const blockRandom = this.seededRandom((chunk.x * 10000) + chunk.y + blockX * 100 + blockY);

                if (isMarketChunk && blockX === 6 && blockY === 6) {
                    // Create a marketplace in the center of the market chunk
                    this.createMarketplace(chunk, blockX, blockY);
                } else if (blockRandom < 0.7) {
                    // 70% chance for a house
                    this.createHouse(chunk, blockX, blockY, blockRandom);
                } else if (blockRandom < 0.85) {
                    // 15% chance for a garden/park
                    this.createGarden(chunk, blockX, blockY);
                }
                // 15% chance to leave it empty
            }
        }
    }

    // Create a marketplace
    createMarketplace(chunk, startX, startY) {
        // Create a large market square
        for (let y = startY; y < startY + 5; y++) {
            for (let x = startX; x < startX + 5; x++) {
                if (y > startY && y < startY + 4 && x > startX && x < startX + 4) {
                    // Market center
                    chunk.tiles[y][x].type = this.tileTypes.MARKET;
                    chunk.tiles[y][x].height = 0;
                } else {
                    // Market stalls around the edge
                    chunk.tiles[y][x].type = this.tileTypes.HOUSE;
                    chunk.tiles[y][x].height = 1;
                }
            }
        }
    }

    // Create a house
    createHouse(chunk, startX, startY, random) {
        // Determine house size (2x2 or 3x3)
        const size = random < 0.5 ? 2 : 3;
        const offsetX = Math.floor((5 - size) * random);
        const offsetY = Math.floor((5 - size) * this.seededRandom(random * 1000));

        // Create the house
        for (let y = startY + offsetY; y < startY + offsetY + size; y++) {
            for (let x = startX + offsetX; x < startX + offsetX + size; x++) {
                if (y < chunk.size && x < chunk.size && chunk.tiles[y][x].type !== this.tileTypes.ROAD) {
                    chunk.tiles[y][x].type = this.tileTypes.HOUSE;
                    chunk.tiles[y][x].height = 1;
                }
            }
        }
    }

    // Create a garden
    createGarden(chunk, startX, startY) {
        for (let y = startY + 1; y < startY + 4; y++) {
            for (let x = startX + 1; x < startX + 4; x++) {
                if (y < chunk.size && x < chunk.size && chunk.tiles[y][x].type !== this.tileTypes.ROAD) {
                    chunk.tiles[y][x].type = this.tileTypes.GARDEN;
                    chunk.tiles[y][x].height = 0;
                }
            }
        }
    }

    // Generate farmland surrounding the town
    generateFarmland(chunk, chunkX, chunkY) {
        // Base terrain
        for (let y = 0; y < chunk.size; y++) {
            for (let x = 0; x < chunk.size; x++) {
                chunk.tiles[y][x].type = this.tileTypes.GRASS;
                chunk.tiles[y][x].height = 0;
            }
        }

        // Create roads connecting to town
        this.createFarmRoads(chunk, chunkX, chunkY);

        // Add farms and fields
        this.addFarms(chunk, chunkX, chunkY);
    }

    // Create roads in farmland
    createFarmRoads(chunk, chunkX, chunkY) {
        // Connect to nearby chunks with roads
        // Generally have a main road running towards the kingdom center

        // Vector pointing towards kingdom center
        const dx = this.kingdomCenter.x - chunkX;
        const dy = this.kingdomCenter.y - chunkY;

        // Normalize to get direction
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / length;
        const dirY = dy / length;

        // Create a main road from one side to another
        const startX = dirX < 0 ? chunk.size - 1 : 0;
        const startY = dirY < 0 ? chunk.size - 1 : 0;
        const endX = dirX < 0 ? 0 : chunk.size - 1;
        const endY = dirY < 0 ? 0 : chunk.size - 1;

        // For horizontal/vertical alignment
        if (Math.abs(dirX) > Math.abs(dirY)) {
            // More horizontal
            const centerY = Math.floor(chunk.size / 2);
            for (let x = 0; x < chunk.size; x++) {
                for (let y = centerY - 1; y <= centerY + 1; y++) {
                    chunk.tiles[y][x].type = this.tileTypes.ROAD;
                }
            }
        } else {
            // More vertical
            const centerX = Math.floor(chunk.size / 2);
            for (let y = 0; y < chunk.size; y++) {
                for (let x = centerX - 1; x <= centerX + 1; x++) {
                    chunk.tiles[y][x].type = this.tileTypes.ROAD;
                }
            }
        }
    }

    // Add farms to farmland chunks
    addFarms(chunk, chunkX, chunkY) {
        // Create some farm plots
        for (let farmIdx = 0; farmIdx < 3; farmIdx++) {
            // Determine farm position
            const farmSeed = (chunk.x * 10000) + chunk.y + farmIdx * 1000;
            const farmX = Math.floor(3 + this.seededRandom(farmSeed) * (chunk.size - 8));
            const farmY = Math.floor(3 + this.seededRandom(farmSeed + 500) * (chunk.size - 8));
            const farmSize = 3 + Math.floor(this.seededRandom(farmSeed + 1000) * 3);

            // Ensure we don't build over roads
            let canBuildFarm = true;
            for (let y = farmY - 1; y < farmY + farmSize + 1 && canBuildFarm; y++) {
                for (let x = farmX - 1; x < farmX + farmSize + 1 && canBuildFarm; x++) {
                    if (y >= 0 && y < chunk.size && x >= 0 && x < chunk.size) {
                        if (chunk.tiles[y][x].type === this.tileTypes.ROAD) {
                            canBuildFarm = false;
                        }
                    }
                }
            }

            if (canBuildFarm) {
                // Create the farmhouse
                for (let y = farmY; y < farmY + 2; y++) {
                    for (let x = farmX; x < farmX + 2; x++) {
                        chunk.tiles[y][x].type = this.tileTypes.HOUSE;
                        chunk.tiles[y][x].height = 1;
                    }
                }

                // Create farm fields around the house
                for (let y = farmY - 1; y < farmY + farmSize; y++) {
                    for (let x = farmX + 2; x < farmX + farmSize; x++) {
                        if (y >= 0 && y < chunk.size && x >= 0 && x < chunk.size) {
                            chunk.tiles[y][x].type = this.tileTypes.FARM;
                            chunk.tiles[y][x].height = 0;
                        }
                    }
                }
            }
        }

        // Add some scattered trees
        for (let i = 0; i < 20; i++) {
            const treeSeed = (chunk.x * 20000) + chunk.y + i * 100;
            const x = Math.floor(this.seededRandom(treeSeed) * chunk.size);
            const y = Math.floor(this.seededRandom(treeSeed + 50) * chunk.size);

            if (chunk.tiles[y][x].type === this.tileTypes.GRASS) {
                chunk.tiles[y][x].type = this.tileTypes.TREE;
                chunk.tiles[y][x].height = 1;
            }
        }
    }

    // Generate wilderness outside the kingdom
    generateWilderness(chunk, chunkX, chunkY) {
        // Create a more natural, varied terrain
        for (let y = 0; y < chunk.size; y++) {
            for (let x = 0; x < chunk.size; x++) {
                // Use noise to generate terrain
                const nx = (chunk.x * chunk.size + x) / 50.0;
                const ny = (chunk.y * chunk.size + y) / 50.0;
                const value = this.noise(nx, ny);

                // Determine tile type and height based on noise value
                if (value < 0.3) {
                    chunk.tiles[y][x].type = this.tileTypes.WATER;
                    chunk.tiles[y][x].height = 0;
                } else if (value < 0.4) {
                    chunk.tiles[y][x].type = this.tileTypes.SAND;
                    chunk.tiles[y][x].height = 0;
                } else if (value < 0.7) {
                    chunk.tiles[y][x].type = this.tileTypes.GRASS;
                    chunk.tiles[y][x].height = 0;
                } else if (value < 0.85) {
                    chunk.tiles[y][x].type = this.tileTypes.TREE;
                    chunk.tiles[y][x].height = 1;
                } else {
                    chunk.tiles[y][x].type = this.tileTypes.STONE;
                    chunk.tiles[y][x].height = Math.floor((value - 0.85) * 8); // Higher elevation for mountains
                }
            }
        }

        // Maybe add a small road or path leading toward the kingdom
        const distance = Math.sqrt(
            Math.pow(chunkX - this.kingdomCenter.x, 2) + 
            Math.pow(chunkY - this.kingdomCenter.y, 2)
        );

        if (distance <= this.kingdomRadius + 2) {
            // Only add roads to chunks somewhat close to the kingdom
            this.addWildernessRoad(chunk, chunkX, chunkY);
        }
    }

    // Add a wilderness road/path
    addWildernessRoad(chunk, chunkX, chunkY) {
        // Vector pointing towards kingdom center
        const dx = this.kingdomCenter.x - chunkX;
        const dy = this.kingdomCenter.y - chunkY;

        // Normalize to get direction
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / length;
        const dirY = dy / length;

        // Determine start and end points for the road
        let startX, startY, endX, endY;

        if (Math.abs(dirX) > Math.abs(dirY)) {
            // Road enters/exits horizontally
            startX = dirX > 0 ? 0 : chunk.size - 1;
            startY = Math.floor(chunk.size / 2);
            endX = dirX > 0 ? chunk.size - 1 : 0;
            endY = startY;
        } else {
            // Road enters/exits vertically
            startX = Math.floor(chunk.size / 2);
            startY = dirY > 0 ? 0 : chunk.size - 1;
            endX = startX;
            endY = dirY > 0 ? chunk.size - 1 : 0;
        }

        // Create a winding path
        this.createWindingPath(chunk, startX, startY, endX, endY);
    }

    // Create a winding path between two points
    createWindingPath(chunk, startX, startY, endX, endY) {
        // Use midpoint displacement to create a natural winding path
        const points = [{x: startX, y: startY}, {x: endX, y: endY}];

        // Subdivide the path a few times
        for (let i = 0; i < 3; i++) {
            const newPoints = [];

            for (let j = 0; j < points.length - 1; j++) {
                const p1 = points[j];
                const p2 = points[j + 1];

                newPoints.push(p1);

                // Calculate midpoint
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                // Add random displacement
                const displacement = Math.min(8, 4 / (i + 1));
                const offsetX = (this.seededRandom((chunk.x * 10000) + chunk.y + i * 100 + j) - 0.5) * displacement;
                const offsetY = (this.seededRandom((chunk.x * 20000) + chunk.y + i * 100 + j) - 0.5) * displacement;

                // Add the displaced midpoint
                newPoints.push({
                    x: midX + offsetX,
                    y: midY + offsetY
                });
            }

            newPoints.push(points[points.length - 1]);
            points.length = 0;
            points.push(...newPoints);
        }

        // Draw the path
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            // Create a line between these points using Bresenham's line algorithm
            this.drawRoadLine(chunk, Math.round(p1.x), Math.round(p1.y), Math.round(p2.x), Math.round(p2.y));
        }
    }

    // Draw a line of road tiles
    drawRoadLine(chunk, x0, y0, x1, y1) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            // Place road at this position if within chunk
            if (x0 >= 0 && x0 < chunk.size && y0 >= 0 && y0 < chunk.size) {
                chunk.tiles[y0][x0].type = this.tileTypes.ROAD;
            }

            // Exit if we've reached the end point
            if (x0 === x1 && y0 === y1) break;

            // Update position
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    // Simplex noise function for more natural terrain
    noise(x, y) {
        // Simple implementation of noise for terrain generation
        // This is a simplified version that uses multiple octaves of simple value noise
        let value = 0;
        let amplitude = 1.0;
        let frequency = 1.0;
        let maxValue = 0;

        // Use 4 octaves
        for (let i = 0; i < 4; i++) {
            value += this.simpleNoise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2.0;
        }

        // Normalize
        return value / maxValue;
    }

    // Simple noise function
    simpleNoise(x, y) {
        // Get grid cell coordinates
        const xi = Math.floor(x);
        const yi = Math.floor(y);

        // Get cell values
        const v00 = this.seededRandom(xi * 12345 + yi * 67890);
        const v01 = this.seededRandom((xi + 1) * 12345 + yi * 67890);
        const v10 = this.seededRandom(xi * 12345 + (yi + 1) * 67890);
        const v11 = this.seededRandom((xi + 1) * 12345 + (yi + 1) * 67890);

        // Interpolate
        const fx = x - xi;
        const fy = y - yi;

        const wx = fx * fx * (3 - 2 * fx); // Smoothstep
        const wy = fy * fy * (3 - 2 * fy); // Smoothstep

        const vx0 = v00 * (1 - wx) + v01 * wx;
        const vx1 = v10 * (1 - wx) + v11 * wx;

        return vx0 * (1 - wy) + vx1 * wy;
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