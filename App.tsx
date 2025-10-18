import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Alert } from 'react-native';
import { Employee, Company, TimeEntry } from './src/types';
import { StorageService } from './src/services/StorageService';
import { SetupScreen } from './src/components/SetupScreen';
import { ClockInScreen } from './src/components/ClockInScreen';

export default function App() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedEmployee, storedCompany] = await Promise.all([
        StorageService.getEmployee(),
        StorageService.getCompany(),
      ]);

      if (storedEmployee && storedCompany) {
        setEmployee(storedEmployee);
        setCompany(storedCompany);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
      Alert.alert('Error', 'Failed to load stored data. Please restart the app.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = (newEmployee: Employee, newCompany: Company) => {
    setEmployee(newEmployee);
    setCompany(newCompany);
  };

  const handleTimeEntry = (timeEntry: TimeEntry) => {
    // Handle time entry (could be used for analytics, notifications, etc.)
    console.log('Time entry recorded:', timeEntry);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!employee || !company) {
    return (
      <View style={styles.container}>
        <SetupScreen onSetupComplete={handleSetupComplete} />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ClockInScreen
        employee={employee}
        company={company}
        onTimeEntry={handleTimeEntry}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
