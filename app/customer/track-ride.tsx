import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
  ActivityIndicator,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBookings } from '@/contexts/BookingContext';
import Colors from '@/constants/colors';

const CANCEL_REASONS = [
  'Changed mind',
  'Found another service',
  'Driver taking too long',
  'Other',
];

const STEPS = [
  { label: 'Confirmed', icon: 'checkmark-circle' as const },
  { label: 'Driver Assigned', icon: 'person' as const },
  { label: 'Pickup', icon: 'location' as const },
  { label: 'Delivery', icon: 'flag' as const },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'accepted':
      return 1;
    case 'in_progress':
      return 2;
    case 'completed':
      return 3;
    default:
      return -1;
  }
}

function AnimatedCard({ delay, children, style, fromRight }: { delay: number; children: React.ReactNode; style?: any; fromRight?: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const translateX = fromRight
    ? anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] })
    : new Animated.Value(0);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY }, { translateX: translateX as any }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function StepItem({
  step,
  index,
  isCompleted,
  isActive,
  isPending,
  isLast,
  dotAnim,
}: {
  step: { label: string; icon: string };
  index: number;
  isCompleted: boolean;
  isActive: boolean;
  isPending: boolean;
  isLast: boolean;
  dotAnim: Animated.Value;
}) {
  const scaleAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCompleted) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [isCompleted]);

  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isActive]);

  const dotScale = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const dotOpacity = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.4],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIndicatorColumn}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {isActive && (
            <Animated.View
              style={[
                styles.glowRing,
                {
                  transform: [{ scale: glowScale }],
                  opacity: glowOpacity,
                },
              ]}
            />
          )}
          <Animated.View
            style={[
              styles.stepCircle,
              isCompleted && styles.stepCircleCompleted,
              isActive && styles.stepCircleActive,
              isPending && styles.stepCirclePending,
              isCompleted && { transform: [{ scale: scaleAnim }] },
            ]}
          >
            {isCompleted ? (
              <Ionicons name="checkmark" size={14} color={Colors.surface} />
            ) : isActive ? (
              <Animated.View
                style={[
                  styles.activeDot,
                  { transform: [{ scale: dotScale }], opacity: dotOpacity },
                ]}
              />
            ) : (
              <View style={styles.pendingDot} />
            )}
          </Animated.View>
        </View>
        {!isLast && (
          <View
            style={[
              styles.stepLine,
              isCompleted && styles.stepLineCompleted,
              isActive && styles.stepLineActive,
            ]}
          />
        )}
      </View>
      <View style={styles.stepContent}>
        <Text
          style={[
            styles.stepLabel,
            isCompleted && styles.stepLabelCompleted,
            isActive && styles.stepLabelActive,
          ]}
        >
          {step.label}
        </Text>
        {isActive && <Text style={styles.stepActiveHint}>In progress</Text>}
        {isCompleted && <Text style={styles.stepCompletedHint}>Done</Text>}
      </View>
    </View>
  );
}

function OtpDigitBox({ digit, index }: { digit: string; index: number }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 120,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.otpDigitBox,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Text style={styles.otpDigit}>{digit}</Text>
    </Animated.View>
  );
}

function SOSButton({ onPress }: { onPress: () => void }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.85, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale: pulseScale }], opacity: pulseOpacity }}>
      <TouchableOpacity onPress={onPress} style={styles.sosButton}>
        <MaterialCommunityIcons name="phone-alert" size={20} color={Colors.surface} />
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CancelModal({
  visible,
  onClose,
  onConfirm,
  bottomInset,
  cancelling,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  bottomInset: number;
  cancelling: boolean;
}) {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      setSelectedReason(null);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setShow(false);
      });
    }
  }, [visible]);

  if (!show && !visible) return null;

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlayContainer}>
        <Animated.View style={[styles.modalBackdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.modalContent,
            { paddingBottom: bottomInset + 20, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Please select a reason for cancellation</Text>
          {CANCEL_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonOption,
                selectedReason === reason && styles.reasonOptionSelected,
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <View
                style={[
                  styles.reasonRadio,
                  selectedReason === reason && styles.reasonRadioSelected,
                ]}
              >
                {selectedReason === reason && <View style={styles.reasonRadioDot} />}
              </View>
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason && styles.reasonTextSelected,
                ]}
              >
                {reason}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.confirmCancelButton,
              !selectedReason && styles.confirmCancelButtonDisabled,
            ]}
            onPress={() => selectedReason && onConfirm(selectedReason)}
            disabled={!selectedReason || cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.confirmCancelText}>Confirm Cancellation</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function TrackRideScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();
  const { bookings, fetchBookings, cancelBooking, getBookingById } = useBookings();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const dotAnim = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [dotAnim]);

  const booking = getBookingById(bookingId as string);

  useEffect(() => {
    if (booking?.status === 'completed' && !hasNavigated.current) {
      hasNavigated.current = true;
      router.replace({ pathname: '/customer/rate-ride', params: { bookingId: booking.id } });
    }
  }, [booking?.status]);

  const handleCancel = useCallback(async (reason: string) => {
    if (!bookingId) return;
    setCancelling(true);
    await cancelBooking(bookingId as string, reason);
    setCancelling(false);
    setCancelModalVisible(false);
    router.back();
  }, [bookingId, cancelBooking, router]);

  const handleSOS = () => {
    Alert.alert('SOS', 'Are you sure you want to trigger an emergency alert?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => {
          Linking.openURL('tel:112');
        },
      },
    ]);
  };

  if (!booking) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  const currentStep = getStepIndex(booking.status);
  const isCancelled = booking.status === 'cancelled';

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy]}
        style={[styles.header, { paddingTop: topInset + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Ride</Text>
        <SOSButton onPress={handleSOS} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isCancelled ? (
          <AnimatedCard delay={0}>
            <View style={styles.cancelledCard}>
              <Ionicons name="close-circle" size={48} color={Colors.danger} />
              <Text style={styles.cancelledTitle}>Booking Cancelled</Text>
              {booking.cancelReason && (
                <Text style={styles.cancelledReason}>Reason: {booking.cancelReason}</Text>
              )}
            </View>
          </AnimatedCard>
        ) : (
          <>
            <AnimatedCard delay={0}>
              <View style={styles.stepsCard}>
                <Text style={styles.sectionTitle}>Ride Status</Text>
                <View style={styles.stepsContainer}>
                  {STEPS.map((step, index) => (
                    <StepItem
                      key={step.label}
                      step={step}
                      index={index}
                      isCompleted={index < currentStep}
                      isActive={index === currentStep}
                      isPending={index > currentStep}
                      isLast={index === STEPS.length - 1}
                      dotAnim={dotAnim}
                    />
                  ))}
                </View>
              </View>
            </AnimatedCard>

            {booking.driverName && (
              <AnimatedCard delay={120} fromRight>
                <View style={styles.driverCard}>
                  <Text style={styles.sectionTitle}>Driver Details</Text>
                  <View style={styles.driverInfo}>
                    <View style={styles.driverAvatar}>
                      <Ionicons name="person" size={28} color={Colors.primary} />
                    </View>
                    <View style={styles.driverDetails}>
                      <Text style={styles.driverName}>{booking.driverName}</Text>
                      {booking.driverPhone && (
                        <View style={styles.driverRow}>
                          <Feather name="phone" size={14} color={Colors.textSecondary} />
                          <Text style={styles.driverSubtext}>{booking.driverPhone}</Text>
                        </View>
                      )}
                      {booking.driverVehicleNumber && (
                        <View style={styles.driverRow}>
                          <MaterialCommunityIcons name="truck" size={14} color={Colors.textSecondary} />
                          <Text style={styles.driverSubtext}>{booking.driverVehicleNumber}</Text>
                        </View>
                      )}
                    </View>
                    {booking.driverPhone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${booking.driverPhone}`)}
                        style={styles.callButton}
                      >
                        <Ionicons name="call" size={20} color={Colors.surface} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </AnimatedCard>
            )}

            {booking.status === 'accepted' && booking.otp && (
              <AnimatedCard delay={240}>
                <View style={styles.otpCard}>
                  <Text style={styles.otpTitle}>Verification OTP</Text>
                  <Text style={styles.otpSubtitle}>Share this OTP with your driver</Text>
                  <View style={styles.otpContainer}>
                    {booking.otp.split('').map((digit, i) => (
                      <OtpDigitBox key={i} digit={digit} index={i} />
                    ))}
                  </View>
                </View>
              </AnimatedCard>
            )}

            <AnimatedCard delay={360}>
              <View style={styles.routeCard}>
                <Text style={styles.sectionTitle}>Route</Text>
                <View style={styles.routeRow}>
                  <View style={styles.routeIconColumn}>
                    <Ionicons name="radio-button-on" size={16} color={Colors.success} />
                    <View style={styles.routeDottedLine} />
                    <Ionicons name="location" size={16} color={Colors.danger} />
                  </View>
                  <View style={styles.routeDetails}>
                    <View style={styles.routePoint}>
                      <Text style={styles.routeLabel}>Pickup</Text>
                      <Text style={styles.routeName}>{booking.pickup.name}</Text>
                      <Text style={styles.routeArea}>{booking.pickup.area}</Text>
                    </View>
                    <View style={styles.routeDivider} />
                    <View style={styles.routePoint}>
                      <Text style={styles.routeLabel}>Delivery</Text>
                      <Text style={styles.routeName}>{booking.delivery.name}</Text>
                      <Text style={styles.routeArea}>{booking.delivery.area}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </AnimatedCard>

            <AnimatedCard delay={480}>
              <View style={styles.priceCard}>
                <Text style={styles.sectionTitle}>Fare Breakdown</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base Price</Text>
                  <Text style={styles.priceValue}>Rs. {booking.basePrice.toFixed(2)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Distance Charge ({booking.distance} km)</Text>
                  <Text style={styles.priceValue}>Rs. {booking.distanceCharge.toFixed(2)}</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotalLabel}>Total</Text>
                  <Text style={styles.priceTotalValue}>Rs. {booking.totalPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.paymentMethodRow}>
                  <MaterialCommunityIcons
                    name={booking.paymentMethod === 'cash' ? 'cash' : 'cellphone'}
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.paymentMethodText}>
                    {booking.paymentMethod === 'cash' ? 'Cash Payment' : 'UPI Payment'}
                  </Text>
                </View>
              </View>
            </AnimatedCard>

            {(booking.status === 'pending' || booking.status === 'accepted') && (
              <AnimatedCard delay={600}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCancelModalVisible(true)}
                >
                  <Feather name="x-circle" size={18} color={Colors.danger} />
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </TouchableOpacity>
              </AnimatedCard>
            )}
          </>
        )}
      </ScrollView>

      <CancelModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={handleCancel}
        bottomInset={bottomInset}
        cancelling={cancelling}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.surface,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  sosText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  cancelledCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
  },
  cancelledTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.danger,
  },
  cancelledReason: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  stepsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  stepsContainer: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorColumn: {
    alignItems: 'center',
    width: 32,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    zIndex: 2,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepCircleActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  stepCirclePending: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  glowRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryGlow,
    zIndex: 1,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepLine: {
    width: 2,
    height: 32,
    backgroundColor: Colors.border,
  },
  stepLineCompleted: {
    backgroundColor: Colors.success,
  },
  stepLineActive: {
    backgroundColor: Colors.primaryLight,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
    minHeight: 52,
  },
  stepLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textTertiary,
  },
  stepLabelCompleted: {
    color: Colors.success,
    fontFamily: 'Inter_600SemiBold',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  stepActiveHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  stepCompletedHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  driverCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 14,
    gap: 4,
  },
  driverName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  otpTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.primaryDark,
  },
  otpSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.primaryDark,
    marginTop: 4,
    marginBottom: 16,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  otpDigitBox: {
    width: 52,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  otpDigit: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.primary,
  },
  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  routeRow: {
    flexDirection: 'row',
  },
  routeIconColumn: {
    alignItems: 'center',
    width: 24,
    paddingTop: 2,
  },
  routeDottedLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: 4,
    minHeight: 40,
  },
  routeDetails: {
    flex: 1,
    marginLeft: 12,
  },
  routePoint: {
    paddingVertical: 4,
  },
  routeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.text,
    marginTop: 2,
  },
  routeArea: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  routeDivider: {
    height: 12,
  },
  priceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  priceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
  priceTotalLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  priceTotalValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.primary,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  paymentMethodText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  cancelButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.danger,
  },
  modalOverlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.text,
  },
  modalSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
    gap: 12,
  },
  reasonOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  reasonRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonRadioSelected: {
    borderColor: Colors.primary,
  },
  reasonRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  reasonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.text,
  },
  reasonTextSelected: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  confirmCancelButton: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmCancelButtonDisabled: {
    opacity: 0.5,
  },
  confirmCancelText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.surface,
  },
});
