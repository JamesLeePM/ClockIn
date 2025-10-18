import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Company } from '../types';

export interface NFCTagData {
  tagId: string;
  companyId: string;
  locationId: string;
  encryptedData: string;
  timestamp: number;
  signature: string;
}

export interface NFCTagInfo {
  tagId: string;
  companyId: string;
  locationId: string;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  isValid: boolean;
  expiresAt: number;
}

export class NFCSecurityService {
  private static instance: NFCSecurityService;
  private encryptionKey: string | null = null;

  static getInstance(): NFCSecurityService {
    if (!NFCSecurityService.instance) {
      NFCSecurityService.instance = new NFCSecurityService();
    }
    return NFCSecurityService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Get or create encryption key
      let key = await SecureStore.getItemAsync('nfc_encryption_key');
      if (!key) {
        key = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `nfc_key_${Date.now()}_${Math.random()}`,
          { encoding: Crypto.CryptoEncoding.BASE64 }
        );
        await SecureStore.setItemAsync('nfc_encryption_key', key);
      }
      this.encryptionKey = key;
    } catch (error) {
      console.error('Error initializing NFC security service:', error);
      throw error;
    }
  }

  async generateNFCTag(
    company: Company,
    locationId: string,
    locationName: string,
    coordinates: { latitude: number; longitude: number },
    radius: number = 50
  ): Promise<NFCTagData> {
    if (!this.encryptionKey) {
      await this.initialize();
    }

    const tagId = await this.generateTagId();
    const timestamp = Date.now();
    const expiresAt = timestamp + (24 * 60 * 60 * 1000); // 24 hours

    const tagInfo: NFCTagInfo = {
      tagId,
      companyId: company.id,
      locationId,
      locationName,
      coordinates,
      radius,
      isValid: true,
      expiresAt,
    };

    // Encrypt the tag data
    const encryptedData = await this.encryptData(JSON.stringify(tagInfo));
    
    // Create signature for verification
    const signature = await this.createSignature(tagInfo, this.encryptionKey!);

    return {
      tagId,
      companyId: company.id,
      locationId,
      encryptedData,
      timestamp,
      signature,
    };
  }

  async validateNFCTag(tagData: NFCTagData): Promise<{
    isValid: boolean;
    tagInfo?: NFCTagInfo;
    error?: string;
  }> {
    try {
      if (!this.encryptionKey) {
        await this.initialize();
      }

      // Check if tag has expired
      const now = Date.now();
      const tagAge = now - tagData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (tagAge > maxAge) {
        return {
          isValid: false,
          error: 'NFC tag has expired. Please get a fresh tag.',
        };
      }

      // Decrypt the tag data
      const decryptedData = await this.decryptData(tagData.encryptedData);
      const tagInfo: NFCTagInfo = JSON.parse(decryptedData);

      // Verify signature
      const isValidSignature = await this.verifySignature(tagInfo, tagData.signature, this.encryptionKey!);
      
      if (!isValidSignature) {
        return {
          isValid: false,
          error: 'Invalid NFC tag signature. Tag may be tampered with.',
        };
      }

      // Check if tag is still valid
      if (!tagInfo.isValid || tagInfo.expiresAt < now) {
        return {
          isValid: false,
          error: 'NFC tag is no longer valid.',
        };
      }

      return {
        isValid: true,
        tagInfo,
      };
    } catch (error) {
      console.error('Error validating NFC tag:', error);
      return {
        isValid: false,
        error: 'Failed to validate NFC tag.',
      };
    }
  }

  async verifyLocation(
    tagInfo: NFCTagInfo,
    userLocation: { latitude: number; longitude: number }
  ): Promise<{
    isValid: boolean;
    distance?: number;
    error?: string;
  }> {
    try {
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        tagInfo.coordinates.latitude,
        tagInfo.coordinates.longitude
      );

      if (distance > tagInfo.radius) {
        return {
          isValid: false,
          distance,
          error: `You are ${Math.round(distance)}m away from ${tagInfo.locationName}. Please move closer.`,
        };
      }

      return {
        isValid: true,
        distance,
      };
    } catch (error) {
      console.error('Error verifying location:', error);
      return {
        isValid: false,
        error: 'Failed to verify location.',
      };
    }
  }

  async createAuditLog(
    tagInfo: NFCTagInfo,
    employeeId: string,
    action: 'checkin' | 'checkout',
    location: { latitude: number; longitude: number },
    success: boolean
  ): Promise<void> {
    try {
      const auditEntry = {
        timestamp: Date.now(),
        tagId: tagInfo.tagId,
        companyId: tagInfo.companyId,
        locationId: tagInfo.locationId,
        employeeId,
        action,
        location,
        success,
        deviceInfo: {
          platform: 'mobile',
          timestamp: Date.now(),
        },
      };

      // Store audit log locally (in production, this would be sent to server)
      const existingLogs = await SecureStore.getItemAsync('nfc_audit_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(auditEntry);
      
      // Keep only last 1000 entries
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      await SecureStore.setItemAsync('nfc_audit_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }

  async getAuditLogs(): Promise<any[]> {
    try {
      const logs = await SecureStore.getItemAsync('nfc_audit_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  private async generateTagId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async encryptData(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }
    
    // Simple XOR encryption (in production, use proper encryption)
    const keyBytes = Buffer.from(this.encryptionKey, 'base64');
    const dataBytes = Buffer.from(data, 'utf8');
    const encrypted = Buffer.alloc(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return encrypted.toString('base64');
  }

  private async decryptData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }
    
    const keyBytes = Buffer.from(this.encryptionKey, 'base64');
    const encryptedBytes = Buffer.from(encryptedData, 'base64');
    const decrypted = Buffer.alloc(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return decrypted.toString('utf8');
  }

  private async createSignature(data: NFCTagInfo, key: string): Promise<string> {
    const dataString = JSON.stringify(data);
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${dataString}_${key}`,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
  }

  private async verifySignature(data: NFCTagInfo, signature: string, key: string): Promise<boolean> {
    const expectedSignature = await this.createSignature(data, key);
    return signature === expectedSignature;
  }

  private calculateDistance(
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
}
