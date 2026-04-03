import React from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import type { DeliveryStop } from './types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  stop: DeliveryStop;
  isOpen: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onProblemPress: () => void;
};

export default function DeliveryCard({
  stop,
  isOpen,
  onToggle,
  onComplete,
  onProblemPress,
}: Props) {
  const isCompleted = stop.status === 'completed';

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <Pressable
      onPress={handleToggle}
      style={[styles.card, isCompleted && styles.completedCard]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.statusCircle,
            isCompleted && styles.completedCircle,
          ]}
        />
        <View style={styles.textBlock}>
          <Text style={styles.stopText}>Stop {stop.stopNumber}</Text>
          <Text style={styles.addressText}>{stop.address}</Text>
        </View>
      </View>

      {isOpen && (
        <View style={styles.expandedSection}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{stop.customerName}</Text>

          <Text style={styles.label}>Packages</Text>
          <Text style={styles.value}>{stop.packageCount}</Text>

          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>
            {stop.notes.trim() ? stop.notes : 'No delivery notes'}
          </Text>

          {isCompleted && stop.completedAt ? (
            <Text style={styles.completedAtText}>
              Completed at: {stop.completedAt}
            </Text>
          ) : null}

          {!isCompleted && (
            <View style={styles.buttonRow}>
              <Pressable style={styles.secondaryButton} onPress={onProblemPress}>
                <Text style={styles.secondaryButtonText}>Problem</Text>
              </Pressable>

              <Pressable style={styles.primaryButton} onPress={onComplete}>
                <Text style={styles.primaryButtonText}>Complete</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  completedCard: {
    backgroundColor: '#d1d5db',
    opacity: 0.9,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9ca3af',
    backgroundColor: '#ffffff',
    marginTop: 3,
    marginRight: 12,
  },
  completedCircle: {
    backgroundColor: '#6b7280',
    borderColor: '#6b7280',
  },
  textBlock: {
    flex: 1,
  },
  stopText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    color: '#374151',
  },
  expandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: '#111827',
  },
  completedAtText: {
    marginTop: 12,
    fontSize: 13,
    color: '#4b5563',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fee2e2',
  },
  secondaryButtonText: {
    fontWeight: '700',
    color: '#991b1b',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  primaryButtonText: {
    fontWeight: '700',
    color: '#ffffff',
  },
});