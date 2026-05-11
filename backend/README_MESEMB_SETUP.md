# MeSomb Setup Guide - HandymanWest

## 🚀 QUICK START

### 1. Install MeSomb SDK
```bash
cd backend
pip3 install pymesomb
```

### 2. Set Environment Variables
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your actual MeSomb credentials
MESOMB_ACCESS_KEY=your_real_access_key
MESOMB_SECRET_KEY=your_real_secret_key
MESOMB_APPLICATION_KEY=your_real_app_key
MESOMB_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Start Development Server
```bash
python manage.py runserver
```

### 4. Setup ngrok for Webhooks
```bash
# Install ngrok
pip3 install pyngrok

# Start ngrok in separate terminal
ngrok http 8000

# Copy ngrok URL and update .env
NGROK_URL=https://abc123.ngrok.io
```

### 5. Configure MeSomb Dashboard
1. Login to https://dashboard.mesomb.com
2. Go to Settings → API Keys → Copy your keys
3. Go to Settings → Security → Add your server IP
4. Go to Settings → Webhooks → Add webhook URLs:
   - Payment Success: https://abc123.ngrok.io/api/payments/webhooks/success/
   - Payment Failed: https://abc123.ngrok.io/api/payments/webhooks/failed/
   - Transfer Success: https://abc123.ngrok.io/api/payments/webhooks/transfer/
   - Balance Update: https://abc123.ngrok.io/api/payments/webhooks/balance/

## 🔧 TESTING

### Test Payment Flow
1. Open mobile app → Go to booking details
2. Click "Mark as Completed"
3. Select payment provider (Orange/MTN)
4. Enter phone number (validated in real-time)
5. Submit → Check Django logs for webhook calls

### Check Logs
```bash
# Monitor Django logs for webhook activity
tail -f logs/django.log
```

## 🌐 PRODUCTION DEPLOYMENT

When ready for production:
1. Change `MESOMB_ENVIRONMENT=production` in .env
2. Get SSL certificate for your domain
3. Update webhook URLs to use your domain
4. Remove ngrok, use real domain URLs

## 📋 CHECKLIST

- [ ] Install pymesomb SDK
- [ ] Get MeSomb API keys
- [ ] Set environment variables in .env
- [ ] Whitelist server IP in MeSomb
- [ ] Configure webhooks in MeSomb dashboard
- [ ] Test payment flow with ngrok
- [ ] Verify webhook reception in logs
- [ ] Deploy to production with SSL

## 🆘 TROUBLESHOOTING

### Webhook Not Received
- Check ngrok is running
- Verify webhook URLs in MeSomb dashboard
- Check Django logs for errors
- Ensure port 8000 is accessible

### Payment Processing Issues
- Verify API keys are correct
- Check MeSomb account balance
- Test with small amounts first
- Review MeSomb transaction logs
