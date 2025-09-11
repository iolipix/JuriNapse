import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { THEME } from '../constants/theme';

interface HomeScreenProps {
  onLogout: () => void;
}

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>JuriNapse</Text>
            <Text style={styles.subtitle}>Bienvenue dans votre communauté</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>🎉 Félicitations !</Text>
          <Text style={styles.welcomeText}>
            Vous êtes maintenant connecté(e) à JuriNapse ! 
            Explorez votre communauté juridique et connectez-vous avec d'autres étudiants.
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureTitle}>Communauté</Text>
            <Text style={styles.featureText}>Connectez-vous avec d'autres étudiants en droit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>📚</Text>
            <Text style={styles.featureTitle}>Ressources</Text>
            <Text style={styles.featureText}>Accédez à vos cours et documents</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureTitle}>Discussions</Text>
            <Text style={styles.featureText}>Participez aux débats juridiques</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎓</Text>
            <Text style={styles.featureTitle}>Formations</Text>
            <Text style={styles.featureText}>Suivez votre progression académique</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={styles.featureTitle}>Événements</Text>
            <Text style={styles.featureText}>Découvrez les événements juridiques</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>🏛️</Text>
            <Text style={styles.featureTitle}>Stages</Text>
            <Text style={styles.featureText}>Trouvez votre prochain stage</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📝 Créer un post</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🔍 Rechercher des étudiants</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📖 Parcourir les ressources</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.backgroundGray,
  },
  header: {
    backgroundColor: THEME.colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.background,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: THEME.fontSize.md,
    color: '#e0e7ff',
  },
  logoutButton: {
    backgroundColor: THEME.colors.error,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.sm,
  },
  logoutButtonText: {
    color: THEME.colors.background,
    fontSize: THEME.fontSize.sm,
    fontWeight: THEME.fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.lg,
    padding: 20,
    marginBottom: 20,
    ...THEME.shadows.md,
  },
  welcomeTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  featureCard: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    ...THEME.shadows.sm,
  },
  featureIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.textPrimary,
    marginBottom: 5,
    textAlign: 'center',
  },
  featureText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.textPrimary,
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    ...THEME.shadows.sm,
  },
  actionButtonText: {
    color: THEME.colors.background,
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.bold,
    textAlign: 'center',
  },
});
