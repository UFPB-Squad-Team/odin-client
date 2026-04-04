"use client";

import { useEffect, useRef } from "react";

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const MAX_DISTANCE = 140;
const MOUSE_INFLUENCE_DISTANCE = 180;

export function InteractiveNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let animationFrame: number | null = null;

    const mouse = {
      x: 0,
      y: 0,
      active: false,
    };

    let nodes: NodePoint[] = [];

    const getNodeCount = () => {
      const area = width * height;
      return Math.max(24, Math.min(56, Math.floor(area / 22000)));
    };

    const createNodes = () => {
      const count = getNodeCount();
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }));
    };

    const setCanvasSize = () => {
      width = container.clientWidth;
      height = container.clientHeight;

      if (width === 0 || height === 0) {
        return false;
      }

      dpr = Math.max(1, window.devicePixelRatio || 1);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createNodes();
      return true;
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const relativeY = event.clientY - rect.top;

      mouse.active =
        relativeX >= 0 &&
        relativeX <= rect.width &&
        relativeY >= 0 &&
        relativeY <= rect.height;

      if (mouse.active) {
        mouse.x = relativeX;
        mouse.y = relativeY;
      }
    };

    const onMouseLeave = () => {
      mouse.active = false;
    };

    const drawFrame = () => {
      context.clearRect(0, 0, width, height);

      if (width === 0 || height === 0 || nodes.length === 0) {
        animationFrame = window.requestAnimationFrame(drawFrame);
        return;
      }

      // Update node positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x <= 0 || node.x >= width) {
          node.vx *= -1;
        }

        if (node.y <= 0 || node.y >= height) {
          node.vy *= -1;
        }
      }

      // Draw connections between nearby nodes
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < MAX_DISTANCE) {
            const opacity = 1 - distance / MAX_DISTANCE;
            context.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.35})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      // Draw nodes and mouse interactions
      for (const node of nodes) {
        let radius = 2.1;
        let alpha = 0.65;

        if (mouse.active) {
          const mdx = node.x - mouse.x;
          const mdy = node.y - mouse.y;
          const mouseDistance = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mouseDistance < MOUSE_INFLUENCE_DISTANCE) {
            const force = 1 - mouseDistance / MOUSE_INFLUENCE_DISTANCE;
            alpha = 0.65 + force * 0.35;
            radius = 2.1 + force * 1.8;

            context.strokeStyle = `rgba(139, 92, 246, ${force * 0.35})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(node.x, node.y);
            context.lineTo(mouse.x, mouse.y);
            context.stroke();
          }
        }

        context.beginPath();
        context.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        context.fill();
      }

      if (!reduceMotion) {
        animationFrame = window.requestAnimationFrame(drawFrame);
      }
    };

    const boot = () => {
      const ready = setCanvasSize();
      if (!ready) {
        animationFrame = window.requestAnimationFrame(boot);
        return;
      }

      if (!reduceMotion) {
        animationFrame = window.requestAnimationFrame(drawFrame);
      } else {
        drawFrame();
      }
    };

    animationFrame = window.requestAnimationFrame(() => {
      animationFrame = window.requestAnimationFrame(boot);
    });

    const resizeObserver = new ResizeObserver(() => {
      setCanvasSize();
    });

    resizeObserver.observe(container);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseout", onMouseLeave, { passive: true });

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 w-full h-full"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(34,211,238,0.24),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.22),transparent_45%)] dark:bg-[radial-gradient(circle_at_20%_25%,rgba(34,211,238,0.32),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.30),transparent_45%)]" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-95 dark:opacity-100"
        aria-hidden
      />
    </div>
  );
}
