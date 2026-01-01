import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface ProfileRequiredModalProps {
  visible: boolean;
  onDismiss?: () => void;
}

export function ProfileRequiredModal({ visible, onDismiss }: ProfileRequiredModalProps) {
  const navigation = useNavigation<any>();

  const handleGoToProfile = () => {
    if (onDismiss) onDismiss();
    navigation.navigate('Profile');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>👶</Text>
          </View>
          
          <Text style={styles.title}>Profile Required</Text>
          <Text style={styles.message}>
            Please set up your baby's profile first to start tracking sleep patterns and get personalized recommendations.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✨</Text>
              <Text style={styles.featureText}>Track sleep patterns</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Get smart schedules</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💡</Text>
              <Text style={styles.featureText}>Receive coach tips</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGoToProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Set Up Profile</Text>
          </TouchableOpacity>

          {onDismiss && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(91, 78, 119, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#5B4E77',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8B7FA8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 15,
    color: '#5B4E77',
    fontWeight: '600',
    flex: 1,
  },
  button: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#A99DBF',
    fontSize: 15,
    fontWeight: '600',
  },
});
