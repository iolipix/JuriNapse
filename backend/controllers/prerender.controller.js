const express = require('express');
const User = require('../models/user.model');
const Post = require('../models/post.model');

/**
 * Route de prérendu SEO pour les profils utilisateurs
 * Cette route génère du HTML statique pour que Google puisse indexer les profils
 */
const prerenderProfile = async (req, res) => {
    try {
        const { username } = req.params;
        
        // Récupérer les données de l'utilisateur
        const user = await User.findOne({ 
            username: username.toLowerCase() 
        }).select('username firstName lastName bio university isStudent profilePicture followersCount followingCount createdAt');
        
        if (!user) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Utilisateur introuvable - JuriNapse</title>
                    <meta name="robots" content="noindex">
                </head>
                <body>
                    <h1>Profil introuvable</h1>
                    <p>Cet utilisateur n'existe pas sur JuriNapse.</p>
                </body>
                </html>
            `);
        }
        
        // Récupérer les stats des publications
        const postsCount = await Post.countDocuments({ authorId: user._id });
        
        // Générer les métadonnées optimisées
        const fullName = `${user.firstName} ${user.lastName}`;
        const title = `${fullName} (@${username}) | Profil Juridique - JuriNapse`;
        const description = user.bio 
            ? `${fullName} - ${user.bio} | ${postsCount} publications, ${user.followersCount} abonnés sur JuriNapse, la communauté juridique française.`
            : `Découvrez le profil de ${fullName} sur JuriNapse. ${user.isStudent ? 'Étudiant' : 'Professionnel'} en droit${user.university ? ` à ${user.university}` : ''}. ${postsCount} publications, ${user.followersCount} abonnés.`;
        
        const keywords = [
            fullName,
            `${user.firstName} ${user.lastName}`,
            `${username}`,
            `${fullName} juriste`,
            `${fullName} droit`,
            `${fullName} JuriNapse`,
            user.university ? `${fullName} ${user.university}` : '',
            user.isStudent ? `${fullName} étudiant droit` : `${fullName} avocat`,
            'profil juridique',
            'communauté juridique',
            'juriste français'
        ].filter(Boolean).join(', ');
        
        const profileUrl = `https://jurinapse.com/profile/${username}`;
        const imageUrl = user.profilePicture || 'https://jurinapse.com/default-profile.png';
        
        // Données structurées Schema.org
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": fullName,
            "alternateName": username,
            "description": description,
            "image": imageUrl,
            "url": profileUrl,
            "jobTitle": user.isStudent ? 'Étudiant en droit' : 'Professionnel du droit',
            "affiliation": user.university ? {
                "@type": "EducationalOrganization",
                "name": user.university
            } : undefined,
            "memberOf": {
                "@type": "Organization", 
                "name": "JuriNapse",
                "url": "https://jurinapse.com"
            },
            "interactionStatistic": [
                {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/WriteAction", 
                    "userInteractionCount": postsCount
                },
                {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/FollowAction",
                    "userInteractionCount": user.followersCount
                }
            ],
            "dateCreated": user.createdAt
        };
        
        // Générer le HTML optimisé pour SEO
        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- SEO Principal -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <meta name="author" content="${fullName}">
    <meta name="robots" content="index, follow">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${profileUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="profile">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${profileUrl}">
    <meta property="og:site_name" content="JuriNapse">
    
    <!-- Profil Facebook spécifique -->
    <meta property="profile:first_name" content="${user.firstName}">
    <meta property="profile:last_name" content="${user.lastName}">
    <meta property="profile:username" content="${username}">
    
    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@jurinapse">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Données structurées JSON-LD -->
    <script type="application/ld+json">
        ${JSON.stringify(structuredData, null, 2)}
    </script>
    
    <!-- Redirect vers SPA pour les vrais utilisateurs -->
    <script>
        // Si ce n'est pas un bot, rediriger vers l'app React
        if (!/bot|crawl|slurp|spider|facebook|twitter|linkedin/i.test(navigator.userAgent)) {
            window.location.replace('/profile/${username}#spa');
        }
    </script>
    
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .profile { text-align: center; }
        .avatar { width: 120px; height: 120px; border-radius: 50%; margin: 20px auto; display: block; }
        .bio { color: #666; margin: 20px 0; line-height: 1.6; }
        .stats { display: flex; justify-content: center; gap: 30px; margin: 20px 0; }
        .stat { text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #333; }
        .stat-label { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="profile">
        <img src="${imageUrl}" alt="${fullName}" class="avatar" onerror="this.src='/default-profile.png'">
        <h1>${fullName}</h1>
        <h2>@${username}</h2>
        
        ${user.university ? `<p><strong>${user.university}</strong></p>` : ''}
        ${user.bio ? `<p class="bio">${user.bio}</p>` : ''}
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${postsCount}</div>
                <div class="stat-label">Publications</div>
            </div>
            <div class="stat">
                <div class="stat-number">${user.followersCount}</div>
                <div class="stat-label">Abonnés</div>
            </div>
            <div class="stat">
                <div class="stat-number">${user.followingCount}</div>
                <div class="stat-label">Abonnements</div>
            </div>
        </div>
        
        <p>
            <strong>${fullName}</strong> fait partie de la communauté JuriNapse, 
            la plateforme sociale dédiée aux professionnels et étudiants en droit.
        </p>
        
        <p>
            <a href="https://jurinapse.com">🔗 Rejoindre JuriNapse</a>
        </p>
    </div>
    
    <!-- Contenu caché pour SEO -->
    <div style="display: none;">
        <h2>Profil de ${fullName} sur JuriNapse</h2>
        <p>${fullName} est ${user.isStudent ? 'un étudiant' : 'un professionnel'} en droit${user.university ? ` à ${user.university}` : ''}.</p>
        <p>Découvrez ses ${postsCount} publications et connectez-vous avec ses ${user.followersCount} abonnés sur la principale plateforme juridique française.</p>
        <p>JuriNapse réunit la communauté juridique française : avocats, juristes, étudiants en droit, magistrats et professionnels du secteur.</p>
    </div>
</body>
</html>
        `;
        
        // Envoyer le HTML avec les headers appropriés
        res.set({
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600', // Cache 1 heure
            'X-Prerendered': 'true'
        });
        
        res.send(html);
        
    } catch (error) {
        console.error('Erreur prérendu profil:', error);
        res.status(500).send('Erreur lors de la génération du profil');
    }
};

module.exports = { prerenderProfile };
