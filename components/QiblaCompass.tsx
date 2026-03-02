import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import CompassHeading from 'react-native-compass-heading';
import Colors from '@/constants/colors';

interface QiblaCompassProps {
  size?: number;
}

export default function QiblaCompass({ size = 200 }: QiblaCompassProps) {
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<string>('');
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const headingSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    requestPermissions();
    return () => {
      if (headingSubscription.current) {
        headingSubscription.current.remove();
      }
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setHasPermission(true);
      await calculateQiblaDirection();
      startHeadingUpdates();
    }
  };

  const calculateQiblaDirection = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      
      // Récupérer le nom de la ville
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        setUserLocation(geocode[0].city || geocode[0].region || 'Votre position');
      }
      
      // Coordonnées de la Kaaba (Mecque)
      const kaabaLat = 21.4225;
      const kaabaLon = 39.8262;
      
      const qibla = calculateBearing(latitude, longitude, kaabaLat, kaabaLon);
      setQiblaDirection(qibla);
      
      setTimeout(() => setIsCalibrating(false), 2000);
    } catch (error) {
      console.error('Error calculating Qibla:', error);
      setIsCalibrating(false);
    }
  };

  const startHeadingUpdates = async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        headingSubscription.current = await Location.watchHeadingAsync((headingData) => {
          setHeading(headingData.trueHeading || headingData.magHeading);
        });
      }
    } catch (error) {
      console.error('Error watching heading:', error);
    }
  };

  /**
   * Calcul de la direction Qibla (azimut du Grand Cercle)
   * Formule: tan(α) = sin(Δλ) / [cos(φ₁)tan(φ₂) - sin(φ₁)cos(Δλ)]
   * Où:
   * - φ₁ = latitude de la position actuelle
   * - φ₂ = latitude de la Kaaba (21.4225° N)
   * - Δλ = différence de longitude (Kaaba - position actuelle)
   * - α = azimut (direction Qibla)
   */
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    // Convertir en radians
    const phi1 = toRad(lat1); // φ₁
    const phi2 = toRad(lat2); // φ₂
    const deltaLambda = toRad(lon2 - lon1); // Δλ
    
    // Formule de l'azimut du Grand Cercle
    // tan(α) = sin(Δλ) / [cos(φ₁)tan(φ₂) - sin(φ₁)cos(Δλ)]
    const numerator = Math.sin(deltaLambda);
    const denominator = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
    
    let azimuth = toDeg(Math.atan2(numerator, denominator));
    
    // Normaliser l'azimut entre 0 et 360 degrés
    return (azimuth + 360) % 360;
  };

  // Calculer l'angle relatif entre la Qibla et l'orientation actuelle
  const getAlignmentAngle = () => {
    let angle = qiblaDirection - heading;
    // Normaliser l'angle entre -180 et 180
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    return angle;
  };

  useEffect(() => {
    const angle = getAlignmentAngle();
    
    Animated.spring(rotateAnim, {
      toValue: angle,
      useNativeDriver: true,
      friction: 10,
      tension: 40,
    }).start();
  }, [heading, qiblaDirection]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-180, 180],
    outputRange: ['-180deg', '180deg'],
  });

  // Calculer si on est aligné avec la Qibla (±15 degrés pour plus de tolérance)
  const isAligned = Math.abs(getAlignmentAngle()) < 15;

  if (!hasPermission) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.permissionText}>
          Permission de localisation requise
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Cercle de la boussole */}
      <View style={[styles.compassCircle, { width: size, height: size }]}>
        {/* Points cardinaux */}
        <View style={styles.cardinalPoints}>
          <Text style={[styles.cardinalText, styles.north]}>N</Text>
          <Text style={[styles.cardinalText, styles.east]}>E</Text>
          <Text style={[styles.cardinalText, styles.south]}>S</Text>
          <Text style={[styles.cardinalText, styles.west]}>O</Text>
        </View>
        
        {/* Flèche pointant vers la Qibla */}
        <Animated.View 
          style={[
            styles.needle, 
            { transform: [{ rotate: rotation }] }
          ]}
        >
          <View style={styles.arrowContainer}>
            <Navigation 
              size={size * 0.4} 
              color={isAligned ? Colors.accent : Colors.primary} 
              strokeWidth={3}
              fill={isAligned ? Colors.accent : Colors.primary}
            />
          </View>
        </Animated.View>
        
        {/* Point central */}
        <View style={[styles.centerDot, { backgroundColor: isAligned ? Colors.accent : Colors.primary }]} />
      </View>
      
      {/* Informations */}
      <View style={styles.infoContainer}>
        {isCalibrating ? (
          <Text style={styles.calibratingText}>Calibration...</Text>
        ) : (
          <>
            <Text style={[styles.statusText, isAligned && styles.alignedText]}>
              {isAligned ? '✓ Aligné avec la Qibla' : 'Tournez-vous vers la flèche'}
            </Text>
            <Text style={styles.directionText}>
              Direction: {Math.round(qiblaDirection)}°
            </Text>
            {userLocation && (
              <Text style={styles.locationText}>
                📍 {userLocation}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassCircle: {
    borderRadius: 1000,
    borderWidth: 4,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  cardinalPoints: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  north: {
    top: 10,
    left: '50%',
    marginLeft: -10,
  },
  east: {
    right: 10,
    top: '50%',
    marginTop: -10,
  },
  south: {
    bottom: 10,
    left: '50%',
    marginLeft: -10,
  },
  west: {
    left: 10,
    top: '50%',
    marginTop: -10,
  },
  needle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  infoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  alignedText: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  directionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  calibratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
