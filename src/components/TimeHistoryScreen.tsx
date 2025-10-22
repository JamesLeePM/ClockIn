import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { StorageService } from '../services/StorageService';
import { Employee, TimeEntry } from '../types';

interface TimeHistoryScreenProps {
    employee: Employee;
    onBack: () => void;
}

export const TimeHistoryScreen: React.FC<TimeHistoryScreenProps> = ({
    employee,
    onBack,
}) => {
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        loadTimeEntries();
    }, [selectedDate]);

    const loadTimeEntries = async () => {
        try {
            setIsLoading(true);
            const entries = await StorageService.getTimeEntriesForDate(selectedDate);
            const employeeEntries = entries.filter(entry => entry.employeeId === employee.id);
            setTimeEntries(employeeEntries.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ));
        } catch (error) {
            console.error('Error loading time entries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (timestamp: string | Date) => {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
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

    const getTotalHours = () => {
        let totalHours = 0;
        let checkInTime: Date | null = null;

        for (const entry of timeEntries.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )) {
            if (entry.type === 'checkin') {
                checkInTime = new Date(entry.timestamp);
            } else if (entry.type === 'checkout' && checkInTime) {
                const checkOutTime = new Date(entry.timestamp);
                totalHours += (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
                checkInTime = null;
            }
        }

        // If still checked in, add hours up to now
        if (checkInTime) {
            totalHours += (new Date().getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        }

        return totalHours;
    };

    const renderTimeEntry = ({ item }: { item: TimeEntry }) => (
        <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
                <Text style={styles.entryTime}>{formatTime(item.timestamp)}</Text>
                <View style={[
                    styles.statusBadge,
                    item.type === 'checkin' ? styles.checkInBadge : styles.checkOutBadge
                ]}>
                    <Text style={[
                        styles.statusText,
                        item.type === 'checkin' ? styles.checkInText : styles.checkOutText
                    ]}>
                        {item.type.toUpperCase()}
                    </Text>
                </View>
            </View>
            <View style={styles.entryDetails}>
                <Text style={styles.methodText}>Method: {item.method || 'Manual'}</Text>
                {item.location && (
                    <Text style={styles.locationText}>
                        Location: {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
                    </Text>
                )}
                <Text style={styles.syncText}>
                    {item.synced || item.isSynced ? '✅ Synced' : '⏳ Pending Sync'}
                </Text>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading time history...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Time History</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Date and Summary */}
            <View style={styles.summaryCard}>
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                <Text style={styles.totalHoursText}>
                    Total Hours: {getTotalHours().toFixed(1)}h
                </Text>
                <Text style={styles.entriesCountText}>
                    {timeEntries.length} entries
                </Text>
            </View>

            {/* Time Entries List */}
            <FlatList
                data={timeEntries}
                renderItem={renderTimeEntry}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No time entries for this date</Text>
                    </View>
                }
            />
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
    summaryCard: {
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
    dateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
    },
    totalHoursText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#28a745',
        marginBottom: 4,
    },
    entriesCountText: {
        fontSize: 14,
        color: '#6c757d',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    entryCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    entryTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    checkInBadge: {
        backgroundColor: '#d4edda',
    },
    checkOutBadge: {
        backgroundColor: '#f8d7da',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    checkInText: {
        color: '#155724',
    },
    checkOutText: {
        color: '#721c24',
    },
    entryDetails: {
        marginTop: 8,
    },
    methodText: {
        fontSize: 14,
        color: '#495057',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 4,
    },
    syncText: {
        fontSize: 12,
        color: '#6c757d',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
    },
});
