'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import {
  UserProfile,
  ClientFolder,
  FolderItem,
  DocumentFile,
  MetadataFilterState,
  AuditLog,
} from '@/types/sharepoint';
import { Lock, Activity, Info, UploadCloud, CheckCircle2 } from 'lucide-react';
import { sharepointService } from '@/services/sharepointService';

export default function SharePointHubPage() {
  // Current user state (RBAC role simulation)
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'usr-1',
    email: 'admin@fica.vn',
    full_name: 'Nguyễn Văn Nam',
    role: 'admin',
    department: 'Ban Giám Đốc Fica Holding',
  });

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

  // Modals, Drawers & Panes visibility states
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isDetailsPaneOpen, setIsDetailsPaneOpen] = useState(false);
  const [isBulkMetadataModalOpen, setIsBulkMetadataModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null);
  const [selectedFileForVersionHistory, setSelectedFileForVersionHistory] = useState<DocumentFile | null>(null);
  const [detailsItem, setDetailsItem] = useState<{
    client?: ClientFolder;
    subFolder?: FolderItem;
    file?: DocumentFile;
  }>({});

  // Drag and Drop Zone State
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // MOCK CLIENTS DATA
  const [clients, setClients] = useState<ClientFolder[]>([
    {
      id: 'cli-1',
      code: 'KH001',
      name: 'Tập đoàn SunGroup',
      folder_name: '[KH001] - Tập đoàn SunGroup',
      status: 'active',
      created_at: '2026-01-15T08:30:00Z',
      updated_at: '2026-08-10T14:20:00Z',
      created_by: 'usr-1',
      created_by_name: 'Nguyễn Văn Nam',
      total_files_count: 4,
      total_size_mb: 24.5,
    },
    {
      id: 'cli-2',
      code: 'KH002',
      name: 'Tập đoàn Vingroup',
      folder_name: '[KH002] - Tập đoàn Vingroup',
      status: 'active',
      created_at: '2026-02-01T09:00:00Z',
      updated_at: '2026-08-12T11:15:00Z',
      created_by: 'usr-1',
      created_by_name: 'Nguyễn Văn Nam',
      total_files_count: 4,
      total_size_mb: 48.2,
    },
    {
      id: 'cli-3',
      code: 'KH003',
      name: 'Tập đoàn Hòa Phát (Archive)',
      folder_name: '[KH003] - Tập đoàn Hòa Phát',
      status: 'archived',
      created_at: '2025-05-10T10:00:00Z',
      updated_at: '2026-06-30T16:00:00Z',
      created_by: 'usr-1',
      created_by_name: 'Trần Thị Mai',
      total_files_count: 4,
      total_size_mb: 112.0,
    },
  ]);

  // Standard 4 subfolders template
  const createSubfoldersForClient = (clientId: string): FolderItem[] => [
    {
      id: `sf-${clientId}-1`,
      client_id: clientId,
      name: '01_Pháp lý & Hợp đồng',
      is_system_folder: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'usr-1',
    },
    {
      id: `sf-${clientId}-2`,
      client_id: clientId,
      name: '02_Chứng từ & Báo cáo Tài chính',
      is_system_folder: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'usr-1',
    },
    {
      id: `sf-${clientId}-3`,
      client_id: clientId,
      name: '03_Dự án Tư vấn & Kiểm toán',
      is_system_folder: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'usr-1',
    },
    {
      id: `sf-${clientId}-4`,
      client_id: clientId,
      name: '04_Báo cáo Nghiệm thu',
      is_system_folder: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'usr-1',
    },
  ];

  // MOCK FILES DATA
  const [files, setFiles] = useState<DocumentFile[]>([
    {
      id: 'file-1',
      client_id: 'cli-1',
      folder_id: 'sf-cli-1-1',
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
      created_by: 'usr-1',
      created_by_name: 'Nguyễn Văn Nam',
      modified_by_name: 'Lê Hoàng Anh',
    },
    {
      id: 'file-2',
      client_id: 'cli-1',
      folder_id: 'sf-cli-1-2',
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
      created_by: 'usr-1',
      created_by_name: 'Nguyễn Văn Nam',
      modified_by_name: 'Nguyễn Văn Nam',
    },
    {
      id: 'file-3',
      client_id: 'cli-2',
      folder_id: 'sf-cli-2-3',
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
      created_by: 'usr-1',
      created_by_name: 'Phạm Thanh Sơn',
      modified_by_name: 'Nguyễn Văn Nam',
    },
  ]);

  // AUDIT LOGS STATE
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      client_name: '[KH001] - Tập đoàn SunGroup',
      file_name: 'Hop_Dong_Tu_Van_CFO_2025_Signed.pdf',
      action_type: 'UPLOAD_FILE',
      action_details: 'Tải lên tài liệu Hợp đồng tư vấn CFO năm tài chính 2025',
      performed_by: 'usr-1',
      performed_by_name: 'Nguyễn Văn Nam',
      performed_by_role: 'admin',
      created_at: '2026-08-12T10:30:00Z',
    },
    {
      id: 'log-2',
      client_name: '[KH003] - Tập đoàn Hòa Phát',
      action_type: 'ARCHIVE_CLIENT',
      action_details: 'Đã đóng dự án và chuyển hồ sơ khách hàng sang chế độ Read-Only Archive',
      performed_by: 'usr-1',
      performed_by_name: 'Trần Thị Mai',
      performed_by_role: 'manager',
      created_at: '2026-08-11T14:15:00Z',
    },
    {
      id: 'log-3',
      client_name: '[KH002] - Tập đoàn Vingroup',
      file_name: 'Tiet_Kiem_Chi_Phi_Du_An_Consulting_Vingroup.pdf',
      action_type: 'DOWNLOAD_FILE',
      action_details: 'Đã tải tài liệu báo cáo dự án tư vấn về máy tính',
      performed_by: 'usr-1',
      performed_by_name: 'Phạm Thanh Sơn',
      performed_by_role: 'staff',
      created_at: '2026-08-10T16:40:00Z',
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
      id: `log-${Date.now()}`,
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

  // Handle Client Creation
  const handleCreateClient = (code: string, name: string) => {
    const newId = `cli-${Date.now()}`;
    const folder_name = `[${code}] - ${name}`;
    const newClient: ClientFolder = {
      id: newId,
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
    setClients([newClient, ...clients]);
    setSelectedClient(newClient);
    setSelectedSubFolder(null);

    pushAuditLog('CREATE_CLIENT', `Tạo Khách hàng mới [${code}] - ${name} với 4 subfolders`, undefined, folder_name);
  };

  // Archive / Restore Client
  const handleArchiveClient = (client: ClientFolder) => {
    setClients(
      clients.map((c) =>
        c.id === client.id ? { ...c, status: 'archived', updated_at: new Date().toISOString() } : c
      )
    );
    if (selectedClient?.id === client.id) {
      setSelectedClient({ ...selectedClient, status: 'archived' });
    }
    pushAuditLog('ARCHIVE_CLIENT', `Khóa hồ sơ Read-Only sang trạng thái Archive`, undefined, client.folder_name);
  };

  const handleRestoreClient = (client: ClientFolder) => {
    setClients(
      clients.map((c) =>
        c.id === client.id ? { ...c, status: 'active', updated_at: new Date().toISOString() } : c
      )
    );
    if (selectedClient?.id === client.id) {
      setSelectedClient({ ...selectedClient, status: 'active' });
    }
    pushAuditLog('RESTORE_CLIENT', `Khôi phục hồ sơ sang trạng thái Active hoạt động`, undefined, client.folder_name);
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

    const folderId = selectedSubFolder ? selectedSubFolder.id : `sf-${selectedClient.id}-1`;

    const newFile: DocumentFile = {
      id: `file-${Date.now()}`,
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
  };

  // Delete single file
  const handleDeleteFile = (fileId: string) => {
    const targetFile = files.find((f) => f.id === fileId);
    setFiles(files.filter((f) => f.id !== fileId));
    if (targetFile) {
      pushAuditLog('DELETE_FILE', `Đã xóa vĩnh viễn file ${targetFile.name}`, targetFile.name);
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
    setSelectedClientIds([]);
  };

  const handleBulkDownloadZip = () => {
    alert(`Đang nén và tải xuống file ZIP gồm ${selectedFileIds.length || selectedClientIds.length} mục đã chọn!`);
    pushAuditLog('DOWNLOAD_FILE', `Tải xuống nén ZIP hàng loạt mục đã chọn`);
  };

  const handleBulkDelete = () => {
    if (selectedFileIds.length > 0) {
      setFiles(files.filter((f) => !selectedFileIds.includes(f.id)));
      pushAuditLog('DELETE_FILE', `Xóa hàng loạt ${selectedFileIds.length} file tài liệu`);
      setSelectedFileIds([]);
    }
    if (selectedClientIds.length > 0) {
      setClients(clients.filter((c) => !selectedClientIds.includes(c.id)));
      pushAuditLog('DELETE_FILE', `Xóa hàng loạt ${selectedClientIds.length} thư mục khách hàng`);
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
        alert('Vui lòng mở một Thư mục Khách hàng trước khi thả File!');
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
        onRoleSwitch={(r) => setCurrentUser({ ...currentUser, role: r })}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedClient(null);
            setSelectedSubFolder(null);
            setSelectedClientIds([]);
            setSelectedFileIds([]);
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
                      ? 'Cài Đặt Hệ Thống SharePoint Fica'
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
                  alert(`Đang tải file: ${f.name}`);
                  pushAuditLog('DOWNLOAD_FILE', `Tải file ${f.name} về máy`, f.name);
                }}
                onArchiveClient={handleArchiveClient}
                onRestoreClient={handleRestoreClient}
                onDeleteFile={handleDeleteFile}
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
                  alert(`Đang tải file: ${f.name}`);
                  pushAuditLog('DOWNLOAD_FILE', `Tải file ${f.name} về máy`, f.name);
                }}
                onArchiveClient={handleArchiveClient}
                onRestoreClient={handleRestoreClient}
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
              Next.js 15 App Router | Supabase Realtime Storage | Bulk Actions Enabled
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

      {/* Modals, Drawers & Slide-over Panes */}
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
        onDownload={(f) => alert(`Đang tải file: ${f.name}`)}
      />

      <DetailsPane
        isOpen={isDetailsPaneOpen}
        onClose={() => setIsDetailsPaneOpen(false)}
        selectedClient={detailsItem.client || selectedClient}
        selectedSubFolder={detailsItem.subFolder || selectedSubFolder}
        selectedFile={detailsItem.file || null}
        userRole={currentUser.role}
        onOpenVersionHistory={(f) => setSelectedFileForVersionHistory(f)}
        onDownloadFile={(f) => alert(`Đang tải file: ${f.name}`)}
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
        onDownloadVersion={(v) => alert(`Tải xuống phiên bản v${v.version_number}: ${v.file_name}`)}
        onRestoreVersion={(v) => {
          alert(`Đã khôi phục phiên bản v${v.version_number} thành bản chính!`);
          pushAuditLog('RESTORE_VERSION', `Khôi phục phiên bản v${v.version_number} làm bản chính`, v.file_name);
          setSelectedFileForVersionHistory(null);
        }}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
