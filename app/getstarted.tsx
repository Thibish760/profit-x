import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function GetStartedScreen() {
  return (
    <TouchableOpacity
      style={styles.root}
      activeOpacity={1}
      onPress={async () => {
        try {
          await AsyncStorage.setItem('seen_getstarted', 'true');
        } catch (err) {
          // ignore storage errors and continue
        }
        router.replace('/(tabs)');
      }}
    >
      <StatusBar hidden />

      {/* Background */}
      <ImageBackground
        source={require('../assets/images/splash (1).png')}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View style={styles.overlay} />

        {/* (center illustration removed) */}

        {/* Bottom text block */}
        <View style={styles.bottom}>
          <View style={styles.textBlock}>
            <Text style={styles.heading}>Get Started</Text>
            <Text style={styles.subtitle}>
              Set up your profile to start tracking{'\n'}your shop finances easily.
            </Text>
          </View>
          <Text style={styles.version}>ProfitX 3.0</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bg: {
    flex: 1,
    backgroundColor: '#020b02',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: -30,
  },
  illustration: {
    width: width,
    height: height * 0.68,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  textBlock: {
    flex: 1,
  },
  heading: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    lineHeight: 24,
  },
  version: {
    color: '#ACFE3E',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
});
