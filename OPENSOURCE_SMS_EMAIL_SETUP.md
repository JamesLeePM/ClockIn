# 📱📧 Open-Source SMS & Email Setup Guide

## 🎯 **Overview**

We've configured ClockIn to use **free, open-source alternatives** to expensive services like Twilio:

- **📱 SMS**: TextBelt (Free tier available)
- **📧 Email**: EmailJS (Free tier available)

## 📱 **SMS Setup with TextBelt**

### **Step 1: Get TextBelt API Key**

1. **Visit**: https://textbelt.com/
2. **Free Tier**: 1 SMS per day (perfect for testing)
3. **Paid Tier**: $0.10 per SMS (much cheaper than Twilio)
4. **Get API Key**: Purchase or use free tier

### **Step 2: Configure Environment**

```bash
cd backend
cp env.example .env
```

Edit `.env` file:
```env
# TextBelt Configuration
TEXTBELT_API_KEY=your-textbelt-api-key-here
```

### **Step 3: Test SMS**

```bash
# Test SMS sending
curl -X POST http://192.168.0.208:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "type": "registration"}'
```

## 📧 **Email Setup with EmailJS**

### **Step 1: Create EmailJS Account**

1. **Visit**: https://www.emailjs.com/
2. **Sign Up**: Free account
3. **Connect Email Service**: Gmail, Outlook, etc.

### **Step 2: Create Email Template**

1. **Go to**: Email Templates
2. **Create New Template**:
   ```html
   <h2>ClockIn Verification Code</h2>
   <p>Hello,</p>
   <p>Your ClockIn verification code is: <strong>{{otp_code}}</strong></p>
   <p>This code expires in 5 minutes.</p>
   <p>If you didn't request this code, please ignore this email.</p>
   <p>Best regards,<br>ClockIn Team</p>
   ```

### **Step 3: Get Credentials**

1. **Service ID**: From Email Services
2. **Template ID**: From Email Templates  
3. **Public Key**: From Account Settings

### **Step 4: Configure Environment**

Edit `.env` file:
```env
# EmailJS Configuration
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
```

## 🚀 **Quick Setup (5 Minutes)**

### **Option 1: Use Free Tiers (Testing)**

```bash
# 1. Update .env file
cd backend
echo "TEXTBELT_API_KEY=textbelt" >> .env
echo "EMAILJS_SERVICE_ID=your-service-id" >> .env
echo "EMAILJS_TEMPLATE_ID=your-template-id" >> .env
echo "EMAILJS_PUBLIC_KEY=your-public-key" >> .env

# 2. Restart backend
pkill -f "node.*server.js"
node src/server.js
```

### **Option 2: Production Setup**

1. **TextBelt**: Purchase API key ($0.10/SMS)
2. **EmailJS**: Free tier (200 emails/month)
3. **Configure**: Update .env with real credentials

## 🧪 **Testing**

### **Test SMS (Real Phone Number)**

```bash
# Replace with your real phone number
curl -X POST http://192.168.0.208:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "type": "registration"}'
```

### **Test Email (Real Email Address)**

```bash
# Replace with your real email
curl -X POST http://192.168.0.208:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "email": "your-email@gmail.com", "type": "registration"}'
```

## 💰 **Cost Comparison**

| Service | Free Tier | Paid Tier | Cost per SMS/Email |
|---------|-----------|-----------|-------------------|
| **TextBelt** | 1 SMS/day | $0.10/SMS | $0.10 |
| **EmailJS** | 200 emails/month | $20/month | $0.10 |
| **Twilio** | Trial only | $0.0075/SMS | $0.0075 |
| **SendGrid** | 100 emails/day | $14.95/month | $0.15 |

## 🔧 **Troubleshooting**

### **SMS Not Working**

1. **Check API Key**: Verify TextBelt API key
2. **Phone Format**: Use +1234567890 format
3. **Rate Limits**: Free tier = 1 SMS/day
4. **Fallback**: App logs OTP to console

### **Email Not Working**

1. **Check Credentials**: Verify EmailJS settings
2. **Template**: Ensure template exists
3. **Service**: Verify email service connection
4. **Fallback**: App logs OTP to console

### **Development Mode**

In development, both services fallback to console logging:
```
📱 SMS OTP for +1234567890: 123456
📧 Email OTP for user@example.com: 123456
```

## 🎯 **Production Deployment**

### **Environment Variables**

```env
# Production settings
NODE_ENV=production
TEXTBELT_API_KEY=your-production-api-key
EMAILJS_SERVICE_ID=your-production-service-id
EMAILJS_TEMPLATE_ID=your-production-template-id
EMAILJS_PUBLIC_KEY=your-production-public-key
```

### **Monitoring**

- **SMS Success Rate**: Monitor TextBelt dashboard
- **Email Delivery**: Monitor EmailJS dashboard
- **Fallback Logs**: Check server logs for failures

## ✅ **Benefits of Open-Source Approach**

1. **💰 Cost Effective**: Much cheaper than Twilio
2. **🔧 Easy Setup**: No complex configuration
3. **📊 Transparent**: Open-source, no vendor lock-in
4. **🚀 Scalable**: Can switch providers easily
5. **🛡️ Reliable**: Fallback to console logging

---

**🎉 Your ClockIn app now supports real SMS and Email delivery using open-source services!**
