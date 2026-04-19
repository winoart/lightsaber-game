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
        const cx = window.innerWidth / 2;
        const gy = window.innerHeight - 150;
        
        if (isNewGame) {
            this.player.maxHp = 100; this.player.hp = 100;
            this.player.attackDamage = 15; this.player.speed = 4.2;
            this.player.skills = { doubleJump: false, sonicDash: false, berserk: false };
        }

        this.player.x = cx - 120; this.player.y = gy - 60;
        this.player.hp = this.player.maxHp; this.player.velX = 0; this.player.velY = 0;
        this.player.state = 'idle'; this.player.trail = [];
        
        const isBoss = stageNum === 10;
        this.enemy = new Enemy(window.innerWidth + 100, gy - 60, stageNum, isBoss);
        
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('reward-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('stage-info').innerText = isBoss ? 'FINAL BOSS' : `STAGE ${stageNum}`;
        document.getElementById('announcement').classList.add('hidden');
        document.getElementById('speech-bubble').classList.add('hidden');

        if (this.player.skills.sonicDash || this.player.skills.berserk) document.getElementById('skill-btn').style.display = 'flex';
        else document.getElementById('skill-btn').style.display = 'none';

        if (stageNum === 1) this.runStage1Intro();
        else { this.enemy.x = cx + 120; this.gameState = 'playing'; }
    }

    runStage1Intro() {
        this.gameState = 'cinematic';
        this.enemy.onMotorcycle = true;
        this.enemy.facing = -1;
        setTimeout(() => {
            this.enemy.onMotorcycle = false;
            this.enemy.velY = -6; // Hop off
            setTimeout(() => {
                const bubble = document.getElementById('speech-bubble');
                bubble.classList.remove('hidden');
                setTimeout(() => {
                    bubble.classList.add('hidden');
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
        }, 1500);
    }

    update() {
        if (this.gameState === 'cinematic') {
            if (this.enemy.onMotorcycle) {
                const tx = window.innerWidth / 2 + 100;
                if (this.enemy.x > tx) this.enemy.x -= 7;
            }
            this.enemy.update(this.gravity);
            this.player.update(this.gravity);
            const bubble = document.getElementById('speech-bubble');
            if (!bubble.classList.contains('hidden')) {
                bubble.style.left = this.enemy.x + this.enemy.width / 2 + 'px';
                bubble.style.top = this.enemy.y + 'px';
            }
            return;
        }
        if (this.gameState !== 'playing') return;
        if (!this.player || !this.enemy) return;
        this.player.handleInput(this.input);
        this.player.update(this.gravity);
        this.enemy.updateAI(this.player);
        this.enemy.update(this.gravity);

        // Combat
        [this.player, this.enemy].forEach(attacker => {
            if (attacker.isAttacking && attacker.attackTimer > 6 && attacker.attackTimer < 14 && !attacker.hitRegistered) {
                const target = attacker === this.player ? this.enemy : this.player;
                const tip = attacker.getSaberTip();
                const tc = { x: target.x + target.width/2, y: target.y + target.height/2 };
                const d = Math.sqrt((tip.x-tc.x)**2 + (tip.y-tc.y)**2);
                if (d < 40) {
                    const dmg = (attacker.isPlayer && (attacker.combo===3 || attacker.isAirSpin)) ? attacker.attackDamage*2 : (attacker.isPlayer ? attacker.attackDamage : 10+this.stage*2);
                    target.takeDamage(dmg);
                    this.createHitParticles(tip.x, tip.y, attacker === this.player ? '#ff0055' : '#00f2ff');
                    this.shake = 15;
                    attacker.hitRegistered = true;
                }
            }
        });
        if (!this.player.isAttacking) this.player.hitRegistered = false;
        if (!this.enemy.isAttacking) this.enemy.hitRegistered = false;

        this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; return p.life > 0; });
        if (this.shake > 0) this.shake *= 0.9;
        
        document.getElementById('player-hp-bar').style.width = `${(this.player.hp/this.player.maxHp)*100}%`;
        document.getElementById('enemy-hp-bar').style.width = `${(this.enemy.hp/this.enemy.maxHp)*100}%`;
        document.getElementById('player-hp-text').innerText = `${Math.ceil(this.player.hp)}/${Math.ceil(this.player.maxHp)} (ATK: ${this.player.attackDamage})`;
        document.getElementById('enemy-hp-text').innerText = `${Math.ceil(this.enemy.hp)}/${Math.ceil(this.enemy.maxHp)}`;
        
        if (this.enemy.hp <= 0) this.onStageClear();
        if (this.player.hp <= 0) this.onGameOver();
    }

    draw() {
        this.ctx.save();
        if (this.shake > 0) this.ctx.translate((Math.random()-0.5)*this.shake, (Math.random()-0.5)*this.shake);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const fy = window.innerHeight - 150;
        Utils.drawLine(this.ctx, 0, fy, window.innerWidth, fy, 2, 'rgba(255,255,255,0.2)', 0);
        if (this.enemy) this.enemy.draw(this.ctx);
        if (this.player) this.player.draw(this.ctx);
        this.particles.forEach(p => { this.ctx.globalAlpha = p.life; Utils.drawCircle(this.ctx, p.x, p.y, p.r, p.color, 10); });
        this.ctx.restore();
    }

    createHitParticles(x, y, color) { for (let i = 0; i < 10; i++) this.particles.push({ x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, r: Math.random()*3+1, color, life: 1 }); }
    
    onStageClear() {
        this.gameState = 'reward';
        if (this.stage === 10) { alert('Victory!'); location.reload(); return; }
        document.getElementById('reward-menu').classList.remove('hidden');
        const opt = document.getElementById('reward-options'); opt.innerHTML = '';
        const pool = [ { t: '+40 HP', a: () => this.player.maxHp += 40 }, { t: '+8 ATK', a: () => this.player.attackDamage += 8 }, { t: '+1 SPEED', a: () => this.player.speed += 1 } ];
        if (!this.player.skills.doubleJump) pool.push({ t: 'Double Jump', a: () => this.player.skills.doubleJump = true });
        pool.sort(() => 0.5 - Math.random()).slice(0, 3).forEach(r => {
            const b = document.createElement('button'); b.className = 'glow-btn'; b.innerText = r.t; b.onclick = () => { r.a(); this.startNextStage(); }; opt.appendChild(b);
        });
    }

    startNextStage() { this.startStage(this.stage + 1); }
    onGameOver() { this.gameState = 'gameover'; document.getElementById('game-over').classList.remove('hidden'); }
    loop() { this.update(); this.draw(); requestAnimationFrame(() => this.loop()); }
}

window.oncontextmenu = (e) => e.preventDefault();
window.onload = () => { new Game(); if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js'); };
