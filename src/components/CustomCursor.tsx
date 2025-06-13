import { useEffect, useRef, useState } from 'react';
import '../styles/cursor.scss';

const POINTER_SELECTORS = 'a, button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"]), .project-card';

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const cursorPosition = useRef({ x: 0, y: 0 });
  const isPointer = useRef(false);
  const isHidden = useRef(false);
  const isClicking = useRef(false);
  const animationFrameId = useRef<number | null>(null);
  const [_, forceUpdate] = useState<number>(0); // Para forzar re-render

  // Helpers para forzar re-render solo cuando cambia el estado visual
  const updateVisual = () => forceUpdate((v: number) => v + 1);

  // Guardar listeners para poder quitarlos
  const pointerListeners = useRef<(() => void)[]>([]);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const animateCursor = () => {
      const smoothing = 0.35;
      const dx = mousePosition.current.x - cursorPosition.current.x;
      const dy = mousePosition.current.y - cursorPosition.current.y;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        cursorPosition.current = { ...mousePosition.current };
      } else {
        cursorPosition.current.x += dx * smoothing;
        cursorPosition.current.y += dy * smoothing;
      }
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cursorPosition.current.x}px, ${cursorPosition.current.y}px, 0) translate(-50%, -50%)`;
        // Actualizar clases visuales
        cursorRef.current.classList.toggle('pointer', isPointer.current);
        cursorRef.current.classList.toggle('hidden', isHidden.current);
        cursorRef.current.classList.toggle('clicking', isClicking.current);
      }
      animationFrameId.current = requestAnimationFrame(animateCursor);
    };

    const handleMouseDown = () => {
      isClicking.current = true;
      updateVisual();
    };
    const handleMouseUp = () => {
      isClicking.current = false;
      updateVisual();
    };

    // Limpia listeners previos
    const cleanupPointerListeners = () => {
      pointerListeners.current.forEach((remove) => remove());
      pointerListeners.current = [];
    };

    // Solo añade listeners a nuevos elementos
    const handlePointerElements = () => {
      cleanupPointerListeners();
      const elements = document.querySelectorAll(POINTER_SELECTORS);
      elements.forEach((el) => {
        const enter = () => {
          isPointer.current = true;
          updateVisual();
        };
        const leave = () => {
          isPointer.current = false;
          updateVisual();
        };
        el.addEventListener('mouseenter', enter);
        el.addEventListener('mouseleave', leave);
        pointerListeners.current.push(() => {
          el.removeEventListener('mouseenter', enter);
          el.removeEventListener('mouseleave', leave);
        });
      });
    };

    const handleMouseLeave = () => {
      isHidden.current = true;
      updateVisual();
    };
    const handleMouseEnter = (e: MouseEvent) => {
      isHidden.current = false;
      mousePosition.current = { x: e.clientX, y: e.clientY };
      cursorPosition.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
      updateVisual();
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    handlePointerElements();

    animationFrameId.current = requestAnimationFrame(animateCursor);

    const observer = new MutationObserver((mutations) => {
      // Solo añadir listeners a nodos nuevos
      let shouldUpdate = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) shouldUpdate = true;
      });
      if (shouldUpdate) handlePointerElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      observer.disconnect();
      cleanupPointerListeners();
    };
  }, []);

  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    return null;
  }

  return (
    <div ref={cursorRef} className="custom-cursor">
      <div className="cursor-dot"></div>
    </div>
  );
};

export default CustomCursor; 