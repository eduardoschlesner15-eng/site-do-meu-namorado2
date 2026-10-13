"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, Center, useFBX } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

function FBXModel({ url }: { url: string }) {
  const fbx = useFBX(url);
  
  const scale = useMemo(() => {
    let scaleFactor = 0.05;
    
    // Calcula o tamanho real do objeto
    const box = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim > 0) {
      // Queremos que o maior lado do objeto tenha o tamanho de "3.5" unidades na cena
      scaleFactor = 3.5 / maxDim;
    }

    fbx.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: "#333333", // Darker material for light background
          roughness: 0.6,
          metalness: 0.2,
        });
      }
    });

    return scaleFactor;
  }, [fbx]);

  return (
    <Center>
      <primitive object={fbx} scale={scale} rotation={[-Math.PI / 2, 0, 0]} />
    </Center>
  );
}

function STLModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  
  const scale = useMemo(() => {
    let scaleFactor = 0.03;
    geometry.computeVertexNormals();
    geometry.center();
    
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      const size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        scaleFactor = 3.5 / maxDim; // Alvo de 3.5 unidades para manter proporção igual ao FBX
      }
    }
    
    return scaleFactor;
  }, [geometry]);

  return (
    <Center>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
        <meshStandardMaterial color="#333333" roughness={0.6} metalness={0.2} />
      </mesh>
    </Center>
  );
}

export default function ModelViewer({ url, type }: { url: string; type: "stl" | "fbx" }) {
  return (
    <Canvas 
      camera={{ position: [0, 0, 8], fov: 45 }}
      style={{ touchAction: "pan-y" }}
    >
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, -10, -10]} intensity={0.8} color="#ffffff" />
      <Suspense fallback={null}>
        {type === "fbx" ? <FBXModel url={url} /> : <STLModel url={url} />}
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        autoRotate={true} 
        autoRotateSpeed={1.0} 
      />
    </Canvas>
  );
}
