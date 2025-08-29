// DIAGNOSTIC COMPLET - React Error #310 - useMemo Analysis
// Analyser tous les useMemo restants qui pourraient causer le crash

const fs = require('fs');
const path = require('path');

async function analyzeUseMemoHooks() {
    console.log('🔍 ANALYSE COMPLETE DES USEMEMO - React Error #310\n');
    
    const frontendSrc = path.join(__dirname, 'frontend', 'src');
    const srcDir = path.join(__dirname, 'src');
    
    // Patterns dangereux à rechercher dans useMemo
    const dangerousPatterns = [
        /\.getTime\(\)/g,
        /new Date\([^)]*\)(?!\s*;\s*if\s*\()/g, // Date sans validation
        /\.filter\(/g,
        /\.map\(/g,
        /\.reduce\(/g,
        /\.sort\(/g,
        /\.split\(/g,
        /\.includes\(/g,
        /\.some\(/g,
        /\.every\(/g,
        /\.find\(/g,
        /Math\./g,
        /\+.*\d/g, // Opérations arithmétiques
        /\-.*\d/g,
        /\*.*\d/g,
        /\/.*\d/g
    ];
    
    const analysisResults = [];
    
    function analyzeFile(filePath) {
        if (!fs.existsSync(filePath)) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Trouver tous les useMemo
        const useMemoMatches = [];
        let inUseMemo = false;
        let useMemoStart = -1;
        let braceCount = 0;
        let currentUseMemo = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('useMemo') && line.includes('(')) {
                inUseMemo = true;
                useMemoStart = i + 1;
                braceCount = 0;
                currentUseMemo = line + '\n';
                continue;
            }
            
            if (inUseMemo) {
                currentUseMemo += line + '\n';
                
                // Compter les accolades
                for (const char of line) {
                    if (char === '{') braceCount++;
                    if (char === '}') braceCount--;
                }
                
                // Si on ferme le useMemo
                if ((line.includes('}, [') || line.includes('},[')) && braceCount <= 0) {
                    useMemoMatches.push({
                        startLine: useMemoStart,
                        endLine: i + 1,
                        content: currentUseMemo
                    });
                    
                    inUseMemo = false;
                    currentUseMemo = '';
                }
            }
        }
        
        // Analyser chaque useMemo trouvé
        useMemoMatches.forEach(useMemo => {
            const dangers = [];
            
            dangerousPatterns.forEach((pattern, index) => {
                const matches = useMemo.content.match(pattern);
                if (matches) {
                    const patternNames = [
                        'getTime() sans validation',
                        'new Date() sans validation',
                        'filter() sans null check',
                        'map() sans null check',
                        'reduce() sans null check',
                        'sort() sans null check',
                        'split() sans null check',
                        'includes() sans null check',
                        'some() sans null check',
                        'every() sans null check',
                        'find() sans null check',
                        'Math operations',
                        'Addition arithmetic',
                        'Subtraction arithmetic',
                        'Multiplication arithmetic',
                        'Division arithmetic'
                    ];
                    
                    dangers.push({
                        pattern: patternNames[index],
                        matches: matches.length,
                        examples: matches.slice(0, 3)
                    });
                }
            });
            
            if (dangers.length > 0) {
                analysisResults.push({
                    file: filePath.replace(__dirname, ''),
                    lines: `${useMemo.startLine}-${useMemo.endLine}`,
                    content: useMemo.content.trim(),
                    dangers: dangers,
                    riskLevel: dangers.length >= 3 ? 'CRITICAL' : dangers.length >= 2 ? 'HIGH' : 'MEDIUM'
                });
            }
        });
    }
    
    function scanDirectory(dir) {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        files.forEach(file => {
            const filePath = path.join(dir, file.name);
            
            if (file.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
                analyzeFile(filePath);
            }
        });
    }
    
    // Scanner les deux répertoires
    console.log('📁 Scanning frontend/src...');
    scanDirectory(frontendSrc);
    
    console.log('📁 Scanning src...');
    scanDirectory(srcDir);
    
    // Afficher les résultats
    console.log('\n📊 RÉSULTATS DE L\'ANALYSE:\n');
    
    if (analysisResults.length === 0) {
        console.log('✅ Aucun useMemo dangereux détecté !');
        return;
    }
    
    // Trier par niveau de risque
    analysisResults.sort((a, b) => {
        const riskOrder = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
    
    analysisResults.forEach((result, index) => {
        console.log(`${index + 1}. 🚨 ${result.riskLevel} RISK`);
        console.log(`   📁 File: ${result.file}`);
        console.log(`   📏 Lines: ${result.lines}`);
        console.log(`   ⚠️ Dangers found: ${result.dangers.length}`);
        
        result.dangers.forEach(danger => {
            console.log(`      • ${danger.pattern} (${danger.matches}x)`);
            if (danger.examples.length > 0) {
                console.log(`        Exemples: ${danger.examples.join(', ')}`);
            }
        });
        
        console.log('\n   💻 Code snippet:');
        console.log(result.content.split('\n').slice(0, 10).map(line => `      ${line}`).join('\n'));
        
        if (result.content.split('\n').length > 10) {
            console.log('      ...(truncated)');
        }
        
        console.log('\n' + '─'.repeat(80) + '\n');
    });
    
    // Recommandations
    console.log('🔧 RECOMMANDATIONS:\n');
    console.log('1. Pour les opérations de date:');
    console.log('   const dateA = a?.createdAt ? new Date(a.createdAt) : null;');
    console.log('   if (!dateA || isNaN(dateA.getTime())) return fallbackValue;');
    console.log('\n2. Pour les opérations sur arrays:');
    console.log('   if (!array || !Array.isArray(array)) return [];');
    console.log('   array.filter(item => item && ...');
    console.log('\n3. Pour les calculs arithmétiques:');
    console.log('   const result = isNaN(value) || !isFinite(value) ? 0 : value;');
    
    console.log(`\n🎯 TOTAL: ${analysisResults.length} useMemo potentiellement dangereux détectés`);
}

console.log('🚀 Lancement de l\'analyse...\n');
analyzeUseMemoHooks().catch(console.error);
