import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

const apps = getApps();

if (!apps.length) {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    const serviceAccount = JSON.parse(
      readFileSync(serviceAccountPath, 'utf8')
    );
    
    initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n')
      })
    });

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    console.error('Current working directory:', process.cwd());
    throw new Error('Failed to initialize Firebase Admin. Check your serviceAccountKey.json file location.');
  }
}

export const adminDb = getFirestore(); 