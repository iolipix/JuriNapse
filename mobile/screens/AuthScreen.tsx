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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
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
          <Text style={styles.authTitle}>
            {isLogin ? 'Connexion' : 'Inscription'}
          </Text>
          <Text style={styles.authSubtitle}>
            {isLogin 
              ? 'Connectez-vous pour accéder à votre communauté juridique'
              : 'Rejoignez la première communauté d\'étudiants en droit'
            }
          </Text>

          {/* Formulaire d'inscription */}
          {!isLogin && (
            <>
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
            </>
          )}

          {/* Email ou Username pour connexion / Email pour inscription */}
          {isLogin ? (
            <>
              <Text style={styles.inputLabel}>Email ou Pseudo *</Text>
              <TextInput
                style={styles.textInput}
                value={emailOrUsername}
                onChangeText={setEmailOrUsername}
                placeholder="votre@email.com ou votre.pseudo"
                placeholderTextColor="#bdc3c7"
                autoCapitalize="none"
              />
            </>
          ) : (
            <>
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
            </>
          )}

          {/* Mot de passe */}
          <Text style={styles.inputLabel}>Mot de passe {!isLogin && '*'}</Text>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Votre mot de passe"
            placeholderTextColor="#bdc3c7"
            secureTextEntry
          />

          {/* Confirmation mot de passe */}
          {!isLogin && (
            <>
              <Text style={styles.inputLabel}>Confirmer le mot de passe *</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor="#bdc3c7"
                secureTextEntry
              />
            </>
          )}

          {/* Bouton principal */}
          <TouchableOpacity 
            style={[styles.authButton, isLoading && styles.authButtonDisabled]} 
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.authButtonText}>
                {isLogin ? 'Se connecter' : 'Créer mon compte'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Lien pour changer de mode */}
          <TouchableOpacity onPress={toggleAuthMode} style={styles.switchModeContainer}>
            <Text style={styles.switchModeText}>
              {isLogin 
                ? "Pas encore de compte ? "
                : "Déjà un compte ? "
              }
              <Text style={styles.switchModeLink}>
                {isLogin ? 'Inscrivez-vous' : 'Connectez-vous'}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Mot de passe oublié */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En continuant, vous acceptez nos{'\n'}
            <Text style={styles.footerLink}>Conditions d'utilisation</Text> et notre{' '}
            <Text style={styles.footerLink}>Politique de confidentialité</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    backgroundColor: THEME.colors.primary,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    ...THEME.shadows.lg,
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
    fontSize: THEME.fontSize.xxxl,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.background,
    marginBottom: 5,
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
    color: THEME.colors.background,
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
  forgotPasswordContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.error,
    fontWeight: THEME.fontWeight.medium,
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
