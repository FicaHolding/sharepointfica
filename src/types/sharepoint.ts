export type UserRole = 'admin' | 'manager' | 'staff' | 'client';

export type ServiceType = 'Audit' | 'CFO' | 'Consulting' | 'Legal' | 'Tax';

export type FileStatus = 'Draft' | 'Pending' | 'Approved' | 'Archived';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  department?: string;
}

export interface ClientFolder {
  id: string;
  code: string; // e.g., "KH001"
  name: string; // e.g., "Tập đoàn SunGroup"
  folder_name: string; // "[KH001] - Tập đoàn SunGroup"
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name?: string;
  total_files_count?: number;
  total_size_mb?: number;
}

export interface FolderItem {
  id: string;
  client_id: string;
  parent_id?: string | null;
  name: string; // e.g. "01_Pháp lý & Hợp đồng"
  is_system_folder: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface FileVersion {
  id: string;
  file_id: string;
  version_number: number;
  file_name: string;
  storage_path: string;
  file_size: number; // in bytes
  mime_type: string;
  change_summary?: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
}

export interface DocumentFile {
  id: string;
  folder_id: string;
  client_id: string;
  name: string;
  current_version: number;
  file_size: number;
  mime_type: string;
  storage_path: string;
  status: FileStatus;
  fiscal_year: number; // e.g., 2024, 2025
  service_type: ServiceType;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name: string;
  modified_by_name: string;
  versions_count?: number;
}

export interface MetadataFilterState {
  searchQuery: string;
  fiscalYear: string; // 'all' | '2025' | '2024' | '2023'
  serviceType: string; // 'all' | 'Audit' | 'CFO' | 'Consulting'
  status: string; // 'all' | 'Approved' | 'Pending' | 'Draft'
  selectedTags: string[];
}
