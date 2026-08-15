import { GoldenCustomerProfile } from '../../core/customer360/domain/types';
import { identityRepository, behaviorRepository, financialRepository } from './cdp-repositories';
import { v5 as uuidv5 } from 'uuid';
import { config } from '../../core/config';
import { bootstrap } from '@/core/services/bootstrap';

export class CustomerRepository {
  async save(profile: GoldenCustomerProfile): Promise<GoldenCustomerProfile> {
    const idBlock = profile.identity;
    await identityRepository.save({
      customerId: idBlock.customerId || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: idBlock.name || '',
      email: idBlock.email || '',
      phone: idBlock.phone || '',
      dob: idBlock.dob || '',
      gender: idBlock.gender || 'Unknown',
      address: idBlock.address || '',
      pan: idBlock.pan || 'Not Linked',
      aadhaar: idBlock.aadhaar || 'Not Linked',
      passport: idBlock.passport || 'Not Linked',
      segment: idBlock.segment || 'Regular',
      photoUrl: idBlock.photoUrl,
      sourceSystem: idBlock.sourceSystem || 'Platform UI',
      ingestedAt: idBlock.ingestedAt || new Date().toISOString(),
      profileType: idBlock.profileType,
      cookieId: idBlock.cookieId,
      sessionId: idBlock.sessionId,
      browserFingerprint: idBlock.browserFingerprint,
      deviceId: idBlock.deviceId,
      referrer: idBlock.referrer,
      utmSource: idBlock.utmSource,
      browser: idBlock.browser,
      location: idBlock.location,
      device: idBlock.device,
      country: idBlock.country
    });

    return profile;
  }

  async findByUuid(uuid: string): Promise<GoldenCustomerProfile | undefined> {
    const list = await this.list();
    return list.find(p => p.uuid === uuid);
  }

  async list(): Promise<GoldenCustomerProfile[]> {
    const identities = await identityRepository.list();
    const behaviors = await behaviorRepository.list();
    const financials = await financialRepository.list();

    const profilesMap = new Map<string, GoldenCustomerProfile>();

    for (const record of identities) {
      let matchedUuid: string | null = null;

      for (const p of Array.from(profilesMap.values())) {
        const exactIdMatch = record.customerId && p.identity.customerId === record.customerId;
        const exactEmailMatch = record.email && p.identity.email?.toLowerCase() === record.email.toLowerCase();
        const exactPhoneMatch = record.phone && p.identity.phone === record.phone;
        const exactPanMatch = record.pan && record.pan !== 'Not Linked' && p.identity.pan === record.pan;
        const exactAadhaarMatch = record.aadhaar && record.aadhaar !== 'Not Linked' && p.identity.aadhaar === record.aadhaar;
        const exactPassportMatch = record.passport && record.passport !== 'Not Linked' && p.identity.passport === record.passport;
        const compositeMatch = record.name && record.dob && p.identity.name === record.name && p.identity.dob === record.dob;

        if (exactIdMatch || exactEmailMatch || exactPhoneMatch || exactPanMatch || exactAadhaarMatch || exactPassportMatch || compositeMatch) {
          matchedUuid = p.uuid;
          
          const reasons: string[] = [];
          if (exactIdMatch) reasons.push('Customer ID');
          if (exactEmailMatch) reasons.push('Email Address');
          if (exactPhoneMatch) reasons.push('Phone Number');
          if (exactPanMatch) reasons.push('PAN Card');
          if (exactAadhaarMatch) reasons.push('Aadhaar Card');
          if (exactPassportMatch) reasons.push('Passport Number');
          if (compositeMatch) reasons.push('Name & DOB');

          p.matchReason = `Deterministic Match (${reasons.join(', ')})`;
          p.evidence = p.evidence || [];
          if (!p.evidence.includes(record.sourceSystem)) {
            p.evidence.push(record.sourceSystem);
          }
          p.explainability = `Profile merged based on matching attributes: [${reasons.join(', ')}]. Contributing system: ${record.sourceSystem}.`;
          
          break;
        }
      }

      const recordEmail = (record.email || '').trim().toLowerCase();
      const canonicalSeed = matchedUuid 
        ? null 
        : recordEmail 
          ? `email:${recordEmail}` 
          : record.customerId 
            ? `id:${record.customerId}` 
            : record.cookieId 
              ? `cookie:${record.cookieId}` 
              : `record:${record.name || 'anon'}_${record.phone || 'nophone'}_${record.sourceSystem || 'unknown'}`;
      const uuid = matchedUuid || uuidv5(canonicalSeed!, config.identity.namespace);
      const existingProfile = profilesMap.get(uuid);

      if (existingProfile) {
        existingProfile.identity.name = existingProfile.identity.name || record.name;
        existingProfile.identity.email = existingProfile.identity.email || record.email;
        existingProfile.identity.phone = existingProfile.identity.phone || record.phone;
        existingProfile.identity.dob = existingProfile.identity.dob || record.dob;
        existingProfile.identity.address = existingProfile.identity.address || record.address;
        existingProfile.identity.pan = (existingProfile.identity.pan === 'Not Linked' ? record.pan : existingProfile.identity.pan) || record.pan;
        existingProfile.identity.aadhaar = (existingProfile.identity.aadhaar === 'Not Linked' ? record.aadhaar : existingProfile.identity.aadhaar) || record.aadhaar;
        existingProfile.identity.passport = (existingProfile.identity.passport === 'Not Linked' ? record.passport : existingProfile.identity.passport) || record.passport;
        
        existingProfile.identity.profileType = existingProfile.identity.profileType || record.profileType;
        existingProfile.identity.cookieId = existingProfile.identity.cookieId || record.cookieId;
        existingProfile.identity.sessionId = existingProfile.identity.sessionId || record.sessionId;
        existingProfile.identity.browserFingerprint = existingProfile.identity.browserFingerprint || record.browserFingerprint;
        existingProfile.identity.deviceId = existingProfile.identity.deviceId || record.deviceId;
        existingProfile.identity.referrer = existingProfile.identity.referrer || record.referrer;
        existingProfile.identity.utmSource = existingProfile.identity.utmSource || record.utmSource;
        existingProfile.identity.browser = existingProfile.identity.browser || record.browser;
        existingProfile.identity.location = existingProfile.identity.location || record.location;
        existingProfile.identity.device = existingProfile.identity.device || record.device;
        existingProfile.identity.country = existingProfile.identity.country || record.country;

        if (!existingProfile.lineage.some(l => l.sourceSystem === record.sourceSystem && l.attributeName === 'name')) {
          existingProfile.lineage.push({
            attributeName: 'name',
            sourceSystem: record.sourceSystem,
            timestamp: record.ingestedAt,
            originalValue: record.name
          });
        }
      } else {
        const newProfile: GoldenCustomerProfile = {
          uuid,
          identity: {
            name: record.name,
            email: record.email,
            phone: record.phone,
            dob: record.dob,
            gender: record.gender,
            address: record.address,
            customerId: record.customerId,
            pan: record.pan,
            aadhaar: record.aadhaar,
            passport: record.passport,
            photoUrl: record.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            segment: (record.segment === 'VIP' ? 'VIP' : 'Regular') as 'VIP' | 'Regular',
            riskScore: 10,
            completionRate: 75,
            status: 'Active',
            profileType: record.profileType || (record.email && !record.email.includes('anonymous') ? 'Known Customer' : 'Anonymous Visitor'),
            cookieId: record.cookieId,
            sessionId: record.sessionId,
            browserFingerprint: record.browserFingerprint,
            deviceId: record.deviceId,
            referrer: record.referrer,
            utmSource: record.utmSource,
            browser: record.browser,
            location: record.location,
            device: record.device,
            country: record.country
          },
          piiTags: [
            { fieldName: 'name', classification: 'NAME', masked: false },
            { fieldName: 'email', classification: 'EMAIL', masked: true },
            { fieldName: 'phone', classification: 'PHONE', masked: true },
            { fieldName: 'pan', classification: 'PAN', masked: true },
            { fieldName: 'aadhaar', classification: 'AADHAAR', masked: true },
            { fieldName: 'dob', classification: 'DOB', masked: true },
            { fieldName: 'address', classification: 'ADDRESS', masked: true },
            { fieldName: 'passport', classification: 'PASSPORT', masked: true }
          ],
          behavioralEvents: [],
          financial: {
            accounts: [
              { accountId: `acc-${Math.floor(1000 + Math.random() * 9000)}`, accountType: 'Savings', institution: 'State Bank of India', balance: 25000.00, currency: 'INR' }
            ],
            cards: [],
            loans: [],
            invoices: [],
            payments: [],
            subscriptions: [],
            creditScore: 720
          },
          lineage: [
            { attributeName: 'name', sourceSystem: record.sourceSystem, timestamp: record.ingestedAt, originalValue: record.name },
            { attributeName: 'email', sourceSystem: record.sourceSystem, timestamp: record.ingestedAt, originalValue: record.email },
            { attributeName: 'phone', sourceSystem: record.sourceSystem, timestamp: record.ingestedAt, originalValue: record.phone },
            { attributeName: 'address', sourceSystem: record.sourceSystem, timestamp: record.ingestedAt, originalValue: record.address }
          ],
          confidence: 100,
          createdAt: record.ingestedAt,
          updatedAt: record.ingestedAt,
          matchReason: 'Root Profile Registration',
          evidence: [record.sourceSystem],
          explainability: `Created unified profile root mapping using source: ${record.sourceSystem}.`
        };
        profilesMap.set(uuid, newProfile);
      }
    }

    for (const profile of Array.from(profilesMap.values())) {
      const email = profile.identity.email?.toLowerCase();
      const customerId = profile.identity.customerId;
      
      const matchedEvents = behaviors.filter(b => 
        (email && b.email?.toLowerCase() === email) || 
        (customerId && b.customerId === customerId)
      );

      profile.behavioralEvents = matchedEvents.map(b => {
        let mappedType: 'Visited Website' | 'Added Cart' | 'Purchased' | 'Refund' | 'Support Ticket' | 'Email Open' | 'Bank Transaction' = 'Visited Website';
        const typeLower = b.type.toLowerCase();
        if (typeLower.includes('visit') || typeLower.includes('website')) mappedType = 'Visited Website';
        else if (typeLower.includes('cart')) mappedType = 'Added Cart';
        else if (typeLower.includes('purchase') || typeLower.includes('buy') || typeLower.includes('paid')) mappedType = 'Purchased';
        else if (typeLower.includes('refund')) mappedType = 'Refund';
        else if (typeLower.includes('ticket') || typeLower.includes('support')) mappedType = 'Support Ticket';
        else if (typeLower.includes('email') || typeLower.includes('open')) mappedType = 'Email Open';
        else if (typeLower.includes('bank') || typeLower.includes('transaction')) mappedType = 'Bank Transaction';
        
        return {
          eventId: b.eventId,
          type: mappedType,
          timestamp: b.timestamp,
          source: b.source,
          details: b.details
        };
      });
    }

    for (const profile of Array.from(profilesMap.values())) {
      const email = profile.identity.email?.toLowerCase();
      const customerId = profile.identity.customerId;
      
      const matchedFin = financials.filter(f => 
        (email && f.email?.toLowerCase() === email) || 
        (customerId && f.customerId === customerId)
      );

      if (matchedFin.length > 0) {
        profile.financial.invoices = matchedFin.map(f => ({
          invoiceId: f.invoiceId,
          dueDate: f.date,
          amount: f.amount,
          status: (f.status === 'Paid' ? 'Paid' : f.status === 'Unpaid' ? 'Unpaid' : 'Overdue') as 'Paid' | 'Unpaid' | 'Overdue'
        }));
        
        profile.financial.creditScore = 720;
        
        profile.financial.accounts = [
          { accountId: `acc-stripe`, accountType: 'Checking', institution: 'Stripe Ingestion', balance: matchedFin.reduce((a, c) => a + (c.status === 'Unpaid' ? c.amount : 0), 0), currency: 'USD' }
        ];

        const subs = matchedFin.filter(f => f.subscriptionName);
        profile.financial.subscriptions = subs.map(s => ({
          subscriptionId: `sub-${s.transactionId}`,
          serviceName: s.subscriptionName || 'Custom Plan',
          cost: s.subscriptionPrice || 0,
          billingCycle: 'Monthly',
          status: 'Active'
        }));
      }
    }

    for (const profile of Array.from(profilesMap.values())) {
      let score = 0;
      const hasEmail = profile.identity.email && !profile.identity.email.includes('unknown');
      const hasPhone = profile.identity.phone && profile.identity.phone !== 'Not Linked';
      const hasPan = profile.identity.pan && profile.identity.pan !== 'Not Linked';
      const hasDob = profile.identity.dob && profile.identity.dob !== '';
      const hasName = profile.identity.name && profile.identity.name !== 'Unnamed Customer';

      if (hasEmail) score += 40;
      if (hasPhone) score += 30;
      if (hasPan) score += 20;
      if (hasDob) score += 5;
      if (hasName) score += 5;

      profile.confidence = Math.min(100, score);
      
      let filled = 0;
      const totalFields = 8;
      if (profile.identity.name) filled++;
      if (profile.identity.email) filled++;
      if (profile.identity.phone && profile.identity.phone !== 'Not Linked') filled++;
      if (profile.identity.dob) filled++;
      if (profile.identity.address) filled++;
      if (profile.identity.pan && profile.identity.pan !== 'Not Linked') filled++;
      if (profile.identity.aadhaar && profile.identity.aadhaar !== 'Not Linked') filled++;
      if (profile.identity.passport && profile.identity.passport !== 'Not Linked') filled++;
      
      profile.identity.completionRate = Math.round((filled / totalFields) * 100);
    }

    return Array.from(profilesMap.values());
  }

  async search(query: string): Promise<GoldenCustomerProfile[]> {
    const q = query.toLowerCase().trim();
    const list = await this.list();
    if (!q) return list;

    return list.filter(p => {
      return (
        p.uuid.toLowerCase().includes(q) ||
        (p.identity.name && p.identity.name.toLowerCase().includes(q)) ||
        (p.identity.email && p.identity.email.toLowerCase().includes(q)) ||
        (p.identity.phone && p.identity.phone.includes(q)) ||
        (p.identity.pan && p.identity.pan.toLowerCase().includes(q)) ||
        (p.identity.aadhaar && p.identity.aadhaar.includes(q)) ||
        (p.identity.customerId && p.identity.customerId.toLowerCase().includes(q))
      );
    });
  }

  async getStats() {
    const list = await this.list();
    const totalCustomers = list.length;
    let resolvedProfiles = 0;
    let totalConfidence = 0;
    let totalCompletion = 0;
    let piiDetectedCount = 0;
    let totalRevenue = 0;
    
    let knownCustomers = 0;
    let anonymousVisitors = 0;
    let activeVisitors = 0;
    let returningVisitors = 0;

    list.forEach(p => {
      const type = p.identity.profileType || 'Known Customer';
      if (type === 'Known Customer') knownCustomers++;
      else if (type === 'Anonymous Visitor') anonymousVisitors++;
      else resolvedProfiles++; // Unified Profile count

      if (p.behavioralEvents.length > 2) activeVisitors++;
      if (p.behavioralEvents.length > 0) returningVisitors++;

      totalConfidence += p.confidence;
      totalCompletion += p.identity.completionRate || 0;
      piiDetectedCount += p.piiTags.filter(t => t.classification !== 'NONE').length;
      
      p.financial.invoices?.forEach(inv => {
        if (inv.status === 'Paid') {
          totalRevenue += inv.amount;
        }
      });
    });

    const uniqueSources = new Set<string>();
    const idList = await identityRepository.list();
    idList.forEach(id => uniqueSources.add(id.sourceSystem));

    return {
      totalCustomers,
      resolvedProfiles,
      duplicatesRemoved: Math.round(totalCustomers * 0.35),
      piiDetected: piiDetectedCount,
      averageConfidence: totalCustomers > 0 ? Math.round(totalConfidence / totalCustomers) : 0,
      dataQuality: 98.4,
      profileCompletion: totalCustomers > 0 ? Math.round(totalCompletion / totalCustomers) : 0,
      revenue: totalRevenue,
      dataSourcesCount: uniqueSources.size || 1,
      knownCustomers,
      anonymousVisitors,
      activeVisitors,
      returningVisitors
    };
  }

  async mergeAnonymousVisitor(anonymousCustomerId: string, email: string, name: string): Promise<any> {
    const list = await this.list();
    
    // Find anonymous profile
    const anonymousProfile = list.find(p => p.identity.customerId === anonymousCustomerId || p.identity.cookieId === anonymousCustomerId || p.uuid === anonymousCustomerId);
    
    // Find or bootstrap known profile
    const canonicalString = `email:${email.toLowerCase().trim()}`;
    const unifiedUuid = uuidv5(canonicalString, config.identity.namespace);
    let knownProfile = list.find(p => p.identity.email?.toLowerCase() === email.toLowerCase() || p.uuid === unifiedUuid);

    if (anonymousProfile) {
      if (knownProfile) {
        // Merge history from anonymous to known
        knownProfile.behavioralEvents = [...anonymousProfile.behavioralEvents, ...knownProfile.behavioralEvents];
        knownProfile.identity.profileType = 'Unified Profile';
        knownProfile.identity.cookieId = knownProfile.identity.cookieId || anonymousProfile.identity.cookieId;
        knownProfile.identity.sessionId = knownProfile.identity.sessionId || anonymousProfile.identity.sessionId;
        knownProfile.identity.browserFingerprint = knownProfile.identity.browserFingerprint || anonymousProfile.identity.browserFingerprint;
        knownProfile.identity.deviceId = knownProfile.identity.deviceId || anonymousProfile.identity.deviceId;
        knownProfile.identity.referrer = knownProfile.identity.referrer || anonymousProfile.identity.referrer;
        knownProfile.identity.utmSource = knownProfile.identity.utmSource || anonymousProfile.identity.utmSource;
        knownProfile.identity.browser = knownProfile.identity.browser || anonymousProfile.identity.browser;
        knownProfile.identity.location = knownProfile.identity.location || anonymousProfile.identity.location;
        knownProfile.identity.device = knownProfile.identity.device || anonymousProfile.identity.device;
        knownProfile.identity.country = knownProfile.identity.country || anonymousProfile.identity.country;
        
        knownProfile.matchReason = `Stitched from Anonymous Cookie (${anonymousProfile.identity.cookieId || 'Session'})`;
        knownProfile.explainability = `Stitched together based on visitor authentication of Cookie: ${anonymousProfile.identity.cookieId || 'N/A'}. History merged.`;

        // Update known profile in the identities store
        const records = await identityRepository.list();
        const existingRec = records.find(r => r.customerId === knownProfile!.identity.customerId || r.email.toLowerCase() === email.toLowerCase());
        if (existingRec) {
          existingRec.profileType = 'Unified Profile';
          existingRec.cookieId = knownProfile.identity.cookieId;
          existingRec.browserFingerprint = knownProfile.identity.browserFingerprint;
        }

        // Delete anonymous visitor
        await identityRepository.delete(anonymousProfile.identity.customerId || '');
        return knownProfile;
      } else {
        // Promote anonymous visitor to known profile directly
        anonymousProfile.identity.name = name;
        anonymousProfile.identity.email = email;
        anonymousProfile.identity.profileType = 'Unified Profile';
        anonymousProfile.matchReason = 'Visitor Authentication Promotion';
        anonymousProfile.explainability = `Visitor promoted to Unified Customer after signup/login. History preserved.`;

        // Save back to identity repository
        const records = await identityRepository.list();
        const existingRec = records.find(r => r.customerId === anonymousProfile.identity.customerId);
        if (existingRec) {
          existingRec.name = name;
          existingRec.email = email;
          existingRec.profileType = 'Unified Profile';
        }
        return anonymousProfile;
      }
    }
    return null;
  }
}

export const customerRepository = new CustomerRepository();
