import { useState, useEffect, useRef } from 'react';

export default function useWebSocket(url) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connecté');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      setData(parsedData);
    };

    ws.onerror = (error) => {
      console.error('WebSocket erreur:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket déconnecté');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { data, isConnected };
}