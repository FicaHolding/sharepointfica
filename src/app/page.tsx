'use client';

import React, { useState, useMemo } from 'react';
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
import {
  UserProfile,
  ClientFolder,
  FolderItem,
  DocumentFile,
  FileVersion,
  MetadataFilterState,
} from '@/types/sharepoint';
import { Lock, Sparkles, Folder, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

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

  // Modal visibility states
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedFileForVersionHistory, setSelectedFileForVersionHistory] = useState<DocumentFile | null>(null);

  // MOCK DATA STORAGE
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

  // Mock Files Data
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

  // Handle Client creation with 4 subfolders
  const handleCreateClient = (code: string, name: string) => {
    const newId = `cli-${Date.now()}`;
    const newClient: ClientFolder = {
      id: newId,
      code,
      name,
      folder_name: `[${code}] - ${name}`,
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
  };

  // Archive / Restore Client functionality
  const handleArchiveClient = (client: ClientFolder) => {
    setClients(
      clients.map((c) =>
        c.id === client.id ? { ...c, status: 'archived', updated_at: new Date().toISOString() } : c
      )
    );
    if (selectedClient?.id === client.id) {
      setSelectedClient({ ...selectedClient, status: 'archived' });
    }
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
  };

  // Upload new file handler
  const handleUploadFile = (data: {
    name: string;
    file: File | null;
    fiscalYear: number;
    serviceType: DocumentFile['service_type'];
    status: DocumentFile['status'];
    tags: string[];
  }) => {
    if (!selectedClient) return;

    const folderId = selectedSubFolder
      ? selectedSubFolder.id
      : `sf-${selectedClient.id}-1`;

    const newFile: DocumentFile = {
      id: `file-${Date.now()}`,
      client_id: selectedClient.id,
      folder_id: folderId,
      name: data.name,
      current_version: 1,
      file_size: data.file ? data.file.size : 2500000,
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
  };

  // Delete file handler
  const handleDeleteFile = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId));
  };

  // Derived subfolders for selected client
  const currentSubFolders = useMemo(() => {
    if (!selectedClient) return [];
    return createSubfoldersForClient(selectedClient.id);
  }, [selectedClient]);

  // Active / Archived clients count
  const activeClientsList = useMemo(() => clients.filter((c) => c.status === 'active'), [clients]);
  const archivedClientsList = useMemo(() => clients.filter((c) => c.status === 'archived'), [clients]);

  // Filtered Clients & Files according to active tab, global search, and metadata filter
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
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans antialiased select-none">
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
          }}
          activeCount={activeClientsList.length}
          archivedCount={archivedClientsList.length}
          filterState={filterState}
          onFilterChange={(fs) => setFilterState((prev) => ({ ...prev, ...fs }))}
        />

        {/* Right Main Content */}
        <main className="flex-1 bg-slate-100 overflow-y-auto flex flex-col justify-between">
          <div>
            {/* Navigation Breadcrumb */}
            <Breadcrumb
              currentClient={selectedClient}
              currentSubFolder={selectedSubFolder}
              activeTab={activeTab}
              onNavigateHome={() => {
                setSelectedClient(null);
                setSelectedSubFolder(null);
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

            {/* Page Title Header */}
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
                      ? 'Báo Cáo & Thống Kê Tài Liệu'
                      : activeTab === 'settings'
                      ? 'Cài Đặt Hệ Thống SharePoint Fica'
                      : 'Danh Sách Khách Hàng (Active Clients)'}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật thời gian thực qua Supabase Realtime Engine | Fica Holding Financial Workspace
                </p>
              </div>
            </div>

            {/* Content Views: List View vs Grid View */}
            {viewMode === 'list' ? (
              <DocumentListView
                clients={displayedClients}
                subFolders={currentSubFolders}
                files={displayedFiles}
                currentClient={selectedClient}
                currentSubFolder={selectedSubFolder}
                onSelectClient={(c) => {
                  setSelectedClient(c);
                  setSelectedSubFolder(null);
                }}
                onSelectSubFolder={(sf) => setSelectedSubFolder(sf)}
                onOpenVersionHistory={(f) => setSelectedFileForVersionHistory(f)}
                onDownloadFile={(f) => alert(`Đang tải file: ${f.name}`)}
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
                onSelectClient={(c) => {
                  setSelectedClient(c);
                  setSelectedSubFolder(null);
                }}
                onSelectSubFolder={(sf) => setSelectedSubFolder(sf)}
                onOpenVersionHistory={(f) => setSelectedFileForVersionHistory(f)}
                onDownloadFile={(f) => alert(`Đang tải file: ${f.name}`)}
                onArchiveClient={handleArchiveClient}
                onRestoreClient={handleRestoreClient}
                isReadOnly={isReadOnly}
              />
            )}
          </div>

          {/* Footer Bar */}
          <footer className="px-4 py-2 bg-white border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bảo mật Chuẩn Ngân Hàng & Tài Chính Fica Holding</span>
            </div>
            <div className="font-mono">
              Next.js 15 App Router | Supabase PostgreSQL Storage | RBAC Active
            </div>
          </footer>
        </main>
      </div>

      {/* Modals & Drawers */}
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

      <VersionHistoryModal
        file={selectedFileForVersionHistory}
        isOpen={!!selectedFileForVersionHistory}
        onClose={() => setSelectedFileForVersionHistory(null)}
        onDownloadVersion={(v) => alert(`Tải xuống phiên bản v${v.version_number}: ${v.file_name}`)}
        onRestoreVersion={(v) => {
          alert(`Đã khôi phục phiên bản v${v.version_number} thành bản chính!`);
          setSelectedFileForVersionHistory(null);
        }}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
