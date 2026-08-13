import { createClient } from '@/utils/supabase/client';
import { ClientFolder, FolderItem, DocumentFile, FileVersion } from '@/types/sharepoint';

const supabase = createClient();

export const sharepointService = {
  // Fetch clients from Supabase database
  async fetchClients(): Promise<ClientFolder[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Using mock clients fallback:', error.message);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  // Create new client folder (Trigger automatically creates 4 subfolders)
  async createClient(code: string, name: string, createdBy: string): Promise<ClientFolder | null> {
    const folder_name = `[${code}] - ${name}`;
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ code, name, folder_name, status: 'active', created_by: createdBy }])
        .select()
        .single();

      if (error) {
        console.warn('Error creating client in Supabase:', error.message);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  // Archive / Restore client (Locks or unlocks editing)
  async updateClientStatus(clientId: string, status: 'active' | 'archived'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', clientId);

      if (error) {
        console.warn('Error updating client status:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Upload file to Supabase Storage and register file record in DB
  async uploadFile(
    file: File,
    clientId: string,
    folderId: string,
    metadata: {
      name: string;
      fiscalYear: number;
      serviceType: DocumentFile['service_type'];
      status: DocumentFile['status'];
      tags: string[];
      createdBy: string;
    }
  ): Promise<DocumentFile | null> {
    try {
      const storagePath = `${clientId}/${Date.now()}_${file.name}`;
      
      // 1. Upload to Storage bucket
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { upsert: true });

      if (storageError) {
        console.warn('Storage upload error:', storageError.message);
      }

      // 2. Insert record into `files` table
      const { data, error: dbError } = await supabase
        .from('files')
        .insert([
          {
            client_id: clientId,
            folder_id: folderId,
            name: metadata.name,
            current_version: 1,
            file_size: file.size,
            mime_type: file.type || 'application/pdf',
            storage_path: storagePath,
            status: metadata.status,
            fiscal_year: metadata.fiscalYear,
            service_type: metadata.serviceType,
            tags: metadata.tags,
            created_by: metadata.createdBy,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.warn('Database file insert error:', dbError.message);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  },

  // Download File public/signed URL
  async getFileDownloadUrl(storagePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage.from('documents').getPublicUrl(storagePath);
      return data?.publicUrl || null;
    } catch {
      return null;
    }
  },

  // Subscribe to Supabase Realtime changes
  subscribeRealtime(onTableChange: () => void) {
    const channel = supabase
      .channel('sharepoint-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => onTableChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'files' },
        () => onTableChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
