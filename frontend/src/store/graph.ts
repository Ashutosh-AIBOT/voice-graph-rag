import { create } from 'zustand';

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  description?: string;
  sourceDoc?: string;
  val?: number;
  community?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  confidence?: number;
  description?: string;
  sourceDoc?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/** Entity highlight sent via LiveKit DataChannel from the RAG agent */
export interface RagCitedEntity {
  id: string;
  name: string;
  score: number;
}

interface GraphState {
  data: GraphData;
  highlightedEntities: string[];
  highlightedPaths: string[];
  searchTerm: string;
  visibleTypes: Record<string, boolean>;
  visibleRelationships: Record<string, boolean>;
  selectedEntity: GraphNode | null;
  dim: 2 | 3;
  /** The node currently being "pulsed" during the sequential RAG animation */
  activeAnimatingNode: string | null;
  /** Accumulated set of nodes highlighted so far in the current RAG response */
  ragHighlightedIds: string[];
  setData: (data: GraphData) => void;
  setHighlighted: (entities: string[], paths?: string[]) => void;
  clearHighlighted: () => void;
  setSearchTerm: (term: string) => void;
  toggleType: (type: string) => void;
  toggleRelationship: (rel: string) => void;
  selectEntity: (entity: GraphNode | null) => void;
  setDim: (dim: 2 | 3) => void;
  /** Called per-node during the staggered animation from the LiveKit hook */
  setAnimatingNode: (id: string | null) => void;
  /** Accumulate a node into the permanent RAG highlight set */
  addRagHighlight: (id: string) => void;
  /** Clear all RAG animation state (on new turn / new chat) */
  clearRagHighlights: () => void;
  animationTimeouts: NodeJS.Timeout[];
  animateHighlightSequence: (entityIds: string[], onComplete?: () => void) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  data: { nodes: [], links: [] },
  highlightedEntities: [],
  highlightedPaths: [],
  searchTerm: '',
  visibleTypes: {},
  visibleRelationships: {},
  selectedEntity: null,
  dim: 2,
  activeAnimatingNode: null,
  ragHighlightedIds: [],
  animationTimeouts: [],
  setData: (data) => set({ data }),
  setHighlighted: (entities, paths = []) =>
    set({ highlightedEntities: entities, highlightedPaths: paths }),
  clearHighlighted: () => {
    get().animationTimeouts.forEach(clearTimeout);
    set({ highlightedEntities: [], highlightedPaths: [] });
  },
  setSearchTerm: (term) => set({ searchTerm: term }),
  toggleType: (type) =>
    set((state) => ({
      visibleTypes: { ...state.visibleTypes, [type]: !state.visibleTypes[type] },
    })),
  toggleRelationship: (rel) =>
    set((state) => ({
      visibleRelationships: {
        ...state.visibleRelationships,
        [rel]: !state.visibleRelationships[rel],
      },
    })),
  selectEntity: (entity) => set({ selectedEntity: entity }),
  setDim: (dim) => set({ dim }),
  setAnimatingNode: (id) => set({ activeAnimatingNode: id }),
  addRagHighlight: (id) =>
    set((state) => ({
      ragHighlightedIds: state.ragHighlightedIds.includes(id)
        ? state.ragHighlightedIds
        : [...state.ragHighlightedIds, id],
    })),
  clearRagHighlights: () => {
    get().animationTimeouts.forEach(clearTimeout);
    set({ ragHighlightedIds: [], activeAnimatingNode: null, animationTimeouts: [] });
  },
  animateHighlightSequence: (entityIds, onComplete) => {
    const state = get();
    state.clearRagHighlights();
    state.setHighlighted([], []);

    const timeouts: NodeJS.Timeout[] = [];
    
    entityIds.forEach((id, i) => {
      // Phase 1: gold pulse
      timeouts.push(setTimeout(() => {
        get().setAnimatingNode(id);
        get().addRagHighlight(id);
      }, i * 450));

      // Phase 2: clear gold pulse
      timeouts.push(setTimeout(() => {
        get().setAnimatingNode(null);
      }, i * 450 + 400));
    });

    // Final phase: Set regular highlights and run callback
    timeouts.push(setTimeout(() => {
      get().setHighlighted(entityIds, []);
      if (onComplete) onComplete();
    }, entityIds.length * 450 + 100));

    set({ animationTimeouts: timeouts });
  },
}));
