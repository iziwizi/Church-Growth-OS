import { NextResponse } from 'next/server'

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  sermon_reels: 'Create a short-form social media sermon reel script with a hook, key message, and call to action.',
  announcement: 'Write a church announcement message suitable for WhatsApp and social media.',
  newsletter: 'Write a professional church newsletter section with an engaging introduction and highlights.',
  prayer_content: 'Write an inspiring prayer guide or devotional content for the church.',
  event_promo: 'Write promotional copy for a church event including a compelling headline and details.',
  follow_up: 'Write a warm, pastoral follow-up message for a first-time visitor.',
}

export async function POST(req: Request) {
  try {
    const { prompt, contentType, churchName } = await req.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
    }

    const typeInstruction = CONTENT_TYPE_PROMPTS[contentType] ?? 'Create helpful church content.'

    // Construct a structured AI prompt
    const systemPrompt = `You are an expert church communications AI for ${churchName ?? 'a Christian church'}. 
Your outputs are professional, pastoral, and faith-based. 
${typeInstruction}
Keep responses concise and production-ready. Use scripture references where appropriate.`

    const userMessage = `Create content based on this message or theme: "${prompt}"`

    // 1. Try Google Gemini if configured
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (geminiApiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\n${userMessage}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            }
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (text) {
          return NextResponse.json({ result: text, provider: 'gemini' })
        }
      }
    }

    // 2. Try OpenRouter as a fallback if configured
    const openrouterKey = process.env.OPENROUTER_API_KEY

    if (openrouterKey) {
      const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mujteknify.com',
          'X-Title': 'Church Growth OS',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      })

      if (orResponse.ok) {
        const orData = await orResponse.json()
        const text = orData.choices?.[0]?.message?.content ?? ''
        if (text) {
          return NextResponse.json({ result: text, provider: 'openrouter' })
        }
      }
    }

    // Fallback: generate structured template content
    const templates: Record<string, string> = {
      sermon_reels: `🎬 SERMON REEL — ${churchName ?? 'Church'}\n\n` +
        `📌 HOOK\n"${prompt}"\n\n` +
        `📖 KEY SCRIPTURE\nSearch for a verse that matches your theme.\n\n` +
        `💡 CORE MESSAGE\nYour message here — keep it to 60 seconds when spoken.\n\n` +
        `📢 CALL TO ACTION\n"Join us this Sunday at ${churchName ?? 'our church'}! Share this with someone who needs it."`,

      announcement: `📢 ANNOUNCEMENT — ${churchName ?? 'Church'}\n\n` +
        `🔔 ATTENTION BELOVED CONGREGATION!\n\n` +
        `${prompt}\n\n` +
        `📅 Date & Time: [Insert Details]\n` +
        `📍 Venue: [Insert Location]\n\n` +
        `For more info, contact the church office.\n\n` +
        `God bless you! 🙏`,

      newsletter: `📰 CHURCH NEWSLETTER\n${churchName ?? 'Church'} — ${new Date().toLocaleDateString()}\n\n` +
        `GREETINGS FROM THE PASTORAL TEAM\n\n` +
        `${prompt}\n\n` +
        `We thank God for all He is doing in our midst. Keep pressing forward in faith!\n\n` +
        `In His Service,\nThe Pastoral Team`,

      prayer_content: `🙏 PRAYER FOCUS — ${churchName ?? 'Church'}\n\n` +
        `THEME: ${prompt}\n\n` +
        `Father God, we come before you with grateful hearts...\n` +
        `[Prayer point 1 aligned to theme]\n` +
        `[Prayer point 2 aligned to theme]\n` +
        `[Prayer point 3 aligned to theme]\n\n` +
        `In Jesus' Name, Amen.`,

      event_promo: `🎉 EVENT ALERT — ${churchName ?? 'Church'}\n\n` +
        `YOU ARE INVITED!\n\n` +
        `"${prompt}"\n\n` +
        `📅 Date: [Insert Date]\n⏰ Time: [Insert Time]\n📍 Venue: [Insert Location]\n\n` +
        `Come and be blessed! Invite a friend.\n\n` +
        `RSVP: [Insert Contact]`,

      follow_up: `Dear Beloved,\n\n` +
        `It was a joy having you with us at ${churchName ?? 'our church'}!\n\n` +
        `${prompt}\n\n` +
        `We would love to see you again soon. Our doors are always open, and our family is growing!\n\n` +
        `If you have any questions or need prayer, please don't hesitate to reach out.\n\n` +
        `God bless you abundantly,\nThe Pastoral Team at ${churchName ?? 'Church'}`,
    }

    const result = templates[contentType] ?? `[AI Content]\n\nTheme: "${prompt}"\nChurch: ${churchName ?? 'Church'}\n\nContent generated for ${contentType}.`

    return NextResponse.json({ result })
  } catch (err) {
    console.error('AI generate error:', err)
    return NextResponse.json({ error: 'Failed to generate content.' }, { status: 500 })
  }
}
