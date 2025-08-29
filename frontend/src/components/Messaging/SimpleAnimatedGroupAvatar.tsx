import React, { useState, useEffect, useRef } from 'react';

interface SimpleAnimatedGroupAvatarProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  isHovered?: boolean; // Permet de contrôler l'animation depuis le parent
}

const SimpleAnimatedGroupAvatar: React.FC<SimpleAnimatedGroupAvatarProps> = ({ 
  src, 
  alt, 
  className = '', 
  size = 'medium',
  isHovered: externalIsHovered
}) => {
  const [internalIsHovered, setInternalIsHovered] = useState(false);
  const [isGif, setIsGif] = useState(false);
  const [staticImageUrl, setStaticImageUrl] = useState<string | null>(null);
  const [isStaticImageReady, setIsStaticImageReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Utiliser la prop isHovered si fournie, sinon utiliser l'état interne
  const isHovered = externalIsHovered !== undefined ? externalIsHovered : internalIsHovered;

  // Détecter si l'image est un GIF
  useEffect(() => {
    const checkIfGif = () => {
      const isGifFile = src.toLowerCase().includes('.gif') || 
                       src.toLowerCase().includes('image/gif') ||
                       src.includes('data:image/gif') ||
                       src.includes('/gif/') ||
                       src.includes('.gif?') ||
                       src.includes('format=gif');
      
      setIsGif(isGifFile);
      
      if (isGifFile) {
        createStaticImage();
      }
    };

    checkIfGif();
  }, [src]);

  // Créer une image statique à partir de la première frame du GIF
  const createStaticImage = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Taille selon la prop size - garder la taille exacte
      const canvasSize = size === 'small' ? 32 : size === 'medium' ? 40 : 48;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // Calculer les dimensions pour centrer l'image tout en gardant ses proportions
      const scale = Math.max(canvasSize / img.width, canvasSize / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Centrer l'image
      const offsetX = (canvasSize - scaledWidth) / 2;
      const offsetY = (canvasSize - scaledHeight) / 2;

      // Dessiner l'image centrée et à la bonne échelle (crop si nécessaire)
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Convertir en blob puis en URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setStaticImageUrl(url);
          setIsStaticImageReady(true);
        }
      }, 'image/png');
    };

    img.onerror = () => {
      // Si échec, utiliser l'image originale
      setStaticImageUrl(src);
      setIsStaticImageReady(true);
    };

    img.src = src;
  };

  // Nettoyer l'URL blob quand le composant est détruit
  useEffect(() => {
    return () => {
      if (staticImageUrl && staticImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(staticImageUrl);
      }
    };
  }, [staticImageUrl]);

  // Tailles selon la prop size
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-10 w-10',
    large: 'h-12 w-12'
  };

  // Pour tous les types d'images (GIF ou non)
  return (
    <div 
      className={`relative ${sizeClasses[size]} rounded-full overflow-hidden`}
      onMouseEnter={() => setInternalIsHovered(true)}
      onMouseLeave={() => setInternalIsHovered(false)}
    >
      {/* Canvas caché pour générer l'image statique */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Si c'est un GIF */}
      {isGif ? (
        <>
          {/* Image statique - visible quand pas survolé */}
          {!isHovered && staticImageUrl && isStaticImageReady && (
            <img 
              src={staticImageUrl}
              alt={alt}
              className={`${sizeClasses[size]} rounded-full object-cover object-center ${className}`}
            />
          )}
          
          {/* Image animée - visible quand survolé */}
          {isHovered && (
            <img 
              src={src}
              alt={alt}
              className={`${sizeClasses[size]} rounded-full object-cover object-center ${className}`}
              key={Date.now()} // Forcer le rechargement pour redémarrer l'animation
            />
          )}
          
          {/* Fallback si l'image statique n'est pas prête */}
          {!isStaticImageReady && (
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center ${className}`}>
              <span className="font-semibold text-blue-600 text-sm">
                {alt[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </>
      ) : (
        /* Si ce n'est pas un GIF, afficher l'image normalement */
        <img 
          src={src} 
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        />
      )}
    </div>
  );
};

export default SimpleAnimatedGroupAvatar;
