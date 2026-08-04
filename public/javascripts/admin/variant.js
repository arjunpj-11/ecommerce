
class addVariantImageManager {
    constructor(variantId) {
        this.variantId = variantId;
        this.images = [null, null, null];
        this.imageTypes = [null, null, null]; // 'url' or 'base64'
        this.selectedIndex = 0;
        this.editingIndex = null;
        this.cropper = null;
        this.maxImages = 10;
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.miniBoxesContainer = document.getElementById(`add-miniBoxes_${this.variantId}`);
        this.previewContainer = document.getElementById(`add-previewContainer_${this.variantId}`);
        this.editModal = document.getElementById(`add-editModal_${this.variantId}`);
        this.uploadForm = document.getElementById(`add-uploadForm_${this.variantId}`);
        this.imageInput = document.getElementById(`add-imageInput_${this.variantId}`);
        this.cropContainer = document.getElementById(`add-cropContainer_${this.variantId}`);
        this.cropArea = document.getElementById(`add-cropArea_${this.variantId}`);
        this.cropPreview = document.getElementById(`add-cropPreview_${this.variantId}`);
        this.previewMini = document.getElementById(`add-previewMini_${this.variantId}`);
        this.previewLarge = document.getElementById(`add-previewLarge_${this.variantId}`);
    }

    initEventListeners() {
        if (this.editModal) {
            document.getElementById(`add-modalClose_${this.variantId}`).addEventListener('click', () => this.closeModal());
            document.getElementById(`add-cancelBtn_${this.variantId}`).addEventListener('click', () => this.closeModal());
        }
        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        }
        if (this.uploadForm) {
            this.uploadForm.addEventListener('submit', (e) => this.handleSave(e));
        }
    }

    setImage(index, image, type = 'url') {
        this.images[index] = image;
        this.imageTypes[index] = type;
    }

    renderMiniBoxes() {
        if (!this.miniBoxesContainer) return;
        
        this.miniBoxesContainer.innerHTML = '';
        
        this.images.forEach((img, index) => {
            const box = document.createElement('div');
            box.className = 'add-mini-box';
            
            if (img) {
                box.innerHTML = `
                    <img src="${img}" alt="Image ${index + 1}">
                    <div class="add-overlay">
                        <button type="button" data-action="edit">✎</button>
                        <button type="button" data-action="delete">🗑</button>
                    </div>
                `;
                box.addEventListener('click', () => this.selectImage(index));
                
                const editBtn = box.querySelector('[data-action="edit"]');
                const deleteBtn = box.querySelector('[data-action="delete"]');
                
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openEditModal(index);
                });
                
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteImage(index);
                });
            } else {
                box.innerHTML = `
                    <button class="add-remove-empty-box" data-action="remove-empty">−</button>
                    <div class="add-empty-box">+</div>
                `;
                
                const removeBtn = box.querySelector('[data-action="remove-empty"]');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeEmptyBox(index);
                });
                
                box.addEventListener('click', () => this.openEditModal(index));
            }
            
            this.miniBoxesContainer.appendChild(box);
        });

        if (this.images.length < this.maxImages) {
            const addBox = document.createElement('div');
            addBox.className = 'add-add-box';
            addBox.innerHTML = '+';
            addBox.addEventListener('click', () => this.addNewBox());
            this.miniBoxesContainer.appendChild(addBox);
        }
    }

    removeEmptyBox(index) {
        if (this.images.length > 1) {
            this.images.splice(index, 1);
            this.imageTypes.splice(index, 1);
            if (this.selectedIndex >= index) {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            }
            this.renderMiniBoxes();
            this.updatePreview();
        }
    }

    selectImage(index) {
        if (this.images[index]) {
            this.selectedIndex = index;
            this.updatePreview();
        }
    }

    updatePreview() {
        if (!this.previewContainer) return;
        
        const img = this.images[this.selectedIndex];
        if (img) {
            this.previewContainer.innerHTML = `<img src="${img}" alt="Selected image">`;
        } else {
            this.previewContainer.innerHTML = '<div class="add-empty-box">No image selected</div>';
        }
    }

    openEditModal(index) {
        this.createModalIfNeeded();
        this.editingIndex = index;
        this.editModal.classList.add('active');
        this.imageInput.value = '';
        this.cropPreview.style.display = 'none';
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }

    createModalIfNeeded() {
        if (!this.editModal) {
            const template = document.getElementById('add-editModalTemplate').content.cloneNode(true);
            const modal = template.querySelector('.add-modal');
            modal.id = `add-editModal_${this.variantId}`;
            
            const elements = modal.querySelectorAll('[id]');
            elements.forEach(el => {
                el.id = `${el.id}_${this.variantId}`;
            });
            
            document.body.appendChild(modal);
            this.initElements();
            this.initEventListeners();
        }
    }

    closeModal() {
        if (this.editModal) {
            this.editModal.classList.remove('active');
            if (this.cropper) {
                this.cropper.destroy();
                this.cropper = null;
            }
        }
    }

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.cropArea.innerHTML = `<img src="${e.target.result}" id="add-cropImage_${this.variantId}">`;
                const image = document.getElementById(`add-cropImage_${this.variantId}`);
                
                if (this.cropper) {
                    this.cropper.destroy();
                }
                
                this.cropper = new Cropper(image, {
                    aspectRatio: 5/7,
                    viewMode: 1,
                    crop: () => this.updateCropPreview()
                });
            };
            reader.readAsDataURL(file);
        }
    }

    updateCropPreview() {
        if (!this.cropper) return;
        
        const canvas = this.cropper.getCroppedCanvas();
        const croppedDataUrl = canvas.toDataURL('image/jpeg');
        
        this.cropPreview.style.display = 'flex';
        this.previewMini.src = croppedDataUrl;
        this.previewLarge.src = croppedDataUrl;
    }

    handleSave(e) {
        e.preventDefault();
        if (this.cropper) {
            const canvas = this.cropper.getCroppedCanvas();
            const croppedDataUrl = canvas.toDataURL('image/jpeg');
            this.setImage(this.editingIndex, croppedDataUrl, 'base64');
            this.selectedIndex = this.editingIndex;
            this.renderMiniBoxes();
            this.updatePreview();
            this.closeModal();
        }
    }

    deleteImage(index) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.images[index] = null;
                this.imageTypes[index] = null;
                if (this.selectedIndex === index) {
                    this.selectedIndex = this.images.findIndex(img => img !== null);
                    if (this.selectedIndex === -1) this.selectedIndex = 0;
                }
                this.renderMiniBoxes();
                this.updatePreview();
                Swal.fire('Deleted!', 'Your image has been deleted.', 'success');
            }
        });
    }

    addNewBox() {
        if (this.images.length < this.maxImages) {
            this.images.push(null);
            this.imageTypes.push(null);
            this.renderMiniBoxes();
        }
    }

    getImagesForSubmission() {
        return this.images.map((img, index) => {
            if (!img) return null;
            return {
                url: img,
                type: this.imageTypes[index]
            };
        }).filter(img => img !== null);
    }
}

class addProductManager {
    constructor() {
        this.variants = [];
        this.sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        this.variantManagers = new Map();
        this.initVariants();
        this.createColorPickerModal();
        this.fetchVariants();
    }

    fetchVariants() {
        fetch('/admin/variant/variants')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                this.variants = [];
                this.variantManagers.clear();

                data.forEach(variantData => {
                    const variantId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    
                    const sizes = this.sizes.map(size => ({
                        size,
                        stock: variantData.sizes?.[size] || 0
                    }));

                    const variant = {
                        id: variantId,
                        _id: variantData._id || null,
                        color: variantData.color,
                        sizes: sizes,
                        tags: variantData.tags || []
                    };

                    this.variants.push(variant);

                    const imageManager = new addVariantImageManager(variantId);
                    
                    if (variantData.images && Array.isArray(variantData.images)) {
                        imageManager.images = new Array(Math.max(variantData.images.length, 3)).fill(null);
                        variantData.images.forEach((img, index) => {
                            imageManager.setImage(index, img, 'url');
                        });
                    }

                    this.variantManagers.set(variantId, imageManager);
                });

                this.renderVariants();

                this.variants.forEach(variant => {
                    const manager = this.variantManagers.get(variant.id);
                    if (manager) {
                        manager.initElements();
                        manager.renderMiniBoxes();
                        manager.updatePreview();
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching variants:', error);
                Swal.fire('Error', 'Failed to load variants. Please refresh the page.', 'error');
            });
    }

    saveVariant(variantId) {
        const variant = this.variants.find(v => v.id === variantId);
        if (!variant) {
            console.error('Variant not found:', variantId);
            return;
        }

        // Get the image manager for this variant
        const variantManager = this.variantManagers.get(variantId);
        if (!variantManager) {
            console.error('Variant manager not found:', variantId);
            return;
        }

        // Prepare the size data
        const sizeData = {};
        variant.sizes.forEach(size => {
            sizeData[size.size] = parseInt(size.stock) || 0;
        });

        // Get processed images from the variant manager
        const images = variantManager.getImagesForSubmission();

        // Prepare the request data
        const data = {
            color: variant.color,
            images: images.map(img => ({
                url: img.url,
                type: img.type
            })),
            sizes: sizeData,
            tags: variant.tags || []
        };

        // Add CSRF protection if your server requires it
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }

        // Determine if it's a new variant or existing one
        const url = variant._id 
            ? `/admin/variant/${variant._id}` 
            : '/admin/variant';
        const method = variant._id ? 'PATCH' : 'POST';

        // Show loading state
        const saveButton = document.querySelector(`#add-variant_${variantId} .add-save-variant`);
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
        }

        fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(data),
            credentials: 'same-origin' // Include cookies for session-based auth
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            if (!variant._id) {
                // If it was a new variant, store the returned ID
                variant._id = responseData._id;
            }
            Swal.fire('Success', 'Variant saved successfully!', 'success');
        })
        .catch(error => {
            console.error('Error saving variant:', error);
            Swal.fire('Error', `Failed to save variant: ${error.message}`, 'error');
        })
        .finally(() => {
            // Reset button state
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Save';
            }
        });
    }
    
    createColorPickerModal() {
        const modal = document.createElement('div');
        modal.className = 'add-modal';
        modal.id = 'add-colorPickerModal';
        
        modal.innerHTML = `
            <div class="add-modal-content" style="max-width: 400px;">
                <div class="add-modal-header">
                    <h2>Choose Color</h2>
                    <button type="button" class="add-modal-close" id="add-closeColorPicker">×</button>
                </div>
                <div class="add-form-group">
                    <label>Color</label>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <input type="color" id="add-colorPicker" class="add-form-control" style="width: 100px; height: 40px; padding: 0;">
                        <input type="text" id="add-hexInput" class="add-form-control" placeholder="#000000" style="flex: 1;">
                    </div>
                </div>
                <div style="margin: 1rem 0;">
                    <label>RGBA Values</label>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
                        <div>
                            <label style="font-size: 12px;">R</label>
                            <input type="number" id="add-redInput" class="add-form-control" min="0" max="255">
                        </div>
                        <div>
                            <label style="font-size: 12px;">G</label>
                            <input type="number" id="add-greenInput" class="add-form-control" min="0" max="255">
                        </div>
                        <div>
                            <label style="font-size: 12px;">B</label>
                            <input type="number" id="add-blueInput" class="add-form-control" min="0" max="255">
                        </div>
                        <div>
                            <label style="font-size: 12px;">A</label>
                            <input type="number" id="add-alphaInput" class="add-form-control" min="0" max="1" step="0.1">
                        </div>
                    </div>
                </div>
                <div class="add-button-group">
                    <button type="button" class="add-btn add-btn-secondary" id="add-cancelColorPicker">Cancel</button>
                    <button type="button" class="add-btn add-btn-primary" id="add-saveColor">Save</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.initColorPickerEvents();
    }

    initColorPickerEvents() {
        const modal = document.getElementById('add-colorPickerModal');
        const colorPicker = document.getElementById('add-colorPicker');
        const hexInput = document.getElementById('add-hexInput');
        const rgbaInputs = {
            red: document.getElementById('add-redInput'),
            green: document.getElementById('add-greenInput'),
            blue: document.getElementById('add-blueInput'),
            alpha: document.getElementById('add-alphaInput')
        };

        document.getElementById('add-closeColorPicker').onclick = () => modal.classList.remove('active');
        document.getElementById('add-cancelColorPicker').onclick = () => modal.classList.remove('active');

        colorPicker.addEventListener('input', (e) => {
            const hex = e.target.value;
            hexInput.value = hex;
            this.updateRGBAFromHex(hex);
        });

        hexInput.addEventListener('input', (e) => {
            let hex = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                colorPicker.value = hex;
                this.updateRGBAFromHex(hex);
            }
        });

        Object.entries(rgbaInputs).forEach(([key, input]) => {
            input.addEventListener('input', () => {
                const rgba = {
                    red: parseInt(rgbaInputs.red.value) || 0,
                    green: parseInt(rgbaInputs.green.value) || 0,
                    blue: parseInt(rgbaInputs.blue.value) || 0,
                    alpha: parseFloat(rgbaInputs.alpha.value) || 1
                };
                const hex = this.rgbaToHex(rgba);
                colorPicker.value = hex;
                hexInput.value = hex;
            });
        });

        document.getElementById('add-saveColor').onclick = () => {
            const hex = hexInput.value;
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                this.createVariant(hex);
                modal.classList.remove('active');
            } else {
                Swal.fire('Error', 'Please enter a valid color', 'error');
            }
        };
    }

    rgbaToHex({ red, green, blue }) {
        const toHex = (n) => {
            const hex = Math.max(0, Math.min(255, n)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
    }

    updateRGBAFromHex(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            document.getElementById('add-redInput').value = parseInt(result[1], 16);
            document.getElementById('add-greenInput').value = parseInt(result[2], 16);
            document.getElementById('add-blueInput').value = parseInt(result[3], 16);
            document.getElementById('add-alphaInput').value = 1;
        }
    }

    initVariants() {
        document.getElementById('add-addVariant').addEventListener('click', () => {
            document.getElementById('add-colorPickerModal').classList.add('active');
        });
        this.renderVariants();
    }

    createVariant(colorCode) {
        const variantId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const variant = {
            id: variantId,
            color: colorCode,
            sizes: this.sizes.map(size => ({
                size,
                stock: 0
            })),
            tags: []
        };
        
        this.variants.push(variant);
        this.variantManagers.set(variantId, new addVariantImageManager(variantId));
        this.renderVariants();
    }

    addTag(variantId, tag) {
        const variant = this.variants.find(v => v.id === variantId);
        if (variant && tag && !variant.tags.includes(tag)) {
            variant.tags.push(tag);
            this.renderVariants();
        }
    }

    removeTag(variantId, tagIndex) {
        const variant = this.variants.find(v => v.id === variantId);
        if (variant && variant.tags) {
            variant.tags.splice(tagIndex, 1);
            this.renderVariants();
        }
    }

    removeVariant(variantId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.variants = this.variants.filter(v => v.id !== variantId);
                this.variantManagers.delete(variantId);
                this.renderVariants();
                Swal.fire('Deleted!', 'Your variant has been deleted.', 'success');
            }
        });
    }

    updateStock(variantId, sizeIndex, value) {
        const variant = this.variants.find(v => v.id === variantId);
        if (variant) {
            variant.sizes[sizeIndex].stock = parseInt(value) || 0;
        }
    }

    renderVariants() {
        const container = document.getElementById('add-variantsContainer');
        container.innerHTML = this.variants.map(variant => `
            <tr><td><div class="add-variant-color" id="add-variant_${variant.id}">
                <input type="hidden" name="variantId" value="${variant._id || ''}" />
                <div class="add-color-header">
                    <div class="add-color-preview" style="background-color: ${variant.color}"></div>
                    <span>Color: ${variant.color}</span>
                    <button type="button" class="add-save-variant" onclick="productManager.saveVariant('${variant.id}')">Save</button>
                    <button type="button" class="add-remove-variant" onclick="productManager.removeVariant('${variant.id}')">Remove</button>
                </div>
                <div class="add-variant-content">
                    <div class="add-variant-images">
                        <div class="add-upload-container">
                            <div class="add-mini-boxes" id="add-miniBoxes_${variant.id}"></div>
                            <div class="add-preview-container" id="add-previewContainer_${variant.id}">
                                <div class="add-empty-box">No image selected</div>
                            </div>
                        </div>
                    </div>
                    <div class="add-variant-sizes">
                        <div class="add-sizes-grid">
                            ${variant.sizes.map((sizeData, sizeIndex) => `
                                <div class="add-size-box">
                                    <label>${sizeData.size}</label>
                                    <input type="number" 
                                           value="${sizeData.stock}"
                                           min="0"
                                           onchange="productManager.updateStock('${variant.id}', ${sizeIndex}, this.value)"
                                           placeholder="Stock count">
                                </div>
                            `).join('')}
                        </div>
                        <div class="add-tags-section">
                            <h4>Tags</h4>
                            <div class="add-tags-container">
                                ${(variant.tags || []).map((tag, index) => `
                                    <span class="add-tag">
                                        ${tag}
                                        <button onclick="productManager.removeTag('${variant.id}', ${index})">&times;</button>
                                    </span>
                                `).join('')}
                            </div>
                            <div class="add-add-tag-form">
                                <input type="text" 
                                       class="add-tag-input" 
                                       placeholder="Add a tag"
                                       onkeypress="if(event.key === 'Enter') { 
                                           event.preventDefault();
                                           productManager.addTag('${variant.id}', this.value); 
                                           this.value = ''; 
                                       }">
                                <button onclick="
                                    const input = this.previousElementSibling;
                                    productManager.addTag('${variant.id}', input.value);
                                    input.value = '';
                                ">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div></td></tr>
        `).join('');

        this.variants.forEach(variant => {
            const manager = this.variantManagers.get(variant.id);
            if (manager) {
                manager.initElements();
                manager.renderMiniBoxes();
            }
        });
    }
}

// Initialize the product manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new addProductManager();
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