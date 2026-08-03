"use strict";
// Church Growth OS — Firebase Cloud Functions Entry Point
Object.defineProperty(exports, "__esModule", { value: true });
exports.birthdayAndAnniversaryCheck = exports.morningDeclarations = exports.processJobQueue = exports.onMemberDelete = exports.onMemberCreate = void 0;
// ── Firestore Triggers ──────────────────────────────────────
var members_1 = require("./triggers/members");
Object.defineProperty(exports, "onMemberCreate", { enumerable: true, get: function () { return members_1.onMemberCreate; } });
Object.defineProperty(exports, "onMemberDelete", { enumerable: true, get: function () { return members_1.onMemberDelete; } });
// ── Scheduled Jobs ──────────────────────────────────────────
var index_1 = require("./scheduled/index");
Object.defineProperty(exports, "processJobQueue", { enumerable: true, get: function () { return index_1.processJobQueue; } });
Object.defineProperty(exports, "morningDeclarations", { enumerable: true, get: function () { return index_1.morningDeclarations; } });
Object.defineProperty(exports, "birthdayAndAnniversaryCheck", { enumerable: true, get: function () { return index_1.birthdayAndAnniversaryCheck; } });
// Note: Additional functions will be added in Stages 4-6:
// - Callable: ai-generate, send-communication
// - Webhooks: WhatsApp delivery, payment gateway callbacks
// - Triggers: visitors, donations, sermons
//# sourceMappingURL=index.js.map