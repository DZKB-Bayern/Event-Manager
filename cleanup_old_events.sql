-- Aktiviert die pg_cron Erweiterung, falls noch nicht aktiv
create extension if not exists pg_cron;

-- Plant einen Job, der täglich um 03:00 Uhr morgens (UTC) läuft
-- und alle Events löscht, deren Endzeitpunkt (end_time) in der Vergangenheit liegt.
select cron.schedule(
  'delete-past-events',                                -- Name des Jobs
  '0 3 * * *',                                         -- Zeitplan (Minuten Stunden ...)
  $$delete from public.events where end_time < now()$$ -- Der SQL-Befehl
);

-- Falls du die Events lieber erst löschen willst, wenn sie 24 Stunden vorbei sind,
-- ändere den Befehl zu:
-- $$delete from public.events where end_time < (now() - interval '24 hours')$$
