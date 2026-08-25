/**
 * Schema Manager Service
 * Provides an editable schema registry for non-technical users (owners/operators).
 * Allows adding, updating, and removing custom parameters per domain without code changes.
 */

import fs from 'fs';
import path from 'path';

export type SchemaDomain = 'business' | 'transaction' | 'inventory' | 'outstanding' | 'payment';
export type SchemaDataType = 'text' | 'number' | 'boolean' | 'date' | 'currency' | 'select';

export interface SchemaFieldDefinition {
  id: string; // e.g. 'whatsapp_opt_in', 'doctor_specialty', 'custom_discount'
  domain: SchemaDomain;
  label: string; // Friendly name: "WhatsApp Opt-in"
  dataType: SchemaDataType;
  description?: string;
  options?: string[]; // For select type
  defaultValue?: any;
  required?: boolean;
  isCustom: boolean; // true = user-defined, false = built-in ERP standard
  createdAt: string;
}

const READY_DIR = path.resolve(process.cwd(), 'data', 'ready');
const SCHEMA_FILE = path.join(READY_DIR, 'custom_schema.json');

function ensureReadyDir() {
  if (!fs.existsSync(READY_DIR)) {
    fs.mkdirSync(READY_DIR, { recursive: true });
  }
}

// Built-in standard fields (read-only baseline reference for non-technical users)
const STANDARD_FIELDS: SchemaFieldDefinition[] = [
  // Business domain
  { id: 'name', domain: 'business', label: 'Party / Trade Name', dataType: 'text', isCustom: false, required: true, description: 'Display name of business party', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'ledgerName', domain: 'business', label: 'ERP Ledger Name', dataType: 'text', isCustom: false, description: 'Raw accounting ledger string', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'taxId', domain: 'business', label: 'GSTIN (Tax ID)', dataType: 'text', isCustom: false, description: '15-character Indian GST number', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'pan', domain: 'business', label: 'PAN Number', dataType: 'text', isCustom: false, description: '10-character Permanent Account Number', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'drugLicenses', domain: 'business', label: 'Drug License Numbers', dataType: 'text', isCustom: false, description: 'Pharma retail/wholesale drug licenses', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'classification', domain: 'business', label: 'Account Classification', dataType: 'select', options: ['b2b_dealer', 'b2b_hospital', 'supplier', 'field_staff', 'b2c_individual'], isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'credit.dynamicCreditLimit', domain: 'business', label: 'Dynamic Credit Limit (45D)', dataType: 'currency', isCustom: false, description: '1.5x of average monthly purchases', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'credit.creditDays', domain: 'business', label: 'ERP Credit Days', dataType: 'number', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'address.city', domain: 'business', label: 'City', dataType: 'text', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'address.area', domain: 'business', label: 'Area / Route', dataType: 'text', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'contact.mobile', domain: 'business', label: 'Mobile Number', dataType: 'text', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'contact.email', domain: 'business', label: 'Email Address', dataType: 'text', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },

  // Transaction domain
  { id: 'invoiceId', domain: 'transaction', label: 'Voucher / Bill No (VCN)', dataType: 'text', isCustom: false, required: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'type', domain: 'transaction', label: 'Transaction Type', dataType: 'select', options: ['sale', 'purchase', 'sale_return', 'purchase_return'], isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'date', domain: 'transaction', label: 'Invoice Date', dataType: 'date', isCustom: false, required: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'partyName', domain: 'transaction', label: 'Party Name', dataType: 'text', isCustom: false, required: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'netAmount', domain: 'transaction', label: 'Net Amount', dataType: 'currency', isCustom: false, required: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'taxAmount', domain: 'transaction', label: 'GST Tax Amount', dataType: 'currency', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'grossAmount', domain: 'transaction', label: 'Gross Invoice Total', dataType: 'currency', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },

  // Inventory domain
  { id: 'productName', domain: 'inventory', label: 'Product Name', dataType: 'text', isCustom: false, required: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'quantityOnHand', domain: 'inventory', label: 'Stock Quantity', dataType: 'number', isCustom: false, required: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'unit', domain: 'inventory', label: 'Unit of Measure', dataType: 'text', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'reorderLevel', domain: 'inventory', label: 'Reorder Baseline', dataType: 'number', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },

  // Outstanding domain
  { id: 'totalOutstanding', domain: 'outstanding', label: 'Total Balance (₹)', dataType: 'currency', isCustom: false, required: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bucket0_30', domain: 'outstanding', label: '0-30 Days Due', dataType: 'currency', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bucket31_60', domain: 'outstanding', label: '31-60 Days Due', dataType: 'currency', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bucket61_90', domain: 'outstanding', label: '61-90 Days Due', dataType: 'currency', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bucket90Plus', domain: 'outstanding', label: '90+ Days Overdue', dataType: 'currency', isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'riskLevel', domain: 'outstanding', label: 'Ageing Risk Level', dataType: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], isCustom: false, createdAt: '2026-01-01T00:00:00.000Z' },
];

export class SchemaManagerService {
  private static customFields: Map<string, SchemaFieldDefinition> = new Map();
  private static loaded = false;

  private static load() {
    if (this.loaded) return;
    ensureReadyDir();
    try {
      if (fs.existsSync(SCHEMA_FILE)) {
        const raw = fs.readFileSync(SCHEMA_FILE, 'utf8');
        const list: SchemaFieldDefinition[] = JSON.parse(raw);
        list.forEach(f => this.customFields.set(f.id, f));
      }
    } catch (err) {
      console.error('[SchemaManagerService] Failed to load custom schema:', err);
    }
    this.loaded = true;
  }

  private static async persist() {
    ensureReadyDir();
    const list = Array.from(this.customFields.values());
    await fs.promises.writeFile(SCHEMA_FILE, JSON.stringify(list, null, 2), 'utf8');
  }

  /**
   * List all schema parameters (both standard and user-defined custom fields)
   */
  public static listFields(domain?: SchemaDomain): SchemaFieldDefinition[] {
    this.load();
    const customList = Array.from(this.customFields.values());
    const all = [...STANDARD_FIELDS, ...customList];
    if (domain) {
      return all.filter(f => f.domain === domain);
    }
    return all;
  }

  /**
   * Add a new user-defined parameter to the schema
   */
  public static async addField(params: {
    id: string;
    domain: SchemaDomain;
    label: string;
    dataType: SchemaDataType;
    description?: string;
    options?: string[];
    defaultValue?: any;
    required?: boolean;
  }): Promise<SchemaFieldDefinition> {
    this.load();

    const cleanId = params.id
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_');

    if (!cleanId) {
      throw new Error('Parameter ID must contain alphanumeric characters.');
    }

    const field: SchemaFieldDefinition = {
      id: cleanId,
      domain: params.domain,
      label: params.label.trim() || cleanId,
      dataType: params.dataType || 'text',
      description: params.description?.trim(),
      options: params.options,
      defaultValue: params.defaultValue,
      required: params.required || false,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    this.customFields.set(cleanId, field);
    await this.persist();
    return field;
  }

  /**
   * Delete a custom user-defined parameter
   */
  public static async deleteField(id: string): Promise<boolean> {
    this.load();
    if (this.customFields.has(id)) {
      this.customFields.delete(id);
      await this.persist();
      return true;
    }
    return false;
  }

  /**
   * Get all registered custom field IDs for a given domain
   */
  public static getCustomFieldIds(domain: SchemaDomain): string[] {
    this.load();
    return Array.from(this.customFields.values())
      .filter(f => f.domain === domain)
      .map(f => f.id);
  }
}
