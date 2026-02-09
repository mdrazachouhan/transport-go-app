import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import Colors from '@/constants/colors';

const STEPS = ['Accepted', 'OTP Verification', 'In Transit', 'Completed'];

function AnimatedCard({ children, index, style }: { children: React.ReactNode; index: number; style?: any }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function AnimatedStepIndicator({ step, index, currentStep }: { step: string; index: number; currentStep: number }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (index <= currentStep) {
      Animated.sequence([
        Animated.delay(index * 150),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 150,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
    }

    if (index < currentStep) {
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 150 + 200,
        useNativeDriver: false,
      }).start();
    }
  }, [currentStep]);

  const lineColor = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIndicatorCol}>
        <Animated.View
          style={[
            styles.stepCircle,
            index <= currentStep ? styles.stepCircleActive : styles.stepCircleInactive,
            { transform: [{ scale: index <= currentStep ? scaleAnim : 1 }] },
          ]}
        >
          {index < currentStep ? (
            <Ionicons name="checkmark" size={14} color={Colors.surface} />
          ) : index === currentStep ? (
            <View style={styles.stepCurrentDot} />
          ) : null}
        </Animated.View>
        {index < STEPS.length - 1 && (
          <Animated.View
            style={[
              styles.stepLine,
              index < currentStep
                ? { backgroundColor: lineColor }
                : styles.stepLineInactive,
            ]}
          />
        )}
      </View>
      <Text
        style={[
          styles.stepLabel,
          index <= currentStep ? styles.stepLabelActive : styles.stepLabelInactive,
        ]}
      >
        {step}
      </Text>
    </View>
  );
}

function PulsingCallButton({ onPress }: { onPress: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity style={styles.callButton} onPress={onPress}>
        <Ionicons name="call" size={20} color={Colors.surface} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function PulsingCompleteButton({ onPress, disabled, isLoading }: { onPress: () => void; disabled: boolean; isLoading: boolean }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!disabled) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [disabled]);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[disabled && styles.buttonDisabled]}
      >
        <LinearGradient
          colors={[Colors.success, '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.completeButton}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <>
              <Ionicons name="checkmark-done-circle" size={22} color={Colors.surface} />
              <Text style={styles.completeButtonText}>Complete Delivery</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AnimatedOtpInput({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) {
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(borderColorAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(borderColorAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.cardBorder, Colors.primary],
  });

  return (
    <Animated.View style={[styles.otpInputWrapper, { borderColor }]}>
      <TextInput
        style={styles.otpInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="Enter OTP"
        placeholderTextColor={Colors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </Animated.View>
  );
}

function CelebrationBanner() {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        friction: 4,
        tension: 100,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.completedBanner, { transform: [{ scale: scaleAnim }] }]}>
      <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
      <Text style={styles.completedText}>Delivery Completed</Text>
    </Animated.View>
  );
}

export default function DriverActiveRideScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { bookings, fetchBookings, getBookingById, startTrip, completeTrip } = useBookings();
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [completing, setCompleting] = useState(false);

  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;
  const topInset = insets.top + webTop;
  const bottomInset = insets.bottom + webBottom;

  const booking = getBookingById(bookingId || '');

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(() => {
      fetchBookings();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentStep = () => {
    if (!booking) return 0;
    switch (booking.status) {
      case 'accepted':
        return 1;
      case 'in_progress':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getCurrentStep();

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }
    setVerifying(true);
    try {
      const result = await startTrip(bookingId!, otp);
      if (result.success) {
        setOtp('');
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleCompleteDelivery = async () => {
    setCompleting(true);
    try {
      const result = await completeTrip(bookingId!);
      if (result.success) {
        Alert.alert('Success', 'Delivery completed successfully');
        router.replace('/driver/dashboard' as any);
      } else {
        Alert.alert('Error', result.error || 'Failed to complete delivery');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to complete delivery');
    } finally {
      setCompleting(false);
    }
  };

  const handleCallCustomer = () => {
    if (booking?.customerPhone) {
      Linking.openURL(`tel:${booking.customerPhone}`);
    }
  };

  if (!booking) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.navyDark, Colors.navy]}
          style={[styles.header, { paddingTop: topInset + 12 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/driver/dashboard' as any)}>
            <Ionicons name="arrow-back" size={22} color={Colors.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Ride</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/driver/dashboard' as any)}>
          <Ionicons name="arrow-back" size={22} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Ride</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedCard index={0} style={styles.progressCard}>
          <Text style={styles.progressTitle}>Ride Progress</Text>
          <View style={styles.stepsContainer}>
            {STEPS.map((step, index) => (
              <AnimatedStepIndicator
                key={step}
                step={step}
                index={index}
                currentStep={currentStep}
              />
            ))}
          </View>
        </AnimatedCard>

        <AnimatedCard index={1} style={styles.locationsCard}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot}>
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationName}>{booking.pickup.name}</Text>
              <Text style={styles.locationArea}>{booking.pickup.area}</Text>
            </View>
          </View>
          <View style={styles.locationConnector} />
          <View style={styles.locationRow}>
            <View style={styles.locationDot}>
              <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Delivery</Text>
              <Text style={styles.locationName}>{booking.delivery.name}</Text>
              <Text style={styles.locationArea}>{booking.delivery.area}</Text>
            </View>
          </View>
        </AnimatedCard>

        <AnimatedCard index={2} style={styles.customerCard}>
          <Text style={styles.cardTitle}>Customer Details</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerInfo}>
              <View style={styles.customerAvatarContainer}>
                <Ionicons name="person" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.customerName}>{booking.customerName}</Text>
                <Text style={styles.customerPhone}>{booking.customerPhone}</Text>
              </View>
            </View>
            <PulsingCallButton onPress={handleCallCustomer} />
          </View>
        </AnimatedCard>

        <AnimatedCard index={3} style={styles.priceCard}>
          <Text style={styles.cardTitle}>Fare Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Fare</Text>
            <Text style={styles.priceValue}>{'\u20B9'}{booking.basePrice}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Distance ({booking.distance} km)</Text>
            <Text style={styles.priceValue}>{'\u20B9'}{booking.distanceCharge}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total</Text>
            <Text style={styles.priceTotalValue}>{'\u20B9'}{booking.totalPrice}</Text>
          </View>
          <View style={styles.paymentMethodRow}>
            <Ionicons
              name={booking.paymentMethod === 'cash' ? 'cash-outline' : 'qr-code-outline'}
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.paymentMethodText}>
              {booking.paymentMethod === 'cash' ? 'Cash Payment' : 'UPI Payment'}
            </Text>
          </View>
        </AnimatedCard>

        {booking.status === 'accepted' && (
          <AnimatedCard index={4} style={styles.actionCard}>
            <Text style={styles.actionTitle}>Verify Customer OTP</Text>
            <Text style={styles.actionSubtitle}>
              Enter the 4-digit OTP provided by the customer
            </Text>
            <AnimatedOtpInput value={otp} onChangeText={setOtp} />
            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={verifying}
              activeOpacity={0.8}
              style={[verifying && styles.buttonDisabled]}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifyButton}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color={Colors.surface} />
                    <Text style={styles.verifyButtonText}>Verify OTP & Start Trip</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedCard>
        )}

        {booking.status === 'in_progress' && (
          <AnimatedCard index={4}>
            <PulsingCompleteButton
              onPress={handleCompleteDelivery}
              disabled={completing}
              isLoading={completing}
            />
          </AnimatedCard>
        )}

        {booking.status === 'completed' && (
          <CelebrationBanner />
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
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.surface,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 16,
  },
  stepsContainer: {},
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 30,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepCircleInactive: {
    backgroundColor: Colors.border,
  },
  stepCurrentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
  },
  stepLine: {
    width: 2,
    height: 20,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepLineInactive: {
    backgroundColor: Colors.border,
  },
  stepLabel: {
    fontSize: 14,
    marginLeft: 12,
    marginTop: 2,
  },
  stepLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  stepLabelInactive: {
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  locationsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
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
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  locationName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    marginTop: 1,
  },
  locationArea: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  customerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  customerPhone: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  priceTotalValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  paymentMethodText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  otpInputWrapper: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
    backgroundColor: Colors.background,
  },
  otpInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 8,
  },
  verifyButton: {
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.surface,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  completeButton: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  completeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.surface,
  },
  completedBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  completedText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.success,
  },
});
