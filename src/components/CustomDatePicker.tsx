import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

interface CustomDatePickerProps {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

export function CustomDatePicker({
  visible,
  date,
  onConfirm,
  onCancel,
  maximumDate,
  minimumDate,
}: CustomDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(date);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYearChange = (year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    if (selectedDate.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }
    setSelectedDate(newDate);
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month - 1);
    const maxDay = new Date(newDate.getFullYear(), month, 0).getDate();
    if (selectedDate.getDate() > maxDay) {
      newDate.setDate(maxDay);
    }
    setSelectedDate(newDate);
  };

  const handleDayChange = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    if (maximumDate && selectedDate > maximumDate) {
      onConfirm(maximumDate);
    } else if (minimumDate && selectedDate < minimumDate) {
      onConfirm(minimumDate);
    } else {
      onConfirm(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Select Date</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <ScrollView style={styles.pickerColumn}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.pickerItem,
                    selectedDate.getDate() === day && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleDayChange(day)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.getDate() === day && styles.pickerItemTextSelected,
                    ]}
                  >
                    {day.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.pickerColumn}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.pickerItem,
                    selectedDate.getMonth() + 1 === month && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleMonthChange(month)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.getMonth() + 1 === month && styles.pickerItemTextSelected,
                    ]}
                  >
                    {new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.pickerColumn}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    selectedDate.getFullYear() === year && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleYearChange(year)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.getFullYear() === year && styles.pickerItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5B4E77',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#8B7FA8',
    fontSize: 16,
  },
  confirmButton: {
    padding: 8,
  },
  confirmButtonText: {
    color: '#FF6B9D',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 200,
    paddingHorizontal: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: '#FFF5F8',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#8B7FA8',
  },
  pickerItemTextSelected: {
    color: '#FF6B9D',
    fontWeight: '600',
  },
});
