// Types pour le système publicitaire
export interface AdConfig {
  enabled: boolean;
  testMode: boolean;
  clientId: string;
}

export interface AdSlot {
  id: string;
  format: 'banner' | 'native' | 'rectangle';
  size: {
    width: number;
    height: number;
  };
  responsive?: boolean;
}

export interface AdProps {
  slot: string;
  size?: [number, number];
  format?: 'auto' | 'rectangle' | 'banner';
  className?: string;
  responsive?: boolean;
  testMode?: boolean;
}

export interface AdContextType {
  config: AdConfig;
  isLoaded: boolean;
  error: string | null;
  refreshAd: (slotId: string) => void;
}
