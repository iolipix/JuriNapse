import React, { useState, useRef, useEffect } from 'react';

interface AnimatedGroupAvatarProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedGroupAvatar: React.FC<AnimatedGroupAvatarProps> = ({ 
  src, 
  alt, 
  className = '', 
  size = 'medium' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isGif, setIsGif] = useState(false);
  const [staticSrc, setStaticSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Détecter si l'image est un GIF
  useEffect(() => {
    const checkIfGif = () => {
      // Vérifier l'extension ou l'URL de manière simple et fiable
      const isGifFile = src.toLowerCase().includes('.gif') || 
                       src.toLowerCase().includes('image/gif') ||
                       src.includes('data:image/gif') ||
                       src.includes('/gif/') ||
                       src.includes('.gif?') ||
                       src.includes('format=gif');
      
      setIsGif(isGifFile);
      
      if (isGifFile) {
        createStaticFrame();
      } else {
        setIsLoaded(true);
      }
    };

    checkIfGif();
  }, [src]);

  // Créer une image statique de la première frame du GIF
  const createStaticFrame = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Définir la taille du canvas en fonction de la prop size
      const canvasSize = size === 'small' ? 32 : size === 'medium' ? 40 : 48;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // Dessiner la première frame
      ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
      
      // Convertir en data URL pour l'image statique
      const staticDataUrl = canvas.toDataURL('image/png');
      setStaticSrc(staticDataUrl);
      setIsLoaded(true);
    };

    img.onerror = () => {
      // Si l'image ne peut pas être chargée, on utilise l'image originale
      setStaticSrc(src);
      setIsLoaded(true);
    };

    img.src = src;
  };

  // Gestion du survol
  const handleMouseEnter = () => {
    setIsHovered(true);
    // Forcer le rechargement du GIF pour redémarrer l'animation
    if (isGif && imgRef.current) {
      const currentSrc = imgRef.current.src;
      imgRef.current.src = '';
      // Petit délai pour forcer le rechargement
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.src = currentSrc;
        }
      }, 1);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Tailles selon la prop size
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-10 w-10',
    large: 'h-12 w-12'
  };

  if (!isGif) {
    // Si ce n'est pas un GIF, afficher l'image normalement
    return (
      <img 
        src={src} 
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onLoad={() => setIsLoaded(true)}
      />
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Canvas caché pour créer l'image statique */}
      <canvas 
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Image statique (première frame) */}
      {!isHovered && staticSrc && (
        <img 
          src={staticSrc}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover transition-opacity duration-200 ${className}`}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
      
      {/* Image animée (GIF complet) */}
      {isHovered && (
        <img 
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover transition-opacity duration-200 ${className}`}
          style={{ 
            opacity: isLoaded ? 1 : 0,
            // Forcer le rechargement du GIF pour redémarrer l'animation
            ...(isHovered && { 
              animation: 'none',
              // Petit truc pour forcer le rechargement
              filter: 'brightness(1.0)'
            })
          }}
        />
      )}
      
      {/* Fallback si pas encore chargé */}
      {!isLoaded && (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center ${className}`}>
          <span className="font-semibold text-blue-600 text-sm">
            {alt[0]?.toUpperCase() || '?'}
          </span>
        </div>
      )}
    </div>
  );
};

export default AnimatedGroupAvatar;
