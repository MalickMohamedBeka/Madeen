import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

interface OptimizedImageProps {
  source: any;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: any;
  transition?: number;
}

export default function OptimizedImage({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  transition = 300,
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={styles.image}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={transition}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        cachePolicy="memory-disk"
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
