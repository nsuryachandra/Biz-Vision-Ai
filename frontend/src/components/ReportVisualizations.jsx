import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// AI Intelligence Sphere - Represents overall startup health
function IntelligenceSphere({ healthScore = 75 }) {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x += 0.001;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.002;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      glowRef.current.scale.setScalar(scale);
    }
  });

  const color = healthScore >= 75 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.2, 64, 64]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </Float>

      <mesh ref={glowRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Orbiting rings */}
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.2, 0.015, 16, 100]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.5, 0.01, 16, 100]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>
      </group>

      <Sparkles count={30} scale={3} size={3} speed={0.4} opacity={0.4} color={color} />
    </group>
  );
}

// Market Galaxy - Represents market opportunities
function MarketGalaxy({ opportunityCount = 8 }) {
  const groupRef = useRef();

  const nodes = useMemo(() => {
    const positions = [];
    for (let i = 0; i < opportunityCount; i++) {
      const theta = (i / opportunityCount) * Math.PI * 2;
      const r = 2 + Math.random() * 1.5;
      positions.push([
        r * Math.cos(theta),
        (Math.random() - 0.5) * 1,
        r * Math.sin(theta)
      ]);
    }
    return positions;
  }, [opportunityCount]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((position, i) => (
        <Float key={i} speed={0.8 + Math.random() * 0.5} rotationIntensity={0.2} floatIntensity={0.4}>
          <mesh position={position}>
            <sphereGeometry args={[0.1 + Math.random() * 0.08, 16, 16]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#4f46e5' : '#06b6d4'}
              emissive={i % 2 === 0 ? '#4f46e5' : '#06b6d4'}
              emissiveIntensity={0.5}
            />
          </mesh>
        </Float>
      ))}

      {/* Central hub */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.7}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <Sparkles count={40} scale={4} size={2} speed={0.3} opacity={0.3} color="#4f46e5" />
    </group>
  );
}

// Competitor Constellation - Represents competitor relationships
function CompetitorConstellation({ competitorCount = 5 }) {
  const groupRef = useRef();

  const nodes = useMemo(() => {
    const positions = [];
    for (let i = 0; i < competitorCount; i++) {
      const theta = (i / competitorCount) * Math.PI * 2;
      const r = 1.8 + Math.random() * 0.8;
      positions.push([
        r * Math.cos(theta),
        (Math.random() - 0.5) * 0.8,
        r * Math.sin(theta)
      ]);
    }
    return positions;
  }, [competitorCount]);

  const linePositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodes[i][0] - nodes[j][0], 2) +
          Math.pow(nodes[i][1] - nodes[j][1], 2) +
          Math.pow(nodes[i][2] - nodes[j][2], 2)
        );
        if (dist < 2.5) {
          positions.push(...nodes[i], ...nodes[j]);
        }
      }
    }
    return positions;
  }, [nodes]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((position, i) => (
        <Float key={i} speed={0.6 + Math.random() * 0.4} rotationIntensity={0.15} floatIntensity={0.3}>
          <mesh position={position}>
            <octahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={0.4}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        </Float>
      ))}

      {/* Connections */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={new Float32Array(linePositions)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

// Risk Orbital System - Represents risk factors
function RiskOrbitalSystem({ riskLevel = 'medium' }) {
  const groupRef = useRef();
  const ringsRef = useRef([]);

  const riskColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  };

  const color = riskColors[riskLevel] || riskColors.medium;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.z += 0.003 * (i + 1);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Orbital rings */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => (ringsRef.current[i] = el)}
          rotation={[Math.PI / 2 + i * 0.4, i * 0.3, 0]}
        >
          <torusGeometry args={[1 + i * 0.5, 0.012, 16, 100]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.25 - i * 0.05}
          />
        </mesh>
      ))}

      {/* Risk indicators */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Float key={i} speed={0.5 + Math.random() * 0.3} rotationIntensity={0.2} floatIntensity={0.3}>
          <group position={[
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
          ]}>
            <mesh>
              <tetrahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.4}
              />
            </mesh>
          </group>
        </Float>
      ))}

      <Sparkles count={25} scale={3} size={2} speed={0.4} opacity={0.3} color={color} />
    </group>
  );
}

// Strategic Pathway Network - Represents growth roadmap
function StrategicPathwayNetwork({ stageCount = 4 }) {
  const groupRef = useRef();

  const nodes = useMemo(() => {
    const positions = [];
    for (let i = 0; i < stageCount; i++) {
      const t = i / (stageCount - 1);
      positions.push([
        (t - 0.5) * 4,
        Math.sin(t * Math.PI) * 0.5,
        0
      ]);
    }
    return positions;
  }, [stageCount]);

  const pathCurve = useMemo(() => {
    const points = nodes.map(pos => new THREE.Vector3(...pos));
    return new THREE.CatmullRomCurve3(points);
  }, [nodes]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Path line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={pathCurve.points.length}
            array={new Float32Array(pathCurve.points.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#8b5cf6" linewidth={2} />
      </line>

      {/* Stage nodes */}
      {nodes.map((position, i) => (
        <Float key={i} speed={0.5} rotationIntensity={0.1} floatIntensity={0.2}>
          <group position={position}>
            <mesh>
              <sphereGeometry args={[0.2, 32, 32]} />
              <meshStandardMaterial
                color="#8b5cf6"
                emissive="#8b5cf6"
                emissiveIntensity={0.6}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <pointLight color="#8b5cf6" intensity={1} distance={1.5} />
          </group>
        </Float>
      ))}

      <Sparkles count={30} scale={4} size={2} speed={0.3} opacity={0.3} color="#8b5cf6" />
    </group>
  );
}

// Scene wrapper for each visualization
function VisualizationScene({ children, cameraZ = 5 }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, cameraZ]} fov={50} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.4} />

      {children}
    </>
  );
}

// Export components
export function IntelligenceSphereViz({ healthScore }) {
  return (
    <div className="w-full h-64 md:h-80">
      <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <VisualizationScene cameraZ={4}>
          <IntelligenceSphere healthScore={healthScore} />
        </VisualizationScene>
      </Canvas>
    </div>
  );
}

export function MarketGalaxyViz({ opportunityCount }) {
  return (
    <div className="w-full h-64 md:h-80">
      <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <VisualizationScene cameraZ={5}>
          <MarketGalaxy opportunityCount={opportunityCount} />
        </VisualizationScene>
      </Canvas>
    </div>
  );
}

export function CompetitorConstellationViz({ competitorCount }) {
  return (
    <div className="w-full h-64 md:h-80">
      <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <VisualizationScene cameraZ={5}>
          <CompetitorConstellation competitorCount={competitorCount} />
        </VisualizationScene>
      </Canvas>
    </div>
  );
}

export function RiskOrbitalSystemViz({ riskLevel }) {
  return (
    <div className="w-full h-64 md:h-80">
      <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <VisualizationScene cameraZ={4.5}>
          <RiskOrbitalSystem riskLevel={riskLevel} />
        </VisualizationScene>
      </Canvas>
    </div>
  );
}

export function StrategicPathwayNetworkViz({ stageCount }) {
  return (
    <div className="w-full h-64 md:h-80">
      <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <VisualizationScene cameraZ={5}>
          <StrategicPathwayNetwork stageCount={stageCount} />
        </VisualizationScene>
      </Canvas>
    </div>
  );
}
