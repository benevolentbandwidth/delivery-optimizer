import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import DeliveryCard from '../../src/features/deliveries/DeliveryCard';
import type { DeliveryStop } from '../../src/features/deliveries/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// TEMP DATA
const initialStops: DeliveryStop[] = [
  {
    id: '1',
    stopNumber: 1,
    address: '123 Main St',
    customerName: 'John Doe',
    packageCount: 2,
    notes: 'Leave at door',
    status: 'pending',
  },
  {
    id: '2',
    stopNumber: 2,
    address: '456 Oak Ave',
    customerName: 'Jane Smith',
    packageCount: 1,
    notes: '',
    status: 'pending',
  },
];

export default function HomeScreen() {
  const [stops, setStops] = useState<DeliveryStop[]>(initialStops);
  const [openId, setOpenId] = useState<string | null>(null);

  const sortedStops = useMemo(() => {
    const pending = stops.filter((s) => s.status === 'pending');
    const completed = stops.filter((s) => s.status === 'completed');
    return [...pending, ...completed];
  }, [stops]);

  const handleToggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((current) => (current === id ? null : id));
  };

  const handleComplete = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setStops((current) =>
      current.map((stop) =>
        stop.id === id
          ? {
              ...stop,
              status: 'completed',
              completedAt: new Date().toISOString(),
            }
          : stop
      )
    );

    setOpenId(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Driver Assist</Text>

        {sortedStops.map((stop) => (
          <DeliveryCard
            key={stop.id}
            stop={stop}
            isOpen={openId === stop.id}
            onToggle={() => handleToggle(stop.id)}
            onComplete={() => handleComplete(stop.id)}
            onProblemPress={() => {}}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
});