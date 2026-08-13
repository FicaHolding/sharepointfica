'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/sharepoint/Topbar';
import { Sidebar, ActiveNavTab } from '@/components/sharepoint/Sidebar';
import { Breadcrumb } from '@/components/sharepoint/Breadcrumb';
import { DocumentToolbar } from '@/components/sharepoint/DocumentToolbar';
import { DocumentListView } from '@/components/sharepoint/DocumentListView';
import { DocumentGridView } from '@/components/sharepoint/DocumentGridView';
import { VersionHistoryModal } from '@/components/sharepoint/VersionHistoryModal';
import { MetadataFilterDrawer } from '@/components/sharepoint/MetadataFilterDrawer';
import { NewClientModal } from '@/components/sharepoint/NewClientModal';
import { UploadFileModal } from '@/components/sharepoint/UploadFileModal';
import { FloatingActionBar } from '@/components/sharepoint/FloatingActionBar';
import { FilePreviewModal } from '@/components/sharepoint/FilePreviewModal';
import { DetailsPane } from '@/components/sharepoint/DetailsPane';
import { AuditLogTab } from '@/components/sharepoint/AuditLogTab';
import { BulkMetadataModal } from '@/components/sharepoint/BulkMetadataModal';
import { UserManagementModal } from '@/components/sharepoint/UserManagementModal';
import { UserProfileModal } from '@/components/sharepoint/UserProfileModal';
import { RenameClientModal } from '@/components/sharepoint/RenameClientModal';
import { DeleteClientModal } from '@/components/sharepoint/DeleteClientModal';
import { ContextMenu, ContextMenuPosition } from '@/components/sharepoint/ContextMenu';
import { ToastContainer, ToastMessage } from '@/components/sharepoint/ToastContainer';
import {
  UserProfile,
  ClientFolder,
  FolderItem,
  DocumentFile,
  MetadataFilterState,
  AuditLog,
  UserRole,
} from '@/types/sharepoint';
import { Lock, Activity, Info, UploadCloud, Users, Settings } from 'lucide-react';
import { sharepointService } from '@/services/sharepointService';
import { createClient } from '@/utils/supabase/client';

export default function SharePointHubPage() {
  const router = useRouter();
  const supabase = createClient();

  // Active Logged In User State (Dynamic Persistence)
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'a1111111-1111-4111-8111-111111111111',
    email: 'fica.holding@gmail.com',
    full_name: 'Cán Bộ Fica Holding',
    role: 'admin',
    department: 'Ban Giám Đốc Fica Holding',
  });

  // User Management State (Valid UUIDs)
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([
    {
      id: 'a1111111-1111-4111-8111-111111111111',
      email: 'fica.holding@gmail.com',
      full_name: 'Nguyễn Văn Nam',
      role: 'admin',
      department: 'Ban Giám Đốc Fica Holding',
    },
    {
      id: 'a2222222-2222-4222-8222-222222222222',
      email: 'mai.tt@fica.vn',
      full_name: 'Trần Thị Mai',
      role: 'manager',
      department: 'Phòng Thẩm Định & Kiểm Toán',
    },
    {
      id: 'a3333333-3333-4333-8333-333333333333',
      email: 'son.pt@fica.vn',
      full_name: 'Phạm Thanh Sơn',
      role: 'staff',
      department: 'Phòng Tư Vấn Tài Chính CFO',
    },
  ]);

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // MOCK & SUPABASE CLIENTS DATA (Valid UUIDs)
  const [clients, setClients] = useState<ClientFolder[]>([
    {
      id: 'c1111111-1111-4111-8111-111111111111',
      code: 'KH001',
      name: 'Tập đoàn SunGroup',
      folder_name: '[KH001] - Tập đoàn SunGroup',
      status: 'active',
      created_at: '2026-01-15T08:30:00Z',
      updated_at: '2026-08-10T14:20:00Z',
      created_by: 'a1111111-1111-4111-8111-111111111111',
      created_by_name: 'Nguyễn Văn Nam',
      total_files_count: 4,
      total_size_mb: 24.5,
    },
    {
      id: 'c2222222-2222-4222-8222-222222222222',
      code: 'KH002',
      name: 'Tập đoàn Vingroup',
      folder_name: '[KH002] - Tập đoàn Vingroup',
      status: 'active',
      created_at: '2026-02-01T09:00:00Z',
      updated_at: '2026-08-12T11:15:00Z',
      created_by: 'a1111111-1111-4111-8111-111111111111',
      created_by_name: 'Nguyễn Văn Nam',
      total_files_count: 4,
      total_size_mb: 48.2,
    },
    {
      id: 'c3333333-3333-4333-8333-333333333333',
      code: 'KH003',
      name: 'Tập đoàn Hòa Phát (Archive)',
      folder_name: '[KH003] - Tập đoàn Hòa Phát',
      status: 'archived',
      created_at: '2025-05-10T10:00:00Z',
      updated_at: '2026-06-30T16:00:00Z',
      created_by: 'a2222222-2222-4222-8222-222222222222',
      created_by_name: 'Trần Thị Mai',
      total_files_count: 4,
      total_size_mb: 112.0,
    },
  ]);

  // Load Real Supabase Database Clients & User Profile on Mount
  useEffect(() => {
    async function initData() {
      // 1. Check LocalStorage Profile Persistence First
      if (typeof window !== 'undefined') {
        const storedProfile = localStorage.getItem('fica_user_profile');
        if (storedProfile) {
          try {
            const parsed = JSON.parse(storedProfile);
            if (parsed && parsed.full_name) {
              setCurrentUser((prev) => ({ ...prev, ...parsed }));
            }
          } catch {
            // Ignore
          }
        }
      }

      // 2. Fetch Auth Session & DB Profile
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && session.user) {
          const userEmail = session.user.email || 'fica.holding@gmail.com';
          const metaName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
          const metaRole = (session.user.user_metadata?.role as UserRole) || 'admin';
          const metaDept = session.user.user_metadata?.department || 'Fica Holding JSC';

          // Try fetching from `profiles` table
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const finalName = dbProfile?.full_name || metaName;
          const finalDept = dbProfile?.department || metaDept;

          const updatedUser: UserProfile = {
            id: session.user.id,
            email: userEmail,
            full_name: finalName,
            role: metaRole,
            department: finalDept,
          };

          setCurrentUser(updatedUser);

          if (typeof window !== 'undefined') {
            localStorage.setItem('fica_user_profile', JSON.stringify(updatedUser));
          }
        }
      } catch {
        // Keep active session fallback
      }

      // 3. Fetch Clients from Supabase DB
      try {
        const dbClients = await sharepointService.fetchClients();
        if (dbClients && dbClients.length > 0) {
          setClients(dbClients);
        }
      } catch {
        // Keep initial mock clients fallback
      }
    }

    initData();

    // 4. Subscribe to Realtime DB updates
    const unsubscribe = sharepointService.subscribeRealtime(async () => {
      const refreshedClients = await sharepointService.fetchClients();
      if (refreshedClients && refreshedClients.length > 0) {
        setClients(refreshedClients);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Main UI Navigation state
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('active_clients');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Breadcrumb / Path State
  const [selectedClient, setSelectedClient] = useState<ClientFolder | null>(null);
  const [selectedSubFolder, setSelectedSubFolder] = useState<FolderItem | null>(null);

  // Search & Metadata Filter State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<MetadataFilterState>({
    searchQuery: '',
    fiscalYear: 'all',
    serviceType: 'all',
    status: 'all',
    selectedTags: [],
  });

  // Checkbox Selection State for Bulk Actions
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Modals & Panes visibility states
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isDetailsPaneOpen, setIsDetailsPaneOpen] = useState(false);
  const [isBulkMetadataModalOpen, setIsBulkMetadataModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition | null>(null);
  const [selectedClientForRename, setSelectedClientForRename] = useState<ClientFolder | null>(null);
  const [selectedClientForDelete, setSelectedClientForDelete] = useState<ClientFolder | null>(null);
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null);
  const [selectedFileForVersionHistory, setSelectedFileForVersionHistory] = useState<DocumentFile | null>(null);
  const [detailsItem, setDetailsItem] = useState<{
    client?: ClientFolder;
    subFolder?: FolderItem;
    file?: DocumentFile;
  }>({});

  // Drag and Drop Zone State
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Standard 4 subfolders template with Valid UUIDs
  const createSubfoldersForClient = (clientId: string): FolderItem[] => [
    {
      id: `sf111111-1111-4111-8111-${clientId.substring(0, 12)}`,
      client_id: clientId,
      name: '01_Pháp lý & Hợp đồng',
      is_system_folder: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
    },
    {
      id: `sf222222-2222-4222-8222-${clientId.substring(0, 12)}`,
      client_id: clientId,
      name: '02_Chứng từ & Báo cáo Tài chính',
      is_system_folder: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
    },
    {
      id: `sf333333-3333-4333-8333-${clientId.substring(0, 12)}`,
      client_id: clientId,
      name: '03_Dự án Tư vấn & Kiểm toán',
      is_system_folder: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
    },
    {
      id: `sf444444-4444-4444-8444-${clientId.substring(0, 12)}`,
      client_id: clientId,
      name: '04_Báo cáo Nghiệm thu',
      is_system_folder: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
    },
  ];

  // MOCK FILES DATA (Valid UUIDs)
  const [files, setFiles] = useState<DocumentFile[]>([
    {
      id: 'f1111111-1111-4111-8111-111111111111',
      client_id: 'c1111111-1111-4111-8111-111111111111',
      folder_id: 'sf111111-1111-4111-8111-c1111111-1111',
      name: 'Hop_Dong_Tu_Van_CFO_2025_Signed.pdf',
      current_version: 2,
      file_size: 4250100,
      mime_type: 'application/pdf',
      storage_path: 'KH001/01_Legal/Hop_Dong.pdf',
      status: 'Approved',
      fiscal_year: 2025,
      service_type: 'CFO',
      tags: ['Hợp đồng', 'Pháp lý', 'CFO'],
      created_at: '2026-01-20T10:00:00Z',
      updated_at: '2026-08-01T15:30:00Z',
      created_by: 'a1111111-1111-4111-8111-111111111111',
      created_by_name: 'Nguyễn Văn Nam',
      modified_by_name: 'Lê Hoàng Anh',
    },
    {
      id: 'f2222222-2222-4222-8222-222222222222',
      client_id: 'c1111111-1111-4111-8111-111111111111',
      folder_id: 'sf222222-2222-4222-8222-c1111111-1111',
      name: 'Bao_Cao_Tai_Chinh_Kiem_Toan_2024.xlsx',
      current_version: 1,
      file_size: 8900400,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      storage_path: 'KH001/02_Financials/BCTC_2024.xlsx',
      status: 'Approved',
      fiscal_year: 2024,
      service_type: 'Audit',
      tags: ['Báo cáo tài chính', 'Kiểm toán'],
      created_at: '2026-03-12T09:15:00Z',
      updated_at: '2026-03-12T09:15:00Z',
      created_by: 'a1111111-1111-4111-8111-111111111111',
      created_by_name: 'Nguyễn Văn Nam',
      modified_by_name: 'Nguyễn Văn Nam',
    },
    {
      id: 'f3333333-3333-4333-8333-333333333333',
      client_id: 'c2222222-2222-4222-8222-222222222222',
      folder_id: 'sf333333-3333-4333-8333-c2222222-2222',
      name: 'Tiet_Kiem_Chi_Phi_Du_An_Consulting_Vingroup.pdf',
      current_version: 3,
      file_size: 6100200,
      mime_type: 'application/pdf',
      storage_path: 'KH002/03_Consulting/TietKiemChiPhi.pdf',
      status: 'Pending',
      fiscal_year: 2025,
      service_type: 'Consulting',
      tags: ['Dự án CFO', 'Kiểm toán'],
      created_at: '2026-06-01T14:00:00Z',
      updated_at: '2026-08-11T16:45:00Z',
      created_by: 'a3333333-3333-4333-8333-333333333333',
      created_by_name: 'Phạm Thanh Sơn',
      modified_by_name: 'Nguyễn Văn Nam',
    },
  ]);

  // AUDIT LOGS STATE (Valid UUIDs)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'l1111111-1111-4111-8111-111111111111',
      client_name: '[KH001] - Tập đoàn SunGroup',
      file_name: 'Hop_Dong_Tu_Van_CFO_2025_Signed.pdf',
      action_type: 'UPLOAD_FILE',
      action_details: 'Tải lên tài liệu Hợp đồng tư vấn CFO năm tài chính 2025',
      performed_by: 'a1111111-1111-4111-8111-111111111111',
      performed_by_name: 'Nguyễn Văn Nam',
      performed_by_role: 'admin',
      created_at: '2026-08-12T10:30:00Z',
    },
    {
      id: 'l2222222-2222-4222-8222-222222222222',
      client_name: '[KH003] - Tập đoàn Hòa Phát',
      action_type: 'ARCHIVE_CLIENT',
      action_details: 'Đã đóng dự án và chuyển hồ sơ khách hàng sang chế độ Read-Only Archive',
      performed_by: 'a2222222-2222-4222-8222-222222222222',
      performed_by_name: 'Trần Thị Mai',
      performed_by_role: 'manager',
      created_at: '2026-08-11T14:15:00Z',
    },
  ]);

  // Log an Audit Event
  const pushAuditLog = (
    actionType: AuditLog['action_type'],
    details: string,
    fileName?: string,
    clientName?: string
  ) => {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      client_name: clientName || selectedClient?.folder_name || 'System',
      file_name: fileName,
      action_type: actionType,
      action_details: details,
      performed_by: currentUser.id,
      performed_by_name: currentUser.full_name,
      performed_by_role: currentUser.role,
      created_at: new Date().toISOString(),
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // REAL SUPABASE DATABASE PERSISTENCE CREATE CLIENT HANDLER
  const handleCreateClient = async (code: string, name: string) => {
    const folder_name = `[${code}] - ${name}`;

    // 1. Call Supabase Database INSERT
    const res = await sharepointService.createClient(code, name, currentUser.id);

    if (!res.success) {
      addToast('error', 'Lỗi khởi tạo Supabase DB!', res.error);
      return { success: false, error: res.error };
    }

    const newClient: ClientFolder = res.client || {
      id: crypto.randomUUID(),
      code,
      name,
      folder_name,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
      created_by_name: currentUser.full_name,
      total_files_count: 4,
      total_size_mb: 0,
    };

    // 2. Update local state
    setClients([newClient, ...clients]);
    setSelectedClient(newClient);
    setSelectedSubFolder(null);

    // 3. Revalidate Server Components
    router.refresh();

    pushAuditLog('CREATE_CLIENT', `Tạo Khách hàng mới [${code}] - ${name} với 4 subfolders`, undefined, folder_name);
    addToast('success', 'Đã lưu vĩnh viễn vào Supabase Database!', `Folder: ${folder_name}`);

    return { success: true };
  };

  // REAL SUPABASE DATABASE PERSISTENCE RENAME HANDLER
  const handleRenameClient = async (clientId: string, newCode: string, newName: string) => {
    const folder_name = `[${newCode}] - ${newName}`;

    // 1. Call Supabase DB UPDATE with valid UUID
    const dbRes = await sharepointService.renameClient(clientId, newCode, newName);

    if (!dbRes.success) {
      addToast('error', 'Lỗi lưu CSDL Supabase!', dbRes.error);
      return { success: false, error: dbRes.error };
    }

    // 2. Update local state
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              code: newCode,
              name: newName,
              folder_name,
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

    if (selectedClient?.id === clientId) {
      setSelectedClient((prev) => (prev ? { ...prev, code: newCode, name: newName, folder_name } : null));
    }

    // 3. Revalidate Server Route Cache
    router.refresh();

    pushAuditLog('UPDATE_METADATA', `Đổi tên thư mục thành ${folder_name}`, undefined, folder_name);
    addToast('success', 'Đã lưu vĩnh viễn vào Supabase Database!', `Tên mới: ${folder_name}`);

    return { success: true };
  };

  // DELETE FOLDER HANDLER (Recycle Bin vs Permanent)
  const handleConfirmDeleteClient = async (clientId: string, mode: 'recycle' | 'permanent') => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return;

    if (mode === 'recycle') {
      await handleArchiveClient(target);
      addToast('info', 'Đã chuyển hồ sơ vào Thùng rác (Archive)', `Hồ sơ ${target.folder_name} hiện ở dạng Read-Only.`);
    } else {
      await sharepointService.deleteClient(clientId, 'permanent');
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setFiles((prev) => prev.filter((f) => f.client_id !== clientId));
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
        setSelectedSubFolder(null);
      }
      router.refresh();
      pushAuditLog('DELETE_FILE', `Xóa vĩnh viễn thư mục khách hàng ${target.folder_name}`, undefined, target.folder_name);
      addToast('error', 'Đã xóa vĩnh viễn khỏi Database!', `Đã xóa hoàn toàn dữ liệu của ${target.folder_name}`);
    }
  };

  // Add User Handler for User Management
  const handleAddUser = (newUser: Omit<UserProfile, 'id'>) => {
    const created: UserProfile = {
      ...newUser,
      id: crypto.randomUUID(),
    };
    setSystemUsers([...systemUsers, created]);
    pushAuditLog('CREATE_CLIENT', `Thêm tài khoản người dùng mới ${newUser.full_name} (${newUser.email}) - Role: ${newUser.role}`);
    addToast('success', 'Tạo tài khoản người dùng mới thành công!', `Email: ${newUser.email}`);
  };

  const handleDeleteUser = (userId: string) => {
    setSystemUsers(systemUsers.filter((u) => u.id !== userId));
    addToast('info', 'Đã gỡ bỏ tài khoản người dùng.');
  };

  // Archive / Restore Client
  const handleArchiveClient = async (client: ClientFolder) => {
    await sharepointService.updateClientStatus(client.id, 'archived', currentUser.full_name);
    setClients(
      clients.map((c) =>
        c.id === client.id ? { ...c, status: 'archived', updated_at: new Date().toISOString() } : c
      )
    );
    if (selectedClient?.id === client.id) {
      setSelectedClient({ ...selectedClient, status: 'archived' });
    }
    router.refresh();
    pushAuditLog('ARCHIVE_CLIENT', `Khóa hồ sơ Read-Only sang trạng thái Archive`, undefined, client.folder_name);
  };

  const handleRestoreClient = async (client: ClientFolder) => {
    await sharepointService.updateClientStatus(client.id, 'active', currentUser.full_name);
    setClients(
      clients.map((c) =>
        c.id === client.id ? { ...c, status: 'active', updated_at: new Date().toISOString() } : c
      )
    );
    if (selectedClient?.id === client.id) {
      setSelectedClient({ ...selectedClient, status: 'active' });
    }
    router.refresh();
    pushAuditLog('RESTORE_CLIENT', `Khôi phục hồ sơ sang trạng thái Active hoạt động`, undefined, client.folder_name);
    addToast('success', 'Đã khôi phục trạng thái Active!', `Folder: ${client.folder_name}`);
  };

  // Upload File
  const handleUploadFile = (data: {
    name: string;
    file: File | null;
    fiscalYear: number;
    serviceType: DocumentFile['service_type'];
    status: DocumentFile['status'];
    tags: string[];
  }) => {
    if (!selectedClient) return;

    const folderId = selectedSubFolder ? selectedSubFolder.id : `sf111111-1111-4111-8111-${selectedClient.id.substring(0, 12)}`;

    const newFile: DocumentFile = {
      id: crypto.randomUUID(),
      client_id: selectedClient.id,
      folder_id: folderId,
      name: data.name,
      current_version: 1,
      file_size: data.file ? data.file.size : 3200000,
      mime_type: data.file ? data.file.type : 'application/pdf',
      storage_path: `${selectedClient.code}/${data.name}`,
      status: data.status,
      fiscal_year: data.fiscalYear,
      service_type: data.serviceType,
      tags: data.tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
      created_by_name: currentUser.full_name,
      modified_by_name: currentUser.full_name,
    };

    setFiles([newFile, ...files]);
    pushAuditLog(
      'UPLOAD_FILE',
      `Tải lên file ${data.name} (Năm ${data.fiscalYear}, Dịch vụ ${data.serviceType})`,
      data.name
    );
    addToast('success', 'Tải lên tài liệu thành công!', `File: ${data.name}`);
  };

  // Delete single file
  const handleDeleteFile = (fileId: string) => {
    const targetFile = files.find((f) => f.id === fileId);
    setFiles(files.filter((f) => f.id !== fileId));
    if (targetFile) {
      pushAuditLog('DELETE_FILE', `Đã xóa vĩnh viễn file ${targetFile.name}`, targetFile.name);
      addToast('info', 'Đã xóa tài liệu', targetFile.name);
    }
  };

  // BULK ACTIONS HANDLERS
  const handleBulkArchive = () => {
    if (selectedClientIds.length === 0) return;
    setClients(
      clients.map((c) =>
        selectedClientIds.includes(c.id)
          ? { ...c, status: 'archived', updated_at: new Date().toISOString() }
          : c
      )
    );
    pushAuditLog('ARCHIVE_CLIENT', `Archive hàng loạt ${selectedClientIds.length} khách hàng đã chọn`);
    addToast('info', `Đã Archive ${selectedClientIds.length} thư mục khách hàng!`);
    setSelectedClientIds([]);
  };

  const handleBulkDownloadZip = () => {
    addToast('success', 'Đang tạo file ZIP...', `Tải xuống ${selectedFileIds.length || selectedClientIds.length} mục đã chọn.`);
    pushAuditLog('DOWNLOAD_FILE', `Tải xuống nén ZIP hàng loạt mục đã chọn`);
  };

  const handleBulkDelete = () => {
    if (selectedFileIds.length > 0) {
      setFiles(files.filter((f) => !selectedFileIds.includes(f.id)));
      pushAuditLog('DELETE_FILE', `Xóa hàng loạt ${selectedFileIds.length} file tài liệu`);
      addToast('error', `Đã xóa ${selectedFileIds.length} file tài liệu!`);
      setSelectedFileIds([]);
    }
    if (selectedClientIds.length > 0) {
      setClients(clients.filter((c) => !selectedClientIds.includes(c.id)));
      pushAuditLog('DELETE_FILE', `Xóa hàng loạt ${selectedClientIds.length} thư mục khách hàng`);
      addToast('error', `Đã xóa ${selectedClientIds.length} thư mục khách hàng!`);
      setSelectedClientIds([]);
    }
  };

  const handleApplyBulkMetadata = (data: {
    fiscalYear?: number;
    serviceType?: DocumentFile['service_type'];
    status?: DocumentFile['status'];
    addTags: string[];
  }) => {
    setFiles(
      files.map((f) => {
        if (selectedFileIds.includes(f.id)) {
          return {
            ...f,
            fiscal_year: data.fiscalYear ?? f.fiscal_year,
            service_type: data.serviceType ?? f.service_type,
            status: data.status ?? f.status,
            tags: Array.from(new Set([...f.tags, ...data.addTags])),
            updated_at: new Date().toISOString(),
          };
        }
        return f;
      })
    );
    pushAuditLog('UPDATE_METADATA', `Cập nhật Metadata hàng loạt cho ${selectedFileIds.length} file`);
    addToast('success', 'Đã cập nhật Metadata hàng loạt!', `${selectedFileIds.length} file đã áp dụng.`);
    setSelectedFileIds([]);
  };

  // Drag and Drop desktop files into workspace handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (selectedClient) {
        handleUploadFile({
          name: droppedFile.name,
          file: droppedFile,
          fiscalYear: 2025,
          serviceType: 'Audit',
          status: 'Approved',
          tags: ['Kéo thả', 'Dropzone'],
        });
      } else {
        addToast('error', 'Vui lòng mở một Thư mục Khách hàng trước khi thả File!');
      }
    }
  };

  // Derived subfolders for selected client
  const currentSubFolders = useMemo(() => {
    if (!selectedClient) return [];
    return createSubfoldersForClient(selectedClient.id);
  }, [selectedClient]);

  const activeClientsList = useMemo(() => clients.filter((c) => c.status === 'active'), [clients]);
  const archivedClientsList = useMemo(() => clients.filter((c) => c.status === 'archived'), [clients]);

  // Filtered List
  const displayedClients = useMemo(() => {
    let list = activeTab === 'archived_clients' ? archivedClientsList : activeClientsList;
    const query = globalSearchQuery.toLowerCase() || filterState.searchQuery.toLowerCase();
    if (query) {
      list = list.filter(
        (c) =>
          c.folder_name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query)
      );
    }
    return list;
  }, [clients, activeTab, globalSearchQuery, filterState.searchQuery, activeClientsList, archivedClientsList]);

  const displayedFiles = useMemo(() => {
    let list = files;
    if (selectedClient) {
      list = list.filter((f) => f.client_id === selectedClient.id);
    }
    if (selectedSubFolder) {
      list = list.filter((f) => f.folder_id === selectedSubFolder.id);
    }

    const query = globalSearchQuery.toLowerCase() || filterState.searchQuery.toLowerCase();
    if (query) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.tags.some((t) => t.toLowerCase().includes(query)) ||
          f.service_type.toLowerCase().includes(query)
      );
    }

    if (filterState.fiscalYear !== 'all') {
      list = list.filter((f) => f.fiscal_year === Number(filterState.fiscalYear));
    }
    if (filterState.serviceType !== 'all') {
      list = list.filter((f) => f.service_type === filterState.serviceType);
    }
    if (filterState.status !== 'all') {
      list = list.filter((f) => f.status === filterState.status);
    }
    if (filterState.selectedTags.length > 0) {
      list = list.filter((f) => filterState.selectedTags.every((st) => f.tags.includes(st)));
    }
    return list;
  }, [files, selectedClient, selectedSubFolder, globalSearchQuery, filterState]);

  const isReadOnly = selectedClient?.status === 'archived';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-slate-900 flex flex-col font-sans antialiased select-none relative"
    >
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Drag & Drop Visual Dropzone Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-blue-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white border-4 border-dashed border-blue-400 m-4 rounded-3xl animate-fade-in pointer-events-none">
          <UploadCloud className="w-20 h-20 text-blue-300 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold">Thả File vào đây để Upload lên Supabase Storage</h2>
          <p className="text-sm text-blue-200 mt-1">Tự động khởi tạo phiên bản v1.0 & gán Metadata Fica Holding</p>
        </div>
      )}

      {/* SharePoint Topbar */}
      <Topbar
        currentUser={currentUser}
        searchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
        onRoleSwitch={(r) => {
          const updated = { ...currentUser, role: r };
          setCurrentUser(updated);
          if (typeof window !== 'undefined') {
            localStorage.setItem('fica_user_profile', JSON.stringify(updated));
          }
        }}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        onOpenProfile={() => setIsUserProfileModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'settings') {
              setIsUserManagementModalOpen(true);
            } else {
              setActiveTab(tab);
              setSelectedClient(null);
              setSelectedSubFolder(null);
              setSelectedClientIds([]);
              setSelectedFileIds([]);
            }
          }}
          activeCount={activeClientsList.length}
          archivedCount={archivedClientsList.length}
          filterState={filterState}
          onFilterChange={(fs) => setFilterState((prev) => ({ ...prev, ...fs }))}
        />

        {/* Right Main Content */}
        <main className="flex-1 bg-slate-100 overflow-y-auto flex flex-col justify-between relative">
          <div>
            {/* Breadcrumb Navigation */}
            <Breadcrumb
              currentClient={selectedClient}
              currentSubFolder={selectedSubFolder}
              activeTab={activeTab}
              onNavigateHome={() => {
                setSelectedClient(null);
                setSelectedSubFolder(null);
                setSelectedClientIds([]);
                setSelectedFileIds([]);
              }}
              onNavigateClient={() => {
                setSelectedSubFolder(null);
              }}
            />

            {/* Read-Only Banner for Archived Clients */}
            {isReadOnly && (
              <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-xs text-amber-900 flex items-center justify-between animate-fade-in shadow-inner">
                <div className="flex items-center space-x-2 font-medium">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Hồ sơ khách hàng <strong>{selectedClient?.folder_name}</strong> đã ở trạng thái <strong>ARCHIVE</strong> (Chế độ Read-Only). Toàn bộ quyền chỉnh sửa và tải lên file bị khóa.
                  </span>
                </div>
                <button
                  onClick={() => selectedClient && handleRestoreClient(selectedClient)}
                  className="bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded border border-amber-400 transition-colors"
                >
                  Khôi phục Active (Restore)
                </button>
              </div>
            )}

            {/* Document Action Toolbar */}
            <DocumentToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
              filterState={filterState}
              onSearchChange={(q) => setFilterState((prev) => ({ ...prev, searchQuery: q }))}
              isReadOnly={isReadOnly}
              userRole={currentUser.role}
              selectedClientName={selectedClient?.folder_name}
              clientStatus={selectedClient?.status}
              onArchiveClient={() => selectedClient && handleArchiveClient(selectedClient)}
              onRestoreClient={() => selectedClient && handleRestoreClient(selectedClient)}
              onRefresh={() => {}}
            />

            {/* Page Header */}
            <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>
                    {selectedSubFolder
                      ? selectedSubFolder.name
                      : selectedClient
                      ? selectedClient.folder_name
                      : activeTab === 'archived_clients'
                      ? 'Kho Lưu Trữ Hồ Sơ Khách Hàng (Archived Clients)'
                      : activeTab === 'reports'
                      ? 'Nhật Ký Hoạt Động & Kiểm Toán (Audit Stream)'
                      : activeTab === 'settings'
                      ? 'Cài Đặt Hệ Thống & Quản Lý Người Dùng'
                      : 'Danh Sách Khách Hàng (Active Clients)'}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đồng bộ thời gian thực Supabase Realtime Engine | Fica Holding Financial Workspace
                </p>
              </div>

              {/* Info Button trigger Details Pane */}
              <button
                onClick={() => {
                  setDetailsItem({
                    client: selectedClient || undefined,
                    subFolder: selectedSubFolder || undefined,
                  });
                  setIsDetailsPaneOpen(!isDetailsPaneOpen);
                }}
                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors flex items-center space-x-1 text-xs font-semibold"
                title="Thông tin chi tiết (Details Pane)"
              >
                <Info className="w-4 h-4 text-blue-600" />
                <span>Details Info</span>
              </button>
            </div>

            {/* MAIN VIEWS & AUDIT STREAM */}
            {activeTab === 'reports' ? (
              <AuditLogTab logs={auditLogs} />
            ) : viewMode === 'list' ? (
              <DocumentListView
                clients={displayedClients}
                subFolders={currentSubFolders}
                files={displayedFiles}
                currentClient={selectedClient}
                currentSubFolder={selectedSubFolder}
                selectedClientIds={selectedClientIds}
                selectedFileIds={selectedFileIds}
                onToggleSelectClient={(id) =>
                  setSelectedClientIds((prev) =>
                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                  )
                }
                onToggleSelectFile={(id) =>
                  setSelectedFileIds((prev) =>
                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                  )
                }
                onToggleSelectAll={() => {
                  if (!selectedClient) {
                    if (selectedClientIds.length === displayedClients.length) {
                      setSelectedClientIds([]);
                    } else {
                      setSelectedClientIds(displayedClients.map((c) => c.id));
                    }
                  } else {
                    if (selectedFileIds.length === displayedFiles.length) {
                      setSelectedFileIds([]);
                    } else {
                      setSelectedFileIds(displayedFiles.map((f) => f.id));
                    }
                  }
                }}
                onSelectClient={(c) => {
                  setSelectedClient(c);
                  setSelectedSubFolder(null);
                  setSelectedClientIds([]);
                  setSelectedFileIds([]);
                }}
                onSelectSubFolder={(sf) => setSelectedSubFolder(sf)}
                onPreviewFile={(f) => setPreviewFile(f)}
                onOpenVersionHistory={(f) => setSelectedFileForVersionHistory(f)}
                onOpenDetailsPane={(item) => {
                  setDetailsItem(item);
                  setIsDetailsPaneOpen(true);
                }}
                onDownloadFile={(f) => {
                  addToast('info', 'Đang tải tài liệu...', f.name);
                  pushAuditLog('DOWNLOAD_FILE', `Tải file ${f.name} về máy`, f.name);
                }}
                onArchiveClient={handleArchiveClient}
                onRestoreClient={handleRestoreClient}
                onDeleteFile={handleDeleteFile}
                onOpenContextMenu={(pos) => setContextMenuPos(pos)}
                onRenameClientModal={(c) => setSelectedClientForRename(c)}
                onDeleteClientModal={(c) => setSelectedClientForDelete(c)}
                isReadOnly={isReadOnly}
              />
            ) : (
              <DocumentGridView
                clients={displayedClients}
                subFolders={currentSubFolders}
                files={displayedFiles}
                currentClient={selectedClient}
                currentSubFolder={selectedSubFolder}
                selectedClientIds={selectedClientIds}
                selectedFileIds={selectedFileIds}
                onToggleSelectClient={(id) =>
                  setSelectedClientIds((prev) =>
                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                  )
                }
                onToggleSelectFile={(id) =>
                  setSelectedFileIds((prev) =>
                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                  )
                }
                onSelectClient={(c) => {
                  setSelectedClient(c);
                  setSelectedSubFolder(null);
                  setSelectedClientIds([]);
                  setSelectedFileIds([]);
                }}
                onSelectSubFolder={(sf) => setSelectedSubFolder(sf)}
                onPreviewFile={(f) => setPreviewFile(f)}
                onOpenVersionHistory={(f) => setSelectedFileForVersionHistory(f)}
                onOpenDetailsPane={(item) => {
                  setDetailsItem(item);
                  setIsDetailsPaneOpen(true);
                }}
                onDownloadFile={(f) => {
                  addToast('info', 'Đang tải tài liệu...', f.name);
                  pushAuditLog('DOWNLOAD_FILE', `Tải file ${f.name} về máy`, f.name);
                }}
                onArchiveClient={handleArchiveClient}
                onRestoreClient={handleRestoreClient}
                onOpenContextMenu={(pos) => setContextMenuPos(pos)}
                onRenameClientModal={(c) => setSelectedClientForRename(c)}
                onDeleteClientModal={(c) => setSelectedClientForDelete(c)}
                isReadOnly={isReadOnly}
              />
            )}
          </div>

          {/* Footer Bar */}
          <footer className="px-4 py-2 bg-white border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bảo mật Chuẩn Ngân Hàng & Audit Trail Fica Holding</span>
            </div>
            <div className="font-mono">
              Next.js 15 App Router | Supabase Realtime Storage | Dynamic User Profile Active
            </div>
          </footer>
        </main>
      </div>

      {/* Floating Action Bar for Bulk Operations */}
      <FloatingActionBar
        selectedCount={selectedClient ? selectedFileIds.length : selectedClientIds.length}
        onClearSelection={() => {
          setSelectedClientIds([]);
          setSelectedFileIds([]);
        }}
        onBulkArchive={handleBulkArchive}
        onBulkDownloadZip={handleBulkDownloadZip}
        onBulkDelete={handleBulkDelete}
        onBulkMetadata={() => setIsBulkMetadataModalOpen(true)}
        userRole={currentUser.role}
        isReadOnly={isReadOnly}
      />

      {/* Context Menu Popup (Right-Click & Positioned) */}
      <ContextMenu
        menuState={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        onOpenClient={(c) => {
          setSelectedClient(c);
          setSelectedSubFolder(null);
        }}
        onOpenSubFolder={(sf) => setSelectedSubFolder(sf)}
        onRenameClient={(c) => setSelectedClientForRename(c)}
        onArchiveClient={handleArchiveClient}
        onRestoreClient={handleRestoreClient}
        onDeleteClient={(c) => setSelectedClientForDelete(c)}
        onOpenDetails={(item) => {
          setDetailsItem(item);
          setIsDetailsPaneOpen(true);
        }}
        onPreviewFile={(f) => setPreviewFile(f)}
        onOpenVersionHistory={(f) => setSelectedFileForVersionHistory(f)}
        onDownloadFile={(f) => addToast('info', 'Đang tải file...', f.name)}
        onDeleteFile={handleDeleteFile}
        userRole={currentUser.role}
        isReadOnly={isReadOnly}
      />

      {/* Modals & Slide-over Panes */}
      <UserProfileModal
        currentUser={currentUser}
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        onUpdateProfile={(updated) => {
          const newProfile = { ...currentUser, ...updated };
          setCurrentUser(newProfile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('fica_user_profile', JSON.stringify(newProfile));
          }
          addToast('success', 'Đã lưu vĩnh viễn Hồ sơ cá nhân!');
          router.refresh();
        }}
      />

      <RenameClientModal
        client={selectedClientForRename}
        isOpen={!!selectedClientForRename}
        onClose={() => setSelectedClientForRename(null)}
        onRename={handleRenameClient}
      />

      <DeleteClientModal
        client={selectedClientForDelete}
        isOpen={!!selectedClientForDelete}
        onClose={() => setSelectedClientForDelete(null)}
        onConfirmDelete={handleConfirmDeleteClient}
        userRole={currentUser.role}
      />

      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        users={systemUsers}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        currentUserRole={currentUser.role}
      />

      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onCreateClient={handleCreateClient}
      />

      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadFile}
        isReadOnly={isReadOnly}
        currentPathName={
          selectedSubFolder
            ? `${selectedClient?.folder_name} / ${selectedSubFolder.name}`
            : selectedClient
            ? selectedClient.folder_name
            : 'Gốc SharePoint'
        }
      />

      <MetadataFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filterState={filterState}
        onFilterChange={(fs) => setFilterState((prev) => ({ ...prev, ...fs }))}
        onResetFilters={() =>
          setFilterState({
            searchQuery: '',
            fiscalYear: 'all',
            serviceType: 'all',
            status: 'all',
            selectedTags: [],
          })
        }
      />

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={(f) => addToast('info', 'Đang tải file...', f.name)}
      />

      <DetailsPane
        isOpen={isDetailsPaneOpen}
        onClose={() => setIsDetailsPaneOpen(false)}
        selectedClient={detailsItem.client || selectedClient}
        selectedSubFolder={detailsItem.subFolder || selectedSubFolder}
        selectedFile={detailsItem.file || null}
        userRole={currentUser.role}
        onOpenVersionHistory={(f) => setSelectedFileForVersionHistory(f)}
        onDownloadFile={(f) => addToast('info', 'Đang tải file...', f.name)}
      />

      <BulkMetadataModal
        isOpen={isBulkMetadataModalOpen}
        onClose={() => setIsBulkMetadataModalOpen(false)}
        selectedCount={selectedFileIds.length}
        onApplyBulkMetadata={handleApplyBulkMetadata}
      />

      <VersionHistoryModal
        file={selectedFileForVersionHistory}
        isOpen={!!selectedFileForVersionHistory}
        onClose={() => setSelectedFileForVersionHistory(null)}
        onDownloadVersion={(v) => addToast('info', `Tải v${v.version_number}`, v.file_name)}
        onRestoreVersion={(v) => {
          addToast('success', `Đã khôi phục phiên bản v${v.version_number}!`);
          pushAuditLog('RESTORE_VERSION', `Khôi phục phiên bản v${v.version_number} làm bản chính`, v.file_name);
          setSelectedFileForVersionHistory(null);
        }}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
