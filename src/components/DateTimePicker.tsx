import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

interface DateTimePickerProps {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
}

export function DateTimePicker({
  visible,
  date,
  onConfirm,
  onCancel,
  maximumDate,
  minimumDate,
  mode = 'datetime',
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState(date);

  useEffect(() => {
    if (visible) {
      setSelectedDate(date);
    }
  }, [date, visible]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleYearChange = (year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    const maxDay = new Date(year, selectedDate.getMonth() + 1, 0).getDate();
    if (selectedDate.getDate() > maxDay) {
      newDate.setDate(maxDay);
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

  const handleHourChange = (hour: number) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hour);
    setSelectedDate(newDate);
  };

  const handleMinuteChange = (minute: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMinutes(minute);
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    let finalDate = selectedDate;
    if (maximumDate && selectedDate > maximumDate) {
      finalDate = maximumDate;
    } else if (minimumDate && selectedDate < minimumDate) {
      finalDate = minimumDate;
    }
    onConfirm(finalDate);
  };

  const renderPickerColumn = (
    items: number[],
    selectedValue: number,
    onSelect: (value: number) => void,
    formatter?: (value: number) => string
  ) => {
    return (
      <ScrollView
        style={styles.pickerColumn}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pickerContent}
      >
        <View style={{ height: 90 }} />
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.pickerItem,
              selectedValue === item && styles.pickerItemSelected,
            ]}
            onPress={() => onSelect(item)}
          >
            <Text
              style={[
                styles.pickerItemText,
                selectedValue === item && styles.pickerItemTextSelected,
              ]}
            >
              {formatter ? formatter(item) : item.toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 90 }} />
      </ScrollView>
    );
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
            <Text style={styles.title}>
              {mode === 'date' ? 'Select Date' : mode === 'time' ? 'Select Time' : 'Select Date & Time'}
            </Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            {(mode === 'date' || mode === 'datetime') && (
              <>
                {renderPickerColumn(days, selectedDate.getDate(), handleDayChange)}
                {renderPickerColumn(
                  months,
                  selectedDate.getMonth() + 1,
                  handleMonthChange,
                  (m) => new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'short' })
                )}
                {renderPickerColumn(years, selectedDate.getFullYear(), handleYearChange)}
              </>
            )}
            {(mode === 'time' || mode === 'datetime') && (
              <>
                {renderPickerColumn(hours, selectedDate.getHours(), handleHourChange)}
                {renderPickerColumn(minutes, selectedDate.getMinutes(), handleMinuteChange)}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(91, 78, 119, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5B4E77',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#8B7FA8',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    padding: 8,
  },
  confirmButtonText: {
    color: '#FF6B9D',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 250,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerContent: {
    alignItems: 'center',
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: '#FFF5F8',
  },
  pickerItemText: {
    fontSize: 18,
    color: '#A99DBF',
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#FF6B9D',
    fontWeight: '700',
    fontSize: 20,
  },
});
