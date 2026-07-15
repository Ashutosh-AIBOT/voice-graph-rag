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
}

export const useGraphStore = create<GraphState>((set) => ({
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
  setData: (data) => set({ data }),
  setHighlighted: (entities, paths = []) =>
    set({ highlightedEntities: entities, highlightedPaths: paths }),
  clearHighlighted: () => set({ highlightedEntities: [], highlightedPaths: [] }),
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
  clearRagHighlights: () => set({ ragHighlightedIds: [], activeAnimatingNode: null }),
}));
