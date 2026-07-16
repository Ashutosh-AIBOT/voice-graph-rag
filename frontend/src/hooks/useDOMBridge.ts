import { useState, useEffect } from 'react';
import * as THREE from 'three';

export interface DOMTargets {
  graph: THREE.Vector3;
  voiceControls: THREE.Vector3;
  docs: THREE.Vector3;
  avatarBox: { x: number, y: number, width: number, height: number };
}

export function useDOMBridge(camera: THREE.Camera | null) {
  const [targets, setTargets] = useState<DOMTargets>({
    graph: new THREE.Vector3(0, 0, 0),
    voiceControls: new THREE.Vector3(0, 0, 0),
    docs: new THREE.Vector3(0, 0, 0),
    avatarBox: { x: 0, y: 0, width: 0, height: 0 }
  });

  useEffect(() => {
    if (!camera) return;

    const updateTargets = () => {
      // Find DOM elements by ID or class
      const graphEl = document.getElementById('graph-container');
      const controlsEl = document.getElementById('voice-controls');
      const docsEl = document.getElementById('doc-strip');
      const avatarBoxEl = document.getElementById('avatar-card');

      const newTargets = { ...targets };

      if (avatarBoxEl) {
        const rect = avatarBoxEl.getBoundingClientRect();
        newTargets.avatarBox = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
      }

      // Convert DOM rect centers to WebGL coordinates
      const projectToWebGL = (el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth * 2 - 1;
        const y = -(rect.top + rect.height / 2) / window.innerHeight * 2 + 1;
        
        const vec = new THREE.Vector3(x, y, 0.5);
        vec.unproject(camera);
        // Note: we usually need to raycast or project onto a specific Z plane, 
        // but for basic target direction, unprojecting gives us a ray direction.
        
        // Let's assume a fixed Z distance for interaction (e.g. Z=0)
        vec.sub(camera.position).normalize();
        const distance = -camera.position.z / vec.z;
        const pos = new THREE.Vector3().copy(camera.position).add(vec.multiplyScalar(distance));
        return pos;
      };

      if (graphEl) newTargets.graph = projectToWebGL(graphEl);
      if (controlsEl) newTargets.voiceControls = projectToWebGL(controlsEl);
      if (docsEl) newTargets.docs = projectToWebGL(docsEl);

      setTargets(newTargets);
    };

    updateTargets();
    window.addEventListener('resize', updateTargets);
    
    // Listen for custom transition events to trigger re-calculation
    window.addEventListener('transition:beat', updateTargets);

    return () => {
      window.removeEventListener('resize', updateTargets);
      window.removeEventListener('transition:beat', updateTargets);
    };
  }, [camera]);

  return targets;
}
