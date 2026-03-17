document.addEventListener('DOMContentLoaded', () => {
    // State management
    let currentPage = 1;
    let searchTerm = '';
    const itemsPerPage = 10;

    // DOM Elements
    const tbody = document.getElementById('tbody');
    const searchBar = document.getElementById('searchBar');
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    document.querySelector('.table-container').after(paginationContainer);

    // Fetch and render table data
    async function fetchTableData(page = 1, search = '') {
        try {
            const response = await fetch(`/admin/users/table?page=${page}&search=${search}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            renderTable(data.users);
            renderPagination(data.totalPages);
            return data;
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error fetching data',
                timer: 3000,
                showConfirmButton: false
            });
        }
    }

    // Render table content
    function renderTable(users) {
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.phone || ''}</td>
                <td>
                    <span class="status ${getStatusClass(user.status)}">
                        ${user.status}
                    </span>
                </td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        ${user.status !== 'Suspended' ? 
                            `<button class="action-btn block-user-btn" data-user-id="${user._id}">
                                🚷 Block
                            </button>
                            <div class="modal-overlay hide">
                                <div class="modal">
                                    <div class="modal-header">
                                        <h3 class="modal-title">Block User</h3>
                                        <button type="button" class="close-modal">&times;</button>
                                    </div>
                                    <div class="modal-body">
                                        <div class="form-group">
                                            <label for="blockReason-${user._id}">Block Reason:</label>
                                            <textarea id="blockReason-${user._id}" required></textarea>
                                        </div>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="modal-btn cancel-btn">Cancel</button>
                                        <button type="button" class="modal-btn confirm-btn" data-user-id="${user._id}">
                                            Confirm Block
                                        </button>
                                    </div>
                                </div>
                            </div>` :
                            `<button class="action-btn unblock-user-btn" data-user-id="${user._id}">
                                🔓 Unblock
                            </button>`
                        }
                    </div>
                </td>
            </tr>
        `).join('');
        
        attachEventListeners();
    }

    // Render pagination controls
    function renderPagination(totalPages) {
        paginationContainer.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.className = i === currentPage ? 'active' : '';
            button.addEventListener('click', () => {
                currentPage = i;
                fetchTableData(currentPage, searchTerm);
            });
            paginationContainer.appendChild(button);
        }
    }

    // Event listeners
    function attachEventListeners() {
        // Block buttons
        document.querySelectorAll('.block-user-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.nextElementSibling;
                modal.classList.remove('hide');
                // Add active class to make sure modal is displayed properly
                modal.classList.add('active');
            });
        });

        // Confirm block buttons
        document.querySelectorAll('.confirm-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const userId = this.dataset.userId;
                const reasonTextarea = document.getElementById(`blockReason-${userId}`);
                await handleBlock(userId, reasonTextarea.value);
                // Hide the modal after confirmation
                const modal = this.closest('.modal-overlay');
                modal.classList.add('hide');
                modal.classList.remove('active');
            });
        });

        // Unblock buttons
        document.querySelectorAll('.unblock-user-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const result = await Swal.fire({
                    title: 'Are you sure?',
                    text: 'Do you want to unblock the user?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Unblock!',
                    cancelButtonText: 'No, cancel!'
                });

                if (!result.isConfirmed) return;
                const userId = this.dataset.userId;
                await handleUnblock(userId);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.close-modal, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal-overlay');
                modal.classList.add('hide');
                modal.classList.remove('active');
            });
        });
    }

    // Block user handler
    async function handleBlock(userId, reason) {
        try {
            const response = await fetch('/admin/users/block', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: userId,
                    blockReason: reason
                })
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'User blocked successfully',
                    timer: 3000,
                    showConfirmButton: false
                });
                fetchTableData(currentPage, searchTerm);
            } else {
                throw new Error('Failed to block user');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error blocking user',
                timer: 3000,
                showConfirmButton: false
            });
        }
    }

    // Unblock user handler
    async function handleUnblock(userId) {
        try {
            const response = await fetch('/admin/users/unblock-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: userId })
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'User unblocked successfully',
                    timer: 3000,
                    showConfirmButton: false
                });
                fetchTableData(currentPage, searchTerm);
            } else {
                throw new Error('Failed to unblock user');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error unblocking user',
                timer: 3000,
                showConfirmButton: false
            });
        }
    }

    // Search handler with debounce
    let searchTimeout;
    searchBar.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchTerm = e.target.value;
            currentPage = 1;
            fetchTableData(currentPage, searchTerm);
        }, 300);
    });

    // Utility functions
    function getStatusClass(status) {
        return {
            'Active': 'active',
            'Inactive': 'inactive',
            'Suspended': 'blocked'
        }[status] || '';
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    // Initial load
    fetchTableData();
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