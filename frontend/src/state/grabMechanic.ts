import tuning from '@/config/tuning.json';

export type NodeTier = 'leaf' | 'mid' | 'hub';

export interface NodeGrabEvent {
  nodeId: string;
  tier?: NodeTier;
  cyclesRemaining?: number;
  wasInterrupted?: boolean;
}

export class GrabMechanic {
  static classifyNode(degree: number): NodeTier {
    if (degree <= tuning.grabDifficulty.leafMax) return 'leaf';
    if (degree <= tuning.grabDifficulty.midMax) return 'mid';
    return 'hub';
  }

  static tugCyclesNeeded(degree: number): number {
    const effort = tuning.grabDifficulty.baseEffort + degree * tuning.grabDifficulty.degreeMultiplier;
    return Math.min(tuning.grabDifficulty.maxTugCycles, Math.max(1, Math.ceil(effort / tuning.grabDifficulty.effortPerTug)));
  }

  static emitGrabbed(nodeId: string, degree: number) {
    const tier = this.classifyNode(degree);
    window.dispatchEvent(new CustomEvent<NodeGrabEvent>('node:grabbed', { 
      detail: { nodeId, tier } 
    }));
    return tier;
  }

  static emitTugged(nodeId: string, cyclesRemaining: number) {
    window.dispatchEvent(new CustomEvent<NodeGrabEvent>('node:tugged', { 
      detail: { nodeId, cyclesRemaining } 
    }));
  }

  static emitReleased(nodeId: string, wasInterrupted: boolean) {
    window.dispatchEvent(new CustomEvent<NodeGrabEvent>('node:released', { 
      detail: { nodeId, wasInterrupted } 
    }));
  }
}
