import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient as _LG } from 'expo-linear-gradient';
const LinearGradient = _LG as React.ComponentType<any>;
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.9;

const USER_PROFILE = {
  ownerName: 'Dhanush Kumar S',
  shopName: 'Samosa Shop',
};

const MENU_ITEMS = [
  { key: 'home',     label: 'Home',     image: require('../assets/images/home.png'),  icon: null },
  { key: 'data',     label: 'Data',     image: require('../assets/images/note.png'),  icon: null },
  { key: 'finance',  label: 'Finance',  image: require('../assets/images/money.png'), icon: null },
  { key: 'language', label: 'Language', image: null, icon: 'language-outline' },
  { key: 'logout',   label: 'Logout',   image: null, icon: 'log-out-outline'  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileDrawer({ visible, onClose }: Props) {
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [activeMenu, setActiveMenu] = useState<string>('home');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(drawerAnim, { toValue: -DRAWER_WIDTH, duration: 240, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} pointerEvents="box-none">
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <LinearGradient
          colors={['#050505', '#0a0a0a']}
          start={[0, 0]}
          end={[0, 1]}
          style={styles.inner}
        >
          {/* Header row: avatar + text | close arrow */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {/* Glow ring behind avatar */}
              <View style={styles.avatarGlow}>
                <LinearGradient
                  colors={['#438607', '#A9FA3C']}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={styles.avatarCircle}
                >
                  <Text style={styles.avatarLetter}>{USER_PROFILE.ownerName.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>{USER_PROFILE.ownerName}</Text>
                <Text style={styles.shop}>{USER_PROFILE.shopName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="return-up-back-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Menu items */}
          <View style={styles.menu}>
            {MENU_ITEMS.map(item => {
              const isActive = activeMenu === item.key;
              const itemColor = isActive ? '#ACFE3E' : (item.key === 'logout' ? '#ff6b6b' : '#ffffff');
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => setActiveMenu(item.key)}
                >
                  <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                    {item.image
                      ? <Image source={item.image} style={[styles.menuIcon, { tintColor: itemColor }]} />
                      : <Ionicons name={item.icon as any} size={20} color={itemColor} />
                    }
                  </View>
                  <Text style={[styles.menuLabel, { color: itemColor }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Profitx 3.0</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: DRAWER_WIDTH, zIndex: 100,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderColor: '#7CFF00',
  },
  inner: {
    flex: 1, paddingTop: 54, paddingHorizontal: 20, paddingBottom: 30,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    flex: 1,
  },
  avatarGlow: {
    borderRadius: 36,
    shadowColor: '#7CFF00',
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  avatarCircle: {
    marginHorizontal:10,
    width: 42, height: 42, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: {
    color: '#000000', fontSize: 26, fontWeight: '500',
    letterSpacing: -0.5,
  },
  headerText: {
    flex: 1,
  },
  closeBtn: {
    marginTop: 4,
    width: 30, height: 20, borderRadius: 4,
     backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  name: {
    color: '#ffffff', fontSize: 16, fontWeight: '700',
    letterSpacing: -0.2,
  },
  shop: {
    color: '#ACFE3E', fontSize: 13, marginTop: 3,
    fontWeight: '500', letterSpacing: 0.1,
  },
  divider: {
    height: 1, backgroundColor: 'rgba(124,255,0,0.2)', marginBottom: 20,
  },
  menu: {
    flex: 1, gap: 0,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxActive: {
    backgroundColor: 'rgba(172,254,62,0.12)',
  },
  menuIcon: {
    width: 20, height: 20, resizeMode: 'contain',
  },
  menuLabel: {
    color: '#ffffff', fontSize: 15, fontWeight: '400',
  },
  logout: {
    color: '#ff6b6b',
  },
  footer: {
    alignItems: 'flex-end', paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerText: {
    color: '#ffffff', fontSize: 11, fontWeight: '600', letterSpacing: 1,
  },
});
