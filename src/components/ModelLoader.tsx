import { useProgress } from '@react-three/drei';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelLoaderProps {
  show: boolean;
}

export const ModelLoader = React.memo(function ModelLoader({ show }: ModelLoaderProps) {
  const { progress, active } = useProgress();

  const shouldShowLoader = show && active;

  return (
    <AnimatePresence>
      {shouldShowLoader && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '12px',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
          }}
        >
          <div style={{
            width: '150px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <motion.div 
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FF9A9E, #FFECD2)',
                borderRadius: '3px',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: "linear" }}
            />
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: progress > 0 ? 1 : 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '12px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
            }}
          >
            Cargando... {Math.round(progress)}%
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
});