import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { THEME } from '../constants/theme';
import authService, { LoginData, RegisterData } from '../services/authService';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (isLogin) {
      if (!emailOrUsername || !password) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }
    } else {
      if (!email || !password) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }
      if (!firstName || !lastName || !university) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Connexion
        const loginData: LoginData = { emailOrUsername, password };
        const response = await authService.login(loginData);

        if (response.success) {
          Alert.alert(
            'Succès',
            'Connexion réussie !',
            [{ text: 'OK', onPress: onAuthenticated }]
          );
        } else {
          Alert.alert('Erreur de connexion', response.message);
        }
      } else {
        // Inscription
        const registerData: RegisterData = {
          firstName,
          lastName,
          email,
          password,
          university,
        };
        const response = await authService.register(registerData);

        if (response.success) {
          Alert.alert(
            'Succès',
            'Inscription réussie ! Vous pouvez maintenant vous connecter.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsLogin(true);
                  setPassword('');
                  setConfirmPassword('');
                },
              },
            ]
          );
        } else {
          Alert.alert('Erreur d\'inscription', response.message);
        }
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur inattendue s\'est produite. Vérifiez votre connexion internet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setUniversity('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Version compacte pour connexion */}
      {isLogin ? (
        <View style={styles.loginContainer}>
          {/* Header compact avec dégradé */}
          <View style={styles.compactHeader}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.compactLogo}
              resizeMode="contain"
            />
            <Text style={styles.compactAppName}>JuriNapse</Text>
            <Text style={styles.compactTagline}>Votre réseau social juridique</Text>
          </View>

          {/* Formulaire de connexion compact */}
          <View style={styles.compactForm}>
            <Text style={styles.compactTitle}>Connexion</Text>
            
            <Text style={styles.compactInputLabel}>Email ou Pseudo</Text>
            <TextInput
              style={styles.compactTextInput}
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              placeholder="votre@email.com ou votre.pseudo"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
            />

            <Text style={styles.compactInputLabel}>Mot de passe</Text>
            <TextInput
              style={styles.compactTextInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Votre mot de passe"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.compactAuthButton, isLoading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.authButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeContainer}
              onPress={toggleAuthMode}
            >
              <Text style={styles.switchModeText}>
                Pas encore de compte ? 
                <Text style={styles.switchModeLink}> S'inscrire</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Version avec scroll pour inscription */
        <KeyboardAvoidingView 
          style={styles.fullContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header avec gradient */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>JuriNapse</Text>
              <Text style={styles.tagline}>Votre réseau social juridique</Text>
            </View>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.authCard}>
              <Text style={styles.authTitle}>Inscription</Text>
              <Text style={styles.authSubtitle}>
                Rejoignez la première communauté d'étudiants en droit
              </Text>

              {/* Formulaire d'inscription */}
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Prénom *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Votre prénom"
                    placeholderTextColor="#bdc3c7"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Nom *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Votre nom"
                    placeholderTextColor="#bdc3c7"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Université *</Text>
              <TextInput
                style={styles.textInput}
                value={university}
                onChangeText={setUniversity}
                placeholder="Ex: Université Paris 1 Panthéon-Sorbonne"
                placeholderTextColor="#bdc3c7"
              />

              {/* Email */}
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="votre.email@universite.fr"
                placeholderTextColor="#bdc3c7"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Mot de passe */}
              <Text style={styles.inputLabel}>Mot de passe *</Text>
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Choisissez un mot de passe sécurisé"
                placeholderTextColor="#bdc3c7"
                secureTextEntry
              />

              {/* Confirmation mot de passe */}
              <Text style={styles.inputLabel}>Confirmer le mot de passe *</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor="#bdc3c7"
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.authButton, isLoading && styles.authButtonDisabled]}
                onPress={handleAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.authButtonText}>S'inscrire</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchModeContainer}
                onPress={toggleAuthMode}
              >
                <Text style={styles.switchModeText}>
                  Déjà un compte ? 
                  <Text style={styles.switchModeLink}> Se connecter</Text>
                </Text>
              </TouchableOpacity>

              {/* Footer légal */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  En vous inscrivant, vous acceptez nos{' '}
                  <Text style={styles.footerLink}>Conditions d'utilisation</Text>
                  {' '}et notre{' '}
                  <Text style={styles.footerLink}>Politique de confidentialité</Text>.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.primary,
  },
  
  // Styles pour la connexion compacte (sans scroll)
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  compactHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  compactLogo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  compactAppName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  compactTagline: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  compactForm: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  compactTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 25,
  },
  compactInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
    marginTop: 15,
  },
  compactTextInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: THEME.colors.textPrimary,
  },
  compactAuthButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 30,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Styles pour l'inscription (avec scroll)
  fullContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  appName: {
    fontSize: 36,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.background,
    marginTop: 15,
  },
  tagline: {
    fontSize: THEME.fontSize.md,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  authCard: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg + 5,
    marginTop: -15,
    ...THEME.shadows.lg,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  inputLabel: {
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.semibold,
    color: THEME.colors.textPrimary,
    marginBottom: 8,
    marginTop: 15,
  },
  textInput: {
    borderWidth: 2,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: THEME.fontSize.md,
    backgroundColor: THEME.colors.backgroundGray,
    color: THEME.colors.textPrimary,
  },
  authButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 15,
    marginTop: 25,
    ...THEME.shadows.md,
  },
  authButtonDisabled: {
    backgroundColor: THEME.colors.textMuted,
    opacity: 0.7,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.bold,
    textAlign: 'center',
  },
  switchModeContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  switchModeLink: {
    color: THEME.colors.primary,
    fontWeight: THEME.fontWeight.bold,
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    color: THEME.colors.primary,
    fontWeight: THEME.fontWeight.medium,
  },
});
