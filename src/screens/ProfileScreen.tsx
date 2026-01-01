import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import { BabyProfile } from '../types';
import { formatDateDDMMYYYY } from '../utils/dateFormat';
import { CustomDatePicker } from '../components/CustomDatePicker';

export function ProfileScreen() {
  const { babyProfile, setBabyProfile, resetData } = useStore();
  const [name, setName] = useState(babyProfile?.name || '');
  const [birthDate, setBirthDate] = useState<Date>(
    babyProfile?.birthDateISO ? new Date(babyProfile.birthDateISO) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateDisplay, setDateDisplay] = useState(
    babyProfile?.birthDateISO ? formatDateDDMMYYYY(babyProfile.birthDateISO) : ''
  );

  useEffect(() => {
    if (babyProfile?.birthDateISO) {
      setDateDisplay(formatDateDDMMYYYY(babyProfile.birthDateISO));
      setBirthDate(new Date(babyProfile.birthDateISO));
    }
  }, [babyProfile]);

  const handleConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setBirthDate(selectedDate);
    setDateDisplay(formatDateDDMMYYYY(selectedDate.toISOString()));
  };

  const handleCancel = () => {
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!dateDisplay || !birthDate || isNaN(birthDate.getTime())) {
      Alert.alert('Error', 'Please select a valid birth date');
      return;
    }

    try {
      const birthDateISO = birthDate.toISOString();
      const profile: BabyProfile = {
        id: babyProfile?.id || uuidv4(),
        name: name.trim(),
        birthDateISO,
      };

      await setBabyProfile(profile);
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error: any) {
      console.error('Save profile error:', error);
      const errorMessage = error?.message || 'Failed to save profile. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Data',
      'Are you sure you want to reset all data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetData();
              setName('');
              setBirthDate(new Date());
              setDateDisplay('');
              Alert.alert('Success', 'Data reset successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Baby Profile</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter baby's name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Birth Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateButtonText, !dateDisplay && styles.placeholder]}>
            {dateDisplay || 'DD-MM-YYYY'}
          </Text>
        </TouchableOpacity>
      </View>

      <CustomDatePicker
        visible={showDatePicker}
        date={birthDate}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        maximumDate={new Date()}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset All Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF5F8',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#5B4E77',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#5B4E77',
  },
  input: {
    borderWidth: 1,
    borderColor: '#F0E6F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#5B4E77',
    backgroundColor: '#FFFFFF',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#F0E6F0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#5B4E77',
  },
  placeholder: {
    color: '#A99DBF',
  },
  saveButton: {
    backgroundColor: '#B4F8C8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#5B4E77',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    backgroundColor: '#FFB3BA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    color: '#5B4E77',
    fontSize: 16,
    fontWeight: '700',
  },
});