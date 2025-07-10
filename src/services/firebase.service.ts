import * as  admin from 'firebase-admin';
import { serviceAccount } from '../config/firebase-config';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    })
}

export const sendNotification = async (token: string, payload: admin.messaging.Message) => {
    try {
        const response = await admin.messaging().send(payload);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

export const sendMulticastNotification = async (tokens: string[], payload: admin.messaging.MulticastMessage) => {
    try {
        const response = await admin.messaging().sendEachForMulticast(payload);
        console.log('Successfully sent multicast message:', response);
        return response;
    } catch (error) {
        console.error('Error sending multicast message:', error);
        throw error;
    }
}