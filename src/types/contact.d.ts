export interface ResVehicle {
  id: number;
  plate: string;
  type: string;
}

export interface ResContactNumber {
  id: number;
  numero: string;
}

export interface ResContact {
  id: number;
  full_name: string;
  boss_name: string;
  position: string;
  vehicle?: Vehicle;
  contact_numbers?: ResContactNumber[];
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ResContactPayload {
  full_name: string;
  boss_name: string;
  position: string;
  vehicle_plate?: string;
  vehicle_type?: string;
  contact_numbers?: string[];
}