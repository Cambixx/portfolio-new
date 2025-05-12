import { useRef, useEffect } from 'react';
import { useGLTF, useAnimations, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

export function Model3D() {
  const modelRef = useRef<THREE.Group>(null);
  const { nodes, animations } = useGLTF('/models/carlos-3.glb');
  const { actions } = useAnimations(animations, modelRef);

  const targetRotation = useRef(0);
  const currentRotation = useRef(0);
  const initialAnimationDone = useRef(false);

  useEffect(() => {
    if (!initialAnimationDone.current && modelRef.current) {
      // Configurar la opacidad inicial y la rotación
      modelRef.current.rotation.y = -Math.PI; // -180 grados

      // Animación inicial
      const tl = gsap.timeline();
      
      // Asegurarnos de que el modelo sea visible antes de la animación
      tl.set(modelRef.current, { visible: true })
        .to(modelRef.current.rotation, {
          y: 0,
          duration: 1.5,
          ease: "power2.out"
        })
        .from(modelRef.current, {
          opacity: 0,
          duration: 1,
          ease: "power2.out"
        }, 0);

      initialAnimationDone.current = true;
    }

    // Preparar las animaciones y establecerlas en el último fotograma
    Object.values(actions).forEach((action) => {
      if (action) {
        const duration = action.getClip().duration;
        action.play();
        action.paused = true; // Pausar la animación inicialmente
        action.setEffectiveWeight(1);
        action.time = duration; // Establecer el tiempo al último fotograma
      }
    });

    const handleScroll = () => {
      // Calcula la rotación basada en el scroll
      targetRotation.current = (window.scrollY * 0.002);
      
      // Controla la animación directamente con el progreso del scroll (invertido)
      const scrollProgress = 1 - (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight));
      
      Object.values(actions).forEach((action) => {
        if (action) {
          // Establecer el tiempo de la animación basado en el progreso invertido del scroll
          const duration = action.getClip().duration;
          action.time = scrollProgress * duration;
          action.play();
          action.paused = true; // Mantener pausado pero actualizar el tiempo
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions]);

  useFrame(() => {
    if (modelRef.current) {
      // Interpolación suave entre la rotación actual y la objetivo
      const smoothFactor = 0.1;
      currentRotation.current += (targetRotation.current - currentRotation.current) * smoothFactor;
      modelRef.current.rotation.y = currentRotation.current;
    }
  });

  return (
    <Float
      speed={2.5} // Velocidad de la animación
      rotationIntensity={0.2} // Desactivamos la rotación automática ya que tenemos la nuestra
      floatIntensity={0.5} // Intensidad del efecto de flotación
      floatingRange={[0.3, 0.4]} // Rango de movimiento vertical
    >
      <group ref={modelRef} dispose={null} position={[0, 0, 0]} scale={0.3}>
        <primitive object={nodes.Scene} />
      </group>
    </Float>
  );
}

useGLTF.preload('/models/carlos-3.glb');