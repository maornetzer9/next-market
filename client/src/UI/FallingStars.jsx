import React, { useEffect, useRef } from "react";

const canvasStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1, // Ensure it's behind other elements
    backgroundColor: 'black', // Temporary background to check visibility
};

const FallingStars = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error('2D context not available!');
            return;
        }

        const stars = Array.from({ length: 100 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 2,
            speed: Math.random() * 2 + 0.5,
        }));

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const drawStars = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.beginPath();
            stars.forEach((star) => {
                ctx.moveTo(star.x, star.y);
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            });
            ctx.fill();
        };

        const updateStars = () => {
            stars.forEach((star) => {
                star.y += star.speed;
                if (star.y > canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * canvas.width;
                }
            });
        };

        const animate = () => {
            drawStars();
            updateStars();
            requestAnimationFrame(animate);
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
        };
    }, []);

    return <canvas ref={canvasRef} style={canvasStyle}></canvas>;
};

export default FallingStars;
