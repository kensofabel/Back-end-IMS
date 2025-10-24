// Stop Quagga and camera stream
function stopScanner() {
    try {
        if (window.Quagga && window.Quagga.initialized) {
            window.Quagga.stop();
            window.Quagga.initialized = false;
        }
        // Do NOT stop camera stream
        if (videoEl && videoEl.srcObject) {
            videoEl.pause();
            videoEl.srcObject.getTracks().forEach(track => track.stop());
            videoEl.srcObject = null;
        }
    } catch (e) { console.warn('[DEBUG] Failed to stop scanner/camera:', e); }
}
// Declare scannerModal only once at the top
// Number of identical scans required to accept a barcode (for legacy code)
const REQUIRED_IDENTICAL = 4;
const scannerModal = document.getElementById('scannerModal');

// Global reset helper for scanner variables. Use REQUIRED_IDENTICAL as the
// authoritative constant; fall back to 4 if it's not available at runtime.
window.resetScannerVars = function() {
    try {
        barcodeCount = 0;
        lastBarcode = null;
        noisyReads = 0;
        adaptiveRequiredIdentical = (typeof REQUIRED_IDENTICAL !== 'undefined') ? REQUIRED_IDENTICAL : 4;
    } catch (e) {
        // In case variables aren't declared yet, avoid throwing from the reset
        console.warn('[DEBUG] resetScannerVars failed:', e);
    }
};

// Reusable confirmation popup for not found
function showNotFoundConfirmation(message, onConfirm, onCancel) {
    // Add skip logic
    if (typeof window.notFoundConfirmSkip === 'undefined') window.notFoundConfirmSkip = false;
    if (window.notFoundConfirmSkip) { if (onConfirm) onConfirm(); return; }
    let modal = document.getElementById('notFoundConfirmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'notFoundConfirmModal';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.45)';
        modal.style.zIndex = '99999';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        // Modal content container
        const contentDiv = document.createElement('div');
        contentDiv.style.background = '#121212';
        contentDiv.style.border = '1px solid #333';
    contentDiv.style.padding = '18px 18px';
    contentDiv.style.borderRadius = '12px';
    contentDiv.style.minWidth = '320px';
    contentDiv.style.maxWidth = '420px';
    contentDiv.style.boxShadow = '0 12px 30px rgba(0,0,0,0.6)';
    contentDiv.style.textAlign = 'center';
        // Message
        const msgDiv = document.createElement('div');
        msgDiv.id = 'notFoundConfirmMsg';
        msgDiv.style.color = '#fff';
        msgDiv.style.fontSize = '18px';
        msgDiv.style.marginBottom = '18px';
        msgDiv.textContent = 'MESSAGE';
        contentDiv.appendChild(msgDiv);
        // Remove any existing custom checkbox row before adding a new one
        const existingCheckboxRows = contentDiv.querySelectorAll('.checkbox-row');
        existingCheckboxRows.forEach(row => row.remove());
        // Only custom styled checkbox (like manual tab)
        const dontShowDiv = document.createElement('div');
        dontShowDiv.className = 'checkbox-row';
        dontShowDiv.style.marginBottom = '16px';
        dontShowDiv.style.display = 'flex';
        dontShowDiv.style.alignItems = 'center';
        dontShowDiv.style.justifyContent = 'center';
        const dontShowLabel = document.createElement('label');
        dontShowLabel.className = 'custom-checkbox';
        dontShowLabel.style.display = 'flex';
        dontShowLabel.style.alignItems = 'center';
        dontShowLabel.style.cursor = 'pointer';
        dontShowLabel.style.fontSize = '15px';
        dontShowLabel.style.color = '#dbdbdb';
        dontShowLabel.style.userSelect = 'none';
    const dontShowCheckbox = document.createElement('input');
    dontShowCheckbox.type = 'checkbox';
    dontShowCheckbox.id = 'dontShowAddConfirm';
    // Hide the native checkbox, but keep it accessible
    dontShowCheckbox.style.opacity = '0';
    dontShowCheckbox.style.position = 'absolute';
    dontShowCheckbox.style.left = '0';
    dontShowCheckbox.style.width = '18px';
    dontShowCheckbox.style.height = '18px';
    dontShowCheckbox.style.margin = '0';
    dontShowCheckbox.style.zIndex = '2';
    dontShowLabel.style.position = 'relative';
        const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';
    checkmark.style.width = '18px';
    checkmark.style.height = '18px';
    checkmark.style.border = '2px solid #888';
    checkmark.style.borderRadius = '4px';
    checkmark.style.display = 'flex';
    checkmark.style.alignItems = 'center';
    checkmark.style.justifyContent = 'center';
    checkmark.style.marginRight = '10px';
    checkmark.style.background = 'transparent';
    checkmark.style.position = 'relative';
    checkmark.style.transition = 'border-color 0.2s';
    checkmark.style.verticalAlign = 'middle';
    checkmark.style.overflow = 'hidden';
    checkmark.style.boxSizing = 'border-box';
        dontShowCheckbox.addEventListener('change', function() {
            if (this.checked) {
                checkmark.style.background = '#ff9800';
                checkmark.style.borderColor = '#ff9800';
                checkmark.innerHTML = '<svg width="14" height="14" style="display:block;margin:0 auto;position:static;" viewBox="0 0 14 14"><polyline points="2,7 6,11 12,3" style="fill:none;stroke:white;stroke-width:2" /></svg>';
            } else {
                checkmark.style.background = 'transparent';
                checkmark.style.borderColor = '#888';
                checkmark.innerHTML = '';
            }
        });
        dontShowCheckbox.dispatchEvent(new Event('change'));
        dontShowLabel.appendChild(dontShowCheckbox);
        dontShowLabel.appendChild(checkmark);
        dontShowLabel.appendChild(document.createTextNode("Don't show this again"));
        // Make the checkmark clickable
        checkmark.onclick = function() {
            dontShowCheckbox.checked = !dontShowCheckbox.checked;
            dontShowCheckbox.dispatchEvent(new Event('change'));
        };
        dontShowDiv.appendChild(dontShowLabel);
        contentDiv.appendChild(dontShowDiv);
        // Buttons
        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '16px';
        btnRow.style.justifyContent = 'center';
        const confirmBtn = document.createElement('button');
        confirmBtn.id = 'notFoundConfirmBtn';
        confirmBtn.className = 'btn';
        confirmBtn.style.background = '#ff9800';
        confirmBtn.style.color = '#171717';
        confirmBtn.style.padding = '8px 18px';
        confirmBtn.style.borderRadius = '6px';
        confirmBtn.style.fontWeight = '600';
        confirmBtn.textContent = 'Add New';
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'notFoundCancelBtn';
        cancelBtn.className = 'btn';
        cancelBtn.style.background = '#333';
        cancelBtn.style.color = '#fff';
        cancelBtn.style.padding = '8px 18px';
        cancelBtn.style.borderRadius = '6px';
        cancelBtn.textContent = 'Cancel';
        btnRow.appendChild(confirmBtn);
        btnRow.appendChild(cancelBtn);
        contentDiv.appendChild(btnRow);
        modal.appendChild(contentDiv);
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    modal.querySelector('#notFoundConfirmMsg').textContent = message;
    const confirmBtn = modal.querySelector('#notFoundConfirmBtn');
    const cancelBtn = modal.querySelector('#notFoundCancelBtn');
    const dontShowCheckbox = modal.querySelector('#dontShowAddConfirm');
    function cleanup() {
        modal.style.display = 'none';
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        if (dontShowCheckbox) dontShowCheckbox.onchange = null;
    }
    confirmBtn.onclick = function() {
        if (dontShowCheckbox && dontShowCheckbox.checked) window.notFoundConfirmSkip = true;
        cleanup();
        if (onConfirm) onConfirm();
    };
    cancelBtn.onclick = function() {
        if (dontShowCheckbox && dontShowCheckbox.checked) window.notFoundConfirmSkip = true;
        cleanup();
        if (onCancel) onCancel();
    };
}

document.addEventListener('DOMContentLoaded', function () {
     // Automate scanner lifecycle based on scan tab visibility
    const scanPanel = document.getElementById('scanTabPanel');
        // Always show camera video regardless of tab
        const cameraVideo = document.getElementById('cameraVideo');
        if (cameraVideo) {
            cameraVideo.style.display = '';
        }
    if (scanPanel) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (scanPanel.style.display !== 'none') {
                    if (typeof startQuaggaScanner === 'function') {
                        startQuaggaScanner();
                    }
                } else {
                    if (typeof stopScanner === 'function') {
                        stopScanner();
                    }
                }
            });
        });
        observer.observe(scanPanel, { attributes: true, attributeFilter: ['style'] });
    }
    // Auto-generate SKU for Add Items form on page load
    setTimeout(() => {
        const skuInput = document.getElementById('inlineItemSKU');
        if (skuInput) {
            fetch('get_next_sku.php')
                .then(res => res.json())
                .then(data => {
                    if (data.next_sku) {
                        skuInput.value = data.next_sku;
                        skuInput.removeAttribute('readonly');
                    }
                });

                // Delegated Undo handler: ensures Undo works even if per-row handlers were not wired
                document.addEventListener('DOMContentLoaded', function() {
                    const brMount = document.getElementById('barcodeResultsMount');
                    if (!brMount) return;
                    brMount.addEventListener('click', function(e) {
                        const undoBtn = e.target.closest && e.target.closest('.br-undo');
                        if (!undoBtn) return;
                        const node = undoBtn.closest('.barcode-result-row');
                        if (!node) return;
                        console.log('delegated br-undo clicked for node', node.getAttribute && node.getAttribute('data-product-id'), 'lastAdded:', node._lastAdded);

                        const last = node._lastAdded;
                        if (!last || !last.qty) {
                            showErrorPopup('Nothing to undo');
                            return;
                        }

                        const prevText = undoBtn.textContent;
                        try { undoBtn.textContent = 'Undoing…'; undoBtn.disabled = true; } catch (e) {}

                        const undoQty = -Math.abs(parseFloat(last.qty) || 0);
                        const adjustPayload = { action: 'adjust_stock', product_id: parseInt(node.getAttribute('data-product-id') || 0), qty: undoQty };
                        if (node.getAttribute('data-variant-id')) adjustPayload.variant_id = parseInt(node.getAttribute('data-variant-id'));
                        if (last.unit && last.unit !== '- -') adjustPayload.unit = last.unit;

                        const instockEl = node.querySelector('.br-instock-value');
                        const statusEl = node.querySelector('.br-status') || node.querySelector('.br-status-value');
                        const successCol = node.querySelector('.br-col-success');
                        const addQty = node.querySelector('.br-add-qty');
                        const addBtn = node.querySelector('.br-add-btn');
                        const trackToggle = node.querySelector('.br-track-toggle input');
                        const trackingOn = trackToggle ? trackToggle.checked : true;

                        // Show recommendation when input focused if item is low or out of stock
                        if (addQty) {
                            addQty.addEventListener('focus', function() {
                                try {
                                    const curText = instockEl ? instockEl.textContent.trim() : (node.getAttribute('data-in-stock') || '');
                                    const lowText = node.getAttribute('data-low-stock') || '';
                                    const parseNum = s => { const m = String(s || '').match(/^\s*([0-9]+(?:\.[0-9]+)?)/); return m ? parseFloat(m[1]) : null; };
                                    const curNum = parseNum(curText);
                                    const lowNum = parseNum(lowText);
                                    if (lowNum !== null && (curNum === null || curNum <= lowNum)) {
                                        const need = Math.max(1, Math.ceil((lowNum - (curNum || 0)) + 1));
                                        let msg = node.querySelector('.br-recommend-msg');
                                        if (!msg) {
                                            msg = document.createElement('div');
                                            msg.className = 'br-recommend-msg';
                                            msg.setAttribute('role','status');
                                            // initially hidden for measuring
                                            msg.style.visibility = 'hidden';
                                            node.appendChild(msg);
                                        }
                                        msg.textContent = `We recommend you adding ${need} or more to exceed low stock`;

                                        // Measure geometry and position to the right-top of the input, clamped inside the row
                                        // ensure it's in the DOM and can be measured
                                        const rowRect = node.getBoundingClientRect();
                                        const inputRect = addQty.getBoundingClientRect();
                                        const inner = node.closest('.barcode-results-inner') || node.parentElement;
                                        const innerRect = inner ? inner.getBoundingClientRect() : rowRect;

                                        // make visible to get accurate size
                                        msg.style.display = '';
                                        // Force browser to render to get sizes
                                        const ttWidth = Math.min((msg.offsetWidth || 160), Math.max(80, innerRect.width - 12));
                                        const ttHeight = msg.offsetHeight || 28;

                                        // Position: right edge aligned to input right, top above input
                                        let left = (inputRect.right - rowRect.left) - ttWidth;
                                        let top = (inputRect.top - rowRect.top) - ttHeight - 6;

                                        // Clamp left within row bounds (6px padding)
                                        const minLeft = 6;
                                        const maxLeft = Math.max(6, rowRect.width - ttWidth - 6);
                                        if (left < minLeft) left = minLeft;
                                        if (left > maxLeft) left = maxLeft;

                                        // Prevent tooltip from appearing too far above the row (limit to -ttHeight - 6)
                                        const minTop = -ttHeight - 6;
                                        if (top < minTop) top = minTop;

                                        msg.style.left = Math.round(left) + 'px';
                                        msg.style.top = Math.round(top) + 'px';
                                        msg.style.visibility = 'visible';
                                    }
                                } catch (e) { console.error('recommend focus error', e); }
                            });
                            addQty.addEventListener('blur', function() {
                                try {
                                    const msg = node.querySelector('.br-recommend-msg');
                                    if (msg) msg.style.display = 'none';
                                } catch (e) {}
                            });
                            // Hide tooltip as soon as the user starts typing
                            addQty.addEventListener('input', function() {
                                try {
                                    const msg = node.querySelector('.br-recommend-msg');
                                    if (msg) msg.style.display = 'none';
                                } catch (e) {}
                            });
                        }

                        // Use AbortController to avoid hangs and handle non-JSON/server errors clearly
                        const controller = new AbortController();
                        const timeoutMs = 8000;
                        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                        fetch('api.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adjustPayload), signal: controller.signal })
                        .then(response => {
                            clearTimeout(timeoutId);
                            if (!response.ok) {
                                return response.text().then(text => { throw new Error('Server returned ' + response.status + ': ' + text); });
                            }
                            return response.text().then(text => {
                                try { return JSON.parse(text); } catch (e) { throw new Error('Invalid JSON response: ' + text); }
                            });
                        })
                        .then(res => {
                            if (!res || !res.success) throw new Error(res && res.error ? res.error : 'Undo failed');
                            if (instockEl) instockEl.textContent = res.new_in_stock || '—';
                            if (statusEl) statusEl.textContent = res.status || '—';

                            // If server returned parent totals prefer them; otherwise recalc from DOM
                            try {
                                if (res && res.parent_new_in_stock && node && node.getAttribute && node.getAttribute('data-variant-id')) {
                                    const wrapper = node.closest && node.closest('.br-row-wrapper');
                                    if (wrapper) {
                                        const parentNode = wrapper.querySelector('.barcode-result-row');
                                        if (parentNode) {
                                            const pInst = parentNode.querySelector('.br-instock-value');
                                            const pStatus = parentNode.querySelector('.br-status');
                                            if (pInst) pInst.textContent = res.parent_new_in_stock || '—';
                                            if (pStatus) pStatus.textContent = res.parent_status || '—';
                                            try { parentNode.setAttribute('data-in-stock', res.parent_new_in_stock ? String(res.parent_new_in_stock).replace(/\s+/g,'') : ''); } catch (e) {}
                                        }
                                    }
                                } else {
                                    if (node && node.getAttribute && node.getAttribute('data-variant-id')) {
                                        const wrapper = node.closest && node.closest('.br-row-wrapper');
                                        if (wrapper) {
                                            // Sum variant in-stock numbers
                                            let sum = 0;
                                            let foundAny = false;
                                            let unit = '';
                                            const vRows = wrapper.querySelectorAll('.variant-list .barcode-result-row');
                                            vRows.forEach(vRow => {
                                                try {
                                                    const ie = vRow.querySelector('.br-instock-value');
                                                    const txt = ie ? String(ie.textContent || '').trim() : (vRow.getAttribute('data-in-stock') || '').trim();
                                                    if (!txt) return;
                                                    const m = txt.match(/^\s*([+-]?\d+(?:\.\d+)?)/);
                                                    if (m) {
                                                        const n = parseFloat(m[1]);
                                                        if (!isNaN(n)) { sum += n; foundAny = true; }
                                                    }
                                                    if (!unit) {
                                                        const um = txt.match(/^\s*[+-]?\d+(?:\.\d+)?\s*(.*)$/);
                                                        if (um && um[1]) {
                                                            const u = um[1].trim(); if (u && u !== '- -') unit = u;
                                                        }
                                                    }
                                                } catch (e) { /* ignore per-row */ }
                                            });
                                            const parentNode = wrapper.querySelector('.barcode-result-row');
                                            if (parentNode) {
                                                const pInst = parentNode.querySelector('.br-instock-value');
                                                const pStatus = parentNode.querySelector('.br-status');
                                                if (pInst) pInst.textContent = foundAny ? (String(sum) + (unit ? ' ' + unit : '')) : '—';
                                                let statusText = '—';
                                                if (foundAny) {
                                                    if (sum <= 0) statusText = 'Out of stock';
                                                    else {
                                                        const parentLow = parentNode.getAttribute && parentNode.getAttribute('data-low-stock') ? parentNode.getAttribute('data-low-stock') : '';
                                                        if (parentLow && parentLow !== '' && sum <= parseFloat(parentLow)) statusText = 'Low stock';
                                                        else statusText = 'In stock';
                                                    }
                                                }
                                                if (pStatus) pStatus.textContent = statusText;
                                                try { parentNode.setAttribute('data-in-stock', foundAny ? String(sum) : ''); } catch (e) {}
                                            }
                                        }
                                    }
                                }
                            } catch (e) { console.error('delegated parent recalc failed', e); }

                            // restore row UI
                            const cols = node.querySelectorAll('.br-col');
                            cols.forEach(col => {
                                if (!col.classList.contains('br-col-success')) {
                                    if (col.classList.contains('br-col-instock') || col.classList.contains('br-col-status') || col.classList.contains('br-col-add')) {
                                        if (trackingOn) col.style.display = '';
                                        else col.style.display = 'none';
                                    } else {
                                        col.style.display = '';
                                    }
                                }
                            });
                            if (successCol) successCol.style.display = 'none';
                            if (addQty) { addQty.style.display = ''; addQty.disabled = false; addQty.value = ''; }
                            if (addBtn) { addBtn.style.display = ''; addBtn.disabled = false; }
                            console.log('adjust_stock response', res);
                            try { undoBtn.disabled = false; undoBtn.textContent = prevText; } catch (e) {}
                        })
                        .catch(err => {
                            clearTimeout(timeoutId);
                            console.error('delegated undo error', err);
                            if (err.name === 'AbortError') {
                                showErrorPopup('Undo request timed out');
                            } else {
                                showErrorPopup('Failed to undo: ' + (err.message || err));
                            }
                            try { undoBtn.disabled = false; undoBtn.textContent = prevText; } catch (e) {}
                        });
                    });
                });
        }
    }, 200);
    // Helper to enable/disable Next button
    function updateNextButtonState() {
        var skuInput = document.getElementById('manualSKU');
        var skuCheckbox = document.getElementById('enableSKU');
        var barcodeInput = document.getElementById('manualBarcode');
        var barcodeCheckbox = document.getElementById('enableBarcode');
        var nextBtn = document.getElementById('nextBtn');
        if (!nextBtn) return;
        // Button enabled if checked input has value
        var skuValid = skuCheckbox && skuCheckbox.checked && skuInput && skuInput.value.trim();
        var barcodeValid = barcodeCheckbox && barcodeCheckbox.checked && barcodeInput && barcodeInput.value.trim();
        nextBtn.disabled = !(skuValid || barcodeValid);
    }

    // Auto-focus input when checkbox is checked
    function setupCheckboxAutoFocus() {
        var skuInput = document.getElementById('manualSKU');
        var skuCheckbox = document.getElementById('enableSKU');
        var barcodeInput = document.getElementById('manualBarcode');
        var barcodeCheckbox = document.getElementById('enableBarcode');
        
        // Flags to prevent blur interference during manual interaction
        var skuIgnoreBlur = false;
        var barcodeIgnoreBlur = false;

        if (skuCheckbox && skuInput) {
            // Set flag when clicking on checkbox to prevent blur interference
            skuCheckbox.addEventListener('mousedown', function() {
                if (skuCheckbox.checked) { // If currently checked, user is about to uncheck
                    skuIgnoreBlur = true;
                }
            });
            
            skuCheckbox.addEventListener('change', function() {
                if (skuCheckbox.checked) {
                    skuIgnoreBlur = false; // Reset flag when checking
                    skuInput.focus();
                } else {
                    skuInput.value = '';
                    skuInput.blur();
                    // Reset flag after unchecking is complete
                    setTimeout(function() {
                        skuIgnoreBlur = false;
                    }, 100);
                }
                updateNextButtonState();
            });
            
            // Also listen to input changes for Next button validation
            skuInput.addEventListener('input', updateNextButtonState);
            
            // Auto-uncheck checkbox if input loses focus with no data
            skuInput.addEventListener('blur', function() {
                // Use setTimeout to ensure this runs after any checkbox click events
                setTimeout(function() {
                    if (!skuIgnoreBlur && skuCheckbox.checked && !skuInput.value.trim()) {
                        skuCheckbox.checked = false;
                        updateNextButtonState();
                    }
                }, 50);
            });
        }

        if (barcodeCheckbox && barcodeInput) {
            // Set flag when clicking on checkbox to prevent blur interference
            barcodeCheckbox.addEventListener('mousedown', function() {
                if (barcodeCheckbox.checked) { // If currently checked, user is about to uncheck
                    barcodeIgnoreBlur = true;
                }
            });
            
            barcodeCheckbox.addEventListener('change', function() {
                if (barcodeCheckbox.checked) {
                    barcodeIgnoreBlur = false; // Reset flag when checking
                    barcodeInput.focus();
                } else {
                    barcodeInput.value = '';
                    barcodeInput.blur();
                    // Reset flag after unchecking is complete
                    setTimeout(function() {
                        barcodeIgnoreBlur = false;
                    }, 100);
                }
                updateNextButtonState();
            });
            
            // Also listen to input changes for Next button validation
            barcodeInput.addEventListener('input', updateNextButtonState);
            
            // Auto-uncheck checkbox if input loses focus with no data
            barcodeInput.addEventListener('blur', function() {
                // Use setTimeout to ensure this runs after any checkbox click events
                setTimeout(function() {
                    if (!barcodeIgnoreBlur && barcodeCheckbox.checked && !barcodeInput.value.trim()) {
                        barcodeCheckbox.checked = false;
                        updateNextButtonState();
                    }
                }, 50);
            });
        }

        // Initialize Next button state
        updateNextButtonState();
    }

    // Initialize auto-focus functionality
    setupCheckboxAutoFocus();

    // Currency Auto-Prefix Functionality
    function setupCurrencyInputs() {
        // Get all inputs with currency-localization attribute
        const currencyInputs = document.querySelectorAll('input[currency-localization]');
        
        currencyInputs.forEach(function(input) {
            const prefix = input.getAttribute('currency-localization'); // Get the prefix (₱)
            
            // Don't set initial value - let placeholder show
            
            // Handle input event - add prefix when user starts typing
            input.addEventListener('input', function() {
                const value = this.value;
                
                // If empty, leave as is (shows placeholder)
                if (value === '') {
                    return;
                }
                
                // If user is typing and doesn't have prefix, add it
                if (value !== '' && !value.startsWith(prefix)) {
                    // Only add numbers and decimal points
                    const numericOnly = value.replace(/[^\d.]/g, '');
                    if (numericOnly) {
                        this.value = prefix + numericOnly;
                        // Set cursor position after the currency symbol
                        const cursorPos = prefix.length + numericOnly.length;
                        this.setSelectionRange(cursorPos, cursorPos);
                    }
                }
                
                // Ensure proper decimal formatting
                const currentValue = this.value;
                if (currentValue.startsWith(prefix)) {
                    const numericPart = currentValue.substring(prefix.length);
                    const parts = numericPart.split('.');
                    
                    // Limit decimal places to 2
                    if (parts.length > 1 && parts[1].length > 2) {
                        const correctedValue = prefix + parts[0] + '.' + parts[1].substring(0, 2);
                        this.value = correctedValue;
                    }
                }
            });
            
            // Handle keydown for special cases
            input.addEventListener('keydown', function(e) {
                // Allow backspace/delete to clear everything including prefix
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    return; // Let default behavior handle it
                }
                
                // Prevent typing non-numeric characters (except decimal point)
                if (!/[\d.]/.test(e.key) && 
                    !['Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) &&
                    !(e.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase()))) {
                    e.preventDefault();
                }
            });
            
            // Handle blur event - format the value if it has content
            input.addEventListener('blur', function() {
                const value = this.value.trim();
                
                // If empty or just currency symbol, clear it
                if (value === '' || value === prefix) {
                    this.value = '';
                    return;
                }
                
                // If has currency symbol, format to 2 decimal places
                if (value.startsWith(prefix)) {
                    const numericPart = value.substring(prefix.length);
                    const floatValue = parseFloat(numericPart);
                    if (!isNaN(floatValue) && floatValue >= 0) {
                        this.value = prefix + floatValue.toFixed(2);
                    } else {
                        this.value = '';
                    }
                }
            });
        });
    }

    // Initialize currency functionality
    setupCurrencyInputs();
    
    // Category Autocomplete Functionality
    function setupCategoryAutocomplete() {
        const categoryInput = document.getElementById('inlineItemCategory');
        const categoryDropdown = document.getElementById('categoryDropdown');
        
        if (!categoryInput || !categoryDropdown) return;
        
        // Move dropdown to body to escape modal clipping
        document.body.appendChild(categoryDropdown);
        
        // Fetch categories from backend
        let existingCategories = [];
        function fetchCategories() {
            fetch('api.php?categories=1')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        existingCategories = data;
                    }
                });
        }
        fetchCategories();
        
        let highlightedIndex = -1;
        let filteredCategories = [];
        
        // Show dropdown with categories
        function showDropdown(categories, searchTerm = '') {
            categoryDropdown.innerHTML = '';
            filteredCategories = categories;
            highlightedIndex = -1;
            
            // Position dropdown below the input field
            const inputRect = categoryInput.getBoundingClientRect();
            categoryDropdown.style.top = (inputRect.bottom + 2) + 'px';
            categoryDropdown.style.left = inputRect.left + 'px';
            categoryDropdown.style.width = inputRect.width + 'px';
            
            if (categories.length === 0 && searchTerm.trim() !== '') {
                // Show "New Category" option when no matches
                const newOption = document.createElement('div');
                newOption.className = 'category-option new-category';
                newOption.innerHTML = `
                    <span>${searchTerm}</span>
                    <span class="category-new-indicator">New Category</span>
                `;
                
                // Prevent blur when clicking on new category option
                newOption.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                });
                
                newOption.addEventListener('click', () => selectCategory(searchTerm));
                categoryDropdown.appendChild(newOption);
                filteredCategories = [searchTerm];
            } else {
                categories.forEach((category, index) => {
                    const option = document.createElement('div');
                    option.className = 'category-option';
                    option.textContent = category;
                    
                    // Prevent blur when clicking on option
                    option.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                    });
                    
                    option.addEventListener('click', () => selectCategory(category));
                    categoryDropdown.appendChild(option);
                });
            }
            
            categoryDropdown.classList.add('show');
        }
        
        // Hide dropdown
        function hideDropdown() {
            categoryDropdown.classList.remove('show');
            highlightedIndex = -1;
        }
        
        // Select category
        function selectCategory(category) {
            categoryInput.value = category;
            hideDropdown();
            categoryInput.blur();
        }
        
        // Filter categories based on input
        function filterCategories(searchTerm) {
            if (!searchTerm.trim()) {
                return existingCategories;
            }
            
            return existingCategories.filter(category => 
                category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Highlight option with keyboard navigation
        function highlightOption(index) {
            const options = categoryDropdown.querySelectorAll('.category-option');
            
            // Remove previous highlight
            options.forEach(option => option.classList.remove('highlighted'));
            
            // Add new highlight
            if (index >= 0 && index < options.length) {
                options[index].classList.add('highlighted');
                highlightedIndex = index;
            }
        }
        
        // Default placeholder value used in markup
        const CATEGORY_DEFAULT = 'No Category';

        // Event listeners
        categoryInput.addEventListener('focus', () => {
            // If the field currently contains the default sentinel, clear it so user doesn't have to erase
            if (categoryInput.value && categoryInput.value.trim() === CATEGORY_DEFAULT) {
                categoryInput.value = '';
            }
            const filtered = filterCategories(categoryInput.value);
            showDropdown(filtered, categoryInput.value);
        });

        // When blurring, if empty restore the default sentinel so UI shows 'No Category'
        categoryInput.addEventListener('blur', () => {
            setTimeout(() => { // allow click handlers on dropdown to run first
                if (!categoryInput.value || categoryInput.value.trim() === '') {
                    categoryInput.value = CATEGORY_DEFAULT;
                }
                hideDropdown();
            }, 150);
        });
        
        categoryInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            // If the user types and the default value was present, treat it as empty
            const effectiveSearch = (searchTerm && searchTerm.trim() === CATEGORY_DEFAULT) ? '' : searchTerm;
            const filtered = filterCategories(effectiveSearch);
            showDropdown(filtered, effectiveSearch);
        });
        
        categoryInput.addEventListener('keydown', (e) => {
            const options = categoryDropdown.querySelectorAll('.category-option');
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    highlightedIndex = Math.min(highlightedIndex + 1, options.length - 1);
                    highlightOption(highlightedIndex);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    highlightedIndex = Math.max(highlightedIndex - 1, 0);
                    highlightOption(highlightedIndex);
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (highlightedIndex >= 0 && filteredCategories[highlightedIndex]) {
                        selectCategory(filteredCategories[highlightedIndex]);
                    } else if (categoryInput.value.trim()) {
                        // If no highlighted option but there's text, create new category
                        selectCategory(categoryInput.value.trim());
                    }
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    hideDropdown();
                    categoryInput.blur();
                    break;
            }
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!categoryInput.contains(e.target) && !categoryDropdown.contains(e.target)) {
                hideDropdown();
            }
        });
        
        // Hide dropdown when input loses focus (with small delay for click handling)
        categoryInput.addEventListener('blur', (e) => {
            setTimeout(() => {
                if (!categoryDropdown.contains(document.activeElement)) {
                    hideDropdown();
                }
            }, 100);
        });
    }
    
    // Initialize category autocomplete functionality
    setupCategoryAutocomplete();
    
    // Name Autocomplete Functionality (Add Variants)
    function setupNameAutocomplete() {
        const nameInput = document.getElementById('inlineItemName');
        const nameDropdown = document.getElementById('nameDropdown');
        
        if (!nameInput || !nameDropdown) return;
        
        // Move dropdown to body to escape modal clipping
        document.body.appendChild(nameDropdown);
        
        let isDropdownVisible = false;
        let typingTimer = null;
        let hideTimer = null;
        let isDropdownHovered = false;
        const TYPING_PAUSE_THRESHOLD = 1000; // 1 seconds of no typing
        const AUTO_HIDE_DELAY = 1000; // 1 seconds after pause
        
        // Show dropdown with "Add Variants" option
        function showDropdown() {
            nameDropdown.innerHTML = '';
            
            // Position dropdown below the input field
            const inputRect = nameInput.getBoundingClientRect();
            nameDropdown.style.top = (inputRect.bottom + 2) + 'px';
            nameDropdown.style.left = inputRect.left + 'px';
            nameDropdown.style.width = inputRect.width + 'px';
            
            // Create "Add Variants?" option
            const addVariantsOption = document.createElement('div');
            addVariantsOption.className = 'name-option add-variants';
            addVariantsOption.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                    <div style="display: flex; flex-direction: column;">
                        <span>Have variants?</span>
                        <span class="name-helper">Otherwise, Ignore this</span>
                    </div>
                    <span class="name-variants-indicator">+ Add Variants</span>
                </div>
            `;
            
            // Prevent blur when clicking on add variants option
            addVariantsOption.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
            
            addVariantsOption.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Show variants section and hide price row
                showVariantsSection();
                hideDropdown();
            });
            
            nameDropdown.appendChild(addVariantsOption);
            nameDropdown.classList.add('show');
            isDropdownVisible = true;
            
            // Add hover detection to dropdown
            nameDropdown.addEventListener('mouseenter', () => {
                isDropdownHovered = true;
                // Clear hide timer when hovering
                if (hideTimer) {
                    clearTimeout(hideTimer);
                    hideTimer = null;
                }
            });
            
            nameDropdown.addEventListener('mouseleave', () => {
                isDropdownHovered = false;
                // Restart hide timer when leaving dropdown
                if (isDropdownVisible) {
                    hideTimer = setTimeout(() => {
                        hideDropdown();
                    }, AUTO_HIDE_DELAY);
                }
            });
        }
        
        // Hide dropdown
        function hideDropdown() {
            // Clear all timers when manually hiding
            if (typingTimer) {
                clearTimeout(typingTimer);
                typingTimer = null;
            }
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
            nameDropdown.classList.remove('show');
            isDropdownVisible = false;
            isDropdownHovered = false;
        }
        
        // Event listeners
        nameInput.addEventListener('focus', () => {
            if (nameInput.value.trim() !== '' && !isVariantsMode) {
                showDropdown();
            }
        });
        
        nameInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            
            // Clear existing timers
            if (typingTimer) clearTimeout(typingTimer);
            if (hideTimer) clearTimeout(hideTimer);
            
            if (searchTerm !== '' && !isVariantsMode) {
                // Show dropdown immediately only if not in variants mode
                showDropdown();
                
                // Set typing pause detection
                typingTimer = setTimeout(() => {
                    // User stopped typing, start hide countdown only if not hovering
                    if (!isDropdownHovered) {
                        hideTimer = setTimeout(() => {
                            // Double-check hover state before hiding
                            if (!isDropdownHovered) {
                                hideDropdown();
                            }
                        }, AUTO_HIDE_DELAY);
                    }
                }, TYPING_PAUSE_THRESHOLD);
            } else {
                hideDropdown();
            }
        });
        
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && isDropdownVisible) {
                e.preventDefault();
                // No action when Enter is pressed - dropdown stays open
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideDropdown();
                nameInput.blur();
            }
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!nameInput.contains(e.target) && !nameDropdown.contains(e.target)) {
                hideDropdown();
            }
        });
        
        // Hide dropdown when input loses focus (with small delay for click handling)
        nameInput.addEventListener('blur', (e) => {
            setTimeout(() => {
                if (!nameDropdown.contains(document.activeElement)) {
                    hideDropdown();
                }
            }, 100);
        });
    }
    
    // Initialize name autocomplete functionality
    setupNameAutocomplete();
    
    // Variants Functionality
    let isVariantsMode = false;
    
    function showVariantsSection() {
        const priceRow = document.getElementById('priceRow');
        const variantsSection = document.getElementById('variantsSection');
        const mainTrackStockToggle = document.getElementById('inlineTrackStockToggle');
        
        if (priceRow && variantsSection) {
            priceRow.style.display = 'none';
            variantsSection.style.display = 'block';
            isVariantsMode = true;
            
            // Uncheck main track stock toggle when switching to variants mode
            if (mainTrackStockToggle && mainTrackStockToggle.checked) {
                mainTrackStockToggle.checked = false;
                // Trigger change event to hide stock fields
                mainTrackStockToggle.dispatchEvent(new Event('change'));
            }
            
            // Always add a variant row when opening variants section
            addVariantRow();
        }
    }

    // Expose helper to reset name dropdown/variants state from other scripts
    window.resetNameDropdownState = function() {
        try {
            isVariantsMode = false;
            const nameInput = document.getElementById('inlineItemName');
            if (nameInput) {
                // Small delay to allow DOM changes to settle
                setTimeout(function() {
                    // Only trigger dropdown if the field has content
                    if (nameInput.value && nameInput.value.trim() !== '') {
                        nameInput.focus();
                        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, 60);
            }
        } catch (e) {
            console.error('resetNameDropdownState error', e);
        }
    };
    
    function hasVariantsData() {
        const tableBody = document.getElementById('variantsTableBody');
        if (!tableBody) return false;
        
        const rows = tableBody.querySelectorAll('tr');
        for (let row of rows) {
            const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
            for (let input of inputs) {
                // Ignore auto-filled inputs (they are not user-entered data unless edited)
                if (input.hasAttribute('data-auto-filled')) continue;
                if (input.value.trim() !== '') {
                    return true;
                }
            }
        }
        return false;
    }
    
    function hideVariantsSection() {
        const priceRow = document.getElementById('priceRow');
        const variantsSection = document.getElementById('variantsSection');
        
        if (priceRow && variantsSection) {
            priceRow.style.display = 'flex';
            variantsSection.style.display = 'none';
            isVariantsMode = false;
            
            // Clear variants table
            const tableBody = document.getElementById('variantsTableBody');
            if (tableBody) {
                tableBody.innerHTML = '';
            }
        }
    }
    
    function addVariantRow() {
        const tableBody = document.getElementById('variantsTableBody');
        const trackStockToggle = document.getElementById('variantsTrackStockToggle');
        if (!tableBody) return;
        
        const isTrackingStock = trackStockToggle && trackStockToggle.checked;
        
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #444';
        
        const stockColumns = isTrackingStock ? `
            <td class="stock-column" style="padding: 8px;">
                <div class="input-with-unit-selector">
                    <input type="text" class="variant-stock" style="width: 100%; padding: 6px; background: transparent; border: 1px solid #555; color: #dbdbdb; border-radius: 4px; font-size: 12px; padding-right: 60px;">
                    <div class="unit-selector">
                        <span class="unit-prefix">|</span>
                        <span class="unit-value">- -</span>
                        <div class="unit-arrows">
                            <button type="button" class="unit-arrow unit-up">▲</button>
                            <button type="button" class="unit-arrow unit-down">▼</button>
                        </div>
                    </div>
                </div>
            </td>
            <td class="stock-column" style="padding: 8px;">
                <div class="input-with-unit-selector">
                    <input type="text" class="variant-low-stock" style="width: 100%; padding: 6px; background: transparent; border: 1px solid #555; color: #dbdbdb; border-radius: 4px; font-size: 12px; padding-right: 60px;">
                    <div class="unit-selector">
                        <span class="unit-prefix">|</span>
                        <span class="unit-value">- -</span>
                        <div class="unit-arrows">
                            <button type="button" class="unit-arrow unit-up">▲</button>
                            <button type="button" class="unit-arrow unit-down">▼</button>
                        </div>
                    </div>
                </div>
            </td>
        ` : `
            <td class="stock-column" style="padding: 8px; display: none;"></td>
            <td class="stock-column" style="padding: 8px; display: none;"></td>
        `;
        
        row.innerHTML = `
            <td style="padding: 8px; text-align: center;">
                <input type="checkbox" class="variant-available" style="cursor: pointer;" checked>
            </td>
            <td style="padding: 8px;">
                <input type="text" class="variant-name" required style="width: 100%; padding: 6px; background: transparent; border: none; border-bottom: 1px solid #555; color: #dbdbdb; border-radius: 4px; font-size: 12px;">
            </td>
            <td style="padding: 8px;">
                <input type="text" class="variant-price" currency-localization="₱" style="width: 100%; padding: 6px; background: transparent; border: none; border-bottom: 1px solid #555; color: #dbdbdb; border-radius: 4px; font-size: 12px;">
            </td>
            <td style="padding: 8px;">
                <input type="text" class="variant-cost" currency-localization="₱" style="width: 100%; padding: 6px; background: transparent; border: none; border-bottom: 1px solid #555; color: #dbdbdb; border-radius: 4px; font-size: 12px;">
            </td>
            ${stockColumns}
            <td style="padding: 8px;">
                <input type="text" class="variant-sku" style="width: 100%; padding: 6px; background: transparent; border: none; border-bottom: 1px solid #555; color: #dbdbdb; border-radius: 4px; font-size: 12px;">
            </td>
            <td style="padding: 8px;">
                <input type="text" class="variant-barcode" style="width: 100%; padding: 6px; background: transparent; border: none; border-bottom: 1px solid #555; color: #dbdbdb; border-radius: 4px; font-size: 12px;">
            </td>
            <td style="padding: 8px; text-align: center;">
                <button type="button" class="delete-variant-btn" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s ease;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);

        // Mark the variant SKU input as required for browser validation
        var createdSkuInput = row.querySelector('input.variant-sku');
        if (createdSkuInput) {
            createdSkuInput.setAttribute('required', 'required');
        }
        
        // Setup currency inputs for this row
        const currencyInputs = row.querySelectorAll('input[currency-localization]');
        if (currencyInputs.length > 0 && typeof setupCurrencyInputs === 'function') {
            setupCurrencyInputs(currencyInputs);
        }
        
        // Add delete functionality to the new row
        const deleteBtn = row.querySelector('.delete-variant-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                // Check if row has any data before confirming deletion
                const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
                let hasData = false;
                
                inputs.forEach(input => {
                    if (input.value.trim() !== '') {
                        hasData = true;
                    }
                });
                
                // Show confirmation dialog if row has data
                if (hasData) {
                    if (confirm('Are you sure you want to delete this variant? All entered data will be lost.')) {
                        row.remove();
                    }
                } else {
                    // No data, delete immediately
                    row.remove();
                }
            });
        }
        
        // Setup unit selectors for stock fields if tracking stock
        if (isTrackingStock) {
            setupUnitSelector();
        }

        // Fetch and populate SKU for the newly added variant if it's empty
        (function populateVariantSKU() {
            try {
                var skuInput = row.querySelector('input.variant-sku');
                if (!skuInput) return;
                // Only fetch if field is currently empty
                if (skuInput.value && skuInput.value.trim() !== '') return;
                fetch('get_next_sku.php')
                    .then(function(resp) { return resp.json(); })
                    .then(function(data) {
                        if (data && data.next_sku) {
                            skuInput.value = data.next_sku;
                            // Mark as auto-filled so closing variants ignores it until user edits
                            skuInput.setAttribute('data-auto-filled', 'true');
                            // Remove auto-filled flag if user modifies the field
                            skuInput.addEventListener('input', function onEdit() {
                                skuInput.removeAttribute('data-auto-filled');
                                skuInput.removeEventListener('input', onEdit);
                            });
                        }
                    })
                    .catch(function(err) {
                        console.error('Failed to fetch variant SKU:', err);
                    });
            } catch (e) {
                console.error('populateVariantSKU error', e);
            }
        })();
    }
    
    function toggleVariantsStockColumns() {
        const trackStockToggle = document.getElementById('variantsTrackStockToggle');
        const stockColumns = document.querySelectorAll('.stock-column');
        const variantsTable = document.querySelector('.variants-table');
        
        console.log('toggleVariantsStockColumns called');
        console.log('trackStockToggle found:', !!trackStockToggle);
        console.log('variantsTable found:', !!variantsTable);
        
        if (!trackStockToggle) return;
        
        const isTracking = trackStockToggle.checked;
        console.log('isTracking:', isTracking);
        
        // Add/remove class to control table width
        if (variantsTable) {
            if (isTracking) {
                variantsTable.classList.add('with-stock');
                console.log('Added with-stock class');
                console.log('Table classes:', variantsTable.className);
                console.log('Table width:', variantsTable.style.width || 'CSS controlled');
            } else {
                variantsTable.classList.remove('with-stock');
                console.log('Removed with-stock class');
            }
        }
        
        // Show/hide stock columns
        stockColumns.forEach(column => {
            column.style.display = isTracking ? 'table-cell' : 'none';
        });
        
        // Update existing rows
        const existingRows = document.querySelectorAll('#variantsTableBody tr');
        existingRows.forEach(row => {
            const stockCells = row.querySelectorAll('.stock-column');
            stockCells.forEach((cell, index) => {
                if (isTracking && !cell.querySelector('input')) {
                    // Add stock input if tracking is enabled and cell is empty
                    const isInStock = index === 0;
                    const placeholder = isInStock ? 'Stock qty' : 'Low stock';
                    const className = isInStock ? 'variant-stock' : 'variant-low-stock';
                    
                    cell.innerHTML = `
                        <div class="input-with-unit-selector">
                            <input type="text" class="${className}" style="width: 100%; padding: 6px; background: transparent; border: none; border-bottom: 1px solid #555; color: #dbdbdb; border-radius: 4px; font-size: 12px; padding-right: 60px;">
                            <div class="unit-selector">
                                <span class="unit-prefix">|</span>
                                <span class="unit-value">- -</span>
                                <div class="unit-arrows">
                                    <button type="button" class="unit-arrow unit-up">▲</button>
                                    <button type="button" class="unit-arrow unit-down">▼</button>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (!isTracking) {
                    // Clear content if tracking is disabled
                    cell.innerHTML = '';
                }
                cell.style.display = isTracking ? 'table-cell' : 'none';
            });
        });
        
        // Setup unit selectors for new stock fields
        if (isTracking) {
            setupUnitSelector();
        }
    }
    
    // Set up variants event listeners
    const closeVariantsBtn = document.getElementById('closeVariantsBtn');
    const addVariantBtn = document.querySelector('.variants-add-btn');
    const variantsTrackStockToggle = document.getElementById('variantsTrackStockToggle');
    
    if (closeVariantsBtn) {
        console.log('Close variants button found, adding event listener');
        closeVariantsBtn.addEventListener('click', function() {
            console.log('Close variants button clicked!');
            
            // Check if there's data before closing
            if (hasVariantsData()) {
                if (confirm('Are you sure you want to close? All entered variant data will be lost.')) {
                    hideVariantsSection();
                }
            } else {
                // No data, close immediately
                hideVariantsSection();
            }
        });
    } else {
        console.log('Close variants button not found');
    }
    
    if (addVariantBtn) {
        addVariantBtn.addEventListener('click', () => {
            addVariantRow();
        });
    }
    
    if (variantsTrackStockToggle) {
        variantsTrackStockToggle.addEventListener('change', toggleVariantsStockColumns);
    }
    
    // Track Stock Toggle Functionality
    function setupTrackStockToggle() {
        const trackStockToggle = document.getElementById('inlineTrackStockToggle');
        const stockFieldsRow = document.getElementById('stockFieldsRow');
        const inStockInput = document.getElementById('inlineInStock');
        const lowStockInput = document.getElementById('inlineLowStock');
        
        if (!trackStockToggle || !stockFieldsRow) return;
        
        // Handle toggle change
        trackStockToggle.addEventListener('change', function() {
            if (this.checked) {
                // Show stock fields
                stockFieldsRow.style.display = 'flex';
                // Do NOT make fields required
            } else {
                // Hide stock fields
                stockFieldsRow.style.display = 'none';
                // Clear values only
                if (inStockInput) {
                    inStockInput.value = '';
                }
                if (lowStockInput) {
                    lowStockInput.value = '';
                }
            }
        });
        
        // Initialize state (hidden by default)
        stockFieldsRow.style.display = 'none';
    }
    
    // Initialize track stock toggle functionality
    setupTrackStockToggle();
    
    // Unit Selector Functionality
    function setupUnitSelector() {
        // Available units in order
        const units = ['- -', 'pcs', 'kg', 'L'];

        // Find all inputs with unit selectors
        const unitInputs = document.querySelectorAll('.input-with-unit-selector input');

        // Helper to sync suffix between all stock/low stock fields (main and variants)
        function syncAllUnitSuffixes(newUnitText, sourceInput) {
            // Sync main product fields
            const inStockInput = document.getElementById('inlineInStock');
            const lowStockInput = document.getElementById('inlineLowStock');
            if (inStockInput) {
                const inStockUnit = inStockInput.parentElement.querySelector('.unit-value');
                if (inStockUnit && sourceInput !== inStockInput) inStockUnit.textContent = newUnitText;
            }
            if (lowStockInput) {
                const lowStockUnit = lowStockInput.parentElement.querySelector('.unit-value');
                if (lowStockUnit && sourceInput !== lowStockInput) lowStockUnit.textContent = newUnitText;
            }
            // Sync all variant stock/low stock fields
            const variantStockInputs = document.querySelectorAll('.variant-stock');
            const variantLowStockInputs = document.querySelectorAll('.variant-low-stock');
            variantStockInputs.forEach(variantInput => {
                const variantUnit = variantInput.parentElement.querySelector('.unit-value');
                if (variantUnit && sourceInput !== variantInput) variantUnit.textContent = newUnitText;
            });
            variantLowStockInputs.forEach(variantInput => {
                const variantUnit = variantInput.parentElement.querySelector('.unit-value');
                if (variantUnit && sourceInput !== variantInput) variantUnit.textContent = newUnitText;
            });
        }

        unitInputs.forEach(function(input) {
            const container = input.parentElement;
            const unitSelector = container.querySelector('.unit-selector');
            const unitValue = container.querySelector('.unit-value');
            const upArrow = container.querySelector('.unit-up');
            const downArrow = container.querySelector('.unit-down');

            if (!unitSelector || !unitValue) return;

            let currentUnitIndex = 0; // Start with "- -"

            // Function to update unit display
            function updateUnit(syncOther) {
                unitValue.textContent = units[currentUnitIndex];
                // Sync suffix instantly if needed
                if (syncOther) {
                    syncAllUnitSuffixes(units[currentUnitIndex], input);
                }
            }
            // Also sync on focus/click of any input
            input.addEventListener('focus', function() {
                syncAllUnitSuffixes(unitValue.textContent, input);
                unitSelector.classList.add('show');
            });

            // Function to change unit
            function changeUnit(direction) {
                if (direction === 'up') {
                    currentUnitIndex = (currentUnitIndex + 1) % units.length;
                } else {
                    currentUnitIndex = (currentUnitIndex - 1 + units.length) % units.length;
                }
                updateUnit(true);
            }

            // Handle input event - validate input
            input.addEventListener('input', function() {
                let value = this.value;

                // Only allow numbers and decimal points
                value = value.replace(/[^\d.]/g, '');

                // Ensure only one decimal point
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }

                // Update input value
                this.value = value;
            });

            // Handle keydown for validation and unit switching
            input.addEventListener('keydown', function(e) {
                // Handle arrow up/down for unit switching when input has focus
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const direction = e.key === 'ArrowUp' ? 'up' : 'down';
                    changeUnit(direction);
                    return;
                }

                // Allow only numbers, decimal point, and navigation keys
                if (!/[\d.]/.test(e.key) && 
                    !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) &&
                    !(e.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase()))) {
                    e.preventDefault();
                }
            });

            // Handle blur to format the value and conditionally hide unit selector
            input.addEventListener('blur', function() {
                let value = this.value.trim();

                // If empty, clear completely and hide unit selector
                if (value === '') {
                    this.value = '';
                    unitSelector.classList.remove('show');
                    return;
                }

                // Validate and format the numeric value
                const floatValue = parseFloat(value);
                if (!isNaN(floatValue) && floatValue >= 0) {
                    // Format the value (remove trailing zeros)
                    const formattedValue = floatValue % 1 === 0 ? floatValue.toString() : floatValue.toFixed(2).replace(/\.?0+$/, '');
                    this.value = formattedValue;
                    // Keep unit selector visible when there's valid data
                    unitSelector.classList.add('show');
                } else {
                    this.value = '';
                    unitSelector.classList.remove('show');
                }
            });

            // Handle focus to show unit selector
            input.addEventListener('focus', function() {
                unitSelector.classList.add('show');
            });

            // Prevent blur when clicking on unit selector elements
            unitSelector.addEventListener('mousedown', function(e) {
                e.preventDefault(); // Prevent blur from firing
            });

            // Handle arrow button clicks
            if (upArrow) {
                upArrow.addEventListener('click', function(e) {
                    e.preventDefault();
                    changeUnit('up');
                    input.focus(); // Keep input focused
                });
            }

            if (downArrow) {
                downArrow.addEventListener('click', function(e) {
                    e.preventDefault();
                    changeUnit('down');
                    input.focus(); // Keep input focused
                });
            }

            // Initialize unit display
            updateUnit();
        });
    }
    
    // Initialize unit selector functionality
    setupUnitSelector();
    
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const addProductForm = document.getElementById('add-product-form');
    const searchInput = document.getElementById('search-inventory');

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

    // Display inventory in table
    function displayInventory(products) {
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
                    <!-- Actions like edit/delete can be added here -->
                    <button class="edit-btn" data-id="${product.id}">Edit</button>
                    <button class="delete-btn" data-id="${product.id}">Delete</button>
                </td>
            `;
            inventoryTableBody.appendChild(tr);
        });
    }

    // Handle add product form submission (will be implemented later)
    // addProductForm.addEventListener('submit', function (e) {
    //     // Form submission logic will be added after barcode scanning
    //     // No duplicate SKU error handling needed
    // });

    // Search filter
    searchInput.addEventListener('input', function () {
        const filter = searchInput.value.toLowerCase();
        const rows = inventoryTableBody.getElementsByTagName('tr');
        Array.from(rows).forEach(row => {
            const productName = row.cells[0].textContent.toLowerCase();
            if (productName.indexOf(filter) > -1) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });

    // Initial fetch
    fetchInventory();

    // Scanner Modal Logic
    const addBtn = document.getElementById('addProductBtn');
    const closeScanner = document.getElementById('closeScanner');
    const scanTab = document.getElementById('scanTab');
    const manualTab = document.getElementById('manualTab');
    const scannerMode = document.getElementById('scannerMode');
    const manualMode = document.getElementById('manualMode');
    const cameraScanner = document.getElementById('cameraScanner');
    const hardwareScanner = document.getElementById('hardwareScanner');
    const nextBtn = document.getElementById('nextBtn');
    const skipScannerBtn = document.getElementById('skipScanner');
    const skipManualEntryBtn = document.getElementById('skipManualEntry');
    const addItemsModal = document.getElementById('addItemsModal');
    const addItemsModalContent = addItemsModal ? addItemsModal.querySelector('.modal-content') : null;
    const closeAddItemsBtn = document.getElementById('closeAddItems');
    const inlineAddItemsMount = document.getElementById('inlineAddItemsMount');
    const inlineTpl = document.getElementById('inlineAddItemsTemplate');
    const baseAddFlow = document.getElementById('baseAddFlow');

    function resetAddItemsAnim() {
        if (!addItemsModal || !addItemsModalContent) return;
        addItemsModal.classList.remove('fb-backdrop-in', 'fb-backdrop-out');
        addItemsModalContent.classList.remove('fb-modal-in', 'fb-modal-out');
        addItemsModalContent.classList.remove('modal-slide-in', 'modal-slide-left');
    }

    // Show Add Items modal with transition (animate content only)
    function showAddItemsModalWithTransition() {
        if (!addItemsModal || !addItemsModalContent) return;
        resetAddItemsAnim();
        addItemsModal.style.display = 'flex'; // center using flex; no backdrop anim
        // Force reflow for content anim
        void addItemsModalContent.offsetWidth;
        addItemsModalContent.classList.add('modal-slide-in');
        addItemsModalContent.addEventListener('animationend', function handler() {
            addItemsModalContent.classList.remove('modal-slide-in');
            addItemsModalContent.removeEventListener('animationend', handler);
            // After modal slide-in finishes, focus the name input if present
            try {
                const inlineName = document.getElementById('inlineItemName');
                if (inlineName) {
                    // small timeout to ensure layout settled
                    setTimeout(() => { try { inlineName.focus(); } catch (e) {} }, 40);
                }
            } catch (e) {}
        });
    }

    // Hide Add Items modal with transition (animate content only)
    function closeAddItemsModal() {
        if (!addItemsModal || !addItemsModalContent) return;
        // Content out only; no backdrop animation
        addItemsModalContent.classList.remove('modal-slide-in');
        addItemsModalContent.classList.add('modal-slide-left');
        addItemsModalContent.addEventListener('animationend', function handler() {
            addItemsModal.style.display = 'none';
            addItemsModalContent.classList.remove('modal-slide-left');
            addItemsModalContent.removeEventListener('animationend', handler);
        });
    }

    // Attach event listeners to skip buttons
    if (skipScannerBtn) {
        skipScannerBtn.addEventListener('click', function () {
            // Prefer inline panel if mount and template exist
            if (inlineAddItemsMount && inlineTpl) {
                openInlineAddItemsPanel();
            } else {
                showAddItemsModalWithTransition();
            }
        });
    }
    if (skipManualEntryBtn) {
        skipManualEntryBtn.addEventListener('click', function () {
            if (inlineAddItemsMount && inlineTpl) {
                openInlineAddItemsPanel();
            } else {
                showAddItemsModalWithTransition();
            }
        });
    }
    if (closeAddItemsBtn) {
        closeAddItemsBtn.addEventListener('click', function () {
            closeAddItemsModal();
        });
    }

    // Inline Add Items Panel logic
    function openInlineAddItemsPanel() {
        // Guard: already open
        if (document.getElementById('inlineAddItemsPanel')) return;
        const node = inlineTpl.content.firstElementChild.cloneNode(true);
        inlineAddItemsMount.appendChild(node);
        if (baseAddFlow) baseAddFlow.classList.add('slide-out-left');
        requestAnimationFrame(() => {
            node.classList.add('show');
        });

        // Focus name after inline panel transition completes
        setTimeout(() => {
            try {
                const inlineName = node.querySelector('#inlineItemName') || document.getElementById('inlineItemName');
                if (inlineName) inlineName.focus();
            } catch (e) { /* ignore */ }
        }, 420); // closeInlineAddItemsPanel uses 400ms for removal

        // Close button handler
        const backBtn = node.querySelector('#backInlineAddItems');
        if (backBtn) {
            // Remove previous listeners by replacing the node
            const newBackBtn = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBackBtn, backBtn);
            newBackBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // If previousTab is 'manual', go to 'manual' (preserve manual flow), else go to previousTab or fallback to 'scan'
                if (typeof previousTab !== 'undefined' && previousTab === 'manual') {
                    showTab('manual');
                } else if (typeof previousTab !== 'undefined' && previousTab) {
                    showTab(previousTab);
                } else {
                    showTab('scan');
                }
            });
        }

        // Submit handler
        const form = node.querySelector('#inlineAddItemsForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const name = node.querySelector('#inlineItemName').value.trim();
                const category = node.querySelector('#inlineItemCategory').value.trim();
                const trackStock = node.querySelector('#inlineTrackStock').checked;
                const availablePOS = node.querySelector('#inlineAvailablePOS').checked;
                let inStock = '';
                let lowStock = '';
                if (trackStock) {
                    const inStockInput = node.querySelector('#inlineInStock');
                    const inStockUnit = node.querySelector('#inlineInStockUnit');
                    const lowStockInput = node.querySelector('#inlineLowStock');
                    const lowStockUnit = node.querySelector('#inlineLowStockUnit');
                    if (inStockInput && inStockUnit) {
                        inStock = inStockInput.value.trim() + ' ' + inStockUnit.textContent.trim();
                    }
                    if (lowStockInput && lowStockUnit) {
                        lowStock = lowStockInput.value.trim() + ' ' + lowStockUnit.textContent.trim();
                    }
                }
                console.log('Inline Add Item:', { name, category, trackStock, availablePOS, inStock, lowStock });
                // TODO: send inStock and lowStock with unit to API
                closeInlineAddItemsPanel();
                return false;
            });
        }
    }

    function closeInlineAddItemsPanel() {
        const panel = document.getElementById('inlineAddItemsPanel');
        if (!panel) return;
        panel.classList.remove('show');
        // Wait for CSS transition
        setTimeout(() => {
            panel.remove();
            if (baseAddFlow) baseAddFlow.classList.remove('slide-out-left');
        }, 400);
    }
    
    // Debug: Check if elements exist
    console.log('Scanner Modal Elements Check:');
    console.log('scannerModal:', scannerModal);
    console.log('addBtn:', addBtn);
    console.log('closeScanner:', closeScanner);
    console.log('scanTab:', scanTab);
    console.log('manualTab:', manualTab);
    
    let cameraStream = null;
    let isManualMode = false;
    let cameraDecodeActive = false;
    let cameraDecodeLast = 0;
    let cameraDecodeHandle = null;
    let quaggaActive = false;
    
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
            const videoEl = document.getElementById('cameraVideo');
            if (!videoEl) {
                console.error('cameraVideo element not found in DOM');
            } else {
                // Mute the video to satisfy autoplay policies in many browsers
                try {
                    videoEl.muted = true;
                    videoEl.setAttribute('muted', '');
                    videoEl.playsInline = true;
                } catch (e) {}

                // Ensure the video fills the camera container so it's visible
                try {
                    videoEl.style.width = '100%';
                    videoEl.style.height = '100%';
                    videoEl.style.objectFit = 'cover';
                    videoEl.style.background = '#000';
                } catch (e) {}

                videoEl.srcObject = cameraStream;
            }
            // Debug: log stream and tracks info
            try {
                console.debug('[Camera] stream tracks:', cameraStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, id: t.id })));
                const videoTrack = cameraStream.getVideoTracks()[0];
                if (videoTrack) console.debug('[Camera] track settings:', videoTrack.getSettings());
            } catch (e) { console.warn('[Camera] debug info failed', e); }
            try {
                const playPromise = videoEl.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise.then(() => { console.debug('[Camera] video.play() resolved'); startQuaggaScanner(); }).catch((err) => { console.warn('[Camera] video.play() rejected, continuing to start scanner', err); startQuaggaScanner(); });
                } else {
                    startQuaggaScanner();
                }
            } catch (e) {
                console.warn('Error starting video play', e);
                startQuaggaScanner();
            }
            return true;
        } catch (error) {
            console.error('Camera access denied:', error);
            return false;
        }
    }

    // Load QuaggaJS if not already loaded
    function ensureQuaggaLoaded(callback) {
        if (window.Quagga) {
            callback();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js';
        script.onload = callback;
        document.body.appendChild(script);
    }

    // Start QuaggaJS barcode scanner
    function startQuaggaScanner() {
        ensureQuaggaLoaded(() => {
            if (!window.Quagga) {
                alert('Barcode scanner library failed to load.');
                return;
            }
            if (window.Quagga.initialized) {
                window.Quagga.stop();
                window.Quagga.initialized = false;
            }
            console.log('[Quagga] Initializing...');
            window.Quagga.init({
                inputStream: {
                    name: 'Live',
                    type: 'LiveStream',
                    target: document.getElementById('cameraScanner'),
                    // Restrict the scanning region to the visible guide inside
                    // the camera container (matches guide: left 10%, top 22%, width 80%, height 56%)
                    area: {
                        top: '22%',
                        right: '5%',
                        left: '5%',
                        bottom: '20%'
                    },
                    constraints: {
                        facingMode: 'environment',
                        width: 640,
                        height: 480
                    }
                },
                decoder: {
                    readers: [
                        'ean_reader',
                        'ean_8_reader',
                        'code_128_reader',
                        'upc_reader',
                        'upc_e_reader',
                        'code_39_reader',
                        'code_39_vin_reader',
                        'codabar_reader',
                        'i2of5_reader',
                        '2of5_reader',
                        'code_93_reader'
                    ]
                },
                locate: true
            }, function(err) {
                if (err) {
                    console.error('[Quagga] init error:', err);
                    alert('Failed to initialize barcode scanner.');
                    return;
                }
                window.Quagga.initialized = true;
                window.Quagga.start();
                console.log('[Quagga] Started');

                // Create an overlay INSIDE the visible camera container so it
                // always appears over the <video> element. This avoids fixed
                // body overlays and keeps the guide aligned with the camera area.
                try {
                    // Prefer the explicit camera container in the modal
                    const cameraContainer = document.querySelector('.camera-container') || document.getElementById('cameraScanner') && document.getElementById('cameraScanner').parentElement;
                    if (cameraContainer) {
                        // Ensure the container is a positioned element so absolute
                        // children align to it. Don't override if already positioned.
                        const computed = window.getComputedStyle(cameraContainer);
                        if (!computed || computed.position === 'static') {
                            cameraContainer.style.position = 'relative';
                        }

                        // Remove existing overlay if present
                        const prev = cameraContainer.querySelector('#cameraOverlay');
                        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);

                        const overlay = document.createElement('div');
                        overlay.id = 'cameraOverlay';
                        overlay.style.position = 'absolute';
                        overlay.style.top = '0';
                        overlay.style.left = '0';
                        overlay.style.width = '100%';
                        overlay.style.height = '100%';
                        overlay.style.pointerEvents = 'none';
                        overlay.style.zIndex = '60';
                        overlay.style.boxSizing = 'border-box';

                        const guide = document.createElement('div');
                        guide.id = 'cameraOverlayGuide';
                        guide.style.position = 'absolute';
                        guide.style.left = '10%';
                        guide.style.top = '22%';
                        guide.style.width = '80%';
                        guide.style.height = '56%';
                        guide.style.border = '2px dashed rgba(255,255,255,0.95)';
                        guide.style.borderRadius = '8px';
                        guide.style.boxSizing = 'border-box';
                        guide.style.display = 'flex';
                        guide.style.alignItems = 'center';
                        guide.style.justifyContent = 'center';
                        guide.style.pointerEvents = 'none';

                        const hint = document.createElement('div');
                        hint.textContent = 'Align barcode inside the box';
                        hint.style.color = '#fff';
                        hint.style.fontSize = '13px';
                        hint.style.fontWeight = '600';
                        hint.style.textShadow = '0 1px 3px rgba(0,0,0,0.6)';
                        hint.style.pointerEvents = 'none';
                        guide.appendChild(hint);

                        overlay.appendChild(guide);
                        cameraContainer.appendChild(overlay);

                        // Provide cleanup so stopScanner can remove the overlay
                        const prevCleanup = window._cameraOverlayCleanup;
                        window._cameraOverlayCleanup = function() {
                            try {
                                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                            } catch (e) { /* ignore */ }
                            if (typeof prevCleanup === 'function') prevCleanup();
                        };
                    }
                } catch (e) {
                    console.warn('[DEBUG] Failed to create in-container camera overlay:', e);
                }
            });
            window.Quagga.onProcessed(function(result) {
                // Draw debug info on canvas if needed
                if (result) {
                    if (result.boxes) {
                        console.log('[Quagga] Detected boxes:', result.boxes.length);
                    }
                    if (result.codeResult && result.codeResult.code) {
                        console.log('[Quagga] Processed code:', result.codeResult.code);
                    }
                }
            });
            // Require multiple identical reads before accepting a barcode
            let lastBarcode = null;
            let barcodeCount = 0;
            let noisyReads = 0;
            let adaptiveRequiredIdentical = 4;
            const MIN_IDENTICAL = 6; // Require more identical reads for higher accuracy
            const MAX_IDENTICAL = 10;
            const CONFIDENCE_THRESHOLD = 0.85; // Higher is better
            const BLURRY_ERROR_THRESHOLD = 0.35; // Lower is better


            // Overlay message for scan status and errors
            let scanTimeout = null;
            let scanErrorTimeout = null;
            let scanMessage = document.getElementById('scanStatusMessage');
            if (!scanMessage) {
                scanMessage = document.createElement('div');
                scanMessage.id = 'scanStatusMessage';
                scanMessage.style.position = 'absolute';
                scanMessage.style.top = '50%';
                scanMessage.style.left = '50%';
                scanMessage.style.transform = 'translate(-50%, -50%)';
                scanMessage.style.background = 'rgba(30,30,30,0.92)';
                scanMessage.style.color = '#ff9800';
                scanMessage.style.padding = '18px 28px';
                scanMessage.style.borderRadius = '12px';
                scanMessage.style.fontSize = '18px';
                scanMessage.style.fontWeight = '600';
                scanMessage.style.zIndex = '9999';
                scanMessage.style.display = 'none';
                scanMessage.style.textAlign = 'center';
                let cameraContainer = document.querySelector('.camera-container');
                if (cameraContainer) cameraContainer.appendChild(scanMessage);
            }
            function showScanMessage(msg, color) {
                scanMessage.textContent = msg;
                scanMessage.style.display = 'block';
                scanMessage.style.color = color || '#ff9800';
            }
            function hideScanMessage() {
                scanMessage.style.display = 'none';
            }
            // Removed: No barcode detected message after 12 seconds

            // Show 'Hold steady' only if barcodes are being detected but not enough identical reads
            let holdSteadyTimeout = null;
            let lastDetectedTime = Date.now();


            // Play sound on successful scan
            function playScanSound() {
                try {
                    let audio = document.getElementById('scanBeepAudio');
                    if (!audio) {
                        audio = document.createElement('audio');
                        audio.id = 'scanBeepAudio';
                        audio.src = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/acoustic_grand_piano-mp3/A4.mp3';
                        audio.preload = 'auto';
                        document.body.appendChild(audio);
                    }
                    audio.currentTime = 0;
                    audio.play();
                } catch (e) {
                    console.warn('Scan beep sound failed:', e);
                }
            }

            window.Quagga.onDetected(function(result) {
                // Enhanced: Prevent scan if moving (blurry) or too close/far
                console.log('[Quagga] onDetected:', result);
                if (result && result.codeResult && result.codeResult.code) {
                    // Confidence threshold check
                    let confidence = 0;
                    if (typeof result.codeResult.confidence === 'number') {
                        confidence = result.codeResult.confidence;
                    } else if (Array.isArray(result.codeResult.decodedCodes)) {
                        // Estimate confidence from error values
                        let errors = result.codeResult.decodedCodes.map(d => d.error).filter(e => typeof e === 'number');
                        if (errors.length) {
                            confidence = 1 - Math.min(...errors);
                        }
                    }
                    // Check for blurry/moving
                    if (confidence < CONFIDENCE_THRESHOLD) {
                        if (confidence < (1 - BLURRY_ERROR_THRESHOLD)) {
                            showScanMessage('Hold steady. Image is blurry or moving.', '#ff9800');
                        }
                        return; // Ignore low-confidence reads
                    }
                    // Check bounding box size (too close or too far)
                    let box = null;
                    if (result.box && Array.isArray(result.box) && result.box.length === 4) {
                        box = result.box;
                    } else if (result.boxes && Array.isArray(result.boxes) && result.boxes.length > 0) {
                        // Use the largest box
                        box = result.boxes.reduce((a, b) => (a && a.length === 4 && b && b.length === 4 && boxArea(b) > boxArea(a)) ? b : a, result.boxes[0]);
                    }
                    function boxArea(b) {
                        if (!b || b.length !== 4) return 0;
                        // Calculate area of quadrilateral using Shoelace formula
                        return 0.5 * Math.abs(
                            b[0].x * b[1].y + b[1].x * b[2].y + b[2].x * b[3].y + b[3].x * b[0].y
                            - b[1].x * b[0].y - b[2].x * b[1].y - b[3].x * b[2].y - b[0].x * b[3].y
                        );
                    }
                    if (box) {
                        // Get video/canvas size for relative area
                        let video = document.getElementById('cameraVideo');
                        let vw = video ? video.videoWidth : 640;
                        let vh = video ? video.videoHeight : 480;
                        let frameArea = vw * vh;
                        let area = boxArea(box);
                        let relArea = area / frameArea;
                        // Too far: area too small; Too close: area too large
                        if (relArea < 0.02) {
                            showScanMessage('Too far', '#ff9800');
                            return;
                        }
                        if (relArea > 0.5) {
                            showScanMessage('Too close', '#ff9800');
                            return;
                        }
                    }
                    const code = result.codeResult.code;
                    lastDetectedTime = Date.now();
                    // Adaptive identical reads: if too many noisy reads, increase required identical
                    noisyReads++;
                    if (noisyReads > 12 && adaptiveRequiredIdentical < MAX_IDENTICAL) {
                        adaptiveRequiredIdentical++;
                        noisyReads = 0;
                        showScanMessage('Increasing scan accuracy...', '#ff9800');
                    }
                    if (holdSteadyTimeout) clearTimeout(holdSteadyTimeout);
                    if (barcodeCount < adaptiveRequiredIdentical - 1) {
                        holdSteadyTimeout = setTimeout(() => {
                            if (barcodeCount > 0 && barcodeCount < adaptiveRequiredIdentical) {
                                showScanMessage('Hold steady. Try refocusing or adjusting the camera.');
                            }
                        }, 2000);
                    }
                    if (code === lastBarcode) {
                        barcodeCount++;
                    } else {
                        lastBarcode = code;
                        barcodeCount = 1;
                    }
                    console.log(`[Quagga] Barcode candidate: ${code}, count: ${barcodeCount}, confidence: ${confidence}`);
                    if (barcodeCount >= adaptiveRequiredIdentical) {
                        window.Quagga.stop();
                        window.Quagga.initialized = false;
                        hideScanMessage();
                        if (scanTimeout) clearTimeout(scanTimeout);
                        if (scanErrorTimeout) clearTimeout(scanErrorTimeout);
                        if (holdSteadyTimeout) clearTimeout(holdSteadyTimeout);
                        playScanSound();
                        console.log('[Quagga] Barcode accepted:', code);
                        handleBarcodeScanTab(code);
                        // Reset for next scan (restart count)
                        lastBarcode = null;
                        barcodeCount = 0;
                        adaptiveRequiredIdentical = MIN_IDENTICAL;
                        noisyReads = 0;
                    }
                } else if (result && (!result.codeResult || !result.codeResult.code)) {
                    // If no code but boxes detected, and boxes are few, prompt focus/lighting
                    if (result.boxes && result.boxes.length > 0 && result.boxes.length < 2) {
                        showScanMessage('Image is blurry. Clean lens or adjust lighting.', '#ff9800');
                    }
                }
            });
            // Hide message if scan completes early
            window.Quagga.onDetected(function(result) {
                if (barcodeCount >= REQUIRED_IDENTICAL) {
                    hideScanMessage();
                    if (scanTimeout) clearTimeout(scanTimeout);
                }
            });
        });
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
                // On Enter, treat barcodeBuffer as scanned barcode
                handleBarcodeScanTab(barcodeBuffer);
                barcodeBuffer = '';
                document.removeEventListener('keypress', handleKeyPress);
            } else if (e.key.length === 1) {
                barcodeBuffer += e.key;
            }
        };
        
        document.addEventListener('keypress', handleKeyPress);
    }

    // Logic for scan tab: handle scanned barcode (single-term path logic)
    function handleBarcodeScanTab(barcode) {
        if (!barcode) return;
        fetch('api.php?find=barcode:' + encodeURIComponent(barcode))
            .then(res => res.json())
            .then(data => {
                if (data && data.found) {
                    if (Array.isArray(data.results) && data.results.length > 0) {
                        renderBarcodeResults(data.results, barcode, 'barcode');
                    } else if (data.product) {
                        renderBarcodeResults([data.product], barcode, 'barcode');
                    } else {
                        openAddItemsPrefill('', barcode, true); // pass true to indicate scanner context
                    }
                } else {
                    // Not found: show popup confirmation
                    showNotFoundConfirmation(
                        'No item found with barcode "' + barcode + '". Do you want to add it as a new item?',
                        function() { openAddItemsPrefill('', barcode, true); }, // open prefill (scanner context)
                        function() { /* Cancel: keep scanner running, no-op */ }
                    );
                }
            })
            .catch(err => {
                console.error('Error checking product existence', err);
                alert('Error checking product. Please try again.');
            });
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
        // Update tab tracking so Add Items back will return to scan
        try { previousTab = 'scan'; currentTab = 'scan'; } catch (e) {}
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
        
    // Intentionally keep camera running when switching to form mode
    // (user requested camera remain open while in Add Item).
    // stopCamera(); // removed to preserve camera stream
        
        // Update tab tracking so Add Items back will return to manual
        try { previousTab = 'manual'; currentTab = 'manual'; } catch (e) {}
    
    // Do not clear manual inputs here; keep user data
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
        // First check if product exists by calling API
        let query = '';
        if (sku) query = 'sku:' + encodeURIComponent(sku);
        else if (barcode) query = 'barcode:' + encodeURIComponent(barcode);
        else query = encodeURIComponent(sku || barcode);

        // If both SKU and barcode provided, perform parallel checks and detect mismatch
        if (sku && barcode) {
            const skuUrl = 'api.php?find=sku:' + encodeURIComponent(sku);
            const barcodeUrl = 'api.php?find=barcode:' + encodeURIComponent(barcode);
            Promise.all([fetch(skuUrl).then(r => r.json().catch(() => ({}))), fetch(barcodeUrl).then(r => r.json().catch(() => ({})))])
                .then(([skuRes, barcodeRes]) => {
                    try {
                        const skuFound = skuRes && skuRes.found;
                        const barcodeFound = barcodeRes && barcodeRes.found;

                        // Quick match detection: if SKU returns a product and barcode results include that product/variant -> treat as match
                        let matched = false;
                        if (skuFound && skuRes.product && barcodeFound && Array.isArray(barcodeRes.results)) {
                            const prodId = skuRes.product.id || skuRes.product.product_id || null;
                            if (prodId) {
                                for (const r of barcodeRes.results) {
                                    // product rows can have id or product_id depending on type
                                    const rid = r.id || r.product_id || null;
                                    if (rid && parseInt(rid) === parseInt(prodId)) { matched = true; break; }
                                }
                            }
                        }

                        if (matched) {
                            // Render combined 'both' view using sku product as authoritative
                            renderBarcodeResults(skuRes.product ? [skuRes.product] : (barcodeRes.results || []), sku + ' and ' + barcode, 'both');
                            return;
                        }

                        // If neither found, open Add Items directly (no popup)
                        if (!skuFound && !barcodeFound) {
                            // Show not-found confirmation popup instead of opening Add Items directly
                            showNotFoundConfirmation(
                                'No item found with SKU "' + sku + '" and barcode "' + barcode + '". Do you want to add it as a new item?',
                                function() { openAddItemsPrefill(sku, barcode); },
                                function() { /* Optionally reset manual form or do nothing */ }
                            );
                            return;
                        }

                        // If not matched, show mismatch popup offering SKU-only or Barcode-only views
                        showMismatchPopup(sku, barcode, skuRes, barcodeRes);
                    } catch (e) {
                        console.error('Mismatch flow error', e);
                        alert('Error processing search. Please try again.');
                    }
                })
                .catch(err => {
                    console.error('Error performing parallel find', err);
                    alert('Error checking product. Please try again.');
                });
            return;
        }

        // Single-term path (sku only or barcode only)
        fetch('api.php?find=' + query)
            .then(res => res.json())
            .then(data => {
                if (data && data.found) {
                    if (Array.isArray(data.results) && data.results.length > 0) {
                        let type, headerVal;
                        if (sku && barcode) {
                            type = 'both';
                            headerVal = sku + ' and ' + barcode;
                        } else {
                            type = barcode ? 'barcode' : (sku ? 'sku' : 'barcode');
                            headerVal = barcode || sku || '';
                        }
                        renderBarcodeResults(data.results, headerVal, type);
                    } else if (data.product) {
                        if (sku && !barcode) {
                            renderBarcodeResults([data.product], sku, 'sku');
                            return;
                        } else if (sku && barcode) {
                            renderBarcodeResults([data.product], sku + ' and ' + barcode, 'both');
                            return;
                        } else {
                            closeScannerModal();
                            alert('Product found. Opening product details...');
                        }
                    } else {
                        openAddItemsPrefill(sku, barcode);
                    }
                } else {
                    // Not found: show popup confirmation
                    showNotFoundConfirmation(
                        'No item found with ' + (sku ? 'SKU "' + sku + '"' : 'barcode "' + barcode + '"') + '. Do you want to add it as a new item?',
                        function() { openAddItemsPrefill(sku, barcode); },
                        function() { /* Optionally reset manual form or do nothing */ }
                    );
                }
            })
            .catch(err => {
                console.error('Error checking product existence', err);
                alert('Error checking product. Please try again.');
            });
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
        const enableBarcodeCheckbox = document.getElementById('enableBarcode');
        const enableSKUCheckbox = document.getElementById('enableSKU');
        const barcodeInputEl = document.getElementById('manualBarcode');
        const skuInputEl = document.getElementById('manualSKU');
        const barcodeChecked = enableBarcodeCheckbox && enableBarcodeCheckbox.checked;
        const skuChecked = enableSKUCheckbox && enableSKUCheckbox.checked;
        const barcodeData = barcodeInputEl ? barcodeInputEl.value.trim() : '';
        const skuData = skuInputEl ? skuInputEl.value.trim() : '';

        if (barcodeChecked && barcodeData) {
            const prodBarcode = document.getElementById('productBarcode');
            if (prodBarcode) prodBarcode.value = barcodeData;
        }
        if (skuChecked && skuData) {
            const prodSKU = document.getElementById('productSKU');
            if (prodSKU) prodSKU.value = skuData;
        }
    }
    
    // Handle Next button - proceed to form with data
    function handleNext() {
        const enableBarcodeCheckbox = document.getElementById('enableBarcode');
        const enableSKUCheckbox = document.getElementById('enableSKU');
        const barcodeInput = document.getElementById('manualBarcode');
        const skuInput = document.getElementById('manualSKU');

        const barcodeChecked = enableBarcodeCheckbox && enableBarcodeCheckbox.checked;
        const skuChecked = enableSKUCheckbox && enableSKUCheckbox.checked;
        const barcodeData = barcodeInput ? barcodeInput.value.trim() : '';
        const skuData = skuInput ? skuInput.value.trim() : '';

        const searchVal = skuChecked && skuData ? ('sku:' + encodeURIComponent(skuData)) : (barcodeChecked && barcodeData ? ('barcode:' + encodeURIComponent(barcodeData)) : encodeURIComponent(skuData || barcodeData));

        // If both provided, run parallel checks to detect mismatch
        if (skuChecked && barcodeChecked && skuData && barcodeData) {
            const skuUrl = 'api.php?find=sku:' + encodeURIComponent(skuData);
            const barcodeUrl = 'api.php?find=barcode:' + encodeURIComponent(barcodeData);
            Promise.all([fetch(skuUrl).then(r => r.json().catch(() => ({}))), fetch(barcodeUrl).then(r => r.json().catch(() => ({})))])
                .then(([skuRes, barcodeRes]) => {
                    try {
                        const skuFound = skuRes && skuRes.found;
                        const barcodeFound = barcodeRes && barcodeRes.found;
                        let matched = false;
                        if (skuFound && skuRes.product && barcodeFound && Array.isArray(barcodeRes.results)) {
                            const prodId = skuRes.product.id || skuRes.product.product_id || null;
                            if (prodId) for (const r of barcodeRes.results) { const rid = r.id || r.product_id || null; if (rid && parseInt(rid) === parseInt(prodId)) { matched = true; break; } }
                        }

                        if (matched) {
                            renderBarcodeResults(skuRes.product ? [skuRes.product] : (barcodeRes.results || []), skuData + ' and ' + barcodeData, 'both');
                            return;
                        }

                        if (!skuFound && !barcodeFound) {
                            openAddItemsPrefill(skuData, barcodeData);
                            return;
                        }

                        showMismatchPopup(skuData, barcodeData, skuRes, barcodeRes);
                    } catch (e) {
                        console.error('Mismatch flow error', e);
                        alert('Error processing search. Please try again.');
                    }
                })
                .catch(err => {
                    console.error('Error performing parallel find', err);
                    alert('Error checking product. Please try again.');
                });
            return;
        }

        // Default single-term behavior
        fetch('api.php?find=' + searchVal)
            .then(res => res.json())
            .then(data => {
                if (data && data.found) {
                    if (Array.isArray(data.results) && data.results.length > 0) {
                        // If multiple results, render list. Use barcode if present otherwise SKU. If both provided, show combined header
                        let type, headerVal;
                        if (skuChecked && barcodeChecked) {
                            type = 'both';
                            headerVal = skuData + ' and ' + barcodeData;
                        } else {
                            type = barcodeChecked ? 'barcode' : (skuChecked ? 'sku' : 'barcode');
                            headerVal = barcodeChecked ? barcodeData : (skuChecked ? skuData : '');
                        }
                        renderBarcodeResults(data.results, headerVal, type);
                    } else if (data.product) {
                        if (skuChecked && !barcodeChecked) {
                            renderBarcodeResults([data.product], skuData, 'sku');
                            return;
                        } else if (skuChecked && barcodeChecked) {
                            renderBarcodeResults([data.product], skuData + ' and ' + barcodeData, 'both');
                            return;
                        } else {
                            closeScannerModal();
                            alert('Product already exists. Opening product details...');
                        }
                    } else {
                        openAddItemsPrefill(skuChecked ? skuData : '', barcodeChecked ? barcodeData : '');
                    }
                } else {
                    openAddItemsPrefill(skuChecked ? skuData : '', barcodeChecked ? barcodeData : '');
                }
            })
            .catch(err => {
                console.error('Error checking product existence', err);
                alert('Error checking product. Please try again.');
            });
    }

    // Show mismatch popup and wire buttons
    function showMismatchPopup(sku, barcode, skuResp, barcodeResp) {
        const modal = document.getElementById('mismatchChoiceModal');
        if (!modal) return;
        // Elements
        const titleEl = document.getElementById('mismatchTitle');
        const bodyEl = document.getElementById('mismatchBody');
        const skuBtn = document.getElementById('mismatchSkuBtn');
        const barcodeBtn = document.getElementById('mismatchBarcodeBtn');
        const closeBtn = document.getElementById('mismatchCloseBtn');

        // Reset previous handlers/labels to avoid stale state when modal is reused
        try {
            if (skuBtn) { skuBtn.onclick = null; skuBtn.disabled = false; skuBtn.textContent = 'Show SKU match'; }
            if (barcodeBtn) { barcodeBtn.onclick = null; barcodeBtn.disabled = false; barcodeBtn.textContent = 'Show Barcode match'; }
            if (closeBtn) closeBtn.onclick = null;
        } catch (e) { /* ignore */ }

        function cleanup() {
            modal.style.display = 'none';
            try { if (skuBtn) skuBtn.onclick = null; if (barcodeBtn) barcodeBtn.onclick = null; if (closeBtn) closeBtn.onclick = null; } catch (e) {}
        }

        if (closeBtn) closeBtn.onclick = cleanup;

        // Determine cases to show different messaging and actions
        const skuFound = skuResp && skuResp.found;
        const barcodeFound = barcodeResp && barcodeResp.found;

        // Default labels
        if (titleEl) titleEl.textContent = 'Inputs doesnt match';
        if (bodyEl) bodyEl.textContent = 'Would you like to:';

        // Case: SKU exists but barcode doesn't
        if (skuFound && !barcodeFound) {
            if (titleEl) titleEl.textContent = 'SKU exists — Barcode does not';
            if (bodyEl) bodyEl.textContent = 'Choose an action:';
            if (skuBtn) skuBtn.textContent = 'Show the SKU match';
            if (barcodeBtn) barcodeBtn.textContent = 'Add new item using the barcode';

            if (skuBtn) skuBtn.onclick = function() {
                cleanup();
                if (skuResp && skuResp.found && skuResp.product) {
                    renderBarcodeResults([skuResp.product], sku, 'sku');
                } else {
                    fetch('api.php?find=sku:' + encodeURIComponent(sku)).then(r => r.json()).then(d => {
                        if (d && d.found) {
                            if (d.product) renderBarcodeResults([d.product], sku, 'sku');
                            else if (Array.isArray(d.results) && d.results.length) renderBarcodeResults(d.results, sku, 'sku');
                            else openAddItemsPrefill(sku, '');
                        } else openAddItemsPrefill(sku, '');
                    }).catch(err => { console.error('sku fallback fetch', err); alert('Error fetching SKU results'); });
                }
            };

            if (barcodeBtn) barcodeBtn.onclick = function() {
                cleanup();
                openAddItemsPrefill('', barcode);
            };

            modal.style.display = 'block';
            return; // done
        }

        // Case: Barcode exists but SKU doesn't
        if (barcodeFound && !skuFound) {
            if (titleEl) titleEl.textContent = 'Barcode exists — SKU does not';
            if (bodyEl) bodyEl.textContent = 'Choose an action:';
            if (skuBtn) skuBtn.textContent = 'Add new item using the SKU';
            if (barcodeBtn) barcodeBtn.textContent = 'Show the Barcode match';

            if (skuBtn) skuBtn.onclick = function() {
                cleanup();
                openAddItemsPrefill(sku, '');
            };

            if (barcodeBtn) barcodeBtn.onclick = function() {
                cleanup();
                if (barcodeResp && barcodeResp.found && Array.isArray(barcodeResp.results) && barcodeResp.results.length) {
                    renderBarcodeResults(barcodeResp.results, barcode, 'barcode');
                } else {
                    fetch('api.php?find=barcode:' + encodeURIComponent(barcode)).then(r => r.json()).then(d => {
                        if (d && d.found) {
                            if (Array.isArray(d.results) && d.results.length) renderBarcodeResults(d.results, barcode, 'barcode');
                            else if (d.product) renderBarcodeResults([d.product], barcode, 'barcode');
                            else openAddItemsPrefill('', barcode);
                        } else openAddItemsPrefill('', barcode);
                    }).catch(err => { console.error('barcode fallback fetch', err); alert('Error fetching Barcode results'); });
                }
            };

            modal.style.display = 'block';
            return;
        }

        // Default: both exist but mismatch (original behavior)
        if (skuBtn) skuBtn.onclick = function() {
            cleanup();
            if (skuResp && skuResp.found && skuResp.product) {
                renderBarcodeResults([skuResp.product], sku, 'sku');
            } else {
                fetch('api.php?find=sku:' + encodeURIComponent(sku)).then(r => r.json()).then(d => {
                    if (d && d.found) {
                        if (d.product) renderBarcodeResults([d.product], sku, 'sku');
                        else if (Array.isArray(d.results) && d.results.length) renderBarcodeResults(d.results, sku, 'sku');
                        else openAddItemsPrefill(sku, '');
                    } else openAddItemsPrefill(sku, '');
                }).catch(err => { console.error('sku fallback fetch', err); alert('Error fetching SKU results'); });
            }
        };

        if (barcodeBtn) barcodeBtn.onclick = function() {
            cleanup();
            if (barcodeResp && barcodeResp.found && Array.isArray(barcodeResp.results) && barcodeResp.results.length) {
                renderBarcodeResults(barcodeResp.results, barcode, 'barcode');
            } else {
                fetch('api.php?find=barcode:' + encodeURIComponent(barcode)).then(r => r.json()).then(d => {
                    if (d && d.found) {
                        if (Array.isArray(d.results) && d.results.length) renderBarcodeResults(d.results, barcode, 'barcode');
                        else if (d.product) renderBarcodeResults([d.product], barcode, 'barcode');
                        else openAddItemsPrefill('', barcode);
                    } else openAddItemsPrefill('', barcode);
                }).catch(err => { console.error('barcode fallback fetch', err); alert('Error fetching Barcode results'); });
            }
        };

        modal.style.display = 'block';
    }

    // Helper to open Add Items and prefill
    function openAddItemsPrefill(sku, barcode) {
        // Accept an optional third argument: fromScanner (default false)
        var fromScanner = arguments.length > 2 ? arguments[2] : false;
        // Always use inline panel if fromScanner is true and inline panel is available
    // Previously we stopped the scanner when opening Add Item; keep it running now
        if (fromScanner && window.inlineAddItemsMount && window.inlineTpl) {
            console.log('[DEBUG] Using inline Add Items panel (scanner context)');
            // Open the inline panel and prefill values
            if (document.getElementById('inlineAddItemsPanel')) return;
            const node = window.inlineTpl.content.firstElementChild.cloneNode(true);
            window.inlineAddItemsMount.appendChild(node);
            if (window.baseAddFlow) window.baseAddFlow.classList.add('slide-out-left');
            requestAnimationFrame(() => {
                node.classList.add('show');
            });
            setTimeout(() => {
                const inlineSKU = node.querySelector('#inlineItemSKU');
                const inlineBarcode = node.querySelector('#inlineItemBarcode');
                const inlineName = node.querySelector('#inlineItemName');
                if (sku && inlineSKU) {
                    inlineSKU.value = sku;
                } else if (inlineSKU) {
                    fetch('get_next_sku.php').then(r => r.json()).then(d => {
                        if (d && d.next_sku) inlineSKU.value = d.next_sku;
                    }).catch(() => {});
                }
                if (inlineBarcode) {
                    inlineBarcode.value = barcode ? barcode : '';
                }
                if (inlineName) {
                    setTimeout(() => {
                        try { inlineName.focus(); } catch (e) {}
                    }, 320);
                }
                // Attach back button handler to close and restart scanner
                const backBtn = node.querySelector('#backInlineAddItems');
                if (backBtn) {
                    // Remove previous listeners by replacing the node
                    const newBackBtn = backBtn.cloneNode(true);
                    backBtn.parentNode.replaceChild(newBackBtn, backBtn);
                    newBackBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        // If previousTab is 'manual', go to 'manual' (preserve manual flow), else go to previousTab or fallback to 'scan'
                        if (typeof previousTab !== 'undefined' && previousTab === 'manual') {
                            showTab('manual');
                        } else if (typeof previousTab !== 'undefined' && previousTab) {
                            showTab(previousTab);
                        } else {
                            showTab('scan');
                        }
                        // Keep scanner state as-is; do not automatically restart here
                    });
                } else {
                    console.warn('[DEBUG] Inline panel back button not found');
                }
            }, 120);
            return;
        }
        // Fallback: legacy modal logic
        console.log('[DEBUG] Using fallback modal Add Items panel');
        showTab('addItems', true);
        window.ensureAttachAddItems();
        setTimeout(() => {
            const inlineSKU = document.getElementById('inlineItemSKU');
            const inlineBarcode = document.getElementById('inlineItemBarcode');
            const inlineName = document.getElementById('inlineItemName');
            if (sku && inlineSKU) {
                inlineSKU.value = sku;
            } else if (inlineSKU) {
                fetch('get_next_sku.php').then(r => r.json()).then(d => {
                    if (d && d.next_sku) inlineSKU.value = d.next_sku;
                }).catch(() => {});
            }
            if (inlineBarcode) {
                inlineBarcode.value = barcode ? barcode : '';
            }
            if (inlineName) {
                setTimeout(() => {
                    try { inlineName.focus(); } catch (e) {}
                }, 320);
            }
                // If opened from scanner (not from confirmation), we do not automatically restart scanning
            if (fromScanner) {
                let backBtn = document.getElementById('backInlineAddItems');
                let closeBtn = document.getElementById('closeAddItems');
                if (backBtn) {
                    const newBackBtn = backBtn.cloneNode(true);
                    backBtn.parentNode.replaceChild(newBackBtn, backBtn);
                    newBackBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        // If previousTab is 'manual', return to 'manual'; otherwise go to previousTab or fallback to 'scan'
                        if (typeof previousTab !== 'undefined' && previousTab === 'manual') {
                            showTab('manual');
                        } else if (typeof previousTab !== 'undefined' && previousTab) {
                            showTab(previousTab);
                        } else {
                            showTab('scan');
                        }
                        // intentionally do not restart scanner automatically
                    });
                } else {
                    console.warn('[DEBUG] Modal back button not found');
                }
                if (closeBtn) {
                    const newCloseBtn = closeBtn.cloneNode(true);
                    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
                    newCloseBtn.addEventListener('click', function() {
                        // Close modal, do not restart scanner here
                        closeAddItemsModal();
                    });
                } else {
                    console.warn('[DEBUG] Modal close button not found');
                }
            }
        }, 120);
    }

    // Render a list of products/variants that match a barcode
    function renderBarcodeResults(results, searchedBarcode, searchType = 'barcode') {
        // Show barcode results in its own tab panel
        showTab('barcodeResults', true);

        // Update header barcode value if present
        try {
            const headerValue = document.getElementById('barcodeResultsHeaderValue');
            const headerPrefix = document.getElementById('barcodeResultsHeaderPrefix');
            if (headerPrefix) {
                if (searchType === 'sku') headerPrefix.textContent = 'Item with SKU:';
                else if (searchType === 'both') headerPrefix.textContent = 'Items matching:';
                else headerPrefix.textContent = 'Items using barcode:';
            }
            if (headerValue) {
                headerValue.textContent = searchedBarcode || '';
            }
        } catch (e) {
            console.error('Failed to set barcodeResults header value', e);
        }

        setTimeout(() => {
            const panel = document.getElementById('barcodeResultsTabPanel');
            if (!panel) return;
            const mount = document.getElementById('barcodeResultsMount');
            if (!mount) return;

            // Clear previous results
            mount.innerHTML = '';

            // Template
            const tpl = document.getElementById('barcodeResultRowTemplateStandalone');

            results.forEach(item => {
                let node;
                if (tpl && 'content' in tpl) {
                    node = tpl.content.firstElementChild.cloneNode(true);
                } else {
                    // Fallback: basic element
                    node = document.createElement('div');
                    node.className = 'barcode-result-row';
                }

                // Fill fields
                const catEl = node.querySelector('.br-category');
                const nameEl = node.querySelector('.br-name');
                const trackToggle = node.querySelector('.br-track-toggle');
                const instockEl = node.querySelector('.br-instock-value');
                const statusEl = node.querySelector('.br-status');
                const addQty = node.querySelector('.br-add-qty');
                const addBtn = node.querySelector('.br-add-btn');
                // Hide status column for parent product rows
                if (item.type === 'product') {
                    const statusCol = node.querySelector('.br-col-status');
                    if (statusCol) statusCol.style.display = 'none';
                    if (statusEl) statusEl.style.display = 'none';
                }

                if (catEl) catEl.textContent = item.category || '';
                if (nameEl) nameEl.textContent = item.type === 'variant' ? (item.variant_name || '') : (item.name || '');
                // Columns that can be hidden when tracking is off
                const instockCol = node.querySelector('.br-col-instock');
                const statusCol = node.querySelector('.br-col-status');
                const addCol = node.querySelector('.br-col-add');

                // ...existing code for main item rendering...

                // Create a wrapper for this product row so variants appended inside it
                // cannot float beside the parent (forces vertical stacking)
                let rowWrapper = document.createElement('div');
                rowWrapper.className = 'br-row-wrapper';
                // Layout is handled via CSS (.br-row-wrapper and template grid).
                // Avoid inline display/width styles so the template's grid
                // (defined in popupmodal.php) can control column sizes.
                // append parent node into wrapper, then wrapper into mount
                rowWrapper.appendChild(node);
                mount.appendChild(rowWrapper);

                // Parent row click toggles variant list visibility (override tracking)
                try {
                    node.addEventListener('click', function(e) {
                        // Ignore clicks on interactive controls so they work normally
                        if (e.target.closest && e.target.closest('input, button, a, select, textarea, .unit-selector, .br-add-btn, .br-add-qty, .br-track-toggle, .br-undo, .br-add-again')) return;
                        const vlist = rowWrapper.querySelector('.variant-list');
                        if (!vlist) return;
                        const forced = vlist.getAttribute('data-forced') === '1';
                        if (forced) {
                            // turn off forced show -> respect tracking
                            vlist.setAttribute('data-forced', '0');
                            const parentTracking = parseInt(item.track_stock || 0) === 1;
                            if (!parentTracking) vlist.classList.add('hidden');
                            else vlist.classList.remove('hidden');
                        } else {
                            // force show
                            vlist.setAttribute('data-forced', '1');
                            vlist.classList.remove('hidden');
                        }
                    });
                } catch (e) { /* ignore */ }

                // Helper: recalculate parent totals from variants and update parent's in-stock and status
                function recalcParentTotals() {
                    try {
                        // Sum numeric parts of each variant's in-stock value
                        const variantRows = rowWrapper.querySelectorAll('.variant-list .barcode-result-row');
                        let sum = 0;
                        let foundAny     = false;
                        let unit = '';
                        variantRows.forEach(vRow => {
                            try {
                                const instEl = vRow.querySelector('.br-instock-value');
                                let text = instEl ? String(instEl.textContent || '').trim() : (vRow.getAttribute('data-in-stock') || '').trim();
                                if (!text) return;
                                const m = text.match(/^\s*([+-]?\d+(?:\.\d+)?)/);
                                if (m) {
                                    const n = parseFloat(m[1]);
                                    if (!isNaN(n)) { sum += n; foundAny = true; }
                                }
                                if (!unit) {
                                    const um = text.match(/^\s*[+-]?\d+(?:\.\d+)?\s*(.*)$/);
                                    if (um && um[1]) {
                                        const u = um[1].trim();
                                        if (u && u !== '- -') unit = u;
                                    }
                                }
                            } catch (e) { /* per-row parse errors ignored */ }
                        });

                        // Update parent in-stock and status elements
                        const parentNode = rowWrapper.querySelector('.barcode-result-row');
                        if (!parentNode) return;
                        const parentInstEl = parentNode.querySelector('.br-instock-value');
                        const parentStatusEl = parentNode.querySelector('.br-status');

                        if (parentInstEl) {
                            if (!foundAny) parentInstEl.textContent = '—';
                            else parentInstEl.textContent = String(sum) + (unit ? ' ' + unit : '');
                        }

                        // Compute status using parent item's low_stock when available
                        let statusText = '—';
                        if (foundAny) {
                            if (sum <= 0) statusText = 'Out of stock';
                            else if (item && item.low_stock && item.low_stock !== '' && sum <= parseFloat(item.low_stock)) statusText = 'Low stock';
                            else statusText = 'In stock';
                        }
                        if (parentStatusEl) parentStatusEl.textContent = statusText;

                        // Keep parent data-in-stock attribute in sync
                        try { if (parentNode && foundAny) parentNode.setAttribute('data-in-stock', String(sum)); } catch (e) {}
                    } catch (e) { console.error('recalcParentTotals error', e); }
                }

                // If item has variants, render them below the main item
                if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
                    // Create a container for variants as a sibling under the row wrapper
                    let variantList = document.createElement('div');
                    variantList.className = 'variant-list';
                    rowWrapper.appendChild(variantList);
                    // Hide variants list when parent product tracking is off
                    try {
                        const parentTracking = parseInt(item.track_stock || 0) === 1;
                        if (!parentTracking) variantList.classList.add('hidden');
                        else variantList.classList.remove('hidden');
                    } catch (e) { /* ignore */ }

                    // If the parent product has variants, hide the parent's add controls
                    // and mark the add column so later toggles won't show it again.
                    try {
                        if (addQty) {
                            addQty.style.display = 'none';
                            addQty.disabled = true;
                        }
                        if (addBtn) {
                            addBtn.style.display = 'none';
                            addBtn.disabled = true;
                        }
                        if (addCol) {
                            addCol.style.display = 'none';
                            addCol.setAttribute('data-has-variants', '1');
                        }
                    } catch (e) { /* ignore if DOM refs missing */ }

                    item.variants.forEach(variant => {
                        let vNode;
                        if (tpl && 'content' in tpl) {
                            vNode = tpl.content.firstElementChild.cloneNode(true);
                        } else {
                            vNode = document.createElement('div');
                            vNode.className = 'barcode-result-row';
                        }
                        // Fill fields for variant
                        const vCatEl = vNode.querySelector('.br-category');
                        const vNameEl = vNode.querySelector('.br-name');
                        const vTrackToggle = vNode.querySelector('.br-track-toggle');
                        const vInstockEl = vNode.querySelector('.br-instock-value');
                        const vStatusEl = vNode.querySelector('.br-status');
                        const vAddQty = vNode.querySelector('.br-add-qty');
                        const vAddBtn = vNode.querySelector('.br-add-btn');

                        if (vCatEl) vCatEl.textContent = item.name || '';
                        if (vNameEl) vNameEl.textContent = variant.variant_name || '';

                        // Columns that can be hidden when tracking is off
                        const vInstockCol = vNode.querySelector('.br-col-instock');
                        const vStatusCol = vNode.querySelector('.br-col-status');
                        const vAddCol = vNode.querySelector('.br-col-add');

                        // Copy relevant fields from variant
                        vNode.setAttribute('data-variant-id', variant.variant_id);
                        vNode.setAttribute('data-product-id', item.id);
                        if (typeof variant.variant_in_stock !== 'undefined' && variant.variant_in_stock !== null) vNode.setAttribute('data-in-stock', String(variant.variant_in_stock));
                        if (typeof variant.variant_low_stock !== 'undefined' && variant.variant_low_stock !== null) vNode.setAttribute('data-low-stock', String(variant.variant_low_stock));

                        // Variants no longer render their own track-toggle button; remove it from the DOM
                        let vTrackingVal = parseInt(item.track_stock) || 0;
                        const vTrackingOn = vTrackingVal === 1;
                        // Remove or hide the whole track column for variants so no toggle appears and layout stays clean
                        try {
                            if (vTrackToggle) {
                                // remove the input element itself
                                try { vTrackToggle.remove(); } catch (e) {}
                            }
                            const vTrackCol = vNode.querySelector('.br-col-track');
                            if (vTrackCol) {
                                // hide the entire column for variants (keeps header alignment intact)
                                vTrackCol.style.display = 'none';
                            }
                        } catch (e) { /* ignore DOM errors */ }

                        // Populate in-stock and status only when tracking is on
                        if (vTrackingOn) {
                            const rawInStock = variant.variant_in_stock;
                            const instockDisplay = (rawInStock === null || typeof rawInStock === 'undefined' || rawInStock === '') ? '—' : String(rawInStock);
                            if (vInstockEl) vInstockEl.textContent = instockDisplay;
                            let statusText = '—';
                            if (!(rawInStock === null || typeof rawInStock === 'undefined' || rawInStock === '')) {
                                const inStockNum = parseFloat(rawInStock || 0);
                                statusText = 'In stock';
                                if (isNaN(inStockNum) || inStockNum <= 0) statusText = 'Out of stock';
                                else if (variant.variant_low_stock && variant.variant_low_stock !== '' && inStockNum <= parseFloat(variant.variant_low_stock)) statusText = 'Low stock';
                            }
                            if (vStatusEl) vStatusEl.textContent = statusText;
                        } else {
                            if (vInstockEl) vInstockEl.textContent = '';
                            if (vStatusEl) vStatusEl.textContent = '';
                        }

                        // Hide columns initially if tracking is off
                        if (!vTrackingOn) {
                            if (vInstockCol) vInstockCol.style.display = 'none';
                            if (vStatusCol) vStatusCol.style.display = 'none';
                            if (vAddCol) vAddCol.style.display = 'none';
                        }

                        // Wire add button for variant
                        if (vAddBtn) {
                            vAddBtn.addEventListener('click', function() {
                                const rawQty = vAddQty ? vAddQty.value.trim() : '';
                                const qty = rawQty === '' ? 0 : parseFloat(rawQty);
                                if (!qty || isNaN(qty) || qty <= 0) {
                                    showErrorPopup('Please enter a quantity greater than 0');
                                    return;
                                }
                                let unit = '';
                                try {
                                    const anyUnit = vNode.querySelector('.unit-value');
                                    if (anyUnit) unit = anyUnit.textContent.trim();
                                } catch (e) {}
                                // Ghost number animation
                                try {
                                    if (vInstockEl) {
                                        const ghost = document.createElement('div');
                                        ghost.className = 'ghost-add-number';
                                        ghost.textContent = `+${qty}${(unit && unit !== '- -') ? ' ' + unit : ''}`;
                                        vNode.appendChild(ghost);
                                        const instRect = vInstockEl.getBoundingClientRect();
                                        const rowRect = vNode.getBoundingClientRect();
                                        const ghostRect = ghost.getBoundingClientRect();
                                        const centerX = instRect.left - rowRect.left + (instRect.width / 2) - (ghostRect.width / 2) - 6;
                                        const centerY = instRect.top - rowRect.top + (instRect.height / 2) - (ghostRect.height / 2);
                                        ghost.style.left = (centerX > 4 ? centerX : 4) + 'px';
                                        ghost.style.top = (centerY > 2 ? centerY : 2) + 'px';
                                        requestAnimationFrame(() => {
                                            ghost.style.animation = 'ghost-float 900ms ease-out forwards';
                                        });
                                        setTimeout(() => { try { ghost.remove(); } catch(e){} }, 1000);
                                    }
                                } catch (e) { console.error('ghost immediate error', e); }
                                vAddBtn.disabled = true;
                                vAddQty.disabled = true;
                                const payload = { action: 'add_stock', product_id: item.id, variant_id: variant.variant_id, qty: qty };
                                if (unit && unit !== '- -') payload.unit = unit;
                                fetch('api.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                }).then(res => res.json())
                                .then(resp => {
                                    if (!resp || !resp.success) throw new Error(resp && resp.error ? resp.error : 'Unknown error');
                                    const newInStock = resp.new_in_stock || resp.new_in_stock === '' ? resp.new_in_stock : null;
                                    const newStatus = resp.status || '';
                                    if (vInstockEl) vInstockEl.textContent = newInStock !== null ? newInStock : '—';
                                    if (vStatusEl) vStatusEl.textContent = newStatus || '—';
                                    // If server returned authoritative parent totals, prefer them
                                    try {
                                        const wrapper = vNode.closest && vNode.closest('.br-row-wrapper');
                                        if (resp && resp.parent_new_in_stock && wrapper) {
                                            const parentNode = wrapper.querySelector('.barcode-result-row');
                                            if (parentNode) {
                                                const pInst = parentNode.querySelector('.br-instock-value');
                                                const pStatus = parentNode.querySelector('.br-status');
                                                if (pInst) pInst.textContent = resp.parent_new_in_stock || '—';
                                                if (pStatus) pStatus.textContent = resp.parent_status || '—';
                                                try { parentNode.setAttribute('data-in-stock', resp.parent_new_in_stock ? String(resp.parent_new_in_stock).replace(/\s+/g,'') : ''); } catch (e) {}
                                            }
                                        } else {
                                            // Fallback: recalc from DOM variants
                                            try { recalcParentTotals(); } catch (e) { console.error('parent recalc after variant add failed', e); }
                                        }
                                    } catch (e) { console.error('parent update error after variant add', e); }
                                    // Also show floating ghost on parent row so user sees aggregated change
                                    try {
                                        const wrapper = vNode.closest && vNode.closest('.br-row-wrapper');
                                        if (wrapper) {
                                            const parentNode = wrapper.querySelector('.barcode-result-row');
                                            if (parentNode) {
                                                const parentInst = parentNode.querySelector('.br-instock-value');
                                                if (parentInst) {
                                                    const ghost = document.createElement('div');
                                                    ghost.className = 'ghost-add-number';
                                                    ghost.textContent = `+${qty}${(unit && unit !== '- -') ? ' ' + unit : ''}`;
                                                    parentNode.appendChild(ghost);
                                                    const instRect = parentInst.getBoundingClientRect();
                                                    const rowRect = parentNode.getBoundingClientRect();
                                                    const ghostRect = ghost.getBoundingClientRect();
                                                    const centerX = instRect.left - rowRect.left + (instRect.width / 2) - (ghostRect.width / 2) - 6;
                                                    const centerY = instRect.top - rowRect.top + (instRect.height / 2) - (ghostRect.height / 2);
                                                    ghost.style.left = (centerX > 4 ? centerX : 4) + 'px';
                                                    ghost.style.top = (centerY > 2 ? centerY : 2) + 'px';
                                                    requestAnimationFrame(() => {
                                                        ghost.style.animation = 'ghost-float 900ms ease-out forwards';
                                                    });
                                                    setTimeout(() => { try { ghost.remove(); } catch(e){} }, 1000);
                                                }
                                            }
                                        }
                                    } catch (e) { console.error('parent ghost error', e); }
                                    vNode.classList.add('added');
                                    setTimeout(() => vNode.classList.remove('added'), 900);
                                    const successCol = vNode.querySelector('.br-col-success');
                                    const successMsg = vNode.querySelector('.br-success-message');
                                    const successAgainBtn = vNode.querySelector('.br-add-again');
                                    setTimeout(() => {
                                        try {
                                            const cols = vNode.querySelectorAll('.br-col');
                                            cols.forEach(col => {
                                                if (!col.classList.contains('br-col-success')) {
                                                    col.style.display = 'none';
                                                }
                                            });
                                            const nameText = vNameEl ? vNameEl.textContent.trim() : '';
                                            const categoryText = vCatEl ? vCatEl.textContent.trim() : '';
                                            let displayUnit = (unit && unit !== '- -') ? unit : '';
                                            const totalTextRaw = (newInStock !== null) ? String(newInStock) : '';
                                            if (!displayUnit && totalTextRaw) {
                                                const m = totalTextRaw.match(/^[0-9]+(?:\.[0-9]+)?\s*(.*)$/);
                                                if (m && m[1]) displayUnit = m[1].trim();
                                            }
                                            const addedQtyDisplay = `${qty}${displayUnit || ''}`;
                                            const totalText = totalTextRaw || '';
                                            const totalDisplay = totalText ? totalText.replace(/\s+/g, '') : '—';
                                            let statusTextNow = (newStatus || '').trim();
                                            if (!statusTextNow) statusTextNow = '—';
                                            else if (statusTextNow.toLowerCase().includes('with')) statusTextNow = 'With stock';
                                            else if (statusTextNow.toLowerCase().includes('low')) statusTextNow = 'Low stock';
                                            else if (statusTextNow.toLowerCase().includes('out')) statusTextNow = 'Out of stock';
                                            if (successMsg) {
                                                successMsg.textContent = `You've successfully added ${addedQtyDisplay} of ${nameText || ''} under ${categoryText || 'No Category'} with a total of ${totalDisplay} (${statusTextNow})`;
                                            }
                                            try { vNode._lastAdded = { qty: qty, unit: displayUnit || unit || '' }; } catch (e) {}
                                            if (successCol) successCol.style.display = '';
                                            if (successAgainBtn) {
                                                successAgainBtn.onclick = function() {
                                                    const cols = vNode.querySelectorAll('.br-col');
                                                    cols.forEach(col => {
                                                        if (!col.classList.contains('br-col-success')) {
                                                            // Hide track-toggle for variants (never show)
                                                            if (col.classList.contains('br-col-track')) {
                                                                col.style.display = 'none';
                                                            } else {
                                                                col.style.display = '';
                                                            }
                                                        }
                                                    });
                                                    if (successCol) successCol.style.display = 'none';
                                                    if (vAddQty) vAddQty.value = '';
                                                    if (vAddBtn) {
                                                        vAddBtn.disabled = false;
                                                        vAddQty.disabled = false;
                                                        try { vAddQty.focus(); } catch (e) {}
                                                    }
                                                };
                                            }
                                            const undoBtn = vNode.querySelector('.br-undo');
                                            if (undoBtn) {
                                                undoBtn.onclick = function() {
                                                    const last = vNode._lastAdded || { qty: qty, unit: displayUnit || unit || '' };
                                                    const prevText = undoBtn.textContent;
                                                    try { undoBtn.textContent = 'Undoing...'; } catch (e) {}
                                                    const undoQty = -Math.abs(parseFloat(last.qty) || -qty);
                                                    const adjustPayload = { action: 'adjust_stock', product_id: item.id, variant_id: variant.variant_id, qty: undoQty };
                                                    if (last.unit && last.unit !== '- -') adjustPayload.unit = last.unit;
                                                    undoBtn.disabled = true;
                                                    fetch('api.php', {
                                                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adjustPayload)
                                                    }).then(r => r.json()).then(res => {
                                                        if (!res || !res.success) throw new Error(res && res.error ? res.error : 'Unknown error');
                                                        if (vInstockEl) vInstockEl.textContent = res.new_in_stock !== null ? res.new_in_stock : '—';
                                                        if (vStatusEl) vStatusEl.textContent = res.status || '—';
                                                        // If server returned parent totals prefer them, otherwise recalc
                                                        try {
                                                            const wrapper = vNode.closest && vNode.closest('.br-row-wrapper');
                                                            if (res && res.parent_new_in_stock && wrapper) {
                                                                const parentNode = wrapper.querySelector('.barcode-result-row');
                                                                if (parentNode) {
                                                                    const pInst = parentNode.querySelector('.br-instock-value');
                                                                    const pStatus = parentNode.querySelector('.br-status');
                                                                    if (pInst) pInst.textContent = res.parent_new_in_stock || '—';
                                                                    if (pStatus) pStatus.textContent = res.parent_status || '—';
                                                                    try { parentNode.setAttribute('data-in-stock', res.parent_new_in_stock ? String(res.parent_new_in_stock).replace(/\s+/g,'') : ''); } catch (e) {}
                                                                }
                                                            } else {
                                                                try { recalcParentTotals(); } catch (e) { console.error('parent recalc after variant undo failed', e); }
                                                            }
                                                        } catch (e) { console.error('parent update error after variant undo', e); }
                                                        // Restore and focus the variant add input so user can add again quickly
                                                        // Show all columns except success, hide success message
                                                        const cols = vNode.querySelectorAll('.br-col');
                                                        cols.forEach(col => {
                                                            if (!col.classList.contains('br-col-success')) {
                                                                // Hide track-toggle for variants (never show)
                                                                if (col.classList.contains('br-col-track')) {
                                                                    col.style.display = 'none';
                                                                } else {
                                                                    col.style.display = '';
                                                                }
                                                            } else {
                                                                col.style.display = 'none';
                                                            }
                                                        });
                                                        try { if (vAddQty) { vAddQty.style.display = ''; vAddQty.disabled = false; vAddQty.value = ''; vAddQty.focus(); } } catch (e) {}
                                                        try { if (vAddBtn) { vAddBtn.style.display = ''; vAddBtn.disabled = false; } } catch (e) {}
                                                        undoBtn.textContent = prevText;
                                                        undoBtn.disabled = false;
                                                    }).catch(err => {
                                                        undoBtn.textContent = prevText;
                                                        undoBtn.disabled = false;
                                                        showErrorPopup('Failed to undo: ' + (err.message || err));
                                                    });
                                                };
                                            }
                                        } catch (e) {
                                            console.error('replace row content error', e);
                                        }
                                    }, 750);
                                }).catch(err => {
                                    console.error('add_stock error', err);
                                    showErrorPopup('Failed to add stock: ' + (err.message || err));
                                    vAddBtn.disabled = false;
                                    vAddQty.disabled = false;
                                });
                            });
                        }

                        // Recommendation tooltip for variant
                        if (vAddQty) {
                            vAddQty.addEventListener('focus', function() {
                                try {
                                    const curText = vInstockEl ? vInstockEl.textContent.trim() : (vNode.getAttribute('data-in-stock') || '');
                                    const lowText = vNode.getAttribute('data-low-stock') || '';
                                    const parseNum = s => { const m = String(s || '').match(/^\s*([0-9]+(?:\.[0-9]+)?)/); return m ? parseFloat(m[1]) : null; };
                                    const curNum = parseNum(curText);
                                    const lowNum = parseNum(lowText);
                                    if (lowNum !== null && (curNum === null || curNum <= lowNum)) {
                                        const need = Math.max(1, Math.ceil((lowNum - (curNum || 0)) + 1));
                                        let msg = vNode.querySelector('.br-recommend-msg');
                                        if (!msg) {
                                            msg = document.createElement('div');
                                            msg.className = 'br-recommend-msg';
                                            msg.setAttribute('role','status');
                                            msg.style.visibility = 'hidden';
                                            vNode.appendChild(msg);
                                        }
                                        msg.textContent = `We recommend you adding ${need} or more to exceed low stock`;
                                        const rowRect = vNode.getBoundingClientRect();
                                        const inputRect = vAddQty.getBoundingClientRect();
                                        const inner = vNode.closest('.barcode-results-inner') || vNode.parentElement;
                                        const innerRect = inner ? inner.getBoundingClientRect() : rowRect;
                                        msg.style.display = '';
                                        const ttWidth = Math.min((msg.offsetWidth || 160), Math.max(80, innerRect.width - 12));
                                        const ttHeight = msg.offsetHeight || 28;
                                        let left = (inputRect.right - rowRect.left) - ttWidth;
                                        let top = (inputRect.top - rowRect.top) - ttHeight - 6;
                                        const minLeft = 6;
                                        const maxLeft = Math.max(6, rowRect.width - ttWidth - 6);
                                        if (left < minLeft) left = minLeft;
                                        if (left > maxLeft) left = maxLeft;
                                        const minTop = -ttHeight - 6;
                                        if (top < minTop) top = minTop;
                                        msg.style.left = Math.round(left) + 'px';
                                        msg.style.top = Math.round(top) + 'px';
                                        msg.style.visibility = 'visible';
                                    }
                                } catch (e) { console.error('recommend focus error', e); }
                            });
                            vAddQty.addEventListener('blur', function() {
                                try {
                                    const msg = vNode.querySelector('.br-recommend-msg');
                                    if (msg) msg.style.display = 'none';
                                } catch (e) {}
                            });
                            vAddQty.addEventListener('input', function() {
                                try {
                                    const msg = vNode.querySelector('.br-recommend-msg');
                                    if (msg) msg.style.display = 'none';
                                } catch (e) {}
                            });
                        }

                        variantList.appendChild(vNode);
                    });
                }

                // Determine tracking state from DB (1 => on, 0 => off)
                let trackingVal = 0;
                if (item.type === 'product') {
                    trackingVal = parseInt(item.track_stock) || 0;
                } else if (item.type === 'variant') {
                    trackingVal = parseInt(item.product_track_stock) || 0;
                }
                const trackingOn = trackingVal === 1;

                // Attach ids for persistence: product or variant
                if (item.type === 'product' && item.id) {
                    node.setAttribute('data-product-id', item.id);
                    // set stock attributes for recommendation tooltip
                    if (typeof item.in_stock !== 'undefined' && item.in_stock !== null) node.setAttribute('data-in-stock', String(item.in_stock));
                    if (typeof item.low_stock !== 'undefined' && item.low_stock !== null) node.setAttribute('data-low-stock', String(item.low_stock));
                } else if (item.type === 'variant' && item.variant_id) {
                    node.setAttribute('data-variant-id', item.variant_id);
                    node.setAttribute('data-product-id', item.product_id);
                    // set stock attributes for recommendation tooltip (variants)
                    if (typeof item.variant_in_stock !== 'undefined' && item.variant_in_stock !== null) node.setAttribute('data-in-stock', String(item.variant_in_stock));
                    if (typeof item.variant_low_stock !== 'undefined' && item.variant_low_stock !== null) node.setAttribute('data-low-stock', String(item.variant_low_stock));
                }

                // Track toggle reflects product-level tracking and toggles visibility when changed
                if (trackToggle) {
                    trackToggle.checked = trackingOn;
                    trackToggle.setAttribute('aria-checked', trackingOn ? 'true' : 'false');
                    trackToggle.addEventListener('change', function() {
                        const on = !!this.checked;
                        // Show/hide columns
                        if (instockCol) instockCol.style.display = on ? '' : 'none';
                        if (statusCol) statusCol.style.display = on ? '' : 'none';
                        if (addCol) {
                            // Do not show parent add column when this product has variants
                            if (addCol.getAttribute && addCol.getAttribute('data-has-variants') === '1') {
                                addCol.style.display = 'none';
                            } else {
                                addCol.style.display = on ? '' : 'none';
                            }
                        }

                        // Update values when turned on
                            if (on) {
                                // Show numeric value when present; show em dash when missing (null/undefined/empty)
                                const rawInStock = item.type === 'product' ? item.in_stock : item.variant_in_stock;
                                const instockDisplay = (rawInStock === null || typeof rawInStock === 'undefined' || rawInStock === '') ? '—' : String(rawInStock);
                                if (instockEl) instockEl.textContent = instockDisplay;

                                // If there's no in-stock data, show em dash for status as well
                                let statusTextNow = '—';
                                if (!(rawInStock === null || typeof rawInStock === 'undefined' || rawInStock === '')) {
                                    const inStockNumNow = parseFloat(rawInStock || 0);
                                    statusTextNow = 'In stock';
                                    if (isNaN(inStockNumNow) || inStockNumNow <= 0) statusTextNow = 'Out of stock';
                                    else if (item.type === 'product' ? (item.low_stock && item.low_stock !== '' && inStockNumNow <= parseFloat(item.low_stock)) : (item.variant_low_stock && item.variant_low_stock !== '' && inStockNumNow <= parseFloat(item.variant_low_stock))) statusTextNow = 'Low stock';
                                }
                                if (statusEl) statusEl.textContent = statusTextNow;
                            } else {
                                if (instockEl) instockEl.textContent = '';
                                if (statusEl) statusEl.textContent = '';
                            }

                        this.setAttribute('aria-checked', on ? 'true' : 'false');

                        // Also toggle variant rows (if any) so the main product's toggle controls all variants
                        try {
                            const variantListEl = rowWrapper ? rowWrapper.querySelector('.variant-list') : null;
                            if (variantListEl) {
                                // Show/hide the entire variant list when parent tracking toggles
                                try {
                                    if (on) variantListEl.classList.remove('hidden');
                                    else variantListEl.classList.add('hidden');
                                } catch (e) {}
                                
                                const vRows = variantListEl.querySelectorAll('.barcode-result-row');
                                vRows.forEach(vRow => {
                                    try {
                                        const vInstCol = vRow.querySelector('.br-col-instock');
                                        const vStatusCol = vRow.querySelector('.br-col-status');
                                        const vAddCol = vRow.querySelector('.br-col-add');
                                        if (vInstCol) vInstCol.style.display = on ? '' : 'none';
                                        if (vStatusCol) vStatusCol.style.display = on ? '' : 'none';
                                        if (vAddCol) vAddCol.style.display = on ? '' : 'none';

                                        // Update displayed values when turning on
                                        if (on) {
                                            const rawIn = vRow.getAttribute('data-in-stock');
                                            const rawLow = vRow.getAttribute('data-low-stock');
                                            const vInstEl = vRow.querySelector('.br-instock-value');
                                            const vStatusEl = vRow.querySelector('.br-status');
                                            const instockDisplay = (rawIn === null || typeof rawIn === 'undefined' || rawIn === '') ? '—' : String(rawIn);
                                            if (vInstEl) vInstEl.textContent = instockDisplay;
                                            let statusTextNow = '—';
                                            if (!(rawIn === null || typeof rawIn === 'undefined' || rawIn === '')) {
                                                const inNum = parseFloat(rawIn || 0);
                                                statusTextNow = 'In stock';
                                                if (isNaN(inNum) || inNum <= 0) statusTextNow = 'Out of stock';
                                                else if (rawLow && rawLow !== '' && inNum <= parseFloat(rawLow)) statusTextNow = 'Low stock';
                                            }
                                            if (vStatusEl) vStatusEl.textContent = statusTextNow;
                                        } else {
                                            const vInstEl = vRow.querySelector('.br-instock-value');
                                            const vStatusEl = vRow.querySelector('.br-status');
                                            if (vInstEl) vInstEl.textContent = '';
                                            if (vStatusEl) vStatusEl.textContent = '';
                                        }
                                    } catch (e) { /* per-row error should not break loop */ }
                                });
                            }
                        } catch (e) { console.error('toggle variants error', e); }

                        // Persist the product-level tracking change to server (optimistic)
                        try {
                            const productId = node.getAttribute('data-product-id');
                            if (productId) {
                                fetch('api.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'update_track', product_id: parseInt(productId), value: on ? 1 : 0 })
                                }).then(res => res.json())
                                  .then(resp => {
                                      if (!resp || !resp.success) {
                                          // revert toggle if API failed
                                          trackToggle.checked = !on;
                                          trackToggle.setAttribute('aria-checked', (!on) ? 'true' : 'false');
                                          showErrorPopup('Failed to update track stock on server');
                                      }
                                  }).catch(err => {
                                      trackToggle.checked = !on;
                                      trackToggle.setAttribute('aria-checked', (!on) ? 'true' : 'false');
                                      console.error('update_track error', err);
                                      showErrorPopup('Failed to update track stock');
                                  });
                            }
                        } catch (e) {
                            console.error('persist track change error', e);
                        }
                    });
                }

                // Populate in-stock and status only when tracking is on; otherwise leave blank
                if (trackingOn) {
                    const rawInStock = item.type === 'product' ? item.in_stock : item.variant_in_stock;
                    const instockDisplay = (rawInStock === null || typeof rawInStock === 'undefined' || rawInStock === '') ? '—' : String(rawInStock);
                    if (instockEl) instockEl.textContent = instockDisplay;
                    let statusText = '—';
                    if (!(rawInStock === null || typeof rawInStock === 'undefined' || rawInStock === '')) {
                        const inStockNum = parseFloat(rawInStock || 0);
                        statusText = 'In stock';
                        if (isNaN(inStockNum) || inStockNum <= 0) statusText = 'Out of stock';
                        else if (item.type === 'product' ? (item.low_stock && item.low_stock !== '' && inStockNum <= parseFloat(item.low_stock)) : (item.variant_low_stock && item.variant_low_stock !== '' && inStockNum <= parseFloat(item.variant_low_stock))) statusText = 'Low stock';
                    }
                    if (statusEl) statusEl.textContent = statusText;
                } else {
                    if (instockEl) instockEl.textContent = '';
                    if (statusEl) statusEl.textContent = '';
                }

                // Hide columns initially if tracking is off
                if (!trackingOn) {
                    if (instockCol) instockCol.style.display = 'none';
                    if (statusCol) statusCol.style.display = 'none';
                    if (addCol) addCol.style.display = 'none';
                }

                // Wire add button
                if (addBtn) {
                    addBtn.addEventListener('click', function() {
                        const rawQty = addQty ? addQty.value.trim() : '';
                        const qty = rawQty === '' ? 0 : parseFloat(rawQty);
                        if (!qty || isNaN(qty) || qty <= 0) {
                            showErrorPopup('Please enter a quantity greater than 0');
                            return;
                        }

                        // Read unit suffix from any nearby unit-value if present (support main product inStock input unit sync)
                        let unit = '';
                        try {
                            const anyUnit = node.querySelector('.unit-value');
                            if (anyUnit) unit = anyUnit.textContent.trim();
                        } catch (e) {}

                        // Floating ghost number immediately (optimistic) near the in-stock cell
                        try {
                            if (instockEl) {
                                const ghost = document.createElement('div');
                                ghost.className = 'ghost-add-number';
                                ghost.textContent = `+${qty}${(unit && unit !== '- -') ? ' ' + unit : ''}`;
                                node.appendChild(ghost);
                                // compute position after it's in DOM
                                const instRect = instockEl.getBoundingClientRect();
                                const rowRect = node.getBoundingClientRect();
                                const ghostRect = ghost.getBoundingClientRect();
                                // Nudge left a bit so the ghost aligns over the numeric text
                                const centerX = instRect.left - rowRect.left + (instRect.width / 2) - (ghostRect.width / 2) - 6;
                                const centerY = instRect.top - rowRect.top + (instRect.height / 2) - (ghostRect.height / 2);
                                ghost.style.left = (centerX > 4 ? centerX : 4) + 'px';
                                ghost.style.top = (centerY > 2 ? centerY : 2) + 'px';
                                requestAnimationFrame(() => {
                                    ghost.style.animation = 'ghost-float 900ms ease-out forwards';
                                });
                                setTimeout(() => { try { ghost.remove(); } catch(e){} }, 1000);
                            }
                        } catch (e) { console.error('ghost immediate error', e); }

                        // Prepare optimistic UI: disable controls
                        addBtn.disabled = true;
                        addQty.disabled = true;

                        // Call API to add stock (product or variant)
                        const payload = { action: 'add_stock', product_id: node.getAttribute('data-product-id') ? parseInt(node.getAttribute('data-product-id')) : 0, qty: qty };
                        if (node.getAttribute('data-variant-id')) payload.variant_id = parseInt(node.getAttribute('data-variant-id'));
                        if (unit && unit !== '- -') payload.unit = unit;

                        fetch('api.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        }).then(res => res.json())
                        .then(resp => {
                            if (!resp || !resp.success) throw new Error(resp && resp.error ? resp.error : 'Unknown error');

                            // Update UI with new in-stock and status from server
                            const newInStock = resp.new_in_stock || resp.new_in_stock === '' ? resp.new_in_stock : null;
                            const newStatus = resp.status || '';
                            if (instockEl) instockEl.textContent = newInStock !== null ? newInStock : '—';
                            if (statusEl) statusEl.textContent = newStatus || '—';

                            // Play added animation
                            node.classList.add('added');
                            setTimeout(() => node.classList.remove('added'), 900);

                            // Show success area by replacing the row content after the added animation completes
                            const successCol = node.querySelector('.br-col-success');
                            const successMsg = node.querySelector('.br-success-message');
                            const successAgainBtn = node.querySelector('.br-add-again');

                            // Wait for the visual 'added' animation to finish before replacing content
                            setTimeout(() => {
                                try {
                                    // Hide all data columns inside the row (except success col)
                                    const cols = node.querySelectorAll('.br-col');
                                    cols.forEach(col => {
                                        if (!col.classList.contains('br-col-success')) {
                                            col.style.display = 'none';
                                        }
                                    });

                                    // Populate success message with full details per requested format
                                    const nameText = nameEl ? nameEl.textContent.trim() : '';
                                    const categoryText = catEl ? catEl.textContent.trim() : '';
                                    // Determine unit: prefer explicit unit, otherwise try to extract from server new_in_stock
                                    let displayUnit = (unit && unit !== '- -') ? unit : '';
                                    const totalTextRaw = (newInStock !== null) ? String(newInStock) : '';
                                    if (!displayUnit && totalTextRaw) {
                                        // extract anything after the number as unit (e.g., '7611 pcs' -> 'pcs')
                                        const m = totalTextRaw.match(/^\s*[0-9]+(?:\.[0-9]+)?\s*(.*)$/);
                                        if (m && m[1]) displayUnit = m[1].trim();
                                    }
                                    // Format added qty with unit directly beside number (no space)
                                    const addedQtyDisplay = `${qty}${displayUnit || ''}`;
                                    // Normalize total (remove any space between number and unit for compact display)
                                    const totalText = totalTextRaw || '';
                                    const totalDisplay = totalText ? totalText.replace(/\s+/g, '') : '—';
                                    // Normalize status to requested phrasing
                                    let statusTextNow = (newStatus || '').trim();
                                    if (!statusTextNow) statusTextNow = '—';
                                    else if (statusTextNow.toLowerCase().includes('with')) statusTextNow = 'With stock';
                                    else if (statusTextNow.toLowerCase().includes('low')) statusTextNow = 'Low stock';
                                    else if (statusTextNow.toLowerCase().includes('out')) statusTextNow = 'Out of stock';

                                    if (successMsg) {
                                        successMsg.textContent = `You've successfully added ${addedQtyDisplay} of ${nameText || ''} under ${categoryText || 'No Category'} with a total of ${totalDisplay} (${statusTextNow})`;
                                    }

                                        // remember added qty and unit on the row for undo
                                        try { node._lastAdded = { qty: qty, unit: displayUnit || unit || '' }; } catch (e) {}

                                        if (successCol) successCol.style.display = '';

                                            // (ghost already shown immediately on click)

                                    // Wire Add again: restore original columns and input
                                    if (successAgainBtn) {
                                        successAgainBtn.onclick = function() {
                                            const cols = node.querySelectorAll('.br-col');
                                            cols.forEach(col => {
                                                if (!col.classList.contains('br-col-success')) {
                                                    if (col.classList.contains('br-col-instock') || col.classList.contains('br-col-status') || col.classList.contains('br-col-add')) {
                                                        if (trackingOn) col.style.display = '';
                                                        else col.style.display = 'none';
                                                    } else {
                                                        col.style.display = '';
                                                    }
                                                }
                                            });

                                            if (successCol) successCol.style.display = 'none';
                                            if (addQty) { addQty.style.display = ''; addQty.disabled = false; addQty.value = ''; addQty.focus(); }
                                            if (addBtn) { addBtn.style.display = ''; addBtn.disabled = false; }
                                        };
                                    }

                                        // Wire Undo button
                                        const undoBtn = node.querySelector('.br-undo');
                                        if (undoBtn) {
                                            undoBtn.onclick = function() {
                                                // read last added
                                    console.log('br-undo clicked for node', node && node.getAttribute ? node.getAttribute('data-product-id') : node, 'lastAdded:', node._lastAdded);
                                    // read last added
                                    const last = node._lastAdded || { qty: qty, unit: displayUnit || unit || '' };
                                    // give quick UI feedback
                                    const prevText = undoBtn.textContent;
                                    try { undoBtn.textContent = 'Undoing…'; } catch (e) {}
                                                const undoQty = -Math.abs(parseFloat(last.qty) || -qty);
                                                // call adjust_stock to subtract
                                                const adjustPayload = { action: 'adjust_stock', product_id: parseInt(node.getAttribute('data-product-id') || 0), qty: undoQty };
                                                if (node.getAttribute('data-variant-id')) adjustPayload.variant_id = parseInt(node.getAttribute('data-variant-id'));
                                                if (last.unit && last.unit !== '- -') adjustPayload.unit = last.unit;
                                                undoBtn.disabled = true;
                                                fetch('api.php', {
                                                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adjustPayload)
                                                }).then(r => r.json()).then(res => {
                                                    if (!res || !res.success) throw new Error(res && res.error ? res.error : 'Undo failed');
                                                    // update instock/status text
                                                    if (instockEl) instockEl.textContent = res.new_in_stock || '—';
                                                    if (statusEl) statusEl.textContent = res.status || '—';
                                                    // restore row UI (same as Add again)
                                                    const cols = node.querySelectorAll('.br-col');
                                                    cols.forEach(col => {
                                                        if (!col.classList.contains('br-col-success')) {
                                                            if (col.classList.contains('br-col-instock') || col.classList.contains('br-col-status') || col.classList.contains('br-col-add')) {
                                                                if (trackingOn) col.style.display = '';
                                                                else col.style.display = 'none';
                                                            } else {
                                                                col.style.display = '';
                                                            }
                                                        }
                                                    });
                                                    if (successCol) successCol.style.display = 'none';
                                                    if (addQty) { addQty.style.display = ''; addQty.disabled = false; addQty.value = ''; }
                                                    if (addBtn) { addBtn.style.display = ''; addBtn.disabled = false; }
                                                    console.log('adjust_stock response', res);
                                                    // restore undo button state/text in case it remains
                                                    try { undoBtn.disabled = false; undoBtn.textContent = prevText; } catch (e) {}
                                                }).catch(err => {
                                                    console.error('undo error', err);
                                                    showErrorPopup('Failed to undo: ' + (err.message || err));
                                                    try { undoBtn.disabled = false; undoBtn.textContent = prevText; } catch (e) {}
                                                });
                                            };
                                        }
                                } catch (e) {
                                    console.error('replace row content error', e);
                                }
                            }, 750); // slightly longer than animation so the jump finishes first
                        }).catch(err => {
                            console.error('add_stock error', err);
                            showErrorPopup('Failed to add stock: ' + (err.message || err));
                            // Re-enable inputs
                            addBtn.disabled = false;
                            addQty.disabled = false;
                        });
                    });
                }

                // Recommendation tooltip: attach focus/blur handlers when the row is rendered
                if (addQty) {
                    addQty.addEventListener('focus', function() {
                        try {
                            const curText = instockEl ? instockEl.textContent.trim() : (node.getAttribute('data-in-stock') || '');
                            const lowText = node.getAttribute('data-low-stock') || '';
                            const parseNum = s => { const m = String(s || '').match(/^\s*([0-9]+(?:\.[0-9]+)?)/); return m ? parseFloat(m[1]) : null; };
                            const curNum = parseNum(curText);
                            const lowNum = parseNum(lowText);
                            if (lowNum !== null && (curNum === null || curNum <= lowNum)) {
                                const need = Math.max(1, Math.ceil((lowNum - (curNum || 0)) + 1));
                                let msg = node.querySelector('.br-recommend-msg');
                                if (!msg) {
                                    msg = document.createElement('div');
                                    msg.className = 'br-recommend-msg';
                                    msg.setAttribute('role','status');
                                    msg.style.visibility = 'hidden';
                                    node.appendChild(msg);
                                }
                                msg.textContent = `We recommend you adding ${need} or more to exceed low stock`;

                                const rowRect = node.getBoundingClientRect();
                                const inputRect = addQty.getBoundingClientRect();
                                const inner = node.closest('.barcode-results-inner') || node.parentElement;
                                const innerRect = inner ? inner.getBoundingClientRect() : rowRect;

                                msg.style.display = '';
                                const ttWidth = Math.min((msg.offsetWidth || 160), Math.max(80, innerRect.width - 12));
                                const ttHeight = msg.offsetHeight || 28;
                                let left = (inputRect.right - rowRect.left) - ttWidth;
                                let top = (inputRect.top - rowRect.top) - ttHeight - 6;
                                const minLeft = 6;
                                const maxLeft = Math.max(6, rowRect.width - ttWidth - 6);
                                if (left < minLeft) left = minLeft;
                                if (left > maxLeft) left = maxLeft;
                                const minTop = -ttHeight - 6;
                                if (top < minTop) top = minTop;
                                msg.style.left = Math.round(left) + 'px';
                                msg.style.top = Math.round(top) + 'px';
                                msg.style.visibility = 'visible';
                            }
                        } catch (e) { console.error('recommend focus error', e); }
                    });
                    addQty.addEventListener('blur', function() {
                        try {
                            const msg = node.querySelector('.br-recommend-msg');
                            if (msg) msg.style.display = 'none';
                        } catch (e) {}
                    });
                    // Hide tooltip as soon as the user types
                    addQty.addEventListener('input', function() {
                        try {
                            const msg = node.querySelector('.br-recommend-msg');
                            if (msg) msg.style.display = 'none';
                        } catch (e) {}
                    });
                }

                // parent already appended inside rowWrapper earlier; no-op here
            });

            // Add a CTA to create new item with same barcode below results (only for pure barcode searches)
            if (typeof searchType === 'undefined' || searchType === 'barcode') {
                const cta = document.createElement('div');
                cta.style.marginTop = '12px';
                cta.style.textAlign = 'center';
                const createBtn = document.createElement('button');
                createBtn.type = 'button';
                createBtn.className = 'btn';
                createBtn.textContent = 'Add new item with same barcode';
                createBtn.addEventListener('click', function() {
                    // Hide/clear barcode results panel before opening Add Items
                    const brPanel = document.getElementById('barcodeResultsTabPanel');
                    const brMount = document.getElementById('barcodeResultsMount');
                    if (brMount) brMount.innerHTML = '';
                    if (brPanel) brPanel.style.display = 'none';

                    // Open add items prefilling barcode and ensure listeners are attached
                    showTab('addItems');
                    try { window.ensureAttachAddItems(); } catch (e) { console.error('ensureAttachAddItems failed', e); }
                    // populate inline form
                    setTimeout(() => {
                        const inlineBarcode = document.getElementById('inlineItemBarcode');
                        const inlineName = document.getElementById('inlineItemName');
                        if (inlineBarcode) inlineBarcode.value = searchedBarcode || '';
                        if (inlineName) inlineName.focus();
                    }, 120);
                });
                cta.appendChild(createBtn);
                mount.appendChild(cta);
            }
        }, 120);
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
        // Fully stop the scanner and camera when the modal is closed
        try { stopScanner(); } catch (e) { console.warn('stopScanner failed', e); }
        if (scannerModal) scannerModal.classList.remove('show');
        
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
        
        // Do not clear or disable manual inputs or uncheck checkboxes here; keep user data
        // updateNextButtonState();
        
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
        // Route Next to manual or normal handler depending on current mode/tab
        nextBtn.onclick = function(e) {
            // If manual tab is active or manual mode flag is set, use manual handler
            if (typeof isManualMode !== 'undefined' && isManualMode) {
                handleManualNext(e);
            } else if (typeof currentTab !== 'undefined' && currentTab === 'manual') {
                handleManualNext(e);
            } else {
                handleNext(e);
            }
        };
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
    
    // Manual entry fields are always enabled; checkboxes have no effect
    // Track Stock checkbox functionality
    const trackStockCheckbox = document.getElementById('trackStock');
    const stockSection = document.getElementById('stockSection');
    const goBackBtn = document.getElementById('goBackBtn');

    if (trackStockCheckbox && stockSection) {
        trackStockCheckbox.addEventListener('change', function() {
            if (this.checked) {
                stockSection.style.display = 'block';
            } else {
                stockSection.style.display = 'none';
            }
        });
    }

    if (goBackBtn) {
        goBackBtn.addEventListener('click', goBackToTabs);
    }

    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn && scannerModal) {
        addProductBtn.onclick = function() {
            scannerModal.style.display = 'flex';
            showTab('addItems');
        };
    }
    // Optionally, add logic to close modal when clicking outside or pressing Escape
    window.onclick = function(e) {
        if (e.target === scannerModal) {
            scannerModal.style.display = 'none';
        }
    };
    window.onkeydown = function(e) {
        if (e.key === 'Escape') {
            scannerModal.style.display = 'none';
        }
    };
});

// Checkbox auto-check/uncheck logic for manual SKU/Barcode
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        var skuInput = document.getElementById('manualSKU');
        var skuCheckbox = document.getElementById('enableSKU');
        var barcodeInput = document.getElementById('manualBarcode');
        var barcodeCheckbox = document.getElementById('enableBarcode');

        // Guard flag to prevent blur logic when clicking checkbox
        var skuBlurByCheckbox = false;
        var barcodeBlurByCheckbox = false;

        if (skuInput && skuCheckbox) {
            skuCheckbox.addEventListener('mousedown', function() {
                skuBlurByCheckbox = true;
            });
            skuInput.addEventListener('focus', function() {
                skuCheckbox.checked = true;
            });
            skuInput.addEventListener('blur', function() {
                if (skuBlurByCheckbox) {
                    skuBlurByCheckbox = false;
                    return; // Don't uncheck if blur caused by checkbox click
                }
                if (!skuInput.value.trim()) {
                    skuCheckbox.checked = false;
                } else {
                    skuCheckbox.checked = true;
                }
            });
            skuInput.addEventListener('input', function() {
                if (skuInput.value.trim()) {
                    skuCheckbox.checked = true;
                }
            });
        }
        if (barcodeInput && barcodeCheckbox) {
            barcodeCheckbox.addEventListener('mousedown', function() {
                barcodeBlurByCheckbox = true;
            });
            barcodeInput.addEventListener('focus', function() {
                barcodeCheckbox.checked = true;
            });
            barcodeInput.addEventListener('blur', function() {
                if (barcodeBlurByCheckbox) {
                    barcodeBlurByCheckbox = false;
                    return;
                }
                if (!barcodeInput.value.trim()) {
                    barcodeCheckbox.checked = false;
                } else {
                    barcodeCheckbox.checked = true;
                }
            });
            barcodeInput.addEventListener('input', function() {
                if (barcodeInput.value.trim()) {
                    barcodeCheckbox.checked = true;
                }
            });
        }
    });
})();



// --- TAB PANEL LOGIC FOR MODAL ---
// Tab names: 'scan', 'manual', 'addItems'
let currentTab = 'scan';
let previousTab = 'scan';

// Helper: always show the correct tab panel with transitions
function showTab(tabName, transition = true) {
    const scanPanel = document.getElementById('scanTabPanel');
    const manualPanel = document.getElementById('manualTabPanel');
    const addItemsPanel = document.getElementById('addItemsTabPanel');
    const barcodePanel = document.getElementById('barcodeResultsTabPanel');
    // Hide all panels, but if opening addItems, animate previous panel out first, then animate addItems in
    if (tabName === 'addItems') {
        const prevPanel = { scan: scanPanel, manual: manualPanel }[previousTab];
        const modalContent = document.querySelector('.modal-content.scanner-modal');
        if (addItemsPanel) {
            // Make sure addItemsPanel is rendered for sizing
            addItemsPanel.style.display = 'block';
            // Auto-generate SKU only if input is empty removed
            // Temporarily set width to 'auto' to measure natural content width
            const prevWidth = addItemsPanel.style.width;
            addItemsPanel.style.width = 'auto';
            // Measure new panel height and natural width
            const newHeight = addItemsPanel.offsetHeight;
            const newWidth = addItemsPanel.scrollWidth;
            // Restore panel width
            addItemsPanel.style.width = prevWidth || '';
            // Set modal container height and width to new panel size before transition
            if (modalContent) {
                modalContent.style.height = newHeight + 'px';
                modalContent.style.width = newWidth + 'px';
            }
            // Start transition
            addItemsPanel.classList.add('slide-in');
            addItemsPanel.classList.add('active');
            // Ensure back and cancel buttons are clickable (attach handlers here to guarantee wiring)
            try {
                const backBtn = addItemsPanel.querySelector('#backInlineAddItems');
                const cancelBtn = addItemsPanel.querySelector('.cancel-secondary');
                if (backBtn) {
                    backBtn.style.pointerEvents = 'auto';
                    backBtn.style.zIndex = 9999;
                    backBtn.onclick = function(e) { e.preventDefault(); showTab(previousTab); };
                }
                if (cancelBtn) {
                    cancelBtn.style.pointerEvents = 'auto';
                    cancelBtn.style.zIndex = 9999;
                    cancelBtn.onclick = function(e) { e.preventDefault(); showTab(previousTab); };
                }
            } catch (e) { console.error('attach back handlers error', e); }
            if (prevPanel) {
                prevPanel.classList.add('slide-out-left');
                prevPanel.classList.remove('slide-in');
                prevPanel.classList.add('active');
                prevPanel.style.display = 'block';
            }
            // After animation, hide previous panel and reset Add Items position and modal size
            setTimeout(() => {
                if (prevPanel) {
                    prevPanel.classList.remove('active', 'slide-out-left');
                    prevPanel.style.display = 'none';
                }
                addItemsPanel.classList.remove('slide-in');
                addItemsPanel.style.position = 'relative';
                if (modalContent) {
                    modalContent.style.height = '';
                    modalContent.style.width = '';
                }
            }, 250);
        }
        // Hide tab buttons
        var modalTabs = document.querySelector('.modal-tabs');
        var scanTabBtn = document.getElementById('scanTab');
        var manualTabBtn = document.getElementById('manualTab');
        if (modalTabs) modalTabs.style.display = 'none';
        if (scanTabBtn) scanTabBtn.classList.remove('active');
        if (manualTabBtn) manualTabBtn.classList.remove('active');
        // Also add hide-tabs class to modal-content for CSS-driven hiding
        const modalContentElem = document.querySelector('.modal-content.scanner-modal');
        if (modalContentElem) modalContentElem.classList.add('hide-tabs');
    } else if (currentTab === 'addItems') {
        // Reverse transition: going back from Add Items to scan/manual
        const prevPanel = { scan: scanPanel, manual: manualPanel }[tabName];
        const modalContent = document.querySelector('.modal-content.scanner-modal');
        const modalTabs = document.querySelector('.modal-tabs');
        if (addItemsPanel && prevPanel) {
            // Make sure previous panel is rendered for sizing
            prevPanel.style.display = 'block';
            prevPanel.style.width = 'auto';
            const newHeight = prevPanel.offsetHeight;
            const newWidth = prevPanel.scrollWidth;
            prevPanel.style.width = '';
            if (modalContent) {
                modalContent.style.height = newHeight + 'px';
                modalContent.style.width = newWidth + 'px';
            }
            // Animate Add Items out right, previous panel in left
            addItemsPanel.classList.add('slide-out-right');
            addItemsPanel.classList.remove('slide-in');
            addItemsPanel.classList.add('active');
            prevPanel.classList.add('slide-in-left');
            prevPanel.classList.add('active');
            prevPanel.style.display = 'block';
            // Animate tab buttons in with content
            if (modalTabs) {
                modalTabs.classList.add('slide-in-left');
                modalTabs.classList.remove('slide-out-right');
                modalTabs.style.display = 'flex';
            }
            // After animation, hide Add Items panel and reset modal size/tab buttons
            setTimeout(() => {
                addItemsPanel.classList.remove('active', 'slide-out-right');
                addItemsPanel.style.display = 'none';
                prevPanel.classList.remove('slide-in-left');
                prevPanel.style.position = 'relative';
                if (modalContent) {
                    modalContent.style.height = '';
                    modalContent.style.width = '';
                }
                if (modalTabs) {
                    modalTabs.classList.remove('slide-in-left');
                }
                // Remove hide-tabs class when returning from addItems
                const modalContentElem = document.querySelector('.modal-content.scanner-modal');
                if (modalContentElem) modalContentElem.classList.remove('hide-tabs');
            }, 250);
        }
        // Show tab buttons
        var scanTabBtn = document.getElementById('scanTab');
        var manualTabBtn = document.getElementById('manualTab');
        if (modalTabs) modalTabs.style.display = 'flex';
        if (scanTabBtn) scanTabBtn.classList.toggle('active', tabName === 'scan');
        if (manualTabBtn) manualTabBtn.classList.toggle('active', tabName === 'manual');
    } else if (currentTab === 'barcodeResults') {
        // Reverse transition: leaving barcodeResults back to scan/manual with animation
        const prevPanel = { scan: scanPanel, manual: manualPanel }[tabName];
        const modalContent = document.querySelector('.modal-content.scanner-modal');
        const modalTabs = document.querySelector('.modal-tabs');
        if (barcodePanel && prevPanel) {
            // Prepare previous panel for sizing
            prevPanel.style.display = 'block';
            prevPanel.style.width = 'auto';
            const newHeight = prevPanel.offsetHeight;
            const newWidth = prevPanel.scrollWidth;
            prevPanel.style.width = '';
            if (modalContent) {
                modalContent.style.height = newHeight + 'px';
                modalContent.style.width = newWidth + 'px';
            }

            // Animate barcodeResults out and previous panel in
            barcodePanel.classList.add('slide-out-right');
            barcodePanel.classList.add('active');
            prevPanel.classList.add('slide-in-left');
            prevPanel.classList.add('active');
            prevPanel.style.display = 'block';

            // Animate tab buttons back in
            if (modalTabs) {
                modalTabs.classList.add('slide-in-left');
                modalTabs.classList.remove('slide-out-right');
                modalTabs.style.display = 'flex';
            }

            setTimeout(() => {
                // After animation, hide barcode panel and reset sizes/classes
                barcodePanel.classList.remove('active', 'slide-out-right');
                barcodePanel.style.display = 'none';
                prevPanel.classList.remove('slide-in-left');
                prevPanel.style.position = 'relative';
                if (modalContent) {
                    modalContent.style.height = '';
                    modalContent.style.width = '';
                }
                if (modalTabs) modalTabs.classList.remove('slide-in-left');

                // Remove hide-tabs class when returning from barcodeResults
                const modalContentElem = document.querySelector('.modal-content.scanner-modal');
                if (modalContentElem) modalContentElem.classList.remove('hide-tabs');
                // Clear header barcode value to avoid stale text when panel is closed
                try {
                    const headerSpan = document.getElementById('barcodeResultsHeaderValue');
                    if (headerSpan) headerSpan.textContent = '';
                } catch (e) { console.error('Failed to clear barcodeResults header', e); }
            }, 250);
        }
        // Show tab buttons and set active state
        var scanTabBtn = document.getElementById('scanTab');
        var manualTabBtn = document.getElementById('manualTab');
        if (modalTabs) modalTabs.style.display = 'flex';
        if (scanTabBtn) scanTabBtn.classList.toggle('active', tabName === 'scan');
        if (manualTabBtn) manualTabBtn.classList.toggle('active', tabName === 'manual');
    } else {
        // Hide all panels instantly
        [scanPanel, manualPanel, addItemsPanel, barcodePanel].forEach(panel => {
            if (panel) {
                panel.style.display = 'none';
                panel.classList.remove('active', 'slide-in', 'slide-out-left');
                panel.style.position = 'absolute';
            }
        });
        // Show/hide tab buttons
        var modalTabs = document.querySelector('.modal-tabs');
        var scanTabBtn = document.getElementById('scanTab');
        var manualTabBtn = document.getElementById('manualTab');
        if (modalTabs) modalTabs.style.display = 'flex';
        if (scanTabBtn) scanTabBtn.classList.toggle('active', tabName === 'scan');
        if (manualTabBtn) manualTabBtn.classList.toggle('active', tabName === 'manual');
        // Show the requested panel
        const activePanel = {
            scan: scanPanel,
            manual: manualPanel,
            addItems: addItemsPanel,
            barcodeResults: barcodePanel
        }[tabName];
        if (activePanel) {
            activePanel.style.display = 'block';
            activePanel.classList.add('active');
            activePanel.style.position = 'relative';
        }
    }
    // Show/hide tab buttons
    var modalTabs = document.querySelector('.modal-tabs');
    var scanTabBtn = document.getElementById('scanTab');
    var manualTabBtn = document.getElementById('manualTab');
    if (tabName === 'addItems' || tabName === 'barcodeResults') {
        if (modalTabs) modalTabs.style.display = 'none';
        if (scanTabBtn) scanTabBtn.classList.remove('active');
        if (manualTabBtn) manualTabBtn.classList.remove('active');
    } else {
        if (modalTabs) modalTabs.style.display = 'flex';
        if (scanTabBtn) scanTabBtn.classList.toggle('active', tabName === 'scan');
        if (manualTabBtn) manualTabBtn.classList.toggle('active', tabName === 'manual');
    }
    // Show the requested panel (normal case)
    if (!(currentTab === 'addItems' && tabName !== 'addItems')) {
        const activePanel = {
            scan: scanPanel,
            manual: manualPanel,
            addItems: addItemsPanel,
            barcodeResults: barcodePanel
        }[tabName];
        if (activePanel) {
            activePanel.style.display = 'flex';
            activePanel.classList.add('active');
            // Only animate when opening addItems
            if (tabName === 'addItems' || tabName === 'barcodeResults') {
                activePanel.classList.add('slide-in');
                setTimeout(() => activePanel.classList.remove('slide-in'), 400);
            }
        }
    }
    // Toggle hide-tabs class for barcodeResults (in addition to addItems handled earlier)
    const modalContentElem = document.querySelector('.modal-content.scanner-modal');
    if (modalContentElem) {
        if (tabName === 'barcodeResults') {
            modalContentElem.classList.add('hide-tabs');
        } else if (modalContentElem.classList.contains('hide-tabs') && tabName !== 'addItems') {
            // remove only when not in addItems as that branch handles removal
            modalContentElem.classList.remove('hide-tabs');
        }
    }
    // Track previous tab for back/cancel
    if (tabName !== 'addItems' && tabName !== 'barcodeResults') {
        previousTab = tabName;
    }
    currentTab = tabName;
}

document.addEventListener('DOMContentLoaded', function () {
    // Tab buttons
    const scanTabBtn = document.getElementById('scanTab');
    const manualTabBtn = document.getElementById('manualTab');
    // Panels
    const scanPanel = document.getElementById('scanTabPanel');
    const manualPanel = document.getElementById('manualTabPanel');
    const addItemsPanel = document.getElementById('addItemsTabPanel');
    // Add Items triggers
    const skipScannerBtn = document.getElementById('skipScanner');
    const skipManualEntryBtn = document.getElementById('skipManualEntry');
    // Add Items panel buttons
    function attachAddItemsPanelListeners() {
        if (!addItemsPanel) return;
        // Back button
        const backBtn = addItemsPanel.querySelector('#backInlineAddItems');
        if (backBtn) {
            backBtn.onclick = function(e) {
                e.preventDefault();
                // If previousTab is 'manual', return to 'manual'; otherwise go to previousTab or fallback to 'scan'
                if (typeof previousTab !== 'undefined' && previousTab === 'manual') {
                    showTab('manual');
                } else if (typeof previousTab !== 'undefined' && previousTab) {
                    showTab(previousTab);
                } else {
                    showTab('scan');
                }
            };
        }
    // Back button from barcode results (global)
    const backBarcodeBtn = document.getElementById('backFromBarcodeResults');
    if (backBarcodeBtn) backBarcodeBtn.onclick = () => showTab(previousTab);
        // Cancel button
        const cancelBtn = addItemsPanel.querySelector('.cancel-secondary');
        if (cancelBtn) cancelBtn.onclick = () => showTab(previousTab);
        // Add button (form submit)
        const addBtn = addItemsPanel.querySelector('.btn.btn-primary');
        const form = addItemsPanel.querySelector('#inlineAddItemsForm');
        if (addBtn && form) {
            addBtn.onclick = function(e) {
                e.preventDefault();
                form.requestSubmit();
            };
        }
        // Form submit: let the modal's own submit handler (defined in popupmodal.php)
        // control success vs error behavior. We only wire the submit button to
        // requestSubmit so the modal script can handle server responses and
        // decide when to close or show errors.
        // (No form.onsubmit optimistic handler here.)
    }
    // Expose a safe helper so other code paths can request attaching listeners
    window.ensureAttachAddItems = function() {
        try {
            attachAddItemsPanelListeners();
        } catch (e) {
            console.error('ensureAttachAddItems error', e);
        }
    };
    // Ensure the back button on the barcode results always returns to previous tab
    const backBarcodeBtnGlobal = document.getElementById('backFromBarcodeResults');
    if (backBarcodeBtnGlobal) {
        backBarcodeBtnGlobal.addEventListener('click', function(e) {
            e.preventDefault();
            // If previousTab is not set, fallback to 'scan'
            const target = (typeof previousTab !== 'undefined' && previousTab) ? previousTab : 'scan';
            showTab(target);
        });
    }
    // Tab switching
    if (scanTabBtn) scanTabBtn.onclick = () => showTab('scan', false);
    if (manualTabBtn) manualTabBtn.onclick = () => showTab('manual', false);
    // Add Items triggers
    if (skipScannerBtn) skipScannerBtn.onclick = () => {
        showTab('addItems', true);
        window.ensureAttachAddItems();
    };
    if (skipManualEntryBtn) skipManualEntryBtn.onclick = () => {
        showTab('addItems', true);
        window.ensureAttachAddItems();
    };
    // Do not auto-switch to scan tab or start scanner on page load
    // Only start scanner when modal is open and scan tab is active
    
    // POS Options Functionality
    setupPOSOptions();
});

// POS Options Setup
function setupPOSOptions() {
    const posCheckbox = document.getElementById('availablePOS');
    const posContainer = document.getElementById('posOptionsContainer');
    const tabButtons = document.querySelectorAll('.pos-tab-btn');
    const tabPanels = document.querySelectorAll('.pos-tab-panel');
    
    // Handle checkbox toggle
    if (posCheckbox && posContainer) {
        posCheckbox.addEventListener('change', function() {
            if (this.checked) {
                posContainer.style.display = 'block';
            } else {
                posContainer.style.display = 'none';
            }
        });
    }
    
    // Handle tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Update button states
            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.style.background = '#333';
                b.style.color = '#dbdbdb';
            });
            this.classList.add('active');
            this.style.background = '#ff9800';
            this.style.color = '#171717';
            
            // Update panel visibility
            tabPanels.forEach(panel => {
                panel.style.display = 'none';
                panel.classList.remove('active');
            });
            
            const targetPanel = document.getElementById(targetTab + 'Tab');
            if (targetPanel) {
                targetPanel.style.display = 'block';
                targetPanel.classList.add('active');
            }
        });
    });
    
    // Track selected color
    let selectedColor = null;
    const colorMap = {
        'red': '#f44336',
        'orange': '#ff9800',
        'yellow': '#ffeb3b',
        'green': '#4caf50',
        'blue': '#2196f3',
        'purple': '#9c27b0',
        'brown': '#795548',
        'gray': '#607d8b'
    };
    
    // Color selection functionality
    const colorOptions = document.querySelectorAll('.color-option');
    const shapeOptions = document.querySelectorAll('.shape-option');
    
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selection from other colors
            colorOptions.forEach(c => {
                c.style.border = '2px solid transparent';
                c.style.transform = 'scale(1)';
            });
            // Highlight selected color
            this.style.border = '2px solid #fff';
            this.style.transform = 'scale(1.2)';
            
            // Update selected color
            selectedColor = this.dataset.color;
            
            // Update selected shape with new color (if any shape is selected)
            updateSelectedShapeColor();
        });
    });
    
    // Helper function to update selected shape with new color
    function updateSelectedShapeColor() {
        const selectedShape = document.querySelector('.shape-option.selected');
        if (selectedShape && selectedColor) {
            const colorToUse = colorMap[selectedColor];
            // Apply new color to the selected shape
            if (selectedShape.dataset.shape === 'triangle') {
                selectedShape.style.borderBottom = `20px solid ${colorToUse}`;
            } else if (selectedShape.dataset.shape === 'star' || selectedShape.dataset.shape === 'hexagon') {
                selectedShape.style.background = colorToUse;
                selectedShape.style.border = `2px solid ${colorToUse}`;
            } else {
                selectedShape.style.background = colorToUse;
                selectedShape.style.border = '2px solid #fff';
            }
        }
    }
    
    // Shape selection functionality
    shapeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selection from other shapes
            shapeOptions.forEach(s => {
                if (s.dataset.shape === 'triangle') {
                    s.style.borderBottom = '20px solid #555';
                } else {
                    s.style.background = '#555';
                    s.style.border = '2px solid transparent';
                }
                s.style.transform = s.dataset.shape === 'diamond' ? 'rotate(45deg)' : 'scale(1)';
                s.classList.remove('selected');
            });

            // Determine color to use
            const colorToUse = selectedColor ? colorMap[selectedColor] : '#555';

            // Highlight selected shape with appropriate color
            if (this.dataset.shape === 'triangle') {
                this.style.borderBottom = `20px solid ${colorToUse}`;
                this.style.transform = 'scale(1.2)';
            } else if (this.dataset.shape === 'star' || this.dataset.shape === 'hexagon') {
                this.style.background = colorToUse;
                this.style.border = `2px solid ${colorToUse}`;
                this.style.transform = 'scale(1.2)';
            } else {
                this.style.background = colorToUse;
                this.style.border = selectedColor ? '2px solid #fff' : '2px solid transparent';
                if (this.dataset.shape === 'diamond') {
                    this.style.transform = 'rotate(45deg) scale(1.2)';
                } else {
                    this.style.transform = 'scale(1.2)';
                }
            }
            this.classList.add('selected');
        });
    });
    
    // Image upload functionality
    const imageUploadArea = document.querySelector('.image-upload-area');
    const imageInput = document.getElementById('posProductImage');
    const imagePreview = document.getElementById('imagePreview');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    
    if (imageUploadArea && imageInput) {
        // Click to upload
        imageUploadArea.addEventListener('click', function() {
            imageInput.click();
        });
        
        // Handle file selection
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('Please select a valid image file.');
                    return;
                }
                
                // Validate file size (10MB limit)
                if (file.size > 10 * 1024 * 1024) {
                    alert('Image size must be less than 10MB.');
                    return;
                }
                
                // Preview image
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Drag and drop functionality
        imageUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ff9800';
            this.style.background = '#222';
        });
        
        imageUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#555';
            this.style.background = '#1a1a1a';
        });
        
        imageUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#555';
            this.style.background = '#1a1a1a';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                imageInput.files = files;
                imageInput.dispatchEvent(new Event('change'));
            }
        });
    }
}