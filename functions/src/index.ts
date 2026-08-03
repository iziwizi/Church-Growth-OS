// Church Growth OS — Firebase Cloud Functions Entry Point

// ── Firestore Triggers ──────────────────────────────────────
export { onMemberCreate, onMemberDelete } from './triggers/members'

// ── Scheduled Jobs ──────────────────────────────────────────
export {
  processJobQueue,
  morningDeclarations,
  birthdayAndAnniversaryCheck,
} from './scheduled/index'

// Note: Additional functions will be added in Stages 4-6:
// - Callable: ai-generate, send-communication
// - Webhooks: WhatsApp delivery, payment gateway callbacks
// - Triggers: visitors, donations, sermons
