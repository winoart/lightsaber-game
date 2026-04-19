class InputHandler {
    constructor() {
        this.keys = {};
        this.touch = {
            left: false,
            right: false,
            down: false,
            jump: false,
            attack: false,
            skill: false
        };
        this.prevJump = false;

        // Keyboard
        window.addEventListener('keydown', e => { this.keys[e.code] = true; });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });

        // Touch - Action Buttons
        this.setupButton('attack-btn', 'attack');
        this.setupButton('jump-btn', 'jump');
        this.setupButton('skill-btn', 'skill');

        // Virtual Joystick
        this.setupJoystick();
    }

    setupButton(id, property) {
        const btn = document.getElementById(id);
        if (!btn) return;
        const start = (e) => { e.preventDefault(); this.touch[property] = true; };
        const end = (e) => { e.preventDefault(); this.touch[property] = false; };
        btn.addEventListener('touchstart', start);
        btn.addEventListener('touchend', end);
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
    }

    setupJoystick() {
        const area = document.getElementById('joystick-area');
        const knob = document.getElementById('joystick-knob');
        if (!area || !knob) return;

        const handleTouch = (e) => {
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const rect = area.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let dx = touch.clientX - centerX;
            let dy = touch.clientY - centerY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const maxDist = rect.width / 2;

            if (dist > maxDist) {
                dx *= maxDist / dist;
                dy *= maxDist / dist;
            }

            knob.style.transform = `translate(${dx}px, ${dy}px)`;

            // Threshold for movement
            this.touch.left = dx < -20;
            this.touch.right = dx > 20;
            this.touch.down = dy > 30;
        };

        const reset = (e) => {
            if (e) e.preventDefault();
            knob.style.transform = `translate(0, 0)`;
            this.touch.left = false;
            this.touch.right = false;
            this.touch.down = false;
        };

        area.addEventListener('touchstart', handleTouch);
        area.addEventListener('touchmove', handleTouch);
        area.addEventListener('touchend', reset);
        
        // Mouse fallback
        area.addEventListener('mousedown', (e) => {
            const move = (me) => handleTouch(me);
            const up = () => {
                reset();
                window.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
        });
    }

    isLeft() { return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touch.left; }
    isRight() { return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touch.right; }
    isDown() { return this.keys['ArrowDown'] || this.keys['KeyS'] || this.touch.down; }
    isJump() { return this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space'] || this.touch.jump; }
    isAttack() { return this.keys['KeyJ'] || this.keys['KeyZ'] || this.touch.attack; }
    isSkill() { return this.keys['KeyK'] || this.keys['KeyX'] || this.touch.skill; }
}
