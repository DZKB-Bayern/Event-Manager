import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAILS = ['oeffentlichkeitsarbeit@dzkb.bayern', 'mitgliederverwaltung@dzkb.bayern']
const SENDER_EMAIL = 'info@fuehrerschein.dzkb.bayern'   // Absender-Adresse (muss bei Resend verifiziert sein)

serve(async (req) => {
  // CORS Headers für Browser-Aufrufe
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      } 
    })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is missing')
    }

    // 1. Event-Daten aus dem Payload lesen
    // Unterstützt sowohl Supabase Webhooks ({ record: ... }) als auch direkte Aufrufe ({ ... })
    const payload = await req.json()
    const record = payload.record || payload 

    if (!record || !record.title) {
      throw new Error('Ungültige Event-Daten: Titel fehlt')
    }

    console.log(`Sende E-Mail für Event: ${record.title}`)

    // 2. E-Mail via Resend API senden
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: ADMIN_EMAILS,
        subject: `Neues Event erstellt: ${record.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Neues Event erstellt</h2>
            <p>Ein Mitglied hat eine neue Veranstaltung angelegt.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${record.title}</h3>
              <p><strong>Datum:</strong> ${record.start_time}</p>
              <p><strong>Ort:</strong> ${record.location || 'Kein Ort angegeben'}</p>
              <p><strong>Beschreibung:</strong><br>${record.description || 'Keine Beschreibung'}</p>
            </div>

            <p>
              <a href="${Deno.env.get('APP_URL') || '#'}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Zum Dashboard
              </a>
            </p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
        console.error('Resend API Error:', data)
        throw new Error(data.message || 'Fehler beim Senden der E-Mail')
    }
    
    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    })

  } catch (error) {
    console.error('Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    })
  }
})
