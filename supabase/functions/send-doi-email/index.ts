import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SENDER_EMAIL = 'info@fuehrerschein.dzkb.bayern' 
const APP_URL = Deno.env.get('APP_URL') || 'https://event-manager-nu-bay.vercel.app'

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

    const { email, token } = await req.json()

    if (!email || !token) throw new Error('Email oder Token fehlt')

    const confirmUrl = `${APP_URL}/confirm-subscription?token=${token}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: email,
        subject: `Bestätigung: E-Mail-Benachrichtigungen für neue Events`,
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
        .button { display: inline-block; padding: 14px 28px; background-color: #0066B2; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin-top: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #999999; background: #f9f9f9; }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://dzkb.bayern/wp-content/uploads/2026/03/Event-Manager.jpg" alt="DZKB Event Manager" class="banner">
        
        <div class="content">
            <h1>E-Mail-Benachrichtigungen bestätigen</h1>
            <p>Hallo,</p>
            <p>vielen Dank für Ihr Interesse! Sie haben angegeben, dass Sie per E-Mail informiert werden möchten, wenn neue Veranstaltungen eingetragen werden.</p>
            <p>Bitte klicken Sie auf den folgenden Button, um Ihre E-Mail-Adresse zu bestätigen und die Benachrichtigungen zu aktivieren:</p>
            
            <a href="${confirmUrl}" class="button">Benachrichtigungen aktivieren</a>
            
            <p style="margin-top: 30px; font-size: 14px;">Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
            <a href="${confirmUrl}" style="color: #0066B2;">${confirmUrl}</a></p>
        </div>
        
        <div class="footer">
            &copy; 2026 DZKB e.V. Bayern - Die zertifizierten kynologischen Berufsgruppen.<br>
            Falls Sie diese E-Mail nicht angefordert haben, können Sie sie einfach ignorieren.
        </div>
    </div>
</body>
</html>
        `,
      }),
    })

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
