import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue } from 'firebase-admin/firestore'

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  sermon_reels: 'Create a short-form social media sermon reel script with a hook, key message, scripture reference, and call to action.',
  announcement: 'Write an engaging church announcement message suitable for WhatsApp and social media with dates and details.',
  newsletter: 'Write a professional church newsletter article with a pastoral introduction, scripture reflection, and upcoming highlights.',
  prayer_content: 'Write an inspiring prayer guide or 3-point devotional for the church congregation.',
  event_promo: 'Write persuasive promotional copy for a church event including a compelling headline, date, time, and invitation.',
  follow_up: 'Write a warm, personalized, pastoral follow-up message for a first-time visitor to encourage return visits.',
  sermon_summary: 'Extract the 3 main spiritual takeaways, practical action steps, and key bible verses from this sermon notes or transcript.',
  whatsapp_broadcast: 'Format a clear, friendly, emoji-enhanced WhatsApp announcement broadcast for church members.',
}

export async function POST(req: Request) {
  try {
    const { prompt, contentType, churchName, churchId, model } = await req.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
    }

    const typeInstruction = CONTENT_TYPE_PROMPTS[contentType] ?? 'Create helpful, faith-based church ministry content.'

    // Construct a structured AI prompt
    const systemPrompt = `You are an expert church communications AI for ${churchName ?? 'a Christian church'}.
Your outputs are professional, pastoral, spiritually uplifting, and production-ready.
${typeInstruction}
Keep responses concise, well-structured, and ready to share.`

    const userMessage = `Create content based on this theme, sermon, or request: "${prompt}"`

    let generatedText = ''
    let activeProvider = 'template'

    // 1. Retrieve configured OpenRouter or Gemini credentials from Firestore system collection
    let openrouterKey = process.env.OPENROUTER_API_KEY
    let geminiApiKey = process.env.GEMINI_API_KEY
    let targetModel = model || 'openai/gpt-4o-mini'

    if (adminDb) {
      try {
        const aiConfigSnap = await adminDb.collection('system').doc('ai_providers').get()
        if (aiConfigSnap.exists) {
          const cfg = aiConfigSnap.data()
          if (cfg?.openrouterApiKey) openrouterKey = cfg.openrouterApiKey
          if (cfg?.geminiApiKey) geminiApiKey = cfg.geminiApiKey
          if (cfg?.primaryModel) targetModel = cfg.primaryModel
        }
      } catch (err) {
        console.warn('Could not load system AI provider config:', err)
      }
    }

    // 2. Execute via OpenRouter if key is available
    if (openrouterKey) {
      try {
        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://mujteknify.com',
            'X-Title': 'Church Growth OS',
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        })

        if (orResponse.ok) {
          const orData = await orResponse.json()
          generatedText = orData.choices?.[0]?.message?.content ?? ''
          if (generatedText) activeProvider = `openrouter (${targetModel})`
        }
      } catch (e) {
        console.warn('OpenRouter generation attempt failed:', e)
      }
    }

    // 3. Fallback to Google Gemini
    if (!generatedText && geminiApiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: `${systemPrompt}\n\n${userMessage}` }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
              },
            }),
          }
        )

        if (geminiRes.ok) {
          const data = await geminiRes.json()
          generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
          if (generatedText) activeProvider = 'gemini-1.5-flash'
        }
      } catch (e) {
        console.warn('Gemini generation attempt failed:', e)
      }
    }

    // 4. Fallback to Structured Ministry Templates
    if (!generatedText) {
      const templates: Record<string, string> = {
        sermon_reels: `🎬 SERMON REEL — ${churchName ?? 'Church'}\n\n` +
          `📌 HOOK\n"${prompt}"\n\n` +
          `📖 SCRIPTURE FOCUS\n"For I know the plans I have for you," declares the Lord. (Jeremiah 29:11)\n\n` +
          `💡 CORE TAKEAWAY\nGod is shifting you into a new season of supernatural acceleration.\n\n` +
          `📢 CALL TO ACTION\n"Join us this Sunday at ${churchName ?? 'our church'}! Share this with someone who needs it."`,

        announcement: `📢 ANNOUNCEMENT — ${churchName ?? 'Church'}\n\n` +
          `🔔 ATTENTION BELOVED CONGREGATION!\n\n` +
          `${prompt}\n\n` +
          `📅 Date & Time: This Sunday | 9:00 AM\n` +
          `📍 Venue: Main Sanctuary & Online\n\n` +
          `Come expectant for a mighty move of God. Invite friends and family!\n\n` +
          `God bless you abundantly! 🙏`,

        newsletter: `📰 MINISTRY NEWSLETTER\n${churchName ?? 'Church'} — Monthly Devotional\n\n` +
          `GREETINGS FROM THE PASTORAL TEAM\n\n` +
          `${prompt}\n\n` +
          `As we walk in faith, remember that His grace is sufficient for every trial. Keep pressing forward!\n\n` +
          `In His Service,\nThe Pastoral Team`,

        prayer_content: `🙏 PRAYER FOCUS & DEVOTIONAL — ${churchName ?? 'Church'}\n\n` +
          `THEME: ${prompt}\n\n` +
          `1. Father, thank you for your unfailing love and guidance over our congregation.\n` +
          `2. Lord, empower our families to walk in supernatural wisdom and divine protection.\n` +
          `3. We decree breakthrough and salvation for all our first-time visitors and neighbors.\n\n` +
          `In Jesus' Name, Amen! ✨`,

        event_promo: `🎉 SPECIAL INVITATION — ${churchName ?? 'Church'}\n\n` +
          `YOU ARE SPECIALLY INVITED!\n\n` +
          `"${prompt}"\n\n` +
          `📅 Date: Upcoming Weekend\n⏰ Time: 9:00 AM & 11:30 AM\n📍 Venue: Sanctuary\n\n` +
          `Experience dynamic worship, word, and fellowship. Admission is free!\n\n` +
          `RSVP: Visit our welcome desk or reply to this message.`,

        follow_up: `Dear Beloved Friend,\n\n` +
          `It was truly a joy having you worship with us at ${churchName ?? 'our church'}!\n\n` +
          `${prompt}\n\n` +
          `We believe God has great things in store for you. You are always welcome in our family!\n\n` +
          `If you have any prayer requests or questions, please reply directly.\n\n` +
          `Blessings,\nThe Pastoral Team at ${churchName ?? 'Church'}`,

        sermon_summary: `📖 SERMON SUMMARY & ACTION POINTS\n\n` +
          `Topic: "${prompt}"\n\n` +
          `1. Key Truth: God's promises never fail when we remain rooted in faith.\n` +
          `2. Practical Step: Dedicate 15 minutes daily to quiet prayer and scripture.\n` +
          `3. Weekly Declaration: "I walk in victory and favor in every endeavor."`,

        whatsapp_broadcast: `✨ *${churchName ?? 'CHURCH'} BROADCAST* ✨\n\n` +
          `Beloved family,\n\n` +
          `${prompt}\n\n` +
          `📌 *Reminder:* Midweek Service is this Wednesday at 6:30 PM.\n` +
          `📲 Share this message to bless someone today!\n\n` +
          `_Grace and peace be multiplied unto you._ 🙏`,
      }

      generatedText = templates[contentType] ?? `[AI Generation for ${churchName ?? 'Church'}]\n\nTheme: "${prompt}"\n\nContent generated successfully for ${contentType}.`
    }

    // 5. Track Usage and Deduct 1 Credit from church in Firestore
    if (churchId && adminDb) {
      try {
        const churchRef = adminDb.collection('churches').doc(churchId)
        await churchRef.update({
          'subscription.aiCreditsRemaining': FieldValue.increment(-1),
          'metrics.totalAiGenerations': FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        })

        // Log to aiUsage subcollection
        await churchRef.collection('aiUsage').add({
          contentType,
          promptSnippet: prompt.slice(0, 100),
          provider: activeProvider,
          model: targetModel,
          creditsDeducted: 1,
          createdAt: FieldValue.serverTimestamp(),
        })
      } catch (err) {
        console.warn('Could not record AI usage telemetry:', err)
      }
    }

    return NextResponse.json({
      success: true,
      result: generatedText,
      provider: activeProvider,
    })
  } catch (err: any) {
    console.error('AI generate error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate content.' }, { status: 500 })
  }
}
