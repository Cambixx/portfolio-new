/* eslint-disable react/no-unknown-property */
'use client';
import { useEffect, useRef, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useTexture, Environment, Lightformer, Html, RoundedBox } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';
import { RigidBody as RigidBodyType } from '@dimforge/rapier3d-compat';
import lanyardTexture from '../assets/lanyard/lanyard.png';
import carlosImage from '../assets/lanyard/carlos.PNG';

import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: any;
    meshLineMaterial: any;
  }
}

interface ExtendedRigidBody extends RigidBodyType {
  lerped?: THREE.Vector3;
}

const CARD_CONFIG = {
  width: 0.8,
  height: 1.2,
  depth: 0.02,
  colors: {
    primary: '#ffffff',
    secondary: '#6b46c1',
    metal: '#888888',
    metalDark: '#666666'
  },
};

const segmentProps = { 
  type: 'dynamic' as const, 
  canSleep: true,  
  colliders: false as const, 
  angularDamping: 4,  
  linearDamping: 4    
};

export default function Lanyard({ position = [0, 0, 30], gravity = [0, -40, 0] as [number, number, number], fov = 20, transparent = true }) {
  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position: position as [number, number, number], fov: fov }}
        gl={{ alpha: transparent }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1);
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          camera.position.y = 1;
        }}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={1 / 60}>
          <Band />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

function Band({ maxSpeed = 50, minSpeed = 0 }) {
  const band = useRef<THREE.Mesh>(null);
  const fixed = useRef<ExtendedRigidBody>(null);
  const j1 = useRef<ExtendedRigidBody>(null);
  const j2 = useRef<ExtendedRigidBody>(null);
  const j3 = useRef<ExtendedRigidBody>(null);
  const card = useRef<ExtendedRigidBody>(null);
  const texture = useTexture(lanyardTexture);
  const [carlosTexture] = useTexture([carlosImage]);
  const [imageSize, setImageSize] = useState({ width: CARD_CONFIG.width, height: CARD_CONFIG.height });
  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);
  const [isSmall, setIsSmall] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024
  );

  useRopeJoint(fixed as any, j1 as any, [[0, 0, 0], [0, 0, 0], 0.6]);
  useRopeJoint(j1 as any, j2 as any, [[0, 0, 0], [0, 0, 0], 0.6]);
  useRopeJoint(j2 as any, j3 as any, [[0, 0, 0], [0, 0, 0], 0.6]);
  useSphericalJoint(j3 as any, card as any, [[0, 0, 0], [0, 0.8, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmall(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 1);
      texture.offset.set(0, 0);
      texture.needsUpdate = true;
    }
  }, [texture]);

  useEffect(() => {
    if (carlosTexture && carlosTexture.image) {
      const imgWidth = CARD_CONFIG.width;
      const imgHeight = (CARD_CONFIG.width * carlosTexture.image.height) / carlosTexture.image.width;
      setImageSize({ width: imgWidth, height: imgHeight });
    }
  }, [carlosTexture]);

  useFrame((state, delta) => {
    if (dragged && card.current) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ 
        x: vec.x - (dragged as THREE.Vector3).x, 
        y: vec.y - (dragged as THREE.Vector3).y, 
        z: vec.z - (dragged as THREE.Vector3).z 
      });
    }
    if (fixed.current && band.current) {
      [j1, j2].forEach((ref) => {
        if (ref.current) {
          if (!ref.current.lerped) {
            ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
          }
          const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
          ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
        }
      });
      if (j3.current && j2.current && j1.current) {
        curve.points[0].copy(j3.current.translation());
        curve.points[1].copy(j2.current.lerped || j2.current.translation());
        curve.points[2].copy(j1.current.lerped || j1.current.translation());
        curve.points[3].copy(fixed.current.translation());
        (band.current.geometry as any).setPoints(curve.getPoints(32));
        if (card.current) {
          ang.copy(card.current.angvel());
          rot.copy(card.current.rotation());
          card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
        }
      }
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
      <group position={[0, 5.5, 0]}>
        <RigidBody ref={fixed as any} {...segmentProps} type="fixed" />
        <RigidBody position={[0.4, -0.5, 0]} ref={j1 as any} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0.8, -1.0, 0]} ref={j2 as any} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.2, -1.5, 0]} ref={j3 as any} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.6, -2.0, 0]} ref={card as any} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.5}
            position={[0, -0.8, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => {
              e.stopPropagation();
              if (e.target) e.target.releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e: any) => {
              e.stopPropagation();
              if (e.target) {
                e.target.setPointerCapture(e.pointerId);
                drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current!.translation())));
              }
            }}>
            {/* Tarjeta base */}
            <RoundedBox 
              args={[CARD_CONFIG.width, CARD_CONFIG.height, CARD_CONFIG.depth]}
              radius={0.02}
              smoothness={4}
              castShadow 
              receiveShadow
            >
              <meshPhysicalMaterial 
                color={CARD_CONFIG.colors.primary}
                clearcoat={1} 
                clearcoatRoughness={0.1} 
                roughness={0.3} 
                metalness={0.9}
                reflectivity={1}
                envMapIntensity={2}
              />
            </RoundedBox>
            
            {/* Imagen en el reverso */}
            <mesh
              position={[0, 0, -CARD_CONFIG.depth/2 - 0.001]}
              rotation={[0, Math.PI, 0]}
            >
              <planeGeometry args={[imageSize.width, imageSize.height]} />
              <meshBasicMaterial 
                map={carlosTexture} 
                transparent={true}
                side={THREE.FrontSide}
              />
            </mesh>
            
            {/* Clip superior y enganche */}
            <group position={[0, 0.5, CARD_CONFIG.depth]}>
              {/* Clip base */}
              <mesh castShadow>
                <boxGeometry args={[0.15, 0.3, 0.04]} />
                <meshStandardMaterial 
                  color={CARD_CONFIG.colors.metal} 
                  roughness={0.3} 
                  metalness={1}
                />
              </mesh>
              
              {/* Enganche tipo clip */}
              <group position={[0, 0.2, 0]}>
                {/* Parte trasera del clip */}
                <mesh castShadow position={[0, 0.05, -0.01]}>
                  <boxGeometry args={[0.08, 0.15, 0.02]} />
                  <meshStandardMaterial 
                    color={CARD_CONFIG.colors.metalDark}
                    roughness={0.3}
                    metalness={1}
                  />
                </mesh>

                {/* Parte curva superior */}
                <mesh castShadow position={[0, 0.125, 0]} rotation={[Math.PI/2, 0, 0]}>
                  <torusGeometry args={[0.02, 0.01, 16, 32, Math.PI]} />
                  <meshStandardMaterial 
                    color={CARD_CONFIG.colors.metalDark}
                    roughness={0.3}
                    metalness={1}
                  />
                </mesh>

                {/* Parte frontal del clip */}
                <mesh castShadow position={[0, 0.05, 0.01]}>
                  <boxGeometry args={[0.08, 0.15, 0.02]} />
                  <meshStandardMaterial 
                    color={CARD_CONFIG.colors.metalDark}
                    roughness={0.3}
                    metalness={1}
                  />
                </mesh>
              </group>
            </group>

            {/* Nombre */}
            <group position={[0.25, 0, CARD_CONFIG.depth + 0.01]} rotation={[0, 0, Math.PI / 2]}>
              <Html
                transform
                occlude
                style={{
                  fontSize: '0.2rem',
                  fontWeight: 'bold',
                  color: CARD_CONFIG.colors.secondary,
                  textAlign: 'center',
                  userSelect: 'none',
                  fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                CARLOS RÁBAGO
              </Html>
            </group>

            {/* Título */}
            <group position={[0, -0.3, CARD_CONFIG.depth + 0.01]}>
              <Html
                transform
                occlude
                style={{
                  fontSize: '0.12rem',
                  fontWeight: 'normal',
                  color: CARD_CONFIG.colors.secondary,
                  textAlign: 'center',
                  userSelect: 'none',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.02em',
                  opacity: 0.8,
                }}
              >
                Web Developer
              </Html>
            </group>
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isSmall ? [1000, 2000] : [1000, 1000]}
          useMap={true}
          map={texture}
          repeat={[4, 1]}
          lineWidth={0.8}
          transparent={true}
          opacity={1}
        />
      </mesh>
    </>
  );
} 