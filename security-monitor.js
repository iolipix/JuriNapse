// 🔍 Monitoring Sécurité JuriNapse - Dashboard Simple
const fs = require('fs');
const https = require('https');

class SecurityMonitor {
  constructor() {
    this.logFile = './security-monitor.log';
    this.alertsFile = './security-alerts.json';
    this.config = {
      domain: 'jurinapse.com',
      checkInterval: 5 * 60 * 1000, // 5 minutes
      alertThresholds: {
        responseTime: 5000, // 5 secondes
        errorRate: 10, // 10% d'erreurs
        suspiciousRequests: 50 // 50 requêtes suspectes/heure
      }
    };
    this.stats = {
      requests: 0,
      errors: 0,
      blocked: 0,
      averageResponseTime: 0,
      lastCheck: null
    };
  }

  // 📊 Initialisation du monitoring
  async start() {
    console.log('🔍 Démarrage du monitoring sécurité JuriNapse...');
    console.log(`Domain: ${this.config.domain}`);
    console.log(`Intervalle: ${this.config.checkInterval / 1000}s`);
    console.log('='.repeat(50));
    
    // Premier test
    await this.performSecurityCheck();
    
    // Tests périodiques
    setInterval(() => {
      this.performSecurityCheck();
    }, this.config.checkInterval);
    
    console.log('✅ Monitoring actif. Ctrl+C pour arrêter.');
  }

  // 🔍 Vérification de sécurité complète
  async performSecurityCheck() {
    const timestamp = new Date().toISOString();
    console.log(`\n🔍 Check sécurité - ${timestamp}`);
    
    try {
      // Test connectivité principale
      const mainCheck = await this.checkEndpoint('https://' + this.config.domain);
      
      // Test API
      const apiCheck = await this.checkEndpoint('https://' + this.config.domain + '/api/health');
      
      // Test SSL
      const sslCheck = await this.checkSSL();
      
      // Analyse des résultats
      const report = {
        timestamp,
        main: mainCheck,
        api: apiCheck,
        ssl: sslCheck,
        overall: this.calculateOverallStatus(mainCheck, apiCheck, sslCheck)
      };
      
      // Log et alertes
      this.logReport(report);
      await this.checkAlerts(report);
      
      this.stats.lastCheck = timestamp;
      
    } catch (error) {
      this.logError('Security check failed', error);
    }
  }

  // 🌐 Test d'un endpoint
  async checkEndpoint(url) {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(url);
      const responseTime = Date.now() - startTime;
      
      const result = {
        url,
        status: response.statusCode,
        responseTime,
        headers: this.analyzeSecurityHeaders(response.headers),
        cloudflare: this.analyzeCloudflareHeaders(response.headers),
        success: response.statusCode >= 200 && response.statusCode < 400
      };
      
      this.stats.requests++;
      if (!result.success) this.stats.errors++;
      
      this.updateAverageResponseTime(responseTime);
      
      return result;
      
    } catch (error) {
      this.stats.requests++;
      this.stats.errors++;
      
      return {
        url,
        status: 0,
        responseTime: Date.now() - startTime,
        error: error.message,
        success: false
      };
    }
  }

  // 🔒 Test SSL spécifique
  async checkSSL() {
    try {
      const response = await this.makeRequest('https://' + this.config.domain);
      const headers = response.headers;
      
      return {
        hsts: !!headers['strict-transport-security'],
        hstsValue: headers['strict-transport-security'],
        secureHeaders: {
          'x-frame-options': !!headers['x-frame-options'],
          'x-content-type-options': !!headers['x-content-type-options'],
          'x-xss-protection': !!headers['x-xss-protection'],
          'content-security-policy': !!headers['content-security-policy']
        },
        grade: this.calculateSSLGrade(headers)
      };
    } catch (error) {
      return {
        error: error.message,
        grade: 'F'
      };
    }
  }

  // 🔍 Analyse headers de sécurité
  analyzeSecurityHeaders(headers) {
    return {
      hsts: headers['strict-transport-security'] ? '✅' : '❌',
      frameOptions: headers['x-frame-options'] ? '✅' : '❌',
      contentType: headers['x-content-type-options'] ? '✅' : '❌',
      xssProtection: headers['x-xss-protection'] ? '✅' : '❌',
      csp: headers['content-security-policy'] ? '✅' : '❌'
    };
  }

  // ☁️ Analyse headers Cloudflare
  analyzeCloudflareHeaders(headers) {
    return {
      active: !!headers['cf-ray'],
      ray: headers['cf-ray'],
      cache: headers['cf-cache-status'],
      country: headers['cf-ipcountry'],
      datacenter: headers['cf-datacenter']
    };
  }

  // 📊 Calcul note SSL
  calculateSSLGrade(headers) {
    let score = 0;
    if (headers['strict-transport-security']) score += 2;
    if (headers['x-frame-options']) score += 1;
    if (headers['x-content-type-options']) score += 1;
    if (headers['x-xss-protection']) score += 1;
    if (headers['content-security-policy']) score += 2;
    
    if (score >= 6) return 'A+';
    if (score >= 5) return 'A';
    if (score >= 4) return 'B';
    if (score >= 3) return 'C';
    if (score >= 2) return 'D';
    return 'F';
  }

  // 📊 Status global
  calculateOverallStatus(main, api, ssl) {
    const mainOk = main.success;
    const apiOk = api.success;
    const sslGood = ssl.grade && !ssl.grade.startsWith('F');
    
    if (mainOk && apiOk && sslGood) return '🟢 EXCELLENT';
    if (mainOk && (apiOk || sslGood)) return '🟡 BIEN';
    if (mainOk) return '🟠 MOYEN';
    return '🔴 CRITIQUE';
  }

  // 🚨 Vérification alertes
  async checkAlerts(report) {
    const alerts = [];
    
    // Alerte temps de réponse
    if (report.main.responseTime > this.config.alertThresholds.responseTime) {
      alerts.push({
        type: 'PERFORMANCE',
        message: `Temps de réponse élevé: ${report.main.responseTime}ms`,
        severity: 'WARNING'
      });
    }
    
    // Alerte erreurs
    const errorRate = (this.stats.errors / this.stats.requests) * 100;
    if (errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'AVAILABILITY',
        message: `Taux d'erreur élevé: ${errorRate.toFixed(1)}%`,
        severity: 'CRITICAL'
      });
    }
    
    // Alerte SSL
    if (report.ssl.grade === 'F') {
      alerts.push({
        type: 'SECURITY',
        message: 'Configuration SSL défaillante',
        severity: 'CRITICAL'
      });
    }
    
    // Alerte Cloudflare
    if (!report.main.cloudflare?.active) {
      alerts.push({
        type: 'SECURITY',
        message: 'Cloudflare non détecté',
        severity: 'WARNING'
      });
    }
    
    // Sauvegarde et notification des alertes
    if (alerts.length > 0) {
      await this.saveAlerts(alerts);
      this.notifyAlerts(alerts);
    }
  }

  // 💾 Sauvegarde des alertes
  async saveAlerts(alerts) {
    const alertData = {
      timestamp: new Date().toISOString(),
      alerts: alerts
    };
    
    try {
      let existingAlerts = [];
      if (fs.existsSync(this.alertsFile)) {
        const data = fs.readFileSync(this.alertsFile, 'utf8');
        existingAlerts = JSON.parse(data);
      }
      
      existingAlerts.push(alertData);
      
      // Garder seulement les 100 dernières alertes
      if (existingAlerts.length > 100) {
        existingAlerts = existingAlerts.slice(-100);
      }
      
      fs.writeFileSync(this.alertsFile, JSON.stringify(existingAlerts, null, 2));
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde alertes:', error.message);
    }
  }

  // 📢 Notification des alertes
  notifyAlerts(alerts) {
    console.log('\n🚨 ALERTES DÉTECTÉES:');
    alerts.forEach(alert => {
      const icon = alert.severity === 'CRITICAL' ? '🔴' : '🟡';
      console.log(`${icon} [${alert.type}] ${alert.message}`);
    });
  }

  // 📝 Log du rapport
  logReport(report) {
    const line = [
      report.timestamp,
      report.overall,
      `Main: ${report.main.status} (${report.main.responseTime}ms)`,
      `API: ${report.api.status} (${report.api.responseTime}ms)`,
      `SSL: ${report.ssl.grade}`,
      `CF: ${report.main.cloudflare?.active ? '✅' : '❌'}`
    ].join(' | ');
    
    console.log(line);
    
    // Sauvegarde fichier log
    fs.appendFileSync(this.logFile, line + '\n');
  }

  // 📊 Mise à jour statistiques
  updateAverageResponseTime(responseTime) {
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime + responseTime) / 2;
  }

  // 📄 Affichage statistiques
  showStats() {
    console.log('\n📊 STATISTIQUES:');
    console.log(`Requêtes totales: ${this.stats.requests}`);
    console.log(`Erreurs: ${this.stats.errors}`);
    console.log(`Taux d'erreur: ${((this.stats.errors / this.stats.requests) * 100).toFixed(1)}%`);
    console.log(`Temps de réponse moyen: ${this.stats.averageResponseTime.toFixed(0)}ms`);
    console.log(`Dernier check: ${this.stats.lastCheck}`);
  }

  // 🔧 Utilitaires
  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'JuriNapse-Monitor/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.abort();
        reject(new Error('Timeout'));
      });
      
      req.end();
    });
  }

  logError(message, error) {
    const line = `[ERROR] ${new Date().toISOString()} ${message}: ${error.message}`;
    console.log('❌', line);
    fs.appendFileSync(this.logFile, line + '\n');
  }
}

// 🚀 Gestion des commandes
if (require.main === module) {
  const monitor = new SecurityMonitor();
  
  // Gestion Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n📊 Arrêt du monitoring...');
    monitor.showStats();
    console.log('👋 Monitoring terminé.');
    process.exit(0);
  });
  
  // Gestion des erreurs
  process.on('uncaughtException', (error) => {
    console.error('❌ Erreur fatale:', error.message);
    monitor.logError('Uncaught exception', error);
  });
  
  // Démarrage
  monitor.start().catch(console.error);
}

module.exports = SecurityMonitor;
