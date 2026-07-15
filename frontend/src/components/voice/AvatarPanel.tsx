'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAvatarLipSync } from '@/hooks/useAvatarLipSync';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy-loaded to avoid SSR and type declaration issues
type GLTFLoaderType = import('three/addons/loaders/GLTFLoader.js').GLTFLoader;
type VRMType = import('@pixiv/three-vrm').VRM;

interface AvatarPanelProps {
  isConnected: boolean;
  agentState: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';
}

// A public sample VRM model URL (can be customized by user)
const DEFAULT_VRM_URL = 'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_SelfPortrait.vrm';

export function AvatarPanel({ isConnected, agentState }: AvatarPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const volume = useAvatarLipSync(isConnected);
  const [loading, setLoading] = useState(false);
  const [useFallback, setUseFallback] = useState(true);
  const [currentVrmUrl, setCurrentVrmUrl] = useState<string>('/models/avatar.vrm');
  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vrmRef = useRef<VRMType | null>(null);
  const clockRef = useRef(new THREE.Clock());
  
  // Fallback Mesh References
  const robotHeadRef = useRef<THREE.Group | null>(null);
  const robotMouthRef = useRef<THREE.Mesh | null>(null);
  const robotLeftEyeRef = useRef<THREE.Mesh | null>(null);
  const robotRightEyeRef = useRef<THREE.Mesh | null>(null);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Setup Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null; 
    sceneRef.current = scene;

    // Camera (Positioned for upper body/head)
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0.0, 1.45, 3.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2, 4, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Build the Stylized Robot Head (Fallback Avatar)
    const robot = new THREE.Group();
    robot.position.set(0, 1.1, 0);

    const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.7, 4, 4, 4);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1e1e2e, roughness: 0.1, metalness: 0.9 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    robot.add(headMesh);

    const visorGeo = new THREE.BoxGeometry(0.7, 0.25, 0.1);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.1, 0.33);
    robot.add(visorMesh);

    const eyeGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.18, 0.1, 0.38);
    robot.add(leftEye);
    robotLeftEyeRef.current = leftEye;
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.18, 0.1, 0.38);
    robot.add(rightEye);
    robotRightEyeRef.current = rightEye;

    const mouthGeo = new THREE.BoxGeometry(0.24, 0.05, 0.05);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.position.set(0, -0.18, 0.36);
    robot.add(mouthMesh);
    robotMouthRef.current = mouthMesh;

    const earGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8);
    const earMat = new THREE.MeshStandardMaterial({ color: 0x5b21b6, metalness: 0.8 });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-0.45, 0, 0);
    robot.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.rotation.z = Math.PI / 2;
    rightEar.position.set(0.45, 0, 0);
    robot.add(rightEar);

    scene.add(robot);
    robotHeadRef.current = robot;


    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const time = clockRef.current.getElapsedTime();

      // VRM Animation update if loaded
      if (vrmRef.current) {
        const vrm = vrmRef.current as any;
        vrm.update(delta);
        
        // Map audio volume to mouth expression & emotions
        const expressionManager = vrm.expressionManager;
        if (expressionManager) {
          expressionManager.setValue('aa', Math.min(volume * 1.5, 1.0));
          
          // Blinking
          const isBlinking = Math.sin(time * 3) > 0.96;
          expressionManager.setValue('blink', isBlinking ? 1.0 : 0.0);
          
          // Emotional states (smiling, thinking)
          if (agentState === 'speaking') {
            expressionManager.setValue('happy', 0.6);
            expressionManager.setValue('neutral', 0.0);
          } else if (agentState === 'thinking') {
            expressionManager.setValue('happy', 0.0);
            expressionManager.setValue('neutral', 0.4);
          } else {
            expressionManager.setValue('happy', 0.2); // subtle baseline smile
          }
        }

        // Body, head, and hand movements
        const head = vrm.humanoid?.getNormalizedBoneNode('head');
        const neck = vrm.humanoid?.getNormalizedBoneNode('neck');
        const spine = vrm.humanoid?.getNormalizedBoneNode('spine');
        const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
        const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
        const leftLowerArm = vrm.humanoid?.getNormalizedBoneNode('leftLowerArm');
        const rightLowerArm = vrm.humanoid?.getNormalizedBoneNode('rightLowerArm');
        
        // Breathing (subtle spine and neck expansion)
        if (spine) spine.rotation.x = Math.sin(time * 1.5) * 0.015;
        if (neck) neck.rotation.x = Math.sin(time * 1.5) * 0.01;

        // Head looking around
        if (head) {
          head.rotation.y = Math.sin(time * 0.8) * 0.05;
          head.rotation.z = Math.cos(time * 1.2) * 0.02;
          
          if (agentState === 'thinking') {
            head.rotation.x = -0.1; // look slightly down when thinking
            head.rotation.y = Math.sin(time * 2) * 0.1;
          } else if (agentState === 'listening') {
            head.rotation.x = 0.05; // look slightly up
          } else {
            head.rotation.x = 0;
          }
        }
        
        // Arm / hand gestures (human-like movement)
        if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
          // Base relaxed pose
          leftUpperArm.rotation.z = 1.2;
          rightUpperArm.rotation.z = -1.2;
          
          if (agentState === 'speaking') {
            // Hand gestures when speaking (tied to volume for emphasis)
            leftUpperArm.rotation.x = Math.sin(time * 4) * 0.1 * volume;
            rightUpperArm.rotation.x = Math.cos(time * 4.5) * 0.1 * volume;
            
            leftLowerArm.rotation.x = -0.3 + Math.sin(time * 5) * 0.2 * volume;
            rightLowerArm.rotation.x = -0.3 + Math.cos(time * 6) * 0.2 * volume;
          } else {
            // Idle arm sway
            leftUpperArm.rotation.x = Math.sin(time * 1.0) * 0.02;
            rightUpperArm.rotation.x = Math.cos(time * 1.2) * 0.02;
            leftLowerArm.rotation.x = 0;
            rightLowerArm.rotation.x = 0;
          }
        }
      }

      // Robot Fallback Animation update
      if (robotHeadRef.current && useFallback) {
        robotHeadRef.current.position.y = 1.1 + Math.sin(time * 2.0) * 0.02;
        robotHeadRef.current.rotation.y = Math.sin(time * 0.8) * 0.05;

        if (robotLeftEyeRef.current && robotRightEyeRef.current) {
          const blink = Math.sin(time * 3) > 0.98 ? 0.1 : 1.0;
          robotLeftEyeRef.current.scale.y = blink;
          robotRightEyeRef.current.scale.y = blink;
        }

        if (robotMouthRef.current) {
          const mouthScale = 1.0 + volume * 8.0;
          robotMouthRef.current.scale.y = mouthScale;
          robotMouthRef.current.scale.x = 1.0 + volume * 2.0;

          const mat = robotMouthRef.current.material as THREE.MeshBasicMaterial;
          if (agentState === 'speaking') mat.color.setHex(0x22c55e);
          else if (agentState === 'thinking') mat.color.setHex(0xa855f7);
          else if (agentState === 'listening') mat.color.setHex(0x22d3ee);
          else mat.color.setHex(0x64748b);
        }
      }

      renderer.render(scene, camera);
    };
    
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && containerRef.current) {
        try {
          containerRef.current.removeChild(rendererRef.current.domElement);
        } catch {}
      }
    };
  }, [agentState, volume, useFallback, currentVrmUrl]);

  // Dynamically Load VRM when currentVrmUrl changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    
    // Cleanup previous model
    if (vrmRef.current) {
      scene.remove(vrmRef.current.scene);
      vrmRef.current = null;
    }
    
    setLoading(true);
    setUseFallback(true);
    if (robotHeadRef.current) robotHeadRef.current.visible = true;

    import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      import('@pixiv/three-vrm').then(({ VRMLoaderPlugin }) => {
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        loader.load(
          currentVrmUrl,
          (gltf) => {
            const vrm = gltf.userData.vrm;
            vrmRef.current = vrm;
            vrm.scene.rotation.y = Math.PI; 
            scene.add(vrm.scene);
            if (robotHeadRef.current) robotHeadRef.current.visible = false;
            setUseFallback(false);
            setLoading(false);
          },
          undefined,
          (err) => {
            console.error('Failed to load VRM model:', err);
            setLoading(false);
          }
        );
      });
    });

    return () => {
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
        vrmRef.current = null;
      }
    };
  }, [currentVrmUrl]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      {/* 3D Canvas */}
      <div className="relative h-64 w-64 md:h-80 md:w-80 overflow-hidden rounded-full border border-border/50 bg-bg-surface/50 shadow-2xl backdrop-blur-md">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-bg-surface/80 backdrop-blur-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-violet border-t-transparent" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Loading Avatar...</span>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full outline-none" />
      </div>
      
      {/* VRM Model Switcher */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {[
          { id: '/models/6493143135142452442.vrm', label: 'Avatar 1' },
          { id: '/models/8329890252317737768.vrm', label: 'Avatar 2' },
          { id: '/models/8590256991748008892.vrm', label: 'Avatar 3' },
          { id: '/models/avatar.vrm', label: 'Alicia (Default)' }
        ].map((model) => (
          <button
            key={model.id}
            onClick={() => setCurrentVrmUrl(model.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
              currentVrmUrl === model.id 
                ? 'bg-accent-violet text-white border-accent-violet' 
                : 'bg-bg-elevated text-text-secondary border-border hover:border-accent-violet hover:text-text-primary'
            }`}
          >
            {model.label}
          </button>
        ))}
      </div>
    </div>
  );
}
