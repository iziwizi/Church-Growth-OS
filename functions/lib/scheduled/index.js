"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.birthdayAndAnniversaryCheck = exports.morningDeclarations = exports.processJobQueue = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("../firebase");
/**
 * Scheduled: Every 5 minutes.
 * Processes pending jobs from the Firestore job queue.
 * This is the Tier 2 scheduler — handles dynamic per-entity jobs.
 */
exports.processJobQueue = functions.pubsub
    .schedule('*/5 * * * *')
    .timeZone('UTC')
    .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    // Get pending jobs scheduled for now or earlier
    const snapshot = await firebase_1.db
        .collection('scheduledJobs')
        .where('status', '==', 'pending')
        .where('scheduledAt', '<=', now)
        .orderBy('scheduledAt', 'asc')
        .limit(50)
        .get();
    if (snapshot.empty) {
        functions.logger.info('No pending jobs to process');
        return;
    }
    functions.logger.info(`Processing ${snapshot.size} jobs`);
    const promises = snapshot.docs.map(async (doc) => {
        const job = { id: doc.id, ...doc.data() };
        // Mark as processing
        await doc.ref.update({
            status: 'processing',
            lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
            attempts: admin.firestore.FieldValue.increment(1),
        });
        try {
            await executeJob(job);
            await doc.ref.update({ status: 'done' });
            functions.logger.info(`Job ${job.id} (${job.jobType}) completed`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            functions.logger.error(`Job ${job.id} failed:`, errorMessage);
            // Retry up to 3 times, then fail permanently
            const newStatus = (job.attempts ?? 0) >= 3 ? 'failed' : 'pending';
            await doc.ref.update({ status: newStatus, error: errorMessage });
        }
    });
    await Promise.allSettled(promises);
});
async function executeJob(job) {
    switch (job.jobType) {
        case 'send_whatsapp':
            // TODO: Stage 4 — wire CommunicationRouter
            functions.logger.info(`Executing WhatsApp job for church: ${job.churchId}`);
            break;
        case 'send_email':
            functions.logger.info(`Executing email job for church: ${job.churchId}`);
            break;
        case 'send_sms':
            functions.logger.info(`Executing SMS job for church: ${job.churchId}`);
            break;
        case 'advance_workflow':
            // TODO: Stage 6 — wire WorkflowEngine
            functions.logger.info(`Advancing workflow for church: ${job.churchId}`);
            break;
        default:
            functions.logger.warn(`Unknown job type: ${job.jobType}`);
    }
}
/**
 * Scheduled: Daily at 5AM UTC.
 * Morning declarations for all churches with this feature enabled.
 */
exports.morningDeclarations = functions.pubsub
    .schedule('0 5 * * *')
    .timeZone('UTC')
    .onRun(async () => {
    functions.logger.info('Running morning declarations job');
    const churchesSnapshot = await firebase_1.db
        .collection('churches')
        .where('status', '==', 'active')
        .where('settings.automationEnabled', '==', true)
        .get();
    functions.logger.info(`Processing declarations for ${churchesSnapshot.size} churches`);
    for (const churchDoc of churchesSnapshot.docs) {
        const church = churchDoc.data();
        const hasMorningDeclaration = church.settings?.featureFlags?.morning_declaration ?? false;
        if (!hasMorningDeclaration)
            continue;
        // Queue AI generation job for this church
        await firebase_1.db.collection('scheduledJobs').add({
            jobType: 'ai_morning_declaration',
            churchId: churchDoc.id,
            payload: {
                date: new Date().toISOString().split('T')[0],
                timezone: church.branding?.timezone ?? 'UTC',
            },
            scheduledAt: admin.firestore.Timestamp.now(),
            status: 'pending',
            attempts: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    functions.logger.info('Morning declarations jobs queued');
});
/**
 * Scheduled: Daily at 7AM UTC.
 * Birthday and anniversary check for all active churches.
 */
exports.birthdayAndAnniversaryCheck = functions.pubsub
    .schedule('0 7 * * *')
    .timeZone('UTC')
    .onRun(async () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    functions.logger.info(`Birthday check for ${month}/${day}`);
    // Get all active churches
    const churchesSnapshot = await firebase_1.db
        .collection('churches')
        .where('status', '==', 'active')
        .where('settings.automationEnabled', '==', true)
        .get();
    for (const churchDoc of churchesSnapshot.docs) {
        // Queue birthday check job per church (actual member query happens in job)
        await firebase_1.db.collection('scheduledJobs').add({
            jobType: 'birthday_check',
            churchId: churchDoc.id,
            payload: { month, day, timezone: churchDoc.data().branding?.timezone ?? 'UTC' },
            scheduledAt: admin.firestore.Timestamp.now(),
            status: 'pending',
            attempts: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
//# sourceMappingURL=index.js.map