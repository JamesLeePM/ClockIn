# ClockIn Backend API

A production-ready backend API for the ClockIn time tracking application, designed for blue-collar workers with NFC check-in/out functionality.

## 🚀 Features

- **OTP Authentication** - SMS/Email verification
- **User Management** - Registration, login, profile management
- **Company Management** - Multi-tenant company support
- **Time Tracking** - Check-in/out with location verification
- **Payroll Integration** - Automatic hours calculation
- **Security** - JWT tokens, rate limiting, input validation
- **Real-time Sync** - Offline-first architecture

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (or any database)
- Twilio account (for SMS)
- SMTP server (for email)

## 🛠️ Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

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

## 📚 API Endpoints

### Authentication
- `POST /api/auth/otp/request` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP
- `POST /api/auth/register` - Register new user
- `POST /api/auth/company/verify` - Verify company code
- `POST /api/auth/refresh` - Refresh tokens

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Companies
- `GET /api/companies/:id` - Get company details

### Time Entries
- `POST /api/time-entries/checkin` - Record check-in
- `POST /api/time-entries/checkout` - Record check-out
- `GET /api/time-entries/:userId` - Get user time entries

### Payroll
- `GET /api/payroll/:userId` - Get payroll data

## 🔒 Security Features

- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Joi schema validation
- **JWT Tokens** - Secure authentication
- **CORS Protection** - Configured for frontend
- **Helmet** - Security headers
- **OTP Expiry** - 5-minute expiration
- **Attempt Limiting** - Max 3 OTP attempts

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📊 Database Schema

### Users Collection
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

### Companies Collection
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

### Time Entries Collection
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

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t clockin-backend .

# Run container
docker run -p 3000:3000 clockin-backend
```

### Environment Setup
1. Set up MongoDB database
2. Configure Twilio for SMS
3. Set up SMTP for email
4. Update environment variables
5. Deploy to your preferred platform

## 📈 Monitoring

- **Health Check**: `GET /health`
- **Logging**: Morgan combined logs
- **Error Tracking**: Centralized error handling
- **Rate Limiting**: Built-in protection

## 🔄 Development

### Adding New Routes
1. Create route file in `src/routes/`
2. Add validation schemas
3. Implement business logic
4. Add error handling
5. Update this README

### Database Integration
Replace the mock Map objects with real database calls:
- MongoDB with Mongoose
- PostgreSQL with Prisma
- Any other database of choice

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 📄 License

MIT License - see LICENSE file for details
