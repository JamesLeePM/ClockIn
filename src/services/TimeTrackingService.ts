import { TimeEntry, Employee, Company } from '../types';
import { StorageService } from './StorageService';
import { LocationService } from './LocationService';
import * as Notifications from 'expo-notifications';

export class TimeTrackingService {
  private static instance: TimeTrackingService;
  private locationService: LocationService;

  private constructor() {
    this.locationService = LocationService.getInstance();
  }

  static getInstance(): TimeTrackingService {
    if (!TimeTrackingService.instance) {
      TimeTrackingService.instance = new TimeTrackingService();
    }
    return TimeTrackingService.instance;
  }

  async checkIn(employee: Employee, company: Company, notes?: string): Promise<{
    success: boolean;
    timeEntry?: TimeEntry;
    message: string;
  }> {
    try {
      // Validate location if required
      if (company.settings.requireLocation) {
        const locationValidation = await this.locationService.validateLocationForCheckIn(company);
        
        if (!locationValidation.isValid) {
          return {
            success: false,
            message: locationValidation.message || 'Location validation failed',
          };
        }
      }

      // Get current location
      const location = company.settings.requireLocation 
        ? await this.locationService.getCurrentLocation()
        : undefined;

      // Create time entry
      const timeEntry: TimeEntry = {
        id: this.generateId(),
        employeeId: employee.id,
        companyId: company.id,
        type: 'checkin',
        timestamp: new Date(),
        location,
        notes,
        synced: false,
      };

      // Save to storage
      await StorageService.saveTimeEntry(timeEntry);

      // Send notification
      await this.sendNotification('Checked In', `You checked in at ${this.formatTime(timeEntry.timestamp)}`);

      return {
        success: true,
        timeEntry,
        message: 'Successfully checked in!',
      };
    } catch (error) {
      console.error('Error checking in:', error);
      return {
        success: false,
        message: 'Failed to check in. Please try again.',
      };
    }
  }

  async checkOut(employee: Employee, company: Company, notes?: string): Promise<{
    success: boolean;
    timeEntry?: TimeEntry;
    message: string;
  }> {
    try {
      // Get current location if required
      const location = company.settings.requireLocation 
        ? await this.locationService.getCurrentLocation()
        : undefined;

      // Create time entry
      const timeEntry: TimeEntry = {
        id: this.generateId(),
        employeeId: employee.id,
        companyId: company.id,
        type: 'checkout',
        timestamp: new Date(),
        location,
        notes,
        synced: false,
      };

      // Save to storage
      await StorageService.saveTimeEntry(timeEntry);

      // Send notification
      await this.sendNotification('Checked Out', `You checked out at ${this.formatTime(timeEntry.timestamp)}`);

      return {
        success: true,
        timeEntry,
        message: 'Successfully checked out!',
      };
    } catch (error) {
      console.error('Error checking out:', error);
      return {
        success: false,
        message: 'Failed to check out. Please try again.',
      };
    }
  }

  async getTodayEntries(employeeId: string): Promise<TimeEntry[]> {
    try {
      const today = new Date();
      const entries = await StorageService.getTimeEntriesForDate(today);
      return entries.filter(entry => entry.employeeId === employeeId);
    } catch (error) {
      console.error('Error getting today entries:', error);
      return [];
    }
  }

  async getLastCheckIn(employeeId: string): Promise<TimeEntry | null> {
    try {
      const entries = await StorageService.getTimeEntries();
      const checkIns = entries
        .filter(entry => entry.employeeId === employeeId && entry.type === 'checkin')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return checkIns.length > 0 ? checkIns[0] : null;
    } catch (error) {
      console.error('Error getting last check in:', error);
      return null;
    }
  }

  async isCurrentlyCheckedIn(employeeId: string): Promise<boolean> {
    try {
      const lastCheckIn = await this.getLastCheckIn(employeeId);
      if (!lastCheckIn) return false;

      const entries = await StorageService.getTimeEntries();
      const checkOuts = entries
        .filter(entry => 
          entry.employeeId === employeeId && 
          entry.type === 'checkout' &&
          new Date(entry.timestamp) > new Date(lastCheckIn.timestamp)
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return checkOuts.length === 0;
    } catch (error) {
      console.error('Error checking if currently checked in:', error);
      return false;
    }
  }

  async getTotalHoursToday(employeeId: string): Promise<number> {
    try {
      const entries = await this.getTodayEntries(employeeId);
      let totalMinutes = 0;
      let checkInTime: Date | null = null;

      for (const entry of entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())) {
        if (entry.type === 'checkin') {
          checkInTime = new Date(entry.timestamp);
        } else if (entry.type === 'checkout' && checkInTime) {
          const checkOutTime = new Date(entry.timestamp);
          const diffMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
          totalMinutes += diffMinutes;
          checkInTime = null;
        }
      }

      return totalMinutes / 60; // Convert to hours
    } catch (error) {
      console.error('Error calculating total hours:', error);
      return 0;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  private async sendNotification(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}
