import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function JuriNapseLogo({ size = 100, showText = true }: LogoProps) {
  return (
    <View style={[styles.container, { width: size + 20, height: size + (showText ? 60 : 20) }]}>
      <Image 
        source={require('../assets/images/logo.png')} 
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
      />
      {showText && (
        <>
          <Text style={[styles.appName, { fontSize: size * 0.25 }]}>JuriNapse</Text>
          <Text style={[styles.tagline, { fontSize: size * 0.12 }]}>Réseau juridique</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginBottom: 10,
  },
  appName: {
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.background,
    marginBottom: 5,
    textAlign: 'center',
  },
  tagline: {
    color: '#e0e7ff',
    textAlign: 'center',
    opacity: 0.9,
  },
});
