import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      // Créer la connexion Socket.io
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        // Rejoindre automatiquement sa room personnelle pour les notifications
        newSocket.emit('join-user-room', user.id);
      });

      newSocket.on('disconnect', (_reason) => {
        setIsConnected(false);
      });

      newSocket.on('connect_error', (_error) => {
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup lors du démontage
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Si pas d'utilisateur, fermer la connexion
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user]);

  const joinGroup = (groupId: string) => {
    if (socket && isConnected) {
      socket.emit('join-group', groupId);
    }
  };

  const leaveGroup = (groupId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-group', groupId);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinGroup,
    leaveGroup,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
