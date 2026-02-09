import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

function AnimatedInput({ style, onFocus, onBlur, ...props }: any) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback((e: any) => {
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    onBlur?.(e);
  }, [onBlur]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  return (
    <Animated.View style={{ borderWidth: 1, borderColor, borderRadius: 12 }}>
      <TextInput style={[style, { borderWidth: 0 }]} onFocus={handleFocus} onBlur={handleBlur} {...props} />
    </Animated.View>
  );
}

function VehicleCard({ vehicle, isActive, onPress }: { vehicle: { type: string; label: string; icon: any }; isActive: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
    ]).start();
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.vehicleBtn, isActive && styles.vehicleBtnActive]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name={vehicle.icon} size={24} color={isActive ? Colors.primary : Colors.textSecondary} />
        <Text style={[styles.vehicleLabel, isActive && styles.vehicleLabelActive]}>{vehicle.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone: string; role: string }>();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState('auto');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const isDriver = params.role === 'driver';

  const headerSlide = useRef(new Animated.Value(-60)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(80)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const vehicleFade = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(formSlide, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 6 }),
        Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handleVehicleChange = useCallback((type: string) => {
    Animated.sequence([
      Animated.timing(vehicleFade, { toValue: 0.5, duration: 100, useNativeDriver: true }),
      Animated.timing(vehicleFade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setVehicleType(type);
  }, []);

  async function handleRegister() {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    if (isDriver && !vehicleNumber.trim()) { Alert.alert('Error', 'Vehicle number is required'); return; }
    setLoading(true);
    const result = await register({
      phone: params.phone || '',
      name: name.trim(),
      role: params.role || 'customer',
      ...(isDriver && { vehicleType, vehicleNumber: vehicleNumber.trim(), licenseNumber: licenseNumber.trim() }),
    });
    setLoading(false);
    if (result.success) {
      if (isDriver) router.replace('/driver/dashboard' as any);
      else router.replace('/customer/home' as any);
    } else {
      Alert.alert('Error', result.error || 'Registration failed');
    }
  }

  const webTop = Platform.OS === 'web' ? 67 : 0;
  const vehicles = [
    { type: 'auto', label: 'Auto', icon: 'rickshaw' as const },
    { type: 'tempo', label: 'Tempo', icon: 'van-utility' as const },
    { type: 'truck', label: 'Truck', icon: 'truck' as const },
  ];

  const glowShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <LinearGradient colors={[Colors.navyDark, Colors.navy, Colors.gradientEnd]} style={styles.gradient}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + webTop + 20, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.header, { transform: [{ translateX: headerSlide }], opacity: headerOpacity }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.surface} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Complete Profile</Text>
            <Text style={styles.headerSubtitle}>{isDriver ? 'Set up your driver account' : 'Tell us about yourself'}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.formCard, { transform: [{ translateY: formSlide }], opacity: formOpacity }]}>
          <Text style={styles.label}>Full Name</Text>
          <AnimatedInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            testID="name-input"
          />

          {isDriver && (
            <Animated.View style={{ opacity: vehicleFade }}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.vehicleRow}>
                {vehicles.map(v => (
                  <VehicleCard
                    key={v.type}
                    vehicle={v}
                    isActive={vehicleType === v.type}
                    onPress={() => handleVehicleChange(v.type)}
                  />
                ))}
              </View>

              <Text style={styles.label}>Vehicle Number</Text>
              <AnimatedInput
                style={styles.input}
                placeholder="e.g. MP09AB1234"
                placeholderTextColor={Colors.textTertiary}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
                testID="vehicle-input"
              />

              <Text style={styles.label}>License Number (Optional)</Text>
              <AnimatedInput
                style={styles.input}
                placeholder="e.g. MH0120190001234"
                placeholderTextColor={Colors.textTertiary}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
              />
            </Animated.View>
          )}

          <Animated.View style={[styles.registerBtnWrapper, { shadowOpacity: glowShadowOpacity }]}>
            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading} testID="register-btn" activeOpacity={0.85}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.registerBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <>
                    <Text style={styles.registerBtnText}>Complete Registration</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.surface} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.surface },
  headerSubtitle: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  formCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 8, marginTop: 16 },
  input: { height: 52, borderRadius: 12, backgroundColor: Colors.background, paddingHorizontal: 16, fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.text },
  vehicleRow: { flexDirection: 'row', gap: 10 },
  vehicleBtn: { alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
  vehicleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  vehicleLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  vehicleLabelActive: { color: Colors.primary },
  registerBtnWrapper: {
    marginTop: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  registerBtn: { borderRadius: 14, overflow: 'hidden' },
  registerBtnGradient: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
  registerBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.surface },
});
