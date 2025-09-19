import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PostSEOProps {
  post: {
    _id?: string;
    id?: string;
    slug?: string;
    title: string;
    content: string;
    author: {
      _id?: string;
      id?: string;
      prenom: string;
      nom: string;
      username?: string;
      profilePicture?: string;
    };
    tags?: string[];
    likesCount?: number;
    commentsCount?: number;
    createdAt: string | Date;
    updatedAt?: string | Date;
  };
}

const PostSEO: React.FC<PostSEOProps> = ({ post }) => {
  // CRITICAL FIX: Mémoriser toutes les valeurs pour éviter React error #310
  const memoizedValues = React.useMemo(() => {
    try {
      // Convertir les dates en format ISO de manière sécurisée
      const publishedTime = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
      const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedTime;
      
      // Créer l'URL canonique du post
      const postUrl = post.slug 
        ? `https://jurinapse.com/post/${post.slug}`
        : `https://jurinapse.com/post/${post._id || post.id}`;
        
      // Nettoyer le contenu pour la description (supprimer HTML, limiter à 155 caractères)
      const cleanContent = (post.content || '')
        .replace(/<[^>]*>/g, '') // Supprimer les tags HTML
        .replace(/\n/g, ' ') // Remplacer les retours à la ligne par des espaces
        .trim();
      const description = cleanContent.length > 155 
        ? cleanContent.substring(0, 152) + '...'
        : cleanContent;
        
      // Nom complet de l'auteur
      const authorName = `${post.author?.prenom || ''} ${post.author?.nom || ''}`.trim();
      
      // Mots-clés basés sur les tags
      const keywords = post.tags?.length 
        ? `JuriNapse, droit, juridique, ${post.tags.join(', ')}`
        : 'JuriNapse, droit, juridique, publications légales';

      // Schema.org structured data pour les articles
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title || '',
        "description": description,
        "image": post.author?.profilePicture || "https://jurinapse.com/logo-og.png",
        "author": {
          "@type": "Person",
          "name": authorName,
          "url": `https://jurinapse.com/profile/${post.author?.username || post.author?._id || post.author?.id}`
        },
        "publisher": {
          "@type": "Organization",
          "name": "JuriNapse",
          "logo": {
            "@type": "ImageObject",
            "url": "https://jurinapse.com/logo-og.png"
          }
        },
        "datePublished": publishedTime,
        "dateModified": modifiedTime,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": postUrl
        },
        "url": postUrl,
        "keywords": keywords,
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

      // Tags mémorisés pour éviter les recreations d'arrays
      const tagElements = post.tags?.map(tag => ({ key: tag, content: tag })) || [];

      return {
        publishedTime,
        modifiedTime,
        postUrl,
        description,
        authorName,
        keywords,
        structuredData,
        tagElements
      };
    } catch (error) {
      console.error('Error in PostSEO memoizedValues:', error);
      // Valeurs par défaut sécurisées
      return {
        publishedTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        postUrl: 'https://jurinapse.com',
        description: 'JuriNapse - Plateforme juridique',
        authorName: 'JuriNapse',
        keywords: 'JuriNapse, droit, juridique',
        structuredData: {},
        tagElements: []
      };
    }
  }, [
    post.title,
    post.content,
    post.createdAt,
    post.updatedAt,
    post.slug,
    post._id,
    post.id,
    post.author?.prenom,
    post.author?.nom,
    post.author?.username,
    post.author?._id,
    post.author?.id,
    post.author?.profilePicture,
    post.tags?.join(','), // Utiliser join pour une dépendance stable
    post.likesCount,
    post.commentsCount
  ]);

  const { publishedTime, modifiedTime, postUrl, description, authorName, keywords, structuredData, tagElements } = memoizedValues;

  return (
    <Helmet>
      {/* Titre et description de base */}
      <title>{post.title} - JuriNapse</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={authorName} />
      
      {/* URL canonique */}
      <link rel="canonical" href={postUrl} />
      
      {/* Open Graph pour Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={postUrl} />
      <meta property="og:site_name" content="JuriNapse" />
      <meta property="og:image" content={post.author?.profilePicture || "https://jurinapse.com/logo-og.png"} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Open Graph spécifique aux articles */}
      <meta property="article:author" content={authorName} />
      <meta property="article:published_time" content={publishedTime} />
      <meta property="article:modified_time" content={modifiedTime} />
      <meta property="article:section" content="Juridique" />
      
      {/* Tags mémorisés pour éviter React error #310 */}
      {tagElements.map(({ key, content }) => (
        <meta key={key} property="article:tag" content={content} />
      ))}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@JuriNapse" />
      <meta name="twitter:creator" content={`@${post.author?.username || authorName}`} />
      <meta name="twitter:title" content={post.title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={post.author?.profilePicture || "https://jurinapse.com/logo-og.png"} />
      
      {/* Données structurées JSON-LD mémorisées */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Meta tags additionnels pour les moteurs de recherche */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      
      {/* Informations sur la publication */}
      <meta name="article:published_time" content={publishedTime} />
      <meta name="article:modified_time" content={modifiedTime} />
      <meta name="article:author" content={authorName} />
    </Helmet>
  );
};

export default PostSEO;
