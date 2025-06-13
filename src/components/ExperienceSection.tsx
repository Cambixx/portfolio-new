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
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      // Animación del título y la línea principal
      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        defaults: {
          ease: 'power3.out',
        },
      })

      mainTl
        .fromTo(
          '.experience-title',
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.8 }
        )
        .fromTo(
          '.timeline-line',
          { scaleY: 0 },
          { duration: 1.2, scaleY: 1, ease: 'power2.inOut' },
          '-=0.6'
        )

      // Animación para cada item del timeline
      itemsRef.current.forEach((item, index) => {
        if (!item) return
        
        const isLeft = index % 2 === 0
        const xPercent = isLeft ? -20 : 20

        const itemTl = gsap.timeline({
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          defaults: {
            ease: 'power3.out',
            duration: 0.8,
          },
        })

        // Animación del contenedor principal
        itemTl.fromTo(
          item,
          { xPercent, y: 30, scale: 0.98 },
          { xPercent: 0, y: 0, scale: 1, clearProps: 'all', ease: 'power2.out', force3D: true }
        )

        // Animación del punto
        const dot = item.querySelector('.timeline-dot')
        if (dot) {
          itemTl.fromTo(
            dot,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' },
            '-=0.5'
          )
        }

        // Animación del contenido interno (stagger)
        const contentElements = item.querySelectorAll(
          '.experience-header, .experience-description, .technologies, .achievements'
        )
        itemTl.fromTo(
          contentElements,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out', force3D: true, clearProps: 'all' },
          '-=0.5'
        )
      })
    }, section)

    return () => ctx.revert()
  }, [])

  const experiences = experienceData as ExperienceItem[]

  return (
    <section ref={sectionRef} className="experience-section" id="experiencia">
      <div className="container">
        <div className="title-container">
          <h2 className="experience-title">Mi Experiencia</h2>
          <div className="vertical-line"></div>
        </div>
        
        <div className="timeline-container">
          <div className="timeline-line"></div>
          
          {experiences.map((experience, index) => (
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
                
                <p className="experience-description">{experience.description}</p>
                
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