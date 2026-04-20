import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { showToast } from '../store/slices/uiSlice';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'https://plrcap-backend.ambitiousground-313553a9.westeurope.azurecontainerapps.io/api/v1'
//'https://pluralcode-api.onrender.com/api/v1';

class SocketService {
    public socket: Socket | null = null;
    private token: string | null = null;

    connect(token: string) {
        if (this.socket?.connected) return;
        this.token = token;

        this.socket = io(`${SOCKET_URL}/communities`, {
            auth: { token: `Bearer ${token}` },
        });

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket namespace /communities');
        });

        this.socket.on('connect_error', (error: any) => {
            console.error('Socket connection error:', error);
        });

        // Global listeners
        this.setupGlobalListeners();
    }

    private setupGlobalListeners() {
        if (!this.socket) return;

        this.socket.on('mention:received', (data: any) => {
            const { topicTitle } = data;
            store.dispatch(
                showToast({
                    message: `You were mentioned in: ${topicTitle || 'a topic'}`,
                    type: 'info',
                })
            );
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinCommunity(communityId: string) {
        if (this.socket?.connected) {
            this.socket.emit('joinCommunity', { communityId });
        }
    }

    leaveCommunity(communityId: string) {
        if (this.socket?.connected) {
            this.socket.emit('leaveCommunity', { communityId });
        }
    }

    on(event: string, callback: (...args: any[]) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string, callback?: (...args: any[]) => void) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

export const socketService = new SocketService();
