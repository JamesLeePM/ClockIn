import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LocationService } from '../services/LocationService';
import { StorageService } from '../services/StorageService';
import { Company, Employee } from '../types';

interface SettingsScreenProps {
    employee: Employee;
    company: Company;
    onBack: () => void;
    onCompanyUpdate: (company: Company) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
    employee,
    company,
    onBack,
    onCompanyUpdate,
}) => {
    const [companyName, setCompanyName] = useState(company.name);
    const [latitude, setLatitude] = useState(company.location.latitude.toString());
    const [longitude, setLongitude] = useState(company.location.longitude.toString());
    const [radius, setRadius] = useState(company.location.radius.toString());
    const [requireLocation, setRequireLocation] = useState(company.settings.requireLocation);
    const [allowNFC, setAllowNFC] = useState<boolean>(company.settings.allowNFC || false);
    const [allowQR, setAllowQR] = useState<boolean>(company.settings.allowQR || false);
    const [allowManual, setAllowManual] = useState<boolean>(company.settings.allowManual || true);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const locationService = LocationService.getInstance();

    const handleGetCurrentLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const location = await locationService.getCurrentLocation();
            if (location) {
                setLatitude(location.latitude.toString());
                setLongitude(location.longitude.toString());
                Alert.alert('Location Updated', 'Current GPS location has been set.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to get current location.');
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!companyName || !latitude || !longitude || !radius) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        const updatedCompany: Company = {
            ...company,
            name: companyName,
            location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius: parseFloat(radius),
            },
            settings: {
                ...company.settings,
                requireLocation,
                allowNFC,
                allowQR,
                allowManual,
            },
        };

        try {
            await StorageService.saveCompany(updatedCompany);
            onCompanyUpdate(updatedCompany);
            Alert.alert('Success', 'Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Error', 'Failed to save settings. Please try again.');
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'This will delete all time entries and reset the app. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await StorageService.clearAllData();
                            Alert.alert('Success', 'All data has been cleared.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear data.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Company Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Company Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Company Name</Text>
                        <TextInput
                            style={styles.input}
                            value={companyName}
                            onChangeText={setCompanyName}
                            placeholder="Enter company name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Workplace Location</Text>
                        <View style={styles.locationInputs}>
                            <TextInput
                                style={[styles.input, styles.locationInput]}
                                value={latitude}
                                onChangeText={setLatitude}
                                placeholder="Latitude"
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={[styles.input, styles.locationInput]}
                                value={longitude}
                                onChangeText={setLongitude}
                                placeholder="Longitude"
                                keyboardType="numeric"
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.locationButton}
                            onPress={handleGetCurrentLocation}
                            disabled={isLoadingLocation}
                        >
                            <Text style={styles.locationButtonText}>
                                {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Workplace Radius (meters)</Text>
                        <TextInput
                            style={styles.input}
                            value={radius}
                            onChangeText={setRadius}
                            placeholder="100"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Check-in/out Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Check-in/out Settings</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Require Location</Text>
                            <Text style={styles.settingDescription}>
                                Verify GPS location when checking in/out
                            </Text>
                        </View>
                        <Switch
                            value={requireLocation}
                            onValueChange={(value: boolean) => setRequireLocation(value)}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={requireLocation ? '#007AFF' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Allow NFC Check-in</Text>
                            <Text style={styles.settingDescription}>
                                Enable NFC tag scanning for check-in/out
                            </Text>
                        </View>
                        <Switch
                            value={allowNFC}
                            onValueChange={(value: boolean) => setAllowNFC(value)}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={allowNFC ? '#007AFF' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Allow QR Code</Text>
                            <Text style={styles.settingDescription}>
                                Enable QR code scanning for check-in/out
                            </Text>
                        </View>
                        <Switch
                            value={allowQR}
                            onValueChange={(value: boolean) => setAllowQR(value)}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={allowQR ? '#007AFF' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Allow Manual Entry</Text>
                            <Text style={styles.settingDescription}>
                                Enable manual check-in/out buttons
                            </Text>
                        </View>
                        <Switch
                            value={allowManual}
                            onValueChange={(value: boolean) => setAllowManual(value)}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={allowManual ? '#007AFF' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Employee Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Employee Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Name:</Text>
                        <Text style={styles.infoValue}>{employee.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Employee ID:</Text>
                        <Text style={styles.infoValue}>{employee.employeeId}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={styles.infoValue}>{employee.email || 'Not provided'}</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
                        <Text style={styles.saveButtonText}>Save Settings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
                        <Text style={styles.clearButtonText}>Clear All Data</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
    },
    placeholder: {
        width: 60,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
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
        fontSize: 18,
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
        height: 50,
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#495057',
        backgroundColor: '#f8f9fa',
    },
    locationInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    locationInput: {
        width: '48%',
    },
    locationButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    locationButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: '#6c757d',
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    infoLabel: {
        fontSize: 16,
        color: '#495057',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: '#212529',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#28a745',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    clearButton: {
        backgroundColor: '#dc3545',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
