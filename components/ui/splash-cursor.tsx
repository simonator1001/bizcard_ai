"use client";
import { useEffect, useRef } from "react";

interface SplashCursorProps {
  colorOne?: string;
  colorTwo?: string;
  speed?: number;
}

export function SplashCursor({
  colorOne = "rgba(120, 85, 255, 0.8)",
  colorTwo = "rgba(64, 224, 208, 0.8)",
  speed = 0.01
}: SplashCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log("SplashCursor component mounted");
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles: Particle[] = [];
    let mouseX = width / 2;
    let mouseY = height / 2;
    let lastX = mouseX;
    let lastY = mouseY;

    // Resize canvas to window
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      lastX = mouseX;
      lastY = mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Add a particle on mouse move
      if (Math.abs(mouseX - lastX) > 5 || Math.abs(mouseY - lastY) > 5) {
        addParticlesAtMouse();
      }
    };

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      color: string;
      alpha: number;
      vx: number;
      vy: number;

      constructor(x: number, y: number, size: number, color: string, vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.alpha = 1;
        this.vx = vx;
        this.vy = vy;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.01;
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.size *= 0.97;
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.alpha <= 0) return false;
        
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        return true;
      }
    }

    // Create particles at mouse position
    function addParticlesAtMouse() {
      const dx = mouseX - lastX;
      const dy = mouseY - lastY;
      
      // Add multiple particles between last and current position
      const steps = 3;
      for (let i = 0; i < steps; i++) {
        const x = lastX + (dx * (i / steps));
        const y = lastY + (dy * (i / steps));
        
        const size = Math.random() * 20 + 10;
        const color = Math.random() > 0.5 ? colorOne : colorTwo;
        
        // Add some velocity based on mouse movement
        const vx = (dx / 10) * (Math.random() - 0.5);
        const vy = (dy / 10) * (Math.random() - 0.5);
        
        particles.push(new Particle(x, y, size, color, vx, vy));
      }
    }

    // Initialize particles
    function initParticles() {
      particles = [];
      // Create some initial particles
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 20 + 10;
        const color = Math.random() > 0.5 ? colorOne : colorTwo;
        particles.push(new Particle(x, y, size, color));
      }
    }

    // Animation loop
    function animate() {
      // Using non-null assertion since we already checked above
      if (!context) return;
      
      // Clear with semi-transparent background to create trail effect
      context.fillStyle = "rgba(255, 255, 255, 0.1)";
      context.fillRect(0, 0, width, height);
      
      // Update and draw particles
      particles = particles.filter(particle => {
        particle.update();
        return particle.draw(context);
      });
      
      requestAnimationFrame(animate);
    }

    // Set up canvas and start animation
    canvas.width = width;
    canvas.height = height;
    initParticles();
    animate();

    // Add event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Add some initial particles with movement
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 20 + 10;
      const color = Math.random() > 0.5 ? colorOne : colorTwo;
      const vx = (Math.random() - 0.5) * 2;
      const vy = (Math.random() - 0.5) * 2;
      particles.push(new Particle(x, y, size, color, vx, vy));
    }

    // Clean up
    return () => {
      console.log("SplashCursor component unmounting");
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [colorOne, colorTwo, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1, opacity: 1 }}
    />
  );
}

export default SplashCursor; 