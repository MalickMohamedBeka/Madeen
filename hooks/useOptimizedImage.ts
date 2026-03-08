import { useState, useEffect } from 'react';
import { Image } from 'react-native';

interface UseOptimizedImageOptions {
  preload?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function useOptimizedImage(
  source: any,
  options: UseOptimizedImageOptions = {}
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!source) return;

    // Précharger l'image si demandé
    if (options.preload) {
      const uri = typeof source === 'number' ? Image.resolveAssetSource(source).uri : source.uri;
      
      if (uri) {
        Image.prefetch(uri)
          .then(() => {
            setIsLoaded(true);
            options.onLoad?.();
          })
          .catch((err) => {
            const error = new Error(`Failed to preload image: ${err.message}`);
            setError(error);
            options.onError?.(error);
          });
      }
    }

    // Obtenir les dimensions
    if (typeof source === 'number') {
      const { width, height } = Image.resolveAssetSource(source);
      setDimensions({ width, height });
    } else if (source.uri) {
      Image.getSize(
        source.uri,
        (width, height) => {
          setDimensions({ width, height });
        },
        () => {
          // Ignore errors for dimensions
        }
      );
    }
  }, [source, options.preload]);

  return {
    isLoaded,
    error,
    dimensions,
  };
}
