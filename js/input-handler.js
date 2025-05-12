export class InputHandler {
    constructor(player) {
        this.player = player;
        this.keys = {};
        this.touchStart = null;
        this.touchOrigin = { x: 0, y: 0 };
        this.isTouching = false;
        this.joystickRadius = 50;
        this.joystickElement = null;
        
        // Initialize input handlers
        this.initKeyboardEvents();
        this.initTouchEvents();
    }
    
    initKeyboardEvents() {
        // Add keyboard event listeners
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    initTouchEvents() {
        // Create virtual joystick for touch devices
        this.createVirtualJoystick();
        
        // Add touch event listeners
        window.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    createVirtualJoystick() {
        // Create joystick container
        this.joystickContainer = document.createElement('div');
        this.joystickContainer.style.position = 'absolute';
        this.joystickContainer.style.bottom = '50px';
        this.joystickContainer.style.left = '50px';
        this.joystickContainer.style.width = `${this.joystickRadius * 2}px`;
        this.joystickContainer.style.height = `${this.joystickRadius * 2}px`;
        this.joystickContainer.style.borderRadius = '50%';
        this.joystickContainer.style.backgroundColor = 'rgba(100, 100, 100, 0.5)';
        this.joystickContainer.style.display = 'none';
        this.joystickContainer.style.zIndex = '100';
        this.joystickContainer.style.pointerEvents = 'none'; // Don't interfere with touch events
        
        // Create joystick knob
        this.joystickKnob = document.createElement('div');
        this.joystickKnob.style.position = 'absolute';
        this.joystickKnob.style.top = '50%';
        this.joystickKnob.style.left = '50%';
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        this.joystickKnob.style.width = '40px';
        this.joystickKnob.style.height = '40px';
        this.joystickKnob.style.borderRadius = '50%';
        this.joystickKnob.style.backgroundColor = 'rgba(200, 200, 200, 0.8)';
        
        this.joystickContainer.appendChild(this.joystickKnob);
        document.body.appendChild(this.joystickContainer);
    }
    
    handleKeyDown(e) {
        this.keys[e.code] = true;
        this.updatePlayerDirection();
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
        this.updatePlayerDirection();
    }
    
    handleTouchStart(e) {
        const touch = e.touches[0];
        this.isTouching = true;
        
        // Store the touch start position
        this.touchStart = {
            x: touch.clientX,
            y: touch.clientY
        };
        
        // Set joystick position to touch position
        this.touchOrigin = {
            x: touch.clientX,
            y: touch.clientY
        };
        
        // Show and position joystick
        this.joystickContainer.style.display = 'block';
        this.joystickContainer.style.left = `${this.touchOrigin.x - this.joystickRadius}px`;
        this.joystickContainer.style.top = `${this.touchOrigin.y - this.joystickRadius}px`;
        this.joystickKnob.style.left = '50%';
        this.joystickKnob.style.top = '50%';
    }
    
    handleTouchMove(e) {
        if (!this.isTouching) return;
        
        // Prevent scrolling
        e.preventDefault();
        
        const touch = e.touches[0];
        
        // Calculate joystick direction
        const dx = touch.clientX - this.touchOrigin.x;
        const dy = touch.clientY - this.touchOrigin.y;
        
        // Calculate magnitude of joystick movement
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Limit joystick movement to radius
        const clampedDistance = Math.min(distance, this.joystickRadius);
        const knobX = clampedDistance * Math.cos(angle);
        const knobY = clampedDistance * Math.sin(angle);
        
        // Update joystick knob position
        this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        
        // Update player direction
        if (distance > 10) { // small deadzone
            this.player.setDirection(
                knobX / this.joystickRadius,
                knobY / this.joystickRadius
            );
        } else {
            this.player.setDirection(0, 0);
        }
    }
    
    handleTouchEnd(e) {
        this.isTouching = false;
        this.touchStart = null;
        this.player.setDirection(0, 0);
        
        // Hide joystick
        this.joystickContainer.style.display = 'none';
    }
    
    updatePlayerDirection() {
        // Calculate direction based on WASD or arrow keys
        let dirX = 0;
        let dirY = 0;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) dirY -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dirY += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dirX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dirX += 1;
        
        this.player.setDirection(dirX, dirY);
    }
}