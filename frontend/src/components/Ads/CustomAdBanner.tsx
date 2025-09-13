import React from 'react';

interface CustomAdBannerProps {
  width: number;
  height: number;
  imageUrl: string;
  clickUrl: string;
  altText: string;
  className?: string;
}

const CustomAdBanner: React.FC<CustomAdBannerProps> = ({
  width,
  height,
  imageUrl,
  clickUrl,
  altText,
  className = ''
}) => {
  const handleClick = () => {
    // Ouvrir le lien dans un nouvel onglet
    window.open(clickUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={`ad-custom-banner cursor-pointer transition-transform hover:scale-105 ${className}`}
      style={{ width: width, height: height }}
      onClick={handleClick}
    >
      <img
        src={imageUrl}
        alt={altText}
        className="w-full h-full object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
        style={{ width: width, height: height }}
        loading="lazy"
      />
    </div>
  );
};

export default CustomAdBanner;
