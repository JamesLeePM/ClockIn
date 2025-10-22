import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { AuthService } from '../services/AuthService';
import { AuthUser, RegistrationData } from '../types/Auth';

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser) => void;
}

type AuthStep = 'phone' | 'otp' | 'registration' | 'company' | 'complete';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [isLoading, setIsLoading] = useState(false);
  
  // Phone/OTP state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // Registration state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Company verification state
  const [companyCode, setCompanyCode] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');

  const authService = AuthService.getInstance();

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        if (user) {
          onAuthSuccess(user);
        }
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);
    const result = await authService.requestOTP(phone.trim());
    setIsLoading(false);

    if (result.success) {
      setOtpSent(true);
      setCurrentStep('otp');
      Alert.alert('OTP Sent', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleOTPSubmit = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    setIsLoading(true);
    const result = await authService.verifyOTP(phone, otpCode.trim());
    setIsLoading(false);

    if (result.success) {
      if (result.requiresRegistration) {
        setCurrentStep('registration');
      } else {
        // User exists, get current user and proceed
        const user = await authService.getCurrentUser();
        if (user) {
          onAuthSuccess(user);
        }
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleRegistrationSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    const registrationData: RegistrationData = {
      phone,
      name: name.trim(),
      email: email.trim() || undefined,
    };

    const result = await authService.registerUser(registrationData);
    setIsLoading(false);

    if (result.success) {
      setCurrentStep('company');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleCompanySubmit = async () => {
    if (!companyCode.trim() || !employeeId.trim()) {
      Alert.alert('Error', 'Please enter company code and employee ID');
      return;
    }

    setIsLoading(true);
    const result = await authService.verifyCompanyCode(companyCode.trim(), employeeId.trim());
    setIsLoading(false);

    if (result.success) {
      setCurrentStep('complete');
      Alert.alert('Success', 'Registration completed! You can now use ClockIn.');
      // Get the updated user and proceed
      const user = await authService.getCurrentUser();
      if (user) {
        onAuthSuccess(user);
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Your Phone Number</Text>
      <Text style={styles.stepDescription}>
        We'll send you a verification code to confirm your identity
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePhoneSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Verification Code</Text>
      <Text style={styles.stepDescription}>
        We sent a 6-digit code to {phone}
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Verification Code *</Text>
        <TextInput
          style={styles.input}
          value={otpCode}
          onChangeText={setOtpCode}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleOTPSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => setCurrentStep('phone')}
      >
        <Text style={styles.linkText}>Change Phone Number</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegistrationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Complete Your Profile</Text>
      <Text style={styles.stepDescription}>
        Tell us a bit about yourself to get started
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          autoCapitalize="words"
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email (Optional)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your.email@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleRegistrationSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCompanyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Join Your Company</Text>
      <Text style={styles.stepDescription}>
        Enter your company code and employee ID to get started
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Company Code *</Text>
        <TextInput
          style={styles.input}
          value={companyCode}
          onChangeText={setCompanyCode}
          placeholder="Enter company code"
          autoCapitalize="characters"
          autoFocus
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
        <Text style={styles.label}>Position (Optional)</Text>
        <TextInput
          style={styles.input}
          value={position}
          onChangeText={setPosition}
          placeholder="e.g., Construction Worker"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Department (Optional)</Text>
        <TextInput
          style={styles.input}
          value={department}
          onChangeText={setDepartment}
          placeholder="e.g., Field Operations"
          autoCapitalize="words"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCompanySubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Join Company</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'phone':
        return renderPhoneStep();
      case 'otp':
        return renderOTPStep();
      case 'registration':
        return renderRegistrationStep();
      case 'company':
        return renderCompanyStep();
      default:
        return renderPhoneStep();
    }
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
            <Text style={styles.title}>ClockIn</Text>
            <Text style={styles.subtitle}>Secure time tracking for blue-collar workers</Text>
          </View>

          {/* Current Step */}
          {renderCurrentStep()}

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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  stepContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
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
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
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
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 32,
  },
});
