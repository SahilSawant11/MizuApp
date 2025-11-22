// src/screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dropAnim = useRef(new Animated.Value(-100)).current;
  const rippleScale1 = useRef(new Animated.Value(0)).current;
  const rippleScale2 = useRef(new Animated.Value(0)).current;
  const rippleScale3 = useRef(new Animated.Value(0)).current;
  const rippleOpacity1 = useRef(new Animated.Value(0.6)).current;
  const rippleOpacity2 = useRef(new Animated.Value(0.6)).current;
  const rippleOpacity3 = useRef(new Animated.Value(0.6)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Drop animation
      Animated.timing(dropAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      // Ripple effect
      Animated.parallel([
        // First ripple
        Animated.parallel([
          Animated.timing(rippleScale1, {
            toValue: 2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity1, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        // Second ripple (delayed)
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(rippleScale2, {
              toValue: 2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity2, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Third ripple (delayed)
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.timing(rippleScale3, {
              toValue: 2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity3, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Icon fade and scale
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        // Rotation
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Text animations
      Animated.parallel([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Auto-hide after animations complete
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textFade, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Ripple effects */}
      <Animated.View
        style={[
          styles.ripple,
          {
            transform: [{ scale: rippleScale1 }],
            opacity: rippleOpacity1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ripple,
          {
            transform: [{ scale: rippleScale2 }],
            opacity: rippleOpacity2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ripple,
          {
            transform: [{ scale: rippleScale3 }],
            opacity: rippleOpacity3,
          },
        ]}
      />

      {/* Drop animation container */}
      <Animated.View
        style={{
          transform: [{ translateY: dropAnim }],
        }}
      >
        {/* Main icon container with animations */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: spin },
              ],
            },
          ]}
        >
          <Text style={styles.icon}>💧</Text>
          
          {/* Shimmer effect */}
          <Animated.View
            style={[
              styles.shimmer,
              {
                opacity: fadeAnim,
              },
            ]}
          />
        </Animated.View>
      </Animated.View>

      {/* Text animations */}
      <Animated.View
        style={{
          opacity: textFade,
          transform: [{ translateY: textSlide }],
        }}
      >
        <Text style={styles.appName}>Mizu</Text>
        <Text style={styles.tagline}>Track. Plan. Thrive.</Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View
        style={[
          styles.loadingContainer,
          { opacity: textFade },
        ]}
      >
        <LoadingDots />
      </Animated.View>
    </View>
  );
};

// Animated loading dots component
const LoadingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = Animated.parallel([
      createAnimation(dot1, 0),
      createAnimation(dot2, 200),
      createAnimation(dot3, 400),
    ]);

    animations.start();

    return () => animations.stop();
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#457B9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  shimmer: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    fontSize: 72,
  },
  appName: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
});