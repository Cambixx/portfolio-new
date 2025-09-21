import { useState, useEffect } from 'react';

interface SectionInfo {
  id: string;
  element: Element;
  top: number;
  bottom: number;
}

export const useActiveSection = () => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const sections: SectionInfo[] = [];
    
    // Definir las secciones en orden
    const sectionSelectors = [
      '.hero',
      '.about-section',
      '.skills-section', 
      '.experience-section',
      '.projects-section',
      '.contact-section'
    ];

    const updateSections = () => {
      sections.length = 0;
      sectionSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          const bottom = top + rect.height;
          
          sections.push({
            id: selector.replace('.', '').replace('-section', ''),
            element,
            top,
            bottom
          });
        }
      });
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calcular progreso general del scroll
      const totalScrollable = documentHeight - windowHeight;
      const currentProgress = Math.min(scrollY / totalScrollable, 1);
      setScrollProgress(currentProgress);

      // Determinar sección activa
      const viewportCenter = scrollY + windowHeight / 2;
      
      let currentActiveSection = 'hero';
      
      for (const section of sections) {
        // Una sección está activa si el centro del viewport está dentro de ella
        // o si estamos cerca del final del documento
        if (viewportCenter >= section.top && viewportCenter <= section.bottom) {
          currentActiveSection = section.id;
          break;
        }
        
        // Caso especial para la última sección
        if (section.id === 'contact' && scrollY + windowHeight >= documentHeight - 100) {
          currentActiveSection = 'contact';
          break;
        }
      }
      
      setActiveSection(currentActiveSection);
    };

    // Inicializar secciones
    updateSections();
    
    // Configurar listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateSections, { passive: true });
    
    // Llamar una vez para establecer el estado inicial
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateSections);
    };
  }, []);

  return { activeSection, scrollProgress };
};