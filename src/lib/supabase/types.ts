export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Profile = {
  id: string;
  full_name: string;
  business_name: string;
  tax_id: string | null;
  currency: string;
  created_at: string;
};

export type Client = {
  id: string;
  business_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avg_frequency_days: number | null;
  notes: string | null;
  created_at: string;
};

export type Service = {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  tax_rate: number;
  created_at: string;
};

export type Appointment = {
  id: string;
  business_id: string;
  client_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  total_price: number;
  created_at: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        {
          id: string;
          full_name: string;
          business_name: string;
          tax_id?: string | null;
          currency?: string;
          created_at?: string;
        },
        {
          full_name?: string;
          business_name?: string;
          tax_id?: string | null;
          currency?: string;
        }
      >;
      clients: Table<
        Client,
        {
          id?: string;
          business_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          avg_frequency_days?: number | null;
          notes?: string | null;
          created_at?: string;
        },
        {
          business_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          avg_frequency_days?: number | null;
          notes?: string | null;
        }
      >;
      services: Table<
        Service,
        {
          id?: string;
          business_id: string;
          name: string;
          duration_minutes: number;
          price: number;
          tax_rate?: number;
          created_at?: string;
        },
        {
          business_id?: string;
          name?: string;
          duration_minutes?: number;
          price?: number;
          tax_rate?: number;
        }
      >;
      appointments: Table<
        Appointment,
        {
          id?: string;
          business_id: string;
          client_id: string;
          service_id: string;
          start_time: string;
          end_time: string;
          status?: AppointmentStatus;
          total_price: number;
          created_at?: string;
        },
        {
          business_id?: string;
          client_id?: string;
          service_id?: string;
          start_time?: string;
          end_time?: string;
          status?: AppointmentStatus;
          total_price?: number;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      appointment_status: AppointmentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
