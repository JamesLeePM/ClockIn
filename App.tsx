import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ClockInScreen } from './src/components/ClockInScreen';
import { SetupScreen } from './src/components/SetupScreen';
import { AuthScreen } from './src/components/AuthScreen';
import { StorageService } from './src/services/StorageService';
import { AuthService } from './src/services/AuthService';
import { Company, Employee, TimeEntry } from './src/types';
import { AuthUser } from './src/types/Auth';

export default function App() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const authService = AuthService.getInstance();
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        const user = await authService.getCurrentUser();
        if (user) {
          setAuthUser(user);
          setIsAuthenticated(true);
          
          // Load employee and company data
          const [storedEmployee, storedCompany] = await Promise.all([
            StorageService.getEmployee(),
            StorageService.getCompany(),
          ]);

          if (storedEmployee && storedCompany) {
            setEmployee(storedEmployee);
            setCompany(storedCompany);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize app. Please restart.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (user: AuthUser) => {
    setAuthUser(user);
    setIsAuthenticated(true);
    
    // Load or create employee and company data
    try {
      const [storedEmployee, storedCompany] = await Promise.all([
        StorageService.getEmployee(),
        StorageService.getCompany(),
      ]);

      if (storedEmployee && storedCompany) {
        setEmployee(storedEmployee);
        setCompany(storedCompany);
      } else {
        // Create employee and company data from auth user
        const newEmployee: Employee = {
          id: user.id,
          name: user.name,
          employeeId: user.employeeId || '',
          companyId: user.companyId || '',
          position: '',
          department: '',
          email: user.email,
        };

        const newCompany: Company = {
          id: user.companyId || '',
          name: 'Your Company',
          address: '',
          location: {
            latitude: 0,
            longitude: 0,
            radius: 100,
          },
          settings: {
            requireLocation: true,
            allowOffline: true,
            maxDistance: 500,
            allowNFC: true,
            allowQR: false,
            allowManual: true,
          },
        };

        await StorageService.saveEmployee(newEmployee);
        await StorageService.saveCompany(newCompany);
        
        setEmployee(newEmployee);
        setCompany(newCompany);
      }
    } catch (error) {
      console.error('Error setting up user data:', error);
      Alert.alert('Error', 'Failed to set up user data. Please try again.');
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

  const handleCompanyUpdate = (updatedCompany: Company) => {
    setCompany(updatedCompany);
  };

  const handleLogout = async () => {
    try {
      const authService = AuthService.getInstance();
      await authService.logout();
      
      setAuthUser(null);
      setIsAuthenticated(false);
      setEmployee(null);
      setCompany(null);
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout. Please restart the app.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Show authentication screen if not authenticated
  if (!isAuthenticated || !authUser) {
    return (
      <View style={styles.container}>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
        <StatusBar style="auto" />
      </View>
    );
  }

  // Show setup screen if authenticated but no employee/company data
  if (!employee || !company) {
    return (
      <View style={styles.container}>
        <SetupScreen onSetupComplete={handleSetupComplete} />
        <StatusBar style="auto" />
      </View>
    );
  }

  // Show main app if everything is set up
  return (
    <View style={styles.container}>
      <ClockInScreen
        employee={employee}
        company={company}
        authUser={authUser}
        onTimeEntry={handleTimeEntry}
        onCompanyUpdate={handleCompanyUpdate}
        onLogout={handleLogout}
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
