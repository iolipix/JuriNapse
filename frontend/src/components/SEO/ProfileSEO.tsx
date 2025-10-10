import React from 'react';
import { Helmet } from 'react-helmet-async';

interface ProfileSEOProps {
  user: {
    firstName: string;
    lastName: string;
    username: string;
    bio?: string;
    profilePicture?: string;
    isStudent: boolean;
    university?: string;
  };
  postsCount: number;
  followersCount: number;
  followingCount: number;
  connectionsCount: number;
  totalLikes: number;
}

const ProfileSEO: React.FC<ProfileSEOProps> = ({ 
  user, 
  postsCount, 
  followersCount, 
  followingCount, 
  connectionsCount, 
  totalLikes 
}) => {
  const fullName = `${user.firstName} ${user.lastName}`;
  
  const title = `${fullName} (@${user.username}) - JuriNapse`;
  const description = user.bio 
    ? `${user.bio} - ${user.isStudent ? 'Étudiant' : 'Professionnel'} en droit sur JuriNapse`
    : `Découvrez le profil de ${fullName} sur JuriNapse - ${user.isStudent ? 'Étudiant' : 'Professionnel'} en droit${user.university ? ` à ${user.university}` : ''}. ${postsCount} publications, ${followersCount} abonnés, ${followingCount} abonnements, ${connectionsCount} connexions.`;
  
  const keywords = [
    fullName,
    user.username,
    'JuriNapse',
    'droit',
    user.isStudent ? 'étudiant droit' : 'professionnel droit',
    user.university,
    'profil juridique',
    'communauté juridique',
    'juriste',
    'avocat'
  ].filter(Boolean).join(', ');

  const profileUrl = `${window.location.origin}/profile/${user.username}`;
  // Ne pas exposer les photos de profil dans les meta tags pour protéger la vie privée
  const imageUrl = `${window.location.origin}/default-profile.png`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": fullName,
    "alternateName": user.username,
    "description": description,
    "image": imageUrl,
    "url": profileUrl,
    "sameAs": [profileUrl],
    "jobTitle": user.isStudent ? 'Étudiant en droit' : 'Professionnel du droit',
    "affiliation": user.university ? {
      "@type": "Organization",
      "name": user.university
    } : undefined,
    "memberOf": {
      "@type": "Organization",
      "name": "JuriNapse",
      "url": window.location.origin,
      "description": "Plateforme sociale pour la communauté juridique"
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/CreateAction",
        "userInteractionCount": postsCount,
        "name": "Publications"
      },
      {
        "@type": "InteractionCounter", 
        "interactionType": "https://schema.org/FollowAction",
        "userInteractionCount": followersCount,
        "name": "Abonnés"
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/SubscribeAction",
        "userInteractionCount": followingCount,
        "name": "Abonnements"
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ConnectAction",
        "userInteractionCount": connectionsCount,
        "name": "Connexions"
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction", 
        "userInteractionCount": totalLikes,
        "name": "J'aime reçus"
      }
    ]
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={fullName} />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={profileUrl} />
      <meta property="og:site_name" content="JuriNapse" />
      
      {/* Profil Facebook spécifique */}
      <meta property="profile:first_name" content={user.firstName} />
      <meta property="profile:last_name" content={user.lastName} />
      <meta property="profile:username" content={user.username} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@jurinapse" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={profileUrl} />
      
      {/* Données structurées JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default ProfileSEO;
