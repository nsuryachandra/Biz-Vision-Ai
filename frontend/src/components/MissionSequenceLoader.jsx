import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Sparkles, Stars, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Central AI Core for loading
function LoadingCore({ progress }) {
  const meshRef = useRef();
  const ringsRef = useRef([]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x += 0.005;
    }
    
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.z += 0.005 * (i + 1);
        ring.rotation.x += 0.003 * (i + 1);
      }
    });
  });

  return (
    <group>
      {/* Core sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.2, 64, 64]} />
          <meshStandardMaterial
            color="#4f46e5"
            emissive="#4f46e5"
            emissiveIntensity={0.8 + progress * 0.2}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </Float>

      {/* Progress rings */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(el) => (ringsRef.current[i] = el)}
          rotation={[Math.PI / 2 + i * 0.3, i * 0.5, 0]}
        >
          <torusGeometry args={[1.8 + i * 0.4, 0.02, 16, 100]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? '#4f46e5' : '#06b6d4'}
            transparent
            opacity={0.3 + progress * 0.4}
          />
        </mesh>
      ))}

      {/* Outer glow */}
      <mesh scale={1 + progress * 0.3}>
        <sphereGeometry args={[2.5, 32, 32]} />
          <meshBasicMaterial
            color="#06b6d4"
            transparent
            opacity={0.1 + progress * 0.1}
            side={THREE.BackSide}
          />
      </mesh>
    </group>
  );
}

// Data Streams - Flowing particles
function DataStreams({ progress }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  const streams = useMemo(() => {
    const curves = [];
    for (let i = 0; i < 12; i++) {
      const points = [];
      const angle = (i / 12) * Math.PI * 2;
      for (let j = 0; j < 40; j++) {
        const t = j / 40;
        const r = 3 + t * 5;
        points.push(new THREE.Vector3(
          r * Math.cos(angle + t * 3),
          (t - 0.5) * 6,
          r * Math.sin(angle + t * 3)
        ));
      }
      curves.push(new THREE.CatmullRomCurve3(points));
    }
    return curves;
  }, []);

  return (
    <group ref={groupRef}>
      {streams.map((curve, i) => (
        <Trail
          key={i}
          width={0.015}
          color={i % 2 === 0 ? '#4f46e5' : '#06b6d4'}
          length={8}
          decay={1}
          opacity={0.6}
        >
          <mesh>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#4f46e5' : '#06b6d4'} />
          </mesh>
        </Trail>
      ))}
    </group>
  );
}

// Processing Nodes - Floating indicators
function ProcessingNodes({ activeStep }) {
  const nodes = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 8; i++) {
      const theta = (i / 8) * Math.PI * 2;
      const r = 4;
      positions.push([
        r * Math.cos(theta),
        0,
        r * Math.sin(theta)
      ]);
    }
    return positions;
  }, []);

  return (
    <group>
      {nodes.map((position, i) => (
        <Float key={i} speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
          <group position={position}>
            <mesh>
              <octahedronGeometry args={[0.2, 0]} />
              <meshStandardMaterial
                color={i <= activeStep ? '#10b981' : '#64748b'}
                emissive={i <= activeStep ? '#10b981' : '#64748b'}
                emissiveIntensity={i <= activeStep ? 0.8 : 0.2}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {i <= activeStep && (
              <pointLight color="#10b981" intensity={1.5} distance={2} />
            )}
          </group>
        </Float>
      ))}
    </group>
  );
}

// Main Scene
function LoadingScene({ progress, activeStep }) {
  const cameraRef = useRef();

  useEffect(() => {
    if (cameraRef.current) {
      gsap.to(cameraRef.current.position, {
        x: 0,
        y: 0,
        z: 10 - progress * 2,
        duration: 1,
        ease: 'power2.inOut'
      });
    }
  }, [progress]);

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 10]} fov={50} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#4f46e5" />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#06b6d4" />
      <spotLight position={[0, 12, 0]} angle={0.4} penumbra={1} intensity={1} />

      {/* Background stars */}
      <Stars radius={80} depth={40} count={3000} factor={4} saturation={0} fade speed={1} />

      {/* Loading Core */}
      <LoadingCore progress={progress} />

      {/* Data Streams */}
      <DataStreams progress={progress} />

      {/* Processing Nodes */}
      <ProcessingNodes activeStep={activeStep} />

      {/* Ambient sparkles */}
      <Sparkles count={80} scale={15} size={2} speed={0.5} opacity={0.4} color="#4f46e5" />
    </>
  );
}

// Main Component
export default function MissionSequenceLoader({ progress, activeStep }) {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <LoadingScene progress={progress} activeStep={activeStep} />
      </Canvas>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/90 pointer-events-none" />
    </div>
  );
}
