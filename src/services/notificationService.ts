// Web Push Notification Service
export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

// 브라우저의 기본 PushSubscription 타입 사용

export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 서비스 워커 등록
  public async registerServiceWorker(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', this.registration);
        return true;
      } else {
        console.warn('Service Worker not supported');
        return false;
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // 알림 권한 요청
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }

    if (Notification.permission === 'granted') {
      return { granted: true, denied: false, default: false };
    }

    if (Notification.permission === 'denied') {
      return { granted: false, denied: true, default: false };
    }

    const permission = await Notification.requestPermission();
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  // Push 구독 생성
  public async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        console.error('Service Worker not registered');
        return null;
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || 'BChsZnsKWxXHTuNZAmUlzuBvGvZsXEkb4-c92yJJBtOXDCiU0Q9-lZaHcFEt3Vc9eRNBsMlw67JJ3bO7nRC6ab4'
        )
      });

      this.subscription = subscription;
      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  // 구독 해제
  public async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.registration) {
        return false;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        this.subscription = null;
        console.log('Push subscription removed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  // 구독 상태 확인
  public async isSubscribed(): Promise<boolean> {
    try {
      if (!this.registration) {
        return false;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // 구독 정보를 서버에 전송
  public async sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (response.ok) {
        console.log('Subscription sent to server successfully');
        return true;
      } else {
        console.error('Failed to send subscription to server');
        return false;
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      return false;
    }
  }

  // 로컬 알림 표시 (테스트용)
  public async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'jira-local-notification',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  // VAPID 키 변환 (Base64 URL to Uint8Array)
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 알림 설정 초기화
  public async initialize(): Promise<boolean> {
    try {
      // 1. 서비스 워커 등록
      const swRegistered = await this.registerServiceWorker();
      if (!swRegistered) {
        return false;
      }

      // 2. 알림 권한 요청
      const permission = await this.requestPermission();
      if (!permission.granted) {
        console.warn('Notification permission not granted');
        return false;
      }

      // 3. Push 구독 생성
      const subscription = await this.subscribeToPush();
      if (!subscription) {
        return false;
      }

      // 4. 구독 정보를 서버에 전송
      const sentToServer = await this.sendSubscriptionToServer(subscription);
      if (!sentToServer) {
        console.warn('Failed to send subscription to server');
      }

      return true;
    } catch (error) {
      console.error('Notification service initialization failed:', error);
      return false;
    }
  }

  // 현재 구독 정보 가져오기
  public getCurrentSubscription(): PushSubscription | null {
    return this.subscription;
  }
}
