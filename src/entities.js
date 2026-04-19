class Entity {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isPlayer = isPlayer;
        
        this.width = 30;  // Reduced size from 40
        this.height = 60; // Reduced size from 80
        this.velX = 0;
        this.velY = 0;
        this.speed = 4.5; // Slightly tuned speed
        this.jumpForce = -14;
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

        // Skill-specific states
        this.skills = {
            sonicDash: false,
            doubleJump: false,
            powerWave: false,
            berserk: false
        };
        this.berserkTimer = 0;
        this.activeProjectiles = [];

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

        // Screen Boundary Clamping (Don't go off-screen)
        if (this.x < 0) {
            this.x = 0;
            this.velX = 0;
        } else if (this.x + this.width > window.innerWidth) {
            this.x = window.innerWidth - this.width;
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
        const bodyCenterY = this.y + 25; 
        let saberEnd = { x: headX, y: bodyCenterY };
        
        if (this.isAttacking) {
            const progress = 1 - (this.attackTimer / this.attackDuration);
            const p = progress;
            
            if (this.isAirSpin) {
                const angle = p * Math.PI * 2 * this.facing;
                saberEnd.x = headX + Math.cos(angle) * 55; 
                saberEnd.y = bodyCenterY + Math.sin(angle) * 55;
            }
            else if (this.combo === 1) { 
                const angle = Utils.lerp(-Math.PI * 0.7, Math.PI * 0.7, p);
                saberEnd.x = headX + Math.cos(angle) * 55 * this.facing;
                saberEnd.y = bodyCenterY + Math.sin(angle) * 15;
            } 
            else if (this.combo === 2) { 
                const angle = Utils.lerp(-Math.PI * 0.8, -Math.PI * 0.2, p);
                saberEnd.x = headX + Math.cos(angle) * 25 * this.facing + (p * 30 * this.facing);
                saberEnd.y = bodyCenterY + Math.sin(angle) * 60 + (p * 15);
            } 
            else { 
                const thrust = Utils.lerp(10, 65, p);
                saberEnd.x = headX + thrust * this.facing;
                saberEnd.y = bodyCenterY + (Math.sin(p * 10) * 4);
            }
        }

        this.trail.unshift({ x: saberEnd.x, y: saberEnd.y });
        if (this.trail.length > this.maxTrail) this.trail.pop();
    }

    draw(ctx) {
        const headX = this.x + this.width / 2;
        const headY = this.y + 12; 
        const bodyCenterY = headY + 15;
        const waistY = bodyCenterY + 18; 
        
        ctx.lineJoin = 'round';
        
        // Berserk effect
        if (this.berserkTimer > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 100, 0, 0.5)';
        }

        // Draw Trails
        if (this.isAttacking || this.trail.length > 2) {
            ctx.save();
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = (1 - (i / this.trail.length)) * 0.7;
                const t1 = this.trail[i];
                const t2 = this.trail[i+1];
                ctx.globalAlpha = alpha;
                Utils.drawLine(ctx, t1.x, t1.y, t2.x, t2.y, 6 - i / 2, this.saberColor, 12);
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
        let armEndX = headX + 12 * this.facing;
        let armEndY = bodyCenterY;

        if (this.isAttacking) {
            if (this.isAirSpin) {
                armEndX = this.trail[0].x;
                armEndY = this.trail[0].y;
            } else if (this.combo === 1) { 
                spineX -= 4 * this.facing;
                armEndX = Utils.lerp(armEndX, this.trail[0].x, 0.4);
                armEndY = Utils.lerp(armEndY, this.trail[0].y, 0.4);
            } else if (this.combo === 2) { 
                poseY += 4;
                armEndX = Utils.lerp(armEndX, this.trail[0].x, 0.4);
                armEndY = Utils.lerp(armEndY, this.trail[0].y, 0.4);
            } else { 
                spineX += 8 * this.facing;
                armEndX = Utils.lerp(armEndX, this.trail[0].x, 0.8);
                armEndY = Utils.lerp(armEndY, this.trail[0].y, 0.8);
            }
        }

        // Head
        Utils.drawCircle(ctx, poseX, poseY, 10, 'white', 4); // Radius 10
        // Spine
        Utils.drawLine(ctx, poseX, poseY + 10, spineX, waistY, 3, 'white', 0);
        // Arms
        Utils.drawLine(ctx, (poseX + spineX)/2, bodyCenterY, armEndX, armEndY, 2, 'white', 0);
        
        // Legs
        if (this.isAirSpin) {
            Utils.drawLine(ctx, spineX, waistY, spineX - 8, waistY + 8, 3, 'white', 0);
            Utils.drawLine(ctx, spineX, waistY, spineX + 8, waistY + 8, 3, 'white', 0);
        } else {
            let legOffset = Math.sin(this.animFrame) * 12;
            if (this.state === 'run') {
                Utils.drawLine(ctx, spineX, waistY, spineX + legOffset * this.facing, waistY + 20, 3, 'white', 0);
                Utils.drawLine(ctx, spineX, waistY, spineX - legOffset * this.facing, waistY + 20, 3, 'white', 0);
            } else {
                Utils.drawLine(ctx, spineX, waistY, spineX + 8, waistY + 20, 3, 'white', 0);
                Utils.drawLine(ctx, spineX, waistY, spineX - 8, waistY + 20, 3, 'white', 0);
            }
        }

        // Final Saber Blade
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
    constructor(x, y) {
        super(x, y, '#00f2ff', true);
    }

    handleInput(input) {
        // Horizontal Movement
        if (input.isLeft()) {
            this.velX = -this.speed;
            this.facing = -1;
            if (this.grounded) this.state = 'run';
        } else if (input.isRight()) {
            this.velX = this.speed;
            this.facing = 1;
            if (this.grounded) this.state = 'run';
        } else if (input.isDown()) {
            this.state = 'crouch';
        } else {
            if (this.grounded && !this.isAttacking) this.state = 'idle';
        }

        // Jumping Logic (including Double Jump)
        if (input.isJump() && !input.prevJump) {
            if (this.grounded) {
                this.velY = this.jumpForce;
                this.jumpCount = 1;
                this.grounded = false;
                this.state = 'jump';
            } else if (this.skills.doubleJump && this.jumpCount < 2) {
                this.velY = this.jumpForce * 0.8;
                this.jumpCount = 2;
                this.state = 'jump';
                // Add a small particle effect for double jump maybe?
            }
        }
        input.prevJump = input.isJump();

        if (input.isAttack()) this.attack();

        // Skill Button Logic
        if (input.isSkill() && this.attackCooldown <= 0) {
            if (this.skills.sonicDash) {
                this.isAttacking = true;
                this.combo = 3; 
                this.attackTimer = 15;
                this.velX = this.facing * 40; 
                this.attackCooldown = 90;
            } else if (this.skills.berserk) {
                this.berserkTimer = 300; // 5 seconds
                this.attackSpeed = 2;
                this.attackCooldown = 600;
            }
        }
    }
}

class Enemy extends Entity {
    constructor(x, y, level, isBoss = false) {
        // Enemies get darker red as they level up
        const shade = Math.min(255, 100 + level * 15);
        const enemyColor = isBoss ? '#bc13fe' : `rgb(${shade}, 0, ${50 - level * 5})`;
        super(x, y, enemyColor, false);
        
        this.level = level;
        this.isBoss = isBoss;
        
        // Exponential HP scaling
        this.maxHp = 50 + Math.pow(level, 1.6) * 15;
        this.hp = this.maxHp;
        
        // Speed scaling
        this.speed = 2 + (level * 0.4);
        
        // Damage scaling
        this.attackDamage = 10 + (level * 4);
        
        // AI aggression
        this.aggression = 0.03 + (level * 0.012);
        this.attackCooldownBase = Math.max(15, 60 - level * 5);
        
        if (isBoss) {
            this.width = 65;
            this.height = 130;
            this.speed = 5.5;
            this.attackDamage = 60;
            this.maxHp = 1500;
            this.hp = this.maxHp;
            this.aggression = 0.1;
            this.saberColor = '#bc13fe';
        }
    }

    updateAI(player) {
        const dx = player.x - this.x;
        const dist = Math.abs(dx);
        
        const closeDist = this.isBoss ? 160 : 110;
        
        if (dist > closeDist) {
            this.velX = Math.sign(dx) * this.speed;
            this.facing = Math.sign(dx);
            this.state = 'run';
        } else {
            this.velX = 0;
            this.facing = Math.sign(dx);
            if (this.grounded && !this.isAttacking) this.state = 'idle';
            
            if (Math.random() < this.aggression && this.attackCooldown <= 0) {
                this.attack();
                this.attackCooldown = this.attackCooldownBase;
            }
        }
        
        // Enemy Jump Logic (Scales with level)
        const jumpChance = 0.005 + (this.level * 0.002);
        if (this.grounded && Math.random() < jumpChance) {
            this.velY = this.jumpForce;
            this.grounded = false;
        }
    }
}
