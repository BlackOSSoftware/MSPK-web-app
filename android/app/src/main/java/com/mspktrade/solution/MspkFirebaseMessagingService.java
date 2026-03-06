package com.mspktrade.solution;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class MspkFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "mspk-alerts";

    @Override
    public void onMessageReceived(RemoteMessage message) {
        String title = null;
        String body = null;

        if (message.getNotification() != null) {
            title = message.getNotification().getTitle();
            body = message.getNotification().getBody();
        }

        Map<String, String> data = message.getData();
        if (title == null && data != null) {
            title = data.get("title");
        }
        if (body == null && data != null) {
            body = data.get("body");
        }

        if (title == null) {
            title = "MSPK Trading Solutions";
        }
        if (body == null) {
            body = "You have a new notification.";
        }

        createChannelIfNeeded();

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent);

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify((int) System.currentTimeMillis(), builder.build());
        }
    }

    private void createChannelIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "MSPK Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Trading alerts and system notifications");
            manager.createNotificationChannel(channel);
        }
    }
}
