import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Colors from '@/constants/colors';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/logo Madeen.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
      <Text style={styles.taglineFr}>Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  tagline: {
    fontSize: 20,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  taglineFr: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
