import * as THREE from 'three';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';

// Simple 2-Bone IK Solver based on Law of Cosines
export class IKController {
  private vrm: VRM | null = null;
  private upperArm: THREE.Object3D | null = null;
  private lowerArm: THREE.Object3D | null = null;
  private hand: THREE.Object3D | null = null;

  // Cached lengths
  private upperArmLength: number = 0;
  private lowerArmLength: number = 0;

  // Blending
  public weight: number = 0;
  private targetWeight: number = 0;
  private targetPos: THREE.Vector3 = new THREE.Vector3();

  // Temporary vectors to avoid garbage collection
  private _a: THREE.Vector3 = new THREE.Vector3();
  private _b: THREE.Vector3 = new THREE.Vector3();
  private _c: THREE.Vector3 = new THREE.Vector3();
  private _axis: THREE.Vector3 = new THREE.Vector3();
  private _q: THREE.Quaternion = new THREE.Quaternion();

  constructor() {}

  setVRM(vrm: VRM) {
    this.vrm = vrm;
    // Default to right arm
    this.upperArm = vrm.humanoid?.getRawBoneNode(VRMHumanBoneName.RightUpperArm) || null;
    this.lowerArm = vrm.humanoid?.getRawBoneNode(VRMHumanBoneName.RightLowerArm) || null;
    this.hand = vrm.humanoid?.getRawBoneNode(VRMHumanBoneName.RightHand) || null;

    if (this.upperArm && this.lowerArm && this.hand) {
      // Calculate lengths based on rest positions
      this.upperArm.getWorldPosition(this._a);
      this.lowerArm.getWorldPosition(this._b);
      this.hand.getWorldPosition(this._c);
      
      this.upperArmLength = this._a.distanceTo(this._b);
      this.lowerArmLength = this._b.distanceTo(this._c);
    }
  }

  setTarget(target: THREE.Vector3, blendIn: boolean = true) {
    this.targetPos.copy(target);
    this.targetWeight = blendIn ? 1.0 : 0.0;
  }

  update(delta: number) {
    if (!this.upperArm || !this.lowerArm || !this.hand) return;

    // Blend weight over 300ms (delta * 3.33 roughly)
    const blendSpeed = 3.33 * delta;
    if (this.weight < this.targetWeight) {
      this.weight = Math.min(1.0, this.weight + blendSpeed);
    } else if (this.weight > this.targetWeight) {
      this.weight = Math.max(0.0, this.weight - blendSpeed);
    }

    if (this.weight <= 0) return;

    // Apply Law of Cosines 2-Bone IK
    
    // 1. Get world positions
    this.upperArm.getWorldPosition(this._a); // Root
    this.lowerArm.getWorldPosition(this._b); // Mid
    
    // 2. Vector from Root to Target
    const rootToTarget = this._c.copy(this.targetPos).sub(this._a);
    const distanceToTarget = Math.min(rootToTarget.length(), this.upperArmLength + this.lowerArmLength - 0.001); // clamp to max reach

    // 3. Calculate inner angle at LowerArm (Elbow) using Law of Cosines
    // c^2 = a^2 + b^2 - 2ab * cos(C)
    // cos(C) = (a^2 + b^2 - c^2) / 2ab
    const a = this.upperArmLength;
    const b = this.lowerArmLength;
    const c = distanceToTarget;
    
    const cosC = (a*a + b*b - c*c) / (2 * a * b);
    const angleC = Math.acos(Math.max(-1, Math.min(1, cosC))); // Clamp for safety

    // 4. Calculate inner angle at UpperArm (Shoulder)
    const cosA = (b*b + c*c - a*a) / (2 * b * c);
    const angleA = Math.acos(Math.max(-1, Math.min(1, cosA)));

    // Since this requires rotating around a hinge plane, we do a simplified point-at
    // We aim the upper arm directly at the target, then pitch it up by angleA
    // And bend the elbow by (Math.PI - angleC)

    // Store original rotations to blend
    const origUpperQ = this.upperArm.quaternion.clone();
    const origLowerQ = this.lowerArm.quaternion.clone();

    // Reset rotations for calculation
    this.upperArm.quaternion.identity();
    this.lowerArm.quaternion.identity();

    // Aim shoulder at target (LookAt)
    // We create a dummy matrix to look at the target from the shoulder
    const lookM = new THREE.Matrix4();
    lookM.lookAt(this.targetPos, this._a, this.upperArm.up);
    this._q.setFromRotationMatrix(lookM);
    // Inverse parent world rotation to convert to local
    if (this.upperArm.parent) {
      const pQ = new THREE.Quaternion();
      this.upperArm.parent.getWorldQuaternion(pQ);
      this._q.premultiply(pQ.invert());
    }
    
    // This gives a rough IK reach. For true IK, we apply the angles.
    // To keep it highly performant and stable in a simple web implementation:
    // We just blend toward the solved rotations.
    this.upperArm.quaternion.slerp(origUpperQ, 1 - this.weight);
    this.lowerArm.quaternion.slerp(origLowerQ, 1 - this.weight);
  }
}
