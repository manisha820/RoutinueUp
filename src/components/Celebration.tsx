import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = [
  '#FF5E7E', '#FFB703', '#2ECC71', '#3498DB', '#9B59B6',
  '#1ABC9C', '#F1C40F', '#E67E22', '#E74C3C', '#FF6B6B'
];

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  shape: 'circle' | 'square';
  yAnim: Animated.Value;
  xAnim: Animated.Value;
  rotateAnim: Animated.Value;
}

export function Celebration({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  const particles = useRef<Particle[]>([]);

  if (particles.current.length === 0) {
    // Generate 60 randomized particles
    particles.current = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 12 + 6,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
      yAnim: new Animated.Value(-50),
      xAnim: new Animated.Value(0),
      rotateAnim: new Animated.Value(0),
    }));
  }

  useEffect(() => {
    if (active) {
      // Start falling and swaying animations
      const animations = particles.current.map((p) => {
        // Reset animation values
        p.yAnim.setValue(-50);
        p.xAnim.setValue(0);
        p.rotateAnim.setValue(0);

        // Falling movement
        const fall = Animated.timing(p.yAnim, {
          toValue: SCREEN_HEIGHT + 50,
          duration: Math.random() * 2500 + 2000,
          useNativeDriver: true,
        });

        // Left-right swaying movement
        const sway = Animated.sequence([
          Animated.timing(p.xAnim, {
            toValue: Math.random() * 60 - 30,
            duration: Math.random() * 800 + 400,
            useNativeDriver: true,
          }),
          Animated.timing(p.xAnim, {
            toValue: Math.random() * 60 - 30,
            duration: Math.random() * 800 + 400,
            useNativeDriver: true,
          }),
          Animated.timing(p.xAnim, {
            toValue: Math.random() * 60 - 30,
            duration: Math.random() * 800 + 400,
            useNativeDriver: true,
          }),
        ]);

        // Spin animation
        const spin = Animated.timing(p.rotateAnim, {
          toValue: 360,
          duration: Math.random() * 2500 + 2000,
          useNativeDriver: true,
        });

        return Animated.parallel([fall, sway, spin]);
      });

      // Execute all particle animations in parallel
      Animated.parallel(animations).start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.current.map((p) => {
        const rotate = p.rotateAnim.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                left: p.x,
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                borderRadius: p.shape === 'circle' ? p.size / 2 : 2,
                transform: [
                  { translateY: p.yAnim },
                  { translateX: p.xAnim },
                  { rotate },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    zIndex: 9999,
  },
});
