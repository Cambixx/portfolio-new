import { useProgress } from '@react-three/drei';

interface ModelLoaderProps {
  show: boolean;
}

export function ModelLoader({ show }: ModelLoaderProps) {
  const { progress } = useProgress();

  if (!show) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '200px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '100%',
        height: '4px',
        background: '#2d2d2d',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #ff3e3e, #7928ca)',
          transition: 'width 0.3s ease-in-out',
          borderRadius: '2px'
        }} />
      </div>
      <p style={{
        color: '#fff',
        marginTop: '8px',
        fontSize: '14px',
        fontFamily: 'sans-serif'
      }}>
        {Math.round(progress)}%
      </p>
    </div>
  );
}