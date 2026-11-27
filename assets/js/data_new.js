// ============================================================
// GoodsFlow Pro — Sample Data Module
// ============================================================

const APP_DATA = {

    // ─── Company Info ────────────────────────────────────────
    companyInfo: {
        name: 'Your Company Pvt. Ltd.',
        gstin: '27XXXXXXXXX1Z5',
        stateCode: '27',
        state: 'Maharashtra',
        address: 'Navi Mumbai, Maharashtra 400705',
    },

    // ─── Categories ──────────────────────────────────────────
    categories: [
        { id: 'CAT001', name: 'Housekeeping', description: 'Cleaning supplies and housekeeping materials', status: 'active' },
        { id: 'CAT002', name: 'Construction', description: 'Cement, sand, steel and construction materials', status: 'active' },
        { id: 'CAT003', name: 'Electrical', description: 'Wiring, bulbs, switches and electrical components', status: 'active' },
        { id: 'CAT004', name: 'Plumbing', description: 'Pipes, valves and plumbing fittings', status: 'active' },
        { id: 'CAT005', name: 'Paints', description: 'Interior, exterior paints and primers', status: 'active' },
        { id: 'CAT006', name: 'Security', description: 'CCTV, access control and security equipment', status: 'active' },
        { id: 'CAT007', name: 'Gardening', description: 'Plants, tools and gardening supplies', status: 'active' },
    ],

    // ─── Units ───────────────────────────────────────────────
    units: [
        { id: 'U001', name: 'Pcs', fullName: 'Pieces' },
        { id: 'U002', name: 'Bags', fullName: 'Bags' },
        { id: 'U003', name: 'Kg', fullName: 'Kilograms' },
        { id: 'U004', name: 'CFT', fullName: 'Cubic Feet' },
        { id: 'U005', name: 'Roll', fullName: 'Rolls' },
        { id: 'U006', name: 'Bucket', fullName: 'Buckets' },
        { id: 'U007', name: 'Ltr', fullName: 'Litres' },
        { id: 'U008', name: 'Mtr', fullName: 'Metres' },
        { id: 'U009', name: 'Box', fullName: 'Boxes' },
        { id: 'U010', name: 'Set', fullName: 'Sets' },
    ],

    // ─── Warehouses ──────────────────────────────────────────
    warehouses: [
        { id: 'WH001', name: 'Warehouse A', location: 'Turbhe, Navi Mumbai', type: 'Covered', area: '5,000 sq.ft', capacity: 80, manager: 'Ramesh Kumar', phone: '9812345001', categories: ['Housekeeping', 'Electrical'], status: 'active' },
        { id: 'WH002', name: 'Warehouse B', location: 'Taloja, Navi Mumbai', type: 'Covered', area: '8,000 sq.ft', capacity: 65, manager: 'Sunil Jadhav', phone: '9812345002', categories: ['Construction', 'Plumbing'], status: 'active' },
        { id: 'WH003', name: 'Yard C', location: 'Taloja, Navi Mumbai', type: 'Open Yard', area: '15,000 sq.ft', capacity: 45, manager: 'Sunil Jadhav', phone: '9812345002', categories: ['Construction'], status: 'active' },
        { id: 'WH004', name: 'Paint Store', location: 'Vashi, Navi Mumbai', type: 'Climate Controlled', area: '2,000 sq.ft', capacity: 70, manager: 'Priya Sharma', phone: '9812345003', categories: ['Paints'], status: 'active' },
    ],

    // ─── Vendors ─────────────────────────────────────────────
    vendors: [
        { id: 'V001', name: 'Kheteshwar Trading', contact: 'Mr. Patel', phone: '9967641843', email: 'kheteshwertrading1008@gmail.com', gstin: '27ADWPR7846J1ZF', pan: 'ADWPR7846J', state: 'Maharashtra', stateCode: '27', address: 'Plot No. A-21, Janta Market Sector-23, Turbhe Navi Mumbai 400705', category: 'Housekeeping', rating: 4.2, status: 'active', bankName: 'G.P. Parsik Bank Ltd', bankBranch: 'Sanpada', bankAc: '013013600000022', bankIfsc: 'PJSB0OO0014', totalOrders: 38, totalValue: 892450 },
        { id: 'V002', name: 'Ambica Electricals', contact: 'Mr. Sharma', phone: '9821456789', email: 'ambica.elec@gmail.com', gstin: '27AABCA1234F1Z5', pan: 'AABCA1234F', state: 'Maharashtra', stateCode: '27', address: '12, Electrical Market, Lamington Rd, Mumbai 400007', category: 'Electrical', rating: 4.5, status: 'active', bankName: 'SBI', bankBranch: 'Grant Road', bankAc: '30246810120', bankIfsc: 'SBIN0001234', totalOrders: 52, totalValue: 1567800 },
        { id: 'V003', name: 'Shree Cement Suppliers', contact: 'Mr. Joshi', phone: '9876543210', email: 'shrecement@yahoo.com', gstin: '27BBNPS5678G1Z9', pan: 'BBNPS5678G', state: 'Maharashtra', stateCode: '27', address: '45, MIDC Industrial Area, Taloja, Navi Mumbai 410208', category: 'Construction', rating: 3.8, status: 'active', bankName: 'HDFC Bank', bankBranch: 'Vashi', bankAc: '50100123456789', bankIfsc: 'HDFC0001234', totalOrders: 95, totalValue: 4523000 },
        { id: 'V004', name: 'Modern Plumbing Works', contact: 'Mr. Deshmukh', phone: '9823456712', email: 'modernplumb@gmail.com', gstin: '27CCMPW9012H1Z3', pan: 'CCMPW9012H', state: 'Maharashtra', stateCode: '27', address: '78, Hardware Lane, Dadar East, Mumbai 400014', category: 'Plumbing', rating: 4.0, status: 'active', bankName: 'Kotak Bank', bankBranch: 'Dadar', bankAc: '1234567890', bankIfsc: 'KKBK0000456', totalOrders: 28, totalValue: 678900 },
        { id: 'V005', name: 'SafeGuard Security Systems', contact: 'Mr. Reddy', phone: '9845671234', email: 'safeguard.sys@gmail.com', gstin: '29DDSGS3456I1Z7', pan: 'DDSGS3456I', state: 'Karnataka', stateCode: '29', address: 'B-22, IT Park, Electronic City, Bangalore 560100', category: 'Security', rating: 4.7, status: 'active', bankName: 'ICICI Bank', bankBranch: 'Electronic City', bankAc: '024501234567', bankIfsc: 'ICIC0000789', totalOrders: 15, totalValue: 2345600 },
        { id: 'V006', name: 'Raj Paint House', contact: 'Mr. Kapoor', phone: '9812345678', email: 'rajpaints@gmail.com', gstin: '27EERPH7890J1Z1', pan: 'EERPH7890J', state: 'Maharashtra', stateCode: '27', address: '123, Color Market, Worli, Mumbai 400018', category: 'Paints', rating: 3.5, status: 'active', bankName: 'Bank of Baroda', bankBranch: 'Worli', bankAc: '78901234567', bankIfsc: 'BARB0WORLI', totalOrders: 42, totalValue: 1120000 },
        { id: 'V007', name: 'Green Garden Suppliers', contact: 'Mrs. Mehta', phone: '9967812345', email: 'greengardens@gmail.com', gstin: '27FFGGS1234K1Z5', pan: 'FFGGS1234K', state: 'Maharashtra', stateCode: '27', address: '56, Nursery Rd, Andheri West, Mumbai 400058', category: 'Gardening', rating: 4.1, status: 'inactive', bankName: 'Axis Bank', bankBranch: 'Andheri', bankAc: '91701234567890', bankIfsc: 'UTIB0000567', totalOrders: 18, totalValue: 345600 },
        { id: 'V008', name: 'Steel World Industries', contact: 'Mr. Agarwal', phone: '9834567891', email: 'steelworld@yahoo.com', gstin: '27GGSW15678L1Z9', pan: 'GGSW15678L', state: 'Maharashtra', stateCode: '27', address: 'Plot 89, Steel Market, Bhiwandi, Thane 421302', category: 'Construction', rating: 4.4, status: 'active', bankName: 'PNB', bankBranch: 'Bhiwandi', bankAc: '3456789012', bankIfsc: 'PUNB0123400', totalOrders: 67, totalValue: 5678000 },
    ],

    // ─── Items Master ────────────────────────────────────────
    items: [
        { id: 'ITM001', name: 'Bathroom Cleaner 5LTR', hsn: '340290', unit: 'Pcs', category: 'Housekeeping', listPrice: 650, gstRate: 18, reorderLevel: 10 },
        { id: 'ITM002', name: 'Hard Surface Cleaner 5 LTR', hsn: '340111', unit: 'Pcs', category: 'Housekeeping', listPrice: 650, gstRate: 18, reorderLevel: 10 },
        { id: 'ITM003', name: 'Glass Cleaner 5LTR (BS)', hsn: '34021190', unit: 'Pcs', category: 'Housekeeping', listPrice: 120, gstRate: 18, reorderLevel: 15 },
        { id: 'ITM004', name: 'Toilet Cleaner 5 LTR', hsn: '38089400', unit: 'Pcs', category: 'Housekeeping', listPrice: 180, gstRate: 18, reorderLevel: 10 },
        { id: 'ITM005', name: 'Sona Green 5L', hsn: '090962', unit: 'Pcs', category: 'Housekeeping', listPrice: 400, gstRate: 18, reorderLevel: 5 },
        { id: 'ITM006', name: 'Checked Duster', hsn: '630710', unit: 'Pcs', category: 'Housekeeping', listPrice: 10, gstRate: 5, reorderLevel: 50 },
        { id: 'ITM007', name: 'Garbage 29 * 39', hsn: '39232100', unit: 'Pcs', category: 'Housekeeping', listPrice: 80, gstRate: 18, reorderLevel: 20 },
        { id: 'ITM008', name: 'Wet Mop', hsn: '39249090', unit: 'Pcs', category: 'Housekeeping', listPrice: 145, gstRate: 18, reorderLevel: 20 },
        { id: 'ITM009', name: 'Soft Broom', hsn: '96031000', unit: 'Pcs', category: 'Housekeeping', listPrice: 130, gstRate: 0, reorderLevel: 20 },
        { id: 'ITM010', name: 'Hard Broom', hsn: '96031000', unit: 'Pcs', category: 'Housekeeping', listPrice: 50, gstRate: 0, reorderLevel: 20 },
        { id: 'ITM011', name: 'Toilet Brush Round', hsn: '96039000', unit: 'Pcs', category: 'Housekeeping', listPrice: 75, gstRate: 18, reorderLevel: 15 },
        { id: 'ITM012', name: 'Feather Duster (M) Yellow', hsn: '96032900', unit: 'Pcs', category: 'Housekeeping', listPrice: 120, gstRate: 18, reorderLevel: 15 },
        { id: 'ITM013', name: 'Dust Pan Big (V) Parmar', hsn: '3924', unit: 'Pcs', category: 'Housekeeping', listPrice: 50, gstRate: 18, reorderLevel: 10 },
        { id: 'ITM014', name: 'Katha', hsn: '392690', unit: 'Pcs', category: 'Housekeeping', listPrice: 10, gstRate: 18, reorderLevel: 20 },
        { id: 'ITM015', name: 'Glass Whifer', hsn: '392690', unit: 'Pcs', category: 'Housekeeping', listPrice: 280, gstRate: 18, reorderLevel: 10 },
        { id: 'ITM016', name: 'Plastic Kata', hsn: '392690', unit: 'Pcs', category: 'Housekeeping', listPrice: 10, gstRate: 18, reorderLevel: 15 },
        { id: 'ITM017', name: 'Wifer Big', hsn: '96039000', unit: 'Pcs', category: 'Housekeeping', listPrice: 120, gstRate: 18, reorderLevel: 10 },
        { id: 'ITM018', name: 'OPC Cement 50kg Bag', hsn: '252329', unit: 'Bags', category: 'Construction', listPrice: 380, gstRate: 28, reorderLevel: 100 },
        { id: 'ITM019', name: 'TMT Steel Bar 12mm', hsn: '721420', unit: 'Kg', category: 'Construction', listPrice: 65, gstRate: 18, reorderLevel: 500 },
        { id: 'ITM020', name: 'River Sand (per CFT)', hsn: '250510', unit: 'CFT', category: 'Construction', listPrice: 55, gstRate: 5, reorderLevel: 200 },
        { id: 'ITM021', name: 'LED Bulb 12W', hsn: '940540', unit: 'Pcs', category: 'Electrical', listPrice: 120, gstRate: 18, reorderLevel: 50 },
        { id: 'ITM022', name: 'Copper Wire 1.5mm (100m)', hsn: '854411', unit: 'Roll', category: 'Electrical', listPrice: 2800, gstRate: 18, reorderLevel: 10 },
        { id: 'ITM023', name: 'MCB 32A Single Pole', hsn: '853620', unit: 'Pcs', category: 'Electrical', listPrice: 210, gstRate: 18, reorderLevel: 20 },
        { id: 'ITM024', name: 'CPVC Pipe 1 inch (3m)', hsn: '391723', unit: 'Pcs', category: 'Plumbing', listPrice: 320, gstRate: 18, reorderLevel: 30 },
        { id: 'ITM025', name: 'Gate Valve 1 inch', hsn: '848180', unit: 'Pcs', category: 'Plumbing', listPrice: 450, gstRate: 18, reorderLevel: 15 },
        { id: 'ITM026', name: 'Asian Apex Exterior 20L', hsn: '320910', unit: 'Bucket', category: 'Paints', listPrice: 4500, gstRate: 28, reorderLevel: 5 },
        { id: 'ITM027', name: 'Primer Coat 20L', hsn: '320910', unit: 'Bucket', category: 'Paints', listPrice: 2200, gstRate: 28, reorderLevel: 5 },
    ],

    // ─── Sites ──────────────────────────────────────────────
    sites: [
        { id: 'S001', name: 'Sector 23 Residential Tower', location: 'Turbhe, Navi Mumbai', manager: 'Rajesh Patil', phone: '9876543210', status: 'active', itemsIssued: 342, totalMaterialCost: 456000 },
        { id: 'S002', name: 'Greenfield Commercial Complex', location: 'Vashi, Navi Mumbai', manager: 'Suresh Kumar', phone: '9823456789', status: 'active', itemsIssued: 567, totalMaterialCost: 1234000 },
        { id: 'S003', name: 'Palm Beach Towers', location: 'Sanpada, Navi Mumbai', manager: 'Amit Desai', phone: '9812345678', status: 'active', itemsIssued: 234, totalMaterialCost: 890000 },
        { id: 'S004', name: 'Tech Park Phase 2', location: 'Airoli, Navi Mumbai', manager: 'Vikram Singh', phone: '9834567812', status: 'active', itemsIssued: 789, totalMaterialCost: 2345000 },
        { id: 'S005', name: 'Highway Overpass Project', location: 'Panvel, Navi Mumbai', manager: 'Manoj Yadav', phone: '9845678901', status: 'active', itemsIssued: 1234, totalMaterialCost: 5670000 },
        { id: 'S006', name: 'Metro Station Renovation', location: 'Thane West', manager: 'Deepak Joshi', phone: '9856789012', status: 'active', itemsIssued: 456, totalMaterialCost: 1890000 },
        { id: 'S007', name: 'School Building Extension', location: 'Dombivli East', manager: 'Abhay Kulkarni', phone: '9867891234', status: 'completed', itemsIssued: 678, totalMaterialCost: 3450000 },
        { id: 'S008', name: 'Hospital Wing Addition', location: 'Kalwa, Thane', manager: 'Sanjay More', phone: '9878901234', status: 'active', itemsIssued: 890, totalMaterialCost: 4560000 },
    ],

    // ─── Purchase Orders ────────────────────────────────────
    purchaseOrders: [
        {
            id: 'PO-2026-001', vendorId: 'V001', vendorName: 'Kheteshwar Trading', date: '2026-01-02', quotationNo: '63',
            status: 'partially-received', paymentTerms: 'Cash', deliveryDate: '2026-01-15',
            items: [
                { itemId: 'ITM001', name: 'Bathroom Cleaner 5LTR', hsn: '340290', qty: 1, unit: 'Pcs', rate: 650, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM002', name: 'Hard Surface Cleaner 5 LTR', hsn: '340111', qty: 1, unit: 'Pcs', rate: 650, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM003', name: 'Glass Cleaner 5LTR (BS)', hsn: '34021190', qty: 1, unit: 'Pcs', rate: 120, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM004', name: 'Toilet Cleaner 5 LTR', hsn: '38089400', qty: 1, unit: 'Pcs', rate: 180, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM005', name: 'Sona Green 5L', hsn: '090962', qty: 2, unit: 'Pcs', rate: 400, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM006', name: 'Checked Duster', hsn: '630710', qty: 20, unit: 'Pcs', rate: 10, disc: 0, cgstRate: 2.5, sgstRate: 2.5 },
                { itemId: 'ITM007', name: 'Garbage 29 * 39', hsn: '39232100', qty: 5, unit: 'Pcs', rate: 80, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM008', name: 'Wet Mop', hsn: '39249090', qty: 20, unit: 'Pcs', rate: 145, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM009', name: 'Soft Broom', hsn: '96031000', qty: 20, unit: 'Pcs', rate: 130, disc: 0, cgstRate: 0, sgstRate: 0 },
                { itemId: 'ITM010', name: 'Hard Broom', hsn: '96031000', qty: 20, unit: 'Pcs', rate: 50, disc: 0, cgstRate: 0, sgstRate: 0 },
                { itemId: 'ITM011', name: 'Toilet Brush Round', hsn: '96039000', qty: 15, unit: 'Pcs', rate: 75, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM012', name: 'Feather Duster (M) Yellow', hsn: '96032900', qty: 15, unit: 'Pcs', rate: 120, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM013', name: 'Dust Pan Big (V) Parmar', hsn: '3924', qty: 10, unit: 'Pcs', rate: 50, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM014', name: 'Katha', hsn: '392690', qty: 20, unit: 'Pcs', rate: 10, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM015', name: 'Glass Whifer', hsn: '392690', qty: 10, unit: 'Pcs', rate: 280, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM016', name: 'Plastic Kata', hsn: '392690', qty: 15, unit: 'Pcs', rate: 10, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM017', name: 'Wifer Big', hsn: '96039000', qty: 15, unit: 'Pcs', rate: 120, disc: 0, cgstRate: 9, sgstRate: 9 },
            ],
            totalQty: 272, totalAmount: 22928.30, receivedQty: 180
        },
        {
            id: 'PO-2026-002', vendorId: 'V003', vendorName: 'Shree Cement Suppliers', date: '2026-01-10', quotationNo: '1045',
            status: 'fully-received', paymentTerms: 'Net 30', deliveryDate: '2026-01-20',
            items: [
                { itemId: 'ITM018', name: 'OPC Cement 50kg Bag', hsn: '252329', qty: 200, unit: 'Bags', rate: 380, disc: 2, cgstRate: 14, sgstRate: 14 },
                { itemId: 'ITM020', name: 'River Sand (per CFT)', hsn: '250510', qty: 500, unit: 'CFT', rate: 55, disc: 0, cgstRate: 2.5, sgstRate: 2.5 },
            ],
            totalQty: 700, totalAmount: 106190, receivedQty: 700
        },
        {
            id: 'PO-2026-003', vendorId: 'V002', vendorName: 'Ambica Electricals', date: '2026-02-05', quotationNo: '789',
            status: 'approved', paymentTerms: 'Net 15', deliveryDate: '2026-02-20',
            items: [
                { itemId: 'ITM021', name: 'LED Bulb 12W', hsn: '940540', qty: 100, unit: 'Pcs', rate: 120, disc: 5, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM022', name: 'Copper Wire 1.5mm (100m)', hsn: '854411', qty: 20, unit: 'Roll', rate: 2800, disc: 3, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM023', name: 'MCB 32A Single Pole', hsn: '853620', qty: 50, unit: 'Pcs', rate: 210, disc: 0, cgstRate: 9, sgstRate: 9 },
            ],
            totalQty: 170, totalAmount: 78526, receivedQty: 0
        },
        {
            id: 'PO-2026-004', vendorId: 'V004', vendorName: 'Modern Plumbing Works', date: '2026-02-15', quotationNo: '456',
            status: 'draft', paymentTerms: 'Net 30', deliveryDate: '2026-03-01',
            items: [
                { itemId: 'ITM024', name: 'CPVC Pipe 1 inch (3m)', hsn: '391723', qty: 60, unit: 'Pcs', rate: 320, disc: 0, cgstRate: 9, sgstRate: 9 },
                { itemId: 'ITM025', name: 'Gate Valve 1 inch', hsn: '848180', qty: 30, unit: 'Pcs', rate: 450, disc: 0, cgstRate: 9, sgstRate: 9 },
            ],
            totalQty: 90, totalAmount: 35262, receivedQty: 0
        },
        {
            id: 'PO-2026-005', vendorId: 'V008', vendorName: 'Steel World Industries', date: '2026-03-01', quotationNo: '2210',
            status: 'approved', paymentTerms: 'Net 45', deliveryDate: '2026-03-20',
            items: [
                { itemId: 'ITM019', name: 'TMT Steel Bar 12mm', hsn: '721420', qty: 2000, unit: 'Kg', rate: 65, disc: 1, cgstRate: 9, sgstRate: 9 },
            ],
            totalQty: 2000, totalAmount: 153153, receivedQty: 0
        },
        {
            id: 'PO-2026-006', vendorId: 'V006', vendorName: 'Raj Paint House', date: '2026-03-10', quotationNo: '890',
            status: 'partially-received', paymentTerms: 'Cash', deliveryDate: '2026-03-18',
            items: [
                { itemId: 'ITM026', name: 'Asian Apex Exterior 20L', hsn: '320910', qty: 15, unit: 'Bucket', rate: 4500, disc: 5, cgstRate: 14, sgstRate: 14 },
                { itemId: 'ITM027', name: 'Primer Coat 20L', hsn: '320910', qty: 10, unit: 'Bucket', rate: 2200, disc: 3, cgstRate: 14, sgstRate: 14 },
            ],
            totalQty: 25, totalAmount: 118690, receivedQty: 15
        },
    ],

    // ─── Goods Receipts (GRN) ───────────────────────────────
    goodsReceipts: [
        { id: 'GRN-2026-001', poId: 'PO-2026-001', vendorName: 'Kheteshwar Trading', date: '2026-01-12', receivedBy: 'Store Keeper - Ramesh',
          items: [
            { name: 'Bathroom Cleaner 5LTR', orderedQty: 1, receivedQty: 1, acceptedQty: 1, rejectedQty: 0 },
            { name: 'Hard Surface Cleaner 5 LTR', orderedQty: 1, receivedQty: 1, acceptedQty: 1, rejectedQty: 0 },
            { name: 'Glass Cleaner 5LTR (BS)', orderedQty: 1, receivedQty: 1, acceptedQty: 1, rejectedQty: 0 },
            { name: 'Toilet Cleaner 5 LTR', orderedQty: 1, receivedQty: 1, acceptedQty: 1, rejectedQty: 0 },
            { name: 'Sona Green 5L', orderedQty: 2, receivedQty: 2, acceptedQty: 2, rejectedQty: 0 },
            { name: 'Checked Duster', orderedQty: 20, receivedQty: 20, acceptedQty: 18, rejectedQty: 2 },
            { name: 'Garbage 29 * 39', orderedQty: 5, receivedQty: 5, acceptedQty: 5, rejectedQty: 0 },
            { name: 'Wet Mop', orderedQty: 20, receivedQty: 15, acceptedQty: 15, rejectedQty: 0 },
            { name: 'Soft Broom', orderedQty: 20, receivedQty: 20, acceptedQty: 20, rejectedQty: 0 },
            { name: 'Hard Broom', orderedQty: 20, receivedQty: 20, acceptedQty: 20, rejectedQty: 0 },
            { name: 'Toilet Brush Round', orderedQty: 15, receivedQty: 15, acceptedQty: 15, rejectedQty: 0 },
            { name: 'Feather Duster (M) Yellow', orderedQty: 15, receivedQty: 10, acceptedQty: 10, rejectedQty: 0 },
            { name: 'Dust Pan Big (V) Parmar', orderedQty: 10, receivedQty: 10, acceptedQty: 10, rejectedQty: 0 },
            { name: 'Katha', orderedQty: 20, receivedQty: 20, acceptedQty: 20, rejectedQty: 0 },
            { name: 'Glass Whifer', orderedQty: 10, receivedQty: 10, acceptedQty: 10, rejectedQty: 0 },
            { name: 'Plastic Kata', orderedQty: 15, receivedQty: 15, acceptedQty: 15, rejectedQty: 0 },
            { name: 'Wifer Big', orderedQty: 15, receivedQty: 15, acceptedQty: 15, rejectedQty: 0 },
          ],
          totalReceived: 180, totalOrdered: 272, qualityStatus: 'Accepted with remarks', remarks: '2 dusters rejected - torn. 5 Wet Mop and 5 Feather Duster pending delivery.'
        },
        { id: 'GRN-2026-002', poId: 'PO-2026-002', vendorName: 'Shree Cement Suppliers', date: '2026-01-18', receivedBy: 'Store Keeper - Ramesh',
          items: [
            { name: 'OPC Cement 50kg Bag', orderedQty: 200, receivedQty: 200, acceptedQty: 198, rejectedQty: 2 },
            { name: 'River Sand (per CFT)', orderedQty: 500, receivedQty: 500, acceptedQty: 500, rejectedQty: 0 },
          ],
          totalReceived: 700, totalOrdered: 700, qualityStatus: 'Accepted with remarks', remarks: '2 cement bags damaged during transit.'
        },
        { id: 'GRN-2026-003', poId: 'PO-2026-006', vendorName: 'Raj Paint House', date: '2026-03-15', receivedBy: 'Store Keeper - Sunil',
          items: [
            { name: 'Asian Apex Exterior 20L', orderedQty: 15, receivedQty: 15, acceptedQty: 15, rejectedQty: 0 },
            { name: 'Primer Coat 20L', orderedQty: 10, receivedQty: 0, acceptedQty: 0, rejectedQty: 0 },
          ],
          totalReceived: 15, totalOrdered: 25, qualityStatus: 'Partial Delivery', remarks: 'Primer Coat out of stock at vendor. Expected next week.'
        },
    ],

    // ─── Material Issues ────────────────────────────────────
    materialIssues: [
        { id: 'MI-2026-001', siteId: 'S001', siteName: 'Sector 23 Residential Tower', date: '2026-01-15', issuedBy: 'Ramesh (Store)', requestedBy: 'Rajesh Patil (Site Mgr)', status: 'issued',
          items: [
            { name: 'Bathroom Cleaner 5LTR', qty: 1, unit: 'Pcs' },
            { name: 'Checked Duster', qty: 10, unit: 'Pcs' },
            { name: 'Soft Broom', qty: 5, unit: 'Pcs' },
            { name: 'Hard Broom', qty: 5, unit: 'Pcs' },
            { name: 'Toilet Brush Round', qty: 5, unit: 'Pcs' },
          ]
        },
        { id: 'MI-2026-002', siteId: 'S002', siteName: 'Greenfield Commercial Complex', date: '2026-01-18', issuedBy: 'Ramesh (Store)', requestedBy: 'Suresh Kumar (Site Mgr)', status: 'issued',
          items: [
            { name: 'OPC Cement 50kg Bag', qty: 50, unit: 'Bags' },
            { name: 'River Sand (per CFT)', qty: 100, unit: 'CFT' },
            { name: 'Wet Mop', qty: 5, unit: 'Pcs' },
            { name: 'Glass Cleaner 5LTR (BS)', qty: 1, unit: 'Pcs' },
          ]
        },
        { id: 'MI-2026-003', siteId: 'S004', siteName: 'Tech Park Phase 2', date: '2026-01-22', issuedBy: 'Sunil (Store)', requestedBy: 'Vikram Singh (Site Mgr)', status: 'issued',
          items: [
            { name: 'OPC Cement 50kg Bag', qty: 80, unit: 'Bags' },
            { name: 'River Sand (per CFT)', qty: 200, unit: 'CFT' },
          ]
        },
        { id: 'MI-2026-004', siteId: 'S005', siteName: 'Highway Overpass Project', date: '2026-02-01', issuedBy: 'Ramesh (Store)', requestedBy: 'Manoj Yadav (Site Mgr)', status: 'issued',
          items: [
            { name: 'OPC Cement 50kg Bag', qty: 68, unit: 'Bags' },
            { name: 'River Sand (per CFT)', qty: 200, unit: 'CFT' },
          ]
        },
        { id: 'MI-2026-005', siteId: 'S003', siteName: 'Palm Beach Towers', date: '2026-03-16', issuedBy: 'Sunil (Store)', requestedBy: 'Amit Desai (Site Mgr)', status: 'pending',
          items: [
            { name: 'Asian Apex Exterior 20L', qty: 5, unit: 'Bucket' },
            { name: 'Katha', qty: 10, unit: 'Pcs' },
            { name: 'Glass Whifer', qty: 3, unit: 'Pcs' },
          ]
        },
    ],

    // ─── Inventory (computed from receipts - issues) ─────────
    inventory: [
        { itemId: 'ITM001', name: 'Bathroom Cleaner 5LTR', category: 'Housekeeping', inStock: 0, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM002', name: 'Hard Surface Cleaner 5 LTR', category: 'Housekeeping', inStock: 1, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM003', name: 'Glass Cleaner 5LTR (BS)', category: 'Housekeeping', inStock: 0, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM004', name: 'Toilet Cleaner 5 LTR', category: 'Housekeeping', inStock: 1, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM005', name: 'Sona Green 5L', category: 'Housekeeping', inStock: 2, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM006', name: 'Checked Duster', category: 'Housekeeping', inStock: 8, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM007', name: 'Garbage 29 * 39', category: 'Housekeeping', inStock: 5, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM008', name: 'Wet Mop', category: 'Housekeeping', inStock: 10, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM009', name: 'Soft Broom', category: 'Housekeeping', inStock: 15, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM010', name: 'Hard Broom', category: 'Housekeeping', inStock: 15, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM011', name: 'Toilet Brush Round', category: 'Housekeeping', inStock: 10, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM012', name: 'Feather Duster (M) Yellow', category: 'Housekeeping', inStock: 10, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM013', name: 'Dust Pan Big (V) Parmar', category: 'Housekeeping', inStock: 10, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM014', name: 'Katha', category: 'Housekeeping', inStock: 10, reserved: 10, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM015', name: 'Glass Whifer', category: 'Housekeeping', inStock: 7, reserved: 3, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM016', name: 'Plastic Kata', category: 'Housekeeping', inStock: 15, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM017', name: 'Wifer Big', category: 'Housekeeping', inStock: 15, reserved: 0, unit: 'Pcs', lastReceived: '2026-01-12', location: 'Warehouse A' },
        { itemId: 'ITM018', name: 'OPC Cement 50kg Bag', category: 'Construction', inStock: 0, reserved: 0, unit: 'Bags', lastReceived: '2026-01-18', location: 'Warehouse B' },
        { itemId: 'ITM019', name: 'TMT Steel Bar 12mm', category: 'Construction', inStock: 0, reserved: 0, unit: 'Kg', lastReceived: null, location: 'Yard C' },
        { itemId: 'ITM020', name: 'River Sand (per CFT)', category: 'Construction', inStock: 0, reserved: 0, unit: 'CFT', lastReceived: '2026-01-18', location: 'Yard C' },
        { itemId: 'ITM021', name: 'LED Bulb 12W', category: 'Electrical', inStock: 0, reserved: 0, unit: 'Pcs', lastReceived: null, location: 'Warehouse A' },
        { itemId: 'ITM022', name: 'Copper Wire 1.5mm (100m)', category: 'Electrical', inStock: 0, reserved: 0, unit: 'Roll', lastReceived: null, location: 'Warehouse A' },
        { itemId: 'ITM023', name: 'MCB 32A Single Pole', category: 'Electrical', inStock: 0, reserved: 0, unit: 'Pcs', lastReceived: null, location: 'Warehouse A' },
        { itemId: 'ITM024', name: 'CPVC Pipe 1 inch (3m)', category: 'Plumbing', inStock: 0, reserved: 0, unit: 'Pcs', lastReceived: null, location: 'Warehouse B' },
        { itemId: 'ITM025', name: 'Gate Valve 1 inch', category: 'Plumbing', inStock: 0, reserved: 0, unit: 'Pcs', lastReceived: null, location: 'Warehouse B' },
        { itemId: 'ITM026', name: 'Asian Apex Exterior 20L', category: 'Paints', inStock: 10, reserved: 5, unit: 'Bucket', lastReceived: '2026-03-15', location: 'Paint Store' },
        { itemId: 'ITM027', name: 'Primer Coat 20L', category: 'Paints', inStock: 0, reserved: 0, unit: 'Bucket', lastReceived: null, location: 'Paint Store' },
    ],

    // ─── KPIs ────────────────────────────────────────────────
    kpis: {
        totalVendors: 500,
        activeVendors: 342,
        totalPOs: 156,
        pendingPOs: 23,
        totalGRNs: 89,
        totalSites: 45,
        activeSites: 38,
        totalInventoryValue: 2456780,
        lowStockItems: 8,
        pendingDeliveries: 12,
        thisMonthSpend: 456000,
        lastMonthSpend: 389000,
    },

    // ─── Monthly Trends (for charts) ────────────────────────
    monthlyData: {
        labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        purchases: [280000, 350000, 410000, 389000, 456000, 320000],
        receipts: [265000, 330000, 395000, 380000, 440000, 298000],
        consumption: [250000, 310000, 370000, 365000, 420000, 285000],
    },

    // ─── Category-wise Spend ─────────────────────────────────
    categorySpend: {
        labels: ['Construction', 'Housekeeping', 'Electrical', 'Plumbing', 'Paints', 'Security'],
        values: [45, 18, 15, 10, 8, 4],
        amounts: [1125000, 450000, 375000, 250000, 200000, 100000],
    },

    // ─── Vendor Performance ──────────────────────────────────
    vendorPerformance: {
        labels: ['On Time', 'Delayed 1-3 Days', 'Delayed 3-7 Days', 'Delayed 7+ Days'],
        values: [65, 20, 10, 5],
    },

    // ─── Site Consumption (Top 5) ────────────────────────────
    siteConsumption: {
        labels: ['Highway Overpass', 'Tech Park Ph2', 'Hospital Wing', 'Metro Station', 'Palm Beach'],
        values: [5670000, 2345000, 4560000, 1890000, 890000],
    },
};
