-- Create expenses table for admin expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id text PRIMARY KEY,
  description text,
  category text,
  amount numeric,
  date date,
  paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Optional: grant minimal privileges to anon role for client usage (for testing only)
-- ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anon_select_expenses" ON public.expenses FOR SELECT USING (true);
-- CREATE POLICY "anon_insert_expenses" ON public.expenses FOR INSERT WITH CHECK (true);
-- CREATE POLICY "anon_update_expenses" ON public.expenses FOR UPDATE USING (true) WITH CHECK (true);
