import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useBookings, type BookingData } from '@/contexts/BookingContext';

const statusColors: Record<string, string> = {
  pending: Colors.warning,
  accepted: Colors.primary,
  in_progress: Colors.accent,
  completed: Colors.success,
  cancelled: Colors.danger,
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Transit',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const vehicleIcons: Record<string, any> = {
  auto: 'rickshaw',
  tempo: 'van-utility',
  truck: 'truck',
};

function AnimatedBookingCard({ booking, onPress, index }: { booking: BookingData; onPress: () => void; index: number }) {
  const color = statusColors[booking.status] || Colors.textSecondary;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  function handlePressIn() {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }, { scale: scaleAnim }], opacity: opacityAnim }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[color, color + '88']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardAccentLine}
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.vehicleWrap}>
              <MaterialCommunityIcons name={vehicleIcons[booking.vehicleType] || 'truck'} size={22} color={Colors.primary} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardDate}>{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
                <View style={[styles.statusGlow, { backgroundColor: color, shadowColor: color }]} />
                <Text style={[styles.statusText, { color }]}>{statusLabels[booking.status]}</Text>
              </View>
            </View>
            <Text style={styles.priceText}>₹{booking.totalPrice}</Text>
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.routeText} numberOfLines={1}>{booking.pickup.name}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.routeText} numberOfLines={1}>{booking.delivery.name}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.distText}>{booking.distance} km</Text>
            {booking.rating ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text style={styles.ratingText}>{booking.rating}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptyState() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
      <Text style={styles.emptyText}>No bookings yet</Text>
      <Text style={styles.emptySubtext}>Your booking history will appear here</Text>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookings, fetchBookings, loading } = useBookings();

  useEffect(() => { fetchBookings(); }, []);

  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;

  function handleBookingPress(booking: BookingData) {
    if (['pending', 'accepted', 'in_progress'].includes(booking.status)) {
      router.push({ pathname: '/customer/track-ride' as any, params: { bookingId: booking.id } });
    } else if (booking.status === 'completed' && !booking.rating) {
      router.push({ pathname: '/customer/rate-ride' as any, params: { bookingId: booking.id } });
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking History</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>
      {loading && bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <AnimatedBookingCard booking={item} onPress={() => handleBookingPress(item)} index={index} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + webBottom + 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.cardBorder, flexDirection: 'row', overflow: 'hidden' },
  cardAccentLine: { width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  vehicleWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  cardHeaderInfo: { flex: 1, marginLeft: 12 },
  cardDate: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusGlow: { width: 6, height: 6, borderRadius: 3, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  priceText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  routeInfo: { marginLeft: 8 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 1, height: 16, backgroundColor: Colors.border, marginLeft: 3 },
  routeText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  distText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptySubtext: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
});
