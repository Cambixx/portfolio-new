import { useProgress } from '@react-three/drei';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface ModelLoaderProps {
  show: boolean;
}

export function ModelLoader({ show }: ModelLoaderProps) {
  const { progress, active } = useProgress();

  // Asegurarse de que el loader se muestre mientras está activo o el progreso no está completo
  const isVisible = show && (active || progress < 100);

  useEffect(() => {
    console.log('Loader Status:', { progress, active, isVisible });
  }, [progress, active, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '12px',
          minWidth: '200px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            style={{
              height: '100%',
              background: 'linear-gradient(to right, #FF9A9E, #FFECD2)',
              borderRadius: '2px',
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut'
            }}
          />
        </div>
        <div
          style={{
            color: 'white',
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}