export interface RemoteAvatarState {
  userId: string;
  personaId: string;
  x: number;
  y: number;
  z: number;
  state: string;
  currentNodeId: string | null;
  lastUpdate: number;
}

class MultiplayerBridge {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private userId: string;
  private remoteAvatars: Map<string, RemoteAvatarState> = new Map();
  private initialized = false;

  constructor() {
    this.userId = 'user_' + Math.random().toString(36).substring(2, 9);
  }

  public init(roomId: string) {
    if (this.initialized && this.roomId === roomId) return;
    this.roomId = roomId;

    this.connect();
    this.initialized = true;
  }

  private connect() {
    // Phase 21: Establish WebSocket to Django endpoint (Mocked for now since backend is not ready)
    console.log(`[Multiplayer] Connecting to room ${this.roomId} as ${this.userId}`);
    
    // In real implementation:
    // const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/presence/${this.roomId}/`;
    // this.ws = new WebSocket(wsUrl);
    // this.ws.onmessage = this.handleMessage.bind(this);
    
    // For now, we just mock the connection and listen for local position updates to broadcast
    window.addEventListener('avatar:state_changed', this.broadcastLocalState.bind(this) as EventListener);
  }

  private broadcastLocalState(e: Event) {
    const ce = e as CustomEvent;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'position',
        userId: this.userId,
        state: ce.detail.state,
        nodeId: ce.detail.payload?.nodeId || null,
        // x, y, z would be fetched from VRMScene
      }));
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      if (data.userId === this.userId) return;

      if (data.type === 'position' || data.type === 'join') {
        this.remoteAvatars.set(data.userId, {
          userId: data.userId,
          personaId: data.personaId || 'calm_tutor',
          x: data.x,
          y: data.y,
          z: data.z,
          state: data.state,
          currentNodeId: data.nodeId,
          lastUpdate: Date.now()
        });
        
        // Emit for VRMScene to render ghosts
        window.dispatchEvent(new CustomEvent('multiplayer:update', { 
          detail: { avatars: Array.from(this.remoteAvatars.values()) } 
        }));
      } else if (data.type === 'leave') {
        this.remoteAvatars.delete(data.userId);
        window.dispatchEvent(new CustomEvent('multiplayer:update', { 
          detail: { avatars: Array.from(this.remoteAvatars.values()) } 
        }));
      }
    } catch (e) {
      console.warn("Failed to parse multiplayer message", e);
    }
  }

  public getRemoteAvatars() {
    return Array.from(this.remoteAvatars.values());
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.initialized = false;
  }
}

export const multiplayerBridge = new MultiplayerBridge();
