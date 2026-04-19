class Entity {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isPlayer = isPlayer;
        this.width = 25;
        this.height = 50;
        this.velX = 0;
        this.velY = 0;
        this.speed = 4.2;
        this.jumpForce = -13;
        this.grounded = false;
        this.maxHp = 100;
        this.hp = 100;
        this.attackDamage = 15;
        this.attackSpeed = 1;
        this.state = 'idle';
        this.facing = 1;
        this.animFrame = 0;
        this.combo = 0;
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.isAirSpin = false;
        this.attackDuration = 18;
        this.attackTimer = 0;
        this.hitRegistered = false;
        this.skills = { doubleJump: false, sonicDash: false, berserk: false };
        this.berserkTimer = 0;
        this.trail = [];
        this.maxTrail = 12;
        this.saberColor = isPlayer ? '#00f2ff' : '#ff0055';
        this.rotation = 0; // Added for falling/tilting effects
    }

    update(gravity) {
        this.velY += gravity;
        this.x += this.velX;
        this.y += this.velY;
        this.velX *= 0.85;

        const floorY = window.innerHeight - 150;
        if (this.y + this.height > floorY) {
            this.y = floorY - this.height;
            this.velY = 0;
            this.grounded = true;
            this.isAirSpin = false;
        } else {
            this.grounded = false;
        }

        if (this.x < 5) { this.x = 5; this.velX = 0; }
        else if (this.x + this.width > window.innerWidth - 5) { this.x = window.innerWidth - this.width - 5; this.velX = 0; }

        this.animFrame += 0.15;
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.isAirSpin = false;
                this.state = this.grounded ? 'idle' : 'jump';
            }
        }
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.berserkTimer > 0) {
            this.berserkTimer--;
            if (this.berserkTimer <= 0) this.attackSpeed = 1;
        }
        this.updateTrail();
    }

    updateTrail() {
        const hx = this.x + this.width / 2;
        const by = this.y + 20;
        let tip = { x: hx, y: by };
        if (this.isAttacking) {
            const p = 1 - (this.attackTimer / this.attackDuration);
            if (this.isAirSpin) {
                const a = p * Math.PI * 2 * this.facing;
                tip.x = hx + Math.cos(a) * 50; tip.y = by + Math.sin(a) * 50;
            } else if (this.combo === 1) {
                const a = Utils.lerp(-Math.PI * 0.7, Math.PI * 0.7, p);
                tip.x = hx + Math.cos(a) * 50 * this.facing; tip.y = by + Math.sin(a) * 12;
            } else if (this.combo === 2) {
                const a = Utils.lerp(-Math.PI * 0.8, -Math.PI * 0.2, p);
                tip.x = hx + Math.cos(a) * 20 * this.facing + (p * 25 * this.facing); tip.y = by + Math.sin(a) * 60 + (p * 15);
            } else {
                const t = Utils.lerp(10, 60, p);
                tip.x = hx + t * this.facing; tip.y = by + (Math.sin(p * 10) * 3);
            }
        }
        this.trail.unshift({ x: tip.x, y: tip.y });
        if (this.trail.length > this.maxTrail) this.trail.pop();
    }

    getSaberTip() { return this.trail[0] || { x: this.x + this.width / 2, y: this.y + 20 }; }

    draw(ctx) {
        const hx = this.x + this.width / 2;
        const hy = this.y + 12;
        const by = hy + 12;
        const wy = by + 15;
        ctx.lineJoin = 'round';
        if (this.berserkTimer > 0) { ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(255, 100, 0, 0.5)'; }
        if (this.isAttacking || this.trail.length > 2) {
            ctx.save();
            for (let i = 0; i < this.trail.length - 1; i++) {
                const a = (1 - (i / this.trail.length)) * 0.7;
                ctx.globalAlpha = a;
                Utils.drawLine(ctx, this.trail[i].x, this.trail[i].y, this.trail[i+1].x, this.trail[i+1].y, 5 - i/2, this.saberColor, 12);
            }
            ctx.restore();
        }
        ctx.save();
        ctx.translate(hx, by);
        ctx.rotate(this.rotation);
        if (this.isAirSpin) {
            const p = 1 - (this.attackTimer / this.attackDuration);
            ctx.rotate(p * Math.PI * 2 * this.facing);
        }
        ctx.translate(-hx, -by);
        let px = hx, py = hy, sx = hx, ex = hx + 10 * this.facing, ey = by;
        if (this.isAttacking) {
            if (this.isAirSpin) { ex = this.trail[0].x; ey = this.trail[0].y; }
            else if (this.combo === 1) { sx -= 3 * this.facing; ex = Utils.lerp(ex, this.trail[0].x, 0.4); ey = Utils.lerp(ey, this.trail[0].y, 0.4); }
            else if (this.combo === 2) { py += 3; ex = Utils.lerp(ex, this.trail[0].x, 0.4); ey = Utils.lerp(ey, this.trail[0].y, 0.4); }
            else { sx += 6 * this.facing; ex = Utils.lerp(ex, this.trail[0].x, 0.8); ey = Utils.lerp(ey, this.trail[0].y, 0.8); }
        }
        Utils.drawCircle(ctx, px, py, 8, 'white', 4);
        Utils.drawLine(ctx, px, py + 8, sx, wy, 3, 'white', 0);
        Utils.drawLine(ctx, (px + sx)/2, by, ex, ey, 2, 'white', 0);
        if (this.isAirSpin) { Utils.drawLine(ctx, sx, wy, sx - 6, wy + 6, 3, 'white', 0); Utils.drawLine(ctx, sx, wy, sx + 6, wy + 6, 3, 'white', 0); }
        else {
            let lo = Math.sin(this.animFrame) * 10;
            if (this.state === 'run') { Utils.drawLine(ctx, sx, wy, sx + lo * this.facing, wy + 16, 3, 'white', 0); Utils.drawLine(ctx, sx, wy, sx - lo * this.facing, wy + 16, 3, 'white', 0); }
            else { Utils.drawLine(ctx, sx, wy, sx + 6, wy + 16, 3, 'white', 0); Utils.drawLine(ctx, sx, wy, sx - 6, wy + 16, 3, 'white', 0); }
        }
        const saberEnd = this.trail[0] || { x: hx, y: by };
        Utils.drawLine(ctx, ex, ey, saberEnd.x, saberEnd.y, 3, this.saberColor, 15);
        ctx.restore();
    }

    attack() {
        if (this.attackCooldown > 0) return;
        this.isAttacking = true;
        if (!this.grounded) { this.isAirSpin = true; this.attackDuration = 20 / this.attackSpeed; }
        else { this.isAirSpin = false; this.combo = (this.combo % 3) + 1; this.attackDuration = 18 / this.attackSpeed; }
        this.attackTimer = this.attackDuration;
        this.attackCooldown = 12 / this.attackSpeed;
    }

    takeDamage(amount) { this.hp -= amount; if (this.hp < 0) this.hp = 0; this.state = 'hit'; setTimeout(() => { if (this.state === 'hit') this.state = 'idle'; }, 200); }
}

class Player extends Entity {
    constructor(x, y) { super(x, y, '#00f2ff', true); }
    handleInput(input) {
        if (input.isLeft()) { this.velX = -this.speed; this.facing = -1; if (this.grounded) this.state = 'run'; }
        else if (input.isRight()) { this.velX = this.speed; this.facing = 1; if (this.grounded) this.state = 'run'; }
        else if (input.isDown()) { this.state = 'crouch'; }
        else { if (this.grounded && !this.isAttacking) this.state = 'idle'; }
        if (input.isJump() && !input.prevJump) {
            if (this.grounded) { this.velY = this.jumpForce; this.grounded = false; this.state = 'jump'; }
            else if (this.skills.doubleJump && !this.jumpCount) { this.velY = this.jumpForce * 0.8; this.jumpCount = 1; }
        }
        input.prevJump = input.isJump();
        if (this.grounded) this.jumpCount = 0;
        if (input.isAttack()) this.attack();
        if (input.isSkill() && this.attackCooldown <= 0) {
            if (this.skills.sonicDash) { this.isAttacking = true; this.combo = 3; this.attackTimer = 15; this.velX = this.facing * 40; this.attackCooldown = 90; }
            else if (this.skills.berserk) { this.berserkTimer = 300; this.attackSpeed = 2; this.attackCooldown = 600; }
        }
    }
}

class Enemy extends Entity {
    constructor(x, y, level, isBoss = false) {
        const shade = Math.min(255, 100 + level * 15);
        super(x, y, isBoss ? '#bc13fe' : `rgb(${shade},0,${50-level*5})`, false);
        this.level = level; this.isBoss = isBoss; this.onMotorcycle = false; this.onCar = false;
        this.maxHp = 50 + Math.pow(level, 1.6) * 15; this.hp = this.maxHp;
        this.speed = 2 + (level * 0.35); this.attackDamage = 10 + (level * 4);
        this.aggression = 0.03 + (level * 0.012); this.attackCooldownBase = Math.max(15, 60 - level * 5);
        if (isBoss) { this.width = 40; this.height = 80; this.speed = 4.5; this.maxHp = 1500; this.hp = this.maxHp; this.saberColor = '#bc13fe'; }
    }
    updateAI(player) {
        if (this.onMotorcycle) return;
        const dx = player.x - this.x, dist = Math.abs(dx), cd = this.isBoss ? 140 : 100;
        if (dist > cd) { this.velX = Math.sign(dx) * this.speed; this.facing = Math.sign(dx); this.state = 'run'; }
        else { this.velX = 0; this.facing = Math.sign(dx); if (this.grounded && !this.isAttacking) this.state = 'idle'; if (Math.random() < this.aggression && this.attackCooldown <= 0) { this.attack(); this.attackCooldown = this.attackCooldownBase; } }
        if (this.grounded && Math.random() < 0.01) { this.velY = this.jumpForce; this.grounded = false; }
    }
    draw(ctx) {
        if (this.onMotorcycle) {
            ctx.save();
            const bx = this.x + this.width / 2;
            const by = this.y + this.height - 5;
            const f = this.facing; // Direction factor

            // 1. Wheels (Neon Rim Effect)
            Utils.drawCircle(ctx, bx - 25 * f, by, 12, '#111', 0); // Back tire
            Utils.drawCircle(ctx, bx - 25 * f, by, 8, this.color, 12); // Back neon rim
            Utils.drawCircle(ctx, bx + 25 * f, by, 12, '#111', 0); // Front tire
            Utils.drawCircle(ctx, bx + 25 * f, by, 8, this.color, 12); // Front neon rim

            // 2. Motorcycle Body
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(bx - 30 * f, by - 5);
            ctx.lineTo(bx - 10 * f, by - 25);
            ctx.lineTo(bx + 15 * f, by - 25);
            ctx.lineTo(bx + 35 * f, by - 5);
            ctx.stroke();

            // Seat and Engine Area
            Utils.drawLine(ctx, bx - 5 * f, by - 20, bx + 10 * f, by - 5, 8, '#222', 0);
            
            // 3. Headlight
            Utils.drawCircle(ctx, bx + 38 * f, by - 12, 4, 'white', 15);

            // 4. Stickman Posture (Leaning forward)
            const hx = bx - 5 * f, hy = this.y + 15;
            Utils.drawCircle(ctx, hx, hy, 8, 'white', 4); // Head
            
            // Body (leaning)
            Utils.drawLine(ctx, hx, hy + 8, bx + 5 * f, by - 18, 3, 'white', 0);
            
            // Arms (grabbing handles)
            Utils.drawLine(ctx, hx + 2 * f, hy + 12, bx + 25 * f, by - 22, 2, 'white', 0);
            
            // Handles
            Utils.drawLine(ctx, bx + 22 * f, by - 28, bx + 28 * f, by - 16, 2, '#444', 0);

            // Legs
            Utils.drawLine(ctx, bx + 5 * f, by - 18, bx - 10 * f, by - 12, 3, 'white', 0);
            
            ctx.restore();
        } else if (this.onCar) {
            ctx.save();
            const bx = this.x + this.width / 2;
            const by = this.y + this.height - 5;
            const f = this.facing;
            
            // Wheels
            Utils.drawCircle(ctx, bx - 35 * f, by, 12, '#111', 5);
            Utils.drawCircle(ctx, bx + 35 * f, by, 12, '#111', 5);
            
            // Car Body (Open car/Convertible)
            ctx.fillStyle = '#333';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(bx - 55 * f, by - 5);
            ctx.lineTo(bx - 50 * f, by - 25); // Back
            ctx.lineTo(bx - 10 * f, by - 25); // Seat area start
            ctx.lineTo(bx + 20 * f, by - 25); // Front of cabin
            ctx.lineTo(bx + 35 * f, by - 40); // Windshield top
            ctx.lineTo(bx + 40 * f, by - 25); // Hood start
            ctx.lineTo(bx + 60 * f, by - 25); // Front nose
            ctx.lineTo(bx + 65 * f, by - 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Headlight
            Utils.drawCircle(ctx, bx + 62 * f, by - 18, 5, 'white', 15);

            // Stickman (Driving sitting)
            const hx = bx - 25 * f, hy = this.y + 18;
            Utils.drawCircle(ctx, hx, hy, 8, 'white', 4);
            Utils.drawLine(ctx, hx, hy + 8, bx - 20 * f, by - 15, 3, 'white', 0); // Torso
            Utils.drawLine(ctx, bx - 20 * f, by - 15, bx + 10 * f, by - 15, 3, 'white', 0); // Lap
            Utils.drawLine(ctx, hx, hy + 12, bx + 15 * f, by - 30, 2, 'white', 0); // Arms to steering wheel
            Utils.drawLine(ctx, bx + 10 * f, by - 35, bx + 20 * f, by - 25, 3, '#111', 0); // Steering wheel

            ctx.restore();
        } else super.draw(ctx);
    }
}
