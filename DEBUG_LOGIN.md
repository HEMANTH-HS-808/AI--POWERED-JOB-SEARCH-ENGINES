# 🔍 Login Debug Guide

## ✅ **Current Status:**
- ✅ Backend server: Running on port 5000
- ✅ Frontend client: Running on port 3000  
- ✅ API endpoints: Working (tested with curl)
- ✅ Demo account: Exists in system

## 🧪 **Step-by-Step Debug Process:**

### **Step 1: Verify Both Servers Are Running**
1. Open http://localhost:3000 - Should show SkillSync homepage
2. Open http://localhost:5000/api/health - Should show `{"status":"OK"}`

### **Step 2: Test Login with Exact Demo Credentials**
1. Go to: http://localhost:3000/login
2. **IMPORTANT**: Use EXACTLY these credentials:
   - Email: `demo@skillsync.com`
   - Password: `demo123`
3. Click "Sign in"

### **Step 3: Check Browser Console for Errors**
1. Press F12 to open Developer Tools
2. Go to "Console" tab
3. Try logging in again
4. Look for any red error messages

### **Step 4: Check Network Tab**
1. In Developer Tools, go to "Network" tab
2. Try logging in again
3. Look for the login request to `/auth/login`
4. Check if it shows:
   - Status 200 (success) 
   - Status 400 (invalid credentials)
   - Status 500 (server error)
   - Failed to fetch (connection issue)

## 🎯 **Most Likely Issues & Solutions:**

### **Issue 1: Wrong Credentials**
- **Problem**: Using `chiranthn342@gmail.com` instead of demo account
- **Solution**: Use `demo@skillsync.com` / `demo123`

### **Issue 2: Server Connection**
- **Problem**: Frontend can't reach backend
- **Solution**: Verify both servers running, check CORS

### **Issue 3: Browser Cache**
- **Problem**: Old cached data interfering
- **Solution**: Hard refresh (Ctrl+Shift+R) or clear browser cache

### **Issue 4: Port Conflicts**
- **Problem**: Services running on wrong ports
- **Solution**: Restart both servers

## 🚀 **Quick Test Commands:**

### Test Backend Directly:
```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"demo@skillsync.com\",\"password\":\"demo123\"}"
```

### Expected Results:
- Health check: `{"status":"OK"}`
- Login: `{"message":"Login successful","token":"..."}`

## 📋 **What to Report Back:**

Please tell me:
1. ✅/❌ Can you access http://localhost:3000?
2. ✅/❌ Can you access http://localhost:5000/api/health?
3. What exact error message do you see when logging in?
4. Any errors in browser console (F12)?
5. What happens in Network tab when you try to login?

## 🎯 **Alternative: Register New Account**
If demo login still fails:
1. Click "Sign up for free"
2. Register with any email/password
3. Then login with your new credentials

**Let me know what you find and I'll help fix the specific issue!** 🔧