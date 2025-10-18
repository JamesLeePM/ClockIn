import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Company, Employee, TimeEntry } from '../types';

const STORAGE_KEYS = {
    EMPLOYEE: 'employee',
    COMPANY: 'company',
    TIME_ENTRIES: 'time_entries',
    APP_STATE: 'app_state',
    PENDING_SYNC: 'pending_sync',
};

export class StorageService {
    // Employee Management
    static async saveEmployee(employee: Employee): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.EMPLOYEE, JSON.stringify(employee));
        } catch (error) {
            console.error('Error saving employee:', error);
            throw error;
        }
    }

    static async getEmployee(): Promise<Employee | null> {
        try {
            const employeeData = await AsyncStorage.getItem(STORAGE_KEYS.EMPLOYEE);
            return employeeData ? JSON.parse(employeeData) : null;
        } catch (error) {
            console.error('Error getting employee:', error);
            return null;
        }
    }

    // Company Management
    static async saveCompany(company: Company): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
        } catch (error) {
            console.error('Error saving company:', error);
            throw error;
        }
    }

    static async getCompany(): Promise<Company | null> {
        try {
            const companyData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANY);
            return companyData ? JSON.parse(companyData) : null;
        } catch (error) {
            console.error('Error getting company:', error);
            return null;
        }
    }

    // Time Entries Management
    static async saveTimeEntry(timeEntry: TimeEntry): Promise<void> {
        try {
            const existingEntries = await this.getTimeEntries();
            const updatedEntries = [...existingEntries, timeEntry];
            await AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedEntries));
        } catch (error) {
            console.error('Error saving time entry:', error);
            throw error;
        }
    }

    static async getTimeEntries(): Promise<TimeEntry[]> {
        try {
            const entriesData = await AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
            return entriesData ? JSON.parse(entriesData) : [];
        } catch (error) {
            console.error('Error getting time entries:', error);
            return [];
        }
    }

    static async getTimeEntriesForDate(date: Date): Promise<TimeEntry[]> {
        try {
            const allEntries = await this.getTimeEntries();
            const targetDate = date.toDateString();
            return allEntries.filter(entry =>
                new Date(entry.timestamp).toDateString() === targetDate
            );
        } catch (error) {
            console.error('Error getting time entries for date:', error);
            return [];
        }
    }

    // App State Management
    static async saveAppState(state: AppState): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
        } catch (error) {
            console.error('Error saving app state:', error);
            throw error;
        }
    }

    static async getAppState(): Promise<AppState | null> {
        try {
            const stateData = await AsyncStorage.getItem(STORAGE_KEYS.APP_STATE);
            return stateData ? JSON.parse(stateData) : null;
        } catch (error) {
            console.error('Error getting app state:', error);
            return null;
        }
    }

    // Pending Sync Management
    static async addPendingSync(timeEntry: TimeEntry): Promise<void> {
        try {
            const pendingEntries = await this.getPendingSync();
            const updatedPending = [...pendingEntries, timeEntry];
            await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updatedPending));
        } catch (error) {
            console.error('Error adding pending sync:', error);
            throw error;
        }
    }

    static async getPendingSync(): Promise<TimeEntry[]> {
        try {
            const pendingData = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
            return pendingData ? JSON.parse(pendingData) : [];
        } catch (error) {
            console.error('Error getting pending sync:', error);
            return [];
        }
    }

    static async clearPendingSync(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
        } catch (error) {
            console.error('Error clearing pending sync:', error);
            throw error;
        }
    }

    // Clear all data
    static async clearAllData(): Promise<void> {
        try {
            await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
        } catch (error) {
            console.error('Error clearing all data:', error);
            throw error;
        }
    }
}
