import mysql from 'mysql2/promise';

async function seedAuditLogs() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    database: 'builderp',
  });

  console.log('Connected to builderp for audit log seeding...');

  const logs = [
    {
      tenant_id: 1,
      user_id: 1,
      action: 'po.created',
      entity: 'purchase_orders',
      entity_id: 'KB/PO/26-27/0001',
      diff_json: JSON.stringify({
        action: 'INSERT',
        document: 'KB/PO/26-27/0001',
        vendor: 'GCS Hardware & Housekeeping Supplies',
        site: 'Kings Heights Tower A & B',
        totalAmount: 23328.00,
        itemsCount: 22,
        after: {
          poNumber: 'KB/PO/26-27/0001',
          status: 'pending_approval',
          totalAmount: '23328.00',
          cgstAmount: '1779.25',
          sgstAmount: '1779.25',
        },
      }),
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0',
    },
    {
      tenant_id: 1,
      user_id: 1,
      action: 'po.approved',
      entity: 'purchase_orders',
      entity_id: 'KB/PO/26-27/0001',
      diff_json: JSON.stringify({
        action: 'UPDATE',
        changedFields: ['status', 'approvedById', 'approvedAt'],
        before: {
          status: 'pending_approval',
          approvedById: null,
          approvedAt: null,
        },
        after: {
          status: 'approved',
          approvedById: 1,
          approvedAt: '2026-11-13T12:00:00Z',
        },
      }),
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0',
    },
    {
      tenant_id: 1,
      user_id: 3,
      action: 'grn.inspected',
      entity: 'goods_receipt_notes',
      entity_id: 'KB/GRN/26-27/0001',
      diff_json: JSON.stringify({
        action: 'UPDATE',
        changedFields: ['status', 'verifiedById', 'inspectionRemarks'],
        before: {
          status: 'received',
          verifiedById: null,
          inspectionRemarks: null,
        },
        after: {
          status: 'verified',
          verifiedById: 3,
          inspectionRemarks: 'All 22 items physically verified and accepted 100% conforming to PO specifications.',
        },
      }),
      ip_address: '192.168.1.105',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0',
    },
    {
      tenant_id: 1,
      user_id: 5,
      action: 'stock.material_issued',
      entity: 'material_issues',
      entity_id: 'KB/ISSUE/26-27/0001',
      diff_json: JSON.stringify({
        action: 'INSERT',
        document: 'KB/ISSUE/26-27/0001',
        contractor: 'Apex Infra Civil Works',
        site: 'Royal Palm Luxury Residences',
        item: 'TMT FE500D 12MM REBAR',
        quantity: '7.000 MT',
        totalCost: '409500.00',
        after: {
          stockBalanceBefore: '10.000 MT',
          stockBalanceAfter: '3.000 MT',
        },
      }),
      ip_address: '192.168.1.110',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0',
    },
    {
      tenant_id: 1,
      user_id: 5,
      action: 'ra_bill.certified',
      entity: 'ra_bills',
      entity_id: 'KB/RA/26-27/0001',
      diff_json: JSON.stringify({
        action: 'INSERT',
        document: 'KB/RA/26-27/0001',
        contractor: 'Apex Infra Civil Works',
        grossAmount: 282000.00,
        retentionWithheld: 14100.00,
        tdsDeducted: 2820.00,
        materialRecovery: 15000.00,
        netPayable: 250080.00,
        after: {
          status: 'certified',
          certifiedById: 5,
        },
      }),
      ip_address: '192.168.1.110',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0',
    },
    {
      tenant_id: 1,
      user_id: 1,
      action: 'ra_bill.approved',
      entity: 'ra_bills',
      entity_id: 'KB/RA/26-27/0001',
      diff_json: JSON.stringify({
        action: 'UPDATE',
        changedFields: ['status', 'approvedById'],
        before: {
          status: 'certified',
          approvedById: null,
        },
        after: {
          status: 'approved',
          approvedById: 1,
        },
      }),
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0',
    },
  ];

  for (const log of logs) {
    await conn.execute(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity, entity_id, diff_json, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        log.tenant_id,
        log.user_id,
        log.action,
        log.entity,
        log.entity_id,
        log.diff_json,
        log.ip_address,
        log.user_agent,
      ]
    );
  }

  console.log(`Successfully seeded ${logs.length} audit logs with before/after diffs.`);
  await conn.end();
}

seedAuditLogs().catch(console.error);
