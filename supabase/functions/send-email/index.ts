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
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing')

    const payload = await req.json()
    const record = payload.record || payload
    const action = payload.action || 'create'
    console.log("SEND-EMAIL action:", action)
    console.log("SEND-EMAIL payload:", JSON.stringify(payload))
    console.log("SEND-EMAIL record:", JSON.stringify(record))

    if (!record || !record.title) throw new Error('Ungültige Event-Daten')

    const eventDate = record.start_time
      ? new Date(record.start_time).toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' Uhr'
      : 'Kein Datum angegeben'

    const { data: subscribers, error: subError } = await supabase
      .from('profiles')
      .select('email')
      .eq('wants_notifications', true)
      .not('email', 'is', null)

    if (subError) {
      console.error('Error fetching subscribers:', subError)
      throw new Error(`Fehler beim Laden der Empfänger: ${subError.message}`)
    }

    const subscriberEmails = Array.from(
      new Set(
        (subscribers || [])
          .map((sub: { email: string | null }) => sub.email?.trim())
          .filter((email): email is string => !!email),
      ),
    )

    const adminHeading =
      action === 'delete'
        ? 'Event gelöscht'
        : action === 'update'
          ? 'Event aktualisiert'
          : 'Neues Event erstellt'

    const adminIntro =
      action === 'delete'
        ? 'Ein Mitglied hat eine Veranstaltung gelöscht.'
        : action === 'update'
          ? 'Ein Mitglied hat eine Veranstaltung aktualisiert.'
          : 'Ein Mitglied hat eine neue Veranstaltung eingereicht, die überprüft werden kann.'

    const adminSubject =
      action === 'delete'
        ? `Event gelöscht: ${record.title}`
        : action === 'update'
          ? `Event aktualisiert: ${record.title}`
          : `Neues Event erstellt: ${record.title}`

    const subscriberHeading =
      action === 'delete'
        ? 'Veranstaltung gelöscht!'
        : action === 'update'
          ? 'Veranstaltung aktualisiert!'
          : 'Neue Veranstaltung eingetragen!'

    const subscriberIntro =
      action === 'delete'
        ? 'Eine Veranstaltung im DZKB Event Manager wurde gelöscht.'
        : action === 'update'
          ? 'Eine Veranstaltung im DZKB Event Manager wurde geändert. Hier sind die aktuellen Details:'
          : 'Es gibt Neuigkeiten im DZKB Event Manager. Eine neue Veranstaltung wurde veröffentlicht:'

    const subscriberSubject =
      action === 'delete'
        ? `Event gelöscht: ${record.title}`
        : action === 'update'
          ? `Event aktualisiert: ${record.title}`
          : `Neues Event: ${record.title}`

    const actionButtonText = action === 'delete' ? 'Zum Dashboard' : 'Event ansehen'

    const adminEmail = {
      from: SENDER_EMAIL,
      to: ADMIN_EMAILS,
      subject: adminSubject,
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
            <h1>${adminHeading}</h1>
            <p>${adminIntro}</p>

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

    const subscriberMessages = subscriberEmails.map((email) => ({
      from: SENDER_EMAIL,
      to: email,
      subject: subscriberSubject,
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
            <h1>${subscriberHeading}</h1>
            <p>${subscriberIntro}</p>

            <div class="event-card">
                <h2 style="color: #333; margin-top: 0; font-size: 18px;">${record.title}</h2>
                <p><strong>📅 Datum:</strong> ${eventDate}</p>
                <p><strong>📍 Ort:</strong> ${record.location || 'Kein Ort angegeben'}</p>
                <p><strong>📝 Info:</strong> ${record.description || 'Keine Beschreibung vorhanden.'}</p>
            </div>

            <a href="${APP_URL}" class="button">${actionButtonText}</a>
        </div>

        <div class="footer">
            &copy; 2026 DZKB e.V. Bayern - Die zertifizierten kynologischen Berufsgruppen.<br><br>
            Sie erhalten diese E-Mail, weil Sie Benachrichtigungen aktiviert haben.
        </div>
    </div>
</body>
</html>
      `,
    }))

    const emailsToSend = [adminEmail, ...subscriberMessages]

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
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
