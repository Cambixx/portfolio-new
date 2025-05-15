import { useEffect, useState, useRef } from 'react';
import '../styles/cursor.scss';

const CustomCursor = () => {
  // Referencias para la posición actual y objetivo
  const cursorRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const cursorPosition = useRef({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const animationFrameId = useRef<number | null>(null);
  
  useEffect(() => {
    // Función para actualizar la posición del mouse
    const updateMousePosition = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
    };

    // Animación fluida del cursor
    const animateCursor = () => {
      // Factor de suavizado aumentado para menor retraso (antes era 0.15)
      const smoothing = 0.35;
      
      // Calcular la nueva posición con interpolación suave
      const dx = mousePosition.current.x - cursorPosition.current.x;
      const dy = mousePosition.current.y - cursorPosition.current.y;
      
      // Si el movimiento es muy pequeño, hacerlo instantáneo
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        cursorPosition.current = {...mousePosition.current};
      } else {
        cursorPosition.current.x += dx * smoothing;
        cursorPosition.current.y += dy * smoothing;
      }
      
      // Aplicar la nueva posición usando transform para mejor rendimiento
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cursorPosition.current.x}px, ${cursorPosition.current.y}px, 0) translate(-50%, -50%)`;
      }
      
      // Continuar la animación
      animationFrameId.current = requestAnimationFrame(animateCursor);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    
    const handlePointerElements = () => {
      // Añadir .project-card a los selectores para que también activen el estado de puntero
      const elements = document.querySelectorAll(
        'a, button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"]), .project-card'
      );
      
      elements.forEach(el => {
        el.addEventListener('mouseenter', () => setIsPointer(true));
        el.addEventListener('mouseleave', () => setIsPointer(false));
      });
    };
    
    const handleMouseLeave = () => setIsHidden(true);
    const handleMouseEnter = (e: MouseEvent) => {
      setIsHidden(false);
      // Actualizar tanto la posición del mouse como la posición actual del cursor
      mousePosition.current = { x: e.clientX, y: e.clientY };
      cursorPosition.current = { x: e.clientX, y: e.clientY };
      
      // Actualizar la posición inmediatamente
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };
    
    // Inicializar eventos
    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    // Detectar elementos con puntero
    handlePointerElements();
    
    // Iniciar la animación
    animationFrameId.current = requestAnimationFrame(animateCursor);
    
    // Observar nuevos elementos interactivos
    const observer = new MutationObserver(handlePointerElements);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Limpieza al desmontar
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
    };
  }, []);
  
  // Solo mostramos el cursor personalizado en escritorio
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    return null;
  }
  
  return (
    <div 
      ref={cursorRef}
      className={`custom-cursor ${isPointer ? 'pointer' : ''} ${isHidden ? 'hidden' : ''} ${isClicking ? 'clicking' : ''}`}
    >
      <div className="cursor-dot"></div>
    </div>
  );
};

export default CustomCursor; 