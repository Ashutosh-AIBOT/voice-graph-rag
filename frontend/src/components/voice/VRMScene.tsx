"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, VRM } from "@pixiv/three-vrm";
import { AudioMetrics } from "@/hooks/useAvatarLipSync";

// Phase 1 Imports (Scaffolding)
import { AvatarStateMachine } from "@/state/avatarStateMachine";
import { GrabMechanic } from "@/state/grabMechanic";
import { ModeController } from "@/state/modeController";
import { MoodDetector } from "@/mood/moodDetector";
import { MoodColorLayer } from "@/mood/moodColorLayer";
import { SpringEdges } from "@/render/springEdges";
import { NodeField } from "@/render/nodeField";
import { IKController } from "@/render/ikController";
import { PERSONAS } from "@/state/personalitySystem";
import { ParticleFXEngine } from "@/render/particleFX";
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

  // Phase 17: Personality configuration
  const activePersona = Object.values(PERSONAS).find(p => p.vrmUrl === avatarUrl) || PERSONAS['calm_tutor'];
  const bSpeed = activePersona.breathingSpeed;
  const gIntensity = activePersona.gestureIntensity;

  // Three.js and animation refs
  const currentVRMRef = useRef<VRM | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const clockRef = useRef<CustomClock>(new CustomClock());
  const ikControllerRef = useRef<IKController>(new IKController());

  // Animation logic refs
  const nextBlinkTimeRef = useRef<number>(0);
  const blinkProgressRef = useRef<number | null>(null);
  const lookAtTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.4, 5));
  const nextLookAtTimeRef = useRef<number>(0);
  const wasBigLaughRef = useRef<boolean>(false);

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
    relaxed: new SpringFloat(0, 30, 0.9),
    
    // Phase 11: Camera Springs
    camX: new SpringFloat(0.0, 10, 0.9),
    camY: new SpringFloat(1.45, 10, 0.9),
    camZ: new SpringFloat(1.6, 10, 0.9),
    camFov: new SpringFloat(22, 10, 0.9),
    camTargetX: new SpringFloat(0.0, 15, 0.8),
    camTargetY: new SpringFloat(1.35, 15, 0.8),
    camTargetZ: new SpringFloat(0.0, 15, 0.8),
  }).current;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("WebGL Context Lost - Pausing render loop");
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };

    const handleContextRestored = () => {
      console.log("WebGL Context Restored - Rebuilding scene");
      // For a true rebuild, we'd trigger a full re-render of this component
      // For now, restarting the loop
      clockRef.current.start();
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    canvasRef.current.addEventListener('webglcontextlost', handleContextLost, false);
    canvasRef.current.addEventListener('webglcontextrestored', handleContextRestored, false);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    ParticleFXEngine.init(scene);

    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20.0);
    const initialAspect = width / height;
    if (initialAspect < 1.0) {
      camera.fov = 28;
      camera.position.set(0.0, 1.4, 2.0);
    } else {
      camera.fov = 22;
      camera.position.set(0.0, 1.45, 1.6);
    }
    camera.lookAt(new THREE.Vector3(0.0, 1.35, 0.0));
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
      const width = containerRef.current.clientWidth || window.innerWidth;
      const height = containerRef.current.clientHeight || window.innerHeight;
      const aspect = width / height;

      cameraRef.current.aspect = aspect;

      const isBrowseMode = useModeController.getState().mode === 'browse';

      // Update spring targets instead of snapping
      if (aspect < 1.0) {
        springs.camFov.target = 28;
        springs.camX.target = isBrowseMode ? 0.2 : 0.0;
        springs.camY.target = 1.4;
        springs.camZ.target = isBrowseMode ? 2.8 : 2.0;
      } else {
        springs.camFov.target = 22;
        // In browse mode (1.3fr/1fr layout), left panel center is ~28% of screen.
        // We pan the camera to the RIGHT to shift the avatar LEFT.
        // The required shift depends on the aspect ratio and distance.
        // At Z=2.5, FOV=22, Height = ~0.97m. Width = 0.97 * aspect.
        // To shift by ~22% of screen width: 0.22 * 0.97 * aspect = 0.21 * aspect.
        const xOffset = isBrowseMode ? 0.21 * aspect : 0.0;
        springs.camX.target = xOffset;
        springs.camY.target = 1.45;
        springs.camZ.target = isBrowseMode ? 2.5 : 1.6;
        
        springs.camTargetX.target = xOffset;
        springs.camTargetY.target = 1.35;
        springs.camTargetZ.target = 0.0;
      }

      // Update projection immediately for aspect ratio correctness, but physics loop handles position/fov
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    };

    // Listen to mode changes to update camera framing dynamically
    const onModeChanged = () => {
      handleResize();
    };
    window.addEventListener('mode:changed', onModeChanged);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    clockRef.current.start();

    const animate = () => {
      // Phase 12: Performance - Pause render loop on tab visibility loss
      if (document.visibilityState === 'visible') {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // We still need to loop slowly or wait for visibility
        // Actually, requestAnimationFrame naturally pauses when hidden, 
        // but explicit skip saves background processing
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
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
        
        if (state === "speaking" && audio.volume > 0.8) isBigLaugh = true;
        if (state === "thinking" && elapsed % 6.0 > 4.5) isCreepySmile = true; // Randomly during thinking
        
        // Phase 19: Big Laugh Particles
        if (isBigLaugh && !wasBigLaughRef.current && currentVRMRef.current && currentVRMRef.current.scene) {
           const chestPos = new THREE.Vector3();
           const chestNode = humanoid?.getNormalizedBoneNode("chest");
           if (chestNode) chestNode.getWorldPosition(chestPos);
           window.dispatchEvent(new CustomEvent('fx:trigger', { detail: { effect: 'big_laugh', position: chestPos } }));
        }
        wasBigLaughRef.current = isBigLaugh;

        if (state === "sign_off" && stateRef.current !== "sign_off") {
           const rootPos = new THREE.Vector3();
           currentVRMRef.current?.scene.getWorldPosition(rootPos);
           window.dispatchEvent(new CustomEvent('fx:trigger', { detail: { effect: 'signoff_sparkle', position: rootPos } }));
        }

        let isHardMovement = (state === "speaking" && audio.derivative > 0.15);

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
          // Apply Persona Breathing Speed
          const breathElapsed = elapsed * bSpeed;
          
          if (state === "speaking") {
            targetSpineX = Math.sin(breathElapsed * 25) * 0.03 * gIntensity;
            targetSpineY += Math.sin(breathElapsed * 15) * 0.02 * gIntensity;
            
            // Random micro-gestures based on idleMicroActionFrequency
            if (Math.random() < 0.02 * activePersona.idleMicroActionFrequency) {
              springs.spineX.velocity += (Math.random() - 0.5) * 5 * gIntensity;
              springs.spineY.velocity += (Math.random() - 0.5) * 5 * gIntensity;
            }
          } else {
            targetSpineX = Math.sin(breathElapsed * 1.5) * 0.01;
            targetSpineY += Math.sin(breathElapsed * 1.2) * 0.01;
          }
          springs.spineX.tension = 40;
        }

        springs.spineX.target = targetSpineX;
        springs.spineY.target = targetSpineY;

        if (spine) {
          spine.rotation.x = springs.spineX.update(delta);
          spine.rotation.y = springs.spineY.update(delta);
        }
        
        if (chest && !isCreepySmile) {
          chest.rotation.x = Math.sin(elapsed * bSpeed * 1.5) * 0.005; // Extra chest breath
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
          lookAtTargetPosRef.current.set(0, 1.35, 2.0); 
        } else if (state === "listening") {
          targetHeadX = 0.04; // Attentive nod
          targetHeadZ = Math.sin(elapsed * 0.2) * 0.02;
          
          // Cognitive gaze: lock on user
          lookAtTargetPosRef.current.set(0, 1.35, 2.0);
        } else {
          // Idle / Speaking: Saccadic eye darting
          if (elapsed > nextLookAtTimeRef.current) {
            // Saccade! Snap to new target immediately (no lerp)
            lookAtTargetPosRef.current.set(
              (Math.random() - 0.5) * 2.0,
              1.35 + (Math.random() - 0.5) * 0.5,
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

        if (state === "sign_off") {
          // Phase 1: Waving goodbye (sign_off gesture)
          targetRArmZ = -1.5;
          targetRArmX = 1.0 + Math.sin(elapsed * 15) * 0.5; // rapid wave
          rArmTension = 80;
        } else if (isBigLaugh) {
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
        } else if (state === "idle") {
          // Phase 2: Additive micro-actions on top of breathing
          if (elapsed % 5.0 > 4.5) {
             targetRArmZ = -1.2 + 0.05; // slight arm twitch/weight shift
          }
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
          targetHappy = activePersona.expressionRange.happyMax;
        } else if (isCreepySmile) {
          targetHappy = activePersona.expressionRange.happyMax;
          targetAngry = activePersona.expressionRange.angryMax * 0.5; // Lowers brow to create creepy stare
        } else if (state === "listening") {
          targetHappy = activePersona.expressionRange.happyMax * 0.6;
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

        // Phase 16: Dynamic IK Targeting
        if (stateRef.current === "thinking" || stateRef.current === "speaking") {
          // Look towards the "Docs" area (top left)
          const target = new THREE.Vector3(-0.5, 1.6, 1.0);
          ikControllerRef.current.setTarget(target, true);
        } else if (stateRef.current === "sit_on_node" || stateRef.current === "flee_with_node") {
          // Look towards the "Graph" area (bottom right)
          const target = new THREE.Vector3(0.5, 1.0, 1.0);
          ikControllerRef.current.setTarget(target, true);
        } else {
          ikControllerRef.current.setTarget(new THREE.Vector3(), false);
        }

        // Phase 16: IK Controller update (must happen after procedural to override it)
        ikControllerRef.current.update(delta);

        currentVRMRef.current.update(delta);
      }

      // Phase 11: Camera Physics
      if (cameraRef.current) {
        cameraRef.current.position.set(
          springs.camX.update(delta),
          springs.camY.update(delta),
          springs.camZ.update(delta)
        );
        cameraRef.current.fov = springs.camFov.update(delta);
        cameraRef.current.updateProjectionMatrix();
        cameraRef.current.lookAt(
          springs.camTargetX.update(delta),
          springs.camTargetY.update(delta),
          springs.camTargetZ.update(delta)
        );
      }

      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        // Phase 19: Particles
        ParticleFXEngine.update(delta);

        rendererRef.current.render(sceneRef.current, cameraRef.current);
        
        // Phase 18: Spatial Audio Tracking
        if (currentVRMRef.current && currentVRMRef.current.scene) {
          const pos = new THREE.Vector3();
          currentVRMRef.current.scene.getWorldPosition(pos);
          pos.project(cameraRef.current);
          
          window.dispatchEvent(new CustomEvent('audio:spatial-update', {
            detail: {
              x: Math.max(-1, Math.min(1, pos.x)), // Clamp to screen -1 to 1
              y: pos.y,
              z: currentVRMRef.current.scene.position.z, // Use world Z for distance
              isBrowseMode: useModeController.getState().mode === 'browse'
            }
          }));
        }
      }
    };
    animate();
    setSceneInitialized(true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mode:changed', onModeChanged);
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
        ikControllerRef.current.setVRM(vrm);
        sceneRef.current?.add(vrm.scene);

        if (vrm.lookAt) {
          vrm.lookAt.target = new THREE.Object3D();
          vrm.lookAt.target.position.set(0, 1.4, 5.0);
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

    const onStateChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      stateRef.current = customEvent.detail.state;
    };

    const onNodeTugged = (e: Event) => {
      // Phase 11: subtle camera micro-shake per tug cycle
      springs.camTargetX.target += (Math.random() - 0.5) * 0.05;
      springs.camTargetY.target += (Math.random() - 0.5) * 0.05;
      
      // Restore targeting quickly
      setTimeout(() => {
        springs.camTargetX.target = 0.0;
        springs.camTargetY.target = 1.35;
      }, 150);
    };

    const onIKPoint = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.target) {
        ikControllerRef.current.setTarget(customEvent.detail.target, true);
      } else {
        ikControllerRef.current.setTarget(new THREE.Vector3(), false); // Disable IK
      }
    };

    window.addEventListener('avatar:state_changed', onStateChanged);
    window.addEventListener('node:tugged', onNodeTugged);
    window.addEventListener('ik:point-at', onIKPoint);

    return () => {
      active = false;
      if (currentVRMRef.current && sceneRef.current) {
        sceneRef.current.remove(currentVRMRef.current.scene);
        VRMUtils.deepDispose(currentVRMRef.current.scene);
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (rendererRef.current) rendererRef.current.dispose();
      window.removeEventListener('avatar:state_changed', onStateChanged);
      window.removeEventListener('node:tugged', onNodeTugged);
      window.removeEventListener('ik:point-at', onIKPoint);
    };
  }, [avatarUrl, sceneInitialized]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 pointer-events-auto">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
            <span className="text-xs text-white/60 tracking-wider">Summoning Avatar...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-400 z-50 pointer-events-auto">
          <div className="bg-red-950/40 border border-red-500/20 px-6 py-3 rounded-2xl backdrop-blur-md">
            {error}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="h-full w-full block pointer-events-auto" />
    </div>
  );
}
