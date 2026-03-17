// DOM Elements
const hamburgerMenu = document.getElementById('hamburger-menu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const mainContent = document.querySelector('.main-content');
const loader = document.querySelector('.loader');
const container = document.querySelector('.container');

// Global catModal object
const catModal = {
    cropper: null,
    isSubmitting: false,
    elements: {
        overlay: document.getElementById('catModalOverlay'),
        modalOverlay5: document.getElementById('catModalOverlay5'),
        form: document.getElementById('catCreateForm'),
        imageInput: document.getElementById('catImageInput'),
        cropImage: document.getElementById('catCropImage'),
        croppedData: document.getElementById('catCroppedData'),
        nameInput: document.querySelector('#catModalOverlay5 #Name'),
        previewContainer: document.querySelector('.cat-crop__preview')
    },

    open() {
        if (this.elements.overlay) {
            this.elements.overlay.classList.add('cat-modal__overlay--active');
        }
    },

    close() {
        if (this.elements.modalOverlay5) {
            this.elements.modalOverlay5.classList.add('active');
        }
        this.resetForm();
    },

    resetForm() {
        // Destroy cropper instance if it exists
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        
        // Reset image preview
        if (this.elements.cropImage) {
            this.elements.cropImage.style.display = 'none';
            this.elements.cropImage.src = '';
        }
        
        // Clear file input
        if (this.elements.imageInput) {
            this.elements.imageInput.value = '';
        }
        
        // Clear name input
        if (this.elements.nameInput) {
            this.elements.nameInput.value = '';
        }

        // Clear preview container
        if (this.elements.previewContainer) {
            this.elements.previewContainer.innerHTML = '';
        }
        
        // Reset the form element
        if (this.elements.form) {
            this.elements.form.reset();
        }

        // Reset the submission flag
        this.isSubmitting = false;
    },

    init() {
        if (this.elements.imageInput) {
            this.elements.imageInput.addEventListener('change', this.handleImageSelect.bind(this));
        }
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Add event listeners for cancel and close buttons
        const cancelBtn = document.querySelector('.cat-btn--cancel');
        const closeBtn = document.querySelector('.cat-modal__close-btn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    },

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File',
                text: 'Please select an image file'
            });
            this.elements.imageInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (this.elements.cropImage) {
                this.elements.cropImage.src = e.target.result;
                this.elements.cropImage.style.display = 'block';

                if (this.cropper) this.cropper.destroy();

                this.cropper = new Cropper(this.elements.cropImage, {
                    aspectRatio: 1,
                    viewMode: 2,
                    preview: '.cat-crop__preview',
                    responsive: true,
                    autoCropArea: 0.8,
                    cropBoxResizable: true,
                    zoomable: true
                });
            }
        };
        reader.readAsDataURL(file);
    },

    async handleSubmit(e) {
        e.preventDefault();

        if (this.isSubmitting) {
            return;
        }

        if (!this.cropper) {
            Swal.fire({
                icon: 'warning',
                title: 'No Image Selected',
                text: 'Please select and crop an image'
            });
            return;
        }

        const categoryName = this.elements.nameInput?.value;
        if (!categoryName) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please enter a category name'
            });
            return;
        }

        try {
            this.isSubmitting = true;
            
            if (loader) loader.classList.remove('active');
            if (container) container.classList.add('active');

            const canvas = this.cropper.getCroppedCanvas();
            if (!canvas) {
                throw new Error('Failed to crop image');
            }

            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const payload = {
                name: categoryName,
                croppedImage: croppedDataUrl
            };

            const response = await fetch('/admin/subcategories/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.text();

            if (result === 'done') {
                await fetchTableData();
                this.close(); // This will also reset the form
                
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Category created successfully!'
                });
            } else if (result === 'exists') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Category name already exists'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result
                });
            }
        } catch (error) {
            console.error('Error creating category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error creating category. Please try again.'
            });
        } finally {
            if (loader) loader.classList.add('active');
            if (container) container.classList.remove('active');
            this.isSubmitting = false;
        }
    }
};

// Sidebar toggle functionality
hamburgerMenu?.addEventListener('click', () => {
    sidebar?.classList.toggle('sidebar-visible');
    overlay?.classList.toggle('overlay-visible');
    console.log("Hamburger clicked, sidebar visible:", sidebar?.classList.contains('sidebar-visible'));
});

// Close sidebar when clicking on overlay
overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('sidebar-visible');
    overlay?.classList.remove('overlay-visible');
    console.log("Overlay clicked, sidebar closed");
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!sidebar?.contains(e.target) && !hamburgerMenu?.contains(e.target) && !e.target.closest('.cat-modal__container')) {
            sidebar?.classList.remove('sidebar-visible');
            overlay?.classList.remove('overlay-visible');
        }
    }
});

// Reset sidebar on window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        sidebar?.classList.remove('sidebar-visible');
        overlay?.classList.remove('overlay-visible');
    }
});

// Close sidebar when clicking on a nav link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function() {
        console.log("Nav link clicked");
        sidebar?.classList.remove('sidebar-visible');
        overlay?.classList.remove('overlay-visible');
    });
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    await fetchTableData();
    attachEventListeners();
});

// Attach all event listeners
function attachEventListeners() {
    // Add Offer Button Logic
    document.querySelectorAll('.add-offer').forEach((btn) => {
        btn.addEventListener('click', () => {
            const parentRow = btn.closest('tr');
            const offerForm = parentRow?.querySelector('.add-offer-container');
            if (offerForm) {
                offerForm.classList.remove('active');
                btn.classList.add('active');
            }
        });
    });

    // Close Offer Form Logic
    document.querySelectorAll('.add-offer-close-btn').forEach((closeBtn) => {
        closeBtn.addEventListener('click', () => {
            const offerForm = closeBtn.closest('.add-offer-container');
            if (offerForm) {
                offerForm.classList.add('active');
            }
            const parentRow = closeBtn.closest('tr');
            const offerBtn = parentRow?.querySelector('.add-offer');
            if (offerBtn) {
                offerBtn.classList.remove('active');
            }
        });
    });

    // Submit Offer Form Logic
    document.querySelectorAll('.add-offer-form').forEach((form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const offerValue = form.querySelector('#add-offer-input')?.value;
            const id = form.querySelector('#myHiddenInput')?.value;

            if (!offerValue || !id) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Missing required fields'
                });
                return;
            }

            const formContent = { offer: offerValue, Id: id };

            try {
                const response = await fetch('/admin/subCategories/Offer', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formContent)
                });

                if (!response.ok) {
                    throw new Error(`Network error: ${response.statusText}`);
                }

                await fetchTableData();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Offer submitted successfully!'
                });
            } catch (error) {
                console.error('Form submission error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to submit offer. Please try again.'
                });
            }
        });
    });

    // Search Functionality
    const search = document.getElementById('searchBar');
    search?.addEventListener('input', async () => {
        const searchValue = search.value;

        try {
            const response = await fetch(`/admin/subCategories/search?value=${encodeURIComponent(searchValue)}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const html = await response.text();
            const tbody = document.getElementById('tbody');
            if (tbody) {
                tbody.innerHTML = html;
                attachEventListeners(); // Reattach event listeners after updating table
            }
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to perform search. Please try again.'
            });
        }
    });

    // Initialize category modal
    catModal.init();

    // Add Category Modal Button Logic
    const addCategoryBtn = document.querySelector('.add-category-btn');
    const addForm = document.querySelector('#catModalOverlay5');
    const form = document.querySelector('#catCreateForm');
    const cancelBtn = document.querySelector('.cat-btn--cancel');
    const closeBtn = document.querySelector('.cat-modal__close-btn');

    addCategoryBtn?.addEventListener('click', () => {
        addForm?.classList.remove('active');
    });

    cancelBtn?.addEventListener('click', () => {
        addForm?.classList.add('active');
        form?.reset();
    });

    closeBtn?.addEventListener('click', () => {
        addForm?.classList.add('active');
        form?.reset();
    });

    // Edit Button Logic
    document.querySelectorAll('.edit').forEach((btn) => {
        btn.addEventListener('click', () => {
            const editForm = btn.closest('td')?.querySelector('.edt-modal__overlay');
            const form = btn.closest('td')?.querySelector('#edtCreateForm');
            
            if (editForm && form) {
                editForm.classList.remove('active');
                initializeEditForm(form, btn);
            }
        });
    });

    // Edit Modal Close Buttons
    document.querySelectorAll('.edt-modal__close-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const overlay = btn.closest('td')?.querySelector('.edt-modal__overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        });
    });

    document.querySelectorAll('.edt-btn--cancel').forEach((btn) => {
        btn.addEventListener('click', () => {
            const overlay = btn.closest('td')?.querySelector('.edt-modal__overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        });
    });

    // Inactivate Button Logic
    document.querySelectorAll('.makeInactive').forEach((btn) => {
        btn.addEventListener('click', async () => {
            try {
                const result = await Swal.fire({
                    title: 'Are you sure?',
                    text: 'Do you want to inactivate this main category?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, inactivate it!',
                    cancelButtonText: 'No, cancel!'
                });

                if (!result.isConfirmed) return;

                const id = btn.closest('tr')?.querySelector('.id')?.value;
                if (!id) {
                    throw new Error('Category ID not found');
                }

                const response = await fetch('/admin/subcategories/inactivate', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                if (!response.ok) {
                    throw new Error(`Network error: ${response.statusText}`);
                }

                await fetchTableData();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Category inactivated successfully!'
                });
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to inactivate the category. Please try again.'
                });
            }
        });
    });

    // Activate Button Logic
    document.querySelectorAll('.makeActive').forEach((btn) => {
        btn.addEventListener('click', async () => {
            try {
                const result = await Swal.fire({
                    title: 'Are you sure?',
                    text: 'Do you want to activate this main category?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, activate it!',
                    cancelButtonText: 'No, cancel!'
                });

                if (!result.isConfirmed) return;

                const id = btn.closest('tr')?.querySelector('.id')?.value;
                if (!id) {
                    throw new Error('Category ID not found');
                }

                const response = await fetch('/admin/subcategories/activate', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                if (!response.ok) {
                    throw new Error(`Network error: ${response.statusText}`);
                }

                await fetchTableData();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Category activated successfully!'
                });
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to activate the category. Please try again.'
                });
            }
        });
    });

    // Permanent Delete Logic
    document.querySelectorAll('.permanentDelete').forEach((btn) => {
        btn.addEventListener('click', async () => {
            try {
                const result = await Swal.fire({
                    title: 'Are you sure?',
                    text: 'This will permanently delete the main category.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, delete it!',
                    cancelButtonText: 'No, cancel!',
                    footer: 'This action will delete all products in this category'
                });

                if (!result.isConfirmed) return;

                const secondResult = await Swal.fire({
                    title: 'Final Confirmation',
                    text: 'All products in this category will be deleted. This action cannot be undone!',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, proceed!',
                    cancelButtonText: 'No, cancel!',
                    confirmButtonColor: '#d33'
                });

                if (!secondResult.isConfirmed) return;

                const id = btn.closest('tr')?.querySelector('.id')?.value;
                if (!id) {
                    throw new Error('Category ID not found');
                }

                const response = await fetch('/admin/subCategories/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                if (!response.ok) {
                    throw new Error(`Network error: ${response.statusText}`);
                }

                await fetchTableData();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Category deleted successfully!'
                });
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete the category. Please try again.'
                });
            }
        });
    });
}

// Edit Form initialization function
function initializeEditForm(form, btn) {
    const imageInput = form.querySelector('#edtImageInput');
    const cropImage = form.querySelector('#edtCropImage');
    const editOverlay = btn.closest('td')?.querySelector('.edt-modal__overlay');
    let cropper = null;
    let isSubmitting = false; // Add submission state tracking

    function closeEditForm() {
        if (editOverlay) {
            editOverlay.classList.add('active');
            if (cropper) {
                cropper.destroy();
                if (cropImage) {
                    cropImage.style.display = 'none';
                }
                cropper = null;
            }
            form.reset();
            isSubmitting = false; // Reset submission state
        }
    }

    // Clear any existing event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    form = newForm;

    const newImageInput = form.querySelector('#edtImageInput');
    if (newImageInput) {
        newImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File',
                    text: 'Please select an image file'
                });
                newImageInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const newCropImage = form.querySelector('#edtCropImage');
                if (newCropImage) {
                    newCropImage.src = e.target.result;
                    newCropImage.style.display = 'block';

                    if (cropper) cropper.destroy();

                    cropper = new Cropper(newCropImage, {
                        aspectRatio: 1,
                        viewMode: 2,
                        preview: form.querySelector('.edt-crop__preview'),
                        responsive: true,
                        autoCropArea: 0.8,
                        cropBoxResizable: true,
                        zoomable: true
                    });
                }
            };
            reader.readAsDataURL(file);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }
        
        isSubmitting = true;
        let payload = {};
        const categoryName = form.querySelector('#Name')?.value;
        const categoryId = form.querySelector('#Id')?.value;

        if (!categoryName) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please enter a category name'
            });
            isSubmitting = false;
            return;
        }

        try {
            if (cropper) {
                const canvas = cropper.getCroppedCanvas();
                if (canvas) {
                    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    payload = {
                        id: categoryId,
                        name: categoryName,
                        croppedImage: croppedDataUrl
                    };
                }
            } else {
                payload = {
                    id: categoryId,
                    name: categoryName
                };
            }

            if (loader) loader.classList.remove('active');
            if (container) container.classList.add('active');

            const response = await fetch('/admin/subCategories/edit', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.text();
            
            if (result === 'done') {
                await fetchTableData();
                closeEditForm();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Category updated successfully!'
                });
            } else if(result === 'exists') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Category name already exists'
                });
                isSubmitting = false; // Reset submission state on error
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result
                });
                isSubmitting = false; // Reset submission state on error
            }
        } catch (error) {
            console.error('Error updating category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update category. Please try again.'
            });
            isSubmitting = false; // Reset submission state on error
        } finally {
            if (loader) loader.classList.add('active');
            if (container) container.classList.remove('active');
        }
    });
}

// Function to fetch and update table data
async function fetchTableData() {
    try {
        const response = await fetch('/admin/subCategories/table', {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const html = await response.text();
        const tbody = document.getElementById('tbody');
        if (tbody) {
            tbody.innerHTML = html;
            attachEventListeners(); // Reattach event listeners after re-rendering
        } else {
            console.error('tbody element not found');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update table data. Please refresh the page.'
        });
    }
}