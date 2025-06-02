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

    // Configurar animación del título
    gsap.fromTo(
      '.experience-title',
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    )

    // Animación de la línea principal del timeline
    gsap.fromTo(
      '.timeline-line',
      {
        scaleY: 0,
      },
      {
        scaleY: 1,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: timeline,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    )

    // Animación de cada elemento del timeline
    items.forEach((item, index) => {
      if (!item) return

      const isLeft = index % 2 === 0
      const xOffset = isLeft ? -100 : 100

      // Animación de entrada
      gsap.fromTo(
        item,
        {
          opacity: 0,
          x: xOffset,
          y: 30,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      // Animación del punto del timeline
      const dot = item.querySelector('.timeline-dot')
      if (dot) {
        gsap.fromTo(
          dot,
          {
            scale: 0,
            opacity: 0,
          },
          {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      // Animación de las tecnologías
      const techs = item.querySelectorAll('.tech-tag')
      gsap.fromTo(
        techs,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: item,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      // Animación de los logros
      const achievements = item.querySelectorAll('.achievement-item')
      gsap.fromTo(
        achievements,
        {
          opacity: 0,
          x: -20,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: item,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    })

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <section ref={sectionRef} className="experience-section" id="experiencia">
      <div className="container">
        <h2 className="experience-title">Mi Experiencia</h2>
        
        <div ref={timelineRef} className="timeline-container">
          <div className="timeline-line"></div>
          
          {experienceData.map((experience: ExperienceItem, index) => (
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