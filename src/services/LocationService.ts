import * as Location from 'expo-location';
import { Company } from '../types';

export interface LocationResult {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

export class LocationService {
  private static instance: LocationService;
  private isLocationEnabled = false;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('Foreground location permission not granted');
        return false;
      }

      // Request background permission for more accurate tracking
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted, using foreground only');
      }

      this.isLocationEnabled = true;
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationResult | null> {
    try {
      if (!this.isLocationEnabled) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          throw new Error('Location permission not granted');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // 10 seconds
        timeout: 15000, // 15 seconds
      });

      const result: LocationResult = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
      };

      // Try to get address
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: result.latitude,
          longitude: result.longitude,
        });

        if (addressResponse.length > 0) {
          const address = addressResponse[0];
          result.address = [
            address.street,
            address.city,
            address.region,
            address.country,
          ].filter(Boolean).join(', ');
        }
      } catch (addressError) {
        console.warn('Could not get address:', addressError);
      }

      return result;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  isWithinCompanyLocation(
    userLocation: LocationResult,
    company: Company
  ): boolean {
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      company.location.latitude,
      company.location.longitude
    );

    return distance <= company.location.radius;
  }

  async validateLocationForCheckIn(company: Company): Promise<{
    isValid: boolean;
    distance?: number;
    message?: string;
  }> {
    try {
      const location = await this.getCurrentLocation();
      
      if (!location) {
        return {
          isValid: false,
          message: 'Unable to get your current location. Please check your location settings.',
        };
      }

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        company.location.latitude,
        company.location.longitude
      );

      if (distance > company.location.radius) {
        return {
          isValid: false,
          distance,
          message: `You are ${Math.round(distance)}m away from the workplace. Please move closer to check in.`,
        };
      }

      return {
        isValid: true,
        distance,
        message: `Location verified. You are ${Math.round(distance)}m from the workplace.`,
      };
    } catch (error) {
      console.error('Error validating location:', error);
      return {
        isValid: false,
        message: 'Error validating location. Please try again.',
      };
    }
  }

  isLocationEnabled(): boolean {
    return this.isLocationEnabled;
  }
}
