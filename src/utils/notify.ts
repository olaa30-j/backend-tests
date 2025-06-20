import User from "../models/user.model";
import Notification from "../models/notification.model";
import { INotification } from "../Interfaces/notification.interface";
import mongoose from "mongoose";

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
      .select("_id")
      .session(session);

    console.log("Found users:", usersWithPermission);

    if (usersWithPermission.length === 0) {
      console.log("No users found with permission:", permissionFilter);
      await session.commitTransaction();
      return [];
    }

    const existingNotifications = await Notification.find({
      "entity.type": notificationData.entity.type,
    })
      .select("show")
      .session(session);

    console.log(existingNotifications);
    let firstShowStatus: boolean | undefined = false;
    if (existingNotifications.length !== 0) {
      firstShowStatus = existingNotifications[0].show;
    }
    // Create notifications
    const notifications = await Notification.insertMany(
      usersWithPermission.map((user) => ({
        ...notificationData,
        recipientId: user._id,
        status: "sent",
        isWebDelivered: true,
        show: firstShowStatus !== undefined ? firstShowStatus : false,
      })),
      { session }
    );
    console.log(notifications);

    await session.commitTransaction();
    return notifications;
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
