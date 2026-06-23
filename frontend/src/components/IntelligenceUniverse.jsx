import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, PerspectiveCamera, Sparkles, Stars, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// AI Intelligence Core - Central glowing sphere
function AIIntelligenceCore() {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.002;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.003;
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });

  return (
    <group>
      {/* Inner core */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.5, 64, 64]} />
          <meshStandardMaterial
            color="#4f46e5"
            emissive="#4f46e5"
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </Float>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Orbiting rings */}
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3, 0.02, 16, 100]} />
          <meshBasicMaterial color="#4f46e5" transparent opacity={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[3.5, 0.015, 16, 100]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[4, 0.01, 16, 100]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// Market Nodes - Floating particles representing market opportunities
function MarketNodes({ count = 50 }) {
  const particles = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5 + Math.random() * 8;
      
      positions.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ]);
    }
    return positions;
  }, [count]);

  return (
    <group>
      {particles.map((position, i) => (
        <Float key={i} speed={1 + Math.random()} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={position}>
            <sphereGeometry args={[0.08 + Math.random() * 0.05, 16, 16]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? '#4f46e5' : i % 3 === 1 ? '#06b6d4' : '#8b5cf6'}
              emissive={i % 3 === 0 ? '#4f46e5' : i % 3 === 1 ? '#06b6d4' : '#8b5cf6'}
              emissiveIntensity={0.5}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// Competitor Network - Connected lines showing competitor relationships
function CompetitorNetwork() {
  const linesRef = useRef();
  const nodes = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 20; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 6 + Math.random() * 5;
      
      positions.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ]);
    }
    return positions;
  }, []);

  const linePositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodes[i][0] - nodes[j][0], 2) +
          Math.pow(nodes[i][1] - nodes[j][1], 2) +
          Math.pow(nodes[i][2] - nodes[j][2], 2)
        );
        if (dist < 4) {
          positions.push(...nodes[i], ...nodes[j]);
        }
      }
    }
    return positions;
  }, [nodes]);

  return (
    <group>
      {/* Nodes */}
      {nodes.map((position, i) => (
        <Float key={i} speed={0.5 + Math.random() * 0.5} rotationIntensity={0.1} floatIntensity={0.3}>
          <mesh position={position}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={0.3}
            />
          </mesh>
        </Float>
      ))}

      {/* Connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={new Float32Array(linePositions)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" transparent opacity={0.2} />
      </lineSegments>
    </group>
  );
}

// Data Streams - Dynamic flowing lines
function DataStreams() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  const streams = useMemo(() => {
    const curves = [];
    for (let i = 0; i < 8; i++) {
      const points = [];
      const angle = (i / 8) * Math.PI * 2;
      for (let j = 0; j < 50; j++) {
        const t = j / 50;
        const r = 4 + t * 6;
        points.push(new THREE.Vector3(
          r * Math.cos(angle + t * 2),
          (t - 0.5) * 8,
          r * Math.sin(angle + t * 2)
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
          width={0.02}
          color={i % 2 === 0 ? '#4f46e5' : '#06b6d4'}
          length={10}
          decay={1}
        >
          <mesh>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#4f46e5' : '#06b6d4'} />
          </mesh>
        </Trail>
      ))}
    </group>
  );
}

// Opportunity Signals - Glowing indicators
function OpportunitySignals() {
  return (
    <group>
      {Array.from({ length: 6 }).map((_, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
          <group position={[
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12
          ]}>
            <mesh>
              <octahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#10b981"
                emissiveIntensity={0.8}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <pointLight color="#10b981" intensity={2} distance={3} />
          </group>
        </Float>
      ))}
    </group>
  );
}

// Risk Indicators - Warning markers
function RiskIndicators() {
  return (
    <group>
      {Array.from({ length: 4 }).map((_, i) => (
        <Float key={i} speed={1.2} rotationIntensity={0.4} floatIntensity={0.4}>
          <group position={[
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 14
          ]}>
            <mesh>
              <tetrahedronGeometry args={[0.25, 0]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={0.6}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <pointLight color="#ef4444" intensity={1.5} distance={2.5} />
          </group>
        </Float>
      ))}
    </group>
  );
}

// Main Scene
function IntelligenceScene() {
  const cameraRef = useRef();

  useEffect(() => {
    // GSAP camera animation on mount
    if (cameraRef.current) {
      gsap.from(cameraRef.current.position, {
        x: 15,
        y: 10,
        z: 15,
        duration: 2.5,
        ease: 'power3.inOut'
      });
    }
  }, []);

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 12]} fov={45} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.3}
        autoRotate
        autoRotateSpeed={0.5}
      />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#4f46e5" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={0.8} />

      {/* Background stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Intelligence Core */}
      <AIIntelligenceCore />

      {/* Market Nodes */}
      <MarketNodes count={60} />

      {/* Competitor Network */}
      <CompetitorNetwork />

      {/* Data Streams */}
      <DataStreams />

      {/* Opportunity Signals */}
      <OpportunitySignals />

      {/* Risk Indicators */}
      <RiskIndicators />

      {/* Ambient sparkles */}
      <Sparkles count={100} scale={20} size={2} speed={0.4} opacity={0.5} color="#4f46e5" />
    </>
  );
}

// Main Component
export default function IntelligenceUniverse() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <IntelligenceScene />
      </Canvas>
      
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/80 pointer-events-none" />
    </div>
  );
}
