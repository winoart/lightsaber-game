class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = Utils.setupCanvas(this.canvas);
        this.input = new InputHandler();
        this.gravity = 0.8;
        this.stage = 1;
        this.gameState = 'menu'; 
        this.player = new Player(0, 0);
        this.enemy = null;
        this.particles = [];
        this.shake = 0;
        this.setupUI();
        this.loop();
        window.addEventListener('resize', () => { this.ctx = Utils.setupCanvas(this.canvas); });
    }

    setupUI() {
        document.getElementById('start-btn').onclick = () => this.startStage(1, true);
        document.getElementById('retry-btn').onclick = () => this.startStage(this.stage);
    }

    startStage(stageNum, isNewGame = false) {
        this.stage = stageNum;
        const centerX = window.innerWidth / 2;
        const groundY = window.innerHeight - 150;
        
        if (isNewGame) {
            this.player.maxHp = 100;
            this.player.hp = 100;
            this.player.attackDamage = 15;
            this.player.speed = 4.5;
            this.player.skills = { doubleJump: false, sonicDash: false, berserk: false };
        }

        this.player.x = centerX - 150;
        this.player.y = groundY - 50;
        this.player.hp = this.player.maxHp; 
        this.player.velX = 0;
        this.player.velY = 0;
        this.player.state = 'idle';
        this.player.trail = [];
        
        const isBoss = stageNum === 10;
        this.enemy = new Enemy(window.innerWidth + 200, groundY - 50, stageNum, isBoss);
        
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('reward-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('stage-info').innerText = isBoss ? 'FINAL BOSS' : `STAGE ${stageNum}`;
        document.getElementById('announcement').classList.remove('show');
        document.getElementById('speech-bubble').classList.add('hidden');

        if (this.player.skills.sonicDash || this.player.skills.berserk) {
            document.getElementById('skill-btn').style.display = 'flex';
        } else {
            document.getElementById('skill-btn').style.display = 'none';
        }

        if (stageNum === 1) {
            this.runStage1Intro();
        } else {
            this.enemy.x = centerX + 150;
            this.gameState = 'playing';
        }
    }

    runStage1Intro() {
        this.gameState = 'cinematic';
        this.enemy.onMotorcycle = true;
        this.enemy.facing = -1;
        
        // Sequence
        setTimeout(() => {
            // Stop and get off
            this.enemy.onMotorcycle = false;
            this.enemy.y -= 20; // Hop off
            this.enemy.velY = -5;
            
            setTimeout(() => {
                // Taunt
                const bubble = document.getElementById('speech-bubble');
                bubble.classList.remove('hidden');
                bubble.innerText = "Come on!";
                
                setTimeout(() => {
                    bubble.classList.add('hidden');
                    // Announcement
                    const ann = document.getElementById('announcement');
                    ann.classList.remove('hidden');
                    setTimeout(() => ann.classList.add('show'), 50);
                    
                    setTimeout(() => {
                        ann.classList.remove('show');
                        setTimeout(() => ann.classList.add('hidden'), 500);
                        this.gameState = 'playing';
                    }, 1500);
                }, 1500);
            }, 800);
        }, 2000);
    }

    update() {
        if (this.gameState === 'cinematic') {
            if (this.enemy.onMotorcycle) {
                const targetX = window.innerWidth / 2 + 150;
                if (this.enemy.x > targetX) this.enemy.x -= 8;
            }
            this.enemy.update(this.gravity);
            this.player.update(this.gravity);
            
            // Speech bubble position
            const bubble = document.getElementById('speech-bubble');
            if (!bubble.classList.contains('hidden')) {
                bubble.style.left = this.enemy.x + this.enemy.width / 2 + 'px';
                bubble.style.top = this.enemy.y + 'px';
            }
            return;
        }

        if (this.gameState !== 'playing') return;
        this.player.handleInput(this.input);
        this.player.update(this.gravity);
        this.enemy.updateAI(this.player);
        this.enemy.update(this.gravity);

        // Precise Player Collision (Tip-based)
        if (this.player.isAttacking && this.player.attackTimer > 6 && this.player.attackTimer < 14) {
            if (!this.player.hitRegistered) {
                const tip = this.player.getSaberTip();
                const enemyCenter = { x: this.enemy.x + this.enemy.width / 2, y: this.enemy.y + this.enemy.height / 2 };
                const dist = Math.sqrt(Math.pow(tip.x - enemyCenter.x, 2) + Math.pow(tip.y - enemyCenter.y, 2));
                if (dist < 40) {
                    const isFinisher = this.player.combo === 3 || this.player.isAirSpin;
                    const damage = isFinisher ? this.player.attackDamage * 2 : this.player.attackDamage;
                    this.enemy.takeDamage(damage);
                    this.createHitParticles(tip.x, tip.y, '#ff0055');
                    this.shake = isFinisher ? 25 : 10;
                    this.player.hitRegistered = true;
                }
            }
        } else { this.player.hitRegistered = false; }

        // Precise Enemy Collision
        if (this.enemy.isAttacking && this.enemy.attackTimer > 6 && this.enemy.attackTimer < 14) {
            if (!this.enemy.hitRegistered) {
                const tip = this.enemy.getSaberTip();
                const playerCenter = { x: this.player.x + this.player.width / 2, y: this.player.y + this.player.height / 2 };
                const dist = Math.sqrt(Math.pow(tip.x - playerCenter.x, 2) + Math.pow(tip.y - playerCenter.y, 2));
                if (dist < 35) {
                    this.player.takeDamage(10 + this.stage * 2);
                    this.createHitParticles(tip.x, tip.y, '#00f2ff');
                    this.shake = 15;
                    this.enemy.hitRegistered = true;
                }
            }
        } else { this.enemy.hitRegistered = false; }

        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.02; return p.life > 0;
        });

        if (this.shake > 0) this.shake *= 0.9;
        if (this.shake < 0.1) this.shake = 0;

        document.getElementById('player-hp-bar').style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
        document.getElementById('enemy-hp-bar').style.width = `${(this.enemy.hp / this.enemy.maxHp) * 100}%`;
        document.getElementById('player-hp-text').innerText = `${Math.ceil(this.player.hp)}/${Math.ceil(this.player.maxHp)} (ATK: ${this.player.attackDamage})`;
        document.getElementById('enemy-hp-text').innerText = `${Math.ceil(this.enemy.hp)}/${Math.ceil(this.enemy.maxHp)}`;
        
        if (this.enemy.hp <= 0) this.onStageClear();
        if (this.player.hp <= 0) this.onGameOver();
    }

    draw() {
        this.ctx.save();
        if (this.shake > 0) this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        this.ctx.clearRect(-100, -100, this.canvas.width + 200, this.canvas.height + 200);
        
        const floorY = window.innerHeight - 150;
        Utils.drawLine(this.ctx, 0, floorY, window.innerWidth, floorY, 2, 'rgba(255,255,255,0.2)', 0);
        this.enemy.draw(this.ctx);
        this.player.draw(this.ctx);
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            Utils.drawCircle(this.ctx, p.x, p.y, p.r, p.color, 10);
        });
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
    }

    createHitParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({ x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, r: Math.random() * 3 + 1, color, life: 1 });
        }
    }

    onStageClear() {
        this.gameState = 'reward';
        if (this.stage === 10) { alert('Congratulations! You defeated the Final Boss!'); location.reload(); return; }
        document.getElementById('reward-menu').classList.remove('hidden');
        const options = document.getElementById('reward-options');
        options.innerHTML = '';
        const rewardPool = [
            { text: '+40 Max HP', action: () => { this.player.maxHp += 40; } },
            { text: '+8 ATK DMG', action: () => { this.player.attackDamage += 8; } },
            { text: '+1 Move Speed', action: () => { this.player.speed += 1; } }
        ];
        if (!this.player.skills.doubleJump) rewardPool.push({ text: 'Unlock Double Jump', action: () => { this.player.skills.doubleJump = true; } });
        if (!this.player.skills.sonicDash && this.stage >= 2) rewardPool.push({ text: 'Unlock Sonic Dash', action: () => { this.player.skills.sonicDash = true; } });
        if (!this.player.skills.berserk && this.stage >= 4) rewardPool.push({ text: 'Unlock Berserk Mode', action: () => { this.player.skills.berserk = true; } });

        const shuffled = rewardPool.sort(() => 0.5 - Math.random());
        const chosen = shuffled.slice(0, 3);
        chosen.forEach(r => {
            const btn = document.createElement('button'); btn.className = 'glow-btn'; btn.innerText = r.text;
            btn.onclick = () => { r.action(); this.startNextStage(); };
            options.appendChild(btn);
        });
    }

    startNextStage() { this.startStage(this.stage + 1); }
    onGameOver() { this.gameState = 'gameover'; document.getElementById('game-over').classList.remove('hidden'); }
    loop() { this.update(); this.draw(); requestAnimationFrame(() => this.loop()); }
}

window.onload = () => { 
    new Game(); 
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
};
