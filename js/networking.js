export class NetworkManager {
    constructor() {
        this.room = null;
        this.otherPlayers = {};
        this.chunkUpdateCallbacks = [];
    }
    
    async initialize() {
        try {
            console.log('Initializing network connection...');
            
            // Initialize WebsimSocket for multiplayer
            this.room = new WebsimSocket();
            await this.room.initialize();
            
            // Subscribe to presence updates (player positions)
            this.room.subscribePresence((presence) => {
                this.handlePresenceUpdate(presence);
            });
            
            // Subscribe to room state updates (world changes)
            this.room.subscribeRoomState((roomState) => {
                this.handleRoomStateUpdate(roomState);
            });
            
            // Initial room state setup if empty
            if (!this.room.roomState.chunks) {
                this.room.updateRoomState({
                    chunks: {}
                });
            }
            
            console.log('Network connection initialized successfully!');
            return true;
        } catch (error) {
            console.error('Failed to initialize network connection:', error);
            return false;
        }
    }
    
    getClientId() {
        return this.room ? this.room.clientId : null;
    }
    
    getUsername() {
        if (this.room && this.room.peers && this.room.clientId) {
            return this.room.peers[this.room.clientId]?.username || 'Unknown';
        }
        return 'Unknown';
    }
    
    // Update player position to all other players
    updatePlayerPosition(x, y) {
        if (!this.room) return;
        
        this.room.updatePresence({
            x: x,
            y: y,
            lastUpdate: Date.now()
        });
    }
    
    // Handle presence updates (other players' positions)
    handlePresenceUpdate(presence) {
        // Clear old players
        this.otherPlayers = {};
        
        // Process all presences
        for (const clientId in presence) {
            // Skip own presence
            if (clientId === this.room.clientId) continue;
            
            const playerData = presence[clientId];
            if (playerData && typeof playerData.x === 'number' && typeof playerData.y === 'number') {
                this.otherPlayers[clientId] = {
                    x: playerData.x,
                    y: playerData.y,
                    username: this.room.peers[clientId]?.username || 'Unknown',
                    color: this.getColorFromUsername(this.room.peers[clientId]?.username || 'Unknown'),
                    lastUpdate: playerData.lastUpdate || Date.now()
                };
            }
        }
    }
    
    // Handle room state updates
    handleRoomStateUpdate(roomState) {
        // Process chunk updates if necessary
        if (roomState.chunks) {
            for (const chunkKey in roomState.chunks) {
                const chunkData = roomState.chunks[chunkKey];
                this.notifyChunkUpdate(chunkData);
            }
        }
    }
    
    // Get a list of other players for rendering
    getOtherPlayers() {
        return Object.values(this.otherPlayers);
    }
    
    // Subscribe to chunk updates
    subscribeToChunkUpdates(callback) {
        this.chunkUpdateCallbacks.push(callback);
    }
    
    // Notify subscribers about chunk updates
    notifyChunkUpdate(chunkData) {
        this.chunkUpdateCallbacks.forEach(callback => {
            callback(chunkData);
        });
    }
    
    // Load a chunk from the database
    async loadChunkFromDB(chunkX, chunkY) {
        try {
            // Create a key for the chunk
            const chunkKey = `${chunkX},${chunkY}`;
            
            // Try to get the chunk from room state first
            if (this.room.roomState.chunks && this.room.roomState.chunks[chunkKey]) {
                return this.room.roomState.chunks[chunkKey];
            }
            
            // If not in room state, check the database
            const chunkRecords = await this.room.collection('chunk')
                .filter({ chunkX: chunkX, chunkY: chunkY })
                .getList();
            
            if (chunkRecords && chunkRecords.length > 0) {
                // Use the most recent chunk record
                const chunkRecord = chunkRecords[0];
                return JSON.parse(chunkRecord.data);
            }
            
            return null;
        } catch (error) {
            console.error('Error loading chunk from database:', error);
            return null;
        }
    }
    
    // Save a chunk to the database
    async saveChunkToDB(chunk) {
        try {
            const chunkKey = `${chunk.x},${chunk.y}`;
            
            // Save to room state for immediate use by other players
            const chunkUpdate = {};
            chunkUpdate[chunkKey] = chunk;
            
            await this.room.updateRoomState({
                chunks: chunkUpdate
            });
            
            // Also save to database for persistence
            const chunkData = JSON.stringify(chunk);
            
            // Check if chunk already exists in database
            const existingChunks = await this.room.collection('chunk')
                .filter({ chunkX: chunk.x, chunkY: chunk.y })
                .getList();
            
            if (existingChunks && existingChunks.length > 0) {
                // Update existing chunk record
                await this.room.collection('chunk').update(existingChunks[0].id, {
                    data: chunkData,
                    lastUpdated: Date.now()
                });
            } else {
                // Create new chunk record
                await this.room.collection('chunk').create({
                    chunkX: chunk.x,
                    chunkY: chunk.y,
                    data: chunkData,
                    lastUpdated: Date.now()
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error saving chunk to database:', error);
            return false;
        }
    }
    
    // Get a deterministic color based on username (copied from Player class)
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
}