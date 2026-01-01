import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Profile: undefined;
  NotificationLog: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileButton() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.button}>
      <Text style={styles.buttonText}>Profile</Text>
    </TouchableOpacity>
  );
}

export function NotificationLogButton() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('NotificationLog')}
      style={styles.button}
    >
      <Text style={styles.buttonText}>Notifications</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 16,
    padding: 8,
  },
  buttonText: {
    color: '#FF6B9D',
    fontSize: 16,
    fontWeight: '600',
  },
});
