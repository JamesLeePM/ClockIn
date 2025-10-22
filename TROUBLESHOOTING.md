# 🔧 ClockIn Troubleshooting Guide

## 🚨 **OTP Authentication Issues**

### **Problem: "Network request failed" Error**

**Symptoms:**
- Mobile app shows "Network request failed" when requesting OTP
- Backend API works from computer but not from mobile device

**Solution:**
1. **Check Network Configuration:**
   ```bash
   # Find your computer's IP address
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Update API URL in AuthService.ts:**
   ```typescript
   const API_BASE_URL = 'http://192.168.0.208:3001/api'; // Use your IP
   ```

3. **Restart Backend Server:**
   ```bash
   cd backend
   node src/server.js
   ```

4. **Test Network Connectivity:**
   ```bash
   curl http://192.168.0.208:3001/health
   ```

### **Problem: Backend Server Won't Start**

**Symptoms:**
- "Error: accountSid must start with AC"
- "TypeError: nodemailer.createTransporter is not a function"

**Solution:**
1. **Check Environment Variables:**
   ```bash
   cd backend
   cat .env
   ```

2. **Use Development Mode (No Real SMS/Email):**
   - The app works in development mode without real Twilio/SMTP credentials
   - OTP codes are logged to console

3. **Restart Server:**
   ```bash
   pkill -f "node.*server.js"
   cd backend && node src/server.js
   ```

## 📱 **Mobile App Issues**

### **Problem: Expo Go Can't Connect**

**Symptoms:**
- QR code doesn't work
- "Unable to connect" error

**Solution:**
1. **Use LAN Mode:**
   ```bash
   npx expo start --lan
   ```

2. **Manual URL Entry:**
   - Open Expo Go app
   - Manually enter: `exp://192.168.0.208:8081`

3. **Check Network:**
   - Ensure phone and computer are on same WiFi network
   - Disable VPN if active

### **Problem: App Crashes on Startup**

**Symptoms:**
- App closes immediately after opening
- White screen or error messages

**Solution:**
1. **Clear Cache:**
   ```bash
   npx expo start --clear
   ```

2. **Check Dependencies:**
   ```bash
   npm install
   ```

3. **Restart Metro:**
   ```bash
   pkill -f "expo start"
   npx expo start
   ```

## 🔍 **Debugging Steps**

### **1. Check Backend Status**
```bash
# Test health endpoint
curl http://192.168.0.208:3001/health

# Test OTP endpoint
curl -X POST http://192.168.0.208:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "type": "registration"}'
```

### **2. Check Mobile App Logs**
- Open Expo Go app
- Check the logs in the terminal where you ran `expo start`
- Look for network errors or API failures

### **3. Verify Network Configuration**
```bash
# Check if backend is listening on all interfaces
lsof -i :3001

# Test from mobile device (if possible)
ping 192.168.0.208
```

## 🛠️ **Common Fixes**

### **Fix 1: Network Configuration**
```bash
# Update AuthService.ts with correct IP
const API_BASE_URL = 'http://YOUR_IP:3001/api';

# Restart backend to listen on all interfaces
cd backend && node src/server.js
```

### **Fix 2: Clear All Caches**
```bash
# Clear Expo cache
npx expo start --clear

# Clear Metro cache
npx expo start --reset-cache

# Clear node modules
rm -rf node_modules package-lock.json
npm install
```

### **Fix 3: Port Conflicts**
```bash
# Kill all processes on port 3001
lsof -ti:3001 | xargs kill -9

# Kill all Expo processes
pkill -f "expo start"

# Restart services
cd backend && node src/server.js &
cd .. && npx expo start --lan
```

## 📞 **Getting Help**

### **Check Logs:**
1. **Backend Logs:** Terminal where you ran `node src/server.js`
2. **Mobile Logs:** Terminal where you ran `npx expo start`
3. **Expo Go Logs:** In the Expo Go app

### **Test Commands:**
```bash
# Run the test script
node test-auth.js

# Check network connectivity
curl http://192.168.0.208:3001/health

# Test OTP flow
curl -X POST http://192.168.0.208:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "type": "registration"}'
```

### **Common Error Messages:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Network request failed" | Wrong IP address | Update API_BASE_URL |
| "accountSid must start with AC" | Invalid Twilio config | Use development mode |
| "createTransporter is not a function" | Nodemailer version | Check package.json |
| "Unable to connect" | Network issues | Use --lan flag |

## ✅ **Success Indicators**

When everything is working correctly, you should see:

1. **Backend Server:**
   ```
   🚀 ClockIn Backend API running on port 3001
   📱 Network access: http://192.168.0.208:3001/health
   ```

2. **Mobile App:**
   - Opens without errors
   - Shows authentication screen
   - Can request OTP successfully

3. **OTP Flow:**
   - Phone number accepted
   - OTP code generated (logged to console)
   - Company verification works

---

**🎯 If you're still having issues, check the logs and run the test script to identify the specific problem!**
