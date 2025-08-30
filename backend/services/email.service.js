// Service d'envoi d'emails de vérification
// Priorité: Resend (si RESEND_API_KEY), sinon SMTP (nodemailer), sinon simple log

const path = require('path');
let resendClient = null;
let nodemailerTransport = null;

// Initialisation Resend si disponible
const initResend = () => {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    const { Resend } = require('resend');
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch (e) {
    console.error('❌ Impossible de charger le SDK Resend:', e.message);
    return null;
  }
};

// Initialisation nodemailer si SMTP configuré
const initNodemailer = () => {
  if (nodemailerTransport) return nodemailerTransport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  try {
    const nodemailer = require('nodemailer');
    nodemailerTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    return nodemailerTransport;
  } catch (e) {
    console.error('❌ Impossible de créer le transport SMTP:', e.message);
    return null;
  }
};

// Validation & sanitisation du champ FROM
const sanitizeFrom = (raw) => {
  if (!raw) return null;
  let v = raw.trim();
  // Supprime guillemets englobants éventuels
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  // Remplace plusieurs espaces internes par un seul
  v = v.replace(/\s+/g, ' ');
  // Si le format contient des chevrons, valider
  const displayMatch = v.match(/^([^<>]{1,80})<\s*([^<>@\s]+@[^<>@\s]+\.[^<>@\s]+)\s*>$/);
  if (displayMatch) {
    return displayMatch[1].trim() + ' <' + displayMatch[2].trim() + '>';
  }
  // Sinon si c'est juste une adresse email simple
  const simpleMatch = v.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  if (simpleMatch) return v;
  return null; // invalide
};

const sendVerificationEmail = async (email, code) => {
  const fallbackFrom = 'JuriNapse <no-reply@jurinapse.com>';
  const rawFrom = process.env.MAIL_FROM;
  const sanitized = sanitizeFrom(rawFrom);
  const from = sanitized || fallbackFrom;
  if (!sanitized && rawFrom) {
    console.warn('⚠️ MAIL_FROM invalide, fallback utilisé. Valeur brute:', rawFrom);
  }
  const subject = 'Votre code de vérification JuriNapse';
  const text = `Votre code de vérification est ${code} (valide 10 minutes).`;
  const html = `<p>Bonjour,</p><p>Votre code de vérification est :</p><p style="font-size:24px;font-weight:bold;letter-spacing:3px;">${code}</p><p>Ce code expire dans 10 minutes.</p><p>Merci,<br/>L'équipe JuriNapse</p>`;

  // 1. Resend
  const resend = initResend();
  if (resend) {
    try {
      const result = await resend.emails.send({ from, to: email, subject, text, html });
      if (result && result.data && result.data.id) {
        console.log('✅ Email envoyé via Resend (ID:', result.data.id + ')');
        return { provider: 'resend', id: result.data.id };
      }
      console.warn('⚠️ Réponse inattendue Resend:', result);
      return { provider: 'resend', id: null };
    } catch (e) {
      const msg = e?.message || 'Erreur inconnue';
      // Essayons d'extraire plus de détails si structure connue (Resend renvoie parfois e.response?.data)
      let extra = '';
      if (e?.response?.data) {
        try { extra = ' | data=' + JSON.stringify(e.response.data); } catch(_) {}
      }
      console.error('❌ Échec envoi via Resend:', msg + extra, '| from utilisé =', from);
      // fallback SMTP/log
    }
  }

  // 2. SMTP
  const smtp = initNodemailer();
  if (smtp) {
    try {
      await smtp.sendMail({ from, to: email, subject, text, html });
      console.log('✅ Email envoyé via SMTP');
      return { provider: 'smtp' };
    } catch (e) {
      console.error('❌ Échec envoi email SMTP:', e.message);
    }
  }

  // 3. Log seulement
  console.warn('⚠️ Aucun provider email configuré - code uniquement loggé');
  console.log(`📧 [DEV-LOG] Code de vérification pour ${email}: ${code}`);
  return { provider: 'log' };
};

module.exports = {
  sendVerificationEmail
};
