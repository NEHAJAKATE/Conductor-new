"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.piiDetectorService = exports.PiiDetectorService = void 0;
class PiiDetectorService {
    patterns = {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^\+?[0-9\s\-()]{7,18}$/,
        PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
        AADHAAR: /^[2-9][0-9]{3}\s?[0-9]{4}\s?[0-9]{4}$/,
        IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,
        CREDIT_CARD: /^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
        BANK_ACCOUNT: /^\d{9,18}$/,
        PASSPORT: /^[A-Z][0-9]{7,8}$/,
        DOB: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/,
    };
    detectColumn(columnName, sampleValues) {
        const colNameLower = columnName.toLowerCase().replace(/[^a-z0-9]/g, '');
        // First, try name heuristics
        if (['name', 'fullname', 'firstname', 'lastname', 'contactname', 'username', 'owner'].includes(colNameLower)) {
            return { columnName, classification: 'NAME', confidence: 95 };
        }
        if (['address', 'street', 'city', 'state', 'zipcode', 'pincode', 'country', 'location', 'residence'].some(k => colNameLower.includes(k))) {
            return { columnName, classification: 'ADDRESS', confidence: 90 };
        }
        // Try value scanning
        const counts = {
            EMAIL: 0, PHONE: 0, PAN: 0, AADHAAR: 0, IFSC: 0, CREDIT_CARD: 0, BANK_ACCOUNT: 0, PASSPORT: 0, DOB: 0, ADDRESS: 0, NAME: 0, NONE: 0
        };
        let nonNullCount = 0;
        for (const val of sampleValues) {
            const cleanVal = val?.trim();
            if (!cleanVal)
                continue;
            nonNullCount += 1;
            let matched = false;
            for (const [piiType, regex] of Object.entries(this.patterns)) {
                if (regex.test(cleanVal)) {
                    counts[piiType] += 1;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                counts.NONE += 1;
            }
        }
        if (nonNullCount === 0) {
            // Fallback to name heuristic only
            if (colNameLower.includes('email'))
                return { columnName, classification: 'EMAIL', confidence: 80 };
            if (colNameLower.includes('phone') || colNameLower.includes('mobile'))
                return { columnName, classification: 'PHONE', confidence: 80 };
            if (colNameLower.includes('dob') || colNameLower.includes('birth'))
                return { columnName, classification: 'DOB', confidence: 80 };
            return { columnName, classification: 'NONE', confidence: 0 };
        }
        // Determine highest confidence match
        let bestType = 'NONE';
        let maxMatch = 0;
        for (const [type, count] of Object.entries(counts)) {
            if (type === 'NONE')
                continue;
            if (count > maxMatch) {
                maxMatch = count;
                bestType = type;
            }
        }
        const matchRatio = maxMatch / nonNullCount;
        if (matchRatio >= 0.5) {
            return {
                columnName,
                classification: bestType,
                confidence: Math.round(matchRatio * 100)
            };
        }
        // Fallback to label keyword matching if values are ambiguous
        if (colNameLower.includes('email'))
            return { columnName, classification: 'EMAIL', confidence: 70 };
        if (colNameLower.includes('phone') || colNameLower.includes('mobile'))
            return { columnName, classification: 'PHONE', confidence: 70 };
        if (colNameLower.includes('pan'))
            return { columnName, classification: 'PAN', confidence: 70 };
        if (colNameLower.includes('aadhaar') || colNameLower.includes('adhar'))
            return { columnName, classification: 'AADHAAR', confidence: 70 };
        if (colNameLower.includes('acc') || colNameLower.includes('bank'))
            return { columnName, classification: 'BANK_ACCOUNT', confidence: 60 };
        if (colNameLower.includes('dob') || colNameLower.includes('birth'))
            return { columnName, classification: 'DOB', confidence: 70 };
        return { columnName, classification: 'NONE', confidence: 0 };
    }
}
exports.PiiDetectorService = PiiDetectorService;
exports.piiDetectorService = new PiiDetectorService();
