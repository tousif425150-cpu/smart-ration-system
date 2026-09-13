# Production Deployment Guide: Smart Ration System

This guide outlines the steps to migrate the Smart Ration System from your local machine to a production cloud environment.

## 1. Cloud Infrastructure Selection

| Component | Recommended Provider | Why? |
| :--- | :--- | :--- |
| **Backend API** | [Render](https://render.com/) (Web Service) | Simple setup, free tier, automatic SSL. |
| **Database** | [Aiven for MySQL](https://aiven.io/mysql) | Free tier available, reliable MySQL support. |
| **Admin Panel** | [Render](https://render.com/) (Static Site) | High performance, free, integrated with Backend. |

---

## 2. Step-by-Step Migration

### **Step A: Database Setup**
1. Create a free MySQL instance on **Aiven** or **PlanetScale**.
2. Copy the connection string (e.g., `mysql://user:pass@host:port/dbname`).
3. **DO NOT RESET DATA**:
   - Use Prisma to migrate the schema to the cloud:
     ```bash
     cd backend
     npx prisma db push --accept-data-loss=false
     ```
   - *Note: `db push` will create tables without deleting data if possible. For the first time, it's safe.*

### **Step B: Backend Deployment**
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Configure **Environment Variables**:
   - `DATABASE_URL`: (Your Cloud MySQL URL)
   - `JWT_SECRET`: (A strong random string)
   - `NODE_ENV`: `production`
   - `FACE_MODELS_DIR`: `models/face`
4. Render will automatically detect the `package.json` and start the server using `npm run start`.

### **Step C: Admin Panel Deployment**
1. Create a new **Static Site** on Render.
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Set Environment Variable:
   - `VITE_API_URL`: (Your Backend URL from Step B)

---

## 3. Android Production Build

The Android app is now configured with two environments:

- **DEBUG**: Points to your laptop (for Wi-Fi testing).
- **RELEASE**: Points to the Cloud Backend.

### **How to build the Production APK:**
1. Open Android Studio Terminal.
2. Run:
   ```bash
   ./gradlew :app:assembleRelease
   ```
3. The APK will be generated at:
   `android-app/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 4. APK Public Download Page

To allow users to download the app directly via Chrome:

1. Create a simple HTML page (e.g., `index.html`) in a separate repo or on the same Render static site.
2. Upload the `app-release.apk` to a cloud storage (e.g., Google Drive, Dropbox, or a public folder on your server).
3. Provide a direct download button.

---

## 5. Verification Checklist

- [ ] **Login**: Test with `familytest01` / `password`.
- [ ] **Biometrics**: Verify face verification still works using cloud embeddings.
- [ ] **History**: Ensure no crashes when opening the history list.
- [ ] **Notifications**: Verify receipt of "Rice Entitlement Updated" alerts.
- [ ] **Admin**: Login to the public URL and manage families from any network.

---

> [!IMPORTANT]
> **Data Preservation**: I have updated the code to be production-ready without deleting any local data. The migration to Cloud MySQL is the only step that requires manual environment variable configuration.
