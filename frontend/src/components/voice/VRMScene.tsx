"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, VRM } from "@pixiv/three-vrm";
import { AudioMetrics } from "@/hooks/useAvatarLipSync";

class CustomClock {
  private startTime: number;
  private oldTime: number;
  constructor() {
    this.startTime = performance.now();
    this.oldTime = performance.now();
  }
  start() {
    this.startTime = performance.now();
    this.oldTime = performance.now();
  }
  getDelta() {
    const newTime = performance.now();
    const diff = (newTime - this.oldTime) / 1000;
    this.oldTime = newTime;
    return diff;
  }
  getElapsedTime() {
    return (performance.now() - this.startTime) / 1000;
  }
}

// Spring Physics Engine for hyper-realistic easing
class SpringFloat {
  value: number;
  target: number;
  velocity: number;
  tension: number;
  friction: number;
  constructor(initial = 0, tension = 40, friction = 0.8) {
    this.value = initial;
    this.target = initial;
    this.velocity = 0;
    this.tension = tension;
    this.friction = friction;
  }
  update(delta: number) {
    const diff = this.target - this.value;
    const force = diff * this.tension;
    this.velocity += force * delta;
    this.velocity *= this.friction;
    this.value += this.velocity * delta;
    return this.value;
  }
}

interface VRMSceneProps {
  avatarUrl: string;
  state: string;
  audioMetrics: AudioMetrics;
}

export default function VRMScene({ avatarUrl, state, audioMetrics }: VRMSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sceneInitialized, setSceneInitialized] = useState(false);

  // Three.js and animation refs
  const currentVRMRef = useRef<VRM | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const clockRef = useRef<CustomClock>(new CustomClock());

  // Animation logic refs
  const nextBlinkTimeRef = useRef<number>(0);
  const blinkProgressRef = useRef<number | null>(null);
  const lookAtTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 2.0));
  const nextLookAtTimeRef = useRef<number>(0);

  // Sync state to ref
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const audioRef = useRef(audioMetrics);
  useEffect(() => { audioRef.current = audioMetrics; }, [audioMetrics]);

  // Spring Animators
  const springs = useRef({
    headX: new SpringFloat(0, 60, 0.85),
    headY: new SpringFloat(0, 60, 0.85),
    headZ: new SpringFloat(0, 60, 0.85),
    spineX: new SpringFloat(0, 40, 0.8),
    spineY: new SpringFloat(0, 40, 0.8),
    hipsX: new SpringFloat(0, 20, 0.9), // Weight shift
    rArmZ: new SpringFloat(-1.2, 50, 0.75),
    rArmX: new SpringFloat(0.1, 50, 0.75),
    lArmZ: new SpringFloat(1.2, 50, 0.75),
    lArmX: new SpringFloat(0.1, 50, 0.75),
    mouthAa: new SpringFloat(0, 80, 0.6),
    mouthOh: new SpringFloat(0, 80, 0.6),
    mouthEe: new SpringFloat(0, 80, 0.6),
    happy: new SpringFloat(0, 30, 0.9),
    angry: new SpringFloat(0, 30, 0.9),
    relaxed: new SpringFloat(0, 30, 0.9)
  }).current;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let initTimer: ReturnType<typeof setTimeout>;
    let resizeObserver: ResizeObserver;

    // Delay init slightly to ensure container has final dimensions
    initTimer = setTimeout(() => {
      if (!canvasRef.current || !containerRef.current) return;

      const width = containerRef.current.clientWidth || window.innerWidth;
      const height = containerRef.current.clientHeight || window.innerHeight;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20.0);
      const initialAspect = width / height;
      if (initialAspect < 1.0) {
        camera.fov = 28;
        camera.position.set(0.0, 1.25, 1.85);
      } else {
        camera.fov = 8.5;
        camera.position.set(0.0, 1.3, 1.45);
      }
      camera.lookAt(new THREE.Vector3(0.0, 1.2, 0.0));
      cameraRef.current = camera;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
      scene.add(ambientLight);
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
      keyLight.position.set(1.5, 2.5, 2.0);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.85);
      fillLight.position.set(-1.5, 1.5, 1.5);
      scene.add(fillLight);
      const rimLight = new THREE.PointLight(0xffffff, 2.5, 5);
      rimLight.position.set(0.0, 1.6, -1.8);
      scene.add(rimLight);

      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        const aspect = w / h;
        cameraRef.current.aspect = aspect;

        if (aspect < 1.0) {
          cameraRef.current.fov = 28;
          cameraRef.current.position.set(0.0, 1.25, 1.85);
        } else {
          cameraRef.current.fov = 8.5;
          cameraRef.current.position.set(0.0, 1.3, 1.45);
        }
        cameraRef.current.lookAt(new THREE.Vector3(0.0, 1.2, 0.0));
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h, false);
      };

      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);

      clockRef.current.start();

      const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (document.visibilityState !== "visible") return;

      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();
      const audio = audioRef.current;
      const state = stateRef.current;

      if (currentVRMRef.current) {
        const humanoid = currentVRMRef.current.humanoid;
        const expression = currentVRMRef.current.expressionManager;
        
        // -- CORE MECHANICS --
        let isBigLaugh = false;
        let isCreepySmile = false;
        let isHardMovement = false;

        // Trigger logic
        if (state === "speaking" && audio.volume > 0.8) isBigLaugh = true;
        if (state === "thinking") isCreepySmile = true; // Use thinking state to demo the creepy stare
        if (state === "speaking" && audio.derivative > 0.15) isHardMovement = true;

        // 1. Weight Shifting (Hips) & Breathing
        // Shift weight every 8 seconds
        const weightShiftCycle = Math.sin(elapsed * (Math.PI * 2 / 8));
        springs.hipsX.target = weightShiftCycle * 0.04;
        
        const hips = humanoid?.getNormalizedBoneNode("hips");
        if (hips) hips.position.x = springs.hipsX.update(delta);

        // Breathing & Spine counter-rotation
        const spine = humanoid?.getNormalizedBoneNode("spine");
        const chest = humanoid?.getNormalizedBoneNode("chest");
        const neck = humanoid?.getNormalizedBoneNode("neck");
        
        let targetSpineX = 0;
        let targetSpineY = -springs.hipsX.value * 0.5; // Counter balance hips

        if (isBigLaugh) {
          // Violent convulsion
          targetSpineX = Math.sin(elapsed * 25) * 0.03;
          springs.spineX.tension = 200;
        } else if (isCreepySmile) {
          // Leaning in, unnaturally still
          targetSpineX = 0.08; 
          springs.spineX.tension = 30;
        } else {
          // Normal breathing
          targetSpineX = Math.sin(elapsed * 1.5) * 0.01;
          springs.spineX.tension = 40;
        }

        springs.spineX.target = targetSpineX;
        springs.spineY.target = targetSpineY;
        
        if (spine) {
          spine.rotation.x = springs.spineX.update(delta);
          spine.rotation.y = springs.spineY.update(delta);
        }
        if (chest && !isCreepySmile) {
          chest.rotation.x = Math.sin(elapsed * 1.5) * 0.005; // Extra chest breath
        }

        // Micro-tremor on neck for life-like presence
        if (neck && !isBigLaugh) {
          const tremor = (Math.random() - 0.5) * 0.002;
          neck.rotation.x += tremor;
          neck.rotation.z += tremor;
        }

        // 2. Head Tracking & Cognitive Gaze
        let targetHeadX = 0;
        let targetHeadY = 0;
        let targetHeadZ = 0;

        if (isBigLaugh) {
          targetHeadX = -0.2; // Throw head back
        } else if (isCreepySmile) {
          targetHeadX = 0.15; // Kubrick stare (head down)
          // Lock target on camera
          lookAtTargetPosRef.current.set(0, 1.2, 2.0); 
        } else if (state === "listening") {
          targetHeadX = 0.04; // Attentive nod
          targetHeadZ = Math.sin(elapsed * 0.2) * 0.02;
          
          // Cognitive gaze: lock on user
          lookAtTargetPosRef.current.set(0, 1.2, 2.0);
        } else {
          // Idle / Speaking: Saccadic eye darting
          if (elapsed > nextLookAtTimeRef.current) {
            // Saccade! Snap to new target immediately (no lerp)
            lookAtTargetPosRef.current.set(
              (Math.random() - 0.5) * 1.5,
              1.2 + (Math.random() - 0.5) * 0.4,
              2.5
            );
            nextLookAtTimeRef.current = elapsed + 1.5 + Math.random() * 3.0;
          }
        }

        springs.headX.target = targetHeadX;
        springs.headZ.target = targetHeadZ;
        
        const head = humanoid?.getNormalizedBoneNode("head");
        if (head) {
          head.rotation.x = springs.headX.update(delta);
          head.rotation.z = springs.headZ.update(delta);
        }

        if (currentVRMRef.current.lookAt?.target) {
          // Instant saccade snap for eyes, no lerp for realism
          currentVRMRef.current.lookAt.target.position.copy(lookAtTargetPosRef.current);
        }

        // 3. Hand & Arm Kinematics (Hard Movements)
        const rUpper = humanoid?.getNormalizedBoneNode("rightUpperArm");
        const rLower = humanoid?.getNormalizedBoneNode("rightLowerArm");
        const lUpper = humanoid?.getNormalizedBoneNode("leftUpperArm");
        
        let targetRArmZ = -1.2;
        let targetRArmX = 0.1;
        let rArmTension = 40;

        if (isBigLaugh) {
          // Hands to belly
          targetRArmZ = -0.5;
          targetRArmX = -0.3;
        } else if (isHardMovement) {
          // Emphatic downward chop! High tension spring
          targetRArmZ = -1.0;
          targetRArmX = 0.5;
          rArmTension = 150; // Snappy fast movement
        } else if (state === "speaking") {
          // Soft conversational gesturing
          targetRArmZ = -1.0 - Math.sin(elapsed * 2) * 0.1;
          targetRArmX = 0.2 + Math.cos(elapsed * 2) * 0.1;
        }

        springs.rArmZ.tension = rArmTension;
        springs.rArmX.tension = rArmTension;
        springs.rArmZ.target = targetRArmZ;
        springs.rArmX.target = targetRArmX;

        if (rUpper) {
          rUpper.rotation.z = springs.rArmZ.update(delta);
          rUpper.rotation.x = springs.rArmX.update(delta);
        }
        
        // FK Phase delay for lower arm (whip effect)
        if (rLower) {
          // Lower arm follows upper arm with slight delay math
          const armSpeed = springs.rArmX.velocity;
          rLower.rotation.x = -0.2 + (armSpeed * 0.05); // Bends back when moving fast
        }

        if (lUpper) {
          lUpper.rotation.z = 1.2 + Math.sin(elapsed * 0.6) * 0.02; // Simple sway
          lUpper.rotation.x = 0.1;
        }

        // 4. Emotional Matrix & Blinking
        let targetHappy = 0;
        let targetAngry = 0;
        let targetRelaxed = 0;

        if (isBigLaugh) {
          targetHappy = 1.0;
        } else if (isCreepySmile) {
          targetHappy = 1.0;
          targetAngry = 0.45; // Lowers brow to create creepy stare
        } else if (state === "listening") {
          targetHappy = 0.6;
        } else {
          targetRelaxed = 0.5;
          targetHappy = 0.1;
        }

        springs.happy.target = targetHappy;
        springs.angry.target = targetAngry;
        springs.relaxed.target = targetRelaxed;

        // Asymmetric Blinking
        let blinkL = 0;
        let blinkR = 0;
        
        if (!isCreepySmile) { // Never blink during creepy smile!
          if (isBigLaugh) {
            blinkL = 1.0; blinkR = 1.0; // Squeeze eyes shut
          } else {
            if (elapsed > nextBlinkTimeRef.current) {
              blinkProgressRef.current = 0;
              nextBlinkTimeRef.current = elapsed + 3.0 + Math.random() * 5.0;
            }
            if (blinkProgressRef.current !== null) {
              blinkProgressRef.current += delta;
              const progress = blinkProgressRef.current / 0.16;
              if (progress >= 1.0) {
                blinkProgressRef.current = null;
              } else {
                const w = progress < 0.35 ? progress / 0.35 : 1.0 - (progress - 0.35) / 0.65;
                blinkL = w;
                blinkR = w * 0.95; // Right eye lags slightly (asymmetric)
              }
            }
          }
        }

        // 5. FFT Audio-Reactive Lip Sync
        if (state === "speaking") {
          springs.mouthAa.target = audio.aa;
          springs.mouthOh.target = audio.oh;
          springs.mouthEe.target = audio.ee;
        } else if (!isBigLaugh) {
          springs.mouthAa.target = 0;
          springs.mouthOh.target = 0;
          springs.mouthEe.target = 0;
        } else if (isBigLaugh) {
          springs.mouthAa.target = 1.0; // Force open for laugh
        }

        if (expression) {
          // Clear unused
          expression.setValue("sad", 0);
          expression.setValue("surprised", 0);
          
          // Apply emotions
          expression.setValue("happy", springs.happy.update(delta));
          expression.setValue("angry", springs.angry.update(delta));
          expression.setValue("relaxed", springs.relaxed.update(delta));
          
          // Apply blink (VRM doesn't natively support split blink easily without custom blendshapes, 
          // but we can apply the average or if VRM has blink_l/blink_r we use them. Standard VRM uses "blink")
          expression.setValue("blink", (blinkL + blinkR) / 2);

          // Apply FFT visemes
          expression.setValue("aa", springs.mouthAa.update(delta));
          expression.setValue("oh", springs.mouthOh.update(delta));
          expression.setValue("ee", springs.mouthEe.update(delta));
        }

        currentVRMRef.current.update(delta);
      }

      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();
    setSceneInitialized(true);

    }, 100); // End setTimeout

    return () => {
      clearTimeout(initTimer);
      if (resizeObserver) resizeObserver.disconnect();
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // Load and Swap VRM Model
  useEffect(() => {
    if (!sceneRef.current || !sceneInitialized) return;

    let active = true;
    setLoading(true);
    setError(null);

    if (currentVRMRef.current) {
      sceneRef.current.remove(currentVRMRef.current.scene);
      VRMUtils.deepDispose(currentVRMRef.current.scene);
      currentVRMRef.current = null;
    }

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      avatarUrl,
      (gltf) => {
        if (!active) {
          const vrm = gltf.userData.vrm;
          if (vrm) VRMUtils.deepDispose(vrm.scene);
          return;
        }

        const vrm = gltf.userData.vrm;
        if (!vrm) {
          setError("Failed to extract VRM data from model.");
          setLoading(false);
          return;
        }

        if (vrm.meta?.metaVersion === "0") VRMUtils.rotateVRM0(vrm);

        currentVRMRef.current = vrm;
        sceneRef.current?.add(vrm.scene);

        if (vrm.lookAt) {
          vrm.lookAt.target = new THREE.Object3D();
          vrm.lookAt.target.position.set(0, 1.2, 2.0);
        }

        setLoading(false);
      },
      undefined,
      (err) => {
        if (!active) return;
        console.error("VRM loader error:", err);
        setError("Error loading VRM avatar.");
        setLoading(false);
      }
    );

    return () => {
      active = false;
      if (currentVRMRef.current && sceneRef.current) {
        sceneRef.current.remove(currentVRMRef.current.scene);
        VRMUtils.deepDispose(currentVRMRef.current.scene);
        currentVRMRef.current = null;
      }
    };
  }, [avatarUrl, sceneInitialized]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 pointer-events-auto">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-primary/20 border-t-accent-primary" />
            <span className="text-xs text-white/60 tracking-wider">Summoning Avatar...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-error z-50 pointer-events-auto">
          <div className="bg-error/15 border border-error/20 px-6 py-3 rounded-2xl backdrop-blur-md">
            {error}
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
        className="pointer-events-auto"
      />
    </div>
  );
}
