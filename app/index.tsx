import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Platform, Alert, KeyboardAvoidingView, ScrollView, ActivityIndicator, Dimensions, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COUNT = 7;

function FloatingParticle({ delay, size, startX, startY }: { delay: number; size: number; startX: number; startY: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const driftY = 40 + Math.random() * 60;
    const driftX = 20 + Math.random() * 30;
    const duration = 4000 + Math.random() * 3000;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0.6 + Math.random() * 0.4, duration: 1000, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, { toValue: -driftY, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: driftY * 0.5, duration: duration * 0.8, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        ),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateX, { toValue: driftX, duration: duration * 1.2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -driftX, duration: duration * 1.2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.primary,
        opacity,
        transform: [{ translateY }, { translateX }],
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: size * 2,
      }}
    />
  );
}

const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  delay: i * 400,
  size: 3 + Math.random() * 4,
  startX: Math.random() * SCREEN_WIDTH,
  startY: Math.random() * SCREEN_HEIGHT * 0.7,
}));

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, loading: authLoading, sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'driver'>('customer');
  const [loading, setLoading] = useState(false);
  const [sentOtpValue, setSentOtpValue] = useState('');

  const logoSlide = useRef(new Animated.Value(-40)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const roleOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(60)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  const glowPulse = useRef(new Animated.Value(0.3)).current;

  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  const phoneFormOpacity = useRef(new Animated.Value(1)).current;
  const otpFormOpacity = useRef(new Animated.Value(0)).current;

  const customerScale = useRef(new Animated.Value(1)).current;
  const driverScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 700, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      ]),
      Animated.timing(roleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.9, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(shimmerAnim, { toValue: -1, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'customer') router.replace('/customer/home' as any);
      else if (user.role === 'driver') router.replace('/driver/dashboard' as any);
    }
  }, [authLoading, isAuthenticated, user]);

  function crossfadeToOtp() {
    Animated.timing(phoneFormOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setOtpSent(true);
      otpFormOpacity.setValue(0);
      requestAnimationFrame(() => {
        Animated.timing(otpFormOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    });
  }

  function crossfadeToPhone() {
    Animated.timing(otpFormOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setOtpSent(false);
      setOtp('');
      phoneFormOpacity.setValue(0);
      requestAnimationFrame(() => {
        Animated.timing(phoneFormOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    });
  }

  function animateRolePress(scale: Animated.Value) {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 150, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
    ]).start();
  }

  async function handleSendOtp() {
    if (phone.length < 10) {
      Alert.alert('Error', 'Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    const result = await sendOtp(phone);
    setLoading(false);
    if (result.success) {
      setSentOtpValue(result.otp || '');
      crossfadeToOtp();
    } else {
      Alert.alert('Error', result.error || 'Failed to send OTP');
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 4) {
      Alert.alert('Error', 'Enter the 4-digit OTP');
      return;
    }
    setLoading(true);
    const result = await verifyOtp(phone, otp, selectedRole);
    setLoading(false);
    if (result.success) {
      if (result.isNew) {
        router.replace({ pathname: '/register' as any, params: { phone, role: selectedRole } });
      } else if (selectedRole === 'customer') {
        router.replace('/customer/home' as any);
      } else {
        router.replace('/driver/dashboard' as any);
      }
    } else {
      Alert.alert('Error', result.error || 'Invalid OTP');
    }
  }

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const webTop = Platform.OS === 'web' ? 67 : 0;

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, SCREEN_WIDTH + 200],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy, Colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
      />

      {particles.map((p) => (
        <FloatingParticle key={p.id} delay={p.delay} size={p.size} startX={p.startX} startY={p.startY} />
      ))}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + webTop + 50, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ translateY: logoSlide }] }]}>
            <View style={styles.logoGlowWrap}>
              <Animated.View style={[styles.glowRing, { opacity: glowPulse }]} />
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="truck-fast" size={40} color={Colors.surface} />
              </View>
            </View>
            <Text style={styles.title}>TransportGo</Text>
            <Text style={styles.subtitle}>Fast & reliable goods delivery</Text>
          </Animated.View>

          <Animated.View style={[styles.roleSelector, { opacity: roleOpacity }]}>
            <Animated.View style={{ flex: 1, transform: [{ scale: customerScale }] }}>
              <TouchableOpacity
                style={[styles.roleBtn, selectedRole === 'customer' && styles.roleBtnActive]}
                onPress={() => { setSelectedRole('customer'); animateRolePress(customerScale); }}
                activeOpacity={0.8}
              >
                <Ionicons name="cube-outline" size={20} color={selectedRole === 'customer' ? Colors.surface : Colors.textTertiary} />
                <Text style={[styles.roleText, selectedRole === 'customer' && styles.roleTextActive]}>Customer</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={{ flex: 1, transform: [{ scale: driverScale }] }}>
              <TouchableOpacity
                style={[styles.roleBtn, selectedRole === 'driver' && styles.roleBtnActive]}
                onPress={() => { setSelectedRole('driver'); animateRolePress(driverScale); }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="steering" size={20} color={selectedRole === 'driver' ? Colors.surface : Colors.textSecondary} />
                <Text style={[styles.roleText, selectedRole === 'driver' && styles.roleTextActive]}>Driver</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formSlide }] }]}>
            {!otpSent ? (
              <Animated.View style={{ opacity: phoneFormOpacity }}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    testID="phone-input"
                  />
                </View>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleSendOtp}
                  disabled={loading}
                  testID="send-otp-btn"
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.btnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.surface} />
                    ) : (
                      <Text style={styles.primaryBtnText}>Get OTP</Text>
                    )}
                    <Animated.View
                      style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslateX }] }]}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.18)', 'transparent']}
                        style={styles.shimmerGradient}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                      />
                    </Animated.View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: otpFormOpacity }}>
                <View style={styles.otpHeader}>
                  <TouchableOpacity onPress={crossfadeToPhone}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.otpTitle}>Verify OTP</Text>
                </View>
                <Text style={styles.otpSentText}>OTP sent to +91 {phone}</Text>
                {sentOtpValue ? <Text style={styles.devOtp}>Dev OTP: {sentOtpValue}</Text> : null}
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter 4-digit OTP"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={setOtp}
                  textAlign="center"
                  testID="otp-input"
                />
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  testID="verify-otp-btn"
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.btnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.surface} />
                    ) : (
                      <Text style={styles.primaryBtnText}>Verify & Login</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resendBtn} onPress={handleSendOtp}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navyDark },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 44 },
  logoGlowWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  glowRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    ...(Platform.OS === 'web' ? { boxShadow: `0 0 30px ${Colors.primaryGlow}, 0 0 60px ${Colors.primaryGlow}` } as any : {}),
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: Colors.surface,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
  roleSelector: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  roleText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary },
  roleTextActive: { color: Colors.surface },
  formCard: {
    backgroundColor: Colors.glass,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any : {}),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  countryCode: {
    width: 60,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.shimmer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  countryText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.surface },
  phoneInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.shimmer,
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.surface },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
  },
  shimmerGradient: {
    flex: 1,
  },
  otpHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  otpTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.surface },
  otpSentText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  devOtp: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
    backgroundColor: 'rgba(0,201,167,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
    overflow: 'hidden',
  },
  otpInput: {
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.shimmer,
    paddingHorizontal: 16,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
    marginBottom: 20,
    letterSpacing: 12,
  },
  resendBtn: { alignItems: 'center', marginTop: 16 },
  resendText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.teal },
});
