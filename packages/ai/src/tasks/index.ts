import type { ChurchContext, SermonRepurposeInput, SermonRepurposeOutput, AITask, AIPrompt } from '../interfaces'
import type { AITaskType } from '@church-growth-os/shared'

/**
 * Sermon Repurposer AI Task.
 * Transforms a sermon into multi-channel content.
 */
export const sermonRepurposeTask: AITask<SermonRepurposeInput, SermonRepurposeOutput> = {
  taskType: 'sermon.repurpose' as AITaskType,

  buildPrompt(context: ChurchContext, input: SermonRepurposeInput): AIPrompt {
    return {
      system: `You are a ministry content specialist for ${context.churchName}, a church based in ${context.country}. 
Your role is to repurpose sermon content into engaging multi-channel ministry communication.

CRITICAL RULES:
- Only use content provided by the church. Do not add external theological content.
- Maintain the theological tone and style of ${context.churchName}.
- All content must be warm, faith-building, and congregation-appropriate.
- Format output as valid JSON matching the specified schema exactly.`,

      user: `Repurpose this sermon into multi-channel content:

SERMON DETAILS:
Title: ${input.title}
Preacher: ${input.preacher}
Scriptures: ${input.scriptures.join(', ')}
Description: ${input.description}
${input.keyPoints ? `Key Points:\n${input.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}
${input.rawTranscript ? `Transcript Excerpt:\n${input.rawTranscript.slice(0, 2000)}` : ''}

Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence sermon summary",
  "whatsappMessage": "WhatsApp message (max 300 chars, conversational, with emoji)",
  "emailSubject": "Email subject line",
  "emailBody": "Full email body (HTML allowed)",
  "socialCaptions": [
    {"platform": "instagram", "caption": "Instagram caption with hashtags"},
    {"platform": "facebook", "caption": "Facebook caption"},
    {"platform": "twitter", "caption": "Twitter caption (max 280 chars)"}
  ],
  "prayerPoints": ["Prayer point 1", "Prayer point 2", "Prayer point 3"],
  "keyQuotes": ["Quote 1", "Quote 2"]
}`,

      maxTokens: 2000,
      temperature: 0.7,
    }
  },

  parseOutput(raw: string): SermonRepurposeOutput {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch?.[0]) {
      throw new Error('Could not parse AI output as JSON')
    }
    const parsed = JSON.parse(jsonMatch[0]) as SermonRepurposeOutput
    return parsed
  },
}

/**
 * Morning Declaration AI Task.
 */
export const morningDeclarationTask: AITask<
  { date: string; scripture?: string; theme?: string; churchProvidedContent?: string },
  { declaration: string; scripture: string; affirmation: string }
> = {
  taskType: 'declaration.generate' as AITaskType,

  buildPrompt(
    context: ChurchContext,
    input: { date: string; scripture?: string; theme?: string; churchProvidedContent?: string }
  ): AIPrompt {
    return {
      system: `You are writing morning declarations for ${context.churchName} congregation. 
Only use the church-provided content and scriptures. 
Keep declarations faith-filled, positive, and biblically grounded.
Return only valid JSON.`,

      user: `Create a morning declaration for ${input.date}.
${input.scripture ? `Featured Scripture: ${input.scripture}` : ''}
${input.theme ? `Theme: ${input.theme}` : ''}
${input.churchProvidedContent ? `Church Content: ${input.churchProvidedContent}` : ''}

Return JSON:
{
  "declaration": "Powerful morning declaration (2-3 paragraphs, speaking faith)",
  "scripture": "Key scripture reference",
  "affirmation": "One-line daily affirmation"
}`,

      maxTokens: 600,
      temperature: 0.8,
    }
  },

  parseOutput(raw: string) {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch?.[0]) throw new Error('Could not parse declaration output')
    return JSON.parse(jsonMatch[0]) as { declaration: string; scripture: string; affirmation: string }
  },
}

/**
 * Visitor Follow-up Message AI Task.
 */
export const visitorFollowUpTask: AITask<
  { visitorName: string; dateOfFirstVisit: string; followUpNumber: number; howHeardAboutUs?: string },
  { message: string }
> = {
  taskType: 'follow_up.generate' as AITaskType,

  buildPrompt(
    context: ChurchContext,
    input: { visitorName: string; dateOfFirstVisit: string; followUpNumber: number; howHeardAboutUs?: string }
  ): AIPrompt {
    const followUpContext = ['first', 'second', 'third', 'fourth'][input.followUpNumber - 1] ?? 'follow-up'

    return {
      system: `You are writing a ${followUpContext} follow-up message from ${context.churchName}.
Be warm, personal, and welcoming. Never pushy. Max 200 words for WhatsApp.`,

      user: `Write a ${followUpContext} follow-up WhatsApp message for ${input.visitorName} who visited ${context.churchName} on ${input.dateOfFirstVisit}.
${input.howHeardAboutUs ? `They found us through: ${input.howHeardAboutUs}` : ''}

Return JSON: { "message": "WhatsApp message text" }`,

      maxTokens: 300,
      temperature: 0.8,
    }
  },

  parseOutput(raw: string) {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch?.[0]) throw new Error('Could not parse follow-up output')
    return JSON.parse(jsonMatch[0]) as { message: string }
  },
}
