class SalesReport {
    constructor() {
        this.initializeElements();
        this.preventFutureDates();
        this.attachEventListeners();
        this.loadInitialData();
        this.downloadModal = document.getElementById('downloadModal');
        this.initializeDownloadModal();
        this.loadSweetAlert();
    }

    initializeElements() {
        this.startDate = document.getElementById('start-date');
        this.endDate = document.getElementById('end-date');
        this.applyDateBtn = document.querySelector('.apply-date-btn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.salesTableBody = document.getElementById('salesTableBody');
        this.periodBtns = document.querySelectorAll('[data-period]');
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
    }

    // Prevent future date selection
    preventFutureDates() {
        const today = new Date().toISOString().split('T')[0];
        this.startDate.setAttribute('max', today);
        this.endDate.setAttribute('max', today);
    }

    loadSweetAlert() {
        // Check if SweetAlert is already loaded
        if (typeof Swal === 'undefined') {
            // Create script element for SweetAlert
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
            document.head.appendChild(script);
        }
    }

    attachEventListeners() {
        this.applyDateBtn.addEventListener('click', () => this.loadSalesData());
        this.downloadBtn.addEventListener('click', () => this.handleDownloadClick());
        this.periodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePeriodFilter(e));
        });
        
        document.querySelector('.table-container').addEventListener('click', (e) => {
            const expandBtn = e.target.closest('.expand-btn');
            if (expandBtn) this.handleRowExpand(expandBtn);
        });

        // Add validation on date input change
        this.startDate.addEventListener('change', () => this.validateDateRange());
        this.endDate.addEventListener('change', () => this.validateDateRange());
    }

    // Validate that start date is not after end date
    validateDateRange() {
        if (this.startDate.value && this.endDate.value) {
            if (new Date(this.startDate.value) > new Date(this.endDate.value)) {
                this.endDate.value = this.startDate.value;
            }
        }
    }

    async loadInitialData() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        this.startDate.value = this.formatDate(firstDayOfMonth);
        this.endDate.value = this.formatDate(today);
        
        await this.loadSalesData();
    }

    showLoading() {
        document.body.appendChild(this.loadingOverlay);
        document.body.classList.add('loading');
    }

    hideLoading() {
        document.body.removeChild(this.loadingOverlay);
        document.body.classList.remove('loading');
    }

    async loadSalesData() {
        try {
            this.showLoading();
            const params = new URLSearchParams({
                startDate: this.startDate.value,
                endDate: this.endDate.value
            });

            const response = await fetch(`/admin/sales/report?${params}`);
            if (!response.ok) throw new Error('Failed to fetch sales data');
            
            const data = await response.json();
            this.renderTable(data.products);
            this.updateStats(data.stats);

            // Store current sales data status
            this.hasSalesData = data.products && data.products.length > 0 && data.stats.totalSales > 0;
            
            // Enable/disable download button based on sales data
            this.downloadBtn.disabled = !this.hasSalesData;
            this.downloadBtn.classList.toggle('btn-disabled', !this.hasSalesData);
        } catch (error) {
            console.error('Error loading sales data:', error);
            this.showError('Failed to load sales data. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    renderTable(products) {
        this.salesTableBody.innerHTML = '';
        
        if (!products || products.length === 0) {
            // Show no data message
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="5" class="text-center">No sales data available for the selected period</td>
            `;
            this.salesTableBody.appendChild(emptyRow);
            return;
        }
        
        products.forEach(product => {
            const row = this.createProductRow(product);
            this.salesTableBody.appendChild(row);

            if (product.variants?.length) {
                product.variants.forEach(variant => {
                    const variantRow = this.createVariantRow(variant, product.productId);
                    this.salesTableBody.appendChild(variantRow);
                });
            }
        });
    }

    createProductRow(product) {
        const tr = document.createElement('tr');
        tr.className = 'product-row';
        tr.dataset.productId = product.productId;

        tr.innerHTML = `
            <td>
                <button class="expand-btn">
                    <i class="fas fa-chevron-right"></i>
                </button>
                ${product.productId}
            </td>
            <td>
                <img src="${product.image}" alt="${product.name}" class="product-img">
            </td>
            <td>${product.name}</td>
            <td class="text-right">${product.totalQuantity}</td>
            <td class="text-right">₹${product.totalAmount.toLocaleString()}</td>
        `;

        return tr;
    }

    createVariantRow(variant, productId) {
        const tr = document.createElement('tr');
        tr.className = 'variant-row';
        tr.dataset.parentId = productId;

        tr.innerHTML = `
            <td></td>
            <td><img src="${variant.image}" alt="${variant.color}" class="variant-img"></td>
            <td>${variant.color}</td>
            <td class="text-right">${variant.quantitySold}</td>
            <td class="text-right">₹${variant.revenue.toLocaleString()}</td>
        `;

        return tr;
    }

    handleRowExpand(expandBtn) {
        const productRow = expandBtn.closest('.product-row');
        const productId = productRow.dataset.productId;
        const icon = expandBtn.querySelector('i');
        const variantRows = document.querySelectorAll(`tr[data-parent-id="${productId}"]`);

        icon.classList.toggle('fa-chevron-right');
        icon.classList.toggle('fa-chevron-down');

        variantRows.forEach(row => {
            row.classList.toggle('expanded');
        });
    }

    async handlePeriodFilter(e) {
        const period = e.target.dataset.period;
        const dates = this.calculatePeriodDates(period);
        
        this.startDate.value = this.formatDate(dates.start);
        this.endDate.value = this.formatDate(dates.end);
        
        // Highlight active period button
        this.periodBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
        
        await this.loadSalesData();
    }

    calculatePeriodDates(period) {
        const today = new Date();
        let start = new Date();
        let end = new Date(today);

        switch (period) {
            case 'daily':
                start = new Date(today);
                break;
            case 'monthly':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'yearly':
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                if (end > today) end = today; // Ensure we don't include future dates
                break;
        }

        return { start, end };
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    updateStats(stats) {
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('totalSales').textContent = `₹${stats.totalSales.toLocaleString()}`;
        document.getElementById('totalUnits').textContent = stats.totalUnits;
    }

    handleDownloadClick() {
        // Check if there's sales data before showing the download modal
        if (!this.hasSalesData) {
            this.showNoSalesAlert();
            return;
        }
        
        this.showDownloadModal();
    }

    showNoSalesAlert() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'No Sales Data',
                text: 'There is no sales data available for the selected period.',
                icon: 'info',
                confirmButtonColor: '#6366f1'
            });
        } else {
            alert('No sales data available for the selected period.');
        }
    }

    showDownloadModal() {
        this.downloadModal.classList.add('active');
    }

    initializeDownloadModal() {
        // Close modal when clicking outside
        this.downloadModal.addEventListener('click', (e) => {
            if (e.target === this.downloadModal) {
                this.downloadModal.classList.remove('active');
            }
        });

        // Handle format selection and download
        const formatButtons = this.downloadModal.querySelectorAll('[data-format]');
        formatButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const format = e.target.closest('[data-format]').dataset.format;
                await this.downloadReport(format);
                this.downloadModal.classList.remove('active');
            });
        });
    }

    async downloadReport(format) {
        try {
            this.showLoading();
            const params = new URLSearchParams({
                startDate: this.startDate.value,
                endDate: this.endDate.value,
                format: format
            });

            const response = await fetch(`/admin/sales/download?${params}`);
            
            // Check for 204 status (no content)
            if (response.status === 204) {
                this.showNoSalesAlert();
                return;
            }
            
            if (!response.ok) throw new Error('Failed to download report');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-report-${this.formatDate(new Date())}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
            this.showError('Failed to download report. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    showError(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Error',
                text: message,
                icon: 'error',
                confirmButtonColor: '#6366f1'
            });
        } else {
            alert(message);
        }
    }
}

// Initialize the sales report when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SalesReport();
});

// Add this to your existing JavaScript file or replace the existing hamburger menu script
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav-links a');
    const toggleSidebarBtn = document.querySelector('.toggle-sidebar-btn');

    // Toggle sidebar for mobile
    hamburgerMenu.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // Toggle sidebar collapse state (for desktop)
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('expanded');
        });
    }

    // Close sidebar when clicking outside or on a link (mobile)
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Close sidebar when clicking on a navigation link (mobile)
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Only close the sidebar on mobile
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    });

    // Handle window resize events
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
            // Reset mobile classes when returning to desktop size
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
});