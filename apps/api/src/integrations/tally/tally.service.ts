import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  purchaseOrders,
  poItems,
  vendors,
  sites,
  items,
  units,
} from '../../database/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { TenantContext } from '../../common/middleware/tenant.middleware';

@Injectable()
export class TallyService {
  constructor(private readonly databaseService: DatabaseService) {}

  private escapeXml(unsafe: string | null | undefined): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private formatTallyDate(date: Date | string): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  private resolveStateName(stateCode: string | null | undefined): string {
    const states: Record<string, string> = {
      '27': 'Maharashtra',
      '24': 'Gujarat',
      '29': 'Karnataka',
      '07': 'Delhi',
      '19': 'West Bengal',
      '06': 'Haryana',
      '08': 'Rajasthan',
      '33': 'Tamil Nadu',
      '36': 'Telangana',
    };
    return (stateCode && states[stateCode]) || 'Maharashtra';
  }

  async generatePurchaseVouchersXml(
    tenant: TenantContext,
    filter?: { from?: string; to?: string; siteId?: number; vendorId?: number }
  ): Promise<string> {
    const conditions = [eq(purchaseOrders.tenantId, tenant.id)];
    if (filter?.siteId) {
      conditions.push(eq(purchaseOrders.siteId, filter.siteId));
    }
    if (filter?.vendorId) {
      conditions.push(eq(purchaseOrders.vendorId, filter.vendorId));
    }
    if (filter?.from) {
      conditions.push(gte(purchaseOrders.poDate, new Date(filter.from)));
    }
    if (filter?.to) {
      conditions.push(lte(purchaseOrders.poDate, new Date(filter.to)));
    }

    const pos = await this.databaseService.db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        poDate: purchaseOrders.poDate,
        subtotal: purchaseOrders.subtotal,
        discountAmount: purchaseOrders.discountAmount,
        cgstAmount: purchaseOrders.cgstAmount,
        sgstAmount: purchaseOrders.sgstAmount,
        igstAmount: purchaseOrders.igstAmount,
        totalAmount: purchaseOrders.totalAmount,
        roundOff: purchaseOrders.roundOff,
        status: purchaseOrders.status,
        vendorId: purchaseOrders.vendorId,
        vendorName: vendors.name,
        vendorGstin: vendors.gstin,
        vendorPan: vendors.pan,
        vendorCity: vendors.city,
        vendorStateCode: vendors.stateCode,
        siteId: purchaseOrders.siteId,
        siteName: sites.name,
        siteStateCode: sites.stateCode,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .leftJoin(sites, eq(purchaseOrders.siteId, sites.id))
      .where(and(...conditions))
      .orderBy(desc(purchaseOrders.poDate));

    // Get lines for each PO
    const tallyMessages: string[] = [];

    for (const po of pos) {
      const lines = await this.databaseService.db
        .select({
          itemId: poItems.itemId,
          itemCode: items.code,
          itemName: items.name,
          unitCode: units.code,
          quantity: poItems.quantity,
          unitRate: poItems.unitRate,
          gstRate: poItems.gstRate,
          taxableAmount: poItems.taxableAmount,
          cgstAmount: poItems.cgstAmount,
          sgstAmount: poItems.sgstAmount,
          igstAmount: poItems.igstAmount,
          totalAmount: poItems.totalAmount,
          hsnCode: items.hsnCode,
        })
        .from(poItems)
        .leftJoin(items, eq(poItems.itemId, items.id))
        .leftJoin(units, eq(poItems.unitId, units.id))
        .where(eq(poItems.poId, po.id));

      const partyName = this.escapeXml(po.vendorName || 'Sundry Creditor');
      const partyGstin = this.escapeXml(po.vendorGstin || '');
      const stateName = this.resolveStateName(po.vendorStateCode);
      const vchDate = this.formatTallyDate(po.poDate);
      const vchNum = this.escapeXml(po.poNumber);

      const totalVal = Number(po.totalAmount) || 0;
      const subTotal = Number(po.subtotal) || 0;
      const cgstVal = Number(po.cgstAmount) || 0;
      const sgstVal = Number(po.sgstAmount) || 0;
      const igstVal = Number(po.igstAmount) || 0;
      const roundOffVal = Number(po.roundOff) || 0;

      // Construct Ledger Entries:
      let ledgerEntriesXml = `
            <!-- Party Ledger (Credit) -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${partyName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${totalVal.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <!-- Purchase Ledger (Debit) -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Purchase Accounts - Construction Materials</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${subTotal.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;

      if (cgstVal > 0) {
        ledgerEntriesXml += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Input CGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${cgstVal.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
      }

      if (sgstVal > 0) {
        ledgerEntriesXml += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Input SGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${sgstVal.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
      }

      if (igstVal > 0) {
        ledgerEntriesXml += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Input IGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${igstVal.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
      }

      if (roundOffVal !== 0) {
        const isDebit = roundOffVal < 0;
        ledgerEntriesXml += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Round Off</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${isDebit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
              <AMOUNT>${Math.abs(roundOffVal).toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
      }

      // Inventory entries
      let inventoryEntriesXml = '';
      for (const line of lines) {
        const itemName = this.escapeXml(line.itemName || line.itemCode || 'Material');
        const qty = Number(line.quantity) || 1;
        const rate = Number(line.unitRate) || 0;
        const lineTaxable = Number(line.taxableAmount) || qty * rate;
        const uom = this.escapeXml(line.unitCode || 'Nos');
        const hsn = this.escapeXml(line.hsnCode || '2523');

        inventoryEntriesXml += `
            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${itemName}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <RATE>${rate.toFixed(2)}/${uom}</RATE>
              <AMOUNT>-${lineTaxable.toFixed(2)}</AMOUNT>
              <ACTUALQTY>${qty} ${uom}</ACTUALQTY>
              <BILLEDQTY>${qty} ${uom}</BILLEDQTY>
              <GSTRATEDETAILS.LIST>
                <GSTRATE>${line.gstRate}%</GSTRATE>
                <HSNCODE>${hsn}</HSNCODE>
              </GSTRATEDETAILS.LIST>
            </ALLINVENTORYENTRIES.LIST>`;
      }

      const msg = `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${vchDate}</DATE>
            <GUID>BuildERP-PO-${po.id}</GUID>
            <NARRATION>Purchase Order ${vchNum} for ${this.escapeXml(po.siteName || 'Site')}</NARRATION>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${vchNum}</VOUCHERNUMBER>
            <REFERENCE>${vchNum}</REFERENCE>
            <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
            <PARTYNAME>${partyName}</PARTYNAME>
            <STATENAME>${stateName}</STATENAME>
            <COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>
            <PARTYGSTIN>${partyGstin}</PARTYGSTIN>
            <PLACEOFSUPPLY>${stateName}</PLACEOFSUPPLY>
            <ISINVOICE>Yes</ISINVOICE>
            ${ledgerEntriesXml}
            ${inventoryEntriesXml}
          </VOUCHER>
        </TALLYMESSAGE>`;

      tallyMessages.push(msg);
    }

    const companyName = this.escapeXml(tenant.name || 'Kings Builders & Developers');

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        ${tallyMessages.join('\n')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    return xml;
  }
}
