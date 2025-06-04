import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import experienceData from '../data/experience.json'
import '../styles/ExperienceSection.scss'

gsap.registerPlugin(ScrollTrigger)

interface ExperienceItem {
  id: string
  title: string
  company: string
  period: string
  description: string
  technologies: string[]
  achievements: string[]
}

const ExperienceSection = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    const timeline = timelineRef.current
    const items = itemsRef.current

    if (!section || !timeline || !items.length) return

    // Crear un contexto GSAP para mejor limpieza
    const ctx = gsap.context(() => {
      // Batch de animaciones para mejor rendimiento
      const tl = gsap.timeline({
        defaults: {
          ease: "power2.out",
          duration: 0.8
        },
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      // Animación del título
      tl.fromTo(
        '.experience-title',
        {
          opacity: 0,
          y: 30
        },
        {
          opacity: 1,
          y: 0
        }
      );

      // Animación de la línea principal del timeline
      tl.fromTo(
        '.timeline-line',
        {
          scaleY: 0,
          transformOrigin: 'top'
        },
        {
          scaleY: 1,
          duration: 1
        },
        "-=0.4"
      );

      // Batch de animaciones para los items
      items.forEach((item, index) => {
        if (!item) return

        const isLeft = index % 2 === 0
        const xOffset = isLeft ? -50 : 50

        const itemTl = gsap.timeline({
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        });

        // Animación del contenido principal
        itemTl.fromTo(
          item,
          {
            opacity: 0,
            x: xOffset,
            y: 20
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.6,
            clearProps: "transform" // Liberar recursos después de la animación
          }
        );

        // Animación del punto con will-change optimizado
        const dot = item.querySelector('.timeline-dot')
        if (dot) {
          gsap.set(dot, { willChange: "transform" });
          itemTl.fromTo(
            dot,
            {
              scale: 0,
              opacity: 0
            },
            {
              scale: 1,
              opacity: 1,
              duration: 0.4,
              ease: "back.out(1.7)",
              onComplete: () => {
                gsap.set(dot, { willChange: "auto" });
              }
            },
            "-=0.3"
          );
        }

        // Batch de animaciones para tecnologías y logros
        const elements = [
          ...item.querySelectorAll('.tech-tag'),
          ...item.querySelectorAll('.achievement-item')
        ];

        if (elements.length) {
          itemTl.fromTo(
            elements,
            {
              opacity: 0,
              y: 10
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.3,
              stagger: 0.05,
              clearProps: "transform"
            },
            "-=0.2"
          );
        }
      });
    }, section);

    return () => {
      ctx.revert(); // Limpieza más eficiente
    }
  }, [])

  const experiences = experienceData as ExperienceItem[]

  return (
    <section ref={sectionRef} className="experience-section" id="experiencia">
      <div className="container">
        <h2 className="experience-title">Mi Experiencia</h2>
        
        <div ref={timelineRef} className="timeline-container">
          <div className="timeline-line"></div>
          
          {experiences.map((experience, index: number) => (
            <div
              key={experience.id}
              ref={el => {
                itemsRef.current[index] = el
              }}
              className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}
            >
              <div className="timeline-dot"></div>
              
              <div className="timeline-content">
                <div className="experience-header">
                  <h3 className="experience-title-job">{experience.title}</h3>
                  <h4 className="experience-company">{experience.company}</h4>
                  <span className="experience-period">{experience.period}</span>
                </div>
                
                <p className="experience-description">
                  {experience.description}
                </p>
                
                <div className="technologies">
                  <h5>Tecnologías:</h5>
                  <div className="tech-tags">
                    {experience.technologies.map((tech, techIndex) => (
                      <span key={techIndex} className="tech-tag">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="achievements">
                  <h5>Logros destacados:</h5>
                  <ul className="achievements-list">
                    {experience.achievements.map((achievement, achievementIndex) => (
                      <li key={achievementIndex} className="achievement-item">
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ExperienceSection 