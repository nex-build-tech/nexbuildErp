// ============================================================
// Kings Builders — Charts & Analytics Module
// ============================================================

let chartInstances = {};

function destroyCharts() {
    Object.values(chartInstances).forEach(c => c.destroy());
    chartInstances = {};
}

function createDashboardCharts() {
    destroyCharts();
    setTimeout(() => {
        createStockLevelChart();
        createMonthlyComparisonChart();
    }, 100);
}

function createPurchaseTrendChart() {
    const ctx = document.getElementById('chart-purchase-trend');
    if (!ctx) return;
    chartInstances['purchaseTrend'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: APP_DATA.monthlyData.labels,
            datasets: [
                {
                    label: 'Purchases',
                    data: APP_DATA.monthlyData.purchases,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5,
                },
                {
                    label: 'Receipts',
                    data: APP_DATA.monthlyData.receipts,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5,
                },
                {
                    label: 'Consumption',
                    data: APP_DATA.monthlyData.consumption,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.08)',
                    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5,
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, padding: 15, font: { size: 11 } } },
                tooltip: {
                    callbacks: { label: ctx => `${ctx.dataset.label}: ₹${(ctx.raw/1000).toFixed(0)}K` }
                }
            },
            scales: {
                y: {
                    beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: { callback: v => `₹${(v/1000)}K`, font: { size: 10 } }
                },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
        }
    });
}

function createCategoryPieChart() {
    const ctx = document.getElementById('chart-category-spend');
    if (!ctx) return;
    chartInstances['categorySpend'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: APP_DATA.categorySpend.labels,
            datasets: [{
                data: APP_DATA.categorySpend.values,
                backgroundColor: ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4'],
                borderWidth: 0, hoverOffset: 8,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
                tooltip: {
                    callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}%` }
                }
            }
        }
    });
}

function createVendorPerformanceChart() {
    const ctx = document.getElementById('chart-vendor-performance');
    if (!ctx) return;
    chartInstances['vendorPerf'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: APP_DATA.vendorPerformance.labels,
            datasets: [{
                data: APP_DATA.vendorPerformance.values,
                backgroundColor: ['#22c55e','#f59e0b','#f97316','#ef4444'],
                borderRadius: 8, borderSkipped: false,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw}% of deliveries` } } },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => `${v}%`, font: { size: 10 } } },
                y: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

function createSiteConsumptionChart() {
    const ctx = document.getElementById('chart-site-consumption');
    if (!ctx) return;
    chartInstances['siteCons'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: APP_DATA.siteConsumption.labels,
            datasets: [{
                label: 'Material Cost',
                data: APP_DATA.siteConsumption.values,
                backgroundColor: ['#3b82f6','#8b5cf6','#06b6d4','#f59e0b','#22c55e'],
                borderRadius: 8, borderSkipped: false,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `₹${(ctx.raw/100000).toFixed(1)}L` } } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => `₹${(v/100000).toFixed(0)}L`, font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 30 } }
            }
        }
    });
}

function createStockLevelChart() {
    const ctx = document.getElementById('chart-stock-levels');
    if (!ctx) return;
    const items = APP_DATA.inventory.filter(i => i.inStock > 0).slice(0, 8);
    chartInstances['stockLevels'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: items.map(i => i.name.length > 18 ? i.name.substring(0, 18) + '...' : i.name),
            datasets: [
                { label: 'In Stock', data: items.map(i => i.inStock), backgroundColor: '#3b82f6', borderRadius: 4 },
                { label: 'Reserved', data: items.map(i => i.reserved), backgroundColor: '#f59e0b', borderRadius: 4 },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 10, font: { size: 10 } } } },
            scales: {
                y: { beginAtZero: true, stacked: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } },
                x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } }
            }
        }
    });
}

function createMonthlyComparisonChart() {
    const ctx = document.getElementById('chart-monthly-comparison');
    if (!ctx) return;
    chartInstances['monthlyComp'] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Construction', 'Housekeeping', 'Electrical', 'Plumbing', 'Paints', 'Security'],
            datasets: [
                { label: 'This Month', data: [40, 25, 20, 12, 10, 5], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', pointBackgroundColor: '#3b82f6', borderWidth: 2 },
                { label: 'Last Month', data: [35, 20, 18, 15, 8, 6], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', pointBackgroundColor: '#f59e0b', borderWidth: 2 },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 10, font: { size: 10 } } } },
            scales: { r: { beginAtZero: true, ticks: { font: { size: 9 } }, pointLabels: { font: { size: 10 } } } }
        }
    });
}
