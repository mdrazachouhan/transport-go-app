import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RouteMap from '@/components/RouteMap';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import Colors from '@/constants/colors';
import { MOCK_LOCATIONS, type Location } from '@/lib/locations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VEHICLE_OPTIONS = [
  { type: 'auto', label: 'Auto', icon: 'rickshaw' as const, baseFare: 50, perKm: 12, capacity: 'Up to 200kg' },
  { type: 'tempo', label: 'Tempo', icon: 'truck-outline' as const, baseFare: 150, perKm: 18, capacity: 'Up to 1000kg' },
  { type: 'truck', label: 'Truck', icon: 'truck' as const, baseFare: 300, perKm: 25, capacity: '1000kg+' },
];

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return (
    Math.round(
      Math.sqrt(
        Math.pow((lat2 - lat1) * 111, 2) +
          Math.pow((lng2 - lng1) * 111 * Math.cos((lat1 * Math.PI) / 180), 2)
      ) * 10
    ) / 10
  );
}

function LocationSearchItem({
  loc,
  type,
  onPress,
}: {
  loc: Location;
  type: 'pickup' | 'delivery';
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.searchResultItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.searchResultIcon, type === 'delivery' && styles.searchResultIconDelivery]}>
        <Ionicons
          name={type === 'pickup' ? 'location' : 'flag'}
          size={16}
          color={type === 'pickup' ? Colors.success : Colors.danger}
        />
      </View>
      <View style={styles.searchResultText}>
        <Text style={styles.searchResultName}>{loc.name}</Text>
        <Text style={styles.searchResultArea}>{loc.area}</Text>
      </View>
    </TouchableOpacity>
  );
}

function VehicleOption({
  vehicle,
  isActive,
  distance,
  onPress,
}: {
  vehicle: typeof VEHICLE_OPTIONS[0];
  isActive: boolean;
  distance: number;
  onPress: () => void;
}) {
  const totalPrice = vehicle.baseFare + Math.round(distance * vehicle.perKm);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.vehicleOption, isActive && styles.vehicleOptionActive]}
        onPress={() => {
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
          ]).start();
          onPress();
        }}
        activeOpacity={0.85}
      >
        <View style={[styles.vehicleIconBox, isActive && styles.vehicleIconBoxActive]}>
          <MaterialCommunityIcons
            name={vehicle.icon}
            size={26}
            color={isActive ? '#FFFFFF' : Colors.primary}
          />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={[styles.vehicleLabel, isActive && styles.vehicleLabelActive]}>{vehicle.label}</Text>
          <Text style={styles.vehicleCapacity}>{vehicle.capacity}</Text>
        </View>
        <View style={styles.vehiclePriceBox}>
          <Text style={[styles.vehiclePrice, isActive && styles.vehiclePriceActive]}>
            {'\u20B9'}{totalPrice}
          </Text>
        </View>
        {isActive && (
          <View style={styles.vehicleCheckmark}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NewBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createBooking } = useBookings();

  const [pickup, setPickup] = useState<Location | null>(null);
  const [delivery, setDelivery] = useState<Location | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [activeField, setActiveField] = useState<'pickup' | 'delivery' | null>('pickup');
  const [vehicleType, setVehicleType] = useState('auto');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [loading, setLoading] = useState(false);

  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const mapFadeAnim = useRef(new Animated.Value(0)).current;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const bothSelected = pickup !== null && delivery !== null;

  const distance = bothSelected
    ? calculateDistance(pickup.lat, pickup.lng, delivery.lat, delivery.lng)
    : 0;

  const selectedVehicle = VEHICLE_OPTIONS.find((v) => v.type === vehicleType)!;
  const totalPrice = selectedVehicle.baseFare + Math.round(distance * selectedVehicle.perKm);
  const eta = Math.round(distance * 3 + 5);

  const filteredLocations = useMemo(() => {
    const searchText = activeField === 'pickup' ? pickupSearch : deliverySearch;
    const excludeId = activeField === 'pickup' ? delivery?.id : pickup?.id;
    return MOCK_LOCATIONS.filter((loc) => {
      if (loc.id === excludeId) return false;
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return loc.name.toLowerCase().includes(q) || loc.area.toLowerCase().includes(q);
    });
  }, [pickupSearch, deliverySearch, activeField, pickup, delivery]);

  useEffect(() => {
    if (bothSelected) {
      setActiveField(null);
      Animated.parallel([
        Animated.spring(bottomSheetAnim, { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }),
        Animated.timing(mapFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

    } else {
      bottomSheetAnim.setValue(0);
      mapFadeAnim.setValue(0);
    }
  }, [bothSelected]);

  const handleSelectLocation = (loc: Location) => {
    if (activeField === 'pickup') {
      setPickup(loc);
      setPickupSearch(loc.name);
      if (!delivery) {
        setActiveField('delivery');
      }
    } else if (activeField === 'delivery') {
      setDelivery(loc);
      setDeliverySearch(loc.name);
    }
  };

  const handleClearPickup = () => {
    setPickup(null);
    setPickupSearch('');
    setActiveField('pickup');
  };

  const handleClearDelivery = () => {
    setDelivery(null);
    setDeliverySearch('');
    setActiveField('delivery');
  };

  const handleConfirm = async () => {
    if (!pickup || !delivery) return;
    setLoading(true);
    try {
      const result = await createBooking({
        pickup: { name: pickup.name, area: pickup.area, lat: pickup.lat, lng: pickup.lng },
        delivery: { name: delivery.name, area: delivery.area, lat: delivery.lat, lng: delivery.lng },
        vehicleType,
        paymentMethod,
      });
      if (result.success && result.booking) {
        router.replace({
          pathname: '/customer/track-ride',
          params: { bookingId: result.booking.id },
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to create booking');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const rideSheetTranslateY = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={[styles.container]}>
      {bothSelected ? (
        <Animated.View style={[styles.mapContainer, { opacity: mapFadeAnim }]}>
          <RouteMap pickup={pickup} delivery={delivery} />
        </Animated.View>
      ) : (
        <View style={[styles.searchBackground]}>
          <LinearGradient
            colors={[Colors.navyDark, Colors.navy, Colors.background]}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      <View style={[styles.topSection, { paddingTop: topInset }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={bothSelected ? Colors.text : '#FFFFFF'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, bothSelected && styles.headerTitleDark]}>
            {bothSelected ? 'Choose Your Ride' : 'Select Locations'}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <View style={[styles.searchCard, bothSelected && styles.searchCardCompact]}>
          <View style={styles.searchDots}>
            <View style={[styles.dot, styles.dotGreen]} />
            <View style={styles.dotLine} />
            <View style={[styles.dot, styles.dotRed]} />
          </View>
          <View style={styles.searchInputs}>
            <TouchableOpacity
              style={[
                styles.searchInputRow,
                activeField === 'pickup' && !bothSelected && styles.searchInputRowActive,
              ]}
              onPress={() => {
                if (bothSelected) {
                  handleClearPickup();
                } else {
                  setActiveField('pickup');
                }
              }}
              activeOpacity={0.8}
            >
              {!bothSelected && activeField === 'pickup' ? (
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search pickup location..."
                  placeholderTextColor={Colors.textTertiary}
                  value={pickupSearch}
                  onChangeText={(text) => {
                    setPickupSearch(text);
                    if (pickup) setPickup(null);
                  }}
                  autoFocus
                  testID="pickup-search"
                />
              ) : (
                <Text style={[styles.searchInputText, pickup && styles.searchInputTextFilled]} numberOfLines={1}>
                  {pickup ? pickup.name : 'Search pickup location...'}
                </Text>
              )}
              {pickup && (
                <TouchableOpacity onPress={handleClearPickup} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <View style={styles.searchDivider} />

            <TouchableOpacity
              style={[
                styles.searchInputRow,
                activeField === 'delivery' && !bothSelected && styles.searchInputRowActive,
              ]}
              onPress={() => {
                if (bothSelected) {
                  handleClearDelivery();
                } else {
                  setActiveField('delivery');
                }
              }}
              activeOpacity={0.8}
            >
              {!bothSelected && activeField === 'delivery' ? (
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search delivery location..."
                  placeholderTextColor={Colors.textTertiary}
                  value={deliverySearch}
                  onChangeText={(text) => {
                    setDeliverySearch(text);
                    if (delivery) setDelivery(null);
                  }}
                  autoFocus
                  testID="delivery-search"
                />
              ) : (
                <Text style={[styles.searchInputText, delivery && styles.searchInputTextFilled]} numberOfLines={1}>
                  {delivery ? delivery.name : 'Search delivery location...'}
                </Text>
              )}
              {delivery && (
                <TouchableOpacity onPress={handleClearDelivery} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {!bothSelected && activeField && (
        <KeyboardAvoidingView
          style={styles.resultsContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredLocations.length === 0 ? (
              <View style={styles.emptyResults}>
                <Ionicons name="search-outline" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No locations found</Text>
              </View>
            ) : (
              filteredLocations.map((loc) => (
                <LocationSearchItem
                  key={loc.id}
                  loc={loc}
                  type={activeField}
                  onPress={() => handleSelectLocation(loc)}
                />
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {bothSelected && (
        <Animated.View
          style={[
            styles.rideSheet,
            { paddingBottom: bottomInset + 16, transform: [{ translateY: rideSheetTranslateY }] },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.routeInfoRow}>
            <View style={styles.routeInfoItem}>
              <Ionicons name="navigate-outline" size={18} color={Colors.primary} />
              <Text style={styles.routeInfoValue}>{distance} km</Text>
            </View>
            <View style={styles.routeInfoDot} />
            <View style={styles.routeInfoItem}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.routeInfoValue}>{eta} min</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.vehicleList}>
            {VEHICLE_OPTIONS.map((v) => (
              <VehicleOption
                key={v.type}
                vehicle={v}
                isActive={vehicleType === v.type}
                distance={distance}
                onPress={() => setVehicleType(v.type)}
              />
            ))}

            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Payment</Text>
              <View style={styles.paymentRow}>
                <TouchableOpacity
                  style={[styles.paymentBtn, paymentMethod === 'cash' && styles.paymentBtnActive]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={paymentMethod === 'cash' ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.paymentBtnText, paymentMethod === 'cash' && styles.paymentBtnTextActive]}>
                    Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.paymentBtn, paymentMethod === 'upi' && styles.paymentBtnActive]}
                  onPress={() => setPaymentMethod('upi')}
                >
                  <MaterialCommunityIcons
                    name="cellphone"
                    size={18}
                    color={paymentMethod === 'upi' ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.paymentBtnText, paymentMethod === 'upi' && styles.paymentBtnTextActive]}>
                    UPI
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.confirmGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.confirmText}>Book {selectedVehicle.label}</Text>
                  <View style={styles.confirmPriceBadge}>
                    <Text style={styles.confirmPrice}>{'\u20B9'}{totalPrice}</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  searchBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  topSection: {
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  headerTitleDark: {
    color: Colors.text,
  },
  searchCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  searchCardCompact: {
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchDots: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: {
    backgroundColor: Colors.success,
  },
  dotRed: {
    backgroundColor: Colors.danger,
  },
  dotLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    marginVertical: 3,
  },
  searchInputs: {
    flex: 1,
    marginLeft: 8,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minHeight: 42,
  },
  searchInputRowActive: {
    backgroundColor: Colors.primaryLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    padding: 0,
  },
  searchInputText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  searchInputTextFilled: {
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  searchDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  resultsContainer: {
    flex: 1,
    zIndex: 5,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchResultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchResultIconDelivery: {
    backgroundColor: Colors.dangerLight,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  searchResultArea: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyResults: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    marginTop: 12,
  },
  rideSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 16,
    maxHeight: SCREEN_HEIGHT * 0.52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeInfoValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primaryDark,
  },
  routeInfoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primaryDark,
    marginHorizontal: 16,
  },
  vehicleList: {
    maxHeight: SCREEN_HEIGHT * 0.28,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  vehicleOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  vehicleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleIconBoxActive: {
    backgroundColor: Colors.primary,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  vehicleLabelActive: {
    color: Colors.primaryDark,
  },
  vehicleCapacity: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vehiclePriceBox: {
    marginRight: 4,
  },
  vehiclePrice: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  vehiclePriceActive: {
    color: Colors.primaryDark,
  },
  vehicleCheckmark: {
    marginLeft: 4,
  },
  paymentSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  paymentBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  paymentBtnTextActive: {
    color: Colors.primary,
  },
  confirmBtn: {
    marginTop: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 12,
  },
  confirmText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  confirmPriceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  confirmPrice: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
});
