import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, Animated, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useBookings } from '@/contexts/BookingContext';

const feedbackTags = ['Polite Driver', 'Safe Drive', 'On Time', 'Good Handling', 'Clean Vehicle', 'Careful with Goods'];

const SPARKLE_COUNT = 5;
const SPARKLE_POSITIONS = [
  { x: -30, y: -25 },
  { x: 28, y: -30 },
  { x: 35, y: 15 },
  { x: -35, y: 20 },
  { x: 5, y: -40 },
];

function SparkleDotsGroup() {
  const anims = useRef(SPARKLE_POSITIONS.map(() => ({
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.sequence([
        Animated.delay(400 + i * 120),
        Animated.parallel([
          Animated.spring(a.scale, { toValue: 1, friction: 4, useNativeDriver: true }),
          Animated.timing(a.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(a.scale, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(a.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ])
    );
    Animated.stagger(80, animations).start();
  }, []);

  return (
    <>
      {SPARKLE_POSITIONS.map((pos, i) => (
        <Animated.View
          key={i}
          style={[
            styles.sparkleDot,
            {
              left: 36 + pos.x,
              top: 36 + pos.y,
              transform: [{ scale: anims[i].scale }],
              opacity: anims[i].opacity,
            },
          ]}
        />
      ))}
    </>
  );
}

function CheckCircle() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.checkCircleWrap, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={40} color={Colors.surface} />
      </View>
      <SparkleDotsGroup />
    </Animated.View>
  );
}

function StarButton({ index, rating, onPress }: { index: number; rating: number; onPress: (n: number) => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const selected = index <= rating;
  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, friction: 3, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress(index);
  }
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={handlePress}>
        <View style={selected ? styles.starGlow : undefined}>
          <Ionicons name={selected ? 'star' : 'star-outline'} size={44} color={selected ? '#F59E0B' : Colors.border} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function FeedbackTag({ tag, selected, onPress }: { tag: string; selected: boolean; onPress: () => void }) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  function handlePress() {
    Animated.sequence([
      Animated.spring(bounceAnim, { toValue: 1.15, friction: 3, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  }
  return (
    <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
      <TouchableOpacity style={[styles.tag, selected && styles.tagActive]} onPress={handlePress}>
        <Text style={[styles.tagText, selected && styles.tagTextActive]}>{tag}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StaggeredSection({ children, delay }: { children: React.ReactNode; delay: number }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}>
      {children}
    </Animated.View>
  );
}

export default function RateRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const { getBookingById, rateBooking } = useBookings();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const booking = getBookingById(params.bookingId || '');

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function handleSubmit() {
    if (rating === 0) { Alert.alert('Rating', 'Please select a rating'); return; }
    if (!params.bookingId) return;
    setLoading(true);
    const fullComment = [...selectedTags, comment.trim()].filter(Boolean).join('. ');
    const result = await rateBooking(params.bookingId, rating, fullComment || undefined);
    setLoading(false);
    if (result.success) {
      Alert.alert('Thank you', 'Your rating has been submitted');
      router.replace('/customer/home' as any);
    } else {
      Alert.alert('Error', result.error || 'Failed to submit rating');
    }
  }

  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + webTop }]} contentContainerStyle={{ paddingBottom: insets.bottom + webBottom + 20 }} keyboardShouldPersistTaps="handled">
      <StaggeredSection delay={0}>
        <LinearGradient
          colors={[Colors.success, '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.successHeader}
        >
          <CheckCircle />
          <Text style={styles.successTitle}>Trip Completed</Text>
          {booking && <Text style={styles.successAmount}>₹{booking.totalPrice}</Text>}
        </LinearGradient>
      </StaggeredSection>

      {booking && (
        <StaggeredSection delay={100}>
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
              <Text style={styles.routeText}>{booking.pickup.name}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.routeText}>{booking.delivery.name}</Text>
            </View>
            <View style={styles.tripMeta}>
              <Text style={styles.metaText}>{booking.distance} km</Text>
              <Text style={styles.metaText}>{booking.estimatedTime} min</Text>
              <Text style={styles.metaText}>{booking.vehicleType}</Text>
            </View>
          </View>
        </StaggeredSection>
      )}

      <StaggeredSection delay={200}>
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>Rate your experience</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <StarButton key={i} index={i} rating={rating} onPress={setRating} />
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 0 ? 'Tap to rate' : rating <= 2 ? 'Could be better' : rating <= 4 ? 'Good experience' : 'Excellent'}
          </Text>
        </View>
      </StaggeredSection>

      <StaggeredSection delay={300}>
        <View style={styles.tagsSection}>
          <Text style={styles.tagsTitle}>Quick Feedback</Text>
          <View style={styles.tagsWrap}>
            {feedbackTags.map(tag => (
              <FeedbackTag
                key={tag}
                tag={tag}
                selected={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>
        </View>
      </StaggeredSection>

      <StaggeredSection delay={400}>
        <View style={styles.commentSection}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment (optional)"
            placeholderTextColor={Colors.textTertiary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />
        </View>
      </StaggeredSection>

      <StaggeredSection delay={500}>
        <View style={styles.btnSection}>
          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              {loading ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.submitText}>Submit Rating</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/customer/home' as any)}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </StaggeredSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  successHeader: { alignItems: 'center', paddingVertical: 32 },
  checkCircleWrap: { width: 72, height: 72, marginBottom: 12, position: 'relative' },
  checkCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  sparkleDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.surface },
  successAmount: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.surface, marginTop: 4 },
  routeCard: { marginHorizontal: 16, marginTop: -20, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 1, height: 16, backgroundColor: Colors.border, marginLeft: 3 },
  routeText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  tripMeta: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  metaText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, textTransform: 'capitalize' },
  ratingSection: { alignItems: 'center', paddingVertical: 28 },
  ratingTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  starGlow: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 4 },
  ratingLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  tagsSection: { paddingHorizontal: 16, marginBottom: 20 },
  tagsTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 10 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  tagActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  tagText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  tagTextActive: { color: Colors.primary },
  commentSection: { paddingHorizontal: 16, marginBottom: 24 },
  commentInput: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text, borderWidth: 1, borderColor: Colors.border, minHeight: 80, textAlignVertical: 'top' },
  btnSection: { paddingHorizontal: 16 },
  submitBtn: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  submitText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.surface },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
});
