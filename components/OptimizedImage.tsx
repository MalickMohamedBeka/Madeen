import React, { useState, memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

interface OptimizedImageProps {
  source: any;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: any;
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
  recyclingKey?: string;
}

const OptimizedImage = memo(({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  transition = 300,
  priority = 'normal',
  recyclingKey,
}: OptimizedImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={styles.image}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={transition}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        cachePolicy="memory-disk"
        priority={priority}
        recyclingKey={recyclingKey}
        // Optimisations
        allowDownscaling
        autoplay={false}
      />
      {loading && !error && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorPlaceholder} />
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

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
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
});

export default OptimizedImage;
