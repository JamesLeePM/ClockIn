import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Employee, Company, TimeEntry } from '../types';
import { TimeTrackingService } from '../services/TimeTrackingService';
import { LocationService } from '../services/LocationService';
import { NFCScanner } from './NFCScanner';

interface ClockInScreenProps {
  employee: Employee;
  company: Company;
  onTimeEntry: (entry: TimeEntry) => void;
}

export const ClockInScreen: React.FC<ClockInScreenProps> = ({
  employee,
  company,
  onTimeEntry,
}) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<TimeEntry | null>(null);
  const [totalHoursToday, setTotalHoursToday] = useState(0);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [showNFCScanner, setShowNFCScanner] = useState(false);

  const timeTrackingService = TimeTrackingService.getInstance();
  const locationService = LocationService.getInstance();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Check if currently checked in
      const checkedIn = await timeTrackingService.isCurrentlyCheckedIn(employee.id);
      setIsCheckedIn(checkedIn);

      // Get last check in
      const lastCheckInEntry = await timeTrackingService.getLastCheckIn(employee.id);
      setLastCheckIn(lastCheckInEntry);

      // Get total hours today
      const hours = await timeTrackingService.getTotalHoursToday(employee.id);
      setTotalHoursToday(hours);

      // Check location status
      if (company.settings.requireLocation) {
        const hasPermission = locationService.isLocationEnabled();
        setLocationStatus(hasPermission ? 'Location enabled' : 'Location required');
      } else {
        setLocationStatus('Location not required');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsLoading(true);
      
      const result = await timeTrackingService.checkIn(employee, company);
      
      if (result.success && result.timeEntry) {
        setIsCheckedIn(true);
        setLastCheckIn(result.timeEntry);
        onTimeEntry(result.timeEntry);
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsLoading(true);
      
      const result = await timeTrackingService.checkOut(employee, company);
      
      if (result.success && result.timeEntry) {
        setIsCheckedIn(false);
        onTimeEntry(result.timeEntry);
        Alert.alert('Success', result.message);
        
        // Refresh total hours
        const hours = await timeTrackingService.getTotalHoursToday(employee.id);
        setTotalHoursToday(hours);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error checking out:', error);
      Alert.alert('Error', 'Failed to check out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (showNFCScanner) {
    return (
      <NFCScanner
        employee={employee}
        company={company}
        onTimeEntry={onTimeEntry}
        onClose={() => setShowNFCScanner(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>{company.name}</Text>
        <Text style={styles.employeeName}>{employee.name}</Text>
        <Text style={styles.employeeId}>ID: {employee.employeeId}</Text>
      </View>

      {/* Current Date */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{formatDate(new Date())}</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View style={[styles.statusBadge, isCheckedIn ? styles.checkedInBadge : styles.checkedOutBadge]}>
            <Text style={[styles.statusText, isCheckedIn ? styles.checkedInText : styles.checkedOutText]}>
              {isCheckedIn ? 'CHECKED IN' : 'CHECKED OUT'}
            </Text>
          </View>
        </View>

        {lastCheckIn && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Check In:</Text>
            <Text style={styles.statusValue}>{formatTime(new Date(lastCheckIn.timestamp))}</Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Hours Today:</Text>
          <Text style={styles.statusValue}>{totalHoursToday.toFixed(1)}h</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Location:</Text>
          <Text style={styles.statusValue}>{locationStatus}</Text>
        </View>
      </View>

      {/* Main Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isCheckedIn ? styles.checkOutButton : styles.checkInButton,
          ]}
          onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
          disabled={isLoading}
        >
          <Text style={styles.actionButtonText}>
            {isCheckedIn ? 'CHECK OUT' : 'CHECK IN'}
          </Text>
        </TouchableOpacity>
        
        {/* NFC Scanner Button */}
        <TouchableOpacity
          style={styles.nfcButton}
          onPress={() => setShowNFCScanner(true)}
        >
          <Text style={styles.nfcButtonText}>📱 NFC Check-in</Text>
        </TouchableOpacity>
      </View>

      {/* Info Text */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {company.settings.requireLocation 
            ? 'Location verification is required for check-in/out'
            : 'Location verification is not required'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 18,
    color: '#495057',
    marginBottom: 2,
  },
  employeeId: {
    fontSize: 14,
    color: '#6c757d',
  },
  dateContainer: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dateText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  checkedInBadge: {
    backgroundColor: '#d4edda',
  },
  checkedOutBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  checkedInText: {
    color: '#155724',
  },
  checkedOutText: {
    color: '#721c24',
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  actionButton: {
    width: '100%',
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  checkInButton: {
    backgroundColor: '#28a745',
  },
  checkOutButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  nfcButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nfcButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});
