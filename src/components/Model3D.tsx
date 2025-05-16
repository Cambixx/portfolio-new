import { useRef, useEffect } from 'react';
import React from 'react';
import { useGLTF, useAnimations, Float, Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import { AudioController } from './AudioController';

interface Model3DProps {
  audioEnabled?: boolean;
  analyser?: AnalyserNode | null;
  isAudioPlaying?: boolean;
}

export const Model3D = React.memo(function Model3D({ 
  audioEnabled = false, 
  analyser = null,
  isAudioPlaying = false 
}: Model3DProps) {
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
      const mobileRotationAdjust = isMobile ? -Math.PI / 2 : 0;
      
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
      // Interpolación suave entre la rotación actual y la objetivo para el scroll
      const scrollSmoothFactor = 0.1;
      currentRotation.current += (targetRotation.current - currentRotation.current) * scrollSmoothFactor;
      modelRef.current.rotation.y = currentRotation.current;

      // Animación de piezas con la música
      if (analyser && isAudioPlaying && modelRef.current.children.length > 0) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Usar el promedio de las frecuencias más bajas para un pulso más notorio
        const lowerHalf = dataArray.slice(0, dataArray.length / 4);
        const averageIntensity = lowerHalf.reduce((sum, value) => sum + value, 0) / lowerHalf.length;
        const normalizedIntensity = (averageIntensity / 128); // Normalizado entre 0 y ~2

        // Itera sobre los hijos directos de la escena/grupo principal del modelo
        // Asumimos que estos son las "piezas" a animar.
        // Es posible que necesites ser más específico si el modelo tiene una jerarquía compleja,
        // por ejemplo, modelRef.current.getObjectByName("NombreDelGrupoDePiezas")?.children
        modelRef.current.children.forEach((child, index) => {
          if (child instanceof THREE.Mesh || child instanceof THREE.Group) { // Asegurarse de que es un Object3D con escala
            if (!child.userData.originalScale) {
              child.userData.originalScale = child.scale.clone();
            }
            
            // Aplicar un factor de movimiento diferente a cada pieza o grupo de piezas
            // para que no todas se muevan exactamente igual.
            // Aquí usamos el índice para variar un poco, pero podría ser por nombre, etc.
            const movementFactor = 0.05 + (index % 5) * 0.01; // Pequeña variación
            const targetScaleFactor = 1 + normalizedIntensity * movementFactor;
            
            // Aplicar a todas las escalas para un pulso uniforme, o solo a Y para "estirar"
            const targetScale = child.userData.originalScale.clone().multiplyScalar(targetScaleFactor);

            child.scale.lerp(targetScale, 0.2); // 0.2 para suavidad
          }
        });
      }
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
});

useGLTF.preload('/models/carlos-3.glb');