document.addEventListener('DOMContentLoaded', async () => {
    // Hamburger menu functionality
    const hamburger = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        
        // Update hamburger icon
        const spans = hamburger.querySelectorAll('span');
        if (sidebar.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !hamburger.contains(e.target)) {
            sidebar.classList.remove('active');
            
            // Reset hamburger icon
            const spans = hamburger.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
    
    // Adjust main content based on window size
    function adjustLayout() {
        if (window.innerWidth <= 768) {
            mainContent.style.marginLeft = '0';
            sidebar.classList.remove('active');
            
            // Reset hamburger icon
            const spans = hamburger.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        } else {
            mainContent.style.marginLeft = 'var(--sidebar-width)';
        }
    }
    
    // Call on load and on window resize
    adjustLayout();
    window.addEventListener('resize', adjustLayout);

    const searchInput = document.querySelector('.search-bar input');
    let searchTimeout;

    // Function to fetch and update products table
    async function fetchProductsTable(page = 1, search = '') {
        try {
            const response = await fetch(`/admin/products/table?page=${page}&search=${encodeURIComponent(search)}`, {
                method: 'POST',
            });
            
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
    
            const html = await response.text();
            
            // Update the tbody content
            const tbody = document.getElementById('tbody');
            if (!tbody) {
                throw new Error('Products table body not found');
            }
            tbody.innerHTML = html;
            
            // Update pagination if it exists
            const paginationHtml = html.match(/<div class="pagination">([\s\S]*?)<\/div>/);
            if (paginationHtml) {
                const existingPagination = document.querySelector('.pagination');
                if (existingPagination) {
                    existingPagination.outerHTML = paginationHtml[0];
                } else {
                    const table = document.querySelector('.product-table');
                    if (table) {
                        table.insertAdjacentHTML('afterend', paginationHtml[0]);
                    }
                }
            }
            
            // Reattach event listeners
            attachEventListeners();
    
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load products. Please try again.',
                background: '#1f2937',
                color: '#f3f4f6'
            });
        }
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                fetchProductsTable(1, e.target.value);
            }, 300);
        });
    }

    // Function to show success alert
    async function showSuccessAlert(message) {
        await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            background: '#1f2937',
            color: '#f3f4f6',
            timer: 2000,
            showConfirmButton: false
        });
    }

    // Function to attach edit listeners
    function attachEditListeners() {
        const editButtons = document.querySelectorAll('.edit-product-btn');
        const modalOverlays = document.querySelectorAll('.cat-modal__overlay');
        const closeBtns = document.querySelectorAll('.cat-modal__close-btn');
        const cancelBtns = document.querySelectorAll('.cat-btn--cancel');
        const editForms = document.querySelectorAll('.cat-form');

        // Show modal when edit button is clicked
        editButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                // Fix: Find the modal overlay within the same row, not as a child of the button parent
                const row = btn.closest('tr');
                const overlay = row.querySelector('.cat-modal__overlay');
                if (overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Hide modal when close button is clicked
        closeBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const overlay = btn.closest('.cat-modal__overlay');
                if (overlay) {
                    overlay.classList.add('active');
                }
            });
        });

        // Hide modal when cancel button is clicked
        cancelBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const overlay = btn.closest('.cat-modal__overlay');
                if (overlay) {
                    overlay.classList.add('active');
                }
            });
        });

        // Handle form submission
        editForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const formData = {
                        id: form.querySelector('.id').value,
                        name: form.querySelector('#productName').value,
                        description: form.querySelector('#description').value,
                        price: form.querySelector('#price').value,
                    };

                    // Validate form data
                    if (!formData.id || !formData.name || !formData.price) {
                        throw new Error('Please fill in all required fields');
                    }

                    const response = await fetch('/admin/products/edit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || 'Failed to update product');
                    }

                    if (result.success) {
                        const overlay = form.closest('.cat-modal__overlay');
                        if (overlay) {
                            overlay.classList.add('active');
                        }
                        
                        await showSuccessAlert(result.message);

                        // Refresh the table
                        const currentPage = document.querySelector('.pagination-btn.active')?.dataset.page || 1;
                        const searchQuery = document.querySelector('.search-bar input')?.value || '';
                        await fetchProductsTable(currentPage, searchQuery);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.message || 'Failed to update the product. Please try again.',
                        background: '#1f2937',
                        color: '#f3f4f6'
                    });
                }
            });
        });
    }

    // Function to attach all event listeners
    function attachEventListeners() {
        // Pagination buttons
        const paginationButtons = document.querySelectorAll('.pagination-btn');
        paginationButtons.forEach(button => {
            button.addEventListener('click', () => {
                const page = button.dataset.page;
                const searchQuery = searchInput ? searchInput.value : '';
                fetchProductsTable(page, searchQuery);
            });
        });

        // Delete buttons
        const deleteButtons = document.querySelectorAll('.permanentDelete');
        deleteButtons.forEach((btn) => {
            btn.addEventListener('click', async () => {
                try {
                    const isConfirmed = await Swal.fire({
                        title: 'Are you sure?',
                        text: 'Are you sure you want to delete this product permanently?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete it!',
                        cancelButtonText: 'No, cancel!',
                        background: '#1f2937',
                        color: '#f3f4f6'
                    });

                    if (!isConfirmed.isConfirmed) return;

                    const row = btn.closest('tr');
                    const id = row.querySelector('.id').value;
                    
                    const response = await fetch('/admin/products/delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });

                    const result = await response.json();
                    if (result.success) {
                        await showSuccessAlert(result.message);
                        const currentPage = document.querySelector('.pagination-btn.active')?.dataset.page || 1;
                        const searchQuery = searchInput ? searchInput.value : '';
                        await fetchProductsTable(currentPage, searchQuery);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete the product. Please try again.',
                        background: '#1f2937',
                        color: '#f3f4f6'
                    });
                }
            });
        });

        // Inactivate buttons
        const inactivateButtons = document.querySelectorAll('.makeInactive');
        inactivateButtons.forEach((btn) => {
            btn.addEventListener('click', async () => {
                try {
                    const result = await Swal.fire({
                        title: 'Are you sure?',
                        text: 'Do you want to inactivate this product?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, inactivate it!',
                        cancelButtonText: 'No, cancel!',
                        background: '#1f2937',
                        color: '#f3f4f6'
                    });

                    if (!result.isConfirmed) return;

                    const row = btn.closest('tr');
                    const id = row.querySelector('.id').value;
                    
                    const response = await fetch('/admin/products/inactivate', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });

                    const data = await response.json();
                    if (data.success) {
                        await showSuccessAlert(data.message);
                        const currentPage = document.querySelector('.pagination-btn.active')?.dataset.page || 1;
                        const searchQuery = searchInput ? searchInput.value : '';
                        await fetchProductsTable(currentPage, searchQuery);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to inactivate the product. Please try again.',
                        background: '#1f2937',
                        color: '#f3f4f6'
                    });
                }
            });
        });

        // Activate buttons
        const activateButtons = document.querySelectorAll('.makeActive');
        activateButtons.forEach((btn) => {
            btn.addEventListener('click', async () => {
                try {
                    const result = await Swal.fire({
                        title: 'Are you sure?',
                        text: 'Do you want to activate this product?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, activate it!',
                        cancelButtonText: 'No, cancel!',
                        background: '#1f2937',
                        color: '#f3f4f6'
                    });

                    if (!result.isConfirmed) return;

                    const row = btn.closest('tr');
                    const id = row.querySelector('.id').value;
                    
                    const response = await fetch('/admin/products/activate', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });

                    const data = await response.json();
                    if (data.success) {
                        await showSuccessAlert(data.message);
                        const currentPage = document.querySelector('.pagination-btn.active')?.dataset.page || 1;
                        const searchQuery = searchInput ? searchInput.value : '';
                        await fetchProductsTable(currentPage, searchQuery);
                    } else {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: data.message,
                            background: '#1f2937',
                            color: '#f3f4f6'
                        });
                    }
                } catch (error) {
                    console.error('Error:', error);
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to activate the product. Please try again.',
                        background: '#1f2937',
                        color: '#f3f4f6'
                    });
                }
            });
        });

        // Attach edit listeners
        attachEditListeners();
    }

    // Initial fetch
    await fetchProductsTable();
});