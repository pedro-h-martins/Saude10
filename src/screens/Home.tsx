import { Card } from '@/components/Card';
import { ProgressCircle } from '@/components/ProgressCircle';
import { Colors } from '@/constants/Colors';
import { useQuery } from '@/context/RealmProvider';
import { UserProfile } from '@/models/UserProfile';
import { calculateBMI } from '@/utils/health';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DashboardHeader = () => (
  <View style={styles.header}>
    <View style={styles.userSection}>
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person" size={20} color={Colors.white} />
      </View>
      <Text style={styles.headerTitle}>SaudeIO</Text>
    </View>
    <TouchableOpacity style={styles.notificationBtn}>
      <View style={styles.notificationDot} />
      <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
    </TouchableOpacity>
  </View>
);

const ActivityCard = () => (
  <LinearGradient
    colors={[Colors.primary, Colors.primaryLight]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.activityCard}
  >
    <View style={styles.activityHeader}>
      <Text style={styles.activityLabel}>ATIVIDADE HOJE</Text>
      <View style={styles.lightningIcon}>
        <Ionicons name="flash" size={16} color={Colors.white} />
      </View>
    </View>
    
    <Text style={styles.stepsCount}>8,432</Text>
    <Text style={styles.stepsLabel}>Passos concluidos hoje</Text>

    <View style={styles.activityStats}>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>DISTÂNCIA PERCORRIDA</Text>
        <Text style={styles.statValue}>6.2 km</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>STATUS</Text>
        <View style={styles.statusRow}>
            <View style={styles.greenDot} />
            <Text style={styles.statValue}>ATIVO</Text>
        </View>
      </View>
    </View>
  </LinearGradient>
);

export function Home() {
  const users = useQuery(UserProfile);
  const user = users[0];

  const bmiData = useMemo(() => {
    return user ? calculateBMI(user.weight, user.height) : null;
  }, [user]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <DashboardHeader />
        <ActivityCard />
        
        <Card style={styles.bpCard}>
            <View style={styles.bpHeader}>
                <View style={styles.bpIconContainer}>
                    <MaterialIcons name="grid-on" size={20} color="#8E6E53" />
                </View>
                <View style={styles.bpTitleSection}>
                    <Text style={styles.cardTitle}>Pressão arterial</Text>
                    <Text style={styles.cardSubtitle}>ULTIMA VEZ: 28 JUN 2025</Text>
                </View>
            </View>
            <View style={styles.bpValueRow}>
                <Text style={styles.bpValueLarge}>118</Text>
                <Text style={styles.bpDivider}>/</Text>
                <Text style={styles.bpValueSmall}>79</Text>
                <Text style={styles.bpUnit}>MMHG</Text>
            </View>
            
            <View style={styles.barChartPlaceholder}>
                {[1, 0.6, 0.8, 1, 1.2, 1.5, 0.7].map((h, i) => (
                    <View key={i} style={[styles.bar, { 
                        height: 20 * h, 
                        backgroundColor: i === 4 ? Colors.primary : '#EAEAEA',
                        width: 8,
                        borderRadius: 4
                    }]} />
                ))}
            </View>
        </Card>
        
        <View style={styles.gridRow}>
            <Card style={styles.halfCard}>
                <Text style={styles.gridCardTitle}>FOCO</Text>
                <ProgressCircle size={70} strokeWidth={6} progress={0.6}>
                    <Text style={styles.timerText}>18:45</Text>
                </ProgressCircle>
            </Card>
            <Card style={styles.halfCard}>
                <Text style={styles.gridCardTitle}>IMC</Text>
                {bmiData ? (
                  <View style={styles.imcContent}>
                    <Text style={[styles.imcValue, { color: bmiData.color }]}>
                      {bmiData.value.toFixed(1)}
                    </Text>
                    <View style={[styles.imcBadge, { backgroundColor: bmiData.color + '20' }]}>
                      <Text style={[styles.imcBadgeText, { color: bmiData.color }]}>
                        {bmiData.isIdeal ? 'IDEAL' : bmiData.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.timerText}>N/A</Text>
                )}
            </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#002244',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 13,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
    borderWidth: 1.5,
    borderColor: Colors.white,
    zIndex: 1,
  },
  activityCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lightningIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCount: {
    color: Colors.white,
    fontSize: 42,
    fontWeight: '800',
  },
  stepsLabel: {
    color: Colors.white,
    fontSize: 15,
    opacity: 0.9,
    marginBottom: 25,
  },
  activityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 18,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
  },
  statValue: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4FF088',
  },
  bpCard: {
    marginBottom: 20,
    padding: 24,
  },
  bpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  bpIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bpTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#002244',
  },
  cardSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 2,
  },
  bpValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  bpValueLarge: {
    fontSize: 48,
    fontWeight: '800',
    color: '#002244',
  },
  bpDivider: {
    fontSize: 28,
    color: '#E2E8F0',
    marginHorizontal: 8,
    fontWeight: '300',
  },
  bpValueSmall: {
    fontSize: 32,
    fontWeight: '700',
    color: '#64748B',
  },
  bpUnit: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginLeft: 10,
  },
  barChartPlaceholder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 30,
    gap: 6,
  },
  bar: {
    backgroundColor: '#EAEAEA',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 15,
  },
  halfCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002244',
  },
  imcContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  imcValue: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  imcBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imcBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
