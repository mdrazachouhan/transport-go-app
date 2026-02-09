import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import Colors from '@/constants/colors';
import { MOCK_LOCATIONS } from '@/lib/locations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VEHICLE_TYPES = [
  { type: 'auto', name: 'Auto', icon: 'rickshaw' as const, capacity: 'Up to 200kg', price: 'From ₹50' },
  { type: 'tempo', name: 'Tempo', icon: 'van-utility' as const, capacity: 'Up to 1000kg', price: 'From ₹150' },
  { type: 'truck', name: 'Truck', icon: 'truck' as const, capacity: '1000kg+', price: 'From ₹300' },
];

const FLOATING_PINS = [
  { top: 90, left: 40, delay: 0, size: 16 },
  { top: 160, left: SCREEN_WIDTH - 70, delay: 300, size: 14 },
  { top: 220, left: SCREEN_WIDTH / 2 - 20, delay: 600, size: 12 },
  { top: 130, left: SCREEN_WIDTH / 2 + 50, delay: 900, size: 15 },
];

const GREETING_WORDS = ['Hello,'];

function FloatingPin({ pin }: { pin: typeof FLOATING_PINS[0] }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000 + pin.delay,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000 + pin.delay,
          useNativeDriver: true,
        }),
      ])
    );
    const timeout = setTimeout(() => animation.start(), pin.delay);
    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const opacity = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.7, 0.4],
  });

  return (
    <Animated.View
      style={[
        styles.floatingPin,
        {
          top: pin.top,
          left: pin.left,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Ionicons name="location" size={pin.size} color={Colors.primary} />
    </Animated.View>
  );
}

function PulsingDot() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.pulseIndicator}>
      <Animated.View
        style={[
          styles.pulseGlow,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />
      <View style={styles.pulseCore} />
    </View>
  );
}

function LocationChip({ location, onPress }: { location: typeof MOCK_LOCATIONS[0]; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.quickLocationChip}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Ionicons name="location" size={14} color={Colors.primary} />
        <Text style={styles.quickLocationText} numberOfLines={1}>
          {location.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CustomerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { bookings, fetchBookings, getActiveBooking } = useBookings();

  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;
  const topInset = insets.top + webTop;
  const bottomInset = insets.bottom + webBottom;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const bannerAnim = useRef(new Animated.Value(-100)).current;
  const cardAnims = useRef(VEHICLE_TYPES.map(() => new Animated.Value(0))).current;
  const searchGlowAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const greetingWordAnims = useRef(
    ['Hello,', user?.name || 'User'].map(() => new Animated.Value(0))
  ).current;

  const activeBooking = getActiveBooking();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const wordAnimations = greetingWordAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + index * 200,
        useNativeDriver: true,
      })
    );
    Animated.stagger(200, wordAnimations).start();

    const cardAnimations = cardAnims.map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        delay: 200 + index * 120,
        useNativeDriver: true,
      })
    );
    Animated.stagger(120, cardAnimations).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(searchGlowAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(searchGlowAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ])
    ).start();

    if (activeBooking) {
      Animated.spring(bannerAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [activeBooking]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Finding Driver';
      case 'accepted': return 'Driver Assigned';
      case 'in_progress': return 'In Transit';
      default: return status;
    }
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -15],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  const searchBorderColor = searchGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.cardBorder, Colors.primaryGlow],
  });

  const searchShadowOpacity = searchGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.2],
  });

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.setValue(event.nativeEvent.contentOffset.y);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapBackground}>
        <LinearGradient
          colors={[Colors.navyDark, Colors.navy]}
          style={styles.gradientTop}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.mapGridLine} />
          ))}
        </View>
        {FLOATING_PINS.map((pin, index) => (
          <FloatingPin key={index} pin={pin} />
        ))}
        {MOCK_LOCATIONS.slice(0, 5).map((loc, index) => (
          <View
            key={loc.id}
            style={[
              styles.mapDot,
              {
                top: 100 + (index * 80) % 300,
                left: 30 + (index * 120) % (SCREEN_WIDTH - 60),
              },
            ]}
          >
            <View style={styles.mapDotInner} />
          </View>
        ))}
        <View style={styles.mapOverlay} />
      </View>

      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: topInset + 8,
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.headerContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={20} color={Colors.surface} />
            </View>
            <View style={styles.greetingContainer}>
              <Animated.Text
                style={[
                  styles.greetingText,
                  {
                    opacity: greetingWordAnims[0],
                    transform: [
                      {
                        translateY: greetingWordAnims[0].interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                Hello,
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.userName,
                  {
                    opacity: greetingWordAnims[1],
                    transform: [
                      {
                        translateY: greetingWordAnims[1].interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {user?.name || 'User'}
              </Animated.Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/customer/history' as any)}
            >
              <Ionicons name="time-outline" size={22} color={Colors.surface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
              <Feather name="log-out" size={20} color={Colors.surface} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>

      {activeBooking && (
        <Animated.View
          style={[
            styles.activeBanner,
            { top: topInset + 70, transform: [{ translateY: bannerAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.activeBannerContent}
            onPress={() =>
              router.push({
                pathname: '/customer/track-ride' as any,
                params: { bookingId: activeBooking.id },
              })
            }
          >
            <View style={styles.activeBannerLeft}>
              <PulsingDot />
              <View>
                <Text style={styles.activeBannerTitle}>Active Booking</Text>
                <Text style={styles.activeBannerStatus}>
                  {getStatusLabel(activeBooking.status)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={[styles.bottomSection, { paddingBottom: bottomInset + 16 }]}>
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Animated.View
            style={[
              styles.searchBarContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              onPress={() => router.push('/customer/new-booking' as any)}
              activeOpacity={0.85}
            >
              <Animated.View
                style={[
                  styles.searchBar,
                  {
                    borderColor: searchBorderColor,
                    shadowColor: Colors.primary,
                    shadowOpacity: searchShadowOpacity,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              >
                <View style={styles.searchIconContainer}>
                  <Ionicons name="search" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.searchPlaceholder}>Where to?</Text>
                <Feather name="arrow-right" size={20} color={Colors.textTertiary} />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.vehicleSection}>
            <Text style={styles.vehicleSectionTitle}>Choose your ride</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vehicleList}
            >
              {VEHICLE_TYPES.map((vehicle, index) => (
                <Animated.View
                  key={vehicle.type}
                  style={[
                    styles.vehicleCard,
                    {
                      opacity: cardAnims[index],
                      transform: [
                        {
                          translateY: cardAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [40, 0],
                          }),
                        },
                        {
                          scale: cardAnims[index].interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.85, 1.03, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.vehicleCardInner}
                    onPress={() => router.push('/customer/new-booking' as any)}
                  >
                    <View style={styles.vehicleIconContainer}>
                      <MaterialCommunityIcons
                        name={vehicle.icon}
                        size={32}
                        color={Colors.primary}
                      />
                    </View>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleCapacity}>{vehicle.capacity}</Text>
                    <Text style={styles.vehiclePrice}>{vehicle.price}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.quickLocations}>
            <Text style={styles.quickLocationsTitle}>Popular locations</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickLocationsList}
            >
              {MOCK_LOCATIONS.slice(0, 4).map((location) => (
                <LocationChip
                  key={location.id}
                  location={location}
                  onPress={() => router.push('/customer/new-booking' as any)}
                />
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  mapGrid: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapGridLine: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 25,
    opacity: 0.3,
  },
  floatingPin: {
    position: 'absolute',
    zIndex: 2,
  },
  mapDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(27, 110, 243, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    opacity: 0.6,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 247, 250, 0.3)',
    top: 280,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingContainer: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.surface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  activeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  activeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pulseIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryGlow,
  },
  pulseCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  activeBannerTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  activeBannerStatus: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.primary,
    marginTop: 2,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  vehicleSection: {
    marginBottom: 16,
  },
  vehicleSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  vehicleList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  vehicleCard: {
    width: (SCREEN_WIDTH - 64) / 3,
    minWidth: 110,
  },
  vehicleCardInner: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  vehicleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  vehicleName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  vehicleCapacity: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  vehiclePrice: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  quickLocations: {
    paddingHorizontal: 0,
  },
  quickLocationsTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  quickLocationsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  quickLocationText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    maxWidth: 120,
  },
});
