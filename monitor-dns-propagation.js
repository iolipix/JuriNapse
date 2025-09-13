const { exec } = require('child_process');

console.log('🌐 SURVEILLANCE PROPAGATION DNS - jurinapse.com → Cloudflare');
console.log('=' .repeat(60));
console.log('⏱️  Démarrage de la surveillance...');
console.log('📋 État actuel : Nameservers OVH (ns10.ovh.net, dns10.ovh.net)');
console.log('🎯 Objectif : Détecter nameservers Cloudflare');
console.log('');

let checkCount = 0;
const maxChecks = 288; // 24 heures max (vérif toutes les 5 min)

function checkDNSPropagation() {
    checkCount++;
    const now = new Date().toLocaleTimeString();
    
    console.log(`🔍 Vérification ${checkCount}/${maxChecks} - ${now}`);
    
    // Vérifier les nameservers
    exec('nslookup -type=NS jurinapse.com', (error, stdout, stderr) => {
        if (error) {
            console.log(`❌ Erreur DNS: ${error.message}`);
            return;
        }
        
        const output = stdout.toLowerCase();
        
        // Vérifier si Cloudflare est présent
        if (output.includes('cloudflare.com')) {
            console.log('');
            console.log('🎉 PROPAGATION TERMINÉE ! 🎉');
            console.log('✅ Les nameservers Cloudflare sont actifs !');
            console.log('');
            console.log('📋 Nameservers détectés:');
            
            // Extraire et afficher les nameservers
            const lines = stdout.split('\n');
            lines.forEach(line => {
                if (line.includes('nameserver') && line.includes('cloudflare.com')) {
                    const ns = line.split('=')[1]?.trim();
                    console.log(`   ✅ ${ns}`);
                }
            });
            
            console.log('');
            console.log('🚀 PROCHAINES ÉTAPES:');
            console.log('1. Aller sur Cloudflare Dashboard');
            console.log('2. Configurer les enregistrements DNS');
            console.log('3. Activer SSL et sécurité');
            console.log('4. Tester https://jurinapse.com');
            console.log('');
            console.log('🔗 DNS Records à créer:');
            console.log('   A     @     66.33.22.160                 (Proxied)');
            console.log('   A     www   66.33.22.160                 (Proxied)');
            console.log('   CNAME api   jurinapse-production.up.railway.app  (Proxied)');
            console.log('   CNAME app   juri-napse.vercel.app        (Proxied)');
            console.log('');
            console.log('📧 IMPORTANT - Restaurer les emails:');
            console.log('   MX    @     mx1.mail.ovh.net (priorité 1)');
            console.log('   MX    @     mx2.mail.ovh.net (priorité 5)');
            console.log('   MX    @     mx3.mail.ovh.net (priorité 100)');
            
            // Arrêter la surveillance
            clearInterval(intervalId);
            
        } else if (output.includes('ovh.net')) {
            // Toujours OVH
            console.log('⏳ Encore sur OVH (ns10.ovh.net, dns10.ovh.net)');
            console.log(`   💡 Propagation en cours... Prochaine vérif dans 5 min`);
            
        } else {
            // État intermédiaire ou erreur
            console.log('🔄 État de transition détecté');
            console.log('📋 Réponse DNS:', stdout.substring(0, 200) + '...');
        }
        
        console.log('');
        
        // Arrêter après 24h max
        if (checkCount >= maxChecks) {
            console.log('⚠️ TIMEOUT ATTEINT (24h)');
            console.log('📞 Contacter support OVH ou Cloudflare si propagation non terminée');
            clearInterval(intervalId);
        }
    });
}

// Lancer la première vérification immédiatement
checkDNSPropagation();

// Puis vérifier toutes les 5 minutes
const intervalId = setInterval(checkDNSPropagation, 5 * 60 * 1000);

console.log('⚡ Script en cours d\'exécution...');
console.log('🛑 Appuyer Ctrl+C pour arrêter manuellement');
console.log('');

// Gérer l'arrêt propre
process.on('SIGINT', () => {
    console.log('');
    console.log('🛑 Surveillance interrompue par l\'utilisateur');
    console.log('📊 Vérifications effectuées: ' + checkCount);
    console.log('');
    console.log('🔍 Pour vérifier manuellement:');
    console.log('   nslookup -type=NS jurinapse.com');
    console.log('');
    process.exit(0);
});

// Message de statut toutes les 30 minutes
setInterval(() => {
    const elapsed = Math.round((checkCount * 5) / 60 * 10) / 10; // heures écoulées
    console.log(`📊 Statut: ${elapsed}h écoulées - ${checkCount} vérifications`);
}, 30 * 60 * 1000);
