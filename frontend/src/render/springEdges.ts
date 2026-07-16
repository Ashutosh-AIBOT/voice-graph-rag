import tuning from '@/config/tuning.json';
import * as THREE from 'three';

export interface SpringNode {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

export interface SpringEdge {
  sourceId: string;
  targetId: string;
  restLength: number;
}

export class SpringEdges {
  static debugUpdatesPerFrame = 0;

  static applySpringForce(
    delta: number,
    grabbedNodePos: THREE.Vector3,
    neighbors: SpringNode[],
    edges: SpringEdge[]
  ) {
    this.debugUpdatesPerFrame = 0;
    
    // Only run on immediate neighbors of the grabbed node
    for (const neighbor of neighbors) {
      const edge = edges.find(e => e.sourceId === neighbor.id || e.targetId === neighbor.id);
      if (!edge) continue;

      const currentDist = grabbedNodePos.distanceTo(neighbor.position);
      const displacement = currentDist - edge.restLength;
      
      const springForce = displacement * tuning.springEdges.stiffness;
      
      // Calculate force vector direction
      const direction = new THREE.Vector3().subVectors(grabbedNodePos, neighbor.position).normalize();
      
      // Apply force to velocity, apply damping
      neighbor.velocity.add(direction.multiplyScalar(springForce));
      neighbor.velocity.multiplyScalar(tuning.springEdges.damping);
      
      // Apply velocity to position
      neighbor.position.addScaledVector(neighbor.velocity, delta);
      
      this.debugUpdatesPerFrame++;
    }
  }

  static getDebugStats() {
    return {
      updatesLastFrame: this.debugUpdatesPerFrame
    };
  }
}
