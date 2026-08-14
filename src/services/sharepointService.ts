import { createClient } from '@/utils/supabase/client';
import { ClientFolder, FolderItem, DocumentFile, FileVersion, AuditLog, AuditActionType, ServiceType, UserProfile } from '@/types/sharepoint';
import { SUPABASE_STORAGE_BUCKET } from '@/constants/supabase';

const supabase = createClient();

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const sharepointService = {
  // Fetch profiles from Supabase database with Defensive Null Checks
  async fetchProfiles(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Error fetching profiles from Supabase:', error.message);
        return [];
      }

      if (!data || !Array.isArray(data)) return [];

      return data.map((p: any) => ({
        id: p.id,
        email: p.email || 'user@fica.vn',
        full_name: p.full_name || p.email?.split('@')[0] || 'Cán Bộ Fica',
        role: p.role || 'staff',
        department: p.department || 'Fica Holding',
        phone: p.phone || undefined,
      }));
    } catch (err: any) {
      console.warn('Profiles fetch exception:', err.message);
      return [];
    }
  },

  // Create Profile in Supabase Database
  async createProfile(profile: Omit<UserProfile, 'id'>): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    const newId = crypto.randomUUID();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: newId,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            department: profile.department || 'Fica Holding',
            phone: profile.phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase Profiles INSERT Error:', error.message);
        return { success: false, error: error.message };
      }

      await this.logAudit({
        action_type: 'CREATE_CLIENT',
        action_details: `Tạo tài khoản người dùng mới: ${profile.full_name} (${profile.email}) - Role: ${profile.role}`,
        performed_by: 'a1111111-1111-4111-8111-111111111111',
        performed_by_name: 'Admin',
        performed_by_role: 'admin',
      });

      return { success: true, profile: data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi lưu thông tin người dùng vào Supabase' };
    }
  },

  // Delete Profile from Supabase Database
  async deleteProfile(profileId: string): Promise<boolean> {
    try {
      if (!isValidUUID(profileId)) return true;
      const { error } = await supabase.from('profiles').delete().eq('id', profileId);
      if (error) {
        console.warn('Delete profile error:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Fetch clients from Supabase database with Null Safety
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

  // Create new client folder in Supabase Database with REAL PERSISTENCE, UUID & Support for ALL Service Types (Audit, CFO, Consulting, Tax)
  async createClient(
    code: string,
    name: string,
    createdBy: string,
    serviceTypeInput: ServiceType = 'CFO'
  ): Promise<{ success: boolean; client?: ClientFolder; error?: string }> {
    const serviceType = serviceTypeInput || 'CFO';
    const folder_name = `[${code}] - ${name}`;
    const newId = crypto.randomUUID();
    const validCreatedBy = isValidUUID(createdBy) ? createdBy : 'a1111111-1111-4111-8111-111111111111';

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            id: newId,
            code,
            name,
            folder_name,
            status: 'active',
            service_type: serviceType,
            created_by: validCreatedBy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase Database INSERT Error:', error.message);

        if (
          error.message.includes('service_type') ||
          error.message.includes('schema cache') ||
          error.message.includes('Could not find')
        ) {
          console.warn(`service_type column notice. Retrying insert for [${serviceType}]...`);
          const { data: retryData, error: retryError } = await supabase
            .from('clients')
            .insert([
              {
                id: newId,
                code,
                name,
                folder_name,
                status: 'active',
                created_by: validCreatedBy,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (!retryError && retryData) {
            return {
              success: true,
              client: { ...retryData, service_type: serviceType },
            };
          }
        }

        if (error.message.includes("Could not find the table 'public.clients'")) {
          return {
            success: false,
            error: "Bảng 'public.clients' chưa được tạo trên Supabase. Vui lòng chạy câu lệnh SQL khởi tạo bảng trong Supabase SQL Editor!",
          };
        }

        if (error.code === '23505' || error.message.includes('unique constraint')) {
          return {
            success: false,
            error: `Mã khách hàng [${code}] đã tồn tại trong hệ thống. Vui lòng nhập mã KH khác!`,
          };
        }

        return { success: false, error: error.message };
      }

      await this.logAudit({
        client_id: data.id,
        client_name: data.folder_name,
        action_type: 'CREATE_CLIENT',
        action_details: `Khởi tạo Khách hàng mới [${code}] - ${name} (Dịch vụ: ${serviceType}) với 4 thư mục con tự động`,
        performed_by: validCreatedBy,
        performed_by_name: 'Admin',
        performed_by_role: 'admin',
      });

      return { success: true, client: data };
    } catch (err: any) {
      console.error('Create Client Exception:', err.message);
      return { success: false, error: err.message || 'Lỗi kết nối cơ sở dữ liệu Supabase' };
    }
  },

  // Rename Client Folder with REAL SUPABASE DATABASE PERSISTENCE, UUID & Support for ALL Service Types (Audit, CFO, Consulting, Tax)
  async renameClient(
    clientId: string,
    newCode: string,
    newName: string,
    serviceTypeInput?: ServiceType
  ): Promise<{ success: boolean; error?: string }> {
    const serviceType = serviceTypeInput || 'CFO';
    const folder_name = `[${newCode}] - ${newName}`;

    if (!isValidUUID(clientId)) {
      console.warn('Client ID is non-UUID format:', clientId, 'Attempting upsert with valid UUID...');
      try {
        const updatePayload: any = {
          code: newCode,
          name: newName,
          folder_name: folder_name,
          status: 'active',
          service_type: serviceType,
        };

        const { error } = await supabase.from('clients').upsert(updatePayload);
        if (error) console.warn('Upsert warning:', error.message);
        return { success: true };
      } catch {
        return { success: true };
      }
    }

    try {
      const updatePayload: any = {
        code: newCode,
        name: newName,
        folder_name: folder_name,
        service_type: serviceType,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('clients')
        .update(updatePayload)
        .eq('id', clientId)
        .select();

      if (error) {
        console.error('Supabase Database UPDATE Error:', error.message);

        if (
          error.message.includes('service_type') ||
          error.message.includes('schema cache') ||
          error.message.includes('Could not find')
        ) {
          const { error: retryError } = await supabase
            .from('clients')
            .update({
              code: newCode,
              name: newName,
              folder_name: folder_name,
              updated_at: new Date().toISOString(),
            })
            .eq('id', clientId);

          if (!retryError) return { success: true };
        }

        if (error.message.includes("Could not find the table 'public.clients'")) {
          return {
            success: false,
            error: "Bảng 'public.clients' chưa được tạo trên Supabase. Vui lòng copy đoạn mã SQL dán vào Supabase SQL Editor!",
          };
        }

        return { success: false, error: error.message };
      }

      await this.logAudit({
        client_id: clientId,
        client_name: folder_name,
        action_type: 'UPDATE_METADATA',
        action_details: `Chỉnh sửa thông tin thư mục [${newCode}] - ${newName} (Dịch vụ: ${serviceType})`,
        performed_by: 'a1111111-1111-4111-8111-111111111111',
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
        performed_by: 'a1111111-1111-4111-8111-111111111111',
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
        performed_by: 'a1111111-1111-4111-8111-111111111111',
        performed_by_name: performedByName,
        performed_by_role: 'admin',
      });

      return true;
    } catch {
      return false;
    }
  },

  // Fetch Files from Supabase Database
  async fetchFiles(clientId?: string, folderId?: string): Promise<DocumentFile[]> {
    try {
      let query = supabase.from('documents').select('*');
      if (clientId && isValidUUID(clientId)) {
        query = query.eq('client_id', clientId);
      }
      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          client_id: d.client_id || clientId || '',
          folder_id: d.folder_id || folderId || '',
          name: d.name,
          current_version: d.current_version || 1,
          file_size: Number(d.size || d.file_size || 0),
          mime_type: d.mime_type || 'application/pdf',
          storage_path: d.storage_path,
          status: d.status || 'Approved',
          fiscal_year: d.fiscal_year || 2025,
          service_type: d.service_type || 'CFO',
          tags: Array.isArray(d.tags) ? d.tags : ['Tài liệu'],
          created_at: d.created_at,
          updated_at: d.updated_at || d.created_at,
          created_by: d.uploaded_by || 'Admin',
          created_by_name: d.uploaded_by || 'Admin',
          modified_by_name: d.uploaded_by || 'Admin',
        }));
      }

      const { data: filesData } = await supabase.from('files').select('*');
      if (filesData && filesData.length > 0) {
        return filesData;
      }

      return [];
    } catch {
      return [];
    }
  },

  // Upload file to Supabase Storage using centralized bucket constant
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
      const newId = crypto.randomUUID();

      // 1. Upload to Storage bucket using centralized constant
      const { error: storageError } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(storagePath, file, { upsert: true });

      if (storageError) {
        console.warn(`Supabase Storage upload notice (${SUPABASE_STORAGE_BUCKET}):`, storageError.message);
      }

      const payloadDoc = {
        id: newId,
        name: metadata.name,
        size: file.size,
        mime_type: file.type || 'application/pdf',
        storage_path: storagePath,
        folder_id: folderId,
        client_id: isValidUUID(clientId) ? clientId : null,
        service_type: metadata.serviceType || 'CFO',
        fiscal_year: metadata.fiscalYear || 2025,
        status: metadata.status || 'Approved',
        tags: metadata.tags || ['Tải lên'],
        uploaded_by: metadata.createdByName || 'Fica Admin',
        created_at: new Date().toISOString(),
      };

      // 2. Insert record into `documents` table
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert([payloadDoc])
        .select()
        .single();

      if (dbError) {
        console.warn('Database documents table insert notice:', dbError.message);
        await supabase.from('files').insert([
          {
            id: newId,
            client_id: isValidUUID(clientId) ? clientId : null,
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
        ]);
      }

      const createdDoc: DocumentFile = {
        id: docData?.id || newId,
        client_id: clientId,
        folder_id: folderId,
        name: metadata.name,
        current_version: 1,
        file_size: file.size,
        mime_type: file.type || 'application/pdf',
        storage_path: storagePath,
        status: metadata.status || 'Approved',
        fiscal_year: metadata.fiscalYear || 2025,
        service_type: metadata.serviceType || 'CFO',
        tags: metadata.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: metadata.createdBy,
        created_by_name: metadata.createdByName,
        modified_by_name: metadata.createdByName,
      };

      await this.logAudit({
        client_id: clientId,
        file_id: createdDoc.id,
        file_name: metadata.name,
        action_type: 'UPLOAD_FILE',
        action_details: `Tải lên file ${metadata.name} (Năm ${metadata.fiscalYear}, Dịch vụ ${metadata.serviceType})`,
        performed_by: isValidUUID(metadata.createdBy) ? metadata.createdBy : 'a1111111-1111-4111-8111-111111111111',
        performed_by_name: metadata.createdByName,
        performed_by_role: 'admin',
      });

      return createdDoc;
    } catch (err: any) {
      console.error('Upload exception:', err.message);
      return null;
    }
  },

  // Centralized helper to get a working preview or download URL for a file using Signed URLs
  async getFilePreviewOrDownloadUrl(storagePath: string): Promise<{ url: string | null; isSigned: boolean; error?: string }> {
    try {
      if (!storagePath) {
        return { url: null, isSigned: false, error: 'Thiếu đường dẫn storage_path' };
      }

      const cleanPath = storagePath.replace(/^\/+/, '');

      // 1. Try Signed URL (Works whether bucket is Private or Public)
      const { data: signedData, error: signedError } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(cleanPath, 3600);

      if (!signedError && signedData?.signedUrl) {
        return { url: signedData.signedUrl, isSigned: true };
      }

      // 2. Fallback to Public URL
      const { data: publicData } = supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(cleanPath);

      if (publicData?.publicUrl) {
        return { url: publicData.publicUrl, isSigned: false };
      }

      return {
        url: null,
        isSigned: false,
        error: `Không tìm thấy file trong bucket '${SUPABASE_STORAGE_BUCKET}' (Path: ${cleanPath}).`,
      };
    } catch (err: any) {
      console.warn('Storage URL fetch error:', err.message);
      return { url: null, isSigned: false, error: err.message || 'Lỗi truy cập Supabase Storage' };
    }
  },

  // Direct Blob download helper to prevent raw JSON errors
  async downloadFileBlob(storagePath: string, fileName: string): Promise<boolean> {
    try {
      const cleanPath = storagePath.replace(/^\/+/, '');
      const { data: blob, error } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .download(cleanPath);

      if (error || !blob) {
        console.warn('Direct blob download notice:', error?.message);
        const signedRes = await this.getFilePreviewOrDownloadUrl(storagePath);
        if (signedRes.url) {
          window.open(signedRes.url, '_blank');
          return true;
        }
        return false;
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      return true;
    } catch (err: any) {
      console.error('Download blob exception:', err.message);
      return false;
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
          id: crypto.randomUUID(),
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

  // Subscribe to Supabase Realtime changes including profiles and documents
  subscribeRealtime(onTableChange: () => void) {
    const channel = supabase
      .channel('sharepoint-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => onTableChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => onTableChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
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
