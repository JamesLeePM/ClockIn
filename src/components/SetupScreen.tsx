import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Employee, Company } from '../types';
import { StorageService } from '../services/StorageService';

interface SetupScreenProps {
  onSetupComplete: (employee: Employee, company: Company) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  
  const [requireLocation, setRequireLocation] = useState(true);
  const [allowOffline, setAllowOffline] = useState(true);
  const [maxDistance, setMaxDistance] = useState('500');

  const handleCompleteSetup = async () => {
    // Validate required fields
    if (!employeeName.trim() || !employeeId.trim() || !companyName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (Employee Name, Employee ID, Company Name)');
      return;
    }

    // Validate location coordinates if location is required
    if (requireLocation) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = parseFloat(radius);
      
      if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
        Alert.alert('Error', 'Please enter valid location coordinates and radius');
        return;
      }
    }

    try {
      // Create employee object
      const employee: Employee = {
        id: `emp_${Date.now()}`,
        name: employeeName.trim(),
        employeeId: employeeId.trim(),
        companyId: `comp_${Date.now()}`,
        position: position.trim() || undefined,
        department: department.trim() || undefined,
      };

      // Create company object
      const company: Company = {
        id: employee.companyId,
        name: companyName.trim(),
        address: companyAddress.trim(),
        location: {
          latitude: requireLocation ? parseFloat(latitude) : 0,
          longitude: requireLocation ? parseFloat(longitude) : 0,
          radius: requireLocation ? parseFloat(radius) : 1000,
        },
        settings: {
          requireLocation,
          allowOffline,
          maxDistance: parseFloat(maxDistance),
        },
      };

      // Save to storage
      await StorageService.saveEmployee(employee);
      await StorageService.saveCompany(company);

      // Call completion callback
      onSetupComplete(employee, company);
    } catch (error) {
      console.error('Error completing setup:', error);
      Alert.alert('Error', 'Failed to save setup. Please try again.');
    }
  };

  const handleQuickSetup = () => {
    // Pre-fill with demo data for quick testing
    setEmployeeName('John Smith');
    setEmployeeId('EMP001');
    setPosition('Construction Worker');
    setDepartment('Field Operations');
    
    setCompanyName('ABC Construction Co.');
    setCompanyAddress('123 Main St, City, State 12345');
    setLatitude('37.7749');
    setLongitude('-122.4194');
    setRadius('100');
    
    setRequireLocation(true);
    setAllowOffline(true);
    setMaxDistance('500');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>ClockIn Setup</Text>
            <Text style={styles.subtitle}>Configure your employee and company information</Text>
          </View>

          {/* Quick Setup Button */}
          <TouchableOpacity style={styles.quickSetupButton} onPress={handleQuickSetup}>
            <Text style={styles.quickSetupText}>Quick Setup (Demo Data)</Text>
          </TouchableOpacity>

          {/* Employee Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employee Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employee Name *</Text>
              <TextInput
                style={styles.input}
                value={employeeName}
                onChangeText={setEmployeeName}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employee ID *</Text>
              <TextInput
                style={styles.input}
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="Enter your employee ID"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Position</Text>
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={setPosition}
                placeholder="e.g., Construction Worker, Electrician"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                value={department}
                onChangeText={setDepartment}
                placeholder="e.g., Field Operations, Maintenance"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Company Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Enter company name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Address</Text>
              <TextInput
                style={styles.input}
                value={companyAddress}
                onChangeText={setCompanyAddress}
                placeholder="Enter company address"
                autoCapitalize="words"
                multiline
              />
            </View>
          </View>

          {/* Location Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Require Location Verification</Text>
              <TouchableOpacity
                style={[styles.toggleButton, requireLocation && styles.toggleButtonActive]}
                onPress={() => setRequireLocation(!requireLocation)}
              >
                <Text style={[styles.toggleButtonText, requireLocation && styles.toggleButtonTextActive]}>
                  {requireLocation ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {requireLocation && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Workplace Latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={latitude}
                    onChangeText={setLatitude}
                    placeholder="e.g., 37.7749"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Workplace Longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={longitude}
                    onChangeText={setLongitude}
                    placeholder="e.g., -122.4194"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Check-in Radius (meters)</Text>
                  <TextInput
                    style={styles.input}
                    value={radius}
                    onChangeText={setRadius}
                    placeholder="e.g., 100"
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Allow Offline Mode</Text>
              <TouchableOpacity
                style={[styles.toggleButton, allowOffline && styles.toggleButtonActive]}
                onPress={() => setAllowOffline(!allowOffline)}
              >
                <Text style={[styles.toggleButtonText, allowOffline && styles.toggleButtonTextActive]}>
                  {allowOffline ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Max Distance (meters)</Text>
              <TextInput
                style={styles.input}
                value={maxDistance}
                onChangeText={setMaxDistance}
                placeholder="e.g., 500"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Complete Setup Button */}
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteSetup}>
            <Text style={styles.completeButtonText}>Complete Setup</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  quickSetupButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickSetupText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  completeButton: {
    backgroundColor: '#28a745',
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 32,
  },
});
