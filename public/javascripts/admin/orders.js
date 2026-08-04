// Global state
let currentPage = 1;
let currentStatus = 'All';

// Add styles for the order management system
const style = document.createElement('style');
style.textContent = `
    .refund-request-tab {
        position: relative;
    }
    
    .refund-counter {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 12px;
        font-weight: bold;
    }
    
    .refund-actions {
        display: flex;
        gap: 8px;
        margin-left: 8px;
        align-items: center;
    }
    
    .approve-refund-btn {
        background: #10b981;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .reject-refund-btn {
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .info-btn {
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-style: italic;
    }
    
    .approve-refund-btn:hover {
        background: #059669;
    }
    
    .reject-refund-btn:hover {
        background: #dc2626;
    }
    
    .info-btn:hover {
        background: #2563eb;
    }
    
    .status-pending { color: #f59e0b; }
    .status-processing { color: #3b82f6; }
    .status-shipped { color: #6366f1; }
    .status-delivered { color: #10b981; }
    .status-cancelled { color: #ef4444; }
    .status-refund-requested { color: #f59e0b; }
    .status-refunded { color: #8b5cf6; }

    .order-details {
        text-align: left;
        padding: 15px;
    }

    .order-details p {
        margin: 10px 0;
        line-height: 1.4;
    }

    .btn-sm {
        padding: 4px 8px;
        font-size: 12px;
        border-radius: 4px;
        cursor: pointer;
        background: #4f46e5;
        color: white;
        border: none;
        margin: 0 4px;
    }

    .btn-sm:hover {
        background: #4338ca;
    }

    .text-red-500 {
        color: #ef4444;
    }

    .mb-4 {
        margin-bottom: 1rem;
    }

    .mb-2 {
        margin-bottom: 0.5rem;
    }

    .text-left {
        text-align: left;
    }
`;
document.head.appendChild(style);

// Initialize status tabs
document.querySelector('.status-tabs').innerHTML = `
    <button class="status-tab active" data-status="All">All</button>
    <button class="status-tab" data-status="Pending">Pending</button>
    <button class="status-tab" data-status="Processing">Processing</button>
    <button class="status-tab" data-status="Shipped">Shipped</button>
    <button class="status-tab" data-status="Delivered">Delivered</button>
    <button class="status-tab" data-status="Cancelled">Cancelled</button>
    <button class="status-tab refund-request-tab" data-status="Refund Requested">
        Refund Requested
        <span class="refund-counter" style="display: none">0</span>
    </button>
    <button class="status-tab" data-status="Refunded">Refunded</button>
     <button class="status-tab" data-status="Returned">Returned</button>
`;

// Add event listeners to status tabs
document.querySelectorAll('.status-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const status = this.getAttribute('data-status');
        document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        filterOrders(status, 1); // Reset to first page when changing status
    });
});

// Main function to filter orders
function filterOrders(status, page = 1) {
    currentStatus = status;
    currentPage = page;
    
    fetch(`/admin/orders/get?status=${status}&page=${page}`)
        .then(response => response.json())
        .then(data => {
            updateOrdersTable(data.orders);
            updatePagination(data.pagination);
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch orders. Please try again.',
                confirmButtonColor: '#3085d6'
            });
        });
}

// Update the orders table with new data
function updateOrdersTable(orders) {
    const ordersTableBody = document.getElementById('ordersTableBody');
    ordersTableBody.innerHTML = '';
    
    // Update refund counter
    const refundRequests = orders.filter(order => order.status === 'Refund Requested').length;
    const refundCounter = document.querySelector('.refund-counter');
    if (refundRequests > 0) {
        refundCounter.textContent = refundRequests;
        refundCounter.style.display = 'block';
    } else {
        refundCounter.style.display = 'none';
    }

    let i = (currentPage - 1) * 10 + 1;
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        // Add the data-order-id attribute to the row itself
        row.setAttribute('data-order-id', order._id);
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>
                <div class="customer-info">
                    <p>${order.userId}</p>
                </div>
            </td>
            <td>
                <div class="product-info">
                    <img src="${order.image}" alt="${order.name}" class="product-thumbnail">
                    <p>${order.name}</p>
                    <small>Size: ${order.size}</small>
                </div>
            </td>
            <td>${order.quantity}</td>
            <td>₹${order.price.toLocaleString()}</td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td>${order.paymentMethod.toUpperCase()}</td>
            <td> <small>Address: ${order.address.street}, ${order.address.city}, ${order.address.postalCode}</small></td>
            <td>
                <span class="status status-${order.status.toLowerCase().replace(' ', '-')}">
                    ${order.status}
                    ${order.status === 'Refund Requested' ? 
                        `<div class="refund-actions">
                            <button class="approve-refund-btn" data-order-id="${order._id}">
                                Approve
                            </button>
                            <button class="reject-refund-btn" data-order-id="${order._id}">
                                Reject
                            </button>
                            <button class="info-btn" data-order-id="${order._id}" data-refund-reason="${order.reasonForRefund || 'No reason provided'}">
                                i
                            </button>
                        </div>` : ''}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    ${order.status !== 'Refunded' ? 
                        `<button class="change-status-btn btn-sm" data-order-id="${order._id}">
                            Change Status
                        </button>` : ''}
                </div>
            </td>
        `;
        ordersTableBody.appendChild(row);
    });
    
    attachRowClickListeners();
    attachChangeStatusListeners();
    attachRefundListeners();
    attachInfoListeners();
}

function attachRowClickListeners() {
    const tableRows = document.querySelectorAll('#ordersTableBody tr');
    
    tableRows.forEach(row => {
        row.addEventListener('click', async function() {
            
            const orderId = this.getAttribute('data-order-id');
            
            try {
                // Fetch the order details
                const response = await fetch(`/admin/orders/${orderId}/details`);
                if (!response.ok) throw new Error('Failed to fetch order details');
                
                const orderData = await response.json();
                const order = orderData.order;
                
                // Format payment details
                let paymentDetailsHtml = '';
                if (order.paymentDetails) {
                    const paymentKeys = Object.keys(order.paymentDetails);
                    paymentDetailsHtml = paymentKeys.map(key => 
                        `<p><strong>${key}:</strong> ${order.paymentDetails[key]}</p>`
                    ).join('');
                }
                
                // Format coupon information
                let couponHtml = 'No coupon applied';
                if (order.couponApplied) {
                    couponHtml = `
                        <p><strong>Coupon Code:</strong> ${order.couponApplied}</p>
                        <p><strong>Discount Amount:</strong> ₹${order.couponDiscountApplied.toLocaleString()}</p>
                    `;
                }
                
                // Create the modal with SweetAlert2
                Swal.fire({
                    title: `Order Details - ${order.orderId}`,
                    html: `
                        <div class="order-details">
                            <div class="mb-4 text-left">
                                <h3 class="mb-2">Customer Information</h3>
                                <p><strong>User ID:</strong> ${order.userId}</p>
                            </div>
                            
                            <div class="mb-4 text-left">
                                <h3 class="mb-2">Product Information</h3>
                                <div class="product-info">
                                    <img src="${order.image}" alt="${order.name}" class="product-thumbnail" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                                    <p><strong>Product:</strong> ${order.name}</p>
                                </div>
                                <p><strong>Product ID:</strong> ${order.productId}</p>
                                <p><strong>Size:</strong> ${order.size}</p>
                                <p><strong>Quantity:</strong> ${order.quantity}</p>
                                <p><strong>Original Price:</strong> ₹${order.originalPrice ? order.originalPrice.toLocaleString() : order.price.toLocaleString()}</p>
                                <p><strong>Final Price:</strong> ₹${order.price.toLocaleString()}</p>
                            </div>
                            
                            <div class="mb-4 text-left">
                                <h3 class="mb-2">Order Information</h3>
                                <p><strong>Order Date:</strong> ${formatDate(order.orderDate)}</p>
                                <p><strong>Status:</strong> <span class="status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span></p>
                                <p><strong>Previous Status:</strong> ${order.previousStatus}</p>
                                ${order.reasonForRefund ? `<p><strong>Refund Reason:</strong> ${order.reasonForRefund}</p>` : ''}
                            </div>
                            
                            <div class="mb-4 text-left">
                                <h3 class="mb-2">Payment Information</h3>
                                <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                                <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                                ${paymentDetailsHtml}
                            </div>
                            
                            <div class="mb-4 text-left">
                                <h3 class="mb-2">Coupon Information</h3>
                                ${couponHtml}
                            </div>
                            
                            <div class="mb-4 text-left">
                                <h3 class="mb-2">Shipping Address</h3>
                                <p>${order.address.street},</p>
                                <p>${order.address.city}, ${order.address.state}</p>
                                <p>${order.address.postalCode}, ${order.address.country || 'India'}</p>
                            </div>
                        </div>
                    `,
                    width: '600px',
                    background: '#1f2937',
                    color: '#f3f4f6',
                    showCloseButton: true,
                    showConfirmButton: false,
                    customClass: {
                        container: 'order-details-modal'
                    }
                });
            } catch (error) {
                handleError(error, 'Order Details Error');
            }
        });
    });
}

// Update pagination controls
function updatePagination(paginationData) {
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = '';

    // Previous button
    if (paginationData.hasPrevPage) {
        const prevButton = createPageButton('Previous', currentPage - 1);
        prevButton.classList.add('page-btn-prev');
        paginationContainer.appendChild(prevButton);
    }

    // Page numbers
    for (let i = 1; i <= paginationData.totalPages; i++) {
        if (
            i === 1 ||
            i === paginationData.totalPages ||
            (i >= currentPage - 2 && i <= currentPage + 2)
        ) {
            const pageButton = createPageButton(i, i);
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            paginationContainer.appendChild(pageButton);
        } else if (
            i === currentPage - 3 ||
            i === currentPage + 3
        ) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.classList.add('page-ellipsis');
            paginationContainer.appendChild(ellipsis);
        }
    }

    // Next button
    if (paginationData.hasNextPage) {
        const nextButton = createPageButton('Next', currentPage + 1);
        nextButton.classList.add('page-btn-next');
        paginationContainer.appendChild(nextButton);
    }
}

// Create pagination button helper
function createPageButton(text, pageNumber) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('page-btn');
    button.addEventListener('click', () => filterOrders(currentStatus, pageNumber));
    return button;
}

// Add new function to handle info button clicks
function attachInfoListeners() {
    document.querySelectorAll('.info-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const reason = this.getAttribute('data-refund-reason');
            console.log(reason);
            
            Swal.fire({
                title: 'Refund Reason',
                text: reason,
                icon: 'info',
                confirmButtonColor: '#3b82f6',
                background: '#1f2937',
                color: '#f3f4f6'
            });
        });
    });
}

// FIXED: Attach change status listeners
function attachChangeStatusListeners() {
    document.querySelectorAll('.change-status-btn').forEach(button => {
        button.addEventListener('click', async function(e) {
            // Add stopPropagation to prevent row click from triggering
            e.stopPropagation();
            const orderId = this.getAttribute('data-order-id');
            try {
                const orderResponse = await fetch(`/admin/orders/${orderId}/details`);
                if (!orderResponse.ok) throw new Error('Failed to fetch order details');
                const orderData = await orderResponse.json();
                const orderCurrentStatus = orderData.order.status;
                
                // Define status progression and available options based on current status
                let availableOptions = {};
                
                switch(orderCurrentStatus) {
                    case 'Pending':
                        availableOptions = {
                            'Pending': 'Pending',
                            'Processing': 'Processing',
                            'Cancelled': 'Cancelled'
                        };
                        break;
                    case 'Processing':
                        availableOptions = {
                            'Processing': 'Processing',
                            'Shipped': 'Shipped',
                            'Cancelled': 'Cancelled'
                        };
                        break;
                    case 'Shipped':
                        availableOptions = {
                            'Shipped': 'Shipped',
                            'Delivered': 'Delivered'
                        };
                        break;
                    case 'Delivered':
                        availableOptions = {
                            'Delivered': 'Delivered'
                        };
                        break;
                    case 'Refund Requested':
                        // For refund requested, only show refund actions, not status changes
                        Swal.fire({
                            icon: 'info',
                            title: 'Refund In Progress',
                            text: 'This order has a pending refund request. Please use the approve or reject refund buttons instead.',
                            confirmButtonColor: '#3b82f6'
                        });
                        return;
                    case 'Refunded':
                        Swal.fire({
                            icon: 'info',
                            title: 'Order Already Refunded',
                            text: 'This order has been refunded and its status cannot be changed.',
                            confirmButtonColor: '#3b82f6'
                        });
                        return;
                    case 'Cancelled':
                        Swal.fire({
                            icon: 'info',
                            title: 'Order Already Cancelled',
                            text: 'This order has been cancelled and its status cannot be changed.',
                            confirmButtonColor: '#3b82f6'
                        });
                        return;
                    case 'Returned':
                        Swal.fire({
                            icon: 'info',
                            title: 'Order Already Returned',
                            text: 'This order has been returned and its status cannot be changed.',
                            confirmButtonColor: '#3b82f6'
                        });
                        return;
                    default:
                        availableOptions = {
                            'Pending': 'Pending',
                            'Processing': 'Processing',
                            'Shipped': 'Shipped',
                            'Delivered': 'Delivered',
                            'Cancelled': 'Cancelled'
                        };
                }
                
                // If there are no options or only one option (current status), show a message
                if (Object.keys(availableOptions).length <= 1) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Status Update Restricted',
                        text: `Orders in '${orderCurrentStatus}' status cannot be changed to a different status.`,
                        confirmButtonColor: '#3b82f6'
                    });
                    return;
                }
                
                const result = await Swal.fire({
                    title: 'Change Order Status',
                    input: 'select',
                    inputOptions: availableOptions,
                    inputPlaceholder: 'Select the new status',
                    inputValue: orderCurrentStatus, // Pre-select current status
                    showCancelButton: true,
                    confirmButtonText: 'Update',
                    cancelButtonText: 'Cancel',
                    showLoaderOnConfirm: true,
                    footer: '<div class="text-left text-red-500">Note: Orders can only progress forward in the workflow.</div>',
                    inputValidator: (value) => {
                        if (!value) {
                            return 'You need to select a status';
                        }
                        if (value === orderCurrentStatus) {
                            return 'Please select a different status';
                        }
                    }
                });

                if (result.isConfirmed) {
                    const newStatus = result.value;
                    const response = await fetch(`/admin/orders/${orderId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: newStatus })
                    });
                    
                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(data.message || 'Failed to update status');
                    }
                
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Order status updated successfully!',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    
                    // Refresh the current view with the global filter state
                    filterOrders(currentStatus, currentPage);
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An unexpected error occurred. Please try again.'
                });
            }
        });
    });
}

// FIXED: Attach refund handling listeners
function attachRefundListeners() {
    // Approve Refund
    document.querySelectorAll('.approve-refund-btn').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.stopPropagation();
            const orderId = this.getAttribute('data-order-id');
            
            try {
                const result = await Swal.fire({
                    title: 'Approve Refund Request',
                    text: 'Are you sure you want to approve this refund request?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Approve',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#10b981',
                    showLoaderOnConfirm: true,
                });

                if (result.isConfirmed) {
                    const response = await fetch(`/admin/orders/${orderId}/refund-A`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            status: 'approved'
                        })
                    });
                    
                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(data.message || 'Failed to process refund');
                    }

                    await Swal.fire({
                        icon: 'success',
                        title: 'Refund Approved',
                        text: 'The refund has been processed successfully!',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    
                    // Use the currentStatus from the global state for refreshing
                    filterOrders(currentStatus, currentPage);
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to process refund request'
                });
            }
        });
    });

    // Reject Refund
    document.querySelectorAll('.reject-refund-btn').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.stopPropagation();
            const orderId = this.getAttribute('data-order-id');
            
            try {
                const result = await Swal.fire({
                    title: 'Reject Refund Request',
                    text: 'Are you sure you want to reject this refund request?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Reject',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#ef4444',
                    showLoaderOnConfirm: true,
                });

                if (result.isConfirmed) {
                    const response = await fetch(`/admin/orders/${orderId}/refund-R`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            status: 'rejected'
                        })
                    });
                    
                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(data.message || 'Failed to process refund rejection');
                    }

                    await Swal.fire({
                        icon: 'success',
                        title: 'Refund Rejected',
                        text: 'The refund request has been rejected.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    
                    // Use the currentStatus from the global state for refreshing
                    filterOrders(currentStatus, currentPage);
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to process refund rejection'
                });
            }
        });
    });
}

// Handle custom styles for SweetAlert2
function initializeSweetAlertStyles() {
    const sweetAlertStyles = `
        .swal2-popup {
            background: var(--card-dark) !important;
            color: var(--text-light) !important;
        }
        
        .swal2-title, .swal2-content {
            color: var(--text-light) !important;
        }
        
        .swal2-input, .swal2-select {
            background: var(--bg-dark) !important;
            color: var(--text-light) !important;
            border-color: var(--border-dark) !important;
        }
        
        .swal2-confirm, .swal2-cancel {
            color: white !important;
        }
        
        .swal2-select option {
            background: var(--bg-dark);
            color: var(--text-light);
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = sweetAlertStyles;
    document.head.appendChild(styleElement);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeSweetAlertStyles();
    filterOrders('All', 1);
    
    // Handle logout button click
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const result = await Swal.fire({
                title: 'Logout Confirmation',
                text: 'Are you sure you want to logout?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, logout',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#3b82f6',
            });

            if (result.isConfirmed) {
                window.location.href = '/admin/logout';
            }
        });
    }
});

// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

// Helper function to format dates
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Error handler function
function handleError(error, title = 'Error') {
    console.error(error);
    Swal.fire({
        icon: 'error',
        title: title,
        text: error.message || 'An unexpected error occurred. Please try again.',
        confirmButtonColor: '#3b82f6',
        background: '#1f2937',
        color: '#f3f4f6'
    });
}

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