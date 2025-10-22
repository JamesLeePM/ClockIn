import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LocationService } from '../services/LocationService';
import { NFCSecurityService, NFCTagData } from '../services/NFCSecurityService';
import { TimeTrackingService } from '../services/TimeTrackingService';
import { Company, Employee, TimeEntry } from '../types';

interface NFCScannerProps {
    employee: Employee;
    company: Company;
    onTimeEntry: (entry: TimeEntry) => void;
    onClose: () => void;
}

export const NFCScanner: React.FC<NFCScannerProps> = ({
    employee,
    company,
    onTimeEntry,
    onClose,
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
    const [lastScanTime, setLastScanTime] = useState<number>(0);

    const timeTrackingService = TimeTrackingService.getInstance();
    const locationService = LocationService.getInstance();
    const nfcSecurityService = NFCSecurityService.getInstance();

    useEffect(() => {
        initializeNFC();
    }, []);

    const initializeNFC = async () => {
        try {
            // Check if NFC is supported
            // Note: In a real implementation, you'd check expo-nfc availability
            setNfcSupported(true);
            await nfcSecurityService.initialize();
        } catch (error) {
            console.error('Error initializing NFC:', error);
            setNfcSupported(false);
        }
    };

    const handleNFCTap = async (tagData: NFCTagData) => {
        // Prevent rapid successive taps
        const now = Date.now();
        if (now - lastScanTime < 2000) {
            return;
        }
        setLastScanTime(now);

        setIsProcessing(true);

        try {
            // Validate NFC tag
            const validation = await nfcSecurityService.validateNFCTag(tagData);

            if (!validation.isValid) {
                Alert.alert('Invalid Tag', validation.error || 'NFC tag validation failed');
                setIsProcessing(false);
                return;
            }

            const tagInfo = validation.tagInfo!;

            // Verify location
            const userLocation = await locationService.getCurrentLocation();
            if (!userLocation) {
                Alert.alert('Location Error', 'Unable to get your current location. Please check location settings.');
                setIsProcessing(false);
                return;
            }

            const locationVerification = await nfcSecurityService.verifyLocation(tagInfo, userLocation);

            if (!locationVerification.isValid) {
                Alert.alert('Location Error', locationVerification.error || 'Location verification failed');
                setIsProcessing(false);
                return;
            }

            // Determine action based on current status
            const isCurrentlyCheckedIn = await timeTrackingService.isCurrentlyCheckedIn(employee.id);
            const action = isCurrentlyCheckedIn ? 'checkout' : 'checkin';

            // Process check-in/out
            let result;
            if (action === 'checkin') {
                result = await timeTrackingService.checkIn(employee, company);
            } else {
                result = await timeTrackingService.checkOut(employee, company);
            }

            if (result.success && result.timeEntry) {
                // Create audit log
                await nfcSecurityService.createAuditLog(
                    tagInfo,
                    employee.id,
                    action,
                    userLocation,
                    true
                );

                onTimeEntry(result.timeEntry);
                Alert.alert('Success', result.message, [
                    { text: 'OK', onPress: onClose }
                ]);
            } else {
                // Create audit log for failed attempt
                await nfcSecurityService.createAuditLog(
                    tagInfo,
                    employee.id,
                    action,
                    userLocation,
                    false
                );

                Alert.alert('Error', result.message);
            }
        } catch (error) {
            console.error('Error processing NFC tap:', error);
            Alert.alert('Error', 'Failed to process NFC tap. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const generateTestTag = async () => {
        try {
            const tagData = await nfcSecurityService.generateNFCTag(
                company,
                'main_entrance',
                'Main Entrance',
                {
                    latitude: company.location.latitude,
                    longitude: company.location.longitude,
                },
                company.location.radius
            );

            Alert.alert(
                'Test NFC Tag Generated',
                `Tag ID: ${tagData.tagId}\n\nThis is a test tag that expires in 24 hours. In production, this would be written to a physical NFC tag.`,
                [
                    { text: 'OK' },
                    {
                        text: 'Test Tap',
                        onPress: () => handleNFCTap(tagData)
                    }
                ]
            );
        } catch (error) {
            console.error('Error generating test tag:', error);
            Alert.alert('Error', 'Failed to generate test tag.');
        }
    };

    const startScanning = () => {
        setIsScanning(true);
        // In a real implementation, this would start NFC scanning
        // For now, we'll simulate it
    };

    const stopScanning = () => {
        setIsScanning(false);
    };

    if (nfcSupported === null) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.messageContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.messageText}>Initializing NFC...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (nfcSupported === false) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>NFC is not supported on this device.</Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>NFC Check-in</Text>
                <Text style={styles.headerSubtitle}>
                    {company.name} • {employee.name}
                </Text>
            </View>

            {/* NFC Scanner Area */}
            <View style={styles.scannerContainer}>
                <View style={styles.nfcArea}>
                    <View style={styles.nfcIcon}>
                        <Text style={styles.nfcIconText}>📱</Text>
                    </View>
                    <Text style={styles.nfcTitle}>Tap NFC Tag</Text>
                    <Text style={styles.nfcSubtitle}>
                        Hold your phone near the NFC tag to check in/out
                    </Text>
                </View>

                {/* Processing indicator */}
                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.processingText}>Processing...</Text>
                    </View>
                )}
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                    • Hold your phone close to the NFC tag
                </Text>
                <Text style={styles.instructionsText}>
                    • Wait for the vibration/beep confirmation
                </Text>
                <Text style={styles.instructionsText}>
                    • Location will be automatically verified
                </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, isScanning && styles.actionButtonActive]}
                    onPress={isScanning ? stopScanning : startScanning}
                >
                    <Text style={styles.actionButtonText}>
                        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.testButton} onPress={generateTestTag}>
                    <Text style={styles.testButtonText}>Generate Test Tag</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>Close Scanner</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    messageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
    },
    header: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        color: '#ccc',
        fontSize: 14,
    },
    scannerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    nfcArea: {
        alignItems: 'center',
        padding: 40,
    },
    nfcIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(0, 122, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    nfcIconText: {
        fontSize: 48,
    },
    nfcTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    nfcSubtitle: {
        color: '#ccc',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    instructionsContainer: {
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    instructionsText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 8,
    },
    actionContainer: {
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    actionButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionButtonActive: {
        backgroundColor: '#FF3B30',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    testButton: {
        backgroundColor: '#34C759',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        backgroundColor: 'transparent',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#666',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
