/**
 * Schema Manager Service
 * Provides an editable schema registry for non-technical users (owners/operators).
 * Allows adding, updating, renaming, and removing custom parameters per domain without code changes.
 * Supports real-time cascading migration across canonical data stores when parameters are renamed.
 */

import fs from 'fs';
import path from 'path';
import { businessRepository } from '@/infrastructure/repositories/business-repository';
import {
  transactionRepository,
  inventoryRepository,
  outstandingRepository,
} from '@/infrastructure/repositories/canonical-repositories';

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
  isOverride?: boolean; // true if standard field label/description was customized by company owner
  originalLabel?: string; // Standard default label before owner rename
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
  private static standardOverrides: Map<string, Partial<SchemaFieldDefinition>> = new Map();
  private static loaded = false;

  private static load() {
    if (this.loaded) return;
    ensureReadyDir();
    try {
      if (fs.existsSync(SCHEMA_FILE)) {
        const raw = fs.readFileSync(SCHEMA_FILE, 'utf8');
        const list: SchemaFieldDefinition[] = JSON.parse(raw);
        list.forEach(f => {
          if (f.isCustom) {
            this.customFields.set(f.id, f);
          } else if (f.isOverride) {
            this.standardOverrides.set(f.id, f);
          }
        });
      }
    } catch (err) {
      console.error('[SchemaManagerService] Failed to load custom schema:', err);
    }
    this.loaded = true;
  }

  private static async persist() {
    ensureReadyDir();
    const customList = Array.from(this.customFields.values());
    const overrideList = Array.from(this.standardOverrides.values());
    const combined = [...customList, ...overrideList];
    await fs.promises.writeFile(SCHEMA_FILE, JSON.stringify(combined, null, 2), 'utf8');
  }

  /**
   * List all schema parameters (both standard with owner overrides and user-defined custom fields)
   */
  public static listFields(domain?: SchemaDomain): SchemaFieldDefinition[] {
    this.load();
    const standardMerged = STANDARD_FIELDS.map(std => {
      const override = this.standardOverrides.get(std.id);
      if (override) {
        return {
          ...std,
          label: override.label || std.label,
          description: override.description !== undefined ? override.description : std.description,
          isOverride: true,
          originalLabel: std.label,
        };
      }
      return std;
    });

    const customList = Array.from(this.customFields.values());
    const all = [...standardMerged, ...customList];
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

    if (STANDARD_FIELDS.some(s => s.id === cleanId) || this.customFields.has(cleanId)) {
      throw new Error(`A parameter with key '${cleanId}' already exists.`);
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
   * Edit or Rename an existing schema parameter
   * - If standard field: updates company display label and description overrides
   * - If custom field: updates label, dataType, description, and if key changed (oldId !== newId),
   *   migrates all existing data records in real-time across data/ready/*.json
   */
  public static async updateField(
    oldId: string,
    updates: {
      id?: string;
      label?: string;
      domain?: SchemaDomain;
      dataType?: SchemaDataType;
      description?: string;
      options?: string[];
      defaultValue?: any;
      required?: boolean;
    }
  ): Promise<{ field: SchemaFieldDefinition; recordsMigrated: number }> {
    this.load();

    const stdMatch = STANDARD_FIELDS.find(s => s.id === oldId);

    // Case 1: Editing standard ERP field terminology / display label
    if (stdMatch) {
      const newLabel = updates.label?.trim() || stdMatch.label;
      const newDesc = updates.description !== undefined ? updates.description.trim() : stdMatch.description;

      const override: SchemaFieldDefinition = {
        id: oldId,
        domain: stdMatch.domain,
        label: newLabel,
        dataType: stdMatch.dataType,
        description: newDesc,
        isCustom: false,
        isOverride: true,
        originalLabel: stdMatch.label,
        createdAt: stdMatch.createdAt,
      };

      this.standardOverrides.set(oldId, override);
      await this.persist();
      return { field: override, recordsMigrated: 0 };
    }

    // Case 2: Editing a custom user-defined parameter
    const existingCustom = this.customFields.get(oldId);
    if (!existingCustom) {
      throw new Error(`Schema parameter '${oldId}' not found.`);
    }

    const cleanNewId = updates.id
      ? updates.id.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
      : oldId;

    if (!cleanNewId) {
      throw new Error('Parameter key cannot be empty.');
    }

    if (cleanNewId !== oldId) {
      // Ensure target key does not collide with existing fields
      if (STANDARD_FIELDS.some(s => s.id === cleanNewId) || this.customFields.has(cleanNewId)) {
        throw new Error(`A parameter with key '${cleanNewId}' already exists.`);
      }
    }

    const updatedField: SchemaFieldDefinition = {
      ...existingCustom,
      id: cleanNewId,
      domain: updates.domain || existingCustom.domain,
      label: updates.label?.trim() || existingCustom.label,
      dataType: updates.dataType || existingCustom.dataType,
      description: updates.description !== undefined ? updates.description.trim() : existingCustom.description,
      options: updates.options || existingCustom.options,
      defaultValue: updates.defaultValue !== undefined ? updates.defaultValue : existingCustom.defaultValue,
      required: updates.required !== undefined ? updates.required : existingCustom.required,
    };

    let recordsMigrated = 0;

    // If key ID changed, perform real-time data migration across all ready data files
    if (cleanNewId !== oldId) {
      this.customFields.delete(oldId);
      this.customFields.set(cleanNewId, updatedField);
      recordsMigrated = await this.migrateAttributeKeyInData(oldId, cleanNewId);
    } else {
      this.customFields.set(oldId, updatedField);
    }

    await this.persist();
    return { field: updatedField, recordsMigrated };
  }

  /**
   * Reset a customized standard field label back to system default
   */
  public static async resetFieldToDefault(id: string): Promise<boolean> {
    this.load();
    if (this.standardOverrides.has(id)) {
      this.standardOverrides.delete(id);
      await this.persist();
      return true;
    }
    return false;
  }

  /**
   * Cascade real-time attribute key rename across all stored entities in data/ready/
   */
  private static async migrateAttributeKeyInData(oldKey: string, newKey: string): Promise<number> {
    let totalMigrated = 0;
    ensureReadyDir();

    // 1. Businesses
    const bizPath = path.join(READY_DIR, 'businesses.json');
    if (fs.existsSync(bizPath)) {
      try {
        const raw = await fs.promises.readFile(bizPath, 'utf8');
        const list = JSON.parse(raw);
        let changed = false;
        list.forEach((b: any) => {
          if (b.customAttributes && oldKey in b.customAttributes) {
            b.customAttributes[newKey] = b.customAttributes[oldKey];
            delete b.customAttributes[oldKey];
            changed = true;
            totalMigrated++;
          }
        });
        if (changed) {
          await fs.promises.writeFile(bizPath, JSON.stringify(list, null, 2), 'utf8');
          businessRepository.reloadFromDisk();
        }
      } catch (err) {
        console.error('[SchemaManagerService] Failed migrating businesses.json:', err);
      }
    }

    // 2. Transactions
    const txPath = path.join(READY_DIR, 'transactions.json');
    if (fs.existsSync(txPath)) {
      try {
        const raw = await fs.promises.readFile(txPath, 'utf8');
        const list = JSON.parse(raw);
        let changed = false;
        list.forEach((t: any) => {
          if (t.customAttributes && oldKey in t.customAttributes) {
            t.customAttributes[newKey] = t.customAttributes[oldKey];
            delete t.customAttributes[oldKey];
            changed = true;
            totalMigrated++;
          }
        });
        if (changed) {
          await fs.promises.writeFile(txPath, JSON.stringify(list, null, 2), 'utf8');
          transactionRepository.reloadFromDisk();
        }
      } catch (err) {
        console.error('[SchemaManagerService] Failed migrating transactions.json:', err);
      }
    }

    // 3. Inventory
    const invPath = path.join(READY_DIR, 'inventory.json');
    if (fs.existsSync(invPath)) {
      try {
        const raw = await fs.promises.readFile(invPath, 'utf8');
        const list = JSON.parse(raw);
        let changed = false;
        list.forEach((i: any) => {
          if (i.customAttributes && oldKey in i.customAttributes) {
            i.customAttributes[newKey] = i.customAttributes[oldKey];
            delete i.customAttributes[oldKey];
            changed = true;
            totalMigrated++;
          }
        });
        if (changed) {
          await fs.promises.writeFile(invPath, JSON.stringify(list, null, 2), 'utf8');
          inventoryRepository.reloadFromDisk();
        }
      } catch (err) {
        console.error('[SchemaManagerService] Failed migrating inventory.json:', err);
      }
    }

    // 4. Outstanding
    const outPath = path.join(READY_DIR, 'outstanding.json');
    if (fs.existsSync(outPath)) {
      try {
        const raw = await fs.promises.readFile(outPath, 'utf8');
        const list = JSON.parse(raw);
        let changed = false;
        list.forEach((o: any) => {
          if (o.customAttributes && oldKey in o.customAttributes) {
            o.customAttributes[newKey] = o.customAttributes[oldKey];
            delete o.customAttributes[oldKey];
            changed = true;
            totalMigrated++;
          }
        });
        if (changed) {
          await fs.promises.writeFile(outPath, JSON.stringify(list, null, 2), 'utf8');
          outstandingRepository.reloadFromDisk();
        }
      } catch (err) {
        console.error('[SchemaManagerService] Failed migrating outstanding.json:', err);
      }
    }

    return totalMigrated;
  }

  /**
   * Delete a custom user-defined parameter or reset standard override
   */
  public static async deleteField(id: string): Promise<boolean> {
    this.load();
    if (this.customFields.has(id)) {
      this.customFields.delete(id);
      await this.persist();
      return true;
    }
    if (this.standardOverrides.has(id)) {
      this.standardOverrides.delete(id);
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
