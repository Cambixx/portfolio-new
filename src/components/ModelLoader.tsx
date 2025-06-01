import { useProgress } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelLoaderProps {
  show: boolean;
}

export function ModelLoader({ show }: ModelLoaderProps) {
  const { progress, active } = useProgress();
  const progressRef = useRef(0);

  // Actualizar el progreso solo si es mayor que el valor anterior
  if (progress > progressRef.current) {
    progressRef.current = progress;
  }

  // Asegurarse de que el loader se muestre mientras está activo o el progreso no está completo
  const isVisible = show && (active || progress < 100);

  useEffect(() => {
    console.log('Loader Status:', { progress, active, isVisible, currentProgress: progressRef.current });
  }, [progress, active, isVisible]);

  // Resetear el progreso cuando el loader se oculta
  useEffect(() => {
    if (!isVisible) {
      progressRef.current = 0;
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
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
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
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
              animate={{ width: `${progressRef.current}%` }}
              transition={{
                duration: 0.4,
                ease: "easeOut"
              }}
              style={{
                height: '100%',
                background: 'linear-gradient(to right, #FF9A9E, #FFECD2)',
                borderRadius: '2px',
              }}
            />
          </div>
          <motion.div
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              color: 'white',
              fontSize: '14px',
              fontFamily: 'Inter, system-ui, sans-serif',
              textAlign: 'center',
            }}
          >
            {Math.round(progressRef.current)}%
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}