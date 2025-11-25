// Stop Quagga and camera stream
function stopScanner() {
    try {
        if (window.Quagga && window.Quagga.initialized) {
            window.Quagga.stop();
            window.Quagga.initialized = false;
        }
        // Do NOT stop camera stream — prefer the page's camera element if available
        try {
            const v = (typeof videoEl !== 'undefined' && videoEl) ? videoEl : document.getElementById('cameraVideo');
            if (v && v.srcObject) {
                v.pause();
                v.srcObject.getTracks().forEach(track => track.stop());
                v.srcObject = null;
            }
        } catch (e) {
            // swallow errors, they are already logged by outer catch
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

// Evaluate simple arithmetic expressions entered into quantity fields (e.g. "1/4", "2+3/4").
// Returns a Number (0 on invalid input).
window.evaluateQuantityExpression = function(expr) {
    try {
        if (expr === null || typeof expr === 'undefined') return 0;
        var s = String(expr).trim();
        if (s === '') return 0;
        // Remove common currency symbols and commas
        s = s.replace(/[,_\s\u20B1\$]/g, '');
        // Allow only digits, operators, parentheses, decimal point and whitespace
        s = s.replace(/[^0-9+\-*/().\s]/g, '');
        if (s === '') return 0;
        // Reject obviously dangerous tokens
        if (/[a-zA-Z]|\/\/|\/\*|\*\*/.test(s)) return 0;
        // Evaluate expression in a safe function scope
        var val = Function('"use strict"; return (' + s + ')')();
        var num = Number(val);
        return (isFinite(num) ? num : 0);
    } catch (e) {
        return 0;
    }
};

// Restrict .comp-qty inputs to only numbers and + - * / and decimal point.
// Use delegated listeners so dynamically created inputs are covered.
document.addEventListener('keydown', function(e) {
    try {
        var t = e.target;
        if (!t || !t.classList) return;
        if (!t.classList.contains('comp-qty')) return;
        // Allow navigation and control keys
        var allowedControl = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
        if (allowedControl.indexOf(e.key) !== -1) return;
        // Allow Ctrl/Meta combos (copy/paste/select)
        if (e.ctrlKey || e.metaKey) return;
        // Allowed characters (include SPACE so users can type expressions like "1 / 4")
        var allowedChars = '0123456789+-*/. ';
        if (e.key.length === 1 && allowedChars.indexOf(e.key) === -1) {
            e.preventDefault();
        }
    } catch (ex) {}
});

document.addEventListener('input', function(e) {
    try {
        var t = e.target;
        if (!t || !t.classList) return;
        if (!t.classList.contains('comp-qty')) return;
        var v = t.value || '';
        // Remove any disallowed characters (keep digits, +-*/., and whitespace)
        var cleaned = String(v).replace(/[^0-9+\-*/.\s]/g, '');
        if (cleaned !== v) {
            var pos = t.selectionStart || 0;
            t.value = cleaned;
            try { t.setSelectionRange(pos - 1, pos - 1); } catch(e) {}
        }
    } catch (ex) {}
});

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
            // Prevent focus styling from overriding red border for duplicates
            skuInput.addEventListener('focus', function() {
                // Check if this input is a duplicate
                const allSkuInputs = Array.from(document.querySelectorAll('.variant-sku'));
                const val = skuInput.value.trim();
                const skuCount = allSkuInputs.filter(input => input.value.trim() === val).length;
                if (val && skuCount > 1) {
                    skuInput.classList.add('sku-error');
                    skuInput.style.borderBottomColor = '#dc3545';
                }
            });
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
                                                            // mark this panel as showing a composite product so later
                                                            // handlers can detect composite-edit flows
                                                            try { if (panel) panel.setAttribute('data-is-composite', '1'); } catch(e) {}
                                                if (pStatus) pStatus.textContent = statusText;
                                                try { parentNode.setAttribute('data-in-stock', foundAny ? String(sum) : ''); } catch (e) {}
                                            }
                                        }
                                    }
                                }
                            } catch (e) { console.error('delegated parent recalc failed', e); }
                                                        // Restore inline cost readonly state if we captured it in the snapshot
                                                        try {
                                                            const mainCostInput = panel.querySelector('#inlineItemCost') || document.getElementById('inlineItemCost');
                                                            if (mainCostInput && typeof snap.inlineCostReadOnly !== 'undefined' && snap.inlineCostReadOnly !== null) {
                                                                try {
                                                                    if (snap.inlineCostReadOnly) {
                                                                        mainCostInput.readOnly = true; mainCostInput.setAttribute('readonly','readonly');
                                                                    } else {
                                                                        mainCostInput.readOnly = false; try { mainCostInput.removeAttribute('readonly'); } catch(e) {}
                                                                    }
                                                                } catch(e) {}
                                                            }
                                                        } catch(e) {}
                                                        // Restore create-item search visibility and add-variant button visibility
                                                        try {
                                                            const createSearchEl = panel.querySelector('#createItemSearch') || document.getElementById('createItemSearch');
                                                            if (createSearchEl && typeof snap.createSearchVisible !== 'undefined' && snap.createSearchVisible !== null) {
                                                                try { createSearchEl.style.display = snap.createSearchVisible ? '' : 'none'; } catch(e) {}
                                                            }
                                                        } catch(e) {}
                                                        try {
                                                            const addVariantBtnEl = (panel && panel.querySelector) ? panel.querySelector('.variants-add-btn') : document.querySelector('.variants-add-btn');
                                                            if (addVariantBtnEl && typeof snap.addVariantBtnVisible !== 'undefined' && snap.addVariantBtnVisible !== null) {
                                                                try { addVariantBtnEl.style.display = snap.addVariantBtnVisible ? '' : 'none'; } catch(e) {}
                                                            }
                                                        } catch(e) {}

                                                        // Restore name-dropdown visibility and clear composite-hide flag
                                                        try {
                                                            const nameDropdown = document.getElementById('nameDropdown');
                                                            if (nameDropdown && typeof snap.inlineNameDropdownVisible !== 'undefined' && snap.inlineNameDropdownVisible !== null) {
                                                                try {
                                                                    if (snap.inlineNameDropdownVisible) {
                                                                        nameDropdown.classList.add('show');
                                                                        nameDropdown.style.display = '';
                                                                    } else {
                                                                        nameDropdown.classList.remove('show');
                                                                        nameDropdown.style.display = 'none';
                                                                    }
                                                                } catch(e) {}
                                                            }
                                                        } catch(e) {}
                                                        try { window._hideNameAutocompleteForComposite = false; } catch(e) {}

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

    // Disable/enable Create-tab Next button based on number of component rows
    function updateCreateNextButtonState() {
        try {
            const createNextBtn = document.querySelector('#createTabPanel #nextBtn');
            const body = document.getElementById('createComponentsBody');
            if (!createNextBtn) return;
            const count = body ? body.querySelectorAll('tr').length : 0;
            // Require two or more items to enable Next
            createNextBtn.disabled = !(count >= 2);
        } catch (e) { console.warn('updateCreateNextButtonState failed', e); }
    }

    // Observe create components body for changes so Next button updates automatically
    try {
        const createBody = document.getElementById('createComponentsBody');
        if (createBody && typeof MutationObserver !== 'undefined') {
            const moCreate = new MutationObserver(function(muts) {
                try { updateCreateNextButtonState(); } catch(e) {}
            });
            moCreate.observe(createBody, { childList: true, subtree: false });
        }
    } catch (e) { console.warn('create body observer failed', e); }

    // Initialize Create-tab Next button state on load
    try { updateCreateNextButtonState(); } catch(e) {}
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
            // If we're in the Create->Add flow where track toggles and cost
            // are locked/hidden, or when editing a composite, do not show
            // the Add Variants/name dropdown. This avoids offering variant
            // creation when the flow expects a composite components view.
            if (window && (window._hideTrackToggle || window._inlineCostFixed || window._hideNameAutocompleteForComposite)) return;
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
            if (nameInput.value.trim() !== '' && !isVariantsMode && !(window && (window._hideTrackToggle || window._inlineCostFixed || window._hideNameAutocompleteForComposite))) {
                showDropdown();
            }
        });
        
        nameInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            
            // Clear existing timers
            if (typingTimer) clearTimeout(typingTimer);
            if (hideTimer) clearTimeout(hideTimer);
            
            if (searchTerm !== '' && !isVariantsMode && !(window && (window._hideTrackToggle || window._inlineCostFixed || window._hideNameAutocompleteForComposite))) {
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
            
            // Only add an initial variant row if there are no rows yet (prevents duplicates on prefill)
            try {
                const vb = document.getElementById('variantsTableBody');
                if (vb && vb.querySelectorAll('tr').length === 0) addVariantRow();
            } catch (e) { try { addVariantRow(); } catch(er) {} }

            // Persist last state (open)
            try { localStorage.setItem('bb_variants_section_visible', '1'); } catch(e) {}
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
            // Persist last state (closed)
            try { localStorage.setItem('bb_variants_section_visible', '0'); } catch(e) {}
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
                
                // If this row represents an existing variant (has id), mark it for deletion so server removes it
                var existingVariantId = null;
                try { existingVariantId = row.getAttribute && row.getAttribute('data-variant-id') ? parseInt(row.getAttribute('data-variant-id'), 10) : null; } catch(e) { existingVariantId = null; }

                function performRemove() {
                    // If it was an existing variant, append a hidden input to the inline form so server knows to delete it
                    try {
                        if (existingVariantId && !isNaN(existingVariantId)) {
                            var formEl = document.getElementById('inlineAddItemsForm') || document.querySelector('#inlineAddItemsForm');
                            if (formEl) {
                                var hid = document.createElement('input');
                                hid.type = 'hidden';
                                hid.name = 'deleted_variants[]';
                                hid.value = String(existingVariantId);
                                formEl.appendChild(hid);
                            }
                        }
                    } catch(e) { console.warn('mark deleted variant failed', e); }
                    // Remove the row from DOM
                    try { row.remove(); } catch(e) { try { row.parentNode && row.parentNode.removeChild(row); } catch(er) {} }
                }

                // Show confirmation dialog if row has data
                if (hasData) {
                    if (confirm('Are you sure you want to delete this variant? All entered data will be lost.')) {
                        performRemove();
                    }
                } else {
                    // No data, delete immediately
                    performRemove();
                }
            });
        }
        
        // Setup unit selectors for stock fields if tracking stock
        if (isTrackingStock) {
            setupUnitSelector();
        }

        // Add SKU uniqueness check on input
        var skuInput = row.querySelector('input.variant-sku');
        if (skuInput) {
            function checkVariantDuplicates() {
                // Check for duplicates among all variant SKUs
                const allSkuInputs = Array.from(document.querySelectorAll('.variant-sku'));
                // Count occurrences and collect all duplicate values
                const skuCount = {};
                allSkuInputs.forEach(input => {
                    const val = input.value.trim();
                    if (!val) return;
                    skuCount[val] = (skuCount[val] || 0) + 1;
                });
                // Find all values that are duplicated
                const duplicates = Object.keys(skuCount).filter(val => skuCount[val] > 1);
                // Set red border for all duplicates, reset otherwise
                allSkuInputs.forEach(input => {
                    const val = input.value.trim();
                    if (val && duplicates.includes(val)) {
                        input.classList.add('sku-error');
                        input.style.borderBottomColor = '#dc3545';
                    } else {
                        input.classList.remove('sku-error');
                        input.style.borderBottomColor = '';
                    }
                });
            }
            skuInput.addEventListener('input', function() {
                // Always check for duplicates among all variant SKUs
                checkVariantDuplicates();
            });
            skuInput.addEventListener('blur', function() {
                checkSkuUniquenessBorderOnly(skuInput);
                checkVariantDuplicates();
            });
        }
// Helper: Check if a SKU is unique (not in products or variants), only set border color
function checkSkuUniquenessBorderOnly(inputEl) {
    const sku = inputEl.value.trim();
    if (!sku) {
        inputEl.classList.remove('sku-error');
        inputEl.style.borderBottomColor = '';
        return;
    }
    fetch('api.php?find=sku:' + encodeURIComponent(sku))
        .then(res => res.json())
        .then(data => {
            if (data && data.found) {
                inputEl.classList.add('sku-error');
                inputEl.style.borderBottomColor = '#dc3545';
            } else {
                inputEl.classList.remove('sku-error');
                inputEl.style.borderBottomColor = '';
            }
        })
        .catch(() => {
            inputEl.classList.remove('sku-error');
            inputEl.style.borderBottomColor = '';
        });
}

function removeSkuErrorBorderOnly(inputEl) {
    inputEl.classList.remove('sku-error');
    inputEl.style.borderBottomColor = '';
    let errorDiv = inputEl.parentElement.querySelector('.sku-error-msg');
    if (errorDiv) errorDiv.remove();
}

        // Assign SKU for the new variant row
        (function populateVariantSKU() {
            try {
                var skuInput = row.querySelector('input.variant-sku');
                if (!skuInput) return;
                // Only fetch/assign if field is currently empty
                if (skuInput.value && skuInput.value.trim() !== '') return;

                const tableBody = document.getElementById('variantsTableBody');
                const rows = Array.from(tableBody.querySelectorAll('tr'));
                const thisIndex = rows.indexOf(row);
                
                if (thisIndex === 0) {
                    // First variant: use the main SKU if available
                    const mainSkuInput = document.getElementById('inlineItemSKU');
                    if (mainSkuInput && mainSkuInput.value && mainSkuInput.value.trim() !== '') {
                        skuInput.value = mainSkuInput.value.trim();
                        skuInput.setAttribute('data-auto-filled', 'true');
                        skuInput.addEventListener('input', function onEdit() {
                            skuInput.removeAttribute('data-auto-filled');
                            skuInput.removeEventListener('input', onEdit);
                        });
                        return;
                    }
                } else if (thisIndex > 0) {
                    // Next variants: increment previous variant's SKU if numeric
                    const prevRow = rows[thisIndex - 1];
                    const prevSkuInput = prevRow.querySelector('input.variant-sku');
                    if (prevSkuInput && prevSkuInput.value) {
                        // Try to increment if numeric
                        const prevSku = prevSkuInput.value.trim();
                        if (/^\d+$/.test(prevSku)) {
                            skuInput.value = String(parseInt(prevSku, 10) + 1);
                            skuInput.setAttribute('data-auto-filled', 'true');
                            skuInput.addEventListener('input', function onEdit() {
                                skuInput.removeAttribute('data-auto-filled');
                                skuInput.removeEventListener('input', onEdit);
                            });
                            return;
                        }
                    }
                }
                // Fallback: fetch next available SKU from backend
                fetch('get_next_sku.php')
                    .then(function(resp) { return resp.json(); })
                    .then(function(data) {
                        if (data && data.next_sku) {
                            skuInput.value = data.next_sku;
                            skuInput.setAttribute('data-auto-filled', 'true');
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
    const scannerMode = document.getElementById('scannerMode');
    const manualMode = document.getElementById('manualMode');
    const cameraScanner = document.getElementById('cameraScanner');
    const hardwareScanner = document.getElementById('hardwareScanner');
    const nextBtn = document.getElementById('nextBtn');
    const skipScannerBtn = document.getElementById('skipScanner');
    const skipManualEntryBtn = document.getElementById('skipManualEntry');
    const skipCreateTabBtn = document.getElementById('skipCreateTab');
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
            // Ensure Add Items opens in normal mode (not Create->Add transient mode)
            try { restoreCreateAddState(); } catch (e) {}
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
            try { restoreCreateAddState(); } catch (e) {}
            if (inlineAddItemsMount && inlineTpl) {
                openInlineAddItemsPanel();
            } else {
                showAddItemsModalWithTransition();
            }
        });
    }
    if (skipCreateTabBtn) {
        skipCreateTabBtn.addEventListener('click', function () {
            try { restoreCreateAddState(); } catch (e) {}
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
                // Restore transient Create->Add UI state before navigating back
                try { restoreCreateAddState(); } catch (e) {}
                // If previousTab is 'manual' or 'createtab', go to that tab, else fallback to previousTab or 'scan'
                if (typeof previousTab !== 'undefined' && (previousTab === 'manual' || previousTab === 'createtab')) {
                    showTab(previousTab);
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
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                let hasError = false;
                // Check main SKU uniqueness
                const mainSkuInput = node.querySelector('#inlineItemSKU');
                if (mainSkuInput && mainSkuInput.value.trim()) {
                    const resp = await fetch('api.php?find=sku:' + encodeURIComponent(mainSkuInput.value.trim()));
                    const data = await resp.json();
                    // Remove any error message
                    let errorDiv = mainSkuInput.parentElement.querySelector('.sku-error-msg');
                    if (errorDiv) errorDiv.remove();
                    if (data && data.found) {
                        mainSkuInput.classList.add('sku-error');
                        mainSkuInput.focus();
                        hasError = true;
                    }
                }
                // Check all variant SKUs for uniqueness (in DB)
                const variantSkuInputs = node.querySelectorAll('input.variant-sku');
                for (let input of variantSkuInputs) {
                    if (input.value.trim()) {
                        const resp = await fetch('api.php?find=sku:' + encodeURIComponent(input.value.trim()));
                        const data = await resp.json();
                        // Remove any error message
                        let errorDiv = input.parentElement.querySelector('.sku-error-msg');
                        if (errorDiv) errorDiv.remove();
                        if (data && data.found) {
                            input.classList.add('sku-error');
                            if (!hasError) input.focus();
                            hasError = true;
                        }
                    }
                }
                // Check for duplicate SKUs among variants (client-side)
                const seen = {};
                variantSkuInputs.forEach(input => {
                    const val = input.value.trim();
                    if (!val) return;
                    if (seen[val]) {
                        input.classList.add('sku-error');
                        input.style.borderBottomColor = '#dc3545';
                        seen[val].classList.add('sku-error');
                        seen[val].style.borderBottomColor = '#dc3545';
                        hasError = true;
                    } else {
                        seen[val] = input;
                    }
                });
                // Prevent submit if any SKU input has sku-error class
                const allSkuInputs = [mainSkuInput, ...variantSkuInputs];
                if (allSkuInputs.some(input => input && input.classList.contains('sku-error'))) {
                    if (typeof showErrorPopup === 'function') {
                        showErrorPopup('One or more SKUs are invalid or duplicated. Please fix highlighted fields.');
                    } else if (window.showErrorPopup) {
                        window.showErrorPopup('One or more SKUs are invalid or duplicated. Please fix highlighted fields.');
                    } else {
                        alert('One or more SKUs are invalid or duplicated. Please fix highlighted fields.');
                    }
                    return false;
                }
                if (hasError) return false;
                // If all SKUs are unique, proceed
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
            // Restore Add Items header when inline panel closed
            try {
                const header = document.querySelector('#addItemsTabPanel .modal-title');
                if (header) header.textContent = 'Add new item';
            } catch (e) {}
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
                        // Don't show a blocking alert when camera isn't available or permission denied.
                        // Instead show the scan status message inside the camera container so it's visible
                        // but non-blocking. This handles machines without cameras or when user dismissed
                        // permission dialogs.
                        try {
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
                                const cameraContainer = document.querySelector('.camera-container');
                                if (cameraContainer) cameraContainer.appendChild(scanMessage);
                                else document.body.appendChild(scanMessage);
                            }
                            scanMessage.textContent = 'Camera Unavailable';
                            scanMessage.style.display = 'block';
                            scanMessage.style.color = '#ff9800';
                        } catch (e) {
                            console.warn('[Quagga] could not show scan message overlay:', e);
                        }
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

    // Handle Create tab Next: open Add Items and prefill cost with create total
    function handleCreateNext() {
        try {
            // Read the displayed total cost (formatted, e.g. "₱1,234.00")
            const totalEl = document.getElementById('createTotalCost');
            const totalText = totalEl ? String(totalEl.textContent || totalEl.value || '').trim() : '';

            // Immediately apply hide/read-only state to elements inside the
            // existing Add Items panel so they are not visible/clickable during
            // the transition animation. This targets the panel DOM that is
            // already present (but may be display:none) so changes take effect
            // before showTab animates the panel in.
            try {
                const addItemsPanel = document.getElementById('addItemsTabPanel');
                if (addItemsPanel) {
                    // Lock and prefill the cost input inside the panel
                    try {
                        const panelCost = addItemsPanel.querySelector('#inlineItemCost');
                        if (panelCost && totalText) {
                            panelCost.value = totalText;
                            panelCost.readOnly = true;
                            panelCost.setAttribute('data-fixed-from-create', '1');
                            panelCost.setAttribute('title', 'Cost fixed from Create tab');
                            panelCost.style.background = '#151515';
                            panelCost.style.opacity = '0.95';
                        }
                    } catch (e) { /* non-critical */ }

                    // Hide track toggles and stock row inside panel (preserve layout)
                    try {
                        const inlineTrack = addItemsPanel.querySelector('#inlineTrackStockToggle');
                        if (inlineTrack) {
                            const group = inlineTrack.closest('.form-group') || (inlineTrack.parentElement && inlineTrack.parentElement.parentElement);
                            if (group) group.style.visibility = 'hidden';
                            inlineTrack.checked = false;
                        }
                        const variantsToggle = addItemsPanel.querySelector('#variantsTrackStockToggle');
                        if (variantsToggle) {
                            const container = variantsToggle.parentElement && variantsToggle.parentElement.parentElement;
                            if (container) container.style.visibility = 'hidden';
                            variantsToggle.checked = false;
                            try { if (typeof toggleVariantsStockColumns === 'function') toggleVariantsStockColumns(); } catch (e) {}
                        }
                        const stockFieldsRow = addItemsPanel.querySelector('#stockFieldsRow');
                        if (stockFieldsRow) stockFieldsRow.style.display = 'none';
                    } catch (e) { /* non-critical */ }
                }
            } catch (e) { console.error('pre-transition apply Create->Add adjustments failed', e); }

            // Open Add Items panel (use legacy modal path so listeners attach)
            showTab('addItems', true);
            try { window.ensureAttachAddItems(); } catch (e) {}

            // Mark that the inline cost should be fixed for this flow
            window._inlineCostFixed = true;
            // Also hide track-stock toggles for this flow so user cannot change tracking
            window._hideTrackToggle = true;

            // Update Add Items header to match Create flow
            try {
                const header = document.querySelector('#addItemsTabPanel .modal-title');
                if (header && (window._inlineCostFixed || window._hideTrackToggle)) {
                    header.textContent = 'Create an Item';
                }
            } catch (e) { /* non-critical */ }

            // After panel mounts, populate the inline cost input if present and make it readonly
            setTimeout(() => {
                const inlineCost = document.getElementById('inlineItemCost');
                if (inlineCost && totalText) {
                    // Preserve formatting (currency symbol) to keep UX consistent
                    inlineCost.value = totalText;
                    try {
                        inlineCost.readOnly = true; // keep value submitted by form
                        inlineCost.setAttribute('data-fixed-from-create', '1');
                        inlineCost.setAttribute('title', 'Cost fixed from Create tab');
                        inlineCost.style.background = '#151515';
                        inlineCost.style.opacity = '0.95';
                    } catch (e) { /* non-critical */ }
                }
                // focus the name input for faster continuation
                const inlineName = document.getElementById('inlineItemName');
                if (inlineName) try { inlineName.focus(); } catch (e) {}
                // Hide track stock toggles (main + variants) and ensure stock fields are hidden
                try {
                    const inlineTrack = document.getElementById('inlineTrackStockToggle');
                    if (inlineTrack) {
                        const group = inlineTrack.closest('.form-group') || (inlineTrack.parentElement && inlineTrack.parentElement.parentElement);
                        // hide the contents but preserve layout space
                        if (group) group.style.visibility = 'hidden';
                        inlineTrack.checked = false;
                    }
                    const variantsToggle = document.getElementById('variantsTrackStockToggle');
                    if (variantsToggle) {
                        // hide the surrounding container but preserve layout space
                        const container = variantsToggle.parentElement && variantsToggle.parentElement.parentElement;
                        if (container) container.style.visibility = 'hidden';
                        variantsToggle.checked = false;
                        try { if (typeof toggleVariantsStockColumns === 'function') toggleVariantsStockColumns(); } catch (e) {}
                    }
                    const stockFieldsRow = document.getElementById('stockFieldsRow');
                    if (stockFieldsRow) stockFieldsRow.style.display = 'none';
                } catch (e) { /* non-critical */ }
            }, 140);
        } catch (e) {
            console.error('handleCreateNext error', e);
            // Fallback to generic Next behavior
            try { handleNext(); } catch (err) {}
        }
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
            // Immediately apply hide/read-only hints to the cloned node so
            // controls are not visible/clickable before the deferred setup runs.
            try {
                if (window._inlineCostFixed || window._hideTrackToggle) {
                    const _immediateCost = node.querySelector('#inlineItemCost');
                    const _totalEl = document.getElementById('createTotalCost');
                    const _totalText = _totalEl ? String(_totalEl.textContent || _totalEl.value || '').trim() : '';
                    if (_immediateCost && window._inlineCostFixed && _totalText) {
                        _immediateCost.value = _totalText;
                        try { _immediateCost.readOnly = true; } catch (e) {}
                    }
                    if (window._hideTrackToggle) {
                        const _it = node.querySelector('#inlineTrackStockToggle');
                        if (_it) {
                            const g = _it.closest('.form-group') || (_it.parentElement && _it.parentElement.parentElement);
                            if (g) g.style.visibility = 'hidden';
                            _it.checked = false;
                        }
                        const _vt = node.querySelector('#variantsTrackStockToggle');
                        if (_vt) {
                            const c = _vt.parentElement && _vt.parentElement.parentElement;
                            if (c) c.style.visibility = 'hidden';
                            _vt.checked = false;
                        }
                        const _sf = node.querySelector('#stockFieldsRow');
                        if (_sf) _sf.style.display = 'none';
                    }
                }
            } catch (e) { /* best-effort */ }

            // If this clone is opened as part of Create->Add flow, update any header inside the clone
            try {
                if (window._inlineCostFixed || window._hideTrackToggle) {
                    const clonedHeader = node.querySelector('.modal-title');
                    if (clonedHeader) clonedHeader.textContent = 'Create an Item';
                }
            } catch (e) { /* ignore */ }
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
                // If this inline panel was opened as part of the Create->Add flow,
                // apply the same fixed-cost and hide-track-toggle behavior to the
                // cloned node so it is enforced immediately (no visible flicker).
                try {
                    if (window._inlineCostFixed || window._hideTrackToggle) {
                        // Prefill and lock cost inside the cloned node when requested
                        const clonedCost = node.querySelector('#inlineItemCost');
                        const totalEl = document.getElementById('createTotalCost');
                        const totalText = totalEl ? String(totalEl.textContent || totalEl.value || '').trim() : '';
                        if (clonedCost && window._inlineCostFixed && totalText) {
                            clonedCost.value = totalText;
                            try {
                                clonedCost.readOnly = true;
                                clonedCost.setAttribute('data-fixed-from-create', '1');
                                clonedCost.setAttribute('title', 'Cost fixed from Create tab');
                                clonedCost.style.background = '#151515';
                                clonedCost.style.opacity = '0.95';
                            } catch (e) { /* non-critical */ }
                        }

                        // Hide track toggles inside the clone but preserve layout space
                        if (window._hideTrackToggle) {
                            const clonedInlineTrack = node.querySelector('#inlineTrackStockToggle');
                            if (clonedInlineTrack) {
                                const group = clonedInlineTrack.closest('.form-group') || (clonedInlineTrack.parentElement && clonedInlineTrack.parentElement.parentElement);
                                if (group) group.style.visibility = 'hidden';
                                clonedInlineTrack.checked = false;
                            }
                            const clonedVariantsToggle = node.querySelector('#variantsTrackStockToggle');
                            if (clonedVariantsToggle) {
                                const container = clonedVariantsToggle.parentElement && clonedVariantsToggle.parentElement.parentElement;
                                if (container) container.style.visibility = 'hidden';
                                clonedVariantsToggle.checked = false;
                                try { if (typeof toggleVariantsStockColumns === 'function') toggleVariantsStockColumns(); } catch (e) {}
                            }
                            const clonedStockFields = node.querySelector('#stockFieldsRow');
                            if (clonedStockFields) clonedStockFields.style.display = 'none';
                        }
                    }
                } catch (e) { console.error('apply inline Create->Add adjustments failed', e); }
                // Attach back button handler to close and restart scanner
                const backBtn = node.querySelector('#backInlineAddItems');
                if (backBtn) {
                    // Remove previous listeners by replacing the node
                    const newBackBtn = backBtn.cloneNode(true);
                    backBtn.parentNode.replaceChild(newBackBtn, backBtn);
                    newBackBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        try { restoreCreateAddState(); } catch (e) {}
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
        // Update modal header when opened from Create flow
        try {
            const header = document.querySelector('#addItemsTabPanel .modal-title');
            if (header && (window._inlineCostFixed || window._hideTrackToggle)) {
                header.textContent = 'Create an Item';
            }
        } catch (e) { /* ignore */ }
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
                        try { restoreCreateAddState(); } catch (e) {}
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

                // For variant results, show the parent product name on the top line
                // (previously this displayed the category). For product results, keep showing category.
                if (catEl) catEl.textContent = (item.type === 'variant') ? (item.product_name || '') : (item.category || '');
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
                                if (isNaN(qty) || qty === 0) {
                                    showErrorPopup('Please enter a quantity greater than 0');
                                    return;
                                }
                                if (qty < 0) {
                                    // Ask for confirmation and reason before allowing negative adjustments
                                    showNegativeQuantityConfirm(qty, function(reason) {
                                        // proceed with negative adjustment (use adjust_stock action)
                                        let unit = '';
                                        try { const anyUnit = vNode.querySelector('.unit-value'); if (anyUnit) unit = anyUnit.textContent.trim(); } catch (e) {}

                                        // Ghost number animation (negative)
                                        try {
                                            if (vInstockEl) {
                                                const ghost = document.createElement('div');
                                                ghost.className = 'ghost-add-number';
                                                ghost.textContent = `${qty}${(unit && unit !== '- -') ? ' ' + unit : ''}`;
                                                vNode.appendChild(ghost);
                                                const instRect = vInstockEl.getBoundingClientRect();
                                                const rowRect = vNode.getBoundingClientRect();
                                                const ghostRect = ghost.getBoundingClientRect();
                                                const centerX = instRect.left - rowRect.left + (instRect.width / 2) - (ghostRect.width / 2) - 6;
                                                const centerY = instRect.top - rowRect.top + (instRect.height / 2) - (ghostRect.height / 2);
                                                ghost.style.left = (centerX > 4 ? centerX : 4) + 'px';
                                                ghost.style.top = (centerY > 2 ? centerY : 2) + 'px';
                                                requestAnimationFrame(() => { ghost.style.animation = 'ghost-float 900ms ease-out forwards'; });
                                                setTimeout(() => { try { ghost.remove(); } catch(e){} }, 1000);
                                            }
                                        } catch (e) { console.error('ghost immediate error', e); }

                                        vAddBtn.disabled = true;
                                        vAddQty.disabled = true;
                                        const payload = { action: 'adjust_stock', product_id: item.id, variant_id: variant.variant_id, qty: qty, reason: reason };
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
                                            try { const wrapper = vNode.closest && vNode.closest('.br-row-wrapper'); if (resp && resp.parent_new_in_stock && wrapper) {
                                                    const parentNode = wrapper.querySelector('.barcode-result-row'); if (parentNode) {
                                                        const pInst = parentNode.querySelector('.br-instock-value'); const pStatus = parentNode.querySelector('.br-status');
                                                        if (pInst) pInst.textContent = resp.parent_new_in_stock || '—';
                                                        if (pStatus) pStatus.textContent = resp.parent_status || '—';
                                                        try { parentNode.setAttribute('data-in-stock', resp.parent_new_in_stock ? String(resp.parent_new_in_stock).replace(/\s+/g,'') : ''); } catch (e) {}
                                                    }
                                                } else { try { recalcParentTotals(); } catch (e) { console.error('parent recalc after variant add failed', e); } } } catch (e) { console.error('parent update error after variant add', e); }
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
                                                        // If this was a negative adjustment include reason in message
                                                        if (typeof reason !== 'undefined' && reason) {
                                                            successMsg.textContent = `You've successfully adjusted ${addedQtyDisplay} of ${nameText || ''} under ${categoryText || 'No Category'} (${reason}) — new total ${totalDisplay} (${statusTextNow})`;
                                                        } else {
                                                            successMsg.textContent = `You've successfully added ${addedQtyDisplay} of ${nameText || ''} under ${categoryText || 'No Category'} with a total of ${totalDisplay} (${statusTextNow})`;
                                                        }
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
                                                                const cols = vNode.querySelectorAll('.br-col');
                                                                cols.forEach(col => {
                                                                    if (!col.classList.contains('br-col-success')) {
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
                                            console.error('adjust_stock error', err);
                                            showErrorPopup('Failed to adjust stock: ' + (err.message || err));
                                            vAddBtn.disabled = false;
                                            vAddQty.disabled = false;
                                        });
                                    }, function() {
                                        // cancelled - do nothing, keep input as-is
                                        try { vAddQty.focus(); } catch (e) {}
                                    });
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

                // Ensure columns are visible when tracking is ON on initial render.
                // Some template/CSS variants hide columns by default and rely on the
                // toggle change handler to reveal them — explicitly show them here
                // so the initial render matches the UI after toggling.
                if (trackingOn) {
                    try {
                        if (instockCol) instockCol.style.display = '';
                        if (statusCol) statusCol.style.display = '';
                        if (addCol) {
                            // Don't show add-col for parents that actually have variants
                            if (addCol.getAttribute && addCol.getAttribute('data-has-variants') === '1') {
                                addCol.style.display = 'none';
                            } else {
                                addCol.style.display = '';
                            }
                        }
                    } catch (e) { /* ignore DOM errors */ }
                }

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
                        if (isNaN(qty) || qty === 0) {
                            showErrorPopup('Please enter a quantity greater than 0');
                            return;
                        }
                        if (qty < 0) {
                            showNegativeQuantityConfirm(qty, function(reason) {
                                // proceed with adjust_stock since qty is negative
                                let unit = '';
                                try { const anyUnit = node.querySelector('.unit-value'); if (anyUnit) unit = anyUnit.textContent.trim(); } catch (e) {}

                                try {
                                    if (instockEl) {
                                        const ghost = document.createElement('div');
                                        ghost.className = 'ghost-add-number';
                                        ghost.textContent = `${qty}${(unit && unit !== '- -') ? ' ' + unit : ''}`;
                                        node.appendChild(ghost);
                                        const instRect = instockEl.getBoundingClientRect();
                                        const rowRect = node.getBoundingClientRect();
                                        const ghostRect = ghost.getBoundingClientRect();
                                        const centerX = instRect.left - rowRect.left + (instRect.width / 2) - (ghostRect.width / 2) - 6;
                                        const centerY = instRect.top - rowRect.top + (instRect.height / 2) - (ghostRect.height / 2);
                                        ghost.style.left = (centerX > 4 ? centerX : 4) + 'px';
                                        ghost.style.top = (centerY > 2 ? centerY : 2) + 'px';
                                        requestAnimationFrame(() => { ghost.style.animation = 'ghost-float 900ms ease-out forwards'; });
                                        setTimeout(() => { try { ghost.remove(); } catch(e){} }, 1000);
                                    }
                                } catch (e) { console.error('ghost immediate error', e); }

                                addBtn.disabled = true;
                                addQty.disabled = true;
                                const payload = { action: 'adjust_stock', product_id: node.getAttribute('data-product-id') ? parseInt(node.getAttribute('data-product-id')) : 0, qty: qty, reason: reason };
                                if (node.getAttribute('data-variant-id')) payload.variant_id = parseInt(node.getAttribute('data-variant-id'));
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
                                    if (instockEl) instockEl.textContent = newInStock !== null ? newInStock : '—';
                                    if (statusEl) statusEl.textContent = newStatus || '—';
                                            node.classList.add('added');
                                            setTimeout(() => node.classList.remove('added'), 900);
                                            const successCol = node.querySelector('.br-col-success');
                                            const successMsg = node.querySelector('.br-success-message');
                                            const successAgainBtn = node.querySelector('.br-add-again');
                                            setTimeout(() => {
                                                try {
                                                    const cols = node.querySelectorAll('.br-col');
                                                    cols.forEach(col => {
                                                        if (!col.classList.contains('br-col-success')) {
                                                            col.style.display = 'none';
                                                        }
                                                    });
                                                    const nameText = nameEl ? nameEl.textContent.trim() : '';
                                                    const categoryText = catEl ? catEl.textContent.trim() : '';
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
                                                        if (typeof reason !== 'undefined' && reason) {
                                                            successMsg.textContent = `You've successfully adjusted ${addedQtyDisplay} of ${nameText || ''} under ${categoryText || 'No Category'} (${reason}) — new total ${totalDisplay} (${statusTextNow})`;
                                                        } else {
                                                            successMsg.textContent = `You've successfully added ${addedQtyDisplay} of ${nameText || ''} under ${categoryText || 'No Category'} with a total of ${totalDisplay} (${statusTextNow})`;
                                                        }
                                                    }
                                                    try { node._lastAdded = { qty: qty, unit: displayUnit || unit || '' }; } catch (e) {}
                                                    if (successCol) successCol.style.display = '';
                                                    if (successAgainBtn) {
                                                        successAgainBtn.onclick = function() {
                                                            const cols = node.querySelectorAll('.br-col');
                                                            cols.forEach(col => {
                                                                if (!col.classList.contains('br-col-success')) {
                                                                    col.style.display = '';
                                                                }
                                                            });
                                                            if (successCol) successCol.style.display = 'none';
                                                            if (addQty) addQty.value = '';
                                                            if (addBtn) {
                                                                addBtn.disabled = false;
                                                                addQty.disabled = false;
                                                                try { addQty.focus(); } catch (e) {}
                                                            }
                                                        };
                                                    }
                                                    const undoBtn = node.querySelector('.br-undo');
                                                    if (undoBtn) {
                                                        undoBtn.onclick = function() {
                                                            const last = node._lastAdded || { qty: qty, unit: displayUnit || unit || '' };
                                                            const prevText = undoBtn.textContent;
                                                            try { undoBtn.textContent = 'Undoing...'; } catch (e) {}
                                                            const undoQty = -Math.abs(parseFloat(last.qty) || -qty);
                                                            const adjustPayload = { action: 'adjust_stock', product_id: item.id, qty: undoQty };
                                                            if (last.unit && last.unit !== '- -') adjustPayload.unit = last.unit;
                                                            undoBtn.disabled = true;
                                                            fetch('api.php', {
                                                                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adjustPayload)
                                                            }).then(r => r.json()).then(res => {
                                                                if (!res || !res.success) throw new Error(res && res.error ? res.error : 'Unknown error');
                                                                if (instockEl) instockEl.textContent = res.new_in_stock !== null ? res.new_in_stock : '—';
                                                                if (statusEl) statusEl.textContent = res.status || '—';
                                                                try { recalcParentTotals(); } catch (e) {}
                                                                const cols = node.querySelectorAll('.br-col');
                                                                cols.forEach(col => {
                                                                    if (!col.classList.contains('br-col-success')) {
                                                                        col.style.display = '';
                                                                    } else {
                                                                        col.style.display = 'none';
                                                                    }
                                                                });
                                                                try { if (addQty) { addQty.style.display = ''; addQty.disabled = false; addQty.value = ''; addQty.focus(); } } catch (e) {}
                                                                try { if (addBtn) { addBtn.style.display = ''; addBtn.disabled = false; } } catch (e) {}
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
                                                    console.error('replace product row content error', e);
                                                }
                                            }, 750);
                                }).catch(err => {
                                    console.error('adjust_stock error', err);
                                    showErrorPopup('Failed to adjust stock: ' + (err.message || err));
                                    addBtn.disabled = false;
                                    addQty.disabled = false;
                                });
                            }, function() { try { addQty.focus(); } catch (e) {} });
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
    // Helper: restore any Create->Add transient UI state (called when backing out)
    function restoreCreateAddState() {
        try {
            // Clear flags
            window._inlineCostFixed = false;
            // Restore inline cost editability
            const inlineCost = document.getElementById('inlineItemCost');
            if (inlineCost) {
                inlineCost.readOnly = false;
                inlineCost.removeAttribute('data-fixed-from-create');
                inlineCost.removeAttribute('title');
                inlineCost.style.background = '';
                inlineCost.style.opacity = '';
            }
            // Restore Add Items header to default
            try {
                const header = document.querySelector('#addItemsTabPanel .modal-title');
                if (header) header.textContent = 'Add new item';
            } catch (e) {}
            // Restore track stock toggles visibility if we hid them for Create flow
            try {
                if (window._hideTrackToggle) {
                    const inlineTrackGroup = (function() { const el = document.getElementById('inlineTrackStockToggle'); return el ? (el.closest('.form-group') || (el.parentElement && el.parentElement.parentElement)) : null; })();
                    if (inlineTrackGroup) inlineTrackGroup.style.visibility = '';
                    const variantsContainer = (function() { const v = document.getElementById('variantsTrackStockToggle'); return v ? (v.parentElement && v.parentElement.parentElement) : null; })();
                    if (variantsContainer) variantsContainer.style.visibility = '';
                    window._hideTrackToggle = false;
                    try { if (typeof toggleVariantsStockColumns === 'function') toggleVariantsStockColumns(); } catch (e) {}
                }
            } catch (e) {}
        } catch (e) { /* ignore */ }
    }

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
        // Clear any fixed-cost state when going back to tabs
        try {
            window._inlineCostFixed = false;
            const inlineCost = document.getElementById('inlineItemCost');
            if (inlineCost) {
                inlineCost.readOnly = false;
                inlineCost.removeAttribute('data-fixed-from-create');
                inlineCost.removeAttribute('title');
                inlineCost.style.background = '';
                inlineCost.style.opacity = '';
            }
            // Restore Add Items header to default
            try {
                const header = document.querySelector('#addItemsTabPanel .modal-title');
                if (header) header.textContent = 'Add new item';
            } catch (e) {}
            // Restore track stock toggles visibility if we hid them for Create flow
            try {
                    if (window._hideTrackToggle) {
                    const inlineTrackGroup = (function() { const el = document.getElementById('inlineTrackStockToggle'); return el ? (el.closest('.form-group') || (el.parentElement && el.parentElement.parentElement)) : null; })();
                    if (inlineTrackGroup) inlineTrackGroup.style.visibility = '';
                    const variantsContainer = (function() { const v = document.getElementById('variantsTrackStockToggle'); return v ? (v.parentElement && v.parentElement.parentElement) : null; })();
                    if (variantsContainer) variantsContainer.style.visibility = '';
                    // Unset the flag
                    window._hideTrackToggle = false;
                    try { if (typeof toggleVariantsStockColumns === 'function') toggleVariantsStockColumns(); } catch (e) {}
                }
            } catch (e) {}
        } catch (e) {}
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
        // Clear any fixed-cost flag and restore inline cost editability
        try {
            window._inlineCostFixed = false;
            const inlineCost = document.getElementById('inlineItemCost');
            if (inlineCost) {
                inlineCost.readOnly = false;
                inlineCost.removeAttribute('data-fixed-from-create');
                inlineCost.removeAttribute('title');
                inlineCost.style.background = '';
                inlineCost.style.opacity = '';
            }
            // Restore track stock toggles visibility if previously hidden
            try {
                if (window._hideTrackToggle) {
                    const inlineTrackGroup = (function() { const el = document.getElementById('inlineTrackStockToggle'); return el ? (el.closest('.form-group') || (el.parentElement && el.parentElement.parentElement)) : null; })();
                    if (inlineTrackGroup) inlineTrackGroup.style.visibility = '';
                    const variantsContainer = (function() { const v = document.getElementById('variantsTrackStockToggle'); return v ? (v.parentElement && v.parentElement.parentElement) : null; })();
                    if (variantsContainer) variantsContainer.style.visibility = '';
                    window._hideTrackToggle = false;
                    // Restore Add Items header to default
                    try {
                        const header = document.querySelector('#addItemsTabPanel .modal-title');
                        if (header) header.textContent = 'Add new item';
                    } catch (e) {}
                    try { if (typeof toggleVariantsStockColumns === 'function') toggleVariantsStockColumns(); } catch (e) {}
                }
            } catch (e) {}
        } catch (e) {}
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
    
    // Attach the Next handler to ALL Next buttons inside the scanner modal.
    // The markup contains multiple buttons with id="nextBtn" (one per tab),
    // so using getElementById only bound the first one. Use querySelectorAll
    // and attach the same routing logic to each instance so clicks always work.
    const nextBtnNodes = document.querySelectorAll('#scannerModal #nextBtn');
    if (nextBtnNodes && nextBtnNodes.length) {
        nextBtnNodes.forEach(function(btnNode) {
            try {
                btnNode.onclick = function(e) {
                    if (typeof isManualMode !== 'undefined' && isManualMode) {
                        handleManualNext(e);
                    } else if (typeof currentTab !== 'undefined' && currentTab === 'manual') {
                        handleManualNext(e);
                    } else if (typeof currentTab !== 'undefined' && currentTab === 'create') {
                        handleCreateNext(e);
                    } else {
                        handleNext(e);
                    }
                };
            } catch (err) {
                console.error('Failed to attach nextBtn handler to node', err);
            }
        });
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
    const createPanel = document.getElementById('createTabPanel');
    const barcodePanel = document.getElementById('barcodeResultsTabPanel');
    // Hide all panels, but if opening addItems, animate previous panel out first, then animate addItems in
    if (tabName === 'addItems') {
        const prevPanel = { scan: scanPanel, manual: manualPanel, create: createPanel }[previousTab];
        const modalContent = document.querySelector('.modal-content.scanner-modal');
        // Always hide scan, manual, and create panels when showing addItems
        if (scanPanel) { scanPanel.style.display = 'none'; scanPanel.classList.remove('active', 'slide-in', 'slide-out-left'); }
        if (manualPanel) { manualPanel.style.display = 'none'; manualPanel.classList.remove('active', 'slide-in', 'slide-out-left'); }
        if (createPanel) { createPanel.style.display = 'none'; createPanel.classList.remove('active', 'slide-in', 'slide-out-left'); }
        if (addItemsPanel) {
            // Make sure addItemsPanel is rendered for sizing
            addItemsPanel.style.display = 'block';
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
                    backBtn.onclick = function(e) {
                        e.preventDefault();
                        try {
                            const panel = document.getElementById('addItemsTabPanel');
                            // Prefer snapshot.previousTab but sanitize it so we never navigate
                            // back into `addItems` itself. Fall back to modalCurrentTab or 'scan'.
                            let snapPrev = panel && panel._snapshot && panel._snapshot.modalPreviousTab ? panel._snapshot.modalPreviousTab : previousTab;
                            if (snapPrev === 'addItems' && panel && panel._snapshot && panel._snapshot.modalCurrentTab) snapPrev = panel._snapshot.modalCurrentTab;
                            if (!snapPrev || snapPrev === 'addItems') snapPrev = 'scan';
                            showTab(snapPrev, false);
                        } catch (err) { showTab(previousTab || 'scan', false); }
                    };
                }
                if (cancelBtn) {
                    cancelBtn.style.pointerEvents = 'auto';
                    cancelBtn.style.zIndex = 9999;
                    cancelBtn.onclick = function(e) {
                        e.preventDefault();
                        try {
                            const panel = document.getElementById('addItemsTabPanel');
                            let snapPrev = panel && panel._snapshot && panel._snapshot.modalPreviousTab ? panel._snapshot.modalPreviousTab : previousTab;
                            if (snapPrev === 'addItems' && panel && panel._snapshot && panel._snapshot.modalCurrentTab) snapPrev = panel._snapshot.modalCurrentTab;
                            if (!snapPrev || snapPrev === 'addItems') snapPrev = 'scan';
                            showTab(snapPrev, false);
                        } catch (err) { showTab(previousTab || 'scan', false); }
                    };
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
                // If the inline cost was fixed by Create flow, ensure the field remains readonly
                const inlineCost = document.getElementById('inlineItemCost');
                if (inlineCost) {
                    if (window._inlineCostFixed) {
                        inlineCost.readOnly = true;
                        inlineCost.setAttribute('data-fixed-from-create', '1');
                        inlineCost.setAttribute('title', 'Cost fixed from Create tab');
                        inlineCost.style.background = '#151515';
                        inlineCost.style.opacity = '0.95';
                        // If requested, hide track stock toggles when coming from Create
                        try {
                            if (window._hideTrackToggle) {
                                    const inlineTrack = document.getElementById('inlineTrackStockToggle');
                                    if (inlineTrack) {
                                        const group = inlineTrack.closest('.form-group') || (inlineTrack.parentElement && inlineTrack.parentElement.parentElement);
                                        if (group) group.style.visibility = 'hidden';
                                        inlineTrack.checked = false;
                                    }
                                    const variantsToggle = document.getElementById('variantsTrackStockToggle');
                                    if (variantsToggle) {
                                        const container = variantsToggle.parentElement && variantsToggle.parentElement.parentElement;
                                        if (container) container.style.visibility = 'hidden';
                                        variantsToggle.checked = false;
                                        try { if (typeof toggleVariantsStockColumns === 'function') toggleVariantsStockColumns(); } catch (e) {}
                                    }
                                    const stockFieldsRow = document.getElementById('stockFieldsRow');
                                    if (stockFieldsRow) stockFieldsRow.style.display = 'none';
                                }
                        } catch (e) { /* ignore */ }
                    } else {
                        inlineCost.readOnly = false;
                        inlineCost.removeAttribute('data-fixed-from-create');
                        inlineCost.removeAttribute('title');
                        inlineCost.style.background = '';
                        inlineCost.style.opacity = '';
                    }
                }
            }, 250);
        }
        // Hide tab buttons
        var modalTabs = document.querySelector('.modal-tabs');
        var scanTabBtn = document.getElementById('scanTab');
        var manualTabBtn = document.getElementById('manualTab');
        var createTabBtn = document.getElementById('createTab');
        if (modalTabs) modalTabs.style.display = 'none';
        if (scanTabBtn) scanTabBtn.classList.remove('active');
        if (manualTabBtn) manualTabBtn.classList.remove('active');
        if (createTabBtn) createTabBtn.classList.remove('active');
        // Also add hide-tabs class to modal-content for CSS-driven hiding
        const modalContentElem = document.querySelector('.modal-content.scanner-modal');
        if (modalContentElem) modalContentElem.classList.add('hide-tabs');
    } else if (currentTab === 'addItems') {
        // Reverse transition: going back from Add Items to scan/manual
    const prevPanel = { scan: scanPanel, manual: manualPanel, create: createPanel }[tabName];
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
    // Treat 'create' tab the same as 'scan' and 'manual' for back transition
    const prevPanel = { scan: scanPanel, manual: manualPanel, create: createPanel }[tabName];
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
    var createTabBtn = document.getElementById('createTab');
    if (modalTabs) modalTabs.style.display = 'flex';
    if (scanTabBtn) scanTabBtn.classList.toggle('active', tabName === 'scan');
    if (manualTabBtn) manualTabBtn.classList.toggle('active', tabName === 'manual');
    if (createTabBtn) createTabBtn.classList.toggle('active', tabName === 'create');
    } else {
        // Hide all panels instantly
        [scanPanel, manualPanel, addItemsPanel, createPanel, barcodePanel].forEach(panel => {
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
            create: createPanel,
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
        var createTabBtn = document.getElementById('createTab');
        if (tabName === 'addItems' || tabName === 'barcodeResults') {
            if (modalTabs) modalTabs.style.display = 'none';
            if (scanTabBtn) scanTabBtn.classList.remove('active');
            if (manualTabBtn) manualTabBtn.classList.remove('active');
            if (createTabBtn) createTabBtn.classList.remove('active');
        } else if (tabName === 'create') {
            if (modalTabs) modalTabs.style.display = 'flex';
            if (scanTabBtn) scanTabBtn.classList.remove('active');
            if (manualTabBtn) manualTabBtn.classList.remove('active');
            if (createTabBtn) createTabBtn.classList.add('active');
        } else {
            if (modalTabs) modalTabs.style.display = 'flex';
            if (scanTabBtn) scanTabBtn.classList.toggle('active', tabName === 'scan');
            if (manualTabBtn) manualTabBtn.classList.toggle('active', tabName === 'manual');
            if (createTabBtn) createTabBtn.classList.toggle('active', tabName === 'create');
        }
    // Show the requested panel (normal case)
    if (!(currentTab === 'addItems' && tabName !== 'addItems')) {
        const activePanel = {
            scan: scanPanel,
            manual: manualPanel,
            addItems: addItemsPanel,
            create: createPanel,
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
    const createTabBtn = document.getElementById('createTab');
    // Panels
    const createTabPanel = document.getElementById('createTabPanel');
    const scanPanel = document.getElementById('scanTabPanel');
    const manualPanel = document.getElementById('manualTabPanel');
    const addItemsPanel = document.getElementById('addItemsTabPanel');
    // Add Items triggers
    const skipScannerBtn = document.getElementById('skipScanner');
    const skipManualEntryBtn = document.getElementById('skipManualEntry');
    const skipCreateTabBtn = document.getElementById('skipCreateTab');
    // Add Items panel buttons
    function attachAddItemsPanelListeners() {
        if (!addItemsPanel) return;
        // Back button
        const backBtn = addItemsPanel.querySelector('#backInlineAddItems');
        if (backBtn) {
            backBtn.onclick = function(e) {
                e.preventDefault();
                // Treat 'create' tab the same as 'manual' and 'scan' for back transition
                if (typeof previousTab !== 'undefined' && previousTab) {
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
        // Intercept form submit for Edit mode and send to API as update_product
        if (form) {
            form.addEventListener('submit', function(e) {
                try {
                    var editId = addItemsPanel ? addItemsPanel.getAttribute('data-edit-product-id') : null;
                    var isEdit = addItemsPanel ? addItemsPanel.getAttribute('data-row-edit') === '1' : false;
                    if (!isEdit || !editId) {
                        // Not edit mode - allow normal modal submit handling
                        return;
                    }
                    // In edit mode: prevent default submission and POST via fetch
                    e.preventDefault();
                    var fd = new FormData();
                    // Map modal form fields to API field names the server expects
                    try {
                        // product-level fields (read from modal inputs)
                        var nameEl = document.getElementById('inlineItemName');
                        var categoryEl = document.getElementById('inlineItemCategory');
                        var priceEl = document.getElementById('inlineItemPrice');
                        var costEl = document.getElementById('inlineItemCost');
                        var trackEl = document.getElementById('inlineTrackStockToggle');
                        var inStockEl = document.getElementById('inlineInStock');
                        var lowStockEl = document.getElementById('inlineLowStock');
                        var skuEl = document.getElementById('inlineItemSKU');
                        var barcodeEl = document.getElementById('inlineItemBarcode');
                        var variantsTrackEl = document.getElementById('variantsTrackStockToggle');
                        var posAvailEl = document.getElementById('availablePOS');

                        if (nameEl) fd.append('name', nameEl.value);
                        if (categoryEl) fd.append('category', categoryEl.value);
                        if (priceEl) {
                            var rawPriceVal = (priceEl.value || '').toString().trim();
                            if (rawPriceVal === '') {
                                // Empty input when editing should be treated as 'variable'
                                fd.append('price', 'variable');
                            } else {
                                fd.append('price', rawPriceVal.replace(/[^0-9.\-]/g, ''));
                            }
                        }
                        if (costEl) fd.append('cost', (costEl.value || '').toString().replace(/[^0-9.\-]/g, '') );
                        fd.append('track_stock', trackEl && trackEl.checked ? '1' : '0');
                        fd.append('variantsTrackStock', variantsTrackEl && variantsTrackEl.checked ? '1' : '0');
                        if (inStockEl) {
                            var inStockUnitEl = document.getElementById('inlineInStockUnit') || (inStockEl.parentElement ? inStockEl.parentElement.querySelector('.unit-value') : null);
                            var inStockVal = (inStockEl.value || '').toString().trim();
                            if (inStockUnitEl) {
                                var suf = (inStockUnitEl.textContent || '').toString().trim();
                                if (suf && suf !== '- -') inStockVal = (inStockVal ? inStockVal + ' ' : '') + suf;
                            }
                            fd.append('in_stock', inStockVal);
                        }
                        if (lowStockEl) {
                            var lowStockUnitEl = document.getElementById('inlineLowStockUnit') || (lowStockEl.parentElement ? lowStockEl.parentElement.querySelector('.unit-value') : null);
                            var lowStockVal = (lowStockEl.value || '').toString().trim();
                            if (lowStockUnitEl) {
                                var lsf = (lowStockUnitEl.textContent || '').toString().trim();
                                if (lsf && lsf !== '- -') lowStockVal = (lowStockVal ? lowStockVal + ' ' : '') + lsf;
                            }
                            fd.append('low_stock', lowStockVal);
                        }
                        if (skuEl) fd.append('sku', skuEl.value);
                        if (barcodeEl) fd.append('barcode', barcodeEl.value);
                        fd.append('pos_available', posAvailEl && posAvailEl.checked ? '1' : '0');

                        // color & shape (POS representation). Try to read selected options in modal.
                        try {
                            var selColor = (addItemsPanel && addItemsPanel.querySelector('.color-option.selected')) ? addItemsPanel.querySelector('.color-option.selected').dataset.color : '';
                            var selShape = (addItemsPanel && addItemsPanel.querySelector('.shape-option.selected')) ? addItemsPanel.querySelector('.shape-option.selected').dataset.shape : '';
                            if (selColor) fd.append('color', selColor);
                            if (selShape) fd.append('shape', selShape);
                        } catch (e) {}

                        // Attach any files or additional form inputs. Some image inputs (like #posProductImage)
                        // do not have a name attribute and therefore won't be included by FormData(form).
                        // Build nativeFormData then selectively append keys we didn't manually set above.
                        var nativeFormData = new FormData(form);
                        // Ensure we don't duplicate keys we already set; include 'type' and 'image_url' in skip list
                        var skipKeys = ['name','category','price','cost','track_stock','variantsTrackStock','in_stock','low_stock','sku','barcode','pos_available','color','shape','type','image_url'];
                        for (var pair of nativeFormData.entries()) {
                            var k = pair[0], v = pair[1];
                            if (skipKeys.indexOf(k) !== -1) continue;
                            fd.append(k, v);
                        }

                        // Explicitly handle image upload when user selected a file via the image tab
                        try {
                            var fileInputEl = document.getElementById('posProductImage');
                            var imageUrlEl = document.getElementById('productImageUrl') || document.querySelector('input[name="productImageUrl"]') || document.querySelector('.product-image-url input');
                            var fileAppended = false;
                            if (fileInputEl && fileInputEl.files && fileInputEl.files.length > 0) {
                                try { fd.append('image_file', fileInputEl.files[0]); fileAppended = true; } catch(e) { console.warn('append image_file failed', e); }
                            }
                            var imgUrlVal = '';
                            if (imageUrlEl && (imageUrlEl.value || '').toString().trim() !== '') imgUrlVal = (imageUrlEl.value || '').toString().trim();
                            if (!fileAppended && imgUrlVal !== '') {
                                try { fd.append('image_url', imgUrlVal); } catch(e) {}
                            }
                            // If either file or image URL present, mark representation type as 'image'
                            if (fileAppended || imgUrlVal !== '') {
                                try { fd.append('type', 'image'); } catch(e) {}
                            }
                        } catch(e) { console.warn('image attach logic failed', e); }

                        // always include required action and product id
                        fd.append('action', 'update_product');
                        fd.append('product_id', String(editId));

                    } catch (errMap) {
                        console.warn('Field mapping failed', errMap);
                    }

                    // Serialize variant rows using the classes used by the modal generator
                    try {
                        var variantsBody = document.getElementById('variantsTableBody');
                        var variantsArr = [];
                        if (variantsBody) {
                            var rows = variantsBody.querySelectorAll('tr');
                            rows.forEach(function(r) {
                                var v = {};
                                // id if present
                                var vid = r.getAttribute('data-variant-id') || r.dataset && r.dataset.variantId;
                                if (vid) v.id = parseInt(vid, 10);
                                // available
                                var avail = r.querySelector('input.variant-available');
                                if (avail) v.pos_available = avail.checked ? 1 : 0;
                                // name, price, cost, sku, barcode
                                var vname = r.querySelector('input.variant-name'); if (vname) v.name = vname.value;
                                var vpriceEl = r.querySelector('input.variant-price'); if (vpriceEl) v.price = (vpriceEl.value || '').toString().replace(/[^0-9.\-]/g, '');
                                var vcostEl = r.querySelector('input.variant-cost'); if (vcostEl) v.cost = (vcostEl.value || '').toString().replace(/[^0-9.\-]/g, '');
                                var vstockEl = r.querySelector('input.variant-stock'); if (vstockEl) {
                                    var vstockUnit = vstockEl.parentElement ? vstockEl.parentElement.querySelector('.unit-value') : null;
                                    var vstockVal = (vstockEl.value || '').toString().trim();
                                    if (vstockUnit) {
                                        var vsuf = (vstockUnit.textContent || '').toString().trim();
                                        if (vsuf && vsuf !== '- -') vstockVal = (vstockVal ? vstockVal + ' ' : '') + vsuf;
                                    }
                                    v.in_stock = vstockVal;
                                }
                                var vlowEl = r.querySelector('input.variant-low-stock'); if (vlowEl) {
                                    var vlowUnit = vlowEl.parentElement ? vlowEl.parentElement.querySelector('.unit-value') : null;
                                    var vlowVal = (vlowEl.value || '').toString().trim();
                                    if (vlowUnit) {
                                        var vlsuf = (vlowUnit.textContent || '').toString().trim();
                                        if (vlsuf && vlsuf !== '- -') vlowVal = (vlowVal ? vlowVal + ' ' : '') + vlsuf;
                                    }
                                    v.low_stock = vlowVal;
                                }
                                var vskuEl = r.querySelector('input.variant-sku'); if (vskuEl) v.sku = vskuEl.value;
                                var vbarcodeEl = r.querySelector('input.variant-barcode'); if (vbarcodeEl) v.barcode = vbarcodeEl.value;
                                // Only include variant if it has a name or sku or other meaningful field
                                if (v.name || v.sku || v.barcode || typeof v.price !== 'undefined' || typeof v.cost !== 'undefined') {
                                    variantsArr.push(v);
                                }
                            });
                        }
                        if (variantsArr.length > 0) {
                            // Deduplicate variants by id or sku to avoid accidental duplicate inserts
                            try {
                                var deduped = [];
                                var seenIds = {};
                                var seenSkus = {};
                                variantsArr.forEach(function(v) {
                                    var keep = true;
                                    if (v.id && v.id > 0) {
                                        if (seenIds[v.id]) keep = false; else seenIds[v.id] = true;
                                    }
                                    var sk = (v.sku || '').toString().trim();
                                    if (sk) {
                                        if (seenSkus[sk]) keep = false; else seenSkus[sk] = true;
                                    }
                                    if (keep) deduped.push(v);
                                });
                                fd.append('variants', JSON.stringify(deduped));
                            } catch (e) {
                                fd.append('variants', JSON.stringify(variantsArr));
                            }
                        }

                        // deleted variants: hidden inputs inside the form named deleted_variants[] may exist
                        var deletedInputs = form.querySelectorAll('input[name="deleted_variants[]"]');
                        if (deletedInputs && deletedInputs.length) {
                            deletedInputs.forEach(function(di) { fd.append('deleted_variants[]', di.value); });
                        }
                    } catch (errVar) { console.warn('Variant serialization failed', errVar); }

                    // Collect composite components (if present in the edit UI) and append to FormData
                    try {
                        var compositeComponents = [];
                        // Prefer the cloned composite view inside the Add Items panel when present
                        var createClone = (addItemsPanel && addItemsPanel.querySelector) ? (addItemsPanel.querySelector('.composite-create-clone') || addItemsPanel.querySelector('.create-table-container')) : document.querySelector('.create-table-container');
                        if (createClone) {
                            var body = createClone.querySelector('tbody');
                            if (body) {
                                var crow = body.querySelectorAll('tr.component-row');
                                crow.forEach(function(r) {
                                    try {
                                        var qtyEl = r.querySelector('.comp-qty') || r.querySelector('input[type="number"]');
                                        var qtyVal = qtyEl ? qtyEl.value : null;
                                        // attempt to read any embedded SKU text
                                        var skuEl = r.querySelector('.comp-sku');
                                        var skuText = '';
                                        if (skuEl) skuText = (skuEl.textContent || '').replace(/^[sS][kK][uU]\s*:\s*/,'').trim();
                                        // read any data attributes if present (pc id, variant/product ids)
                                        var pcId = r.dataset && r.dataset.pcId ? parseInt(r.dataset.pcId,10) : 0;
                                        var compVarId = r.dataset && r.dataset.componentVariantId ? parseInt(r.dataset.componentVariantId,10) : 0;
                                        var compProdId = r.dataset && r.dataset.componentProductId ? parseInt(r.dataset.componentProductId,10) : 0;
                                        var obj = {};
                                        if (pcId && pcId > 0) obj.id = pcId;
                                        if (compVarId && compVarId > 0) obj.component_variant_id = compVarId;
                                        if (compProdId && compProdId > 0) obj.component_product_id = compProdId;
                                        if (!obj.component_variant_id && !obj.component_product_id && skuText) obj.sku = skuText;
                                        // include qty under component_qty (send the original user input string so it is stored as-is)
                                        if (qtyVal !== null && qtyVal !== undefined) obj.component_qty = String(qtyVal);
                                        // Only push if we have either a sku or an id/refs or a qty
                                        if (Object.keys(obj).length) compositeComponents.push(obj);
                                    } catch (e) { /* best-effort per-row */ }
                                });
                            }
                        }
                        if (compositeComponents.length) fd.append('composite_components', JSON.stringify(compositeComponents));
                    } catch (e) { console.warn('composite components serialization failed', e); }

                    // POST to API endpoint
                    fetch('./api.php', {
                        method: 'POST',
                        body: fd,
                        credentials: 'same-origin'
                    }).then(function(resp) { return resp.json(); }).then(function(json) {
                        if (json && json.success) {
                            // Close modal/panel and refresh to reflect edits
                            try { showTab(previousTab || 'scan'); } catch(e) {}
                            // give server a moment then reload
                            setTimeout(function() { location.reload(); }, 250);
                        } else {
                            // Show error - try to surface message from server
                            var msg = (json && json.error) ? json.error : 'Failed to save changes';
                            alert(msg);
                        }
                    }).catch(function(err) {
                        console.error('update_product request failed', err);
                        alert('Failed to save changes (network error)');
                    });
                } catch (err) {
                    console.error('edit submit handler error', err);
                }
            });
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
    // Restore persisted variants-section visibility when attaching listeners (only for non-edit flows)
    try {
        const persisted = localStorage.getItem('bb_variants_section_visible');
        if (typeof persisted !== 'undefined' && persisted !== null) {
            const addItemsPanel = document.getElementById('addItemsTabPanel');
            if (addItemsPanel && addItemsPanel.getAttribute('data-row-edit') !== '1') {
                if (persisted === '1') {
                    try { showVariantsSection(); } catch(e) {}
                } else {
                    try { hideVariantsSection(); } catch(e) {}
                }
            }
        }
    } catch(e) {}
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
    if (createTabBtn) createTabBtn.onclick = () => showTab('create', false);
    // Add Items triggers
    if (skipScannerBtn) skipScannerBtn.onclick = () => {
        showTab('addItems', true);
        window.ensureAttachAddItems();
    };
    if (skipManualEntryBtn) skipManualEntryBtn.onclick = () => {
        showTab('addItems', true);
        window.ensureAttachAddItems();
    };
    if (skipCreateTabBtn) skipCreateTabBtn.onclick = () => {
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

// Reusable negative-quantity confirmation with reason dropdown
function showNegativeQuantityConfirm(qty, onConfirm, onCancel) {
    // Ensure single modal instance
    let modal = document.getElementById('negativeQtyConfirmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'negativeQtyConfirmModal';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.45)';
        modal.style.zIndex = '100000';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';

        const content = document.createElement('div');
    content.style.background = '#121212';
    content.style.padding = '12px';
    content.style.borderRadius = '10px';
    content.style.minWidth = '260px';
    content.style.maxWidth = '360px';
    content.style.width = 'auto';
    content.style.color = '#fff';
        content.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';

        const msg = document.createElement('div');
        msg.id = 'negativeQtyMsg';
        msg.style.marginBottom = '12px';
        msg.style.fontSize = '15px';
        content.appendChild(msg);

        const reasonRow = document.createElement('div');
        reasonRow.style.display = 'flex';
        reasonRow.style.flexDirection = 'column';
        reasonRow.style.gap = '8px';
        reasonRow.style.marginBottom = '12px';

        const label = document.createElement('label');
        label.textContent = 'Reason';
        label.style.fontSize = '13px';
        label.style.color = '#d7d7d7';
        reasonRow.appendChild(label);

        // Build a custom-styled dropdown (to match category options) instead of a native <select>
        const opts = ['Waste','Damaged', 'Expired', 'Inventory adjustment', 'Sold/Returned', 'Other'];
        let selectedReason = opts[0];
        const dropdown = document.createElement('div');
        dropdown.className = 'negative-reason-dropdown';
        dropdown.style.position = 'relative';
        dropdown.style.userSelect = 'none';
        dropdown.style.width = '100%';

        const selectedDisplay = document.createElement('div');
        selectedDisplay.className = 'negative-reason-selected';
        selectedDisplay.textContent = selectedReason;
        selectedDisplay.style.padding = '8px';
        selectedDisplay.style.background = '#0f0f0f';
        selectedDisplay.style.color = '#fff';
        selectedDisplay.style.border = '1px solid #333';
        selectedDisplay.style.borderRadius = '6px';
        selectedDisplay.style.cursor = 'pointer';
        selectedDisplay.style.display = 'flex';
        selectedDisplay.style.alignItems = 'center';
        selectedDisplay.style.justifyContent = 'space-between';

        const caret = document.createElement('span');
        caret.textContent = '▾';
        caret.style.marginLeft = '8px';
        caret.style.opacity = '0.8';
        selectedDisplay.appendChild(caret);

    const optionsList = document.createElement('div');
    optionsList.className = 'negative-reason-options';
    optionsList.style.position = 'absolute';
    optionsList.style.left = '0';
    optionsList.style.right = '0';
    optionsList.style.top = '0';
    // make scroller background transparent to match requested style
    optionsList.style.background = '#252525ff';
        optionsList.style.border = '1px solid #333';
        optionsList.style.borderRadius = '6px';
        optionsList.style.boxShadow = '0 8px 20px rgba(0,0,0,0.6)';
        optionsList.style.zIndex = '100001';
        optionsList.style.display = 'none';
        optionsList.style.maxHeight = '200px';
        optionsList.style.overflow = 'auto';

        // Inject light custom scrollbar styles (WebKit + simple fallback) so the
        // scroller appears transparent and subtle. Only inject once per document.
        if (!document.getElementById('negativeQtyCustomStyles')) {
            const ss = document.createElement('style');
            ss.id = 'negativeQtyCustomStyles';
            ss.textContent = `
            .negative-reason-options::-webkit-scrollbar{width:8px;height:8px}
            .negative-reason-options::-webkit-scrollbar-track{background:transparent}
            .negative-reason-options::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:6px}
            `;
            document.head.appendChild(ss);
        }

        opts.forEach(o => {
            const opt = document.createElement('div');
            opt.className = 'negative-reason-option';
            opt.textContent = o;
            opt.dataset.value = o;
            opt.style.padding = '10px 8px';
            opt.style.cursor = 'pointer';
            opt.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
            opt.style.color = '#fff';
            opt.addEventListener('mouseenter', () => { opt.style.background = '#151515'; });
            opt.addEventListener('mouseleave', () => { opt.style.background = 'transparent'; });
            opt.addEventListener('click', function(e) {
                selectedReason = this.dataset.value;
                // Update the selected text while keeping the caret
                if (selectedDisplay.firstChild && selectedDisplay.firstChild.nodeType === 3) {
                    selectedDisplay.firstChild.nodeValue = selectedReason;
                } else {
                    selectedDisplay.insertBefore(document.createTextNode(selectedReason), caret);
                }
                optionsList.style.display = 'none';
                // toggle other input visibility
                if (selectedReason === 'Other') otherInput.style.display = '';
                else otherInput.style.display = 'none';
            });
            optionsList.appendChild(opt);
        });

        // Ensure selectedDisplay shows the selectedReason text node before the caret
        if (!(selectedDisplay.firstChild && selectedDisplay.firstChild.nodeType === 3)) {
            selectedDisplay.insertBefore(document.createTextNode(selectedReason), caret);
        } else {
            selectedDisplay.firstChild.nodeValue = selectedReason;
        }

        selectedDisplay.addEventListener('click', function(e) {
            e.stopPropagation();
            optionsList.style.display = (optionsList.style.display === 'none') ? 'block' : 'none';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function docClose(e) {
            if (optionsList.style.display === 'block') optionsList.style.display = 'none';
        });

        dropdown.appendChild(selectedDisplay);
        dropdown.appendChild(optionsList);
        reasonRow.appendChild(dropdown);

        const otherInput = document.createElement('input');
    otherInput.id = 'negativeQtyOther';
    otherInput.placeholder = 'If Other, explain (optional)';
    otherInput.style.padding = '8px';
    otherInput.style.background = '#0f0f0f';
    otherInput.style.color = '#fff';
    otherInput.style.border = '1px solid #333';
    otherInput.style.borderRadius = '6px';
    otherInput.style.display = 'none';
    otherInput.style.width = '100%';
        reasonRow.appendChild(otherInput);

        // otherInput visibility is toggled in option click handler above

        content.appendChild(reasonRow);

        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.justifyContent = 'flex-end';
        btnRow.style.gap = '10px';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'btn';
        cancelBtn.style.background = '#333';
        cancelBtn.style.color = '#fff';
        cancelBtn.style.padding = '8px 12px';
        cancelBtn.style.borderRadius = '6px';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Continue';
        confirmBtn.className = 'btn';
        confirmBtn.style.background = '#ff9800';
        confirmBtn.style.color = '#171717';
        confirmBtn.style.padding = '8px 12px';
        confirmBtn.style.borderRadius = '6px';

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        content.appendChild(btnRow);
        modal.appendChild(content);
        document.body.appendChild(modal);

        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            if (onCancel) onCancel();
        });

        confirmBtn.addEventListener('click', function() {
            const reason = (typeof selectedReason !== 'undefined' && selectedReason === 'Other') ? (otherInput.value.trim() || 'Other') : selectedReason;
            modal.style.display = 'none';
            if (onConfirm) onConfirm(reason);
        });
    }

    // Show and set message (split into sentences / separate lines)
    modal.style.display = 'flex';
    const msgEl = document.getElementById('negativeQtyMsg');
    if (msgEl) {
        const sentences = [
            `This will reduce the stock to (${String(qty)}).`,
            'Are you sure you want to continue?'
        ];
        // Use innerHTML to preserve line breaks; safe since content is static apart from qty
        msgEl.innerHTML = sentences.join('<br>');
    }
}

// Make inventory table rows hoverable and open popup modal on row click
document.addEventListener('DOMContentLoaded', function() {
    try {
        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) return;

        // Helper: snapshot and restore modal panel state (in-memory snapshot of fields + UI)
        function snapshotModalState(panel) {
            if (!panel) return null;
            try {
                const fields = Array.from(panel.querySelectorAll('input, textarea, select')).map(el => ({ el: el, value: el.value, checked: el.checked, type: el.type }));
                const variantsBody = document.getElementById('variantsTableBody');
                const variantsHTML = variantsBody ? variantsBody.innerHTML : null;
                const priceRow = panel.querySelector('#priceRow');
                const priceRowDisplay = priceRow ? priceRow.style.display : null;
                // keep references to original children so we can restore layout after an edit
                const priceRowChildren = priceRow ? Array.from(priceRow.children) : null;
                const variantsSection = panel.querySelector('#variantsSection');
                const variantsSectionDisplay = variantsSection ? variantsSection.style.display : null;
                const inlineTrack = panel.querySelector('#inlineTrackStockToggle');
                const inlineTrackChecked = inlineTrack ? !!inlineTrack.checked : null;
                const variantsTrackToggle = panel.querySelector('#variantsTrackStockToggle');
                const variantsTrackChecked = variantsTrackToggle ? !!variantsTrackToggle.checked : null;
                const panelPosContainer = panel.querySelector('#posOptionsContainer');
                const posDisplay = panelPosContainer ? panelPosContainer.style.display : null;
                // determine currently active POS tab (colorShape or image)
                let activePosTab = null;
                try {
                    const activeBtn = panel.querySelector('.pos-tab-btn.active') || document.querySelector('.pos-tab-btn.active');
                    if (activeBtn && activeBtn.dataset && activeBtn.dataset.tab) activePosTab = activeBtn.dataset.tab;
                    else {
                        // fallback: check which panel is visible/active
                        const cs = panel.querySelector('#colorShapeTab');
                        const it = panel.querySelector('#imageTab');
                        if (cs && (cs.classList.contains('active') || cs.style.display === 'block')) activePosTab = 'colorShape';
                        else if (it && (it.classList.contains('active') || it.style.display === 'block')) activePosTab = 'image';
                    }
                } catch (e) { activePosTab = null; }
                let chevron = panel.querySelector('#posToggleChevron'); if (!chevron) chevron = document.getElementById('posToggleChevron');
                const chevronDisplay = chevron ? chevron.style.display : null;
                const selectedColors = Array.from(panel.querySelectorAll('.color-option.selected')).map(c => c.dataset && c.dataset.color ? c.dataset.color : null);
                const selectedShapes = Array.from(panel.querySelectorAll('.shape-option.selected')).map(s => s.dataset && s.dataset.shape ? s.dataset.shape : null);
                // Capture inline styles for color/shape options so transform/size/border restore exactly
                const colorOptionStyles = Array.from(panel.querySelectorAll('.color-option')).map(o => ({ color: o.dataset && o.dataset.color ? o.dataset.color : null, style: o.getAttribute('style') || '' }));
                const shapeOptionStyles = Array.from(panel.querySelectorAll('.shape-option')).map(o => ({ shape: o.dataset && o.dataset.shape ? o.dataset.shape : null, style: o.getAttribute('style') || '' }));
                const imageUrlInput = panel.querySelector('#productImageUrl') || document.querySelector('input[name="productImageUrl"]');
                const uploadedPreview = panel.querySelector('#uploadedImagePreview') || document.getElementById('uploadedImagePreview');
                const uploadedArea = panel.querySelector('#uploadedImageArea');
                const uploadArea = panel.querySelector('#imageUploadArea');
                const canvas = panel.querySelector('#imageCropCanvas');
                let canvasData = null;
                try { if (canvas && typeof canvas.toDataURL === 'function') canvasData = canvas.toDataURL('image/png'); } catch (e) {}
                // record whether the inline item cost input is readonly so we can restore it
                const inlineCostEl = panel.querySelector('#inlineItemCost') || document.getElementById('inlineItemCost');
                const inlineCostReadOnly = inlineCostEl ? (inlineCostEl.readOnly === true || inlineCostEl.hasAttribute('readonly')) : null;
                // record visibility of name-autocomplete, name-dropdown and add-variant button so we can restore
                const createSearchEl = document.getElementById('createItemSearch') || panel.querySelector('#createItemSearch');
                const createSearchVisible = createSearchEl ? (createSearchEl.style.display !== 'none') : null;
                const nameDropdownEl = document.getElementById('nameDropdown');
                const inlineNameDropdownVisible = nameDropdownEl ? (nameDropdownEl.classList && nameDropdownEl.classList.contains('show')) : null;
                const addVariantBtnEl = document.querySelector('.variants-add-btn') || (panel && panel.querySelector && panel.querySelector('.variants-add-btn'));
                const addVariantBtnVisible = addVariantBtnEl ? (addVariantBtnEl.style.display !== 'none') : null;
                // capture create-flow flags and visibility so we can fully restore Create mode after editing
                        const createFlowFlags = (function() {
                    try {
                        const inlineHideFlag = !!window._hideTrackToggle;
                        const inlineCostFixedFlag = !!window._inlineCostFixed;
                        const inlineTrackGroup = (function() { const el = document.getElementById('inlineTrackStockToggle'); return el ? (el.closest && el.closest('.form-group') ? el.closest('.form-group') : (el.parentElement && el.parentElement.parentElement)) : null; })();
                        const inlineTrackGroupVisibility = inlineTrackGroup ? inlineTrackGroup.style.visibility : null;
                        const inlineTrackGroupDisplay = inlineTrackGroup ? inlineTrackGroup.style.display : null;
                        const variantsTrackContainer = (function() { const v = document.getElementById('variantsTrackStockToggle'); return v ? (v.parentElement && v.parentElement.parentElement) : null; })();
                        const variantsTrackContainerVisibility = variantsTrackContainer ? variantsTrackContainer.style.visibility : null;
                        const variantsTrackContainerDisplay = variantsTrackContainer ? variantsTrackContainer.style.display : null;
                        const stockFieldsRow = document.getElementById('stockFieldsRow');
                        const stockFieldsRowDisplay = stockFieldsRow ? stockFieldsRow.style.display : null;
                        return {
                            hideTrackToggle: inlineHideFlag,
                            inlineCostFixed: inlineCostFixedFlag,
                            inlineTrackGroupVisibility: inlineTrackGroupVisibility,
                            inlineTrackGroupDisplay: inlineTrackGroupDisplay,
                            variantsTrackContainerVisibility: variantsTrackContainerVisibility,
                            variantsTrackContainerDisplay: variantsTrackContainerDisplay,
                            stockFieldsRowDisplay: stockFieldsRowDisplay
                        };
                    } catch (e) { return { hideTrackToggle: !!window._hideTrackToggle, inlineCostFixed: !!window._inlineCostFixed }; }
                })();

                return {
                    fields, variantsHTML, variantsSectionDisplay, inlineTrackChecked, variantsTrackChecked, priceRowDisplay, posDisplay, chevronDisplay, activePosTab, selectedColors, selectedShapes,
                    colorOptionStyles, shapeOptionStyles,
                    // record modal tab state (current and previous) so we can restore tab (scan/manual/create/addItems)
                    modalCurrentTab: (typeof currentTab !== 'undefined') ? currentTab : null,
                    modalPreviousTab: (typeof previousTab !== 'undefined') ? previousTab : null,
                    image: { urlInput: imageUrlInput ? imageUrlInput.value : null, previewSrc: uploadedPreview ? uploadedPreview.src : null, uploadedAreaVisible: uploadedArea ? uploadedArea.style.display : null, uploadAreaVisible: uploadArea ? uploadArea.style.display : null, canvasData },
                    createFlowFlags,
                    inlineCostReadOnly,
                    createSearchVisible,
                    inlineNameDropdownVisible,
                    addVariantBtnVisible,
                    priceRowChildren
                };
            } catch (e) { console.warn('snapshotModalState failed', e); return null; }
        }

        function restoreModalState(panel, snap) {
            if (!panel || !snap) return;
            try {
                // restore inputs
                if (Array.isArray(snap.fields)) {
                    snap.fields.forEach(f => {
                        try {
                            if (!f || !f.el) return;
                            if (f.type === 'checkbox' || f.type === 'radio') {
                                try { f.el.checked = !!f.checked; } catch (e) {}
                            } else {
                                try { f.el.value = (typeof f.value !== 'undefined' && f.value !== null) ? f.value : ''; } catch (e) {}
                            }
                        } catch (e) {}
                    });
                }
                // restore variants HTML
                try {
                    const variantsBody = document.getElementById('variantsTableBody');
                    if (variantsBody && typeof snap.variantsHTML === 'string') variantsBody.innerHTML = snap.variantsHTML;
                } catch (e) {}

                // restore variants section visibility and track toggles
                try {
                    const variantsSection = panel.querySelector('#variantsSection');
                    if (variantsSection && typeof snap.variantsSectionDisplay !== 'undefined') variantsSection.style.display = snap.variantsSectionDisplay || 'none';
                    // restore price row display
                    try {
                        const priceRow = panel.querySelector('#priceRow');
                        if (priceRow && typeof snap.priceRowDisplay !== 'undefined') priceRow.style.display = snap.priceRowDisplay || 'flex';
                    } catch (ee) {}
                    const inlineTrack = panel.querySelector('#inlineTrackStockToggle');
                    if (inlineTrack && typeof snap.inlineTrackChecked !== 'undefined') { inlineTrack.checked = !!snap.inlineTrackChecked; try { inlineTrack.dispatchEvent(new Event('change')); } catch(e){} }
                    const variantsTrackToggle = panel.querySelector('#variantsTrackStockToggle');
                    if (variantsTrackToggle && typeof snap.variantsTrackChecked !== 'undefined') { variantsTrackToggle.checked = !!snap.variantsTrackChecked; try { variantsTrackToggle.dispatchEvent(new Event('change')); } catch(e){} }
                } catch (e) {}

                // restore pos container display, active tab and chevron
                try {
                    const panelPosContainer = panel.querySelector('#posOptionsContainer');
                    if (panelPosContainer && typeof snap.posDisplay !== 'undefined') panelPosContainer.style.display = snap.posDisplay || 'none';
                    // restore active POS tab (colorShape or image)
                    try {
                        if (snap.activePosTab) {
                            const tabBtn = panel.querySelector('.pos-tab-btn[data-tab="' + snap.activePosTab + '"]') || document.querySelector('.pos-tab-btn[data-tab="' + snap.activePosTab + '"]');
                            if (tabBtn) {
                                try { tabBtn.click(); } catch (e) {
                                    // fallback: manual toggle
                                    try {
                                        panel.querySelectorAll('.pos-tab-btn').forEach(b => { b.classList.remove('active'); b.style.background = '#333'; b.style.color = '#dbdbdb'; });
                                        tabBtn.classList.add('active'); tabBtn.style.background = '#ff9800'; tabBtn.style.color = '#171717';
                                        panel.querySelectorAll('.pos-tab-panel').forEach(pp => { pp.style.display = 'none'; pp.classList.remove('active'); });
                                        const tp = panel.querySelector('#' + snap.activePosTab + 'Tab'); if (tp) { tp.style.display = 'block'; tp.classList.add('active'); }
                                    } catch (er) {}
                                }
                            }
                        }
                    } catch (e) { /* non-critical */ }
                    let chevron = panel.querySelector('#posToggleChevron'); if (!chevron) chevron = document.getElementById('posToggleChevron');
                    if (chevron && typeof snap.chevronDisplay !== 'undefined') chevron.style.display = snap.chevronDisplay || 'none';
                } catch (e) {}

                // restore priceRow original children/layout if we captured it
                try {
                    if (snap && snap.priceRowChildren && Array.isArray(snap.priceRowChildren)) {
                        try {
                            const priceRow = panel.querySelector('#priceRow');
                            if (priceRow) {
                                // Clear and re-append original nodes (this will move nodes back if they were relocated)
                                priceRow.innerHTML = '';
                                snap.priceRowChildren.forEach(function(node) {
                                    try { priceRow.appendChild(node); } catch(e) {}
                                });
                                // Ensure the restored priceRow children have expected flex layout
                                try {
                                    const cols = Array.from(priceRow.children || []);
                                    if (cols.length === 3) {
                                        try { cols[0].style.flex = '1.45'; } catch(e) {}
                                        try { cols[1].style.flex = '1.45'; } catch(e) {}
                                        try { cols[2].style.flex = '2'; } catch(e) {}
                                    }
                                    // clear any composite-specific alignment tweaks
                                    priceRow.style.alignItems = '';
                                    priceRow.style.justifyContent = 'space-between';
                                } catch(e) {}
                            }
                        } catch(e) {}
                    }
                } catch(e) {}

                // restore create-flow flags and visibility if captured
                try {
                    if (snap && snap.createFlowFlags) {
                        try { window._hideTrackToggle = !!snap.createFlowFlags.hideTrackToggle; } catch(e){}
                        try { window._inlineCostFixed = !!snap.createFlowFlags.inlineCostFixed; } catch(e){}
                        const inlineTrackGroup = (function() { const el = document.getElementById('inlineTrackStockToggle'); return el ? (el.closest && el.closest('.form-group') ? el.closest('.form-group') : (el.parentElement && el.parentElement.parentElement)) : null; })();
                        if (inlineTrackGroup) {
                            try {
                                if (typeof snap.createFlowFlags.inlineTrackGroupVisibility !== 'undefined') inlineTrackGroup.style.visibility = snap.createFlowFlags.inlineTrackGroupVisibility || '';
                                if (typeof snap.createFlowFlags.inlineTrackGroupDisplay !== 'undefined') inlineTrackGroup.style.display = snap.createFlowFlags.inlineTrackGroupDisplay || '';
                            } catch(e){}
                        }
                        const variantsTrackContainer = (function() { const v = document.getElementById('variantsTrackStockToggle'); return v ? (v.parentElement && v.parentElement.parentElement) : null; })();
                        if (variantsTrackContainer) {
                            try {
                                if (typeof snap.createFlowFlags.variantsTrackContainerVisibility !== 'undefined') variantsTrackContainer.style.visibility = snap.createFlowFlags.variantsTrackContainerVisibility || '';
                                if (typeof snap.createFlowFlags.variantsTrackContainerDisplay !== 'undefined') variantsTrackContainer.style.display = snap.createFlowFlags.variantsTrackContainerDisplay || '';
                            } catch(e){}
                        }
                        const stockFieldsRow = document.getElementById('stockFieldsRow');
                        if (stockFieldsRow && typeof snap.createFlowFlags.stockFieldsRowDisplay !== 'undefined') stockFieldsRow.style.display = snap.createFlowFlags.stockFieldsRowDisplay || '';
                        try { const inlineTrackEl = panel.querySelector('#inlineTrackStockToggle') || document.getElementById('inlineTrackStockToggle'); if (inlineTrackEl) inlineTrackEl.dispatchEvent(new Event('change')); } catch(e){}
                        try { const variantsTrackEl = panel.querySelector('#variantsTrackStockToggle') || document.getElementById('variantsTrackStockToggle'); if (variantsTrackEl) variantsTrackEl.dispatchEvent(new Event('change')); } catch(e){}
                    }
                } catch(e){}

                // restore selected color/shape and their inline styles
                try {
                    const allColorOpts = Array.from(panel.querySelectorAll('.color-option'));
                    // first restore styles for each option from snapshot if available
                    try {
                        if (Array.isArray(snap.colorOptionStyles)) {
                            snap.colorOptionStyles.forEach(sobj => {
                                try {
                                    if (!sobj || !sobj.color) return;
                                    const el = panel.querySelector('.color-option[data-color="' + sobj.color + '"]') || Array.from(allColorOpts).find(x => x.dataset && x.dataset.color && x.dataset.color.toString().toLowerCase() === sobj.color.toString().toLowerCase());
                                    if (el) el.setAttribute('style', sobj.style || '');
                                } catch(e) {}
                            });
                        }
                    } catch(e) {}
                    // clear selected classes
                    allColorOpts.forEach(o => { o.classList.remove('selected'); });
                    // reapply selection markers from snapshot
                    if (Array.isArray(snap.selectedColors) && snap.selectedColors.length) {
                        snap.selectedColors.forEach(cval => {
                            try {
                                if (!cval) return;
                                const opt = panel.querySelector('.color-option[data-color="' + cval + '"]') || Array.from(allColorOpts).find(x => x.dataset && x.dataset.color && x.dataset.color.toString().toLowerCase() === cval.toString().toLowerCase());
                                if (opt) opt.classList.add('selected');
                            } catch(e){}
                        });
                    }

                    const allShapeOpts = Array.from(panel.querySelectorAll('.shape-option'));
                    // restore shape inline styles
                    try {
                        if (Array.isArray(snap.shapeOptionStyles)) {
                            snap.shapeOptionStyles.forEach(sobj => {
                                try {
                                    if (!sobj || !sobj.shape) return;
                                    const el = panel.querySelector('.shape-option[data-shape="' + sobj.shape + '"]') || Array.from(allShapeOpts).find(x => x.dataset && x.dataset.shape && x.dataset.shape.toString().toLowerCase() === sobj.shape.toString().toLowerCase());
                                    if (el) el.setAttribute('style', sobj.style || '');
                                } catch(e) {}
                            });
                        }
                    } catch(e) {}
                    // clear selected classes
                    allShapeOpts.forEach(o => { o.classList.remove('selected'); });
                    if (Array.isArray(snap.selectedShapes) && snap.selectedShapes.length) {
                        snap.selectedShapes.forEach(sval => {
                            try {
                                if (!sval) return;
                                const opt = panel.querySelector('.shape-option[data-shape="' + sval + '"]') || Array.from(allShapeOpts).find(x => x.dataset && x.dataset.shape && x.dataset.shape.toString().toLowerCase() === sval.toString().toLowerCase());
                                if (opt) opt.classList.add('selected');
                            } catch(e){}
                        });
                    }
                } catch (e) {}

                // restore image UI
                try {
                    const imageUrlInput = panel.querySelector('#productImageUrl') || document.querySelector('input[name="productImageUrl"]');
                    if (imageUrlInput && snap.image && typeof snap.image.urlInput !== 'undefined') imageUrlInput.value = snap.image.urlInput || '';
                    const uploadedPreview = panel.querySelector('#uploadedImagePreview') || document.getElementById('uploadedImagePreview');
                    if (uploadedPreview && snap.image && typeof snap.image.previewSrc !== 'undefined') uploadedPreview.src = snap.image.previewSrc || '';
                    const uploadedArea = panel.querySelector('#uploadedImageArea');
                    const uploadArea = panel.querySelector('#imageUploadArea');
                    if (uploadedArea && snap.image && typeof snap.image.uploadedAreaVisible !== 'undefined') uploadedArea.style.display = snap.image.uploadedAreaVisible || 'none';
                    if (uploadArea && snap.image && typeof snap.image.uploadAreaVisible !== 'undefined') uploadArea.style.display = snap.image.uploadAreaVisible || '';
                    const canvas = panel.querySelector('#imageCropCanvas');
                    if (canvas && snap.image && snap.image.canvasData) {
                        const ctx = canvas.getContext && canvas.getContext('2d');
                        if (ctx) {
                            const img = new Image();
                            img.onload = function() { try { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height); } catch(e){} };
                            img.src = snap.image.canvasData;
                        }
                    }
                } catch (e) {}
                // restore header and primary action text according to create-flow flags
                try {
                    try {
                        const addItemsPanel = panel || document.getElementById('addItemsTabPanel');
                        const header = addItemsPanel ? addItemsPanel.querySelector('.modal-title') : null;
                        const actionBtn = addItemsPanel ? addItemsPanel.querySelector('button[type="submit"].btn.btn-primary, button[type="submit"].btn-primary, button.btn-primary[type="submit"], #inlineAddItemsForm button[type="submit"]') : null;
                        if (snap && snap.createFlowFlags && snap.createFlowFlags.hideTrackToggle) {
                            if (header) header.textContent = 'Create an Item';
                            if (actionBtn) actionBtn.textContent = 'Add Item';
                        } else {
                            if (header) header.textContent = 'Add new item';
                            if (actionBtn) actionBtn.textContent = 'Add Item';
                        }
                    } catch(e) { /* best-effort */ }
                } catch(e) {}
                // restore name-autocomplete, create-search and add-variant button visibility if captured
                try {
                    try {
                        const createSearchEl = document.getElementById('createItemSearch') || panel.querySelector('#createItemSearch');
                        if (createSearchEl && typeof snap.createSearchVisible !== 'undefined') createSearchEl.style.display = snap.createSearchVisible ? '' : 'none';
                    } catch(e) {}
                    try {
                        const addVariantBtnEl = (panel && panel.querySelector) ? panel.querySelector('.variants-add-btn') : document.querySelector('.variants-add-btn');
                        if (addVariantBtnEl && typeof snap.addVariantBtnVisible !== 'undefined') addVariantBtnEl.style.display = snap.addVariantBtnVisible ? '' : 'none';
                    } catch(e) {}
                    try {
                        const nameDropdown = document.getElementById('nameDropdown');
                        if (nameDropdown && typeof snap.inlineNameDropdownVisible !== 'undefined') {
                            if (snap.inlineNameDropdownVisible) {
                                nameDropdown.classList.add('show');
                                nameDropdown.style.display = '';
                            } else {
                                nameDropdown.classList.remove('show');
                                nameDropdown.style.display = 'none';
                            }
                        }
                            // Re-enable name-autocomplete behavior by calling helper or simulating input
                        try {
                                // Ensure composite suppression cleared before re-enabling
                                try { window._hideNameAutocompleteForComposite = false; } catch(e) {}
                                // Also clear inline-cost/track suppression so name dropdown logic isn't blocked
                                try { window._inlineCostFixed = false; } catch(e) {}
                                try { window._hideTrackToggle = false; } catch(e) {}

                                if (typeof window.resetNameDropdownState === 'function') {
                                    try { window.resetNameDropdownState(); } catch(e) {}
                                } else {
                                    const nameInput = document.getElementById('inlineItemName');
                                    try {
                                        if (nameInput) {
                                            // Focus + dispatch input to trigger any listeners (best-effort)
                                            try { nameInput.focus(); } catch(e) {}
                                            try { nameInput.dispatchEvent(new Event('input', { bubbles: true })); } catch(e) {}
                                        }
                                    } catch(e) {}
                                }
                                // Re-run the setup to ensure listeners are attached and dropdown appended
                                try { if (typeof setupNameAutocomplete === 'function') setupNameAutocomplete(); } catch(e) {}
                                    // Fallback: ensure a minimal autocomplete handler is present if full setup didn't attach
                                    try {
                                        const nameInput = document.getElementById('inlineItemName');
                                        const nameDropdown = document.getElementById('nameDropdown');
                                        if (nameInput && nameDropdown && !nameInput._fallbackAutocompleteBound) {
                                            const fallbackHandler = function(e) {
                                                try {
                                                    const val = (nameInput.value || '').trim();
                                                    if (!val) {
                                                        nameDropdown.classList.remove('show');
                                                        nameDropdown.style.display = 'none';
                                                        return;
                                                    }
                                                    if (window && (window._hideTrackToggle || window._inlineCostFixed || window._hideNameAutocompleteForComposite)) return;
                                                    // Build minimal dropdown content (Add Variants)
                                                    nameDropdown.innerHTML = '';
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
                                                    addVariantsOption.addEventListener('mousedown', function(ev){ ev.preventDefault(); });
                                                    addVariantsOption.addEventListener('click', function(ev){ ev.preventDefault(); try { showVariantsSection(); } catch(e){} nameDropdown.classList.remove('show'); nameDropdown.style.display = 'none'; });
                                                    nameDropdown.appendChild(addVariantsOption);
                                                    nameDropdown.classList.add('show'); nameDropdown.style.display = '';
                                                } catch (e) { /* ignore fallback errors */ }
                                            };
                                            // Also bind focus to trigger when field has value
                                            nameInput.addEventListener('input', fallbackHandler);
                                            nameInput.addEventListener('focus', fallbackHandler);
                                            nameInput._fallbackAutocompleteBound = true;
                                        }
                                    } catch(e) {}

                            // Ensure the Add Variant button is visible and wired
                            try {
                                const addVariantBtn = (panel && panel.querySelector) ? panel.querySelector('.variants-add-btn') : document.querySelector('.variants-add-btn');
                                if (addVariantBtn) {
                                    if (typeof snap.addVariantBtnVisible !== 'undefined') addVariantBtn.style.display = snap.addVariantBtnVisible ? '' : 'none';
                                    // Rebind click handler if missing
                                    if (!addVariantBtn._hasVariantsHandler) {
                                        try { addVariantBtn.addEventListener('click', function(){ try { addVariantRow(); } catch(e){} }); addVariantBtn._hasVariantsHandler = true; } catch(e) {}
                                    }
                                }
                            } catch(e) {}
                        } catch(e) {}
                    } catch(e) {}
                } catch(e) {}
            } catch (e) { console.warn('restoreModalState failed', e); }
            // Restore modal tab (previous tab preferred)
            try {
                const targetTab = (snap && snap.modalPreviousTab) ? snap.modalPreviousTab : ((snap && snap.modalCurrentTab) ? snap.modalCurrentTab : null);
                if (typeof showTab === 'function' && targetTab) {
                    try { showTab(targetTab, false); } catch (e) { /* best-effort */ }
                }
            } catch (e) { /* ignore */ }
            // clear composite-specific suppression so name-autocomplete is allowed again
            try { window._hideNameAutocompleteForComposite = false; } catch(e) {}
        }

        // inject minimal styles for hoverable rows (keeps visuals consistent)
        try {
            const css = `
                .inventory-row-clickable { cursor: pointer; transition: background 120ms ease; }
                .inventory-row-clickable:hover { background: #232323; }
            `;
            const s = document.createElement('style'); s.type = 'text/css'; s.appendChild(document.createTextNode(css));
            document.head.appendChild(s);
        } catch (e) { /* ignore styling failures */ }

        // Helper to decide if click target is interactive (we should not open modal)
        function isInteractiveTarget(el) {
            if (!el) return false;
            // inputs, selects, buttons, links or explicit controls should not trigger modal
            try {
                if (el.closest && (el.closest('input, textarea, select, button, a'))) return true;
            } catch (e) {}
            // If click is anywhere inside the table cell that contains the row checkbox,
            // treat it as interactive so clicking the checkbox area doesn't open the modal.
            try {
                if (el.closest) {
                    const td = el.closest('td');
                    if (td && td.querySelector && td.querySelector('input.row-select-checkbox')) return true;
                }
            } catch (e) {}
            // explicit row-level control classes
            if (el.classList && (el.classList.contains('row-select-checkbox') || el.classList.contains('category-select') || el.classList.contains('variant-toggle'))) return true;
            return false;
        }

        // Click handler (delegated)
        tbody.addEventListener('click', function(e) {
            try {
                // If click happened on an interactive element, ignore
                if (isInteractiveTarget(e.target)) return;

                const tr = e.target.closest && e.target.closest('tr');
                if (!tr) return;

                // Optionally ignore clicks on variant rows (if you don't want them opening modal)
                // if (tr.classList.contains('variant-row')) return;

                // Open the scanner/add-item modal in a friendly way
                const modal = document.getElementById('scannerModal') || window.scannerModal;
                if (modal) {
                    // Ensure modal is visible (use same class as other open paths)
                    modal.style.display = 'flex';
                    try { modal.classList.add('show'); } catch (e) {}
                    // Directly show Add Items panel WITHOUT transitions or intermediate tabs.
                    // resetAddItemsAnim removes any pending animation classes so the panel
                    // appears immediately without slide animations.
                    try { if (typeof resetAddItemsAnim === 'function') resetAddItemsAnim(); } catch (e) {}
                    // Avoid using showTab which may perform animations; directly
                    // show the Add Items panel and hide other panels to prevent
                    // any slide transitions.
                    try {
                        const addItemsPanel = document.getElementById('addItemsTabPanel');
                        const scanPanelEl = document.getElementById('scanTabPanel');
                        const manualPanelEl = document.getElementById('manualTabPanel');
                        const createPanelEl = document.getElementById('createTabPanel');
                        const barcodePanelEl = document.getElementById('barcodeResultsTabPanel');
                        const modalTabs = document.querySelector('.modal-tabs');
                        const modalContentElem = document.querySelector('.modal-content.scanner-modal');

                        // Hide other panels
                        try { if (scanPanelEl) scanPanelEl.style.display = 'none'; } catch (e) {}
                        try { if (manualPanelEl) manualPanelEl.style.display = 'none'; } catch (e) {}
                        try { if (createPanelEl) createPanelEl.style.display = 'none'; } catch (e) {}
                        try { if (barcodePanelEl) barcodePanelEl.style.display = 'none'; } catch (e) {}

                        // Ensure the addItems panel exists and activate it using classes
                        // (avoid forcing inline sizing so the modal can autosize like the normal flow)
                        if (addItemsPanel) {
                            // Remove animation classes so it won't animate in
                            try { addItemsPanel.classList.remove('modal-slide-in','modal-slide-left','fb-modal-in','fb-modal-out'); } catch (e) {}
                            // Use class activation; remove any inline sizing/transition we may have applied
                            try {
                                addItemsPanel.classList.add('active');
                                addItemsPanel.style.removeProperty('transition');
                                addItemsPanel.style.removeProperty('display');
                                addItemsPanel.style.removeProperty('width');
                                addItemsPanel.style.removeProperty('height');
                                addItemsPanel.style.removeProperty('opacity');
                                addItemsPanel.style.removeProperty('pointer-events');
                            } catch (e) { /* best-effort cleanup */ }
                        }

                        // Hide the tab buttons area using the modal-content helper class so overall modal layout behaves the same
                        try { if (modalContentElem) modalContentElem.classList.add('hide-tabs'); } catch (e) {}
                        // Remove any modal-content animation classes (keep hide-tabs)
                        if (modalContentElem) {
                            try { modalContentElem.classList.remove('modal-slide-in','modal-slide-left','fb-modal-in','fb-modal-out'); } catch (e) {}
                        }

                        // Update tab tracking state
                        try { previousTab = currentTab || previousTab; currentTab = 'addItems'; } catch (e) {}
                    } catch (e) { /* ignore any errors and fall back to showTab */
                        try { if (typeof showTab === 'function') showTab('addItems', false); } catch (err) { /* ignore */ }
                    }
                    // Ensure add-items listeners attach (no-op if already attached)
                    try { if (typeof window.ensureAttachAddItems === 'function') window.ensureAttachAddItems(); } catch (e) {}
                    // Prefill Add Items form with product data when opened from a row click
                    try {
                        // Determine product id from row: parent rows have data-product-id, other rows may have checkbox dataset or data-parent-id
                        let pid = tr.getAttribute('data-product-id') || null;
                        if (!pid) {
                            const cb = tr.querySelector('.row-select-checkbox');
                            if (cb && cb.dataset && cb.dataset.productId) pid = cb.dataset.productId;
                        }
                        if (!pid) pid = tr.getAttribute('data-parent-id') || null;
                        if (pid) {
                            // mark panel with the product id so submit handler can detect edit vs create
                            try { const addItemsPanel = document.getElementById('addItemsTabPanel'); if (addItemsPanel) addItemsPanel.setAttribute('data-edit-product-id', String(pid)); } catch(e){}

                            // Snapshot the current modal state before we prefill/edit it.
                            try {
                                // Ensure Add Items panel is visible/active before snapshot (fixes case when modal currently on create/scan/manual)
                                try { if (typeof showTab === 'function') showTab('addItems', false); } catch (e) {}
                                const panelEl = document.getElementById('addItemsTabPanel');
                                if (panelEl && typeof panelEl._snapshot === 'undefined') {
                                    // Capture snapshot BEFORE we change global create-flow flags so we can restore them later
                                    try { panelEl._snapshot = snapshotModalState(panelEl); } catch (e) { console.warn('create snapshot failed', e); }
                                    // Now ensure the edit UI is fully visible: restore any Create-flow transient UI and force-clear flags for edit
                                    try { if (typeof restoreCreateAddState === 'function') restoreCreateAddState(); } catch (e) {}
                                    try {
                                        try { window._hideTrackToggle = false; } catch (e) {}
                                        try { window._inlineCostFixed = false; } catch (e) {}
                                        // Unhide track toggle groups if they were hidden by Create flow
                                        try {
                                            const inlineTrackGroup = (function() { const el = document.getElementById('inlineTrackStockToggle'); return el ? (el.closest('.form-group') || (el.parentElement && el.parentElement.parentElement)) : null; })();
                                            if (inlineTrackGroup) inlineTrackGroup.style.visibility = '';
                                        } catch (e) {}
                                        try {
                                            const variantsContainer = (function() { const v = document.getElementById('variantsTrackStockToggle'); return v ? (v.parentElement && v.parentElement.parentElement) : null; })();
                                            if (variantsContainer) variantsContainer.style.visibility = '';
                                        } catch (e) {}
                                        try { const stockFieldsRow = document.getElementById('stockFieldsRow'); if (stockFieldsRow) stockFieldsRow.style.display = ''; } catch (e) {}
                                    } catch (e) { console.warn('force restore create-flow UI failed', e); }

                                    // After snapshot, hide variant/track-stock/pos UI for edit flow (we hide after snapshot so original state is preserved)
                                    try {
                                        // hide variants section during edit and show priceRow
                                        const variantsSection = panelEl.querySelector('#variantsSection');
                                        if (variantsSection) variantsSection.style.display = 'none';
                                        try { const priceRow = panelEl.querySelector('#priceRow'); if (priceRow) priceRow.style.display = 'flex'; } catch(e) {}
                                        // turn off track stock toggles
                                        const inlineTrack = panelEl.querySelector('#inlineTrackStockToggle');
                                        if (inlineTrack) { inlineTrack.checked = false; try { inlineTrack.dispatchEvent(new Event('change')); } catch(e){} }
                                        const variantsTrackToggle = panelEl.querySelector('#variantsTrackStockToggle');
                                        if (variantsTrackToggle) { variantsTrackToggle.checked = false; try { variantsTrackToggle.dispatchEvent(new Event('change')); } catch(e){} }
                                        // hide POS options
                                        const posCheckbox = panelEl.querySelector('#availablePOS');
                                        if (posCheckbox) { posCheckbox.checked = false; }
                                    } catch (er) { console.warn('apply edit UI changes failed', er); }
                                }
                            } catch (e) { console.warn('snapshot capture failed', e); }

                            fetch('get_product.php?product_id=' + encodeURIComponent(pid))
                                .then(r => r.json())
                                .then(data => {
                                    console.log('get_product.php response for product_id=' + pid + ':', data);
                                    try {
                                        if (!data || !data.success || !data.product) return;
                                        const p = data.product;
                                        const panel = document.getElementById('addItemsTabPanel');
                                        if (!panel) return;

                                        // Basic fields
                                        try { const nameEl = panel.querySelector('#inlineItemName'); if (nameEl) nameEl.value = p.name || ''; } catch(e){}
                                        try { const catEl = panel.querySelector('#inlineItemCategory'); if (catEl) catEl.value = (tr.getAttribute('data-category') || catEl.value || ''); } catch(e){}
                                        try {
                                            const priceEl = panel.querySelector('#inlineItemPrice');
                                            if (priceEl) {
                                                if (p.price !== null && p.price !== '' && !isNaN(p.price)) {
                                                    priceEl.value = '₱' + Number(p.price).toFixed(2);
                                                } else if (String(p.price).toLowerCase() === 'variable') {
                                                    // leave blank when price is 'variable'
                                                    priceEl.value = '';
                                                } else {
                                                    priceEl.value = (p.price || '');
                                                }
                                            }
                                        } catch(e){}
                                        try {
                                            const costEl = panel.querySelector('#inlineItemCost');
                                            if (costEl) {
                                                if (p.cost !== null && p.cost !== '' && !isNaN(p.cost)) costEl.value = '₱' + Number(p.cost).toFixed(2);
                                                else costEl.value = (p.cost || '');
                                            }
                                        } catch(e){}
                                        try { const skuEl = panel.querySelector('#inlineItemSKU'); if (skuEl) skuEl.value = p.sku || ''; } catch(e){}
                                        // product-level barcode may not exist; try to set from first variant if available
                                        try { const barcodeEl = panel.querySelector('#inlineItemBarcode'); if (barcodeEl) barcodeEl.value = (p.barcode || (p.variants && p.variants[0] && p.variants[0].barcode) || ''); } catch(e){}

                                        // Track stock and stock fields
                                        try {
                                            const trackEl = panel.querySelector('#inlineTrackStockToggle');
                                            const trackAttr = tr.getAttribute('data-track');
                                            const trackChecked = (trackAttr === '1' || trackAttr === 'true' || !!p.track_stock);
                                            if (trackEl) { trackEl.checked = !!trackChecked; trackEl.dispatchEvent(new Event('change')); }
                                        } catch(e){}
                                        try {
                                            const inStockEl = panel.querySelector('#inlineInStock');
                                            const lowEl = panel.querySelector('#inlineLowStock');
                                            // Only populate stock fields when tracking is enabled
                                            const trackEl = panel.querySelector('#inlineTrackStockToggle');
                                            const trackCheckedLocal = (trackEl && trackEl.checked) || (!!p.track_stock && Number(p.track_stock) === 1);
                                            // helper: parse numeric value + unit suffix
                                            function splitNumericAndUnit(raw) {
                                                if (raw === undefined || raw === null) return { value: '', unit: '- -' };
                                                const s = String(raw).trim();
                                                if (s === '') return { value: '', unit: '- -' };
                                                const m = s.match(/^\s*([+-]?\d+(?:\.\d+)?)(?:\s*(.+))?$/);
                                                if (m) return { value: m[1], unit: (m[2] || '- -').trim() };
                                                // no numeric part: put entire string in unit and leave value empty
                                                return { value: '', unit: s };
                                            }
                                            if (trackCheckedLocal) {
                                                try {
                                                    const parsedIn = splitNumericAndUnit(p.in_stock);
                                                    const parsedLow = splitNumericAndUnit(p.low_stock);
                                                    if (inStockEl) inStockEl.value = parsedIn.value;
                                                    if (lowEl) lowEl.value = parsedLow.value;
                                                    // set unit suffix in the unit-value element (do not put unit inside input value)
                                                    try {
                                                        const inUnitEl = inStockEl && inStockEl.parentElement && inStockEl.parentElement.querySelector('.unit-value');
                                                        if (inUnitEl) {
                                                            inUnitEl.textContent = parsedIn.unit || '- -';
                                                            // Make the unit selector visible immediately when there's a meaningful unit
                                                            try { const parentSel = inUnitEl.parentElement; if (parentSel && parsedIn.unit && parsedIn.unit !== '- -') parentSel.classList.add('show'); } catch (e) {}
                                                        }
                                                    } catch (e) {}
                                                    try {
                                                        const lowUnitEl = lowEl && lowEl.parentElement && lowEl.parentElement.querySelector('.unit-value');
                                                        if (lowUnitEl) {
                                                            lowUnitEl.textContent = parsedLow.unit || '- -';
                                                            try { const parentSel2 = lowUnitEl.parentElement; if (parentSel2 && parsedLow.unit && parsedLow.unit !== '- -') parentSel2.classList.add('show'); } catch (e) {}
                                                        }
                                                    } catch (e) {}
                                                } catch (e) { /* best-effort */ }
                                            } else {
                                                // if not tracking, ensure fields are hidden/cleared
                                                try { if (inStockEl) inStockEl.value = ''; } catch(e){}
                                                try { if (lowEl) lowEl.value = ''; } catch(e){}
                                                try { const inUnitEl = inStockEl && inStockEl.parentElement && inStockEl.parentElement.querySelector('.unit-value'); if (inUnitEl) inUnitEl.textContent = '- -'; } catch(e){}
                                                try { const lowUnitEl = lowEl && lowEl.parentElement && lowEl.parentElement.querySelector('.unit-value'); if (lowUnitEl) lowUnitEl.textContent = '- -'; } catch(e){}
                                            }
                                        } catch(e){}

                                        // POS availability (row attribute preferred). Only check when explicitly 1.
                                        try {
                                            const posEl = panel.querySelector('#availablePOS');
                                            const posAttr = tr.getAttribute('data-pos');
                                            if (posEl) {
                                                const posFromRow = (posAttr === '1' || posAttr === 'true');
                                                const posFromApi = (typeof p.pos_available !== 'undefined' && Number(p.pos_available) === 1);
                                                posEl.checked = posFromRow || posFromApi;
                                            }
                                        } catch(e){}

                                        // Prefill POS options tab based on product type or available image/shape
                                        try {
                                            const panelPosContainer = panel.querySelector('#posOptionsContainer');
                                            const posCheckboxLocal = panel.querySelector('#availablePOS');
                                            // make POS options visible when POS is enabled for this product
                                            if (panelPosContainer && posCheckboxLocal && posCheckboxLocal.checked) {
                                                panelPosContainer.style.display = 'block';
                                            }

                                            // Determine target tab from p.type or row attributes or presence of image/shape
                                            const typeVal = (p.type || tr.getAttribute('data-type') || '').toString().toLowerCase();
                                            const hasShape = (p.shape || tr.getAttribute('data-shape')) ? true : false;
                                            const hasColor = (p.color || tr.getAttribute('data-color')) ? true : false;
                                            const hasImage = (p.image_url || tr.getAttribute('data-image') || '').toString().trim() !== '';

                                            let targetTab = null;
                                            if (typeVal.indexOf('shape') !== -1 || typeVal.indexOf('color') !== -1 || (hasShape || hasColor)) {
                                                targetTab = 'colorShape';
                                            } else if (typeVal.indexOf('image') !== -1 || hasImage) {
                                                targetTab = 'image';
                                            }

                                            if (targetTab) {
                                                // find the corresponding tab button inside this panel and activate it
                                                const tabBtn = panel.querySelector('.pos-tab-btn[data-tab="' + (targetTab === 'colorShape' ? 'colorShape' : 'image') + '"]');
                                                if (tabBtn) {
                                                    try { tabBtn.click(); } catch (e) {
                                                        // fallback: directly toggle classes/panels similar to setupPOSOptions
                                                        try {
                                                            panel.querySelectorAll('.pos-tab-btn').forEach(b => { b.classList.remove('active'); b.style.background = '#333'; b.style.color = '#dbdbdb'; });
                                                            tabBtn.classList.add('active'); tabBtn.style.background = '#ff9800'; tabBtn.style.color = '#171717';
                                                            panel.querySelectorAll('.pos-tab-panel').forEach(pp => { pp.style.display = 'none'; pp.classList.remove('active'); });
                                                            const tp = panel.querySelector('#' + targetTab + 'Tab'); if (tp) { tp.style.display = 'block'; tp.classList.add('active'); }
                                                        } catch (er) { /* best-effort */ }
                                                    }
                                                }
                                                // Also prefill visuals: color/shape selection or product image
                                                try {
                                                    // small delay to ensure panels have been toggled
                                                    setTimeout(function() {
                                                        try {
                                                            if (targetTab === 'colorShape') {
                                                                // Prefill color if available (case-insensitive match)
                                                                const colorVal = (p.color || tr.getAttribute('data-color') || '').toString().trim();
                                                                if (colorVal) {
                                                                    const colorCandidates = Array.from(panel.querySelectorAll('.color-option'));
                                                                    const colorOpt = colorCandidates.find(c => (c.dataset && c.dataset.color && c.dataset.color.toString().toLowerCase()) === colorVal.toLowerCase());
                                                                    if (colorOpt) {
                                                                        try { colorOpt.click(); } catch (e) { /* best-effort */ }
                                                                        try { colorOpt.classList.add('selected'); colorOpt.style.border = '2px solid #ff9800'; } catch(e) {}
                                                                    }
                                                                }
                                                                // Prefill shape if available (case-insensitive match)
                                                                const shapeVal = (p.shape || tr.getAttribute('data-shape') || '').toString().trim();
                                                                if (shapeVal) {
                                                                    const shapeCandidates = Array.from(panel.querySelectorAll('.shape-option'));
                                                                    const shapeOpt = shapeCandidates.find(s => (s.dataset && s.dataset.shape && s.dataset.shape.toString().toLowerCase()) === shapeVal.toLowerCase());
                                                                    if (shapeOpt) {
                                                                        try { shapeOpt.click(); } catch (e) { /* best-effort */ }
                                                                        try {
                                                                            shapeOpt.classList.add('selected');
                                                                            // For triangle-shaped options we must not overwrite the
                                                                            // border-left/right triangle construction by setting
                                                                            // a generic border. Instead, highlight by changing
                                                                            // the triangle's border-bottom color and add a subtle
                                                                            // outline via boxShadow so the shape remains the same size.
                                                                            if ((shapeOpt.dataset && shapeOpt.dataset.shape) === 'triangle') {
                                                                                // Triangles are drawn with left/right transparent borders
                                                                                // and a colored bottom border. Avoid setting a generic
                                                                                // `border` (it creates a rectangular outline). Clear
                                                                                // any generic border and only set the triangle borders.
                                                                                try { shapeOpt.style.border = 'none'; } catch(e) {}
                                                                                try { shapeOpt.style.boxShadow = ''; } catch(e) {}
                                                                                // ensure left/right transparent borders are present
                                                                                shapeOpt.style.borderLeft = '12px solid transparent';
                                                                                shapeOpt.style.borderRight = '12px solid transparent';
                                                                                // Try to use the prefilling color (if available) so the
                                                                                // triangle matches the chosen color. Prefer the computed
                                                                                // background of any selected color-option; fallback to
                                                                                // the accent color.
                                                                                try {
                                                                                    var colorEl = panel.querySelector('.color-option.selected') || panel.querySelector('.color-option[data-color="' + colorVal + '"]');
                                                                                    var colorCss = null;
                                                                                    if (colorEl && window.getComputedStyle) {
                                                                                        colorCss = window.getComputedStyle(colorEl).backgroundColor || null;
                                                                                    }
                                                                                    shapeOpt.style.borderBottom = '20px solid ' + (colorCss || '#ff9800');
                                                                                } catch(e) {
                                                                                    shapeOpt.style.borderBottom = '20px solid #ff9800';
                                                                                }
                                                                            } else {
                                                                                shapeOpt.style.border = '2px solid #ff9800';
                                                                            }
                                                                        } catch(e) {}
                                                                    }
                                                                }
                                                                // Also set global-like visible markers so popupmodal submission picks them up
                                                                try { if (typeof document !== 'undefined') {
                                                                    // set any visible lastSelected variables if present on window
                                                                    try { window.lastSelectedColor = colorVal || window.lastSelectedColor; } catch(e) {}
                                                                    try { window.lastSelectedShape = shapeVal || window.lastSelectedShape; } catch(e) {}
                                                                }} catch(e) {}
                                                            } else if (targetTab === 'image') {
                                                                // Prefill uploaded image preview if an image URL exists
                                                                const imgUrl = (p.image_url || tr.getAttribute('data-image') || '').toString().trim();
                                                                if (imgUrl) {
                                                                    try {
                                                                        const uploadedArea = panel.querySelector('#uploadedImageArea');
                                                                        const uploadArea = panel.querySelector('#imageUploadArea');
                                                                        const canvas = panel.querySelector('#imageCropCanvas');
                                                                        if (canvas && typeof CanvasRenderingContext2D !== 'undefined') {
                                                                            const ctx = canvas.getContext('2d');
                                                                            const img = new Image();
                                                                            img.crossOrigin = 'Anonymous';
                                                                            // Try multiple candidate URLs to handle relative path issues
                                                                            const candidates = (function(url) {
                                                                                const out = [];
                                                                                if (!url) return out;
                                                                                out.push(url);
                                                                                // ensure no leading slash then try with root-prefix
                                                                                const trimmed = url.replace(/^\/+/, '');
                                                                                out.push('/' + trimmed);
                                                                                // try current directory base (use first path segment as app root)
                                                                                try {
                                                                                    const pathParts = window.location.pathname.split('/').filter(Boolean);
                                                                                    if (pathParts.length) {
                                                                                        const appRoot = '/' + pathParts[0];
                                                                                        out.push(window.location.origin + appRoot + '/' + trimmed);
                                                                                    }
                                                                                } catch (ee) {}
                                                                                // full origin + trimmed
                                                                                out.push(window.location.origin + '/' + trimmed);
                                                                                // unique
                                                                                return out.filter((v,i,a) => v && a.indexOf(v) === i);
                                                                            })(imgUrl);

                                                                            let tryIndex = 0;
                                                                            function tryLoadNext() {
                                                                                if (tryIndex >= candidates.length) {
                                                                                    console.warn('all image candidate loads failed for', imgUrl, candidates);
                                                                                    // show uploaded area fallback
                                                                                    if (uploadedArea) uploadedArea.style.display = 'flex';
                                                                                    if (uploadArea) uploadArea.style.display = 'none';
                                                                                    try {
                                                                                        const imageUrlInput = panel.querySelector('#productImageUrl') || document.querySelector('input[name="productImageUrl"]') || panel.querySelector('.product-image-url input');
                                                                                        if (imageUrlInput) imageUrlInput.value = imgUrl;
                                                                                    } catch(e) {}
                                                                                    try { const uploadedPreview = panel.querySelector('#uploadedImagePreview') || document.getElementById('uploadedImagePreview'); if (uploadedPreview) uploadedPreview.src = imgUrl; } catch(e) {}
                                                                                    return;
                                                                                }
                                                                                const candidate = candidates[tryIndex++];
                                                                                img.onload = function() {
                                                                                    try {
                                                                                        const cw = canvas.width; const ch = canvas.height;
                                                                                        const ratio = Math.max(cw / img.width, ch / img.height);
                                                                                        const iw = img.width * ratio; const ih = img.height * ratio;
                                                                                        const sx = (cw - iw) / 2; const sy = (ch - ih) / 2;
                                                                                        ctx.clearRect(0,0,cw,ch);
                                                                                        ctx.drawImage(img, sx, sy, iw, ih);
                                                                                        if (uploadedArea) uploadedArea.style.display = 'flex';
                                                                                        if (uploadArea) uploadArea.style.display = 'none';
                                                                                        try {
                                                                                            const imageUrlInput = panel.querySelector('#productImageUrl') || document.querySelector('input[name="productImageUrl"]') || panel.querySelector('.product-image-url input');
                                                                                            if (imageUrlInput) imageUrlInput.value = imgUrl;
                                                                                        } catch(e) {}
                                                                                        try {
                                                                                            const uploadedPreview = panel.querySelector('#uploadedImagePreview') || document.getElementById('uploadedImagePreview');
                                                                                            if (uploadedPreview) uploadedPreview.src = candidate;
                                                                                        } catch(e) {}
                                                                                    } catch (e) { console.warn('draw image failed', e); }
                                                                                };
                                                                                img.onerror = function() {
                                                                                    // try next candidate
                                                                                    tryLoadNext();
                                                                                };
                                                                                // start load attempt
                                                                                try { img.src = candidate; } catch (e) { tryLoadNext(); }
                                                                            }
                                                                            // begin attempts
                                                                            tryLoadNext();
                                                                        } else {
                                                                            // fallback: show uploaded area if we can't draw
                                                                            if (uploadedArea) uploadedArea.style.display = 'flex';
                                                                            if (uploadArea) uploadArea.style.display = 'none';
                                                                            try {
                                                                                const imageUrlInput = panel.querySelector('#productImageUrl') || document.querySelector('input[name="productImageUrl"]') || panel.querySelector('.product-image-url input');
                                                                                if (imageUrlInput) imageUrlInput.value = imgUrl;
                                                                            } catch(e) {}
                                                                            try { const uploadedPreview = panel.querySelector('#uploadedImagePreview') || document.getElementById('uploadedImagePreview'); if (uploadedPreview) uploadedPreview.src = imgUrl; } catch(e) {}
                                                                        }
                                                                    } catch (e) { console.warn('prefill image failed', e); }
                                                                }
                                                            }
                                                        } catch (e) { /* ignore visual prefills */ }
                                                    }, 40);
                                                } catch(e) { console.warn('prefill visuals failed', e); }
                                            }
                                        } catch(e) { console.warn('prefill POS tab failed', e); }
                                        // If this product is a composite, alter the price/cost row to show the Create components
                                        try {
                                            const isComposite = (p.is_composite && (Number(p.is_composite) === 1)) || (tr.getAttribute && (tr.getAttribute('data-is-composite') === '1'));
                                            if (isComposite) {
                                                try {
                                                    const panel = document.getElementById('addItemsTabPanel');
                                                    const priceRow = panel ? panel.querySelector('#priceRow') : null;
                                                    if (priceRow) {
                                                        // Build left column showing a lightweight read-only view of the Create table
                                                        const leftCol = document.createElement('div');
                                                        // Do NOT use 'form-group' here so modal/global .form-group rules
                                                        // do not affect the cloned create-table layout.
                                                        leftCol.className = 'create-components-view';
                                                        leftCol.style.flex = '2';
                                                        // (No header label — show the create table starting at this position)
                                                        // Reduce top padding so the table appears higher in the column
                                                        leftCol.style.marginTop = '0px';
                                                        leftCol.style.paddingTop = '0px';
                                                        leftCol.style.transform = 'translateY(-10px)';
                                                        const viewWrap = document.createElement('div');
                                                        // Make the cloned create-table body scroll at a smaller
                                                        // height than the original so it becomes scrollable
                                                        // earlier on constrained modal heights.
                                                        viewWrap.style.maxHeight = '250px';
                                                        viewWrap.style.overflow = 'hidden';
                                                        viewWrap.style.background = 'transparent';
                                                        viewWrap.style.paddingTop = '0px';
                                                        viewWrap.style.marginBottom = '15px';

                                                        // Prefer cloning the real create table container so styling and footer
                                                        // match exactly. This clones only the `.create-table-container`
                                                        // (header table, scrollable body, footer) and strips IDs to
                                                        // avoid duplicate-id collisions. Next/Skip buttons are outside
                                                        // this container and will not be included.
                                                        const sourceContainer = document.querySelector('.create-table-container');
                                                        if (sourceContainer) {
                                                            try {
                                                                const cloned = sourceContainer.cloneNode(true);
                                                                // Remove internal IDs to avoid duplicate IDs in the DOM
                                                                Array.from(cloned.querySelectorAll('[id]')).forEach(function(el) {
                                                                    try { el.removeAttribute('id'); } catch (e) {}
                                                                });
                                                                // Ensure the clone is visually adapted for the read-only view.
                                                                // Do NOT apply a full border to the outer container because
                                                                // the footer should remain outside the bordered area. Instead
                                                                // we'll apply borders to the header table and the body
                                                                // container so the visual border wraps header+body only.
                                                                cloned.style.background = 'transparent';
                                                                cloned.style.paddingTop = '0px';
                                                                cloned.style.marginTop = '0px';
                                                                cloned.style.boxSizing = 'border-box';
                                                                cloned.classList.add('composite-create-clone');
                                                                // Remove any .form-group classes inside the clone so global
                                                                // product-form styles (labels/inputs) do not leak into the
                                                                // cloned table area.
                                                                try {
                                                                    Array.from(cloned.querySelectorAll('.form-group')).forEach(function(el){
                                                                        try { el.classList.remove('form-group'); } catch(e) {}
                                                                    });
                                                                    if (cloned.classList && cloned.classList.contains('form-group')) cloned.classList.remove('form-group');
                                                                } catch(e) {}
                                                                // Add breathing space between the scrollable table body and the footer
                                                                try {
                                                                    const clonedFooter = cloned.querySelector('.create-table-footer');
                                                                    if (clonedFooter) {
                                                                        clonedFooter.style.marginTop = '20px';
                                                                        clonedFooter.style.marginBottom = '10px';
                                                                    }
                                                                } catch (e) {}
                                                                // Make the cloned table's body scroll earlier than the original by
                                                                // reducing its max-height. Target the inner body container so
                                                                // header/footer remain fixed and only the list scrolls. Also
                                                                // darken the clone body background to visually separate it.
                                                                try {
                                                                    const clonedBodyContainer = cloned.querySelector('.create-table-body-container');
                                                                    // Header table (fixed header) — apply top/left/right border and top radius
                                                                    try {
                                                                        const headerTable = cloned.querySelector('table');
                                                                        if (headerTable) {
                                                                            headerTable.style.borderTop = '1px solid #333';
                                                                            headerTable.style.borderLeft = '1px solid #333';
                                                                            headerTable.style.borderRight = '1px solid #333';
                                                                            headerTable.style.borderTopLeftRadius = '8px';
                                                                            headerTable.style.borderTopRightRadius = '8px';
                                                                            headerTable.style.borderCollapse = 'separate';
                                                                            // Slightly darken header background to match body
                                                                            try { const thead = headerTable.querySelector('thead'); if (thead) thead.style.background = '#141414'; } catch(e){}
                                                                        }
                                                                    } catch(e){}
                                                                    if (clonedBodyContainer) {
                                                                        clonedBodyContainer.style.maxHeight = '150px';
                                                                        clonedBodyContainer.style.overflow = 'auto';
                                                                        clonedBodyContainer.style.background = '#141414';
                                                                        // Apply left/right/top/bottom borders so header+body appear enclosed
                                                                        clonedBodyContainer.style.borderLeft = '1px solid #333';
                                                                        clonedBodyContainer.style.borderRight = '1px solid #333';
                                                                        clonedBodyContainer.style.borderTop = '1px solid #333';
                                                                        clonedBodyContainer.style.borderBottom = '1px solid #333';
                                                                        clonedBodyContainer.style.borderBottomLeftRadius = '8px';
                                                                        clonedBodyContainer.style.borderBottomRightRadius = '8px';
                                                                        clonedBodyContainer.style.boxSizing = 'border-box';
                                                                    }
                                                                    // Ensure footer remains visually separate (no enclosing border)
                                                                    try {
                                                                        const clonedFooter = cloned.querySelector('.create-table-footer');
                                                                        if (clonedFooter) {
                                                                            clonedFooter.style.background = 'transparent';
                                                                            clonedFooter.style.marginTop = '0';
                                                                        }
                                                                    } catch(e){}
                                                                } catch (e) {}
                                                                // Attach any prefetched components (from product payload) so
                                                                // the setup IIFE can prefill them after wiring helpers.
                                                                try { cloned._prefillComponents = (p && p.components) ? p.components : null; } catch(e) {}
                                                                viewWrap.appendChild(cloned);
                                                                // Wire a localized autocomplete for the cloned create table so
                                                                // users can search/add components while editing composites.
                                                                try {
                                                                    (function setupCloneAutocomplete(cloneRoot) {
                                                                        if (!cloneRoot) return;
                                                                        const input = cloneRoot.querySelector('input[placeholder="Item search"]');
                                                                        const tbody = cloneRoot.querySelector('tbody');
                                                                        const footer = cloneRoot.querySelector('.create-table-footer');
                                                                        if (!input || !tbody || !footer) return;

                                                                        // Find the footer total element (matches original's min-width:120px)
                                                                        let totalEl = footer.querySelector('[style*="min-width:120px"]');
                                                                        if (!totalEl) totalEl = footer.querySelector('div');
                                                                        // Hide the cloned footer total and any textual label containing
                                                                        // the word "total" (e.g. "Total cost:") — the aggregated
                                                                        // component cost will be shown in the main item's Cost input.
                                                                        try { if (totalEl) totalEl.style.display = 'none'; } catch(e) {}
                                                                        try {
                                                                            Array.from(footer.querySelectorAll('*')).forEach(function(el){
                                                                                try {
                                                                                    const txt = (el.textContent || '').trim().toLowerCase();
                                                                                    if (txt && txt.indexOf('total') !== -1) {
                                                                                        el.style.display = 'none';
                                                                                    }
                                                                                } catch(e) {}
                                                                            });
                                                                        } catch(e) {}

                                                                        // Create dropdown element for clone
                                                                        const dropdown = document.createElement('div');
                                                                        dropdown.className = 'create-dropdown composite-clone-dropdown';
                                                                        // Use fixed positioning so the dropdown aligns to the input
                                                                        // relative to the viewport (works inside modal scrolls/transforms)
                                                                        dropdown.style.position = 'fixed';
                                                                        dropdown.style.zIndex = 99999;
                                                                        dropdown.style.display = 'none';
                                                                        document.body.appendChild(dropdown);

                                                                        // Small currency formatter
                                                                        function formatCurrency(n) {
                                                                            const num = parseFloat(n) || 0;
                                                                            return '₱' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                                        }

                                                                        function escapeHtml(s) { return String(s).replace(/[&<>'"`]/g, function(ch){ return '&#' + ch.charCodeAt(0) + ';'; }); }

                                                                        // Create a component row inside the clone
                                                                        function createComponentRow(name, qty, cost, sku) {
                                                                            const tr = document.createElement('tr');
                                                                            tr.className = 'component-row';
                                                                            tr.style.borderBottom = '1px solid #2b2b2b';
                                                                            tr.innerHTML = `
                                                                                <td style="padding:8px; color:#dbdbdb;">
                                                                                    <div class="comp-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                                                                        <div class="comp-name-text">${escapeHtml(name)}</div>
                                                                                        ${sku ? `<div class="comp-sku" style="color:#9e9e9e; font-size:12px; margin-top:0;">SKU: ${escapeHtml(sku)}</div>` : ''}
                                                                                    </div>
                                                                                </td>
                                                                                <td style="padding:8px; width:120px; text-align:right;"><input class="comp-qty" type="text" value="${qty}" style="width:100%; padding:6px; background:#171717; border:1px solid #333; color:#fff; border-radius:4px; text-align:right;" /></td>
                                                                                <td style="padding:8px; width:120px; text-align:right;"><input class="comp-cost" currency-localization="₱" readonly value="${'₱' + Number(cost).toFixed(2)}" style="width:100%; background:#171717; border: none; color:#fff; cursor:default; pointer-events: none; text-align:right;" /></td>
                                                                                <td style="padding:8px; width:45px; text-align:center;"><button class="comp-remove btn" title="Remove" style="background:transparent; border:none; color:#bbb; font-size:18px; line-height:1; width:30px; height:34px; display:inline-flex; align-items:center; justify-content:center;">🗑</button></td>
                                                                            `;
                                                                            // attach listeners
                                                                            try { tr.querySelector('.comp-qty').addEventListener('input', recalcTotal); } catch(e){}
                                                                            const rem = tr.querySelector('.comp-remove');
                                                                            if (rem) rem.addEventListener('click', function() { tr.remove(); recalcTotal(); });
                                                                            tbody.appendChild(tr);
                                                                            recalcTotal();
                                                                        }

                                                                        // If the outer scope provided components (from get_product.php),
                                                                        // prefill them into this clone now that helper functions are wired.
                                                                        try {
                                                                            if (cloneRoot && cloneRoot._prefillComponents && Array.isArray(cloneRoot._prefillComponents) && cloneRoot._prefillComponents.length) {
                                                                                const comps = cloneRoot._prefillComponents;
                                                                                // Small helper to format currency (same as used above)
                                                                                function formatCurrency(n) { const num = parseFloat(n) || 0; return '₱' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
                                                                                comps.forEach(function(comp) {
                                                                                    try {
                                                                                        // Prefer variant-enriched data when available
                                                                                        const qty = (comp.component_qty !== null && comp.component_qty !== undefined) ? comp.component_qty : (comp.qty || 1);
                                                                                        if (comp.variant || comp.component_variant_id) {
                                                                                            // build product object and variants array
                                                                                            const prod = (comp.product && comp.product.name) ? { id: comp.product.id, name: comp.product.name, sku: comp.product.sku } : { id: comp.component_product_id || null, name: comp.component_name || '', sku: comp.component_sku || '' };
                                                                                            const vars = [];
                                                                                            if (comp.variant) {
                                                                                                vars.push({ id: comp.variant.id, name: comp.variant.name, sku: comp.variant.sku, cost: comp.variant.cost, price: comp.variant.price });
                                                                                            } else if (comp.component_variant_id) {
                                                                                                vars.push({ id: comp.component_variant_id, name: comp.variant_name || '', sku: comp.variant_sku || comp.component_sku || '', cost: comp.component_cost !== null && comp.component_cost !== undefined ? comp.component_cost : (comp.variant_cost || 0), price: comp.variant_price || null });
                                                                                            }
                                                                                            // create row using available helper
                                                                                            try {
                                                                                                createComponentRowFromProduct(prod, vars);
                                                                                                // adjust qty and cost if provided
                                                                                                const rows = cloneRoot.querySelectorAll('tbody tr.component-row');
                                                                                                const last = rows[rows.length - 1];
                                                                                                if (last) {
                                                                                                    const qIn = last.querySelector('.comp-qty'); if (qIn) qIn.value = qty;
                                                                                                    const costIn = last.querySelector('.comp-cost'); if (costIn && comp.component_cost !== null && comp.component_cost !== undefined) costIn.value = formatCurrency(comp.component_cost);
                                                                                                }
                                                                                            } catch (e) {
                                                                                                // fallback to simple row
                                                                                                createComponentRow(comp.component_name || (comp.product && comp.product.name) || '', qty, comp.component_cost !== null && comp.component_cost !== undefined ? comp.component_cost : 0, comp.component_sku || (comp.product && comp.product.sku) || '');
                                                                                            }
                                                                                        } else if (comp.product || comp.component_product_id) {
                                                                                            // component references a product (no variant)
                                                                                            const pname = (comp.product && comp.product.name) ? comp.product.name : (comp.component_name || '');
                                                                                            const pcost = (comp.component_cost !== null && comp.component_cost !== undefined) ? comp.component_cost : ((comp.product && comp.product.cost) ? comp.product.cost : 0);
                                                                                            createComponentRow(pname, qty, pcost, comp.component_sku || (comp.product && comp.product.sku) || '');
                                                                                        } else {
                                                                                            // fallback minimal
                                                                                            createComponentRow(comp.component_name || '', qty, comp.component_cost || 0, comp.component_sku || '');
                                                                                        }
                                                                                    } catch (e) { /* per-component non-fatal */ }
                                                                                });
                                                                                // ensure totals updated
                                                                                try { recalcTotal(); } catch (e) {}
                                                                            }
                                                                        } catch (e) { /* ignore prefill errors */ }

                                                                        // When selecting a product object, possibly fetch variants
                                                                        function createComponentRowFromProduct(product, variants) {
                                                                            if (variants && Array.isArray(variants) && variants.length) {
                                                                                // use first variant
                                                                                const v = variants[0];
                                                                                const displayName = (product.name || '') + (v.name ? ' (' + v.name + ')' : '');
                                                                                const sku = v.sku || product.sku || '';
                                                                                const cost = (v.cost !== undefined && v.cost !== null) ? v.cost : (product.cost || product.price || 0);
                                                                                createComponentRow(displayName, 1, cost, sku);
                                                                            } else {
                                                                                const cost = (product.cost !== undefined && product.cost !== null) ? product.cost : (product.price !== undefined ? product.price : 0);
                                                                                createComponentRow(product.name || (product.product_name || ''), 1, cost, product.sku || product.product_sku || '');
                                                                            }
                                                                        }

                                                                        function recalcTotal() {
                                                                            let total = 0;
                                                                            const rows = tbody.querySelectorAll('tr.component-row');
                                                                            rows.forEach(r => {
                                                                                try {
                                                                                    const qRaw = (r.querySelector('.comp-qty') && r.querySelector('.comp-qty').value) ? r.querySelector('.comp-qty').value : '';
                                                                                    const q = window.evaluateQuantityExpression(qRaw) || 0;
                                                                                    const c = parseFloat((r.querySelector('.comp-cost').value || '').replace(/[^0-9.-]/g,'')) || 0;
                                                                                    total += q * c;
                                                                                } catch(e) {}
                                                                            });
                                                                            // Instead of updating the cloned footer, write the aggregated
                                                                            // component cost into the main Add/Edit item's Cost input.
                                                                            try {
                                                                                const mainCostInput = document.querySelector('#inlineItemCost') || document.getElementById('inlineItemCost');
                                                                                if (mainCostInput) {
                                                                                    // Write formatted currency value and emit input event so
                                                                                    // any listeners can react.
                                                                                    mainCostInput.value = formatCurrency(total);
                                                                                    try { mainCostInput.dispatchEvent(new Event('input', { bubbles: true })); } catch(e) {}
                                                                                }
                                                                            } catch(e) { /* non-critical */ }
                                                                        }

                                                                        // Product fetch & cache (search_api.php)
                                                                        let productsCache = null;
                                                                        function fetchProductsOnce() {
                                                                            if (productsCache !== null) return Promise.resolve(productsCache);
                                                                            // Try relative path then fallback to PHP-derived path if available
                                                                            return fetch('search_api.php').then(r => r.json()).then(data => {
                                                                                if (Array.isArray(data)) productsCache = data;
                                                                                else if (data && Array.isArray(data.products)) productsCache = data.products;
                                                                                else productsCache = [];
                                                                                return productsCache;
                                                                            }).catch(err => {
                                                                                console.warn('clone autocomplete fetch failed', err);
                                                                                productsCache = [];
                                                                                return productsCache;
                                                                            });
                                                                        }

                                                                        let filtered = [];
                                                                        let highlighted = -1;

                                                                        function showDropdown(items, searchTerm) {
                                                                            dropdown.innerHTML = '';
                                                                            filtered = items || [];
                                                                            highlighted = -1;
                                                                            const r = input.getBoundingClientRect();
                                                                            // Position using viewport coordinates (fixed) so the dropdown
                                                                            // stays attached to the input inside the modal regardless
                                                                            // of page/body scrolling or modal transforms.
                                                                            const top = Math.round(r.bottom + 2);
                                                                            const left = Math.round(r.left);
                                                                            dropdown.style.top = top + 'px';
                                                                            dropdown.style.left = left + 'px';
                                                                            dropdown.style.width = Math.round(r.width) + 'px';
                                                                            if (!filtered.length) {
                                                                                const noOpt = document.createElement('div');
                                                                                noOpt.className = 'create-option';
                                                                                noOpt.style.opacity = '0.7';
                                                                                noOpt.style.cursor = 'default';
                                                                                noOpt.textContent = searchTerm.trim() === '' ? 'Start typing to search items' : 'No item found';
                                                                                dropdown.appendChild(noOpt);
                                                                            } else {
                                                                                filtered.forEach(p => {
                                                                                    const opt = document.createElement('div');
                                                                                    opt.className = 'create-option';
                                                                                    const displayName = (p.name || p.product_name || p.title || '');
                                                                                    const displaySku = (p.sku || p.product_sku || p.barcode || '');
                                                                                    const displayCost = (p.cost !== undefined ? p.cost : (p.price !== undefined ? p.price : (p.unit_price !== undefined ? p.unit_price : '')));
                                                                                    opt.innerHTML = `
                                                                                        <div style="display:grid; grid-template-columns: 1fr 120px; align-items:center; gap:8px; width:100%;">
                                                                                            <div style="min-width:0;">
                                                                                                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; color:#e6e6e6;">${escapeHtml(displayName)}</div>
                                                                                                ${displaySku ? `<div style="color:#9e9e9e; font-size:12px; margin-top:4px;">SKU: ${escapeHtml(displaySku)}</div>` : ''}
                                                                                            </div>
                                                                                            <div style="text-align:right; color:#9ca3af; white-space:nowrap;">${displayCost !== '' ? '₱' + Number(displayCost).toFixed(2) : ''}</div>
                                                                                        </div>
                                                                                    `;
                                                                                    opt.addEventListener('mousedown', e => e.preventDefault());
                                                                                    opt.addEventListener('click', function() {
                                                                                        selectItem(p);
                                                                                    });
                                                                                    dropdown.appendChild(opt);
                                                                                });
                                                                            }
                                                                            dropdown.style.display = 'block';
                                                                        }

                                                                        function hideDropdown() { dropdown.style.display = 'none'; highlighted = -1; }

                                                                        function selectItem(item) {
                                                                            input.value = '';
                                                                            hideDropdown();
                                                                            // If item includes variants array, use it; else try fetch variants API
                                                                            if (item && item.variants && Array.isArray(item.variants) && item.variants.length) {
                                                                                createComponentRowFromProduct(item, item.variants);
                                                                                return;
                                                                            }
                                                                            if (item && (item.id || item.product_id)) {
                                                                                // try variants endpoint
                                                                                const pid = item.id || item.product_id;
                                                                                fetch('variants_api.php?product_id=' + encodeURIComponent(pid)).then(r=>r.json()).then(vars=>{
                                                                                    if (vars && Array.isArray(vars) && vars.length) createComponentRowFromProduct(item, vars);
                                                                                    else createComponentRow(item.name || item.product_name || '', 1, item.cost || item.price || 0, item.sku || '');
                                                                                }).catch(err=>{ createComponentRow(item.name || item.product_name || '', 1, item.cost || item.price || 0, item.sku || ''); });
                                                                                return;
                                                                            }
                                                                            // Fallback
                                                                            createComponentRow(item.name || item.product_name || '', 1, item.cost || item.price || 0, item.sku || '');
                                                                        }

                                                                        function filterProducts(term) {
                                                                            const list = productsCache || [];
                                                                            if (!term || term.trim() === '') return list;
                                                                            const q = term.toLowerCase();
                                                                            return list.filter(p => {
                                                                                const name = (p.name || p.product_name || p.title || '').toLowerCase();
                                                                                return name.includes(q);
                                                                            });
                                                                        }

                                                                        input.addEventListener('focus', function() {
                                                                            fetchProductsOnce().then(()=>{
                                                                                const list = filterProducts(input.value.trim());
                                                                                showDropdown(list, input.value.trim());
                                                                            });
                                                                        });
                                                                        input.addEventListener('input', function(e){
                                                                            const term = e.target.value.trim();
                                                                            fetchProductsOnce().then(()=>{
                                                                                const list = filterProducts(term);
                                                                                showDropdown(list, term);
                                                                            });
                                                                        });
                                                                        input.addEventListener('keydown', function(e){
                                                                            const opts = dropdown.querySelectorAll('.create-option');
                                                                            switch (e.key) {
                                                                                case 'ArrowDown': e.preventDefault(); highlighted = Math.min(highlighted+1, opts.length-1); highlight(); break;
                                                                                case 'ArrowUp': e.preventDefault(); highlighted = Math.max(highlighted-1, 0); highlight(); break;
                                                                                case 'Enter': e.preventDefault(); if (highlighted>=0 && filtered[highlighted]) selectItem(filtered[highlighted]); else if (filtered.length>0) selectItem(filtered[0]); break;
                                                                                case 'Escape': e.preventDefault(); hideDropdown(); input.blur(); break;
                                                                            }
                                                                        });

                                                                        function highlight() {
                                                                            const opts = dropdown.querySelectorAll('.create-option');
                                                                            opts.forEach(o=>o.classList.remove('highlighted'));
                                                                            if (highlighted>=0 && highlighted<opts.length) opts[highlighted].classList.add('highlighted');
                                                                        }

                                                                        document.addEventListener('click', function(e){ if (!input.contains(e.target) && !dropdown.contains(e.target)) hideDropdown(); });
                                                                        input.addEventListener('blur', function(){ setTimeout(()=>{ if (!dropdown.contains(document.activeElement)) hideDropdown(); }, 120); });

                                                                    })(cloned);
                                                                } catch (e) {}
                                                            } catch (e) {
                                                                // fallback to minimal table if cloning fails
                                                                const tbl = document.createElement('table');
                                                                tbl.style.width = '100%';
                                                                tbl.style.borderCollapse = 'collapse';
                                                                const tb = document.createElement('tbody');
                                                                const rows = document.querySelectorAll('#createComponentsBody tr.component-row');
                                                                if (rows && rows.length) {
                                                                    rows.forEach(function(r) {
                                                                        try {
                                                                            const name = (r.querySelector('.comp-name-text') && r.querySelector('.comp-name-text').textContent) ? r.querySelector('.comp-name-text').textContent : '';
                                                                            const qty = (r.querySelector('.comp-qty') && r.querySelector('.comp-qty').value) ? r.querySelector('.comp-qty').value : '';
                                                                            const cost = (r.querySelector('.comp-cost') && r.querySelector('.comp-cost').value) ? r.querySelector('.comp-cost').value : '';
                                                                            const trr = document.createElement('tr');
                                                                            trr.style.borderBottom = '1px solid #2b2b2b';
                                                                            trr.innerHTML = `<td style="padding:6px; color:#dbdbdb;">${escapeHtml(name)}</td><td style="padding:6px; color:#dbdbdb; text-align:right; width:120px;">${escapeHtml(qty)}</td><td style="padding:6px; color:#dbdbdb; text-align:right; width:120px;">${escapeHtml(cost)}</td>`;
                                                                            tb.appendChild(trr);
                                                                        } catch(e) {}
                                                                    });
                                                                } else {
                                                                    const trr = document.createElement('tr');
                                                                    trr.innerHTML = `<td style="padding:6px; color:#9e9e9e;">No components</td>`;
                                                                    tb.appendChild(trr);
                                                                }
                                                                tbl.appendChild(tb);
                                                                viewWrap.appendChild(tbl);
                                                            }
                                                        } else {
                                                            // If .create-table-container isn't present, fall back to old manual build
                                                            const tbl = document.createElement('table');
                                                            tbl.style.width = '100%';
                                                            tbl.style.borderCollapse = 'collapse';
                                                            const tb = document.createElement('tbody');
                                                            const rows = document.querySelectorAll('#createComponentsBody tr.component-row');
                                                            if (rows && rows.length) {
                                                                rows.forEach(function(r) {
                                                                    try {
                                                                        const name = (r.querySelector('.comp-name-text') && r.querySelector('.comp-name-text').textContent) ? r.querySelector('.comp-name-text').textContent : '';
                                                                        const qty = (r.querySelector('.comp-qty') && r.querySelector('.comp-qty').value) ? r.querySelector('.comp-qty').value : '';
                                                                        const cost = (r.querySelector('.comp-cost') && r.querySelector('.comp-cost').value) ? r.querySelector('.comp-cost').value : '';
                                                                        const trr = document.createElement('tr');
                                                                        trr.style.borderBottom = '1px solid #2b2b2b';
                                                                        trr.innerHTML = `<td style="padding:6px; color:#dbdbdb;">${escapeHtml(name)}</td><td style="padding:6px; color:#dbdbdb; text-align:right; width:120px;">${escapeHtml(qty)}</td><td style="padding:6px; color:#dbdbdb; text-align:right; width:120px;">${escapeHtml(cost)}</td>`;
                                                                        tb.appendChild(trr);
                                                                    } catch(e) {}
                                                                });
                                                            } else {
                                                                const trr = document.createElement('tr');
                                                                trr.innerHTML = `<td style="padding:6px; color:#9e9e9e;">No components</td>`;
                                                                tb.appendChild(trr);
                                                            }
                                                            tbl.appendChild(tb);
                                                            viewWrap.appendChild(tbl);
                                                        }
                                                        leftCol.appendChild(viewWrap);

                                                        // Build right column with stacked Price (top) and Cost (bottom)
                                                        const rightCol = document.createElement('div');
                                                        rightCol.className = 'form-group composite-price-cost';
                                                        rightCol.style.flex = '1';
                                                        rightCol.style.display = 'flex';
                                                        rightCol.style.flexDirection = 'column';
                                                        rightCol.style.justifyContent = 'space-between';
                                                        rightCol.style.gap = '8px';

                                                        // Move the existing price and cost form-groups into the right column to preserve inputs and references
                                                        try {
                                                            const priceGroup = panel.querySelector('#inlineItemPrice') ? panel.querySelector('#inlineItemPrice').closest('.form-group') : null;
                                                            const costGroup = panel.querySelector('#inlineItemCost') ? panel.querySelector('#inlineItemCost').closest('.form-group') : null;
                                                            if (priceGroup) {
                                                                // normalize style for stacked layout
                                                                priceGroup.style.flex = '';
                                                                rightCol.appendChild(priceGroup);
                                                            }
                                                            if (costGroup) {
                                                                costGroup.style.flex = '';
                                                                rightCol.appendChild(costGroup);
                                                            }
                                                            // Reduce input widths for composite edit so the Price/Cost columns are narrower
                                                            try {
                                                                // constrain the right column so it doesn't take too much space
                                                                rightCol.style.flex = '0 0 195px';
                                                            } catch(e) {}
                                                            try {
                                                                if (priceGroup) {
                                                                    const pin = priceGroup.querySelector('input');
                                                                    if (pin) { pin.style.maxWidth = '120px'; pin.style.width = '120px'; pin.style.boxSizing = 'border-box'; }
                                                                }
                                                            } catch(e) {}
                                                            try {
                                                                if (costGroup) {
                                                                    const cin = costGroup.querySelector('input');
                                                                    if (cin) { cin.style.maxWidth = '120px'; cin.style.width = '120px'; cin.style.boxSizing = 'border-box'; }
                                                                }
                                                            } catch(e) {}
                                                        } catch(e) {}

                                                        // Hide track stock toggle completely for composite view
                                                        try {
                                                            const inlineTrackGroup = panel.querySelector('#inlineTrackStockToggle') ? (panel.querySelector('#inlineTrackStockToggle').closest('.form-group') || panel.querySelector('#inlineTrackStockToggle').parentElement) : null;
                                                            if (inlineTrackGroup) inlineTrackGroup.style.display = 'none';
                                                        } catch(e) {}

                                                        // Replace priceRow content with our two columns
                                                        try {
                                                            priceRow.innerHTML = '';
                                                            priceRow.appendChild(leftCol);
                                                            priceRow.appendChild(rightCol);
                                                            // adjust spacing
                                                            priceRow.style.alignItems = 'flex-start';
                                                            // When showing composite layout, hide the name autocomplete
                                                            // and set a flag so other logic knows to suppress it.
                                                            try {
                                                                try { window._hideNameAutocompleteForComposite = true; } catch(e) {}
                                                                const nameDropdown = document.getElementById('nameDropdown');
                                                                if (nameDropdown) { nameDropdown.classList.remove('show'); nameDropdown.style.display = 'none'; }
                                                            } catch(e) {}
                                                                    // Mark panel as composite and make the main Cost input non-editable
                                                                    try {
                                                                        try { if (panel && panel.setAttribute) panel.setAttribute('data-is-composite', '1'); } catch(e) {}
                                                                        try {
                                                                            const mainCost = (panel && panel.querySelector) ? panel.querySelector('#inlineItemCost') : document.getElementById('inlineItemCost');
                                                                            if (mainCost) {
                                                                                mainCost.readOnly = true;
                                                                                mainCost.setAttribute('readonly','readonly');
                                                                                mainCost.disabled = true;
                                                                                mainCost.setAttribute('disabled','disabled');
                                                                                try { mainCost.classList.add('composite-cost-disabled'); } catch(e) {}
                                                                                try { mainCost.style.cursor = 'text'; mainCost.style.background = '#151515'; } catch(e) {}
                                                                            }
                                                                        } catch(e) {}
                                                                    } catch(e) {}
                                                        } catch(e) {}
                                                    }
                                                } catch(e) { console.warn('composite layout apply failed', e); }
                                            }
                                        } catch(e) {}

                                        // Variants: clear existing and recreate from API product. Use existing addVariantRow() helper to ensure wiring.
                                        try {
                                            const variantsBody = document.getElementById('variantsTableBody');
                                            if (variantsBody) {
                                                console.log('Prefill: variantsBody found, variants count=', (p.variants && p.variants.length) || 0);
                                                // show variants section only when API reports variants
                                                if (p.variants && Array.isArray(p.variants) && p.variants.length) {
                                                    // ensure variants UI is visible (force on the panel instance)
                                                    try {
                                                        if (typeof showVariantsSection === 'function') showVariantsSection();
                                                    } catch(e) {}
                                                    // clear any existing rows
                                                    variantsBody.innerHTML = '';
                                                    // Also explicitly ensure the price row is hidden on this panel instance
                                                    try {
                                                        const priceRowLocal = panel.querySelector('#priceRow');
                                                        if (priceRowLocal) priceRowLocal.style.display = 'none';
                                                    } catch (e) {}
                                                    // Make sure the variants section container is visible (defensive)
                                                    try {
                                                        const variantsSectionLocal = panel.querySelector('#variantsSection');
                                                        if (variantsSectionLocal) {
                                                            variantsSectionLocal.style.display = 'block';
                                                            void variantsSectionLocal.offsetHeight; // force reflow
                                                        }
                                                    } catch (e) {}
                                                    // If parent product is tracking stock, move tracking to variants UI
                                                    try {
                                                        const variantsToggle = panel.querySelector('#variantsTrackStockToggle');
                                                        const mainTrackToggle = panel.querySelector('#inlineTrackStockToggle');
                                                        const parentTrackOn = !!p.track_stock && Number(p.track_stock) === 1;
                                                        if (variantsToggle) {
                                                            // Enable variant-level tracking when parent tracks stock
                                                            variantsToggle.checked = !!parentTrackOn;
                                                            // Trigger change so columns update accordingly
                                                            variantsToggle.dispatchEvent(new Event('change'));
                                                        }
                                                        if (mainTrackToggle && parentTrackOn) {
                                                            // Ensure parent toggle is unchecked when using variants mode
                                                            mainTrackToggle.checked = false;
                                                            mainTrackToggle.dispatchEvent(new Event('change'));
                                                        }
                                                    } catch (e) { /* non-critical */ }
                                                    // For each variant, create a row and populate
                                                    p.variants.forEach(function(v, idx) {
                                                        try {
                                                            // add a new row. Try multiple fallbacks in case the helper
                                                            // isn't available in this execution context.
                                                            if (typeof addVariantRow === 'function') {
                                                                console.log('Prefill: calling addVariantRow() for variant idx=', idx);
                                                                addVariantRow();
                                                            } else if (window && typeof window.addVariantRow === 'function') {
                                                                console.log('Prefill: calling window.addVariantRow() for variant idx=', idx);
                                                                window.addVariantRow();
                                                            } else {
                                                                // Try clicking the UI add button if present (re-uses existing wiring)
                                                                const addBtnLocal = (panel && panel.querySelector) ? panel.querySelector('.variants-add-btn') : document.querySelector('.variants-add-btn');
                                                                if (addBtnLocal) {
                                                                    try {
                                                                        console.log('Prefill: triggering .variants-add-btn click for variant idx=', idx);
                                                                        addBtnLocal.click();
                                                                    } catch (e) {
                                                                        console.log('Prefill: .variants-add-btn click failed', e);
                                                                    }
                                                                } else {
                                                                    console.log('Prefill: addVariantRow and add button unavailable — falling back to manual row creation');
                                                                    // Minimal inline fallback: create a row similar to addVariantRow
                                                                    try {
                                                                        const tableBodyLocal = variantsBody;
                                                                        if (tableBodyLocal) {
                                                                            const fallbackRow = document.createElement('tr');
                                                                            fallbackRow.style.borderBottom = '1px solid #444';
                                                                            fallbackRow.innerHTML = `
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
                                                <td class="stock-column" style="padding: 8px; display: none;"></td>
                                                <td class="stock-column" style="padding: 8px; display: none;"></td>
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
                                                                            tableBodyLocal.appendChild(fallbackRow);
                                                                            // wire delete button
                                                                            const dbtn = fallbackRow.querySelector('.delete-variant-btn');
                                                                            if (dbtn) dbtn.addEventListener('click', function() { fallbackRow.remove(); });
                                                                        }
                                                                    } catch (e) { console.warn('Prefill manual row creation failed', e); }
                                                                }
                                                            }
                                                            
                                                            // populate the last inserted row
                                                            const rows = Array.from(variantsBody.querySelectorAll('tr'));
                                                            const r = rows[rows.length - 1];
                                                            if (!r) {
                                                                console.log('Prefill: variant row not found after addVariantRow (idx=' + idx + ')');
                                                                return;
                                                            }
                                                            console.log('Prefill: populate variant row idx=', idx, 'name=', v && v.name);
                                                            // Ensure the variant row carries the source variant id so later edits update instead of inserting
                                                            try {
                                                                var variantIdVal = (v && (v.id || v.variant_id || v.variantId || v.variantID || v.variantId)) || null;
                                                                if (!variantIdVal && v && v.variant_id === 0 && v.id === 0) variantIdVal = null;
                                                                if (variantIdVal) {
                                                                    try { r.setAttribute('data-variant-id', String(variantIdVal)); } catch(e) {}
                                                                }
                                                            } catch(e) { console.warn('set data-variant-id failed', e); }
                                                            try { const avail = r.querySelector('.variant-available'); if (avail) avail.checked = (v.pos_available && Number(v.pos_available) === 1); } catch(e){}
                                                            try { const nameIn = r.querySelector('.variant-name'); if (nameIn) { nameIn.value = v.name || ''; nameIn.setAttribute('data-auto-filled','1'); } } catch(e){}
                                                            try { const priceIn = r.querySelector('.variant-price'); if (priceIn) { if (v.price !== null && v.price !== '' && !isNaN(v.price)) priceIn.value = '₱' + Number(v.price).toFixed(2); else if (String(v.price).toLowerCase() === 'variable') priceIn.value = ''; else priceIn.value = (v.price || ''); priceIn.setAttribute('data-auto-filled','1'); } } catch(e){}
                                                            try { const costIn = r.querySelector('.variant-cost'); if (costIn) { if (v.cost !== null && v.cost !== '' && !isNaN(v.cost)) costIn.value = '₱' + Number(v.cost).toFixed(2); else costIn.value = (v.cost || ''); costIn.setAttribute('data-auto-filled','1'); } } catch(e){}
                                                            try { const skuIn = r.querySelector('.variant-sku'); if (skuIn) { skuIn.value = v.sku || ''; skuIn.setAttribute('data-auto-filled','1'); } } catch(e){}
                                                            try { const barcodeIn = r.querySelector('.variant-barcode'); if (barcodeIn) { barcodeIn.value = v.barcode || ''; barcodeIn.setAttribute('data-auto-filled','1'); } } catch(e){}
                                                            // stock fields if present
                                                            try {
                                                                const stockIn = r.querySelector('.variant-stock');
                                                                const lowIn = r.querySelector('.variant-low-stock');
                                                                function splitNumericAndUnit(raw) {
                                                                    if (raw === undefined || raw === null) return { value: '', unit: '- -' };
                                                                    const s = String(raw).trim();
                                                                    if (s === '') return { value: '', unit: '- -' };
                                                                    const m = s.match(/^\s*([+-]?\d+(?:\.\d+)?)(?:\s*(.+))?$/);
                                                                    if (m) return { value: m[1], unit: (m[2] || '- -').trim() };
                                                                    return { value: '', unit: s };
                                                                }
                                                                if (stockIn) {
                                                                    const parsed = splitNumericAndUnit(v.in_stock);
                                                                    stockIn.value = parsed.value;
                                                                    try {
                                                                        const u = stockIn.parentElement && stockIn.parentElement.querySelector('.unit-value');
                                                                        if (u) {
                                                                            u.textContent = parsed.unit || '- -';
                                                                            try { const parentSelV = u.parentElement; if (parentSelV && parsed.unit && parsed.unit !== '- -') parentSelV.classList.add('show'); } catch(e) {}
                                                                        }
                                                                    } catch(e){}
                                                                }
                                                                if (lowIn) {
                                                                    const parsedL = splitNumericAndUnit(v.low_stock);
                                                                    lowIn.value = parsedL.value;
                                                                    try {
                                                                        const u2 = lowIn.parentElement && lowIn.parentElement.querySelector('.unit-value');
                                                                        if (u2) {
                                                                            u2.textContent = parsedL.unit || '- -';
                                                                            try { const parentSelV2 = u2.parentElement; if (parentSelV2 && parsedL.unit && parsedL.unit !== '- -') parentSelV2.classList.add('show'); } catch(e) {}
                                                                        }
                                                                    } catch(e){}
                                                                }
                                                            } catch(e){}
                                                        } catch(err) { console.warn('populate variant row error', err); }
                                                        // Log how many rows exist after adding
                                                        try { console.log('Prefill: variantsTableBody now has', variantsBody.querySelectorAll('tr').length, 'rows'); } catch(e){}
                                                    });
                                                    // ensure variant stock columns reflect tracking state
                                                    try { if (typeof toggleVariantsStockColumns === 'function') toggleVariantsStockColumns(); } catch(e){}
                                                    // Attach unit selectors for any newly created variant stock/low-stock inputs
                                                    try { if (typeof setupUnitSelector === 'function') setupUnitSelector(); } catch(e){}
                                                    // Additional pass: some rows may have been created before stock inputs
                                                    // existed (first-row created by addVariantRow when tracking was off).
                                                    // Populate stock inputs and unit suffixes for any rows that
                                                    // missed initial population (use p.variants data stored above).
                                                    try {
                                                        const allRows = Array.from(variantsBody.querySelectorAll('tr'));
                                                        allRows.forEach(function(r, ridx) {
                                                            try {
                                                                const vdata = (p.variants && p.variants[ridx]) ? p.variants[ridx] : null;
                                                                if (!vdata) return;
                                                                // helper same as above
                                                                function splitNumericAndUnit(raw) {
                                                                    if (raw === undefined || raw === null) return { value: '', unit: '- -' };
                                                                    const s = String(raw).trim();
                                                                    if (s === '') return { value: '', unit: '- -' };
                                                                    const m = s.match(/^\s*([+-]?\d+(?:\.\d+)?)(?:\s*(.+))?$/);
                                                                    if (m) return { value: m[1], unit: (m[2] || '- -').trim() };
                                                                    return { value: '', unit: s };
                                                                }
                                                                const stockIn = r.querySelector('.variant-stock');
                                                                const lowIn = r.querySelector('.variant-low-stock');
                                                                const parsed = splitNumericAndUnit(vdata.in_stock);
                                                                const parsedL = splitNumericAndUnit(vdata.low_stock);
                                                                if (stockIn) {
                                                                    // only overwrite if empty to preserve any manual changes
                                                                    if (!stockIn.value || stockIn.value.trim() === '') stockIn.value = parsed.value;
                                                                    try {
                                                                        const u = stockIn.parentElement && stockIn.parentElement.querySelector('.unit-value');
                                                                        if (u) u.textContent = parsed.unit || '- -';
                                                                        try { const parentSelV = u && u.parentElement; if (parentSelV && parsed.unit && parsed.unit !== '- -') parentSelV.classList.add('show'); } catch(e) {}
                                                                    } catch(e){}
                                                                }
                                                                if (lowIn) {
                                                                    if (!lowIn.value || lowIn.value.trim() === '') lowIn.value = parsedL.value;
                                                                    try {
                                                                        const u2 = lowIn.parentElement && lowIn.parentElement.querySelector('.unit-value');
                                                                        if (u2) u2.textContent = parsedL.unit || '- -';
                                                                        try { const parentSelV2 = u2 && u2.parentElement; if (parentSelV2 && parsedL.unit && parsedL.unit !== '- -') parentSelV2.classList.add('show'); } catch(e) {}
                                                                    } catch(e){}
                                                                }
                                                            } catch(e) { /* per-row non-fatal */ }
                                                        });
                                                    } catch(e) { /* best-effort */ }
                                                    // Final enforcement after DOM settled
                                                    try {
                                                        setTimeout(function() {
                                                            try {
                                                                const priceRowLocal = panel.querySelector('#priceRow');
                                                                if (priceRowLocal) priceRowLocal.style.display = 'none';
                                                            } catch(e){}
                                                            try {
                                                                const variantsSectionLocal = panel.querySelector('#variantsSection');
                                                                if (variantsSectionLocal) variantsSectionLocal.style.display = 'block';
                                                            } catch(e){}
                                                            console.debug('Prefill: variants rows now =', variantsBody.querySelectorAll('tr').length);
                                                        }, 0);
                                                    } catch(e){}
                                                    // Hide name-autocomplete when in variants mode; keep Add Variant button visible
                                                    try {
                                                        const createSearchEl = document.getElementById('createItemSearch') || panel.querySelector('#createItemSearch');
                                                        if (createSearchEl) createSearchEl.style.display = 'none';
                                                    } catch(e){}
                                                    try {
                                                        const addVariantBtnEl = (panel && panel.querySelector) ? panel.querySelector('.variants-add-btn') : document.querySelector('.variants-add-btn');
                                                        if (addVariantBtnEl) addVariantBtnEl.style.display = '';
                                                    } catch(e){}
                                                } else {
                                                    // No variants: ensure variants section hidden and reset price/cost to product-level
                                                    try { hideVariantsSection(); } catch(e) {}
                                                }
                                            }
                                        } catch(e) { console.warn('variants populate failed', e); }

                                    } catch(err) { console.warn('prefill processing error', err); }
                                })
                                .catch(err => { console.warn('get_product fetch failed', err); });
                        }
                    } catch (e) { console.warn('prefill add items failed', e); }
                    // If opened from a row click, adjust Add Items panel to act like an Edit flow:
                    // - hide the inline/back button inside the panel
                    // - change the header to 'Edit Item'
                    // - change the main action button text to 'Save'
                    try {
                        const addItemsPanel = document.getElementById('addItemsTabPanel');
                        if (addItemsPanel) {
                            // mark that we opened it as an edit from a row
                            addItemsPanel.setAttribute('data-row-edit', '1');
                            // hide the back button if present
                            try { const backBtn = addItemsPanel.querySelector('#backInlineAddItems'); if (backBtn) backBtn.style.display = 'none'; } catch (e) {}
                            // update header text
                            try { const header = addItemsPanel.querySelector('.modal-title'); if (header) header.textContent = 'Edit Item'; } catch (e) {}

                            // update primary action button(s)
                            try {
                                // Try several selectors to find the submit button consistently
                                const actionBtn = addItemsPanel.querySelector('button[type="submit"].btn.btn-primary, button[type="submit"].btn-primary, button.btn-primary[type="submit"], #inlineAddItemsForm button[type="submit"]');
                                if (actionBtn) actionBtn.textContent = 'Save';
                            } catch (e) {}

                            // Make the inline cost input readonly during Edit flow and mark inlineCostFixed
                            // This should only happen when editing a composite item
                            try {
                                var isCompositeEdit = false;
                                try { isCompositeEdit = !!(addItemsPanel && addItemsPanel.getAttribute && addItemsPanel.getAttribute('data-is-composite') === '1'); } catch(e) { isCompositeEdit = false; }
                                if (isCompositeEdit) {
                                    const costElLocal = addItemsPanel.querySelector('#inlineItemCost') || document.getElementById('inlineItemCost');
                                    if (costElLocal) {
                                        try { costElLocal.readOnly = true; costElLocal.setAttribute('readonly','readonly'); } catch(e) {}
                                    }
                                    try { window._inlineCostFixed = true; } catch(e) {}
                                }
                            } catch(e) {}
                            // Patch: Cancel button closes modal directly
                            try {
                                const cancelBtn = addItemsPanel.querySelector('.cancel-secondary');
                                if (cancelBtn) {
                                    cancelBtn.onclick = function(e) {
                                        e.preventDefault();
                                        // Restore snapshot if present, then hide the modal (same as clicking outside or close)
                                        try {
                                            const panelEl = document.getElementById('addItemsTabPanel');
                                            if (panelEl && panelEl._snapshot) {
                                                try { restoreModalState(panelEl, panelEl._snapshot); } catch (er) { console.warn('restore on cancel failed', er); }
                                                try { delete panelEl._snapshot; } catch (er) {}
                                            }
                                        } catch (er) { console.warn('cancel restore failed', er); }
                                        const modal = document.getElementById('scannerModal') || window.scannerModal;
                                        if (modal) {
                                            modal.style.display = 'none';
                                            modal.classList.remove('show');
                                        }
                                    };
                                }
                            } catch (e) {}

                            // Setup a MutationObserver to restore the UI when the modal is closed
                            try {
                                const modalEl = document.getElementById('scannerModal') || window.scannerModal;
                                if (modalEl && typeof MutationObserver !== 'undefined') {
                                    const mo = new MutationObserver(function(muts) {
                                        try {
                                            // If modal is hidden or class 'show' removed, restore panel
                                            if (modalEl.style.display === 'none' || !modalEl.classList.contains('show')) {
                                                // restore snapshot if present
                                                let hadSnapshot = false;
                                                try {
                                                    if (addItemsPanel && addItemsPanel._snapshot) {
                                                        hadSnapshot = true;
                                                        try { restoreModalState(addItemsPanel, addItemsPanel._snapshot); } catch (er) { console.warn('observer restore failed', er); }
                                                        try { delete addItemsPanel._snapshot; } catch (er) {}
                                                    }
                                                } catch (e) { console.warn('observer restore err', e); }
                                                try { const bb = addItemsPanel.querySelector('#backInlineAddItems'); if (bb) bb.style.display = ''; } catch (e) {}
                                                // Only set default header/action when we did NOT restore from a snapshot
                                                if (!hadSnapshot) {
                                                    try { const h = addItemsPanel.querySelector('.modal-title'); if (h) h.textContent = 'Add new item'; } catch (e) {}
                                                    try { const a = addItemsPanel.querySelector('button[type="submit"].btn.btn-primary, button[type="submit"].btn-primary, button.btn-primary[type="submit"], #inlineAddItemsForm button[type="submit"]'); if (a) a.textContent = 'Add Item'; } catch (e) {}
                                                }
                                                try { addItemsPanel.removeAttribute('data-row-edit'); } catch (e) {}
                                                // If this panel had been marked composite, clear that marker and re-enable Cost input
                                                try {
                                                    try { addItemsPanel.removeAttribute('data-is-composite'); } catch(e) {}
                                                    try {
                                                        const mainCost = (addItemsPanel && addItemsPanel.querySelector) ? addItemsPanel.querySelector('#inlineItemCost') : document.getElementById('inlineItemCost');
                                                        if (mainCost) {
                                                            try { mainCost.readOnly = false; mainCost.removeAttribute('readonly'); } catch(e) {}
                                                            try { mainCost.disabled = false; mainCost.removeAttribute('disabled'); } catch(e) {}
                                                            try { mainCost.classList.remove('composite-cost-disabled'); } catch(e) {}
                                                            try { mainCost.style.cursor = ''; mainCost.style.background = ''; } catch(e) {}
                                                        }
                                                    } catch(e) {}
                                                } catch(e) {}
                                                try { mo.disconnect(); } catch (e) {}
                                            }
                                        } catch (e) { /* ignore */ }
                                    });
                                    mo.observe(modalEl, { attributes: true, attributeFilter: ['style', 'class'] });
                                }
                            } catch (e) { /* best-effort restore only */ }
                        }
                    } catch (e) { /* ignore UI tweak failures */ }
                    // Focus first sensible input inside modal (best effort)
                    setTimeout(function() {
                        try {
                            const el = modal.querySelector('input, button, textarea, select');
                            if (el && typeof el.focus === 'function') el.focus();
                        } catch (e) {}
                    }, 60);
                }
            } catch (err) { console.warn('row click handler error', err); }
        }, false);

        // Add class to existing rows so they show hover cursor
        Array.from(tbody.querySelectorAll('tr')).forEach(r => r.classList.add('inventory-row-clickable'));

        // Watch for new rows added dynamically and mark them clickable as well
        const mo = new MutationObserver(function(muts) {
            muts.forEach(function(m) {
                Array.from(m.addedNodes || []).forEach(function(node) {
                    if (node && node.nodeType === 1 && node.tagName === 'TR') node.classList.add('inventory-row-clickable');
                    // also handle rows wrapped inside fragments
                    try {
                        if (node && node.querySelectorAll) {
                            Array.from(node.querySelectorAll('tr')).forEach(t => t.classList.add('inventory-row-clickable'));
                        }
                    } catch (e) {}
                });
            });
        });
        mo.observe(tbody, { childList: true, subtree: true });
    } catch (e) { console.warn('init row-clickable failed', e); }
});