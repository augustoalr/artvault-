CREATE TYPE movement_request_type AS ENUM ('internal', 'external');

CREATE TYPE movement_request_status AS ENUM ('pending', 'authorized', 'rejected');

CREATE TABLE IF NOT EXISTS movement_requests(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    request_number SERIAL, 
    movement_type movement_request_type NOT NULL, 
    destination TEXT NOT NULL, 
    status movement_request_status DEFAULT 'pending', 
    responsible_name TEXT, 
    responsible_id_number TEXT, 
    security_officer_name TEXT, 
    security_officer_id TEXT, 
    authorized_at TIMESTAMPTZ, 
    authorized_by_user_id UUID REFERENCES auth.users(id), 
    created_at TIMESTAMPTZ DEFAULT NOW(), 
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE artwork_movements ADD COLUMN request_id UUID REFERENCES movement_requests(id);

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'seguridad';
