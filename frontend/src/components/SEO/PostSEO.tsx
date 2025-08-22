import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PostSEOProps {
  post: {
    id: string;
    title?: string;
    content: string;
    author: {
      firstName: string;
      lastName: string;
      username: string;
    };
    tags?: string[];
    createdAt: string;
    likesCount?: number;
    commentsCount?: number;
  };
}

const PostSEO: React.FC<PostSEOProps> = ({ post }) => {
  const authorName = `${post.author.firstName} ${post.author.lastName}`;
  const postTitle = post.title || `Publication de ${authorName} sur JuriNapse`;
  
  // Créer une description à partir du contenu (limite à 160 caractères)
  const description = post.content.length > 160 
    ? `${post.content.substring(0, 157)}...`
    : post.content;

  const seoTitle = `${postTitle} | ${authorName} - JuriNapse`;
  
  // Mots-clés basés sur les tags et le contenu
  const keywords = [
    authorName,
    post.author.username,
    'jurinapse',
    'droit',
    'publication juridique',
    'communauté juridique',
    ...(post.tags || [])
  ].filter(Boolean).join(', ');

  const postUrl = `${window.location.origin}/post/${post.id}`;
  const authorUrl = `${window.location.origin}/profile/${post.author.username}`;

  // Données structurées Schema.org pour les articles
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": postTitle,
    "description": description,
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": authorUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "JuriNapse",
      "url": window.location.origin,
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/Svg/180x180-converti-depuis-png.svg`
      }
    },
    "url": postUrl,
    "datePublished": post.createdAt,
    "dateModified": post.createdAt,
    "mainEntityOfPage": postUrl,
    "articleSection": "Droit",
    "keywords": post.tags?.join(', ') || 'droit, juridique',
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": post.likesCount || 0
      },
      {
        "@type": "InteractionCounter", 
        "interactionType": "https://schema.org/CommentAction",
        "userInteractionCount": post.commentsCount || 0
      }
    ]
  };

  return (
    <Helmet>
      {/* Titre et métadonnées de base */}
      <title>{seoTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={authorName} />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={postUrl} />
      <meta property="og:site_name" content="JuriNapse" />
      <meta property="og:image" content={`${window.location.origin}/1200x630.png`} />
      
      {/* Article Facebook spécifique */}
      <meta property="article:author" content={authorUrl} />
      <meta property="article:published_time" content={post.createdAt} />
      <meta property="article:section" content="Droit" />
      {post.tags && post.tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${window.location.origin}/1200x630.png`} />
      <meta name="twitter:site" content="@jurinapse" />
      <meta name="twitter:creator" content={`@${post.author.username}`} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={postUrl} />
      
      {/* Données structurées JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default PostSEO;
