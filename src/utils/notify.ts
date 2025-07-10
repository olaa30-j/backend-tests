import User from "../models/user.model";
import Notification from "../models/notification.model";
import { INotification } from "../Interfaces/notification.interface";
import mongoose from "mongoose";
import { sendMulticastNotification } from "../services/firebase.service";
import * as admin from "firebase-admin";

type PermissionAction = "view" | "update" | "delete" | "create";
type PermissionFilter = {
  entity: string;
  action: PermissionAction;
  value: boolean;
};

export async function notifyUsersWithPermission(
  permissionFilter: PermissionFilter,
  notificationData: Omit<INotification, "recipientId">
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const usersWithPermission = await User.find({
      permissions: {
        $elemMatch: {
          entity: permissionFilter.entity,
          [permissionFilter.action]: permissionFilter.value,
        },
      },
      _id: { $ne: notificationData.sender.id },
    })
      .select("_id fcmToken")
      .session(session);

    console.log("Found users:", usersWithPermission);

    if (usersWithPermission.length === 0) {
      console.log("No users found with permission:", permissionFilter);
      await session.commitTransaction();
      return [];
    }

    const usersWithTokens = usersWithPermission.filter((user) => user.fcmToken);
    const tokens = usersWithTokens.map((user) => user.fcmToken) as string[];

    const existingNotifications = await Notification.find({
      "entity.type": notificationData.entity.type,
    })
      .select("show")
      .session(session);

    console.log("Existing notifications:", existingNotifications);

    const notifications = await Notification.insertMany(
      usersWithPermission.map((user) => ({
        ...notificationData,
        recipientId: user._id,
        status: "sent",
        isWebDelivered: true,
        show: false,
      })),
      { session }
    );

    // Send push notifications if tokens exist
    if (!notificationData.entity?.id || !notificationData.entity?.type) {
      throw new Error("Notification entity must have both id and type defined");
    }

    if (tokens.length > 0) {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notificationData.action || "New Notification",
          body: notificationData.message,
        },
        data: {
          type: notificationData.entity.type,
          id: notificationData.entity.id.toString(),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
            },
          },
        },
      };

      await sendMulticastNotification(tokens, message);
    }

    await session.commitTransaction();
    return notifications;
  } catch (error) {
    console.error("Error in notifyUsersWithPermission:", error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}