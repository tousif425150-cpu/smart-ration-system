const admin = require('firebase-admin');
import path from 'path';
import fs from 'fs';

let isFcmInitialized = false;

export const initializeFcm = () => {
  if (isFcmInitialized) return;

  const serviceAccountPath = path.join(process.cwd(), 'firebase-key.json');

  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isFcmInitialized = true;
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
    }
  } else {
    console.warn('FCM NOT INITIALIZED: firebase-key.json not found in root. Push notifications will be skipped.');
  }
};

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data: any = {}
) => {
  if (!isFcmInitialized) return;

  try {
    const message = {
      notification: { title, body },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      token,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent push notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

export const sendPushToMultiple = async (
  tokens: string[],
  title: string,
  body: string,
  data: any = {}
) => {
  if (!isFcmInitialized || tokens.length === 0) return;

  try {
    const message = {
      notification: { title, body },
      data,
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent push notifications to ${response.successCount} devices.`);
    return response;
  } catch (error) {
    console.error('Error sending multicast push notification:', error);
  }
};
