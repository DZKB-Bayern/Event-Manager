-- ANLEITUNG FÜR DEN SUPABASE SQL EDITOR (BROWSER-ONLY)
-- Da Sie Edge Functions nicht ohne Terminal (CLI) deployen können, nutzen wir
-- die integrierte Datenbank-Funktion, um E-Mails direkt zu versenden.

-- SCHRITT 1: Gehen Sie im Supabase Dashboard links auf "SQL Editor"
-- SCHRITT 2: Klicken Sie auf "New Query"
-- SCHRITT 3: Kopieren Sie diesen gesamten Code und fügen Sie ihn ein
-- SCHRITT 4: Passen Sie unten 'IHREN_RESEND_API_KEY' und die E-Mail-Adresse an
-- SCHRITT 5: Klicken Sie auf "Run" (unten rechts)

-- 1. Erweiterung für Netzwerk-Requests aktivieren
create extension if not exists pg_net;

-- 2. Funktion erstellen, die die E-Mail sendet
create or replace function send_new_event_notification()
returns trigger as $$
declare
  -- !!! HIER IHREN API KEY EINTRAGEN (z.B. von resend.com) !!!
  -- Holen Sie sich einen kostenlosen Key auf https://resend.com
  api_key text := 're_123456789...'; 
  
  -- !!! HIER DIE EMPFÄNGER-EMAIL EINTRAGEN !!!
  recipient_email text := 'admin@ihre-domain.de';
  
  response_id integer;
begin
  -- Der Request wird asynchron gesendet (blockiert nicht die Datenbank)
  response_id := net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'onboarding@resend.dev', -- Standard Resend Absender (oder Ihre Domain)
      'to', recipient_email,
      'subject', 'Neues Event erstellt: ' || NEW.title,
      'html', '<h1>Neues Event</h1>' ||
              '<p>Ein neues Event wurde erstellt:</p>' ||
              '<ul>' ||
              '<li><strong>Titel:</strong> ' || NEW.title || '</li>' ||
              '<li><strong>Ort:</strong> ' || COALESCE(NEW.location, 'Kein Ort') || '</li>' ||
              '<li><strong>Zeit:</strong> ' || NEW.start_time || '</li>' ||
              '</ul>'
    )
  );
  
  return NEW;
end;
$$ language plpgsql;

-- 3. Trigger aktivieren (feuert bei jedem neuen Eintrag in 'events')
drop trigger if exists on_event_created on events;

create trigger on_event_created
  after insert on events
  for each row
  execute function send_new_event_notification();
