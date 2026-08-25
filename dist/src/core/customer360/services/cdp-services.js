"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessActionService = exports.BusinessActionService = exports.audienceService = exports.AudienceService = exports.identityResolutionService = exports.IdentityResolutionService = exports.anonymousVisitorService = exports.AnonymousVisitorService = exports.cdpEventHub = void 0;
const events_1 = require("events");
const customer_repository_1 = require("@/infrastructure/repositories/customer-repository");
const segment_repository_1 = require("@/infrastructure/repositories/segment-repository");
// Global Event Hub for the CDP Platform
class CdpEventHub extends events_1.EventEmitter {
}
exports.cdpEventHub = new CdpEventHub();
/**
 * 1. Anonymous Visitor Lifecycle Service
 */
class AnonymousVisitorService {
    async trackEvent(cookieId, eventType, eventDetails, meta) {
        const list = await customer_repository_1.customerRepository.list();
        let visitor = list.find(p => p.identity.cookieId === cookieId);
        if (!visitor) {
            // Create new anonymous visitor profile in identity store
            const customerId = `anon-cook-${Math.floor(1000 + Math.random() * 9000)}`;
            await customer_repository_1.customerRepository.save({
                uuid: customerId,
                identity: {
                    customerId,
                    name: 'Anonymous Visitor',
                    email: `${customerId}@anonymous.com`,
                    phone: '',
                    dob: '',
                    gender: 'Unknown',
                    address: '',
                    pan: 'Not Linked',
                    aadhaar: 'Not Linked',
                    passport: 'Not Linked',
                    segment: 'Regular',
                    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    sourceSystem: 'Website Cookie',
                    ingestedAt: new Date().toISOString(),
                    profileType: 'Anonymous Visitor',
                    cookieId,
                    sessionId: meta?.sessionId || `session-${Math.floor(1000 + Math.random() * 9000)}`,
                    browserFingerprint: meta?.browserFingerprint || 'fp-generic',
                    deviceId: meta?.deviceId || 'device-generic',
                    referrer: meta?.referrer || 'Direct',
                    utmSource: meta?.utmSource || 'organic',
                    browser: meta?.browser || 'Chrome',
                    location: meta?.location || 'Unknown',
                    device: meta?.device || 'Desktop',
                    country: meta?.country || 'India'
                },
                piiTags: [],
                behavioralEvents: [],
                financial: {
                    accounts: [],
                    cards: [],
                    loans: [],
                    invoices: [],
                    payments: [],
                    subscriptions: [],
                    creditScore: 600
                },
                lineage: [],
                confidence: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            // Reload list to resolve new profile reference
            const updatedList = await customer_repository_1.customerRepository.list();
            visitor = updatedList.find(p => p.identity.cookieId === cookieId);
        }
        if (visitor) {
            visitor.behavioralEvents.push({
                eventId: `evt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
                type: eventType,
                timestamp: new Date().toISOString(),
                source: 'Clickstream Web SDK',
                details: eventDetails,
                campaign: meta?.campaign,
                device: visitor.identity.device,
                browser: visitor.identity.browser,
                geo: visitor.identity.location,
                referral: visitor.identity.referrer
            });
            exports.cdpEventHub.emit('ProfileUpdated', { profileUuid: visitor.uuid });
        }
    }
}
exports.AnonymousVisitorService = AnonymousVisitorService;
exports.anonymousVisitorService = new AnonymousVisitorService();
/**
 * 2. Identity Resolution Service (Stitching and explainability)
 */
class IdentityResolutionService {
    async authenticateAndMerge(anonymousId, email, name) {
        const mergedProfile = await customer_repository_1.customerRepository.mergeAnonymousVisitor(anonymousId, email, name);
        if (mergedProfile) {
            exports.cdpEventHub.emit('ProfileMerged', {
                email,
                unifiedUuid: mergedProfile.uuid,
                reason: mergedProfile.matchReason,
                explainability: mergedProfile.explainability
            });
            exports.cdpEventHub.emit('ProfileUpdated', { profileUuid: mergedProfile.uuid });
        }
        return mergedProfile;
    }
}
exports.IdentityResolutionService = IdentityResolutionService;
exports.identityResolutionService = new IdentityResolutionService();
/**
 * 3. Event-Driven Audience & Segment Evaluation Service
 */
class AudienceService {
    constructor() {
        // Listen to profile updates and trigger re-evaluation
        exports.cdpEventHub.on('ProfileUpdated', async (data) => {
            console.log(`[CDP Audience Engine] Profile update event received: ${data.profileUuid}. Triggering dynamic segments update...`);
            await this.reEvaluateAllSegments();
        });
    }
    async reEvaluateAllSegments() {
        const segments = await segment_repository_1.segmentRepository.list();
        for (const seg of segments) {
            const matched = await segment_repository_1.segmentRepository.matchProfiles(seg.rules);
            console.log(`[CDP Audience Engine] Segment '${seg.name}' evaluated: ${matched.length} matching profiles.`);
        }
    }
}
exports.AudienceService = AudienceService;
exports.audienceService = new AudienceService();
/**
 * 4. Business Actions Service (Exposes business intent)
 */
class BusinessActionService {
    async executeAction(actionType, segmentId) {
        const segments = await segment_repository_1.segmentRepository.list();
        const segment = segments.find(s => s.id === segmentId);
        if (!segment)
            throw new Error('Segment not found');
        const matched = await segment_repository_1.segmentRepository.matchProfiles(segment.rules);
        const jobLogId = `job-${actionType}-${Date.now().toString().slice(-6)}`;
        // Simulate campaign result attributions
        const ctr = Number((3.0 + Math.random() * 8.0).toFixed(2));
        const conv = Number((1.0 + Math.random() * 4.0).toFixed(2));
        const revenue = matched.length * 200;
        const roi = Number((2.5 + Math.random() * 4.5).toFixed(1));
        console.log(`[CDP Activation] Executed Business Action: ${actionType} on segment '${segment.name}' (size: ${matched.length} profiles)`);
        return {
            jobId: jobLogId,
            segmentId,
            segmentName: segment.name,
            action: actionType,
            status: 'Synced',
            syncTime: new Date().toISOString(),
            rowsSynced: matched.length,
            latencyMs: Math.floor(200 + Math.random() * 800),
            campaignResults: {
                ctr,
                conversionRate: conv,
                revenue,
                roi,
                ctrComparison: Number((15 + Math.random() * 30).toFixed(1))
            }
        };
    }
}
exports.BusinessActionService = BusinessActionService;
exports.businessActionService = new BusinessActionService();
