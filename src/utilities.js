const Utils = {
    // Handle High DPI displays
    setupCanvas: (canvas) => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return ctx;
    },

    // Drawing helpers with glow
    drawCircle: (ctx, x, y, r, color, glow) => {
        ctx.save();
        if (glow) {
            ctx.shadowBlur = glow;
            ctx.shadowColor = color;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    drawLine: (ctx, x1, y1, x2, y2, width, color, glow) => {
        ctx.save();
        if (glow) {
            ctx.shadowBlur = glow;
            ctx.shadowColor = color;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    },

    lerp: (a, b, t) => a + (b - a) * t,

    checkCollision: (rect1, rect2) => {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
};
