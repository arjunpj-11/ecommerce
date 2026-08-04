// variantImageManager.js
class VariantImageManager {
    constructor(variantId) {
        this.variantId = variantId;
        this.images = [null, null, null];  // Initialize with 3 empty slots for required images
        this.selectedIndex = 0;
        this.editingIndex = null;
        this.cropper = null;
        this.maxImages = 10;
        this.initElements();
        this.initEventListeners();
        this.renderMiniBoxes();
    }

    initElements() {
        this.miniBoxesContainer = document.getElementById(`miniBoxes_${this.variantId}`);
        this.previewContainer = document.getElementById(`previewContainer_${this.variantId}`);
        this.editModal = document.getElementById(`editModal_${this.variantId}`);
        this.uploadForm = document.getElementById(`uploadForm_${this.variantId}`);
        this.imageInput = document.getElementById(`imageInput_${this.variantId}`);
        this.cropContainer = document.getElementById(`cropContainer_${this.variantId}`);
        this.cropArea = document.getElementById(`cropArea_${this.variantId}`);
        this.cropPreview = document.getElementById(`cropPreview_${this.variantId}`);
        this.previewMini = document.getElementById(`previewMini_${this.variantId}`);
        this.previewLarge = document.getElementById(`previewLarge_${this.variantId}`);
    }

    initEventListeners() {
        if (this.editModal) {
            document.getElementById(`modalClose_${this.variantId}`).addEventListener('click', () => this.closeModal());
            document.getElementById(`cancelBtn_${this.variantId}`).addEventListener('click', () => this.closeModal());
        }
        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        }
        if (this.uploadForm) {
            this.uploadForm.addEventListener('submit', (e) => this.handleSave(e));
        }
    }

    renderMiniBoxes() {
        if (!this.miniBoxesContainer) return;
        
        this.miniBoxesContainer.innerHTML = '';
        
        this.images.forEach((img, index) => {
            const box = document.createElement('div');
            box.className = 'mini-box';
            
            if (img) {
                box.innerHTML = `
                    <img src="${img}" alt="Image ${index + 1}">
                    <div class="overlay">
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
                    <button class="remove-empty-box" data-action="remove-empty">−</button>
                    <div class="empty-box">+</div>
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
            addBox.className = 'add-box';
            addBox.innerHTML = '+';
            addBox.addEventListener('click', () => this.addNewBox());
            this.miniBoxesContainer.appendChild(addBox);
        }
    }

    removeEmptyBox(index) {
        if (this.images.length > 1) {
            this.images.splice(index, 1);
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
            this.previewContainer.innerHTML = '<div class="empty-box">No image selected</div>';
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
            const template = document.getElementById('editModalTemplate').content.cloneNode(true);
            const modal = template.querySelector('.modal');
            modal.id = `editModal_${this.variantId}`;
            
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
                this.cropArea.innerHTML = `<img src="${e.target.result}" id="cropImage_${this.variantId}">`;
                const image = document.getElementById(`cropImage_${this.variantId}`);
                
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
            this.images[this.editingIndex] = croppedDataUrl;
            this.selectedIndex = this.editingIndex;
            this.renderMiniBoxes();
            this.updatePreview();
            this.closeModal();
        }
    }

    deleteImage(index) {
        this.images[index] = null;
        if (this.selectedIndex === index) {
            this.selectedIndex = this.images.findIndex(img => img !== null);
            if (this.selectedIndex === -1) this.selectedIndex = 0;
        }
        this.renderMiniBoxes();
        this.updatePreview();
    }

    addNewBox() {
        if (this.images.length < this.maxImages) {
            this.images.push(null);
            this.renderMiniBoxes();
        }
    }
}
// productManager.js
class ProductManager {
    constructor() {
        this.variants = [];
        this.sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        this.variantManagers = new Map();
        this.initVariants();
        this.createColorPickerModal();
        this.initFormButtons();
    }

    createColorPickerModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'colorPickerModal';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>Choose Color</h2>
                    <button type="button" class="modal-close" id="closeColorPicker">×</button>
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <input type="color" id="colorPicker" class="form-control" style="width: 100px; height: 40px; padding: 0;">
                        <input type="text" id="hexInput" class="form-control" placeholder="#000000" style="flex: 1;">
                    </div>
                </div>
                <div style="margin: 1rem 0;">
                    <label>RGBA Values</label>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
                        <div>
                            <label style="font-size: 12px;">R</label>
                            <input type="number" id="redInput" class="form-control" min="0" max="255">
                        </div>
                        <div>
                            <label style="font-size: 12px;">G</label>
                            <input type="number" id="greenInput" class="form-control" min="0" max="255">
                        </div>
                        <div>
                            <label style="font-size: 12px;">B</label>
                            <input type="number" id="blueInput" class="form-control" min="0" max="255">
                        </div>
                        <div>
                            <label style="font-size: 12px;">A</label>
                            <input type="number" id="alphaInput" class="form-control" min="0" max="1" step="0.1">
                        </div>
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="btn btn-secondary" id="cancelColorPicker">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveColor">Save</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.initColorPickerEvents();
    }

    initColorPickerEvents() {
        const modal = document.getElementById('colorPickerModal');
        const colorPicker = document.getElementById('colorPicker');
        const hexInput = document.getElementById('hexInput');
        const rgbaInputs = {
            red: document.getElementById('redInput'),
            green: document.getElementById('greenInput'),
            blue: document.getElementById('blueInput'),
            alpha: document.getElementById('alphaInput')
        };

        document.getElementById('closeColorPicker').onclick = () => modal.classList.remove('active');
        document.getElementById('cancelColorPicker').onclick = () => modal.classList.remove('active');

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

        document.getElementById('saveColor').onclick = () => {
            const hex = hexInput.value;
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                this.createVariant(hex);
                modal.classList.remove('active');
            } else {
                alert('Please enter a valid color');
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
            document.getElementById('redInput').value = parseInt(result[1], 16);
            document.getElementById('greenInput').value = parseInt(result[2], 16);
            document.getElementById('blueInput').value = parseInt(result[3], 16);
            document.getElementById('alphaInput').value = 1;
        }
    }

    initVariants() {
        document.getElementById('addVariant').addEventListener('click', () => {
            document.getElementById('colorPickerModal').classList.add('active');
        });
        this.renderVariants();
    }

    createVariant(colorCode) {
        const variantId = Date.now().toString();
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
        this.variantManagers.set(variantId, new VariantImageManager(variantId));
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
        this.variants = this.variants.filter(v => v.id !== variantId);
        this.variantManagers.delete(variantId);
        this.renderVariants();
    }

    updateStock(variantId, sizeIndex, value) {
        const variant = this.variants.find(v => v.id === variantId);
        if (variant) {
            variant.sizes[sizeIndex].stock = parseInt(value) || 0;
        }
    }

    renderVariants() {
        const container = document.getElementById('variantsContainer');
        container.innerHTML = this.variants.map(variant => `
            <div class="variant-color" id="variant_${variant.id}">
                <div class="color-header">
                    <div class="color-preview" style="background-color: ${variant.color}"></div>
                    <span>Color: ${variant.color}</span>
                    <button type="button" class="remove-variant" onclick="productManager.removeVariant('${variant.id}')">Remove</button>
                </div>
                <div class="variant-content">
                    <div class="variant-images">
                        <div class="upload-container">
                            <div class="mini-boxes" id="miniBoxes_${variant.id}"></div>
                            <div class="preview-container" id="previewContainer_${variant.id}">
                                <div class="empty-box">No image selected</div>
                            </div>
                        </div>
                    </div>
                    <div class="variant-sizes">
                        <div class="sizes-grid">
                            ${variant.sizes.map((sizeData, sizeIndex) => `
                                <div class="size-box">
                                    <label>${sizeData.size}</label>
                                    <input type="number" 
                                           value="${sizeData.stock}"
                                           min="0"
                                           onchange="productManager.updateStock('${variant.id}', ${sizeIndex}, this.value)"
                                           placeholder="Stock count">
                                </div>
                            `).join('')}
                        </div>
                        <div class="tags-section">
                            <h4>Tags</h4>
                            <div class="tags-container">
                                ${(variant.tags || []).map((tag, index) => `
                                    <span class="tag">
                                        ${tag}
                                        <button onclick="productManager.removeTag('${variant.id}', ${index})">&times;</button>
                                    </span>
                                `).join('')}
                            </div>
                            <div class="add-tag-form">
                                <input type="text" 
                                       class="tag-input" 
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
            </div>
        `).join('');

        this.variants.forEach(variant => {
            const manager = this.variantManagers.get(variant.id);
            if (manager) {
                manager.initElements();
                manager.renderMiniBoxes();
            }
        });
    }

    validateForm() {
        const errors = [];
        
        // Validate basic fields
        const name = document.getElementById('productName').value.trim();
        const description = document.getElementById('description').value.trim();
        const price = parseFloat(document.getElementById('price').value);
        const category = document.getElementById('category').value.trim();

        if (!name) errors.push("Product name is required");
        if (!description) errors.push("Product description is required");
        if (!price || price <= 0) errors.push("Valid price is required");
        if (!category) errors.push("Category is required");

        // Validate variants
        if (this.variants.length === 0) {
            errors.push("At least one color variant is required");
        } else {
            // Check each variant
            this.variants.forEach((variant, index) => {
                const variantManager = this.variantManagers.get(variant.id);
                const imageCount = variantManager.images.filter(img => img !== null).length;
                
                if (imageCount < 3) {
                    errors.push(`Color ${variant.color} requires at least 3 images (currently has ${imageCount})`);
                }

                // Check if at least one size has stock
                const hasStock = variant.sizes.some(size => size.stock > 0);
                if (!hasStock) {
                    errors.push(`Color ${variant.color} requires stock quantity for at least one size`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    showErrorMessage(errors) {
        // Remove any existing error container first
        this.clearErrorMessage();
    
        // Create the error container
        const errorContainer = document.createElement('div');
        errorContainer.id = 'formErrorContainer';
        errorContainer.className = 'error-container';
    
        // Style the container
        errorContainer.style.backgroundColor = '#ffebee';
        errorContainer.style.color = '#c62828';
        errorContainer.style.padding = '15px';
        errorContainer.style.marginBottom = '20px';
        errorContainer.style.borderRadius = '4px';
        errorContainer.style.border = '1px solid #ef9a9a';
    
        // Set the error content
        errorContainer.innerHTML = `
            <strong>Please correct the following errors:</strong>
            <ul style="margin: 10px 0 0 20px;">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
    
        // Find the main content container or the first form element
        const mainContainer = document.getElementById('main-content') || 
                             document.querySelector('.main-content') ||
                             document.querySelector('form') ||
                             document.body;
    
        // Check if we found submitForm button as a reference point
        const submitButton = document.getElementById('submitForm');
        if (submitButton && submitButton.parentNode) {
            // Insert before the parent container of the submit button
            submitButton.parentNode.insertBefore(errorContainer, submitButton.parentNode.firstChild);
        } else {
            // Fallback: insert at the beginning of main container
            mainContainer.insertBefore(errorContainer, mainContainer.firstChild);
        }
    
        // Scroll to error container
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    clearErrorMessage() {
        const errorContainer = document.getElementById('formErrorContainer');
        if (errorContainer) {
            errorContainer.remove();
        }
    }

    initFormButtons() {
        document.getElementById('submitForm').addEventListener('click', () => this.submitForm());
        document.getElementById('cancelForm').addEventListener('click', () => {
            
                window.location.href = '/admin/products';
            
        });
    }

    submitForm() {
        this.clearErrorMessage();
        
        const validation = this.validateForm();
        if (!validation.isValid) {
            this.showErrorMessage(validation.errors);
            return;
        }

        const submitButton = document.getElementById('submitForm');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = 'Submitting...';

        const formData = {
            name: document.getElementById('productName').value.trim(),
            description: document.getElementById('description').value.trim(),
            price: parseFloat(document.getElementById('price').value),
            category: document.getElementById('category').value.trim(),
            variants: this.variants.map(variant => {
                const variantManager = this.variantManagers.get(variant.id);
                const sizeStock = {};
                variant.sizes.forEach(size => {
                    sizeStock[size.size] = size.stock;
                });

                return {
                    color: variant.color,
                    images: variantManager.images.filter(img => img !== null),
                    sizes: sizeStock,
                    tags: variant.tags || []
                };
            })
        };

        fetch('/admin/products/addProduct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();  // Changed from response.text() to response.json()
        })
        .then(data => {
            if (data.success) {  // Check the success property from the JSON response
                location.href = '/admin/products';
            } else {
                throw new Error(data.message || 'Failed to add product');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showErrorMessage(['An error occurred while saving the product. Please try again.']);
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        });
    }
}

// Initialize the ProductManager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
});