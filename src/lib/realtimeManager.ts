import { createClient } from '@/utils/supabase/client';

type RealtimeCallback = () => void;

class RealtimeManager {
  private static instance: RealtimeManager | null = null;
  private channel: any = null;
  private isSubscribed = false;
  private listeners: Set<RealtimeCallback> = new Set();

  private constructor() {}

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  public subscribe(callback: RealtimeCallback): () => void {
    this.listeners.add(callback);
    this.ensureChannelSubscribed();

    // Return cleanup subscriber function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private ensureChannelSubscribed() {
    if (typeof window === 'undefined') return;
    if (this.isSubscribed && this.channel) return;

    try {
      const supabase = createClient();

      // SINGLETON CHANNEL INSTANCE: Register ALL .on() handlers 100% BEFORE calling .subscribe()
      this.channel = supabase
        .channel('fica-global-realtime-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => this.notifyListeners())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => this.notifyListeners())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, () => this.notifyListeners())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => this.notifyListeners())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, () => this.notifyListeners())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => this.notifyListeners());

      this.channel.subscribe((status: any, err: any) => {
        if (err) {
          console.warn('RealtimeManager channel status notice:', status, err);
        } else if (status === 'SUBSCRIBED') {
          this.isSubscribed = true;
        }
      });

      this.isSubscribed = true;
    } catch (err) {
      console.warn('RealtimeManager channel setup notice:', err);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error('Realtime listener error:', err);
      }
    });
  }

  public destroy() {
    if (this.channel) {
      try {
        const supabase = createClient();
        supabase.removeChannel(this.channel);
      } catch {
        // Ignore cleanup error
      }
      this.channel = null;
      this.isSubscribed = false;
    }
  }
}

export const realtimeManager = RealtimeManager.getInstance();
