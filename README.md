# ClockIn - Production-Ready Time Tracking App

A comprehensive time tracking application designed specifically for blue-collar workers, featuring NFC check-in/out, OTP authentication, and payroll integration.

## 🚀 Features

### 🔐 **Enhanced Authentication**
- **OTP Verification** - SMS/Email-based authentication
- **Secure Registration** - Company code verification
- **JWT Tokens** - Secure session management
- **Biometric Login** - Quick access for daily use

### 📱 **Core Functionality**
- **NFC Check-in/out** - Secure NFC tag scanning
- **GPS Location Verification** - Workplace location validation
- **Offline Support** - Works without internet connection
- **Real-time Sync** - Automatic data synchronization

### 💼 **Business Features**
- **Multi-tenant Support** - Multiple companies
- **Employee Management** - Role-based access
- **Time History** - Detailed time tracking
- **Payroll Integration** - Automatic hours calculation
- **Admin Dashboard** - Company management

### 🛡️ **Security & Compliance**
- **End-to-end Encryption** - Secure data transmission
- **Audit Logging** - Complete activity tracking
- **Data Protection** - GDPR/CCPA compliant
- **Secure Storage** - Encrypted local storage

## 📋 Prerequisites

- Node.js 18+
- Expo CLI
- iOS/Android device with NFC support
- Backend API server (included)

## 🛠️ Installation

### 1. **Clone the Repository**
```bash
git clone <repository-url>
cd ClockIn
```

### 2. **Install Dependencies**
```bash
# Mobile app dependencies
npm install

# Backend API dependencies
cd backend
npm install
```

### 3. **Environment Setup**

#### Mobile App (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

#### Backend API (.env)
```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/clockin

# Twilio Configuration (SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 Running the Application

### 1. **Start the Backend API**
```bash
cd backend
npm run dev
```

### 2. **Start the Mobile App**
```bash
# In the root directory
npx expo start
```

### 3. **Access the App**
- **Web**: Open http://localhost:8081 in your browser
- **Mobile**: Scan QR code with Expo Go app
- **API**: http://localhost:3000/health

## 📱 User Flow

### **New User Registration**
1. **Phone Verification** - Enter phone number
2. **OTP Verification** - Enter 6-digit code
3. **Profile Setup** - Name and email
4. **Company Join** - Enter company code
5. **Employee Verification** - Admin approval
6. **NFC Setup** - Tag assignment
7. **First Check-in** - Location verification

### **Daily Workflow**
1. **App Launch** - Biometric authentication
2. **NFC Check-in** - Scan NFC tag
3. **Location Verification** - GPS validation
4. **Work Tracking** - Real-time monitoring
5. **Break Management** - Break in/out
6. **Check-out** - End of shift
7. **Hours Calculation** - Automatic processing

## 🏗️ Architecture

### **Frontend (React Native + Expo)**
```
src/
├── components/          # UI Components
│   ├── AuthScreen.tsx   # Authentication flow
│   ├── ClockInScreen.tsx # Main app interface
│   ├── SetupScreen.tsx  # Initial setup
│   └── ...
├── services/           # Business Logic
│   ├── AuthService.ts  # Authentication
│   ├── TimeTrackingService.ts # Time tracking
│   └── ...
├── types/              # TypeScript definitions
└── App.tsx            # Main app component
```

### **Backend (Node.js + Express)**
```
backend/
├── src/
│   ├── routes/         # API Routes
│   │   ├── auth.js    # Authentication
│   │   ├── users.js   # User management
│   │   └── ...
│   └── server.js      # Main server
├── package.json
└── README.md
```

## 🔧 Configuration

### **Company Setup**
1. **Admin Registration** - Company admin account
2. **Company Code** - Unique identifier
3. **Employee Import** - Bulk employee addition
4. **NFC Tags** - Tag assignment
5. **Location Setup** - Workplace coordinates
6. **Payroll Settings** - Hourly rates, overtime

### **Employee Onboarding**
1. **Download App** - From app store
2. **Phone Verification** - OTP authentication
3. **Company Code** - Join company
4. **Profile Completion** - Personal information
5. **NFC Assignment** - Tag provisioning
6. **Training** - App usage guide

## 📊 Database Schema

### **Users Collection**
```javascript
{
  _id: ObjectId,
  phone: String,
  email: String,
  name: String,
  employeeId: String,
  companyId: ObjectId,
  isVerified: Boolean,
  createdAt: Date,
  lastLoginAt: Date
}
```

### **Companies Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  code: String,
  address: String,
  settings: {
    requireLocation: Boolean,
    allowOffline: Boolean,
    maxDistance: Number,
    allowNFC: Boolean,
    allowQR: Boolean,
    allowManual: Boolean
  }
}
```

### **Time Entries Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  companyId: ObjectId,
  type: String, // 'checkin' | 'checkout'
  timestamp: Date,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  method: String, // 'NFC' | 'QR' | 'Manual'
  synced: Boolean
}
```

## 🔒 Security Features

### **Authentication**
- **OTP Verification** - SMS/Email codes
- **JWT Tokens** - Secure session management
- **Biometric Login** - Fingerprint/Face ID
- **Multi-factor Auth** - Additional security layer

### **Data Protection**
- **End-to-end Encryption** - Secure data transmission
- **Local Encryption** - Secure local storage
- **Audit Logging** - Complete activity tracking
- **Data Anonymization** - Privacy protection

### **API Security**
- **Rate Limiting** - DDoS protection
- **Input Validation** - XSS prevention
- **CORS Protection** - Cross-origin security
- **Helmet** - Security headers

## 📈 Business Intelligence

### **Real-time Dashboards**
- **Employee Status** - Live check-in/out status
- **Location Tracking** - GPS verification
- **Hours Worked** - Real-time calculations
- **Overtime Alerts** - Automatic notifications

### **Reporting & Analytics**
- **Time Reports** - Detailed time tracking
- **Payroll Reports** - Hours and pay calculations
- **Compliance Reports** - Labor law compliance
- **Performance Metrics** - Productivity insights

## 🚀 Deployment

### **Mobile App**
```bash
# Build for production
expo build:ios
expo build:android

# Deploy to app stores
expo submit:ios
expo submit:android
```

### **Backend API**
```bash
# Docker deployment
docker build -t clockin-backend .
docker run -p 3000:3000 clockin-backend

# Cloud deployment
# Deploy to AWS, Google Cloud, or Azure
```

## 🧪 Testing

### **Unit Tests**
```bash
# Backend tests
cd backend
npm test

# Mobile app tests
npm test
```

### **Integration Tests**
```bash
# API tests
npm run test:api

# End-to-end tests
npm run test:e2e
```

## 📞 Support

### **Documentation**
- **API Documentation** - Complete API reference
- **User Guide** - Step-by-step instructions
- **Admin Guide** - Company setup guide
- **Developer Guide** - Technical documentation

### **Contact**
- **Email**: support@clockin.app
- **Phone**: +1 (555) 123-4567
- **Website**: https://clockin.app
- **Documentation**: https://docs.clockin.app

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🗺️ Roadmap

### **Phase 1 (Current)**
- ✅ OTP Authentication
- ✅ NFC Check-in/out
- ✅ Basic time tracking
- ✅ Offline support

### **Phase 2 (Next)**
- 🔄 Advanced payroll integration
- 🔄 Shift scheduling
- 🔄 Break management
- 🔄 Real-time notifications

### **Phase 3 (Future)**
- 📋 Advanced analytics
- 📋 AI-powered insights
- 📋 Integration with HR systems
- 📋 Multi-language support

---

**Built with ❤️ for blue-collar workers**