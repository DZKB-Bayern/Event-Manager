import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAILS = ['oeffentlichkeitsarbeit@dzkb.bayern', 'mitgliederverwaltung@dzkb.bayern']
const SENDER_EMAIL = 'info@fuehrerschein.dzkb.bayern' 
const APP_URL = Deno.env.get('APP_URL') || 'https://event-manager-nu-bay.vercel.app'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      } 
    })
  }

  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing')

    const payload = await req.json()
    const record = payload.record || payload 

    if (!record || !record.title) throw new Error('Ungültige Event-Daten')

    // Datum für die Anzeige formatieren
    const eventDate = record.start_time 
      ? new Date(record.start_time).toLocaleString('de-DE', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        }) + ' Uhr'
      : 'Kein Datum angegeben';

    // Fetch subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('profiles')
      .select('email, notification_token')
      .eq('notification_status', 'subscribed')
      .not('email', 'is', null)

    if (subError) {
      console.error('Error fetching subscribers:', subError)
    }

    const adminEmail = {
      from: SENDER_EMAIL,
      to: ADMIN_EMAILS,
      subject: `Neues Event erstellt: ${record.title}`,
      html: `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .banner { width: 100%; height: auto; display: block; }
        .content { padding: 30px; text-align: center; color: #333333; }
        h1 { color: #0066B2; font-size: 24px; margin-bottom: 10px; }
        p { font-size: 16px; line-height: 1.5; color: #555555; margin: 10px 0; }
        .event-card { background-color: #f8faff; border: 1px solid #e0e6ed; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: left; }
        .button { display: inline-block; padding: 14px 28px; background-color: #0066B2; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin-top: 10px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #999999; background: #f9f9f9; }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://dzkb.bayern/wp-content/uploads/2026/03/Event-Manager.jpg" alt="DZKB Event Manager" class="banner">
        
        <div class="content">
            <h1>Neues Event erstellt</h1>
            <p>Ein Mitglied hat eine neue Veranstaltung eingereicht, die überprüft werden kann.</p>
            
            <div class="event-card">
                <h2 style="color: #333; margin-top: 0; font-size: 18px;">${record.title}</h2>
                <p><strong>📅 Datum:</strong> ${eventDate}</p>
                <p><strong>📍 Ort:</strong> ${record.location || 'Kein Ort angegeben'}</p>
                <p><strong>📝 Info:</strong> ${record.description || 'Keine Beschreibung vorhanden.'}</p>
            </div>
            
            <a href="${APP_URL}" class="button">Zum Dashboard</a>
        </div>
        
        <div class="footer">
            &copy; 2026 DZKB e.V. Bayern - Die zertifizierten kynologischen Berufsgruppen.<br>
            Dies ist eine automatisch generierte Benachrichtigung des Event-Managers.
        </div>
    </div>
</body>
</html>
      `,
    }

    const subscriberEmails = (subscribers || []).map((sub: any) => {
      const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${sub.notification_token}`
      return {
        from: SENDER_EMAIL,
        to: sub.email,
        subject: `Neues Event: ${record.title}`,
        html: `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .banner { width: 100%; height: auto; display: block; }
        .content { padding: 30px; text-align: center; color: #333333; }
        h1 { color: #0066B2; font-size: 24px; margin-bottom: 10px; }
        p { font-size: 16px; line-height: 1.5; color: #555555; margin: 10px 0; }
        .event-card { background-color: #f8faff; border: 1px solid #e0e6ed; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: left; }
        .button { display: inline-block; padding: 14px 28px; background-color: #0066B2; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin-top: 10px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #999999; background: #f9f9f9; }
        .unsubscribe { color: #999999; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://dzkb.bayern/wp-content/uploads/2026/03/Event-Manager.jpg" alt="DZKB Event Manager" class="banner">
        
        <div class="content">
            <h1>Neue Veranstaltung eingetragen!</h1>
            <p>Es gibt Neuigkeiten im DZKB Event Manager. Eine neue Veranstaltung wurde veröffentlicht:</p>
            
            <div class="event-card">
                <h2 style="color: #333; margin-top: 0; font-size: 18px;">${record.title}</h2>
                <p><strong>📅 Datum:</strong> ${eventDate}</p>
                <p><strong>📍 Ort:</strong> ${record.location || 'Kein Ort angegeben'}</p>
                <p><strong>📝 Info:</strong> ${record.description || 'Keine Beschreibung vorhanden.'}</p>
            </div>
            
            <a href="${APP_URL}" class="button">Event ansehen</a>
        </div>
        
        <div class="footer">
            &copy; 2026 DZKB e.V. Bayern - Die zertifizierten kynologischen Berufsgruppen.<br><br>
            Sie erhalten diese E-Mail, weil Sie sich für Benachrichtigungen angemeldet haben.<br>
            <a href="${unsubscribeUrl}" class="unsubscribe">Hier klicken, um sich abzumelden</a>
        </div>
    </div>
</body>
</html>
        `
      }
    })

    const emailsToSend = [adminEmail, ...subscriberEmails]

    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailsToSend),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Resend API Error: ${res.status} ${errorText}`)
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})