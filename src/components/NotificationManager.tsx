'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export function NotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        setIsLoading(true);
        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                console.warn('Push notification permission denied.');
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                await saveSubscriptionOnServer(existingSubscription);
                return;
            }

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                console.error("VAPID Key not found in environment. Please add NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
                alert("VAPID Key missing. Admin needs to configure push notifications.");
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            await saveSubscriptionOnServer(subscription);
            alert("Successfully enabled notifications!");

        } catch (error) {
            console.error('Failed to subscribe the user: ', error);
            alert("Failed to subscribe. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    const saveSubscriptionOnServer = async (subscription: PushSubscription) => {
        await fetch('/api/webpush/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    };

    if (!isSupported) return null;

    if (permission === 'granted') {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Notifications Active</span>
            </div>
        );
    }

    return (
        <button
            onClick={subscribeToPush}
            disabled={isLoading || permission === 'denied'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold shadow-sm border border-indigo-100 dark:border-indigo-800/30 transition-colors disabled:opacity-50"
            title={permission === 'denied' ? 'Notifications blocked by browser' : 'Enable notifications'}
        >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Enable Notifications</span>
        </button>
    );
}
