require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');

// Configuration MongoDB
const mongoURI = process.env.MONGODB_URI;

async function debugApiMessages() {
    try {
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ Connecté à MongoDB');

        // Import des modèles
        const Message = require('./backend/models/message.model.js');
        const User = require('./backend/models/user.model.js');

        const groupId = '6877ada30f934e0b470cf524'; // ID du groupe Droit L3
        
        console.log('\n🔍 DEBUG API MESSAGES - ERREUR 500');
        console.log('=====================================');

        // Test 1: Requête simple sans populate
        console.log('\n1️⃣ TEST REQUÊTE SIMPLE (sans populate)');
        try {
            const simpleMessages = await Message.find({ groupId }).limit(5);
            console.log(`✅ Messages trouvés: ${simpleMessages.length}`);
            console.log('📋 Premiers authorIds:', simpleMessages.slice(0, 3).map(m => ({ id: m._id.toString().slice(-6), authorId: m.authorId })));
        } catch (error) {
            console.log('❌ Erreur requête simple:', error.message);
        }

        // Test 2: Vérification des authorIds
        console.log('\n2️⃣ VÉRIFICATION DES AUTHOR IDS');
        const allMessages = await Message.find({ groupId });
        const authorIds = [...new Set(allMessages.map(m => m.authorId?.toString()).filter(Boolean))];
        console.log(`📊 Total messages: ${allMessages.length}`);
        console.log(`👤 AuthorIds uniques: ${authorIds.length}`);
        
        for (const authorId of authorIds) {
            const user = await User.findById(authorId);
            const messageCount = allMessages.filter(m => m.authorId?.toString() === authorId).length;
            console.log(`   - ${authorId}: ${user ? `${user.username}${user.isDeleted ? ' (supprimé)' : ''}` : '❌ UTILISATEUR INTROUVABLE'} (${messageCount} messages)`);
        }

        // Test 3: Requête avec populate standard
        console.log('\n3️⃣ TEST AVEC POPULATE STANDARD');
        try {
            const populatedMessages = await Message.find({ groupId })
                .populate('authorId', 'username profilePicture isDeleted')
                .limit(5);
            console.log(`✅ Messages avec populate: ${populatedMessages.length}`);
        } catch (error) {
            console.log('❌ Erreur populate standard:', error.message);
        }

        // Test 4: Requête avec populate strictPopulate false (pour éviter les erreurs sur les refs manquantes)
        console.log('\n4️⃣ TEST AVEC POPULATE SÉCURISÉ');
        try {
            const safeMessages = await Message.find({ groupId })
                .populate({
                    path: 'authorId',
                    select: 'username profilePicture isDeleted canLogin',
                    options: { strictPopulate: false }
                })
                .sort({ createdAt: -1 })
                .limit(20);
            console.log(`✅ Messages sécurisés: ${safeMessages.length}`);
            
            // Compter les messages avec/sans author
            const withAuthor = safeMessages.filter(m => m.authorId).length;
            const withoutAuthor = safeMessages.filter(m => !m.authorId).length;
            console.log(`   - Avec author: ${withAuthor}`);
            console.log(`   - Sans author: ${withoutAuthor}`);
        } catch (error) {
            console.log('❌ Erreur populate sécurisé:', error.message);
        }

        // Test 5: Simulation exacte de l'API
        console.log('\n5️⃣ SIMULATION API EXACTE');
        try {
            const page = 1;
            const limit = 20;
            const skip = (page - 1) * limit;
            
            const apiMessages = await Message.find({ groupId })
                .populate({
                    path: 'authorId',
                    select: 'username profilePicture isDeleted canLogin hideFromSuggestions',
                    options: { strictPopulate: false }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
                
            console.log(`✅ API Simulation réussie: ${apiMessages.length} messages`);
            
            // Analyser les résultats
            const results = apiMessages.map(message => ({
                id: message._id.toString().slice(-6),
                content: message.content?.substring(0, 50) + '...',
                authorId: message.authorId ? message.authorId._id?.toString().slice(-6) : 'NULL',
                authorName: message.authorId?.username || 'Utilisateur Supprimé'
            }));
            
            console.log('📋 Premiers résultats:');
            results.slice(0, 5).forEach(r => {
                console.log(`   - ${r.id}: "${r.content}" by ${r.authorName} (${r.authorId})`);
            });
            
        } catch (error) {
            console.log('❌ Erreur simulation API:', error.message);
            console.log('📋 Stack:', error.stack);
        }

        console.log('\n📝 Connexion MongoDB fermée');
        mongoose.connection.close();

    } catch (error) {
        console.error('💥 Erreur générale:', error);
        mongoose.connection.close();
    }
}

debugApiMessages();
