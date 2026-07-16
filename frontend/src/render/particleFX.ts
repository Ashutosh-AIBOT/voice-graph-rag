import * as THREE from 'three';

interface Particle {
  active: boolean;
  life: number;
  maxLife: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  gravity: number;
}

export class ParticleFXEngine {
  private static MAX_PARTICLES = 2000;
  private static particles: Particle[] = [];
  public static pointsMesh: THREE.Points | null = null;
  private static geometry: THREE.BufferGeometry | null = null;
  private static material: THREE.PointsMaterial | null = null;

  // Float32Arrays for the BufferGeometry
  private static positionsArray = new Float32Array(ParticleFXEngine.MAX_PARTICLES * 3);
  private static colorsArray = new Float32Array(ParticleFXEngine.MAX_PARTICLES * 3);
  private static sizesArray = new Float32Array(ParticleFXEngine.MAX_PARTICLES);

  private static initialized = false;

  public static init(scene: THREE.Scene) {
    if (this.initialized) return;

    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        life: 0,
        maxLife: 1.0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 1.0,
        gravity: 0,
      });
      // hide initially
      this.positionsArray[i * 3] = 9999;
      this.positionsArray[i * 3 + 1] = 9999;
      this.positionsArray[i * 3 + 2] = 9999;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positionsArray, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colorsArray, 3));
    // Size attribute can be implemented with custom shader, but for now we'll use a uniform size on PointsMaterial
    // or rely on distance attenuation

    this.material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.renderOrder = 999; // Render on top
    scene.add(this.pointsMesh);

    this.initialized = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('fx:trigger', this.handleTrigger.bind(this) as EventListener);
    }
  }

  private static handleTrigger(e: CustomEvent) {
    const { effect, position } = e.detail;
    if (!position) return;

    const spawnCount = this.getSpawnCount(effect);
    
    let spawned = 0;
    for (let i = 0; i < this.MAX_PARTICLES && spawned < spawnCount; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.resetParticle(p, effect, position);
        spawned++;
      }
    }
  }

  private static getSpawnCount(effect: string) {
    switch (effect) {
      case 'node_arrival': return 30;
      case 'node_grab': return 50;
      case 'mood_shift': return 80;
      case 'big_laugh': return 40;
      case 'transition_break': return 100;
      case 'signoff_sparkle': return 150;
      default: return 10;
    }
  }

  private static resetParticle(p: Particle, effect: string, origin: THREE.Vector3) {
    p.active = true;
    p.position.copy(origin);
    
    let speed = 1.0;
    p.gravity = 0;
    
    switch (effect) {
      case 'node_arrival':
        p.maxLife = 0.5 + Math.random() * 0.5;
        p.color.setHex(0xffffff);
        // Expanding ring (flat on XZ plane mostly)
        const angle = Math.random() * Math.PI * 2;
        speed = 2.0 + Math.random();
        p.velocity.set(Math.cos(angle) * speed, (Math.random() - 0.5) * 0.5, Math.sin(angle) * speed);
        break;
      case 'node_grab':
        p.maxLife = 0.6 + Math.random() * 0.4;
        p.color.setHex(0x4ade80); // Accent color
        // Burst towards avatar
        p.velocity.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 2.0 + Math.random() * 3);
        break;
      case 'mood_shift':
        p.maxLife = 1.2;
        p.color.setHex(0xa855f7);
        // Radial ripple
        const rAng = Math.random() * Math.PI * 2;
        const rSpeed = 3.0 + Math.random() * 2;
        p.velocity.set(Math.cos(rAng) * rSpeed, Math.random() * rSpeed, Math.sin(rAng) * rSpeed);
        break;
      case 'big_laugh':
        p.maxLife = 1.5;
        p.color.setHSL(Math.random(), 1.0, 0.5); // Random confetti colors
        p.velocity.set((Math.random() - 0.5) * 2, 2.0 + Math.random() * 3, (Math.random() - 0.5) * 2);
        p.gravity = 4.0;
        break;
      case 'transition_break':
        p.maxLife = 0.8 + Math.random() * 0.5;
        p.color.setHex(0x94a3b8);
        p.velocity.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        break;
      case 'signoff_sparkle':
        p.maxLife = 1.0 + Math.random() * 0.5;
        p.color.setHex(0xffffaa); // gentle yellow/white sparkle
        // Float upwards softly
        p.velocity.set((Math.random() - 0.5) * 2, 0.5 + Math.random() * 1.5, (Math.random() - 0.5) * 2);
        p.size = 0.5; // Custom parameter, simulated visually
        break;
      default:
        p.maxLife = 1.0;
        p.color.setHex(0xffffff);
        p.velocity.set((Math.random() - 0.5), Math.random(), (Math.random() - 0.5));
    }
    
    p.life = p.maxLife;
  }

  public static update(delta: number) {
    if (!this.initialized || !this.geometry) return;

    let needsUpdate = false;

    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (p.active) {
        needsUpdate = true;
        p.life -= delta;
        if (p.life <= 0) {
          p.active = false;
          // move far away
          this.positionsArray[i * 3] = 9999;
          this.positionsArray[i * 3 + 1] = 9999;
          this.positionsArray[i * 3 + 2] = 9999;
        } else {
          // Physics
          if (p.gravity > 0) p.velocity.y -= p.gravity * delta;
          
          p.position.x += p.velocity.x * delta;
          p.position.y += p.velocity.y * delta;
          p.position.z += p.velocity.z * delta;

          // Drag
          p.velocity.multiplyScalar(0.95);

          // Fade out via color if we had custom shader, but we'll dim it
          const lifeRatio = p.life / p.maxLife;
          
          this.positionsArray[i * 3] = p.position.x;
          this.positionsArray[i * 3 + 1] = p.position.y;
          this.positionsArray[i * 3 + 2] = p.position.z;

          this.colorsArray[i * 3] = p.color.r * lifeRatio;
          this.colorsArray[i * 3 + 1] = p.color.g * lifeRatio;
          this.colorsArray[i * 3 + 2] = p.color.b * lifeRatio;
        }
      }
    }

    if (needsUpdate) {
      (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  }
}
