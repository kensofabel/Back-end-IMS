document.addEventListener('DOMContentLoaded', function () {
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventoryTable = document.getElementById('inventory-table');
    const paginationBar = document.querySelector('.inventory-pagination-bar');
    const pageInput = paginationBar ? paginationBar.querySelector('.pagination-page-input') : null;
    const totalSpan = paginationBar ? paginationBar.querySelector('.pagination-total-pages') : null;
    const prevBtn = paginationBar ? paginationBar.querySelector('.pagination-prev') : null;
    const paginationNextBtn = paginationBar ? paginationBar.querySelector('.pagination-next') : null;
    const rowsSelect = paginationBar ? paginationBar.querySelector('.pagination-rows-select') : null;
    let rowsPerPage = 10;
    let currentPage = 1;
    let productsData = [];

    function renderTablePage(page) {
        const rows = Array.from(inventoryTableBody.querySelectorAll('tr'));
        const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
        currentPage = Math.max(1, Math.min(page, totalPages));
        rows.forEach((row, idx) => {
            row.style.display = (idx >= (currentPage-1)*rowsPerPage && idx < currentPage*rowsPerPage) ? '' : 'none';
        });
        if (pageInput) pageInput.value = currentPage;
        if (totalSpan) totalSpan.textContent = totalPages;
        if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (paginationNextBtn) paginationNextBtn.disabled = currentPage === totalPages;
    if (prevBtn) prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
    if (paginationNextBtn) paginationNextBtn.style.cursor = paginationNextBtn.disabled ? 'not-allowed' : 'pointer';
    }

    function displayInventory(products) {
        productsData = products;
        inventoryTableBody.innerHTML = '';
        products.forEach(product => {
            const tr = document.createElement('tr');
            const status = product.quantity > 0 ? 'In Stock' : 'Out of Stock';
            tr.innerHTML = `
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>$${parseFloat(product.unit_price).toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td>${status}</td>
                <td>
                    <button class="edit-btn" data-id="${product.id}">Edit</button>
                    <button class="delete-btn" data-id="${product.id}">Delete</button>
                </td>
            `;
            inventoryTableBody.appendChild(tr);
        });
        renderTablePage(1);
    }

    // Pagination controls
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            renderTablePage(currentPage - 1);
        });
    }
    if (paginationNextBtn) {
        paginationNextBtn.addEventListener('click', function() {
            renderTablePage(currentPage + 1);
        });
    }
    if (pageInput) {
        pageInput.addEventListener('change', function() {
            renderTablePage(parseInt(pageInput.value, 10) || 1);
        });
    }
    if (rowsSelect) {
        rowsSelect.addEventListener('change', function() {
            rowsPerPage = parseInt(rowsSelect.value, 10) || 10;
            renderTablePage(1);
        });
    }

    // Fetch and display inventory products
    function fetchInventory() {
        fetch('api.php')
            .then(response => response.json())
            .then(data => {
                displayInventory(data);
            })
            .catch(error => {
                console.error('Error fetching inventory:', error);
            });
    }

    // Initial fetch
    fetchInventory();

    // Scanner Modal Logic
    const scannerModal = document.getElementById('scannerModal');
    const addBtn = document.getElementById('addProductBtn');
    const closeScanner = document.getElementById('closeScanner');
    const scanTab = document.getElementById('scanTab');
    const manualTab = document.getElementById('manualTab');
    const scannerMode = document.getElementById('scannerMode');
    const manualMode = document.getElementById('manualMode');
    const cameraScanner = document.getElementById('cameraScanner');
    const hardwareScanner = document.getElementById('hardwareScanner');
    const nextBtn = document.getElementById('nextBtn');
    const skipBtn = document.getElementById('skipBtn');
    
    // Debug: Check if elements exist
    console.log('Scanner Modal Elements Check:');
    console.log('scannerModal:', scannerModal);
    console.log('addBtn:', addBtn);
    console.log('closeScanner:', closeScanner);
    console.log('scanTab:', scanTab);
    console.log('manualTab:', manualTab);
    
    let cameraStream = null;
    let isManualMode = false;
    
    // Check for hardware scanner
    function checkHardwareScanner() {
        return new Promise((resolve) => {
            // Simulate hardware scanner detection
            setTimeout(() => {
                const hasHardware = Math.random() > 0.7; // 30% chance for demo
                resolve(hasHardware);
            }, 500);
        });
    }
    
    // Initialize camera
    async function initCamera() {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            document.getElementById('cameraVideo').srcObject = cameraStream;
            return true;
        } catch (error) {
            console.error('Camera access denied:', error);
            return false;
        }
    }
    
    // Stop camera
    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }
    
    // Show scanner modal
    async function showScannerModal() {
        console.log('showScannerModal called'); // Debug log
        
        if (!scannerModal) {
            console.error('scannerModal element not found!');
            alert('Scanner modal not found! Please check the HTML structure.');
            return;
        }
        
        scannerModal.classList.add('show');
        console.log('Modal show class added'); // Debug log
        
        isManualMode = false;
        
        // Set initial tab state
        if (scanTab) {
            scanTab.classList.add('active');
        }
        if (manualTab) {
            manualTab.classList.remove('active');
        }
        
        // Show scanner mode
        if (scannerMode) {
            scannerMode.style.display = 'flex';
        }
        if (manualMode) {
            manualMode.style.display = 'none';
        }
        
        // Check for hardware scanner
        const hasHardware = await checkHardwareScanner();
        
        if (hasHardware) {
            // Show hardware scanner
            if (cameraScanner) cameraScanner.style.display = 'none';
            if (hardwareScanner) hardwareScanner.style.display = 'block';
            listenForHardwareScanner();
        } else {
            // Show camera scanner
            if (hardwareScanner) hardwareScanner.style.display = 'none';
            if (cameraScanner) cameraScanner.style.display = 'block';
            await initCamera();
        }
    }
    
    // Listen for hardware scanner input
    function listenForHardwareScanner() {
        let barcodeBuffer = '';
        
        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && barcodeBuffer.length > 0) {
                handleBarcodeScanned(barcodeBuffer);
                document.removeEventListener('keypress', handleKeyPress);
            } else if (e.key.length === 1) {
                barcodeBuffer += e.key;
            }
        };
        
        document.addEventListener('keypress', handleKeyPress);
    }
    
    // Handle barcode scanned
    function handleBarcodeScanned(barcode) {
        console.log('Barcode scanned:', barcode);
        closeScannerModal();
        // Here you would proceed to next step with barcode data
        alert(`Barcode scanned: ${barcode}\nWould proceed to product form...`);
    }
    
    // Switch to scanner mode
    function switchToScanMode() {
        isManualMode = false;
        
        // Update tab states
        if (scanTab) {
            scanTab.classList.add('active');
        }
        if (manualTab) {
            manualTab.classList.remove('active');
        }
        
        // Show scanner mode
        if (scannerMode) {
            scannerMode.style.display = 'flex';
        }
        if (manualMode) {
            manualMode.style.display = 'none';
        }
        
        // Reinitialize scanner
        checkAndInitializeScanner();
    }
    
    // Switch to manual mode
    function switchToManualMode() {
        isManualMode = true;
        
        // Update tab states
        if (scanTab) {
            scanTab.classList.remove('active');
        }
        if (manualTab) {
            manualTab.classList.add('active');
        }
        
        // Show manual mode
        if (scannerMode) {
            scannerMode.style.display = 'none';
        }
        if (manualMode) {
            manualMode.style.display = 'flex';
        }
        
        stopCamera();
        
        // Clear manual inputs
        document.getElementById('manualBarcode').value = '';
        document.getElementById('manualSKU').value = '';
    }
    
    // Check and initialize scanner (helper function)
    async function checkAndInitializeScanner() {
        const hasHardware = await checkHardwareScanner();
        
        if (hasHardware) {
            if (cameraScanner) cameraScanner.style.display = 'none';
            if (hardwareScanner) hardwareScanner.style.display = 'block';
            listenForHardwareScanner();
        } else {
            if (hardwareScanner) hardwareScanner.style.display = 'none';
            if (cameraScanner) cameraScanner.style.display = 'block';
            await initCamera();
        }
    }
    
    // Handle manual next button
    function handleManualNext() {
        const barcode = document.getElementById('manualBarcode').value.trim();
        const sku = document.getElementById('manualSKU').value.trim();
        
        if (!barcode && !sku) {
            alert('Please enter at least a barcode or SKU');
            return;
        }
        
        console.log('Manual entry:', { barcode, sku });
        closeScannerModal();
        // Here you would proceed to next step with manual data
        alert(`Manual entry:\nBarcode: ${barcode || 'Not provided'}\nSKU: ${sku || 'Not provided'}\nWould proceed to product form...`);
    }
    

    
    // Skip scanning/manual entry - go directly to form
    function handleSkip() {
        switchToFormMode();
    }
    
    // Switch to form mode
    function switchToFormMode() {
        // Add form-mode class to modal for styling
        if (scannerModal) {
            scannerModal.querySelector('.scanner-modal').classList.add('form-mode');
        }
        
        // Hide scanner and manual modes
        if (scannerMode) {
            scannerMode.style.display = 'none';
        }
        if (manualMode) {
            manualMode.style.display = 'none';
        }
        
        // Show form mode
        if (formMode) {
            formMode.style.display = 'flex';
        }
        
        // Hide tab navigation and skip section when in form mode
        const tabButtons = document.querySelectorAll('.scanner-tab');
        const skipSection = document.querySelector('.skip-section');
        
        tabButtons.forEach(tab => {
            tab.style.display = 'none';
        });
        
        if (skipSection) {
            skipSection.style.display = 'none';
        }
        
        stopCamera();
        
        // Populate form with data from manual mode if available
        const barcodeChecked = enableBarcodeCheckbox && enableBarcodeCheckbox.checked;
        const skuChecked = enableSKUCheckbox && enableSKUCheckbox.checked;
        const barcodeData = barcodeInput ? barcodeInput.value.trim() : '';
        const skuData = skuInput ? skuInput.value.trim() : '';
        
        if (barcodeChecked && barcodeData) {
            document.getElementById('productBarcode').value = barcodeData;
        }
        if (skuChecked && skuData) {
            document.getElementById('productSKU').value = skuData;
        }
    }
    
    // Handle Next button - proceed to form with data
    function handleNext() {
        const barcodeChecked = enableBarcodeCheckbox.checked;
        const skuChecked = enableSKUCheckbox.checked;
        const barcodeData = barcodeInput.value.trim();
        const skuData = skuInput.value.trim();
        
        console.log('Proceeding with data:', {
            barcode: barcodeChecked ? barcodeData : null,
            sku: skuChecked ? skuData : null
        });
        
        switchToFormMode();
    }
    
    // Go back from form to tabs
    function goBackToTabs() {
        // Remove form-mode class from modal
        if (scannerModal) {
            scannerModal.querySelector('.scanner-modal').classList.remove('form-mode');
        }
        
        // Hide form mode
        if (formMode) {
            formMode.style.display = 'none';
        }
        
        // Show scanner mode by default
        if (scannerMode) {
            scannerMode.style.display = 'flex';
        }
        
        // Show tab navigation and skip section
        const tabButtons = document.querySelectorAll('.scanner-tab');
        const skipSection = document.querySelector('.skip-section');
        
        tabButtons.forEach(tab => {
            tab.style.display = 'inline-block';
        });
        
        if (skipSection) {
            skipSection.style.display = 'block';
        }
        
        // Reset tab states to scanner mode
        if (scanTab) {
            scanTab.classList.add('active');
        }
        if (manualTab) {
            manualTab.classList.remove('active');
        }
        
        // Reinitialize scanner
        checkAndInitializeScanner();
    }
    
    // Close scanner modal
    function closeScannerModal() {
        stopCamera();
        scannerModal.classList.remove('show');
        
        // Remove form-mode class from modal
        if (scannerModal) {
            scannerModal.querySelector('.scanner-modal').classList.remove('form-mode');
        }
        
        // Reset to scanner mode for next time
        isManualMode = false;
        
        // Show scanner mode and hide others
        if (scannerMode) {
            scannerMode.style.display = 'flex';
        }
        if (manualMode) {
            manualMode.style.display = 'none';
        }
        if (formMode) {
            formMode.style.display = 'none';
        }
        
        // Reset tab states
        if (scanTab) {
            scanTab.classList.add('active');
        }
        if (manualTab) {
            manualTab.classList.remove('active');
        }
        
        // Show tab buttons and skip section
        const tabButtons = document.querySelectorAll('.scanner-tab');
        const skipSection = document.querySelector('.skip-section');
        
        tabButtons.forEach(tab => {
            tab.style.display = 'inline-block';
        });
        
        if (skipSection) {
            skipSection.style.display = 'block';
        }
        
        // Reset form inputs
        if (barcodeInput) {
            barcodeInput.value = '';
            barcodeInput.disabled = true;
            updateInputStyling(barcodeInput, false);
        }
        if (skuInput) {
            skuInput.value = '';
            skuInput.disabled = true;
            updateInputStyling(skuInput, false);
        }
        if (enableBarcodeCheckbox) {
            enableBarcodeCheckbox.checked = false;
        }
        if (enableSKUCheckbox) {
            enableSKUCheckbox.checked = false;
        }
        updateNextButtonState();
        
        // Reset form fields
        const productForm = document.getElementById('formMode');
        if (productForm) {
            const inputs = productForm.querySelectorAll('input[type="text"], input[type="number"], select');
            inputs.forEach(input => {
                input.value = '';
            });
            const checkboxes = productForm.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            if (representationSection) {
                representationSection.style.display = 'none';
            }
        }
    }
    
    // Event listeners - Check if elements exist before binding
    if (addBtn) {
        addBtn.onclick = function() {
            console.log('Add Item button clicked'); // Debug log
            showScannerModal();
        };
    } else {
        console.error('addProductBtn element not found!');
    }
    
    if (closeScanner) {
        closeScanner.onclick = closeScannerModal;
    }
    
    if (scanTab) {
        scanTab.onclick = switchToScanMode;
    }
    
    if (manualTab) {
        manualTab.onclick = switchToManualMode;
    }
    
    if (nextBtn) {
        nextBtn.onclick = handleNext;
    }
    

    
    if (skipBtn) {
        skipBtn.onclick = handleSkip;
    }
    
    // Close modal on outside click
    window.onclick = function(e) {
        if (scannerModal && e.target === scannerModal) {
            closeScannerModal();
        }
    };
    
    // Close modal on Escape key
    window.onkeydown = function(e) {
        if (e.key === 'Escape' && scannerModal && scannerModal.classList.contains('show')) {
            closeScannerModal();
        }
    };
    
    // Field checkbox and input validation functionality
    const enableBarcodeCheckbox = document.getElementById('enableBarcode');
    const barcodeInput = document.getElementById('manualBarcode');
    const enableSKUCheckbox = document.getElementById('enableSKU');
    const skuInput = document.getElementById('manualSKU');
    const nextButton = document.getElementById('nextBtn');
    const formMode = document.getElementById('formMode');
    const trackStockCheckbox = document.getElementById('trackStock');
    const stockSection = document.getElementById('stockSection');
    const goBackBtn = document.getElementById('goBackBtn');
    
    // Function to update Next button state
    function updateNextButtonState() {
        const barcodeChecked = enableBarcodeCheckbox.checked;
        const skuChecked = enableSKUCheckbox.checked;
        const barcodeHasData = barcodeInput.value.trim() !== '';
        const skuHasData = skuInput.value.trim() !== '';
        
        let canProceed = false;
        
        if (barcodeChecked && skuChecked) {
            // Both checkboxes checked - BOTH must have data
            canProceed = barcodeHasData && skuHasData;
        } else if (barcodeChecked && !skuChecked) {
            // Only barcode checked - barcode must have data
            canProceed = barcodeHasData;
        } else if (!barcodeChecked && skuChecked) {
            // Only SKU checked - SKU must have data
            canProceed = skuHasData;
        } else {
            // Neither checked - cannot proceed
            canProceed = false;
        }
        
        if (canProceed) {
            nextButton.disabled = false;
            nextButton.style.opacity = '1';
            nextButton.style.cursor = 'pointer';
        } else {
            nextButton.disabled = true;
            nextButton.style.opacity = '0.5';
            nextButton.style.cursor = 'not-allowed';
        }
    }
    
    // Function to update input styling using CSS classes
    function updateInputStyling(input, enabled) {
        if (enabled) {
            input.classList.remove('input-disabled');
            input.classList.add('input-enabled');
        } else {
            input.classList.remove('input-enabled');
            input.classList.add('input-disabled');
        }
    }
    
    // Initialize inputs as disabled
    if (barcodeInput) {
        barcodeInput.disabled = true;
        updateInputStyling(barcodeInput, false);
    }
    if (skuInput) {
        skuInput.disabled = true;
        updateInputStyling(skuInput, false);
    }
    
    // Initialize Next button as disabled
    updateNextButtonState();
    
    // Barcode checkbox
    if (enableBarcodeCheckbox && barcodeInput) {
        enableBarcodeCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Enable barcode input
                barcodeInput.disabled = false;
                updateInputStyling(barcodeInput, true);
                barcodeInput.focus();
            } else {
                // Disable barcode input but KEEP the data
                barcodeInput.disabled = true;
                updateInputStyling(barcodeInput, false);
            }
            updateNextButtonState();
        });
        
        // Listen for input changes on barcode
        barcodeInput.addEventListener('input', updateNextButtonState);
    }
    
    // SKU checkbox
    if (enableSKUCheckbox && skuInput) {
        enableSKUCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Enable SKU input
                skuInput.disabled = false;
                updateInputStyling(skuInput, true);
                skuInput.focus();
            } else {
                // Disable SKU input but KEEP the data
                skuInput.disabled = true;
                updateInputStyling(skuInput, false);
            }
            updateNextButtonState();
        });
        
        // Listen for input changes on SKU
        skuInput.addEventListener('input', updateNextButtonState);
    }
    
    // Go back button functionality
    if (goBackBtn) {
        goBackBtn.addEventListener('click', goBackToTabs);
    }
    
    // Track Stock checkbox functionality
    if (trackStockCheckbox && stockSection) {
        trackStockCheckbox.addEventListener('change', function() {
            if (this.checked) {
                stockSection.style.display = 'block';
            } else {
                stockSection.style.display = 'none';
            }
        });
    }

});