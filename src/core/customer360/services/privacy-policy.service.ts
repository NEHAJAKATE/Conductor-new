import { PiiClassification } from '../domain/pii.types';

export class PrivacyPolicyService {
  maskValue(value: any, classification: PiiClassification, role: 'Analyst' | 'Manager' | 'Admin' | 'Owner'): any {
    if (role === 'Admin' || role === 'Owner') return value;
    if (value === null || value === undefined || value === '') return value;

    const valStr = String(value);

    // Analyst gets full masking
    if (role === 'Analyst') {
      switch (classification) {
        case 'EMAIL':
          return this.maskEmailFull(valStr);
        case 'PHONE':
          return '**********';
        case 'AADHAAR':
          return 'XXXX-XXXX-XXXX';
        case 'PAN':
          return 'XXXXXXXXXX';
        case 'CREDIT_CARD':
          return 'XXXX-XXXX-XXXX-XXXX';
        case 'BANK_ACCOUNT':
          return 'XXXXXXXXXXXX';
        case 'PASSPORT':
          return 'XXXXXXXX';
        case 'DOB':
          return 'XXXX-XX-XX';
        case 'NAME':
          return '**** ****';
        case 'ADDRESS':
          return '*** ***, ***';
        default:
          return '*****';
      }
    }

    // Manager gets partial masking
    if (role === 'Manager') {
      switch (classification) {
        case 'EMAIL':
          return this.maskEmailPartial(valStr);
        case 'PHONE':
          return valStr.length > 4 ? `******${valStr.slice(-4)}` : '******';
        case 'AADHAAR':
          return valStr.length > 4 ? `XXXX-XXXX-${valStr.slice(-4)}` : 'XXXX-XXXX-XXXX';
        case 'PAN':
          return valStr.length > 4 ? `XXXXXX${valStr.slice(-4)}` : 'XXXXXXXXXX';
        case 'CREDIT_CARD':
          return valStr.length > 4 ? `XXXX-XXXX-XXXX-${valStr.slice(-4)}` : 'XXXX-XXXX-XXXX-XXXX';
        case 'BANK_ACCOUNT':
          return valStr.length > 4 ? `********${valStr.slice(-4)}` : 'XXXXXXXXXXXX';
        case 'PASSPORT':
          return valStr.length > 3 ? `${valStr.slice(0, 2)}XXXXXX` : 'XXXXXXXX';
        case 'DOB':
          return valStr.length > 4 ? `${valStr.split('-')[0]}-XX-XX` : 'XXXX-XX-XX';
        case 'NAME':
          const parts = valStr.split(' ');
          return parts.map(p => p.length > 1 ? `${p[0]}***` : '*').join(' ');
        case 'ADDRESS':
          return valStr.length > 15 ? `${valStr.slice(0, 10)}... (Masked)` : '*** ***, ***';
        default:
          return '*****';
      }
    }

    return value;
  }

  private maskEmailFull(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '******';
    return `******@${parts[1]}`;
  }

  private maskEmailPartial(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '******';
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `*@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }
}
export const privacyPolicyService = new PrivacyPolicyService();
