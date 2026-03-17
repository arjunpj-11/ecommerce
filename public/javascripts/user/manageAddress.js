// First, let's define our notification system
class NotificationSystem {
    constructor() {
        this.initializeToastContainer();
        this.initializeConfirmDialog();
    }

    initializeToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 2000;
        `;
        document.body.appendChild(this.toastContainer);
    }

    initializeConfirmDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-content">
                <h3>Confirm Action</h3>
                <p class="confirm-message"></p>
                <div class="confirm-buttons">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Confirm</button>
                </div>
            </div>
        `;
        
        const styles = document.createElement('style');
        styles.textContent = `
            .confirm-dialog {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
                z-index: 2001;
                align-items: center;
                justify-content: center;
            }
            
            .confirm-content {
                background: #1f2937;
                border: 1px solid rgba(234, 179, 8, 0.2);
                border-radius: 0.75rem;
                padding: 2rem;
                max-width: 400px;
                width: 90%;
            }
            
            .confirm-content h3 {
                color: #eab308;
                margin-bottom: 1rem;
                font-size: 1.25rem;
            }
            
            .confirm-content p {
                color: #d1d5db;
                margin-bottom: 1.5rem;
            }
            
            .confirm-buttons {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }
            
            .confirm-btn, .cancel-btn {
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                border: none;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .confirm-btn {
                background: #dc2626;
                color: white;
            }
            
            .confirm-btn:hover {
                background: #b91c1c;
            }
            
            .cancel-btn {
                background: rgba(234, 179, 8, 0.1);
                color: #eab308;
                border: 1px solid rgba(234, 179, 8, 0.2);
            }
            
            .cancel-btn:hover {
                background: rgba(234, 179, 8, 0.2);
            }
            
            .toast {
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 1rem 2rem;
                border-radius: 0.5rem;
                margin-top: 1rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
                min-width: 300px;
            }
            
            .toast.success {
                border-left: 4px solid #4CAF50;
            }
            
            .toast.error {
                border-left: 4px solid #F44336;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.25rem;
                margin-left: 1rem;
                opacity: 0.7;
            }
            
            .toast-close:hover {
                opacity: 1;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
        document.body.appendChild(dialog);
        
        this.confirmDialog = dialog;
        this.setupConfirmListeners();
    }

    setupConfirmListeners() {
        const cancelBtn = this.confirmDialog.querySelector('.cancel-btn');
        const confirmBtn = this.confirmDialog.querySelector('.confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            this.hideConfirm();
        });
        
        confirmBtn.addEventListener('click', () => {
            if (this.onConfirm) {
                this.onConfirm();
                this.hideConfirm();
            }
        });
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const content = document.createElement('span');
        content.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.toastContainer.removeChild(toast);
        
        toast.appendChild(content);
        toast.appendChild(closeBtn);
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                this.toastContainer.removeChild(toast);
            }
        }, 3000);
    }

    confirm(message, onConfirm) {
        this.confirmDialog.querySelector('.confirm-message').textContent = message;
        this.onConfirm = onConfirm;
        this.confirmDialog.style.display = 'flex';
    }

    hideConfirm() {
        this.confirmDialog.style.display = 'none';
        this.onConfirm = null;
    }
}

// Initialize notification system
const notifications = new NotificationSystem();

// API Functions
const API = {
    async addAddress(data) {
        try {
            const response = await fetch('/users/adr/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return response.json();
        } catch (error) {
            throw new Error('Network error while adding address');
        }
    },

    async updateAddress(id, data) {
        try {
            const response = await fetch(`/users/adr/addresses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return response.json();
        } catch (error) {
            throw new Error('Network error while updating address');
        }
    },

    async deleteAddress(id) {
        try {
            const response = await fetch(`/users/adr/addresses/${id}`, {
                method: 'DELETE'
            });
            return response.json();
        } catch (error) {
            throw new Error('Network error while deleting address');
        }
    },

    async setPrimaryAddress(id) {
        try {
            const response = await fetch(`/users/adr/addresses/${id}/primary`, {
                method: 'PATCH'
            });
            return response.json();
        } catch (error) {
            throw new Error('Network error while setting primary address');
        }
    }
};

// Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    // Add Address Button
    const addAddressBtn = document.getElementById('addAddressBtn');
    const createAddressForm = document.getElementById('createAddressForm');
    const createFormContainer = document.getElementById('createAddressFormContainer');
    
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', () => {
            createFormContainer.classList.add('active');
        });
    }

    // Close Create Form Button
    const closeCreateFormBtn = document.getElementById('closeCreateFormBtn');
    if (closeCreateFormBtn) {
        closeCreateFormBtn.addEventListener('click', () => {
            createFormContainer.classList.remove('active');
        });
    }

    // Create Address Form Submit
    if (createAddressForm) {
        createAddressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.isPrimary = data.isPrimary === 'on';

            try {
                const response = await API.addAddress(data);
                if (response.success) {
                    notifications.showToast('Address added successfully!', 'success');
                    createFormContainer.classList.remove('active');
                    window.location.reload();
                } else {
                    notifications.showToast(response.message || 'Failed to add address', 'error');
                }
            } catch (error) {
                notifications.showToast('An error occurred while adding the address', 'error');
                console.error('Error:', error);
            }
        });
    }

    // Address Grid Event Delegation
    const addressGrid = document.getElementById('addressGrid');
    if (addressGrid) {
        addressGrid.addEventListener('click', async (e) => {
            const target = e.target;
            const card = target.closest('.address-card');
            if (!card) return;
            const id = card.dataset.id;

            if (target.classList.contains('delete-address')) {
                notifications.confirm('Are you sure you want to delete this address?', async () => {
                    try {
                        const response = await API.deleteAddress(id);
                        if (response.success) {
                            notifications.showToast('Address deleted successfully', 'success');
                            window.location.reload();
                        } else {
                            notifications.showToast(response.message || 'Failed to delete address', 'error');
                        }
                    } catch (error) {
                        notifications.showToast('An error occurred while deleting the address', 'error');
                        console.error('Error:', error);
                    }
                });
            }

            if (target.classList.contains('edit-address')) {
                const editFormContainer = document.getElementById('editAddressFormContainer');
                const editForm = document.getElementById('editAddressForm');
                
                const address = {
                    id: id,
                    street: card.querySelector('p:nth-child(1)').textContent,
                    city: card.querySelector('p:nth-child(2)').textContent.split(',')[0].trim(),
                    state: card.querySelector('p:nth-child(2)').textContent.split(',')[1].trim(),
                    postalCode: card.querySelector('p:nth-child(2)').textContent.split(' ')[2].trim(),
                    country: card.querySelector('p:nth-child(3)').textContent,
                    isPrimary: card.classList.contains('default')
                };

                editForm.id.value = address.id;
                editForm.street.value = address.street;
                editForm.city.value = address.city;
                editForm.state.value = address.state;
                editForm.postalCode.value = address.postalCode;
                editForm.country.value = address.country;
                editForm.isPrimary.checked = address.isPrimary;

                editFormContainer.classList.add('active');
            }

            if (target.classList.contains('set-default')) {
                try {
                    const response = await API.setPrimaryAddress(id);
                    if (response.success) {
                        notifications.showToast('Primary address updated successfully', 'success');
                        window.location.reload();
                    } else {
                        notifications.showToast(response.message || 'Failed to update primary address', 'error');
                    }
                } catch (error) {
                    notifications.showToast('An error occurred while updating primary address', 'error');
                    console.error('Error:', error);
                }
            }
        });
    }

    // Edit Form Event Handlers
    const editFormContainer = document.getElementById('editAddressFormContainer');
    const editForm = document.getElementById('editAddressForm');
    const closeEditFormBtn = document.getElementById('closeEditFormBtn');
    const cancelEditFormBtn = document.getElementById('cancelEditFormBtn');

    if (closeEditFormBtn) {
        closeEditFormBtn.addEventListener('click', () => {
            editFormContainer.classList.remove('active');
        });
    }

    if (cancelEditFormBtn) {
        cancelEditFormBtn.addEventListener('click', () => {
            editFormContainer.classList.remove('active');
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.isPrimary = data.isPrimary === 'on';

            try {
                const response = await API.updateAddress(data.id, data);
                if (response.success) {
                    notifications.showToast('Address updated successfully', 'success');
                    editFormContainer.classList.remove('active');
                    window.location.reload();
                } else {
                    notifications.showToast(response.message || 'Failed to update address', 'error');
                }
            } catch (error) {
                notifications.showToast('An error occurred while updating the address', 'error');
                console.error('Error:', error);
            }
        });
    }
});