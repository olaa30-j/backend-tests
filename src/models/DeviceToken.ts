import { Schema, model } from 'mongoose';

interface IDeviceToken {
  userId: string;
  token: string;
  platform?: string;
}

const deviceTokenSchema = new Schema<IDeviceToken>({
  userId: { type: String, required: true },
  token: { type: String, required: true },
  platform: { type: String, default: 'android' }
});

export const DeviceToken = model<IDeviceToken>('DeviceToken', deviceTokenSchema);