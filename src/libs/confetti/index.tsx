import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface ConfettiPiece {
  x: number;
  y: number;
  rotation: number;
  color: string;
  scale: number;
  velocity: { x: number; y: number };
  rotationSpeed: number;
}

const COLORS = ["#ff718d", "#fdff6a", "#45ff94", "#5cc9ff", "#ba94ff"];

export const Confetti: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const confettiPieces = React.useRef<ConfettiPiece[]>([]);
  const animationFrameId = React.useRef<number>(null);

  const createConfettiPiece = useCallback((): ConfettiPiece => {
    if (typeof window === "undefined") return {} as ConfettiPiece;

    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      scale: 0.8 + Math.random() * 0.4,
      velocity: {
        x: (Math.random() - 0.5) * 3,
        y: 1 + Math.random() * 5,
      },
      rotationSpeed: (Math.random() - 0.5) * 2,
    };
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiPieces.current.forEach((piece, index) => {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate((piece.rotation * Math.PI) / 180);
      ctx.scale(piece.scale, piece.scale);

      // Draw confetti piece (rectangle)
      ctx.fillStyle = piece.color;
      ctx.fillRect(-5, -5, 10, 10);

      ctx.restore();

      // Update position
      piece.x += piece.velocity.x;
      piece.y += piece.velocity.y;
      piece.rotation += piece.rotationSpeed;

      // Remove pieces that have fallen off screen
      if (piece.y > canvas.height + 20) {
        confettiPieces.current.splice(index, 1);
      }
    });

    // Add new pieces if needed
    if (confettiPieces.current.length < 200) {
      confettiPieces.current.push(createConfettiPiece());
    }

    animationFrameId.current = requestAnimationFrame(animate);
  }, [createConfettiPiece]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animate]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />,
    document.body
  );
};
