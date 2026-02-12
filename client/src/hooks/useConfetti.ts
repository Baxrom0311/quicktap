import { useCallback, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    life: number;
}

const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DFE6E9', '#E056FF', '#00D2FF',
    '#FFD93D', '#FF6348', '#7BED9F', '#70A1FF',
];

export function useConfetti() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animFrameRef = useRef<number>(0);

    const fire = useCallback(() => {
        // Create canvas overlay if not exists
        let canvas = canvasRef.current;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            document.body.appendChild(canvas);
            canvasRef.current = canvas;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Generate particles
        const particles: Particle[] = [];
        const count = 80;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 20,
                vy: -Math.random() * 18 - 5,
                size: Math.random() * 8 + 4,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15,
                life: 1,
            });
        }

        const gravity = 0.4;
        const decay = 0.012;

        const animate = () => {
            ctx.clearRect(0, 0, canvas!.width, canvas!.height);

            let alive = false;
            for (const p of particles) {
                if (p.life <= 0) continue;
                alive = true;

                p.vy += gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;
                p.life -= decay;

                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            }

            if (alive) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                // Cleanup
                ctx.clearRect(0, 0, canvas!.width, canvas!.height);
                canvas!.remove();
                canvasRef.current = null;
            }
        };

        cancelAnimationFrame(animFrameRef.current);
        animate();
    }, []);

    return { fire };
}
