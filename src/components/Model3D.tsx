import { useRef, useEffect } from 'react';
import { useGLTF, useAnimations, Float, Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { AudioController } from './AudioController';

interface Model3DProps {
  audioEnabled?: boolean;
}

export function Model3D({ audioEnabled = false }: Model3DProps) {
  const modelRef = useRef<THREE.Group>(null);
  const { nodes, animations } = useGLTF('/models/carlos-3.glb');
  const { actions } = useAnimations(animations, modelRef);

  const targetRotation = useRef(0);
  const currentRotation = useRef(0);
  const initialAnimationDone = useRef(false);

  useEffect(() => {
    // Asegurarse de que la página comience desde arriba al recargar
    window.scrollTo(0, 0);

    if (!initialAnimationDone.current && modelRef.current) {
      // Configurar la opacidad inicial y la rotación
      modelRef.current.rotation.y = -Math.PI; // -180 grados
      modelRef.current.visible = false; // Ocultar inicialmente

      // Animación inicial
      const tl = gsap.timeline();
      
      // Asegurarnos de que el modelo sea visible antes de la animación
      tl.set(modelRef.current, { visible: true })
        .to(modelRef.current.rotation, {
          y: 0,
          duration: 2,
          ease: "power2.out"
        })
        .from(modelRef.current.position, {
          y: -2,
          duration: 2,
          ease: "power2.out"
        }, 0)
        .from(modelRef.current, {
          opacity: 0,
          duration: 1.5,
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
      // Factor de rotación base
      const baseRotation = window.scrollY * 0.002;
      
      // Ajuste adicional para dispositivos móviles (medio giro más = PI/2)
      const isMobile = window.innerWidth < 768;
      const mobileRotationAdjust = isMobile ? Math.PI / 2 : 0;
      
      // Calcula la rotación total
      targetRotation.current = baseRotation + mobileRotationAdjust;
      
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
    <>
      {audioEnabled && <AudioController />}
      <Environment resolution={512}>
        {/* Techo */}
        <Lightformer intensity={2.5} rotation-x={Math.PI / 2} position={[0, 3, -4]} scale={[10, 1, 1]} />
        <Lightformer intensity={2.5} rotation-x={Math.PI / 2} position={[0, 3, 0]} scale={[10, 1, 1]} />
        <Lightformer intensity={2.5} rotation-x={Math.PI / 2} position={[0, 3, 4]} scale={[10, 1, 1]} />
        
        {/* Laterales */}
        <Lightformer intensity={3} rotation-y={Math.PI / 2} position={[-3, 1, 0]} scale={[6, 3, 1]} />
        <Lightformer intensity={3} rotation-y={-Math.PI / 2} position={[3, 1, 0]} scale={[6, 3, 1]} />
        
        {/* Luces de acento */}
        <Lightformer form="ring" color="#ff3e3e" intensity={8} scale={2} position={[2, 1, 2]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
        <Lightformer form="ring" color="#7928ca" intensity={8} scale={2} position={[-2, 1, 2]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
        
        {/* Luz frontal */}
        <Lightformer intensity={4} position={[0, 1, 3]} scale={[3, 3, 1]} />
      </Environment>
      
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
    </>
  );
}

useGLTF.preload('/models/carlos-3.glb');