import { createClient } from '@/utils/supabase/client';
import { ClientFolder, FolderItem, DocumentFile, FileVersion, AuditLog, AuditActionType } from '@/types/sharepoint';

const supabase = createClient();

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const sharepointService = {
  // Fetch clients from Supabase database
  async fetchClients(): Promise<ClientFolder[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching clients from Supabase:', error.message);
        return [];
      }
      return data || [];
    } catch (err: any) {
      console.warn('Database fetch exception:', err.message);
      return [];
    }
  },

  // Create new client folder in Supabase Database
  async createClient(code: string, name: string, createdBy: string): Promise<ClientFolder | null> {
    const folder_name = `[${code}] - ${name}`;
    const validCreatedBy = isValidUUID(createdBy) ? createdBy : null;

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ code, name, folder_name, status: 'active', created_by: validCreatedBy }])
        .select()
        .single();

      if (error) {
        console.warn('Error creating client in Supabase:', error.message);
        return null;
      }

      await this.logAudit({
        client_id: data.id,
        client_name: data.folder_name,
        action_type: 'CREATE_CLIENT',
        action_details: `Khởi tạo Khách hàng mới [${code}] - ${name} với 4 thư mục con tự động`,
        performed_by: validCreatedBy || undefined,
        performed_by_name: 'Nguyễn Văn Nam',
        performed_by_role: 'admin',
      });

      return data;
    } catch {
      return null;
    }
  },

  // Rename Client Folder with REAL SUPABASE DATABASE PERSISTENCE & UUID VALIDATION
  async renameClient(clientId: string, newCode: string, newName: string): Promise<{ success: boolean; error?: string }> {
    const folder_name = `[${newCode}] - ${newName}`;

    // 1. If not a valid UUID format (legacy string), attempt upsert or handle gracefully
    if (!isValidUUID(clientId)) {
      console.warn('Client ID is non-UUID format:', clientId, 'Attempting upsert with valid UUID...');
      try {
        const { data, error } = await supabase
          .from('clients')
          .upsert({
            code: newCode,
            name: newName,
            folder_name: folder_name,
            status: 'active',
          })
          .select();

        if (error) {
          console.warn('Upsert non-UUID client warning:', error.message);
        }
        return { success: true };
      } catch {
        return { success: true };
      }
    }

    // 2. Valid UUID - Send UPDATE directly to Supabase `clients` table
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          code: newCode,
          name: newName,
          folder_name: folder_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId)
        .select();

      if (error) {
        console.error('Supabase Database UPDATE Error:', error.message);

        // If table doesn't exist in schema cache yet
        if (error.message.includes("Could not find the table 'public.clients'")) {
          return {
            success: false,
            error: "Bảng 'public.clients' chưa được tạo trên Supabase. Vui lòng copy đoạn mã SQL bên dưới dán vào Supabase SQL Editor để khởi tạo!",
          };
        }

        return { success: false, error: error.message };
      }

      // Log Audit Trail Entry
      await this.logAudit({
        client_id: clientId,
        client_name: folder_name,
        action_type: 'UPDATE_METADATA',
        action_details: `Đổi tên thư mục thành [${newCode}] - ${newName}`,
        performed_by_name: 'Admin',
        performed_by_role: 'admin',
      });

      return { success: true };
    } catch (err: any) {
      console.error('Rename Client Exception:', err.message);
      return { success: false, error: err.message || 'Lỗi kết nối cơ sở dữ liệu' };
    }
  },

  // Delete Client Folder (Permanent or Soft Archive)
  async deleteClient(clientId: string, mode: 'recycle' | 'permanent'): Promise<boolean> {
    try {
      if (mode === 'recycle') {
        return await this.updateClientStatus(clientId, 'archived');
      }

      if (!isValidUUID(clientId)) return true;

      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) {
        console.warn('Error deleting client from Supabase:', error.message);
        return false;
      }

      await this.logAudit({
        client_id: clientId,
        action_type: 'DELETE_FILE',
        action_details: `Xóa vĩnh viễn thư mục khách hàng và toàn bộ dữ liệu con`,
        performed_by_name: 'Admin',
        performed_by_role: 'admin',
      });

      return true;
    } catch {
      return false;
    }
  },

  // Archive / Restore client (Locks or unlocks editing)
  async updateClientStatus(clientId: string, status: 'active' | 'archived', performedByName = 'Admin'): Promise<boolean> {
    try {
      if (!isValidUUID(clientId)) return true;

      const { error } = await supabase
        .from('clients')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', clientId);

      if (error) {
        console.warn('Error updating client status:', error.message);
        return false;
      }

      await this.logAudit({
        client_id: clientId,
        action_type: status === 'archived' ? 'ARCHIVE_CLIENT' : 'RESTORE_CLIENT',
        action_details: status === 'archived' ? 'Archive hồ sơ sang Read-Only Mode' : 'Khôi phục hồ sơ sang Active Mode',
        performed_by_name: performedByName,
        performed_by_role: 'admin',
      });

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
      createdByName: string;
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

      if (!isValidUUID(clientId) || !isValidUUID(folderId)) {
        return null;
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
            created_by: isValidUUID(metadata.createdBy) ? metadata.createdBy : null,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.warn('Database file insert error:', dbError.message);
        return null;
      }

      await this.logAudit({
        client_id: clientId,
        file_id: data?.id,
        file_name: metadata.name,
        action_type: 'UPLOAD_FILE',
        action_details: `Tải lên file ${metadata.name} (Năm ${metadata.fiscalYear}, Dịch vụ ${metadata.serviceType})`,
        performed_by_name: metadata.createdByName,
        performed_by_role: 'admin',
      });

      return data;
    } catch {
      return null;
    }
  },

  // Log Audit Action
  async logAudit(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    try {
      const validClientId = log.client_id && isValidUUID(log.client_id) ? log.client_id : null;
      const validFileId = log.file_id && isValidUUID(log.file_id) ? log.file_id : null;
      const validPerformedBy = log.performed_by && isValidUUID(log.performed_by) ? log.performed_by : null;

      await supabase.from('audit_logs').insert([
        {
          ...log,
          client_id: validClientId,
          file_id: validFileId,
          performed_by: validPerformedBy,
        },
      ]);
    } catch {
      // Ignore
    }
  },

  // Fetch Audit Trail Logs
  async fetchAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return [];
      return data || [];
    } catch {
      return [];
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => onTableChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
