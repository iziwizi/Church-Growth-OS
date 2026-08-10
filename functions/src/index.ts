// Church Growth OS — Firebase Cloud Functions Entry Point

// ── Firestore Triggers ──────────────────────────────────────
export { onMemberCreate, onMemberDelete } from './triggers/members'

// ── Scheduled Jobs ──────────────────────────────────────────
export {
  processJobQueue,
  morningDeclarations,
  birthdayAndAnniversaryCheck,
  ensureSundayServiceEvents,
} from './scheduled/index'

// ── AI Engagement Engine ─────────────────────────────────────
export { calculateEngagementScores } from './scheduled/engagement'

// ── Daily Executive Report ────────────────────────────────────
export { generateDailyExecutiveReport } from './scheduled/dailyReport'

// Note: Additional functions will be added in Stages 4-6:
// - Callable: ai-generate, send-communication
// - Webhooks: WhatsApp delivery, payment gateway callbacks
// - Triggers: visitors, donations, sermons
