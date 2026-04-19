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

        // Keyboard listeners
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        // Touch listeners
        this.setupTouch('left-btn', 'left');
        this.setupTouch('right-btn', 'right');
        this.setupTouch('down-btn', 'down');
        this.setupTouch('jump-btn', 'jump');
        this.setupTouch('attack-btn', 'attack');
        this.setupTouch('skill-btn', 'skill');
    }

    setupTouch(id, property) {
        const btn = document.getElementById(id);
        if (!btn) return;

        const start = (e) => {
            e.preventDefault();
            this.touch[property] = true;
        };
        const end = (e) => {
            e.preventDefault();
            this.touch[property] = false;
        };

        btn.addEventListener('touchstart', start);
        btn.addEventListener('touchend', end);
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
    }

    isLeft() { return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touch.left; }
    isRight() { return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touch.right; }
    isDown() { return this.keys['ArrowDown'] || this.keys['KeyS'] || this.touch.down; }
    isJump() { return this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'] || this.touch.jump; }
    isAttack() { return this.keys['KeyZ'] || this.keys['KeyJ'] || this.touch.attack; }
    isSkill() { return this.keys['KeyX'] || this.keys['KeyK'] || this.touch.skill; }
}
