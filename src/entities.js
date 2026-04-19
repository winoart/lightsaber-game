class Entity {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isPlayer = isPlayer;
        
        // Further reduced size for better mobile feel
        this.width = 25;  
        this.height = 50; 
        
        this.velX = 0;
        this.velY = 0;
        this.speed = 4.2; 
        this.jumpForce = -13;
        this.maxJumps = 1;
        this.jumpCount = 0;
        this.grounded = false;
        
        this.maxHp = 100;
        this.hp = 100;
        this.attackDamage = 15;
        this.attackSpeed = 1; 
        
        this.state = 'idle'; 
        this.facing = 1; 
        this.animFrame = 0;
        
        this.combo = 0;
        this.comboTimer = 0;
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.isAirSpin = false;
        this.attackDuration = 18; 
        this.attackTimer = 0;

        this.skills = { sonicDash: false, doubleJump: false, powerWave: false, berserk: false };
        this.berserkTimer = 0;
        this.trail = [];
        this.maxTrail = 12;
        this.saberColor = isPlayer ? '#00f2ff' : '#ff0055';
    }

    update(gravity) {
        this.velY += gravity;
        this.x += this.velX;
        this.y += this.velY;
        this.velX *= 0.85;

        // Ground collision
        const floorY = window.innerHeight - 150;
        if (this.y + this.height > floorY) {
            this.y = floorY - this.height;
            this.velY = 0;
            this.grounded = true;
            this.jumpCount = 0;
            this.isAirSpin = false;
        } else {
            this.grounded = false;
        }

        // IMPROVED Screen Boundary Clamping
        if (this.x < 5) { // 5px margin
            this.x = 5;
            this.velX = 0;
        } else if (this.x + this.width > window.innerWidth - 5) {
            this.x = window.innerWidth - this.width - 5;
            this.velX = 0;
        }

        this.animFrame += 0.15;
        
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.isAirSpin = false;
                if (!this.grounded) this.state = 'jump';
                else this.state = 'idle';
            }
        }

        if (this.comboTimer > 0) this.comboTimer--;
        else if (!this.isAttacking) this.combo = 0;

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.berserkTimer > 0) {
            this.berserkTimer--;
            if (this.berserkTimer <= 0) this.attackSpeed = 1;
        }

        this.updateTrail();
    }

    updateTrail() {
        const headX = this.x + this.width / 2;
        const bodyCenterY = this.y + 20; // Corrected for 50px height
        let saberEnd = { x: headX, y: bodyCenterY };
        
        if (this.isAttacking) {
            const p = 1 - (this.attackTimer / this.attackDuration);
            
            if (this.isAirSpin) {
                const angle = p * Math.PI * 2 * this.facing;
                saberEnd.x = headX + Math.cos(angle) * 50; 
                saberEnd.y = bodyCenterY + Math.sin(angle) * 50;
            }
            else if (this.combo === 1) { 
                const angle = Utils.lerp(-Math.PI * 0.7, Math.PI * 0.7, p);
                saberEnd.x = headX + Math.cos(angle) * 50 * this.facing;
                saberEnd.y = bodyCenterY + Math.sin(angle) * 12;
            } 
            else if (this.combo === 2) { 
                const angle = Utils.lerp(-Math.PI * 0.8, -Math.PI * 0.2, p);
                saberEnd.x = headX + Math.cos(angle) * 20 * this.facing + (p * 25 * this.facing);
                saberEnd.y = bodyCenterY + Math.sin(angle) * 60 + (p * 15);
            } 
            else { 
                const thrust = Utils.lerp(10, 60, p);
                saberEnd.x = headX + thrust * this.facing;
                saberEnd.y = bodyCenterY + (Math.sin(p * 10) * 3);
            }
        }

        this.trail.unshift({ x: saberEnd.x, y: saberEnd.y });
        if (this.trail.length > this.maxTrail) this.trail.pop();
    }

    getSaberTip() {
        return this.trail[0] || { x: this.x + this.width / 2, y: this.y + 25 };
    }

    draw(ctx) {
        const headX = this.x + this.width / 2;
        const headY = this.y + 10; 
        const bodyCenterY = headY + 12;
        const waistY = bodyCenterY + 15; 
        
        ctx.lineJoin = 'round';
        
        if (this.berserkTimer > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 100, 0, 0.5)';
        }

        if (this.isAttacking || this.trail.length > 2) {
            ctx.save();
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = (1 - (i / this.trail.length)) * 0.7;
                const t1 = this.trail[i];
                const t2 = this.trail[i+1];
                ctx.globalAlpha = alpha;
                Utils.drawLine(ctx, t1.x, t1.y, t2.x, t2.y, 5 - i / 2, this.saberColor, 12);
            }
            ctx.restore();
        }

        ctx.save();
        if (this.isAirSpin) {
            const p = 1 - (this.attackTimer / this.attackDuration);
            ctx.translate(headX, bodyCenterY);
            ctx.rotate(p * Math.PI * 2 * this.facing);
            ctx.translate(-headX, -bodyCenterY);
        }

        let poseX = headX;
        let poseY = headY;
        let spineX = headX;
        let armEndX = headX + 10 * this.facing;
        let armEndY = bodyCenterY;

        if (this.isAttacking) {
            if (this.isAirSpin) {
                armEndX = this.trail[0].x;
                armEndY = this.trail[0].y;
            } else if (this.combo === 1) { 
                spineX -= 3 * this.facing;
                armEndX = Utils.lerp(armEndX, this.trail[0].x, 0.4);
                armEndY = Utils.lerp(armEndY, this.trail[0].y, 0.4);
            } else if (this.combo === 2) { 
                poseY += 3;
                armEndX = Utils.lerp(armEndX, this.trail[0].x, 0.4);
                armEndY = Utils.lerp(armEndY, this.trail[0].y, 0.4);
            } else { 
                spineX += 6 * this.facing;
                armEndX = Utils.lerp(armEndX, this.trail[0].x, 0.8);
                armEndY = Utils.lerp(armEndY, this.trail[0].y, 0.8);
            }
        }

        // Head
        Utils.drawCircle(ctx, poseX, poseY, 8, 'white', 4); 
        // Spine
        Utils.drawLine(ctx, poseX, poseY + 8, spineX, waistY, 3, 'white', 0);
        // Arms
        Utils.drawLine(ctx, (poseX + spineX)/2, bodyCenterY, armEndX, armEndY, 2, 'white', 0);
        
        // Legs
        if (this.isAirSpin) {
            Utils.drawLine(ctx, spineX, waistY, spineX - 6, waistY + 6, 3, 'white', 0);
            Utils.drawLine(ctx, spineX, waistY, spineX + 6, waistY + 6, 3, 'white', 0);
        } else {
            let legOffset = Math.sin(this.animFrame) * 10;
            if (this.state === 'run') {
                Utils.drawLine(ctx, spineX, waistY, spineX + legOffset * this.facing, waistY + 16, 3, 'white', 0);
                Utils.drawLine(ctx, spineX, waistY, spineX - legOffset * this.facing, waistY + 16, 3, 'white', 0);
            } else {
                Utils.drawLine(ctx, spineX, waistY, spineX + 6, waistY + 16, 3, 'white', 0);
                Utils.drawLine(ctx, spineX, waistY, spineX - 6, waistY + 16, 3, 'white', 0);
            }
        }

        const saberEnd = this.trail[0] || { x: headX, y: bodyCenterY };
        Utils.drawLine(ctx, armEndX, armEndY, saberEnd.x, saberEnd.y, 3, this.saberColor, 15);
        ctx.restore();
    }

    attack() {
        if (this.attackCooldown > 0) return;
        this.isAttacking = true;
        
        if (!this.grounded) {
            this.isAirSpin = true;
            this.attackDuration = 20 / this.attackSpeed;
        } else {
            this.isAirSpin = false;
            this.combo = (this.combo % 3) + 1;
            this.attackDuration = 18 / this.attackSpeed;
            this.comboTimer = 45;
        }

        this.state = 'attack';
        this.attackTimer = this.attackDuration;
        this.attackCooldown = 12 / this.attackSpeed;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.state = 'hit';
        setTimeout(() => { if (this.state === 'hit') this.state = 'idle'; }, 200);
    }
}

class Player extends Entity {
    constructor(x, y) { super(x, y, '#00f2ff', true); }
    handleInput(input) {
        if (input.isLeft()) { this.velX = -this.speed; this.facing = -1; if (this.grounded) this.state = 'run'; }
        else if (input.isRight()) { this.velX = this.speed; this.facing = 1; if (this.grounded) this.state = 'run'; }
        else if (input.isDown()) { this.state = 'crouch'; }
        else { if (this.grounded && !this.isAttacking) this.state = 'idle'; }

        if (input.isJump() && !input.prevJump) {
            if (this.grounded) { this.velY = this.jumpForce; this.jumpCount = 1; this.grounded = false; this.state = 'jump'; }
            else if (this.skills.doubleJump && this.jumpCount < 2) { this.velY = this.jumpForce * 0.8; this.jumpCount = 2; this.state = 'jump'; }
        }
        input.prevJump = input.isJump();
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
        const enemyColor = isBoss ? '#bc13fe' : `rgb(${shade}, 0, ${50 - level * 5})`;
        super(x, y, enemyColor, false);
        this.level = level;
        this.isBoss = isBoss;
        this.onMotorcycle = false;
        this.maxHp = 50 + Math.pow(level, 1.6) * 15;
        this.hp = this.maxHp;
        this.speed = 2 + (level * 0.35);
        this.attackDamage = 10 + (level * 4);
        this.aggression = 0.03 + (level * 0.012);
        this.attackCooldownBase = Math.max(15, 60 - level * 5);
        if (isBoss) { this.width = 50; this.height = 100; this.speed = 4.5; this.attackDamage = 60; this.maxHp = 1500; this.hp = this.maxHp; this.aggression = 0.1; this.saberColor = '#bc13fe'; }
    }

    updateAI(player) {
        if (this.onMotorcycle) return; // Don't move via AI while on bike
        const dx = player.x - this.x;
        const dist = Math.abs(dx);
        const closeDist = this.isBoss ? 140 : 100;
        if (dist > closeDist) { this.velX = Math.sign(dx) * this.speed; this.facing = Math.sign(dx); this.state = 'run'; }
        else {
            this.velX = 0; this.facing = Math.sign(dx);
            if (this.grounded && !this.isAttacking) this.state = 'idle';
            if (Math.random() < this.aggression && this.attackCooldown <= 0) { this.attack(); this.attackCooldown = this.attackCooldownBase; }
        }
        const jumpChance = 0.005 + (this.level * 0.002);
        if (this.grounded && Math.random() < jumpChance) { this.velY = this.jumpForce; this.grounded = false; }
    }

    draw(ctx) {
        if (this.onMotorcycle) {
            ctx.save();
            // Simple Neon Motorcycle
            const bx = this.x;
            const by = this.y + this.height - 10;
            // Wheels
            Utils.drawCircle(ctx, bx - 10, by, 12, '#111', 5);
            Utils.drawCircle(ctx, bx + 35, by, 12, '#111', 5);
            // Frame
            Utils.drawLine(ctx, bx - 10, by, bx + 35, by, 4, '#222', 0);
            Utils.drawLine(ctx, bx + 15, by - 20, bx + 35, by, 4, '#222', 0);
            Utils.drawLine(ctx, bx + 15, by - 20, bx - 5, by, 4, '#222', 0);
            // Neon
            Utils.drawLine(ctx, bx - 10, by, bx + 35, by, 2, this.color, 12);
            ctx.restore();
            
            // Sitting sitting pose
            const hx = this.x + this.width / 2;
            const hy = this.y + 12;
            Utils.drawCircle(ctx, hx, hy, 8, 'white', 4);
            Utils.drawLine(ctx, hx, hy + 8, hx - 4, hy + 22, 3, 'white', 0); // Spine
            Utils.drawLine(ctx, hx - 4, hy + 22, hx + 10, hy + 35, 3, 'white', 0); // Leg
            Utils.drawLine(ctx, hx - 2, hy + 14, hx + 12, hy + 22, 2, 'white', 0); // Arm
        } else {
            super.draw(ctx);
        }
    }
}
