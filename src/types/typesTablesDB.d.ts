// src/types/typesTablesDB.d.ts
import { RowDataPacket } from "mysql2";

export interface User extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  role: 'maestro' | 'supervisor' | 'nromal';
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

// Vehicle
export interface Vehicle extends RowDataPacket {
  id: number;
  plate: string;
  type: string;
}

// Contact
export interface Contact extends RowDataPacket {
  id: number;
  full_name: string;
  boss_name: string;
  position: string;
  vehicle_id: number | null;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

// ContactNumber
export interface ContactNumber extends RowDataPacket {
  id: number;
  contact_id: number;
  number: string;
}

// Resource
export interface Resource extends RowDataPacket {
  id: number;
  title: string;
  detail: string | null;
  type_resource: 'video' | 'documento' | 'articulo' | 'audio' | 'otro';
  url_resource: string | null;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

// AuditLog
export interface AuditLog extends RowDataPacket {
  id: number;
  user_id: number;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  table_name: string;
  record_id: number | null;
  old_value: object | null;
  new_value: object | null;
  action_timestamp: string;
  ip_address: string | null;
}
