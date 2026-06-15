import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function PlaceholderAudioGeometry() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <gridHelper args={[8, 16, "#35556f", "#1b3346"]} />
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.4, 0.8, 1.4]} />
        <meshStandardMaterial color="#45a3ff" roughness={0.35} />
      </mesh>
      <OrbitControls enableDamping />
    </>
  );
}

export default function AudioVisualizerScene() {
  return (
    <section className="visualization-panel" aria-label="3D visualization">
      <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
        <color attach="background" args={["#07131f"]} />
        <PlaceholderAudioGeometry />
      </Canvas>
    </section>
  );
}
