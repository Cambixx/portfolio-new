import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import '../styles/contact.scss';

gsap.registerPlugin(ScrollTrigger);

const ContactSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !titleRef.current) return;

    const section = sectionRef.current;
    const title = titleRef.current;

    // Animación del título
    gsap.fromTo(title,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: section,
          start: "top center",
          end: "top 20%",
          scrub: 1
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="contact-section">
      <div className="contact-container">
        <div className="title-container">
          <h2 ref={titleRef} className="title">Contacto</h2>
          <div className="vertical-line"></div>
        </div>

        <div className="contact-content">
          <motion.div 
            className="contact-card"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ 
              opacity: 1, 
              x: 0,
              transition: {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1] // ease-out-circ
              }
            }}
            viewport={{ once: true, margin: "-20%" }}
          >
            <h3>¡Hablemos!</h3>
            <p>¿Tienes un proyecto en mente o simplemente quieres charlar? No dudes en contactarme.</p>
            
            <div className="contact-links">
              <motion.a 
                href="mailto:carlosmiguel40@gmail.com"
                className="contact-link email"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="icon">✉️</span>
                <span className="text">carlosmiguel40@gmail.com</span>
              </motion.a>
              
              <motion.a 
                href="https://linkedin.com/in/carlos-miguel-rábago-torcates-2a5447208"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link linkedin"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="icon">💼</span>
                <span className="text">LinkedIn</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection; 