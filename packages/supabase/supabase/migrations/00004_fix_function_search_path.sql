-- Fix search_path security warnings

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.developers (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.subscriptions (developer_id, tier, status, monthly_request_limit)
  VALUES (NEW.id, 'free', 'active', 1000);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';
