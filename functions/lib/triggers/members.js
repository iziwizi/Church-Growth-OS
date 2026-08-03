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
exports.onMemberDelete = exports.onMemberCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../firebase");
/**
 * Trigger: When a new member document is created.
 * - Write audit log
 * - Update church member count
 * - Enroll in new member onboarding workflow (TODO: Stage 6)
 */
exports.onMemberCreate = functions.firestore
    .document('churches/{churchId}/members/{memberId}')
    .onCreate(async (snap, context) => {
    const { churchId, memberId } = context.params;
    const member = snap.data();
    const batch = firebase_1.db.batch();
    // 1. Write audit log
    const auditRef = firebase_1.db
        .collection('churches')
        .doc(churchId)
        .collection('auditLogs')
        .doc();
    batch.set(auditRef, {
        id: auditRef.id,
        churchId,
        actorId: member.createdBy ?? 'system',
        actorEmail: 'system',
        action: 'member.created',
        resourceType: 'member',
        resourceId: memberId,
        before: null,
        after: { firstName: member.firstName, lastName: member.lastName, status: member.status },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    // 2. Increment member count
    const churchRef = firebase_1.db.collection('churches').doc(churchId);
    batch.update(churchRef, {
        'metrics.totalMembers': admin.firestore.FieldValue.increment(1),
        'metrics.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    functions.logger.info(`Member created: ${memberId} in church: ${churchId}`);
});
/**
 * Trigger: When a member document is deleted.
 * - Write audit log
 * - Decrement church member count
 */
exports.onMemberDelete = functions.firestore
    .document('churches/{churchId}/members/{memberId}')
    .onDelete(async (snap, context) => {
    const { churchId, memberId } = context.params;
    const batch = firebase_1.db.batch();
    // Audit log
    const auditRef = firebase_1.db.collection('churches').doc(churchId).collection('auditLogs').doc();
    batch.set(auditRef, {
        id: auditRef.id,
        churchId,
        actorId: 'system',
        actorEmail: 'system',
        action: 'member.deleted',
        resourceType: 'member',
        resourceId: memberId,
        before: snap.data(),
        after: null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Decrement count
    const churchRef = firebase_1.db.collection('churches').doc(churchId);
    batch.update(churchRef, {
        'metrics.totalMembers': admin.firestore.FieldValue.increment(-1),
        'metrics.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();
});
// Need to import admin for FieldValue
const admin = __importStar(require("firebase-admin"));
//# sourceMappingURL=members.js.map