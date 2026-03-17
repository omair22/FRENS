-- Supabase SQL for Frens Guest System

CREATE TABLE IF NOT EXISTS public.hangout_guests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hangout_id uuid REFERENCES public.hangouts(id) ON DELETE CASCADE,
  name text NOT NULL,
  response text NOT NULL DEFAULT 'going',
  token text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hangout_guests_hangout_id_idx 
  ON hangout_guests(hangout_id);
CREATE INDEX IF NOT EXISTS hangout_guests_token_idx 
  ON hangout_guests(token);

-- RLS
ALTER TABLE hangout_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert guest rsvps"
  ON hangout_guests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read guest rsvps"
  ON hangout_guests FOR SELECT
  USING (true);

CREATE POLICY "Update own guest rsvp by token"
  ON hangout_guests FOR UPDATE
  USING (true);
