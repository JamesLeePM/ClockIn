export interface Employee {
    id: string;
    name: string;
    employeeId: string;
    companyId: string;
    position?: string;
    department?: string;
}

export interface TimeEntry {
    id: string;
    employeeId: string;
    companyId: string;
    type: 'checkin' | 'checkout';
    timestamp: Date;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    notes?: string;
    synced: boolean;
}

export interface Company {
    id: string;
    name: string;
    address: string;
    location: {
        latitude: number;
        longitude: number;
        radius: number; // in meters
    };
    settings: {
        requireLocation: boolean;
        allowOffline: boolean;
        maxDistance: number; // in meters
    };
}

export interface AppState {
    currentEmployee: Employee | null;
    currentCompany: Company | null;
    isCheckedIn: boolean;
    lastCheckIn: TimeEntry | null;
    isOnline: boolean;
}
