import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Model3D } from './Model3D';
import '../styles/hero.scss';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const title = titleRef.current;
    const name = nameRef.current;
    const subtitle = subtitleRef.current;

    if (!title || !subtitle || !hero || !name) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Animación inicial con un enfoque simplificado
    tl.set(hero, { opacity: 1 })
      .from(title.querySelector('.greeting'), { 
        y: 30, 
        opacity: 0, 
        duration: 0.8
      })
      .from(name, { 
        y: 60, 
        opacity: 0, 
        duration: 1,
        delay: -0.4
      })
      .from(subtitle, { 
        y: 30, 
        opacity: 0, 
        duration: 0.8,
        delay: -0.2
      })
      .from('.scroll-indicator', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: -0.3
      });

    // Animación de la línea debajo del nombre
    gsap.fromTo(
      '.name-underline',
      { scaleX: 0, transformOrigin: 'left' },
      { scaleX: 1, duration: 1.2, delay: 1, ease: 'power3.inOut' }
    );

  }, []);

  // Variantes para framer-motion
  const textVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut" 
      }
    }
  };

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-right">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <directionalLight position={[0, 5, 5]} intensity={1} castShadow />
          <Model3D />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>
      <div className="hero-container">
        <div className="hero-content">
          <div className="title-container">
            <div className="hero-title" ref={titleRef}>
              <span className="greeting">Hola, soy</span>
              <span className="name" ref={nameRef}>
                Carlos Rábago
                <span className="name-underline"></span>
              </span>
            </div>
          </div>

          <div className="hero-subtitle" ref={subtitleRef}>
            <motion.h2 
              className="title"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              Desarrollador Web
            </motion.h2>
            <motion.p 
              className="description"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              Creando experiencias digitales únicas
            </motion.p>
          </div>
        </div>

          <motion.div 
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <span>Scroll</span>
            <div className="arrow"></div>
          </motion.div>
        </div>
      </section>
  );
};

export default Hero;