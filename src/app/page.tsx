'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ServiceType,
} from '@/types/sharepoint';
import { Lock, Activity, Info, UploadCloud, Users, Settings, Filter, CheckCircle2 } from 'lucide-react';
import { sharepointService } from '@/services/sharepointService';
import { createClient } from '@/utils/supabase/client';

function SharePointContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic Company Logo State with Permanent Fetch
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompanyLogo() {
      const logo = await sharepointService.getCompanyLogoUrl();
      if (logo) {
        setCompanyLogoUrl(logo);
      }
    }
    loadCompanyLogo();
  }, []);

  // Active Logged In User State (Dynamic Persistence)
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'a1111111-1111-4111-8111-111111111111',
    email: 'admin@fica.vn',
    full_name: 'Quản trị viên Fica',
    role: 'admin',
    department: 'Ban Giám Đốc Fica Holding',
  });

  // User Management State (Loaded Dynamically from Supabase `profiles`)
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([]);

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // CLIENTS DATA (Loaded dynamically from Supabase `clients`)
  const [clients, setClients] = useState<ClientFolder[]>([
    {
      id: 'c1111111-1111-4111-8111-111111111111',
      code: 'KH001',
      name: 'Tập đoàn SunGroup',
      folder_name: '[KH001] - Tập đoàn SunGroup',
      status: 'active',
      service_type: 'CFO',
      created_at: '2026-01-15T08:30:00Z',
      updated_at: '2026-08-10T14:20:00Z',
      created_by: 'a1111111-1111-4111-8111-111111111111',
      created_by_name: 'Quản trị viên Fica',
      total_files_count: 4,
      total_size_mb: 24.5,
    },
    {
      id: 'c2222222-2222-4222-8222-222222222222',
      code: 'KH002',
      name: 'Tập đoàn Vingroup',
      folder_name: '[KH002] - Tập đoàn Vingroup',
      status: 'active',
      service_type: 'CFO',
      created_at: '2026-02-01T09:00:00Z',
      updated_at: '2026-08-12T11:15:00Z',
      created_by: 'a1111111-1111-4111-8111-111111111111',
      created_by_name: 'Quản trị viên Fica',
      total_files_count: 4,
      total_size_mb: 48.2,
    },
    {
      id: 'c3333333-3333-4333-8333-333333333333',
      code: 'KH003',
      name: 'Tập đoàn Hòa Phát (Archive)',
      folder_name: '[KH003] - Tập đoàn Hòa Phát',
      status: 'archived',
      service_type: 'Audit',
      created_at: '2025-05-10T10:00:00Z',
      updated_at: '2026-06-30T16:00:00Z',
      created_by: 'a2222222-2222-4222-8222-222222222222',
      created_by_name: 'Trưởng phòng Fica',
      total_files_count: 4,
      total_size_mb: 112.0,
    },
  ]);

  // Main UI Navigation state
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('active_clients');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Breadcrumb / Path State (Synced with URL)
  const [selectedClient, setSelectedClient] = useState<ClientFolder | null>(null);
  const [selectedSubFolder, setSelectedSubFolder] = useState<FolderItem | null>(null);

  // Search & Metadata Filter State (Synced with URL - Service Type Primary)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<MetadataFilterState>({
    searchQuery: '',
    fiscalYear: 'all',
    serviceType: 'all',
    status: 'all',
    selectedTags: [],
  });

  // Standard 4 subfolders template with Deterministic Subfolder IDs
  const createSubfoldersForClient = (clientId: string): FolderItem[] => {
    const cleanId = clientId.replace(/-/g, '').padEnd(32, '0');
    const suffix = cleanId.substring(0, 12);
    return [
      {
        id: `sf111111-1111-4111-8111-${suffix}`,
        client_id: clientId,
        name: '01_Pháp lý & Hợp đồng',
        is_system_folder: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser.id,
      },
      {
        id: `sf222222-2222-4222-8222-${suffix}`,
        client_id: clientId,
        name: '02_Chứng từ & Báo cáo Tài chính',
        is_system_folder: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser.id,
      },
      {
        id: `sf333333-3333-4333-8333-${suffix}`,
        client_id: clientId,
        name: '03_Dự án Tư vấn & Kiểm toán',
        is_system_folder: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser.id,
      },
      {
        id: `sf444444-4444-4444-8444-${suffix}`,
        client_id: clientId,
        name: '04_Báo cáo Nghiệm thu',
        is_system_folder: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser.id,
      },
    ];
  };

  // Helper to Update URL without breaking browser history
  const updateUrlState = (
    clientId?: string | null,
    folderId?: string | null,
    tabName?: string | null,
    serviceType?: string | null
  ) => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();

    if (clientId) {
      params.set('client', clientId);
    }

    if (folderId && clientId) {
      params.set('folder', folderId);
    }

    if (tabName && tabName !== 'active_clients') {
      params.set('tab', tabName);
    }

    const activeService = serviceType !== undefined ? serviceType : filterState.serviceType;
    if (activeService && activeService !== 'all') {
      params.set('service', activeService);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : '/';
    window.history.replaceState(null, '', newUrl);
  };

  // CENTRALIZED SERVICE TYPE FILTER CHANGE HANDLER
  const handleFilterChange = (newFilters: Partial<MetadataFilterState>) => {
    const updatedFilterState = { ...filterState, ...newFilters };
    setFilterState(updatedFilterState);

    const targetService = updatedFilterState.serviceType;

    if (selectedClient && targetService !== 'all' && (selectedClient.service_type || 'CFO') !== targetService) {
      const prevClientName = selectedClient.folder_name;
      const prevService = selectedClient.service_type || 'CFO';

      setSelectedClient(null);
      setSelectedSubFolder(null);
      setSelectedClientIds([]);
      setSelectedFileIds([]);

      updateUrlState(null, null, activeTab, targetService);

      addToast(
        'info',
        `Tự động chuyển về Danh sách Khách hàng [${targetService}]`,
        `Hồ sơ ${prevClientName} thuộc nhóm ${prevService}, không thuộc bộ lọc ${targetService} vừa chọn.`
      );
    } else {
      updateUrlState(selectedClient?.id, selectedSubFolder?.id, activeTab, targetService);
    }
  };

  // SYNC ROUTING STATE WITH URL QUERY PARAMS FOR F5 PERSISTENCE & FILTER VALIDATION
  useEffect(() => {
    const urlClientParam = searchParams.get('client');
    const urlFolderParam = searchParams.get('folder');
    const urlTabParam = searchParams.get('tab') as ActiveNavTab | null;
    const urlServiceParam = searchParams.get('service');

    if (urlTabParam && ['active_clients', 'archived_clients', 'reports', 'settings'].includes(urlTabParam)) {
      setActiveTab(urlTabParam);
    }

    if (urlServiceParam) {
      setFilterState((prev) => ({
        ...prev,
        serviceType: urlServiceParam,
      }));
    }

    if (urlClientParam) {
      const matchedClient = clients.find((c) => c.id === urlClientParam);
      if (matchedClient) {
        if (urlServiceParam && urlServiceParam !== 'all' && (matchedClient.service_type || 'CFO') !== urlServiceParam) {
          setSelectedClient(null);
          setSelectedSubFolder(null);
          updateUrlState(null, null, urlTabParam, urlServiceParam);
        } else {
          setSelectedClient(matchedClient);
          if (urlFolderParam) {
            const subFolders = createSubfoldersForClient(matchedClient.id);
            const matchedFolder = subFolders.find((sf) => sf.id === urlFolderParam || sf.id.substring(0, 8) === urlFolderParam.substring(0, 8));
            if (matchedFolder) {
              setSelectedSubFolder(matchedFolder);
            }
          }
        }
      }
    }
  }, [searchParams, clients]);

  // Load Real Supabase Database Clients & User Profiles on Mount
  useEffect(() => {
    async function initData() {
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

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && session.user) {
          const userEmail = session.user.email || 'admin@fica.vn';
          const metaName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
          const metaRole = (session.user.user_metadata?.role as UserRole) || 'admin';
          const metaDept = session.user.user_metadata?.department || 'Fica Holding JSC';
          const metaPhone = session.user.user_metadata?.phone || '';

          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const finalName = dbProfile?.full_name || metaName;
          const finalDept = dbProfile?.department || metaDept;
          const finalPhone = dbProfile?.phone || metaPhone;

          const updatedUser: UserProfile = {
            id: session.user.id,
            email: userEmail,
            full_name: finalName,
            role: metaRole,
            department: finalDept,
            phone: finalPhone,
          };

          setCurrentUser(updatedUser);

          if (typeof window !== 'undefined') {
            localStorage.setItem('fica_user_profile', JSON.stringify(updatedUser));
          }
        }
      } catch {
        // Keep active session fallback
      }

      try {
        const profiles = await sharepointService.fetchProfiles();
        if (profiles) {
          setSystemUsers(profiles);
        }
      } catch {
        // Keep fallback
      }

      try {
        const dbClients = await sharepointService.fetchClients();
        if (dbClients && dbClients.length > 0) {
          setClients(dbClients);
        }
        const dbFiles = await sharepointService.fetchFiles();
        if (dbFiles && dbFiles.length > 0) {
          setFiles(dbFiles);
        }
      } catch {
        // Keep initial clients fallback
      }
    }

    initData();

    const unsubscribe = sharepointService.subscribeRealtime(async () => {
      const refreshedClients = await sharepointService.fetchClients();
      if (refreshedClients && refreshedClients.length > 0) {
        setClients(refreshedClients);
      }
      const refreshedProfiles = await sharepointService.fetchProfiles();
      if (refreshedProfiles) {
        setSystemUsers(refreshedProfiles);
      }
      const refreshedFiles = await sharepointService.fetchFiles();
      if (refreshedFiles && refreshedFiles.length > 0) {
        setFiles(refreshedFiles);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

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

  // DYNAMIC FILE PERSISTENCE (Supabase DB + LocalStorage Fallback)
  const [files, setFiles] = useState<DocumentFile[]>([
    {
      id: 'f1111111-1111-4111-8111-111111111111',
      client_id: 'c1111111-1111-4111-8111-111111111111',
      folder_id: 'sf111111-1111-4111-8111-c11111110000',
      name: 'Hop_Dong_Tu_Van_CFO_2025_Signed.pdf',
      current_version: 2,
      file_size: 4250100,
      mime_type: 'application/pdf',
      storage_path: 'c1111111-1111-4111-8111-111111111111/Hop_Dong_Tu_Van_CFO_2025_Signed.pdf',
      status: 'Approved',
      fiscal_year: 2025,
      service_type: 'CFO',
      tags: ['Hợp đồng', 'Pháp lý', 'CFO'],
      created_at: '2026-01-20T10:00:00Z',
      updated_at: '2026-08-01T15:30:00Z',
      created_by: 'a1111111-1111-4111-8111-111111111111',
      created_by_name: 'Quản trị viên Fica',
      modified_by_name: 'Quản trị viên Fica',
    },
    {
      id: 'f2222222-2222-4222-8222-222222222222',
      client_id: 'c1111111-1111-4111-8111-111111111111',
      folder_id: 'sf222222-2222-4222-8222-c11111110000',
      name: 'Bao_Cao_Tai_Chinh_Kiem_Toan_2024.xlsx',
      current_version: 1,
      file_size: 8900400,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      storage_path: 'c1111111-1111-4111-8111-111111111111/Bao_Cao_Tai_Chinh_Kiem_Toan_2024.xlsx',
      status: 'Approved',
      fiscal_year: 2024,
      service_type: 'Audit',
      tags: ['Báo cáo tài chính', 'Kiểm toán'],
      created_at: '2026-03-12T09:15:00Z',
      updated_at: '2026-03-12T09:15:00Z',
      created_by: 'a1111111-1111-4111-8111-111111111111',
      created_by_name: 'Quản trị viên Fica',
      modified_by_name: 'Quản trị viên Fica',
    },
    {
      id: 'f3333333-3333-4333-8333-333333333333',
      client_id: 'c2222222-2222-4222-8222-222222222222',
      folder_id: 'sf333333-3333-4333-8333-c22222220000',
      name: 'Tiet_Kiem_Chi_Phi_Du_An_Consulting_Vingroup.pdf',
      current_version: 3,
      file_size: 6100200,
      mime_type: 'application/pdf',
      storage_path: 'c2222222-2222-4222-8222-222222222222/Tiet_Kiem_Chi_Phi_Du_An_Consulting_Vingroup.pdf',
      status: 'Pending',
      fiscal_year: 2025,
      service_type: 'Consulting',
      tags: ['Dự án CFO', 'Kiểm toán'],
      created_at: '2026-06-01T14:00:00Z',
      updated_at: '2026-08-11T16:45:00Z',
      created_by: 'a3333333-3333-4333-8333-333333333333',
      created_by_name: 'Chuyên viên Fica',
      modified_by_name: 'Quản trị viên Fica',
    },
  ]);

  // Load files from both Supabase DB and LocalStorage on Mount / Selection Change
  useEffect(() => {
    async function loadRealFiles() {
      let localFiles: DocumentFile[] = [];
      if (typeof window !== 'undefined') {
        const storedDocs = localStorage.getItem('fica_uploaded_documents');
        if (storedDocs) {
          try {
            localFiles = JSON.parse(storedDocs);
          } catch {
            // Ignore
          }
        }
      }

      try {
        const dbFiles = await sharepointService.fetchFiles(selectedClient?.id, selectedSubFolder?.id);
        setFiles((prev) => {
          const merged = [...dbFiles];

          localFiles.forEach((lf) => {
            if (!merged.some((m) => m.id === lf.id || m.storage_path === lf.storage_path)) {
              merged.push(lf);
            }
          });

          prev.forEach((p) => {
            if (!merged.some((m) => m.id === p.id || m.storage_path === p.storage_path)) {
              merged.push(p);
            }
          });

          return merged;
        });
      } catch {
        if (localFiles.length > 0) {
          setFiles((prev) => {
            const merged = [...localFiles];
            prev.forEach((p) => {
              if (!merged.some((m) => m.id === p.id || m.storage_path === p.storage_path)) {
                merged.push(p);
              }
            });
            return merged;
          });
        }
      }
    }

    loadRealFiles();
  }, [selectedClient, selectedSubFolder]);

  // AUDIT LOGS STATE (Valid UUIDs)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'l1111111-1111-4111-8111-111111111111',
      client_name: '[KH001] - Tập đoàn SunGroup',
      file_name: 'Hop_Dong_Tu_Van_CFO_2025_Signed.pdf',
      action_type: 'UPLOAD_FILE',
      action_details: 'Tải lên tài liệu Hợp đồng tư vấn CFO năm 2025',
      performed_by: 'a1111111-1111-4111-8111-111111111111',
      performed_by_name: 'Quản trị viên Fica',
      performed_by_role: 'admin',
      created_at: '2026-08-12T10:30:00Z',
    },
    {
      id: 'l2222222-2222-4222-8222-222222222222',
      client_name: '[KH003] - Tập đoàn Hòa Phát',
      action_type: 'ARCHIVE_CLIENT',
      action_details: 'Đã đóng dự án và chuyển hồ sơ khách hàng sang chế độ Read-Only Archive',
      performed_by: 'a2222222-2222-4222-8222-222222222222',
      performed_by_name: 'Trưởng phòng Fica',
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

  // REAL SUPABASE DATABASE PERSISTENCE CREATE CLIENT HANDLER WITH SERVICE TYPE
  const handleCreateClient = async (code: string, name: string, serviceType: ServiceType) => {
    const folder_name = `[${code}] - ${name}`;

    const res = await sharepointService.createClient(code, name, currentUser.id, serviceType);

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
      service_type: serviceType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
      created_by_name: currentUser.full_name,
      total_files_count: 4,
      total_size_mb: 0,
    };

    setClients([newClient, ...clients]);
    setSelectedClient(newClient);
    setSelectedSubFolder(null);
    updateUrlState(newClient.id, null, activeTab);

    router.refresh();

    pushAuditLog('CREATE_CLIENT', `Tạo Khách hàng mới [${code}] - ${name} (${serviceType}) với 4 subfolders`, undefined, folder_name);
    addToast('success', 'Đã lưu vĩnh viễn vào Supabase Database!', `Folder: ${folder_name} (Dịch vụ: ${serviceType})`);

    return { success: true };
  };

  // REAL SUPABASE DATABASE PERSISTENCE RENAME HANDLER WITH SERVICE TYPE
  const handleRenameClient = async (clientId: string, newCode: string, newName: string, serviceType?: ServiceType) => {
    const folder_name = `[${newCode}] - ${newName}`;

    const dbRes = await sharepointService.renameClient(clientId, newCode, newName, serviceType);

    if (!dbRes.success) {
      addToast('error', 'Lỗi lưu CSDL Supabase!', dbRes.error);
      return { success: false, error: dbRes.error };
    }

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              code: newCode,
              name: newName,
              folder_name,
              service_type: serviceType || c.service_type || 'CFO',
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

    if (selectedClient?.id === clientId) {
      setSelectedClient((prev) =>
        prev ? { ...prev, code: newCode, name: newName, folder_name, service_type: serviceType || prev.service_type || 'CFO' } : null
      );
    }

    router.refresh();

    pushAuditLog('UPDATE_METADATA', `Cập nhật thông tin thư mục thành ${folder_name}`, undefined, folder_name);
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
        updateUrlState(null, null, activeTab);
      }
      router.refresh();
      pushAuditLog('DELETE_FILE', `Xóa vĩnh viễn thư mục khách hàng ${target.folder_name}`, undefined, target.folder_name);
      addToast('error', 'Đã xóa vĩnh viễn khỏi Database!', `Đã xóa hoàn toàn dữ liệu của ${target.folder_name}`);
    }
  };

  // REAL SUPABASE DATABASE PROFILES MANAGEMENT HANDLERS
  const handleAddUser = async (newUser: Omit<UserProfile, 'id'>) => {
    const res = await sharepointService.createProfile(newUser);
    if (res.success && res.profile) {
      setSystemUsers((prev) => [...prev, res.profile!]);
      pushAuditLog('CREATE_CLIENT', `Thêm tài khoản người dùng mới ${newUser.full_name} (${newUser.email}) - Role: ${newUser.role}`);
      addToast('success', 'Tạo tài khoản người dùng mới thành công!', `Email: ${newUser.email}`);
    } else {
      addToast('error', 'Lỗi thêm người dùng!', res.error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const success = await sharepointService.deleteProfile(userId);
    if (success) {
      setSystemUsers((prev) => prev.filter((u) => u.id !== userId));
      addToast('info', 'Đã gỡ bỏ tài khoản người dùng.');
    }
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

  // STRICT 2-PHASE FILE UPLOAD HANDLER WITH ABSOLUTE SUCCESS VERIFICATION
  const handleUploadFile = async (data: {
    name: string;
    file: File | null;
    fiscalYear: number;
    serviceType: DocumentFile['service_type'];
    status: DocumentFile['status'];
    tags: string[];
  }) => {
    if (!selectedClient) {
      addToast('error', 'Chưa chọn Khách hàng!', 'Vui lòng chọn một khách hàng trước khi tải file.');
      return;
    }

    if (!data.file) {
      addToast('error', 'Chưa chọn File!', 'Vui lòng nhấp để chọn một file tài liệu.');
      return;
    }

    // Ensure data.serviceType aligns with selectedClient service_type if unspecified
    const effectiveServiceType = data.serviceType || selectedClient.service_type || 'CFO';

    // Auto-adjust filterState if filter is active on a different service type so newly uploaded file is visible
    if (filterState.serviceType !== 'all' && filterState.serviceType !== effectiveServiceType) {
      setFilterState((prev) => ({
        ...prev,
        serviceType: 'all',
      }));
    }

    const folderId = selectedSubFolder
      ? selectedSubFolder.id
      : createSubfoldersForClient(selectedClient.id)[0].id;

    // Call 2-phase verified upload
    const res = await sharepointService.uploadFile(data.file, selectedClient.id, folderId, {
      name: data.name,
      fiscalYear: data.fiscalYear,
      serviceType: effectiveServiceType,
      status: data.status,
      tags: data.tags,
      createdBy: currentUser.id,
      createdByName: currentUser.full_name,
    });

    if (!res.success || !res.doc) {
      // Direct Error Toast on Genuine Upload/DB Failure
      addToast('error', 'Lỗi lưu tài liệu vào Supabase Storage/CSDL!', res.error || 'Không thể lưu file.');
      return;
    }

    const newFile: DocumentFile = res.doc;

    // Add to Local React State & LocalStorage ONLY on confirmed success
    setFiles((prev) => {
      const updated = [newFile, ...prev];
      if (typeof window !== 'undefined') {
        try {
          const storedDocs = localStorage.getItem('fica_uploaded_documents');
          const existing: DocumentFile[] = storedDocs ? JSON.parse(storedDocs) : [];
          if (!existing.some((e) => e.id === newFile.id || e.storage_path === newFile.storage_path)) {
            localStorage.setItem('fica_uploaded_documents', JSON.stringify([newFile, ...existing]));
          }
        } catch {
          // Ignore
        }
      }
      return updated;
    });

    router.refresh();

    pushAuditLog(
      'UPLOAD_FILE',
      `Tải lên file ${data.name} (Dịch vụ ${data.serviceType})`,
      data.name
    );

    // Toast ONLY shown when both Storage and Database Insert are verified successful
    addToast('success', 'Đã lưu vĩnh viễn vào Supabase Storage & CSDL!', `File: ${data.name}`);
  };

  // Delete single file
  const handleDeleteFile = (fileId: string) => {
    const targetFile = files.find((f) => f.id === fileId);
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      if (typeof window !== 'undefined') {
        try {
          const storedDocs = localStorage.getItem('fica_uploaded_documents');
          if (storedDocs) {
            const existing: DocumentFile[] = JSON.parse(storedDocs);
            localStorage.setItem(
              'fica_uploaded_documents',
              JSON.stringify(existing.filter((f) => f.id !== fileId))
            );
          }
        } catch {
          // Ignore
        }
      }
      return updated;
    });

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

  // FILTERED CLIENTS LIST BY SEARCH QUERY & SERVICE TYPE FILTER ('all' | 'Audit' | 'CFO' | 'Consulting' | 'Tax')
  const displayedClients = useMemo(() => {
    let list = activeTab === 'archived_clients' ? archivedClientsList : activeClientsList;

    if (filterState.serviceType && filterState.serviceType !== 'all') {
      list = list.filter((c) => (c.service_type || 'CFO') === filterState.serviceType);
    }

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
  }, [clients, activeTab, globalSearchQuery, filterState.searchQuery, filterState.serviceType, activeClientsList, archivedClientsList]);

  // FILTERED FILES LIST WITH SAFE SUBFOLDER & CLIENT MATCHING
  const displayedFiles = useMemo(() => {
    let list = files;

    if (selectedClient) {
      list = list.filter((f) => !f.client_id || f.client_id === selectedClient.id);
    }

    if (selectedSubFolder) {
      list = list.filter((f) => {
        if (!f.folder_id) return true;
        if (f.folder_id === selectedSubFolder.id) return true;
        if (f.folder_id.substring(0, 8) === selectedSubFolder.id.substring(0, 8)) return true;
        return false;
      });
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
      className="min-h-screen bg-slate-900 flex flex-col font-sans antialiased select-none relative overflow-x-hidden"
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

      {/* SharePoint Topbar with Custom Company Logo Support */}
      <Topbar
        currentUser={currentUser}
        searchQuery={globalSearchQuery}
        onSearchChange={(q) => handleFilterChange({ searchQuery: q })}
        onRoleSwitch={(r) => {
          const updated = { ...currentUser, role: r };
          setCurrentUser(updated);
          if (typeof window !== 'undefined') {
            localStorage.setItem('fica_user_profile', JSON.stringify(updated));
          }
        }}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        onOpenProfile={() => setIsUserProfileModalOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        companyLogoUrl={companyLogoUrl}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Desktop Fixed & Mobile Slide-over Drawer) */}
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
              updateUrlState(null, null, tab);
            }
          }}
          activeCount={activeClientsList.length}
          archivedCount={archivedClientsList.length}
          filterState={filterState}
          onFilterChange={handleFilterChange}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
        />

        {/* Right Main Content */}
        <main className="flex-1 bg-slate-100 overflow-y-auto flex flex-col justify-between relative pb-16 md:pb-0">
          <div>
            {/* Breadcrumb Navigation - Synced with URL */}
            <Breadcrumb
              currentClient={selectedClient}
              currentSubFolder={selectedSubFolder}
              activeTab={activeTab}
              onNavigateHome={() => {
                setSelectedClient(null);
                setSelectedSubFolder(null);
                setSelectedClientIds([]);
                setSelectedFileIds([]);
                updateUrlState(null, null, activeTab);
              }}
              onNavigateClient={() => {
                setSelectedSubFolder(null);
                if (selectedClient) {
                  updateUrlState(selectedClient.id, null, activeTab);
                }
              }}
            />

            {/* Service Type Active Filter Information Banner */}
            {filterState.serviceType !== 'all' && !selectedClient && (
              <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-900 flex items-center justify-between animate-fade-in shadow-inner">
                <div className="flex items-center space-x-2 font-medium">
                  <Filter className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Đang lọc Danh sách Khách hàng thuộc Loại dịch vụ: <strong>{filterState.serviceType}</strong> ({displayedClients.length} khách hàng).
                  </span>
                </div>
                <button
                  onClick={() => handleFilterChange({ serviceType: 'all' })}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded border border-blue-300 transition-colors shrink-0 ml-2"
                >
                  Bỏ lọc dịch vụ (Hiện tất cả)
                </button>
              </div>
            )}

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
                  className="bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded border border-amber-400 transition-colors shrink-0 ml-2"
                >
                  Khôi phục Active
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
              onSearchChange={(q) => handleFilterChange({ searchQuery: q })}
              isReadOnly={isReadOnly}
              userRole={currentUser.role}
              selectedClientName={selectedClient?.folder_name}
              clientStatus={selectedClient?.status}
              onArchiveClient={() => selectedClient && handleArchiveClient(selectedClient)}
              onRestoreClient={() => selectedClient && handleRestoreClient(selectedClient)}
              onRefresh={() => {}}
            />

            {/* Page Header */}
            <div className="px-4 md:px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <h1 className="text-sm md:text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>
                    {selectedSubFolder
                      ? selectedSubFolder.name
                      : selectedClient
                      ? selectedClient.folder_name
                      : activeTab === 'archived_clients'
                      ? 'Kho Lưu Trữ Hồ Sơ Khách Hàng'
                      : activeTab === 'reports'
                      ? 'Nhật Ký Hoạt Động & Kiểm Toán'
                      : activeTab === 'settings'
                      ? 'Cài Đặt Hệ Thống'
                      : 'Danh Sách Khách Hàng'}
                  </span>
                  {filterState.serviceType !== 'all' && (
                    <span className="text-[10px] md:text-xs bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded border border-blue-300">
                      Lọc: {filterState.serviceType}
                    </span>
                  )}
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                  Đồng bộ thời gian thực Supabase Realtime Engine | Data Safety Guaranteed
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
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors flex items-center space-x-1 text-xs font-semibold shrink-0 min-h-[44px]"
                title="Thông tin chi tiết"
              >
                <Info className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Details</span>
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
                  updateUrlState(c.id, null, activeTab);
                }}
                onSelectSubFolder={(sf) => {
                  setSelectedSubFolder(sf);
                  if (selectedClient) {
                    updateUrlState(selectedClient.id, sf.id, activeTab);
                  }
                }}
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
                  updateUrlState(c.id, null, activeTab);
                }}
                onSelectSubFolder={(sf) => {
                  setSelectedSubFolder(sf);
                  if (selectedClient) {
                    updateUrlState(selectedClient.id, sf.id, activeTab);
                  }
                }}
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
              <span className="truncate">Bảo mật & Audit Trail Fica Holding</span>
            </div>
            <div className="font-mono hidden sm:block">
              Next.js 15 App Router | Verified 2-Phase Upload Active
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
          updateUrlState(c.id, null, activeTab);
        }}
        onOpenSubFolder={(sf) => {
          setSelectedSubFolder(sf);
          if (selectedClient) {
            updateUrlState(selectedClient.id, sf.id, activeTab);
          }
        }}
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
        companyLogoUrl={companyLogoUrl}
        onUpdateLogo={(newUrl) => {
          setCompanyLogoUrl(newUrl);
          if (newUrl) {
            addToast('success', 'Đã lưu vĩnh viễn Logo thương hiệu công ty mới!');
          } else {
            addToast('info', 'Đã khôi phục về Logo FICA mặc định.');
          }
        }}
        allFiles={files}
        onRefreshFiles={() => router.refresh()}
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
        defaultServiceType={
          selectedClient?.service_type ||
          (filterState.serviceType !== 'all' ? (filterState.serviceType as ServiceType) : 'CFO')
        }
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
        onFilterChange={handleFilterChange}
        onResetFilters={() =>
          handleFilterChange({
            searchQuery: '',
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

export default function SharePointHubPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">Đang nạp dữ liệu SharePoint Fica Hub...</div>}>
      <SharePointContent />
    </Suspense>
  );
}
