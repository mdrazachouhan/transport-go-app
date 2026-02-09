import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import Colors from '@/constants/colors';
import { getApiUrl } from '@/lib/query-client';

function AnimatedStatCard({
  index,
  icon,
  iconColor,
  iconBg,
  value,
  label,
}: {
  index: number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
}) {
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const valueScale = useRef(new Animated.Value(0.8)).current;
  const valueOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 100;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(delay + 300),
      Animated.parallel([
        Animated.spring(valueScale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: false,
        }),
        Animated.timing(valueOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity,
          transform: [{ translateY }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.statCardInner}
      >
        <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <Animated.Text
          style={[
            styles.statValue,
            {
              opacity: valueOpacity,
              transform: [{ scale: valueScale }],
            },
          ]}
        >
          {value}
        </Animated.Text>
        <Text style={styles.statLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AnimatedRequestsButton({ onPress }: { onPress: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: Animated.multiply(pulseAnim, scaleAnim),
          },
        ],
        marginBottom: 20,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.requestsButton}
        >
          <View style={styles.requestsButtonLeft}>
            <View style={styles.requestsIconContainer}>
              <MaterialCommunityIcons name="bell-ring-outline" size={22} color={Colors.surface} />
            </View>
            <View>
              <Text style={styles.requestsButtonTitle}>New Ride Requests</Text>
              <Text style={styles.requestsButtonSub}>Tap to view pending requests</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.surface} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AnimatedActiveCard({
  booking,
  onPress,
}: {
  booking: any;
  onPress: () => void;
}) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glow.start();

    const dotPulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dotScale, {
            toValue: 1.4,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(dotOpacity, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dotScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
      ])
    );
    dotPulse.start();

    return () => {
      glow.stop();
      dotPulse.stop();
    };
  }, []);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.primaryLight, Colors.primary],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.25],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.activeCard,
        {
          borderColor,
          shadowOpacity,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.activeCardHeader}>
          <View style={styles.activeIndicator}>
            <Animated.View
              style={[
                styles.activeIndicatorDot,
                {
                  transform: [{ scale: dotScale }],
                  opacity: dotOpacity,
                },
              ]}
            />
          </View>
          <Text style={styles.activeCardTitle}>Active Ride</Text>
          <View style={styles.activeStatusBadge}>
            <Text style={styles.activeStatusText}>
              {booking.status === 'accepted'
                ? 'Accepted'
                : booking.status === 'in_progress'
                ? 'In Transit'
                : 'Pending'}
            </Text>
          </View>
        </View>
        <View style={styles.activeCardBody}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot}>
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {booking.pickup.name}
            </Text>
          </View>
          <View style={styles.locationConnector} />
          <View style={styles.locationRow}>
            <View style={styles.locationDot}>
              <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {booking.delivery.name}
            </Text>
          </View>
        </View>
        <View style={styles.activeCardFooter}>
          <Text style={styles.activeCardPrice}>
            {'\u20B9'}{booking.totalPrice}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AnimatedCompletedCard({
  booking,
  index,
  getVehicleIcon,
}: {
  booking: any;
  index: number;
  getVehicleIcon: (type: string) => string;
}) {
  const translateX = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 100;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.completedCard,
        {
          opacity,
          transform: [{ translateX }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.completedCardInner}
      >
        <View style={styles.completedLeft}>
          <View style={styles.completedIconContainer}>
            <MaterialCommunityIcons
              name={getVehicleIcon(booking.vehicleType) as any}
              size={20}
              color={Colors.primary}
            />
          </View>
          <View style={styles.completedInfo}>
            <Text style={styles.completedPickup} numberOfLines={1}>
              {booking.pickup.name}
            </Text>
            <Text style={styles.completedDelivery} numberOfLines={1}>
              {booking.delivery.name}
            </Text>
            <Text style={styles.completedDate}>
              {new Date(booking.completedAt || booking.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={styles.completedPrice}>
          {'\u20B9'}{booking.totalPrice}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DriverDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, token, refreshUser } = useAuth();
  const { bookings, fetchBookings, getActiveBooking } = useBookings();
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);

  const onlineGlowAnim = useRef(new Animated.Value(0)).current;

  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;
  const topInset = insets.top + webTop;
  const bottomInset = insets.bottom + webBottom;

  const activeBooking = getActiveBooking();
  const completedBookings = bookings
    .filter((b) => b.status === 'completed')
    .slice(0, 5);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(() => {
      fetchBookings();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.isOnline) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(onlineGlowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(onlineGlowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      glow.start();
      return () => glow.stop();
    } else {
      onlineGlowAnim.setValue(0);
    }
  }, [user?.isOnline]);

  const handleToggleOnline = async () => {
    setIsTogglingOnline(true);
    try {
      const baseUrl = getApiUrl();
      const url = new URL('/api/users/toggle-online', baseUrl);
      const res = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        await refreshUser();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to toggle online status');
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'auto':
        return 'rickshaw';
      case 'tempo':
        return 'van-utility';
      case 'truck':
        return 'truck';
      default:
        return 'truck';
    }
  };

  const onlineGlowColor = onlineGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.35)'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={20} color={Colors.surface} />
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Driver'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Animated.View
              style={[
                styles.toggleContainer,
                user?.isOnline && {
                  backgroundColor: onlineGlowColor,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                },
              ]}
            >
              <Text style={styles.toggleLabel}>
                {user?.isOnline ? 'Online' : 'Offline'}
              </Text>
              {isTogglingOnline ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Switch
                  value={user?.isOnline ?? false}
                  onValueChange={handleToggleOnline}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent }}
                  thumbColor={Colors.surface}
                />
              )}
            </Animated.View>
            <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
              <Feather name="log-out" size={20} color={Colors.surface} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <AnimatedStatCard
            index={0}
            icon={<Ionicons name="car" size={20} color={Colors.primary} />}
            iconColor={Colors.primary}
            iconBg={Colors.primaryLight}
            value={String(user?.totalTrips ?? 0)}
            label="Total Trips"
          />
          <AnimatedStatCard
            index={1}
            icon={<MaterialCommunityIcons name="currency-inr" size={20} color={Colors.success} />}
            iconColor={Colors.success}
            iconBg={Colors.successLight}
            value={String(user?.totalEarnings ?? 0)}
            label="Earnings"
          />
          <AnimatedStatCard
            index={2}
            icon={<Ionicons name="star" size={20} color={Colors.warning} />}
            iconColor={Colors.warning}
            iconBg={Colors.warningLight}
            value={user?.rating ? user.rating.toFixed(1) : '0.0'}
            label="Rating"
          />
        </View>

        <AnimatedRequestsButton
          onPress={() => router.push('/driver/requests' as any)}
        />

        {activeBooking && (
          <AnimatedActiveCard
            booking={activeBooking}
            onPress={() =>
              router.push({
                pathname: '/driver/active-ride' as any,
                params: { bookingId: activeBooking.id },
              })
            }
          />
        )}

        {completedBookings.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Completed</Text>
            {completedBookings.map((booking, index) => (
              <AnimatedCompletedCard
                key={booking.id}
                booking={booking}
                index={index}
                getVehicleIcon={getVehicleIcon}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    gap: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.surface,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statCardInner: {
    padding: 14,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  requestsButton: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestsButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsButtonTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.surface,
  },
  requestsButtonSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  activeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  activeIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activeIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  activeCardTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  activeStatusBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeStatusText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
  activeCardBody: {
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationConnector: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 11,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  activeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginTop: 0,
  },
  activeCardPrice: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  recentSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 12,
  },
  completedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  completedCardInner: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  completedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedInfo: {
    flex: 1,
  },
  completedPickup: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  completedDelivery: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  completedDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  completedPrice: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginLeft: 8,
  },
});
