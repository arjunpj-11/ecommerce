// Initialize state variables
let coupons = [];
let currentPage = 1;
let totalPages = 1;
let currentFilter = 'all';
let editingCouponId = null;

// Initialize SweetAlert Toast
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
});

// Loader functions
function showLoader() {
    document.getElementById('loader').classList.add('active');
}

function hideLoader() {
    document.getElementById('loader').classList.remove('active');
}

// Pagination functions
function initPagination() {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
        tableContainer.insertAdjacentElement('afterend', paginationContainer);
    }
}

function renderPagination() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;
    
    let paginationHTML = '';
    
    if (totalPages > 1) {
        paginationHTML += `
            <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1})">Previous</button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="page-btn ${currentPage === i ? 'active' : ''}" 
                    onclick="changePage(${i})">${i}</button>
            `;
        }
        
        paginationHTML += `
            <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1})">Next</button>
        `;
    }
    
    pagination.innerHTML = paginationHTML;
}

async function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    await fetchCoupons();
}

// Coupon fetch and render functions
async function fetchCoupons() {
    try {
        showLoader();
        const response = await fetch(`/admin/coupons/get?page=${currentPage}&filter=${currentFilter}`);
        const data = await response.json();
        
        if (data.success) {
            coupons = data.coupons;
            totalPages = data.totalPages;
            currentPage = data.currentPage;
            renderCoupons();
            renderPagination();
        } else {
            throw new Error(data.message || 'Failed to fetch coupons');
        }
    } catch (error) {
        console.error('Error fetching coupons:', error);
        Toast.fire({
            icon: 'error',
            title: 'Failed to load coupons'
        });
    } finally {
        hideLoader();
    }
}

function renderCoupons() {
    const tableBody = document.getElementById('couponsTableBody');
    if (!tableBody) {
        console.error('Coupons table body not found');
        return;
    }

    let html = '';

    if (!coupons || coupons.length === 0) {
        html = '<tr><td colspan="8" style="text-align: center;">No coupons found</td></tr>';
    } else {
        coupons.forEach(coupon => {
            const createdDate = new Date(coupon.createdAt).toLocaleDateString();
            const validityDate = new Date(coupon.validity).toLocaleDateString();
            
            html += `
                <tr>
                    <td>${coupon.couponName || ''}</td>
                    <td>${coupon.couponCode || ''}</td>
                    <td>₹${coupon.discount || 0}</td>
                    <td>₹${coupon.minAmount || 0}</td>
                    <td>${validityDate}</td>
                    <td>
                        <span class="status-badge status-${(coupon.status || '').toLowerCase()}">
                            ${coupon.status || 'Unknown'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn" onclick="editCoupon('${coupon._id}')">Edit</button>
                            <button class="action-btn" onclick="confirmDelete('${coupon._id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = html;
}

// Modal control functions
function openModal(isEdit = false) {
    const modal = document.getElementById('couponModal');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = isEdit ? 'Edit Coupon' : 'Create Coupon';
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('couponModal');
    modal.classList.remove('active');
    editingCouponId = null;
    document.getElementById('couponForm').reset();
}

// Coupon CRUD operations
async function editCoupon(id) {
    try {
        showLoader();
        const response = await fetch(`/admin/coupons/${id}`);
        const data = await response.json();
        
        if (data.success) {
            editingCouponId = id;
            const coupon = data.coupon;
            
            document.getElementById('couponName').value = coupon.couponName;
            document.getElementById('couponCode').value = coupon.couponCode;
            document.getElementById('discount').value = coupon.discount;
            document.getElementById('minAmount').value = coupon.minAmount;
            document.getElementById('validity').value = coupon.validity.split('T')[0];
            
            openModal(true);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        Toast.fire({
            icon: 'error',
            title: error.message
        });
    } finally {
        hideLoader();
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        couponName: document.getElementById('couponName').value,
        couponCode: document.getElementById('couponCode').value,
        discount: Number(document.getElementById('discount').value),
        minAmount: Number(document.getElementById('minAmount').value),
        validity: document.getElementById('validity').value
    };

    // Validate discount
    if (formData.discount > (formData.minAmount / 4)) {
        Toast.fire({
            icon: 'error',
            title: 'Discount cannot exceed 25% of minimum amount'
        });
        return;
    }

    try {
        showLoader();
        const url = editingCouponId 
            ? `/admin/coupons/${editingCouponId}`
            : '/admin/coupons/add';
        
        const method = editingCouponId ? 'PATCH' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.success) {
            Toast.fire({
                icon: 'success',
                title: data.message
            });
            closeModal();
            await fetchCoupons();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        Toast.fire({
            icon: 'error',
            title: error.message
        });
    } finally {
        hideLoader();
    }
}

function confirmDelete(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                showLoader();
                const response = await fetch(`/admin/coupons/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    Toast.fire({
                        icon: 'success',
                        title: data.message
                    });
                    await fetchCoupons();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                Toast.fire({
                    icon: 'error',
                    title: error.message
                });
            } finally {
                hideLoader();
            }
        }
    });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', async () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            currentPage = 1;
            await fetchCoupons();
        });
    });

    // Initialize create button
    const createCouponBtn = document.getElementById('createCouponBtn');
    if (createCouponBtn) {
        createCouponBtn.addEventListener('click', () => openModal(false));
    }

    // Initialize modal close buttons
    const modalClose = document.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Initialize form submission
    const couponForm = document.getElementById('couponForm');
    if (couponForm) {
        couponForm.addEventListener('submit', handleFormSubmit);
    }

    // Set minimum date for validity input
    const validityInput = document.getElementById('validity');
    if (validityInput) {
        const today = new Date().toISOString().split('T')[0];
        validityInput.min = today;
    }

    // Initialize pagination and fetch initial data
    initPagination();
    fetchCoupons();
});


    document.addEventListener('DOMContentLoaded', function() {
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const navLinks = document.querySelectorAll('.nav-links a');

        // Toggle sidebar
        hamburgerMenu.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        // Close sidebar when clicking outside or on a link
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        // Close sidebar when clicking on a navigation link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        });
    });