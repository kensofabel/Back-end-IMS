document.addEventListener('DOMContentLoaded', function () {
    const productSearch = document.getElementById('product-search');
    const productGrid = document.getElementById('product-grid');
    const categoryToggle = document.getElementById('category-toggle');
    const categoryList = document.getElementById('category-list');
    const cartItems = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const amountReceived = document.getElementById('amount-received');
    const changeEl = document.getElementById('change');
    const completeSaleBtn = document.getElementById('complete-sale-btn');
    const openOrdersBtn = document.getElementById('open-orders-btn');
    const paymentBtns = document.querySelectorAll('.payment-btn');
    const taxRateLabel = document.getElementById('tax-rate-label');

    // Cart mode selector (Dine in / Take out / Delivery)
    const cartModeBtn = document.getElementById('cart-mode-btn');
    const cartModeList = document.getElementById('cart-mode-list');
    const cartModeChevronEl = document.getElementById('cart-mode-chevron');
    const CART_MODE_KEY = 'pos_cart_mode';

    function setCartMode(mode, persist = true) {
        if (!cartModeBtn) return;
        const label = cartModeBtn.querySelector('.cart-mode-label-text');
        if (label) {
            if (mode === 'takeout') label.textContent = 'Take out';
            else if (mode === 'delivery') label.textContent = 'Delivery';
            else label.textContent = 'Dine in';
        }
        if (persist) {
            try { localStorage.setItem(CART_MODE_KEY, mode); } catch (e) { /* ignore */ }
        }
        // close dropdown UI
        if (cartModeList) {
            cartModeList.setAttribute('aria-hidden', 'true');
            cartModeBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // Initialize cart mode from storage and mark active list item
    try {
        const savedMode = localStorage.getItem(CART_MODE_KEY) || 'dinein';
        setCartMode(savedMode, false);
        if (cartModeList) {
            const match = cartModeList.querySelector(`li[data-mode="${savedMode}"]`);
            if (match) {
                cartModeList.querySelectorAll('li').forEach(x => x.classList.remove('active'));
                match.classList.add('active');
            }
        }
    } catch (e) {
        setCartMode('dinein', false);
    }

    if (cartModeBtn && cartModeList) {
        // Move the active cart-mode item to the top when opening the list
        function reorderCartModeList() {
            if (!cartModeList) return;
            // prefer explicit .active; fallback to stored mode
            const saved = (function(){ try { return localStorage.getItem(CART_MODE_KEY); } catch(e){ return null; } })() || 'dinein';
            const active = cartModeList.querySelector('li.active') || cartModeList.querySelector(`li[data-mode="${saved}"]`);
            if (active && cartModeList.firstElementChild !== active) {
                try { cartModeList.insertBefore(active, cartModeList.firstElementChild); } catch (err) { console.warn('Could not reorder cart mode list', err); }
            }
        }

        cartModeBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const hidden = cartModeList.getAttribute('aria-hidden') === 'true';
            // if opening, bring active item to top so it's visible first
            if (hidden) reorderCartModeList();
            cartModeList.setAttribute('aria-hidden', String(!hidden));
            cartModeBtn.setAttribute('aria-expanded', String(hidden));
            if (hidden) {
                // focus first item for keyboard
                const first = cartModeList.querySelector('li');
                if (first) first.focus();
            }
        });

        // allow the chevron at the far right to toggle the same dropdown
        if (cartModeChevronEl) {
            cartModeChevronEl.addEventListener('click', (ev) => {
                ev.stopPropagation();
                // reuse button toggle logic
                cartModeBtn.click();
            });
            cartModeChevronEl.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    cartModeBtn.click();
                }
            });
        }

        cartModeList.addEventListener('click', (ev) => {
            const li = ev.target.closest('li');
            if (!li) return;
            const mode = (li.dataset.mode || 'dinein');
            setCartMode(mode, true);
            // highlight
            cartModeList.querySelectorAll('li').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
        });

        // close when clicking outside (include chevron element and the whole cart-mode row)
        const cartModeRow = document.querySelector('.cart-mode-label .total-row');
        document.addEventListener('click', (e) => {
            if (!cartModeBtn.contains(e.target) && !cartModeList.contains(e.target) && !(cartModeChevronEl && cartModeChevronEl.contains(e.target)) && !(cartModeRow && cartModeRow.contains(e.target))) {
                cartModeList.setAttribute('aria-hidden', 'true');
                cartModeBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Make the entire row clickable: toggle dropdown when clicking on the row (but ignore clicks inside the list)
        try {
            if (cartModeRow) {
                cartModeRow.addEventListener('click', (ev) => {
                    // If user clicked on a list item inside the dropdown, ignore here
                    const insideList = ev.target.closest && ev.target.closest('#cart-mode-list');
                    if (insideList) return;
                    ev.stopPropagation();
                    // Toggle visibility manually to avoid race with document click
                    const hidden = cartModeList.getAttribute('aria-hidden') === 'true';
                    // if opening, ensure active item is moved to top first
                    if (hidden) reorderCartModeList();
                    cartModeList.setAttribute('aria-hidden', String(!hidden));
                    cartModeBtn.setAttribute('aria-expanded', String(!hidden));
                    if (hidden) {
                        // opened: focus first item
                        const first = cartModeList.querySelector('li');
                        if (first) first.focus();
                    }
                });
                // keyboard
                cartModeRow.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        ev.stopPropagation();
                        const hidden = cartModeList.getAttribute('aria-hidden') === 'true';
                        cartModeList.setAttribute('aria-hidden', String(!hidden));
                        cartModeBtn.setAttribute('aria-expanded', String(!hidden));
                        if (!hidden) {
                            const first = cartModeList.querySelector('li');
                            if (first) first.focus();
                        }
                    }
                });
            }
        } catch (e) { /* ignore row wiring errors */ }

        // keyboard: Escape to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (cartModeList.getAttribute('aria-hidden') === 'false') {
                    cartModeList.setAttribute('aria-hidden', 'true');
                    cartModeBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // --- Sale More (three-dot) menu actions ---
    (function wireSaleMoreMenu() {
        const saleMoreBtn = document.getElementById('sale-more-btn');
        const saleMoreList = document.getElementById('sale-more-list');
        if (!saleMoreBtn || !saleMoreList) return;

        // toggle menu on button click
        saleMoreBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const hidden = saleMoreList.getAttribute('aria-hidden') === 'true';
            saleMoreList.setAttribute('aria-hidden', String(!hidden));
            if (!hidden) {
                // focusing first actionable item
                const first = saleMoreList.querySelector('li');
                if (first) first.focus();
            }
        });

        // close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!saleMoreBtn.contains(e.target) && !saleMoreList.contains(e.target)) {
                saleMoreList.setAttribute('aria-hidden', 'true');
            }
        });

        // Handle menu item actions using data-action attribute
        saleMoreList.addEventListener('click', (ev) => {
            const li = ev.target.closest('li');
            if (!li) return;
            // ignore clicks on disabled menu items
            if (li.classList && li.classList.contains('disabled')) return;
            const action = (li.dataset.action || '').toLowerCase();
            saleMoreList.setAttribute('aria-hidden', 'true');
            switch (action) {
                case 'clear':
                    // Clear the current sale immediately without confirmation
                    clearCart();
                    break;
                case 'sync':
                    // Try to call a sync endpoint if available, otherwise show a temporary notice
                    (function doSync() {
                        // provide immediate feedback
                        try { alert('Starting sync...'); } catch(e) { /* ignore */ }
                        // attempt to call a sync API; fallback to a resolved promise
                        fetch('sync.php', { method: 'POST', credentials: 'same-origin' })
                            .then(res => res.ok ? res.json() : Promise.reject(new Error('Sync failed')))
                            .then(json => {
                                try { alert('Sync completed'); } catch(e) {}
                            })
                            .catch(() => {
                                try { alert('Sync cannot be completed (no endpoint).'); } catch(e) {}
                            });
                    })();
                    break;
                case 'edit':
                    // For now, prompt for a sale note or identifier; future: open edit modal
                    (function doEdit() {
                        const note = window.prompt('Enter sale note or reference (this is a placeholder):', '');
                        if (note !== null) {
                            try { alert('Sale note saved (placeholder): ' + note); } catch(e) {}
                        }
                    })();
                    break;
                case 'split':
                    (function doSplit() {
                        if (!cart || cart.length === 0) {
                            try { alert('Cart is empty. Nothing to split.'); } catch(e) {}
                            return;
                        }
                        // Save the current cart first (like 'merge') so there's a saved
                        // snapshot before the user manipulates the split modal.
                        function doSaveForSplit(refVal) {
                            const subtotal = cart.reduce((s, it) => s + (it.unit_price * it.quantity), 0);
                            const tax = subtotal * taxRate;
                            const total = subtotal + tax;
                            const payload = {
                                ref: refVal ? String(refVal).trim() : null,
                                items: cart,
                                subtotal: subtotal,
                                tax: tax,
                                total: total,
                                payment_method: selectedPaymentMethod
                            };
                            try {
                                const cm = (function(){ try { return localStorage.getItem(CART_MODE_KEY); } catch(e){ return null; } })() || 'dinein';
                                payload.cart_mode = cm;
                            } catch (e) { payload.cart_mode = 'dinein'; }
                            if (typeof currentOrderId !== 'undefined' && currentOrderId) payload.order_id = currentOrderId;

                            fetch('save_order_api.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                                credentials: 'same-origin'
                            })
                            .then(res => res.ok ? res.json() : Promise.reject(new Error('Network error')))
                            .then(json => {
                                if (json && json.success) {
                                    showToast('Order saved. ID: ' + (json.order_id || 'n/a'), 'success');
                                    // Build savedMeta from response when possible
                                    const savedMeta = {
                                        id: (json.order_id || (json.order && (json.order.id || json.order.order_id)) || null),
                                        ref: payload.ref || (json.order && (json.order.reference || json.order.ref)) || null,
                                        created_at: (json.order && (json.order.created_at || json.order.created)) || json.created_at || new Date().toISOString(),
                                        updated_at: (json.order && (json.order.updated_at || json.order.updated)) || json.updated_at || null
                                    };

                                    // If server provided an order object, prefer that; otherwise construct a best-effort order
                                    const serverOrder = json.order || null;
                                    const orderToLoad = serverOrder ? serverOrder : ({ id: savedMeta.id, reference: savedMeta.ref, items: Array.isArray(payload.items) ? payload.items.map(it=>Object.assign({}, it)) : [], total_amount: payload.total, created_at: savedMeta.created_at, updated_at: savedMeta.updated_at });

                                    // Load the saved order into the current cart so split modal operates on the saved snapshot
                                    try {
                                        if (orderToLoad && Array.isArray(orderToLoad.items)) {
                                            cart = orderToLoad.items.map(it => ({ product_id: it.product_id || null, name: it.name || '', unit_price: parseFloat(it.unit_price) || parseFloat(it.unitPrice) || parseFloat(it.price) || 0, quantity: parseInt(it.quantity) || 1, variant: it.variant || null }));
                                            updateCartDisplay();

                                            // Autofill the amount-received with the order total (programmatic)
                                            try {
                                                let savedTotal = parseFloat(orderToLoad.total_amount || orderToLoad.total || orderToLoad.totalAmount || payload.total || 0);
                                                if (isNaN(savedTotal)) savedTotal = 0;
                                                programmaticAmountUpdate = true;
                                                amountReceived.value = Number(savedTotal).toFixed(2);
                                                amountUserEdited = false;
                                                lastQuickReplaced = false;
                                                updateChange();
                                                updateAmountClearVisibility();
                                            } catch (e) { /* ignore autofill errors */ }

                                            // Update title and current order tracking
                                            try {
                                                const titleEl = document.getElementById('current-sale-title');
                                                const refText = orderToLoad.reference || orderToLoad.ref || ('Order #' + (orderToLoad.id || savedMeta.id || ''));
                                                if (titleEl) titleEl.textContent = refText;
                                                currentOrderId = orderToLoad.id || savedMeta.id || null;
                                                currentOrderRef = orderToLoad.reference || orderToLoad.ref || savedMeta.ref || null;
                                                enableTitleEditing();
                                            } catch (e) {}

                                            // restore cart mode and payment method if present on serverOrder
                                            try {
                                                if (serverOrder && serverOrder.cart_mode) {
                                                    setCartMode(serverOrder.cart_mode, false);
                                                    if (cartModeList) {
                                                        try { cartModeList.querySelectorAll('li').forEach(x => x.classList.remove('active')); const m = cartModeList.querySelector(`li[data-mode="${serverOrder.cart_mode}"]`); if (m) m.classList.add('active'); } catch(e) {}
                                                    }
                                                }
                                            } catch (e) {}
                                            try {
                                                if (serverOrder && serverOrder.payment_method) {
                                                    selectedPaymentMethod = serverOrder.payment_method;
                                                    try { paymentBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-method') === selectedPaymentMethod)); } catch(e) {}
                                                }
                                            } catch (e) {}
                                        }
                                    } catch (e) { console.error('Failed to load saved order into cart', e); }

                                    // Open split modal with saved metadata
                                    try { createSplitModal(cart, savedMeta); } catch (e) { console.error('Failed to open split modal', e); }
                                } else {
                                    showToast('Could not save order: ' + (json && json.error ? json.error : 'Unknown'), 'error');
                                }
                            })
                            .catch(err => {
                                // Network error: save locally but keep cart intact, then open split modal
                                try {
                                    const key = 'pos_open_orders';
                                    let open = [];
                                    try { open = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { open = []; }
                                    const created = new Date().toISOString();
                                    const localId = Date.now();
                                    open.push({ id: localId, ref: refVal || null, items: cart.slice(), subtotal, tax, total, created_at: created });
                                    localStorage.setItem(key, JSON.stringify(open));
                                    showToast('Order saved locally (server unreachable).', 'warning');
                                    // Load local-saved order into cart and open split modal
                                    try {
                                        currentOrderId = localId;
                                        currentOrderRef = refVal || null;
                                        // cart already matches the saved snapshot (we used cart.slice()) but ensure UI is consistent
                                        updateCartDisplay();
                                        try {
                                            programmaticAmountUpdate = true;
                                            amountReceived.value = Number(total).toFixed(2);
                                            amountUserEdited = false;
                                            lastQuickReplaced = false;
                                            updateChange();
                                            updateAmountClearVisibility();
                                        } catch (e) {}
                                    } catch (e2) { console.error('Failed to load local saved order into cart', e2); }
                                    try { createSplitModal(cart, { id: localId, ref: refVal || null, created_at: created }); } catch (e) { console.error('Failed to open split modal', e); }
                                } catch (e2) {
                                    showToast('Failed to save order: ' + e2.message, 'error');
                                }
                            });
                        }

                        // If this cart was loaded from an existing saved order, save directly (no ref prompt).
                        if (typeof currentOrderId !== 'undefined' && currentOrderId) {
                            doSaveForSplit(currentOrderRef || null);
                        } else {
                            showSaveOrderModal((refVal) => doSaveForSplit(refVal), function(){});
                        }
                    })();
                    break;
                case 'move':
                    (function doMove() {
                        const dest = window.prompt('Move sale to (e.g. other register/table) — enter identifier:', '');
                        if (dest !== null && String(dest).trim() !== '') {
                            try { alert('Moved sale to: ' + dest + ' (placeholder)'); } catch(e) {}
                        }
                    })();
                    break;
                case 'merge':
                    // Save current cart as an order before running merge (user requested behavior)
                    (function doSaveForMerge() {
                        if (!cart || cart.length === 0) {
                            try { alert('Cart is empty. Nothing to save.'); } catch(e) {}
                            return;
                        }

                        function doSave(refVal) {
                            const subtotal = cart.reduce((s, it) => s + (it.unit_price * it.quantity), 0);
                            const tax = subtotal * taxRate;
                            const total = subtotal + tax;
                            const payload = {
                                ref: refVal ? String(refVal).trim() : null,
                                items: cart,
                                subtotal: subtotal,
                                tax: tax,
                                total: total,
                                payment_method: selectedPaymentMethod
                            };
                            try {
                                const cm = (function(){ try { return localStorage.getItem(CART_MODE_KEY); } catch(e){ return null; } })() || 'dinein';
                                payload.cart_mode = cm;
                            } catch (e) { payload.cart_mode = 'dinein'; }
                            if (typeof currentOrderId !== 'undefined' && currentOrderId) payload.order_id = currentOrderId;

                            fetch('save_order_api.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                                credentials: 'same-origin'
                            })
                            .then(res => res.ok ? res.json() : Promise.reject(new Error('Network error')))
                                            .then(json => {
                                                if (json && json.success) {
                                                    showToast('Order saved. ID: ' + (json.order_id || 'n/a'), 'success');

                                                    // Build savedMeta and orderToLoad
                                                    const savedMeta = {
                                                        id: (json.order_id || (json.order && (json.order.id || json.order.order_id)) || null),
                                                        ref: payload.ref || (json.order && (json.order.reference || json.order.ref)) || null,
                                                        created_at: (json.order && (json.order.created_at || json.order.created)) || json.created_at || new Date().toISOString(),
                                                        updated_at: (json.order && (json.order.updated_at || json.order.updated)) || json.updated_at || null
                                                    };
                                                    const serverOrder = json.order || null;
                                                    const orderToLoad = serverOrder ? serverOrder : ({ id: savedMeta.id, reference: savedMeta.ref, items: Array.isArray(payload.items) ? payload.items.map(it=>Object.assign({}, it)) : [], total_amount: payload.total, created_at: savedMeta.created_at, updated_at: savedMeta.updated_at });

                                                    // Load saved order into cart (so merge works on the saved snapshot)
                                                    try {
                                                        if (orderToLoad && Array.isArray(orderToLoad.items)) {
                                                            cart = orderToLoad.items.map(it => ({ product_id: it.product_id || null, name: it.name || '', unit_price: parseFloat(it.unit_price) || parseFloat(it.unitPrice) || parseFloat(it.price) || 0, quantity: parseInt(it.quantity) || 1, variant: it.variant || null }));
                                                            updateCartDisplay();

                                                            // Autofill the amount-received with the order total (programmatic)
                                                            try {
                                                                let savedTotal = parseFloat(orderToLoad.total_amount || orderToLoad.total || orderToLoad.totalAmount || payload.total || 0);
                                                                if (isNaN(savedTotal)) savedTotal = 0;
                                                                programmaticAmountUpdate = true;
                                                                amountReceived.value = Number(savedTotal).toFixed(2);
                                                                amountUserEdited = false;
                                                                lastQuickReplaced = false;
                                                                updateChange();
                                                                updateAmountClearVisibility();
                                                            } catch (e) { /* ignore autofill errors */ }

                                                            // Update title and current order tracking
                                                            try {
                                                                const titleEl = document.getElementById('current-sale-title');
                                                                const refText = orderToLoad.reference || orderToLoad.ref || ('Order #' + (orderToLoad.id || savedMeta.id || ''));
                                                                if (titleEl) titleEl.textContent = refText;
                                                                currentOrderId = orderToLoad.id || savedMeta.id || null;
                                                                currentOrderRef = orderToLoad.reference || orderToLoad.ref || savedMeta.ref || null;
                                                                enableTitleEditing();
                                                            } catch (e) {}

                                                            // restore cart mode and payment method if present on serverOrder
                                                            try {
                                                                if (serverOrder && serverOrder.cart_mode) {
                                                                    setCartMode(serverOrder.cart_mode, false);
                                                                    if (cartModeList) {
                                                                        try { cartModeList.querySelectorAll('li').forEach(x => x.classList.remove('active')); const m = cartModeList.querySelector(`li[data-mode="${serverOrder.cart_mode}"]`); if (m) m.classList.add('active'); } catch(e) {}
                                                                    }
                                                                }
                                                            } catch (e) {}
                                                            try {
                                                                if (serverOrder && serverOrder.payment_method) {
                                                                    selectedPaymentMethod = serverOrder.payment_method;
                                                                    try { paymentBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-method') === selectedPaymentMethod)); } catch(e) {}
                                                                }
                                                            } catch (e) {}
                                                        }
                                                    } catch (e) { console.error('Failed to load saved order into cart', e); }

                                                    // Fetch updated saved orders and open the modal in merge mode with the new order preselected
                                                    try {
                                                        fetch('open_orders_api.php', { credentials: 'same-origin' })
                                                            .then(r => r.ok ? r.json() : Promise.reject(new Error('Network error')))
                                                            .then(j => {
                                                                if (j && j.success) {
                                                                    showOpenOrdersModal(j.orders || [], { mergeMode: true, preselect: [String(savedMeta.id || json.order_id || '')] });
                                                                } else {
                                                                    showOpenOrdersModal(j && j.orders ? j.orders : [], { mergeMode: true, preselect: [String(savedMeta.id || json.order_id || '')] });
                                                                }
                                                            })
                                                            .catch(() => {
                                                                try {
                                                                    const key = 'pos_open_orders';
                                                                    const open = JSON.parse(localStorage.getItem(key) || '[]');
                                                                    showOpenOrdersModal(open || [], { mergeMode: true, preselect: [String(savedMeta.id || json.order_id || '')] });
                                                                } catch (e) { /* ignore */ }
                                                            });
                                                    } catch (e) { /* ignore fetch/open errors */ }
                                                } else {
                                                    showToast('Could not save order: ' + (json && json.error ? json.error : 'Unknown'), 'error');
                                                }
                                            })
                            .catch(err => {
                                try {
                                    const key = 'pos_open_orders';
                                    let open = [];
                                    try { open = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { open = []; }
                                    const created = new Date().toISOString();
                                    const localId = Date.now();
                                    open.push({ id: localId, ref: refVal || null, items: cart.slice(), subtotal, tax, total, created_at: created });
                                    localStorage.setItem(key, JSON.stringify(open));
                                    showToast('Order saved locally (server unreachable).', 'warning');
                                    // Load local-saved order into cart and open saved orders modal in merge mode
                                    try {
                                        currentOrderId = localId;
                                        currentOrderRef = refVal || null;
                                        // cart already matches the saved snapshot; ensure UI shows it
                                        updateCartDisplay();
                                        try {
                                            programmaticAmountUpdate = true;
                                            amountReceived.value = Number(total).toFixed(2);
                                            amountUserEdited = false;
                                            lastQuickReplaced = false;
                                            updateChange();
                                            updateAmountClearVisibility();
                                        } catch (e) {}
                                    } catch (e2) { console.error('Failed to load local saved order into cart', e2); }
                                    try {
                                        const key2 = 'pos_open_orders';
                                        const open2 = JSON.parse(localStorage.getItem(key2) || '[]');
                                        showOpenOrdersModal(open2 || [], { mergeMode: true, preselect: [String(localId || '')] });
                                    } catch (e) { /* ignore */ }
                                } catch (e2) {
                                    showToast('Failed to save order: ' + e2.message, 'error');
                                }
                            });
                        }

                        // If this cart was loaded from an existing saved order, save directly (no ref prompt).
                        if (typeof currentOrderId !== 'undefined' && currentOrderId) {
                            doSave(currentOrderRef || null);
                        } else {
                            showSaveOrderModal((refVal) => doSave(refVal), function(){});
                        }
                    })();
                    break;
                default:
                    // unknown action: no-op
                    break;
            }
        });

        // keyboard: close with Escape when open
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (saleMoreList.getAttribute('aria-hidden') === 'false') saleMoreList.setAttribute('aria-hidden', 'true');
            }
        });
    })();

    let cart = [];
    let selectedPaymentMethod = 'cash';
    let currentCategory = 'all';
    let currentOrderId = null;
    let currentOrderRef = null;
    // Defaults; will be overridden by saved settings if available
    let taxRate = 0.12; // 12% VAT (Philippines standard)
    let currency = '₱';
    // track whether the user manually edited the amount-received field
    let amountUserEdited = false;
    // flag used when we update the amount input programmatically so input handlers can ignore it
    let programmaticAmountUpdate = false;
    // flag to track whether a quick-button has already replaced the auto-filled value
    let lastQuickReplaced = false;

    // Load business settings (currency and tax) from Settings page
    function getCurrencySymbol(input) {
        if (!input) return '₱';
        const val = String(input).trim();
        if (val.includes('₱')) return '₱';
        const up = val.toUpperCase();
        switch (up) {
            case 'PHP':
            case 'PHILIPPINE PESO':
            case 'PESO':
                return '₱';
            case 'USD':
            case 'US DOLLAR':
                return '$';
            case 'EUR':
                return '€';
            case 'GBP':
                return '£';
            case 'JPY':
                return '¥';
            default:
                // If starts with a common currency symbol, use that; otherwise default to ₱
                return /^[₱$€£¥]/.test(val) ? val.charAt(0) : '₱';
        }
    }

    function updateTaxRateLabel() {
        if (taxRateLabel) {
            taxRateLabel.textContent = `${(taxRate * 100).toFixed(2).replace(/\.00$/, '')}%`;
        }
    }

    function loadSettings() {
        // Relative to pages/pos/
        return fetch('../settings/get_settings.php', { credentials: 'same-origin', cache: 'no-store' })
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to load settings')))
            .then(json => {
                if (json && json.success && json.data) {
                    const s = json.data;
                    // Currency
                    currency = getCurrencySymbol(s.currency);
                    // Tax rate can be stored as 12 or 0.12; normalize to fraction
                    let tr = parseFloat(s.taxRate);
                    if (!isNaN(tr)) {
                        taxRate = tr > 1 ? tr / 100 : tr;
                        // Accept 0% explicitly; clamp negatives to 0, but do not force default
                        if (taxRate < 0) taxRate = 0;
                    }
                    updateTaxRateLabel();
                } else {
                    updateTaxRateLabel();
                }
            })
            .catch(() => {
                // Keep defaults on failure
                updateTaxRateLabel();
            });
    }

    // Helper: determine if a color string represents a light color.
    // Supports hex (#fff, #ffffff), rgb(...) and common named colors used in the app.
    function isLightColor(col) {
        if (!col) return false;
        let s = String(col).trim().toLowerCase();
        // Named color map fallback
        const nameMap = {
            'yellow': '#ffeb3b',
            'orange': '#ff9800',
            'red': '#f44336',
            'green': '#4caf50',
            'blue': '#2196f3',
            'purple': '#9c27b0',
            'brown': '#795548',
            'gray': '#607d8b',
            'black': '#000000',
            'white': '#ffffff'
        };
        if (nameMap[s]) s = nameMap[s];

        // rgb(...) or rgba(...)
        if (s.indexOf('rgb') === 0) {
            const nums = s.replace(/rgba?\(|\)| /g, '').split(',').map(n => parseFloat(n));
            if (nums.length >= 3) {
                const r = nums[0], g = nums[1], b = nums[2];
                return (0.2126 * (r/255) + 0.7152 * (g/255) + 0.0722 * (b/255)) > 0.65;
            }
            return false;
        }

        // Hex formats
        if (s.charAt(0) === '#') {
            let hex = s.slice(1);
            if (hex.length === 3) {
                hex = hex.split('').map(c => c + c).join('');
            }
            if (hex.length !== 6) return false;
            const r = parseInt(hex.slice(0,2), 16);
            const g = parseInt(hex.slice(2,4), 16);
            const b = parseInt(hex.slice(4,6), 16);
            const lum = 0.2126 * (r/255) + 0.7152 * (g/255) + 0.0722 * (b/255);
            return lum > 0.65;
        }

        return false;
    }

    // --- Favourites persisted in localStorage (client-side) ---
    const FAV_KEY = 'pos_favourites';
    function getFavList() {
        try {
            const raw = localStorage.getItem(FAV_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    }
    function isFavourite(id) {
        const list = getFavList();
        return list.indexOf(String(id)) !== -1;
    }
    function setFavourite(id, on) {
        const list = getFavList();
        const sid = String(id);
        const idx = list.indexOf(sid);
        if (on) {
            if (idx === -1) list.push(sid);
        } else {
            if (idx !== -1) list.splice(idx, 1);
        }
        try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    }

    // Send favourite change to server; returns a Promise that resolves true on success
    function sendFavouriteToServer(productId, on) {
        return fetch('favourites_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ product_id: productId, action: on ? 'add' : 'remove' })
        })
        .then(res => {
            if (!res.ok) return res.text().then(t => Promise.reject(new Error(t || 'Server error')));
            return res.json();
        })
        .then(json => {
            if (json && json.success) return true;
            return Promise.reject(new Error(json && json.error ? json.error : 'Unknown error'));
        });
        // If the view is list-mode when products render (e.g. saved preference),
        // ensure prices are moved into the right place for list view.
        try { adjustPricesForListMode(productGrid && productGrid.classList.contains('list-mode')); } catch (e) { /* ignore */ }
        // Retry once shortly after render to handle any timing/race conditions
        try { setTimeout(() => adjustPricesForListMode(productGrid && productGrid.classList.contains('list-mode')), 100); } catch (e) { /* ignore */ }
    }

    // Fetch and display products
    function fetchProducts(search = '', category = '') {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        // If requesting favourites, use the dedicated favourites endpoint which returns product rows
        let url;
        if (category && category !== 'all') {
            if (String(category).toLowerCase() === 'favourites' || String(category).toLowerCase() === 'favourite') {
                url = 'favourites_api.php';
            } else {
                params.set('category', category);
                url = `api.php?${params.toString()}`;
            }
        } else {
            url = params.toString() ? `api.php?${params.toString()}` : 'api.php';
        }
        console.log('POS fetching products from:', url);
        fetch(url, { credentials: 'same-origin' })
            .then(response => {
                if (!response.ok) {
                    // Try to read error body for debug
                    return response.text().then(text => { throw new Error('HTTP ' + response.status + ' - ' + text); });
                }
                return response.json();
            })
            .then(data => {
                console.log('POS products response:', data);
                // If API returned an error object, show message and fall back to mock
                if (data && typeof data === 'object' && data.error) {
                    productGrid.innerHTML = `
                        <div class="no-products error">
                            <div class="no-products-illustration"><i class="fa fa-exclamation-triangle"></i></div>
                            <h3>Unable to load products</h3>
                            <p>${String(data.error)}</p>
                            <div class="no-products-actions">
                                <a href="../inventory/index.php" class="no-products-btn open-inventory" target="_blank" rel="noopener">Open Inventory</a>
                                <button id="no-products-refresh" class="no-products-btn refresh">Retry</button>
                            </div>
                        </div>
                    `;
                    const refreshBtnErr = document.getElementById('no-products-refresh');
                    if (refreshBtnErr) refreshBtnErr.addEventListener('click', () => fetchProducts(productSearch.value.trim(), currentCategory));
                    return;
                }
                displayProducts(data);
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                // Show friendly message in the UI and allow retry
                productGrid.innerHTML = `
                    <div class="no-products error">
                        <div class="no-products-illustration"><i class="fa fa-wifi"></i></div>
                        <h3>Network or server error</h3>
                        <p>Unable to reach the products API. Check your server or network connection.</p>
                        <div class="no-products-actions">
                            <a href="../inventory/index.php" class="no-products-btn open-inventory" target="_blank" rel="noopener">Open Inventory</a>
                            <button id="no-products-refresh" class="no-products-btn refresh">Retry</button>
                        </div>
                    </div>
                `;
                const retryBtn = document.getElementById('no-products-refresh');
                if (retryBtn) retryBtn.addEventListener('click', () => {
                    const q = productSearch.value.trim();
                    fetchProducts(q.length >= 2 ? q : '', currentCategory);
                });
            });
    }

    // Display products in grid
    function displayProducts(products) {
        productGrid.innerHTML = '';
            // If no products from API, show a friendly, actionable UI with contextual messaging
            if (!products || products.length === 0) {
                const q = productSearch ? productSearch.value.trim() : '';
                const cat = (typeof currentCategory === 'string' ? currentCategory : '') || '';
                // helper to prettify category names
                function prettify(s) {
                    if (!s) return '';
                    return String(s).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                }

                let icon = 'fa-box';
                let title = 'Nothing to sell yet';
                let paragraph = 'Products for the POS are currently unavailable. <br> Make sure you have added products marked as "Available in POS" in Inventory. <br> Use the button below to open Inventory and add items to start selling.';

                if (q && q.length > 0) {
                    // no results for a search
                    icon = 'fa-search';
                    title = `No results for "${q}"`;
                    paragraph = `We couldn't find any products matching <strong>"${q}"</strong>. <br> Try a different search or open Inventory to add items.`;
                } else if (cat && cat.toLowerCase() !== 'all') {
                    // category-specific empty
                    if (cat.toLowerCase() === 'favourites') {
                        icon = 'fa-heart';
                        title = 'No favourites yet';
                        paragraph = 'You have not added any favourites. <br> Mark your most used product as favourite to see it here.';
                    } else if (cat.toLowerCase() === 'discounts' || cat.toLowerCase() === 'discount') {
                        icon = 'fa-percent';
                        title = 'No discounted items';
                        paragraph = 'There are currently no active discounts. <br> Add discounts in Settings to surface discounts here.';
                    } else {
                        icon = 'fa-folder-open';
                        const pretty = prettify(cat);
                        title = `${pretty} has no items`; 
                        paragraph = `The <strong>${pretty}</strong> category doesn't contain any items available to sell. <br> Open Inventory to add products to this category.`;
                    }
                }

                // compute inventory link and button label; do NOT show an "Add favourites" link here.
                const catLower = (cat || '').toLowerCase();
                // Default to Inventory link; override for Discounts to point to Settings
                let inventoryHref = `../inventory/index.php${(cat && catLower !== 'all' && catLower !== 'favourites' && catLower !== 'discounts') ? ('?category=' + encodeURIComponent(cat)) : ''}`;
                let inventoryLabel = 'Open Inventory';
                if (catLower === 'discounts' || catLower === 'discount') {
                    inventoryHref = '../settings/index.php';
                    inventoryLabel = 'Open Settings';
                }

                // Build actions HTML: for 'favourites' only show Refresh; for other views show Open Inventory + Refresh
                let actionsHtml = '';
                if (catLower === 'favourites') {
                    actionsHtml = `<button id="no-products-refresh" class="no-products-btn refresh">Refresh</button>`;
                } else {
                    actionsHtml = `<a href="${inventoryHref}" class="no-products-btn open-inventory" target="_blank" rel="noopener">${inventoryLabel}</a>` +
                                  `<button id="no-products-refresh" class="no-products-btn refresh">Refresh</button>`;
                }

                productGrid.innerHTML = `
                    <div class="no-products ${q ? 'search-empty' : ''}">
                        <div class="no-products-illustration"><i class="fa ${icon}"></i></div>
                        <h3>${title}</h3>
                        <p>${paragraph}</p>
                        <div class="no-products-actions">
                            ${actionsHtml}
                        </div>
                    </div>
                `;

                // wire refresh button
                const refreshBtn = document.getElementById('no-products-refresh');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', () => {
                        const q2 = productSearch.value.trim();
                        fetchProducts(q2.length >= 2 ? q2 : '', currentCategory);
                    });
                }
                return;
            }
        const initialListMode = productGrid && productGrid.classList.contains('list-mode');
        products.forEach(product => {
            // Price can be a number or the string 'variable'
            const rawPrice = product.unit_price ?? product.price;
            const isVariablePrice = (typeof rawPrice === 'string' && rawPrice.toLowerCase() === 'variable');
            let displayPrice = 0;
            if (!isVariablePrice) {
                displayPrice = parseFloat(rawPrice ?? 0);
                if (isNaN(displayPrice)) displayPrice = 0;
            }
            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            // Determine stock status label (replace numeric stock display)
            const qtyRaw = product.quantity;
            const qty = (qtyRaw === null || qtyRaw === undefined || qtyRaw === '') ? null : parseInt(qtyRaw, 10);
            const lowThresholdRaw = product.low_stock;
            const lowThreshold = (lowThresholdRaw === null || lowThresholdRaw === undefined || lowThresholdRaw === '') ? null : parseInt(lowThresholdRaw, 10);
            // Only show stock labels when track_stock == 1
            const trackRaw = product.track_stock;
            const isTracking = (trackRaw === '1' || trackRaw === 1 || trackRaw === true || String(trackRaw).toLowerCase() === '1');
            let stockLabel = '';
            let stockClass = '';
            if (isTracking) {
                if (qty === null || qty <= 0) {
                    stockLabel = 'Out of stock';
                    stockClass = 'out-of-stock';
                } else if (lowThreshold !== null && qty <= lowThreshold) {
                    stockLabel = 'Low stock';
                    stockClass = 'low-stock';
                }
            }

            // Render card: use the shape/image as the full card background (replace main container)
            const productPriceHtml = isVariablePrice ? '' : `<p class="product-price">${currency}${displayPrice.toFixed(2)}</p>`;
            const typeRaw = (product.type || '').toString();
            let bgStyle = '';
            let bgClass = '';
            if (typeRaw === 'image' && product.image_url) {
                const imgSrc = (/^https?:\/\//i.test(product.image_url)) ? product.image_url : '../../' + product.image_url.replace(/^\//, '');
                bgStyle = `background-image: url('${imgSrc}'); background-size: cover; background-position: center;`;
                bgClass = 'bg-image';
            } else {
                const color = (product.color || '#ffffff');
                const shape = (product.shape || 'square');
                bgStyle = `background: ${color};`;
                bgClass = `bg-shape ${shape}`;
                // mark light backgrounds so we can adapt text color for legibility
                try {
                    if (isLightColor(color)) {
                        productCard.classList.add('bg-light');
                    }
                } catch (e) { /* ignore */ }
            }

            // For image type products, keep name/price bottom-aligned.
            // For non-image (color/shape) products, center the name/price in the middle area.
            if (typeRaw === 'image' && product.image_url) {
                // For list-mode we want the name and price to be separated so the
                // price can appear at the right (in `.card-bottom`) and the name
                // stays in `.card-details`. For grid-mode we keep the original
                // bottom-aligned stacked layout.
                if (initialListMode) {
                    productCard.innerHTML = `
                        <div class="card-bg ${bgClass}" style="${bgStyle}"></div>
                        <div class="card-overlay">
                            <div class="card-middle column">
                                ${stockLabel ? `<p class="stock-status ${stockClass}">${stockLabel}</p>` : ''}
                                <div class="card-details">
                                    <h4>${product.name}</h4>
                                </div>
                            </div>
                            <div class="card-bottom">
                                ${productPriceHtml}
                            </div>
                        </div>
                    `;
                } else {
                    productCard.innerHTML = `
                        <div class="card-bg ${bgClass}" style="${bgStyle}"></div>
                        <div class="card-overlay">
                            <div class="card-middle">
                                ${stockLabel ? `<p class="stock-status ${stockClass}">${stockLabel}</p>` : ''}
                            </div>
                            <div class="card-bottom">
                                <h4>${product.name}</h4>
                                ${productPriceHtml}
                            </div>
                        </div>
                    `;
                }
            } else {
                // Non-image: place details in the middle so they appear centered inside the shape
                // Use a vertical stack so badge and details don't overlap
                // If the current view is list-mode on initial render, place price in card-bottom
                // so it appears to the right immediately; otherwise keep it in details.
                if (initialListMode) {
                    productCard.innerHTML = `
                        <div class="card-bg ${bgClass}" style="${bgStyle}"></div>
                        <div class="card-overlay">
                            <div class="card-middle column">
                                ${stockLabel ? `<p class="stock-status ${stockClass}">${stockLabel}</p>` : ''}
                                <div class="card-details">
                                    <h4>${product.name}</h4>
                                </div>
                            </div>
                            <div class="card-bottom">
                                ${productPriceHtml}
                            </div>
                        </div>
                    `;
                } else {
                    productCard.innerHTML = `
                        <div class="card-bg ${bgClass}" style="${bgStyle}"></div>
                        <div class="card-overlay">
                            <div class="card-middle column">
                                ${stockLabel ? `<p class="stock-status ${stockClass}">${stockLabel}</p>` : ''}
                                <div class="card-details">
                                    <h4>${product.name}</h4>
                                    ${productPriceHtml}
                                </div>
                            </div>
                            <div class="card-bottom"></div>
                        </div>
                    `;
                }
            }

            // Add favourite (heart) button to the card (top-right)
            try {
                const favBtn = document.createElement('button');
                favBtn.className = 'fav-toggle';
                favBtn.setAttribute('aria-label', 'Favourite');
                favBtn.innerHTML = '<i class="fa fa-heart"></i>';
                // set initial state
                if (isFavourite(product.id)) favBtn.classList.add('fav-active');
                // clicking the fav button should not trigger the card click
                favBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    const wasOn = favBtn.classList.contains('fav-active');
                    const nowOn = !wasOn;
                    // optimistic UI
                    favBtn.classList.toggle('fav-active', nowOn);
                    favBtn.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
                    // send to server; on success persist locally, on failure revert and notify
                    sendFavouriteToServer(product.id, nowOn)
                        .then(() => {
                            setFavourite(product.id, nowOn);
                        })
                        .catch(err => {
                            // revert UI
                            favBtn.classList.toggle('fav-active', wasOn);
                            favBtn.setAttribute('aria-pressed', wasOn ? 'true' : 'false');
                            // keep local storage unchanged; notify user
                            try { alert('Could not update favourite: ' + (err && err.message ? err.message : err)); } catch(e) { /* ignore */ }
                        });
                });
                productCard.appendChild(favBtn);
            } catch (e) {
                // ignore if DOM manipulation fails
                console.warn('Could not add fav button', e);
            }

            // Accessibility and click behavior
            productCard.setAttribute('data-id', product.id);
            productCard.setAttribute('data-name', product.name);
            // keep original rawPrice as attribute so we can detect 'variable'
            productCard.setAttribute('data-price', displayPrice);
            productCard.setAttribute('data-raw-price', String(rawPrice ?? ''));
            productCard.tabIndex = 0; // make focusable
            productCard.style.cursor = 'pointer';

            // Click handler: if price is variable, show price input modal; otherwise add to cart immediately
            productCard.addEventListener('click', (e) => {
                // Before adding, check for variants for this product
                const productId = product.id;
                const checkVariants = fetch('../inventory/variants_api.php?product_id=' + encodeURIComponent(productId), { credentials: 'same-origin' })
                    .then(res => res.ok ? res.json() : Promise.resolve([]))
                    .catch(() => []);

                checkVariants.then(variants => {
                    if (Array.isArray(variants) && variants.length > 0) {
                        // Show variant selector
                        showVariantModal(product, variants, (selectedVariant) => {
                                const nameForCart = product.name + (selectedVariant && selectedVariant.name ? (' — ' + selectedVariant.name) : '');

                                // continuation that performs the add flow for the selected variant
                                function proceedWithVariantAdd() {
                                    const variantPriceRaw = selectedVariant && selectedVariant.price !== undefined ? selectedVariant.price : null;
                                    const variantIsVariable = (typeof variantPriceRaw === 'string' && variantPriceRaw.toLowerCase() === 'variable');

                                    if (variantIsVariable) {
                                        // Ask user to enter the unit price for this variant
                                        showPriceModal(productCard, { name: nameForCart }, (enteredPrice) => {
                                            if (typeof enteredPrice === 'number' && !isNaN(enteredPrice)) {
                                                animateAddToCart(productCard, cartItems);
                                                addToCart(selectedVariant.id || productId, product.name, enteredPrice, selectedVariant.name);
                                            }
                                        });
                                        return;
                                    }

                                    // Otherwise, if price is numeric use it. If not present, fallback to cost or product flow.
                                    const vprice = (variantPriceRaw !== null && variantPriceRaw !== undefined && !isNaN(parseFloat(variantPriceRaw))) ? parseFloat(variantPriceRaw) : null;
                                        if (vprice === null) {
                                        if (isVariablePrice) {
                                            showPriceModal(productCard, { name: nameForCart }, (enteredPrice) => {
                                                if (typeof enteredPrice === 'number' && !isNaN(enteredPrice)) {
                                                    animateAddToCart(productCard, cartItems);
                                                    addToCart(selectedVariant.id || productId, product.name, enteredPrice, selectedVariant.name);
                                                }
                                            });
                                        } else {
                                            const fallbackPrice = (selectedVariant && (selectedVariant.cost !== null && selectedVariant.cost !== undefined) && !isNaN(parseFloat(selectedVariant.cost))) ? parseFloat(selectedVariant.cost) : 0;
                                            animateAddToCart(productCard, cartItems);
                                            addToCart(selectedVariant.id || productId, product.name, fallbackPrice, selectedVariant.name);
                                        }
                                    } else {
                                        animateAddToCart(productCard, cartItems);
                                        addToCart(selectedVariant.id || productId, product.name, vprice, selectedVariant.name);
                                    }
                                }

                                // Check variant stock first and confirm if out of stock using UI modal
                                const vqtyRaw = selectedVariant && (selectedVariant.quantity !== undefined) ? selectedVariant.quantity : null;
                                const vqty = (vqtyRaw === null || vqtyRaw === undefined || vqtyRaw === '') ? null : parseInt(vqtyRaw, 10);
                                if (vqty === null || vqty <= 0) {
                                    showConfirmModal('Selected variant is out of stock. Add to cart anyway?', proceedWithVariantAdd, function(){});
                                    return;
                                }

                                // otherwise proceed immediately
                                proceedWithVariantAdd();
                            });
                    } else {
                        // No variants — original behavior
                        // If tracked and out of stock, prompt before adding using UI modal
                        function proceedWithParentAdd() {
                            if (isVariablePrice) {
                                showPriceModal(productCard, product, (enteredPrice) => {
                                    if (typeof enteredPrice === 'number' && !isNaN(enteredPrice)) {
                                        animateAddToCart(productCard, cartItems);
                                        addToCart(product.id, product.name, enteredPrice);
                                    }
                                });
                            } else {
                                // animate clone moving to cart then add item
                                animateAddToCart(productCard, cartItems);
                                addToCart(product.id, product.name, displayPrice);
                            }
                        }

                        if (isTracking && (qty === null || qty <= 0)) {
                            showConfirmModal('This item is out of stock. Add to cart anyway?', proceedWithParentAdd, function(){});
                        } else {
                            proceedWithParentAdd();
                        }
                    }
                });
            });
            // Keyboard support: Enter or Space
            productCard.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // reuse click flow
                    productCard.click();
                }
            });

            productGrid.appendChild(productCard);

            // If this product has variants, fetch them and update the card indicator
            (function(card, prod) {
                fetch('../inventory/variants_api.php?product_id=' + encodeURIComponent(prod.id), { credentials: 'same-origin' })
                    .then(res => res.ok ? res.json() : [])
                    .catch(() => [])
                    .then(variants => {
                        if (!Array.isArray(variants) || variants.length === 0) return;
                        // remove textual stock badge for variant-managed products
                        const stockBadge = card.querySelector('.stock-status');
                        if (stockBadge) stockBadge.remove();

                        // Determine indicator state: 'out' if any variant out-of-stock, else 'low' if any variant low stock
                        let indicatorState = null; // null | 'low' | 'out'
                        for (let v of variants) {
                            const qty = (v.quantity === null || v.quantity === undefined) ? null : parseInt(v.quantity, 10);
                            const lowThresholdRaw = (v.low_stock !== null && v.low_stock !== undefined) ? v.low_stock : prod.low_stock;
                            const lowThreshold = (lowThresholdRaw === null || lowThresholdRaw === undefined || lowThresholdRaw === '') ? null : parseInt(lowThresholdRaw, 10);
                            if (qty === null || qty <= 0) { indicatorState = 'out'; break; }
                            if (lowThreshold !== null && !isNaN(lowThreshold) && qty <= lowThreshold) { if (indicatorState !== 'out') indicatorState = 'low'; }
                        }

                        if (indicatorState) {
                            const nameEl = card.querySelector('.card-details h4') || card.querySelector('.card-bottom h4') || card.querySelector('h4');
                            if (nameEl) {
                                nameEl.style.position = nameEl.style.position || 'relative';
                                const dot = document.createElement('span');
                                dot.className = 'variant-stock-indicator ' + (indicatorState === 'out' ? 'out' : 'low');
                                dot.setAttribute('title', indicatorState === 'out' ? 'One or more variants out of stock' : 'One or more variants low stock');
                                nameEl.appendChild(dot);
                            }
                        }
                    });
            })(productCard, product);
        });
        // After rendering all product cards, ensure DOM adjustments for list-mode
        // (move prices and stock badges) are applied. Run immediately and retry
        // shortly after to handle any timing/race conditions.
        try { adjustPricesForListMode(productGrid && productGrid.classList.contains('list-mode')); } catch (e) { /* ignore */ }
        try { setTimeout(() => adjustPricesForListMode(productGrid && productGrid.classList.contains('list-mode')), 120); } catch (e) { /* ignore */ }
    }

    // Add product to cart
    function addToCart(productId, productName, unitPrice, variantName) {
        const existingItem = cart.find(item => item.product_id === productId && (item.variant || '') === (variantName || ''));
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                product_id: productId,
                name: productName,
                unit_price: unitPrice,
                quantity: 1,
                variant: variantName || null
            });
        }
        updateCartDisplay();

        // Auto-fill the received amount with exact total when the user has not
        // manually edited the amount field. Respect the user-edited flag so we
        // don't overwrite their input. Reset quick-replace state so first quick
        // button click after auto-fill will replace (as intended).
        try {
            if (!amountUserEdited) {
                let t = parseFloat(String(totalEl.textContent || '').replace(currency, '').replace(/,/g, '').trim());
                if (isNaN(t)) t = 0;
                programmaticAmountUpdate = true;
                amountReceived.value = t.toFixed(2);
                lastQuickReplaced = false;
                // update change display immediately
                    updateChange();
                    updateAmountClearVisibility();
            }
        } catch (e) { /* ignore autofill errors */ }
    }

    // Animate a flying clone of the product card to the target element (cart)
    function animateAddToCart(cardEl, targetEl) {
        try {
            const targetRect = targetEl.getBoundingClientRect();

            // If we're in list-mode, animate only the visual shape/image
            // element (the `.card-bg`) so the flying clone is compact.
            const useShapeOnly = productGrid && productGrid.classList && productGrid.classList.contains('list-mode');
            let sourceEl = cardEl;
            if (useShapeOnly) {
                const bg = cardEl.querySelector('.card-bg') || cardEl.querySelector('.shape') || cardEl.querySelector('.image-container');
                if (bg) sourceEl = bg;
            }

            const rect = sourceEl.getBoundingClientRect();

            const clone = sourceEl.cloneNode(true);
            // Remove focus outline from clone
            clone.style.outline = 'none';
            clone.style.position = 'fixed';
            clone.style.left = rect.left + 'px';
            clone.style.top = rect.top + 'px';
            clone.style.width = rect.width + 'px';
            clone.style.height = rect.height + 'px';
            clone.style.margin = '0';
            clone.style.zIndex = 9999;
            clone.style.pointerEvents = 'none';
            clone.style.transition = 'transform 600ms cubic-bezier(.2,.8,.2,1), opacity 600ms ease';
            clone.style.willChange = 'transform, opacity';
            // If cloning a small shape, ensure background covers and border-radius preserved
            clone.style.backgroundSize = clone.style.backgroundSize || 'cover';
            clone.style.backgroundPosition = clone.style.backgroundPosition || 'center';
            clone.style.borderRadius = clone.style.borderRadius || window.getComputedStyle(sourceEl).borderRadius || '6px';
            document.body.appendChild(clone);

            // Force reflow so the transition will run
            clone.getBoundingClientRect();

            const cloneCenterX = rect.left + rect.width / 2;
            const cloneCenterY = rect.top + rect.height / 2;
            const targetCenterX = targetRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top + targetRect.height / 2;

            const translateX = targetCenterX - cloneCenterX;
            const translateY = targetCenterY - cloneCenterY;

            // apply transform: translate then scale down
            clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.22)`;
            clone.style.opacity = '0.6';

            // Remove clone after animation completes
            setTimeout(() => {
                if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
            }, 700);
        } catch (err) {
            // silently ignore animation errors
            console.error('Animation error', err);
        }
    }

    // --- Price modal helper (calculator-like keypad) ---
    function createPriceModal() {
        if (document.getElementById('price-modal-overlay')) return document.getElementById('price-modal-overlay');
        const overlay = document.createElement('div');
        overlay.id = 'price-modal-overlay';
        overlay.className = 'price-modal-overlay';
        overlay.innerHTML = `
            <div class="price-modal" role="dialog" aria-modal="true">
                <div class="price-modal-header">
                    <div class="price-modal-title" id="price-modal-title">Item</div>
                    <button id="price-modal-cancel" class="price-btn icon" aria-label="Cancel">×</button>
                </div>
                <div class="price-modal-body">
                    <div class="price-display"><span class="currency"></span><span class="amount">0.00</span></div>
                    <div class="price-keypad" role="application" aria-label="Number keypad">
                        <button class="num key">1</button>
                        <button class="num key">2</button>
                        <button class="num key">3</button>
                        <button class="num key">4</button>
                        <button class="num key">5</button>
                        <button class="num key">6</button>
                        <button class="num key">7</button>
                        <button class="num key">8</button>
                        <button class="num key">9</button>
                        <button class="num key">C</button>
                        <button class="num key">0</button>
                        <button class="num key">⌫</button>
                    </div>
                    <div class="price-modal-error" aria-live="polite"></div>
                </div>
                <div class="price-modal-actions">
                    <button id="price-modal-confirm" class="price-btn primary">Add</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        // Inject WebKit scrollbar styles for split modal (transparent track)
        try {
            if (!document.getElementById('split-scroll-style')) {
                const ss = document.createElement('style');
                ss.id = 'split-scroll-style';
                ss.textContent = `
                    /* Horizontal and vertical scrollbars inside the split modal */
                    #split-order-overlay .confirm-modal-body::-webkit-scrollbar { height: 10px; width: 10px; }
                    #split-order-overlay .confirm-modal-body::-webkit-scrollbar-track { background: transparent; }
                    #split-order-overlay .confirm-modal-body::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.12); border-radius:6px; }
                    #split-order-overlay .confirm-modal-body::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.18); }

                    /* Per-column vertical scrollers in the split modal should also have transparent tracks */
                    #split-order-overlay [id^="split-list-"]::-webkit-scrollbar { width: 10px; }
                    #split-order-overlay [id^="split-list-"]::-webkit-scrollbar-track { background: transparent; }
                    #split-order-overlay [id^="split-list-"]::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.08); border-radius:6px; }
                    #split-order-overlay [id^="split-list-"]::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.12); }
                `;
                document.head.appendChild(ss);
            }
        } catch (e) { /* ignore style injection errors */ }

        // close on backdrop click and allow Escape to close when overlay visible
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.classList.remove('visible'); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && overlay.classList.contains('visible')) overlay.classList.remove('visible'); });

        return overlay;
    }

    // --- Confirm modal (custom UI) ---
    function createConfirmModal() {
        if (document.getElementById('confirm-modal-overlay')) return document.getElementById('confirm-modal-overlay');
        const overlay = document.createElement('div');
        overlay.id = 'confirm-modal-overlay';
        overlay.className = 'confirm-modal-overlay';
        // ensure confirm modal appears above other modals (e.g. split modal)
        try { overlay.style.zIndex = 1000030; } catch (e) {}
        overlay.innerHTML = `
            <div class="confirm-modal" role="dialog" aria-modal="true">
                <div class="confirm-modal-header">
                    <h3 class="confirm-modal-title">Confirm</h3>
                </div>
                <div class="confirm-modal-body">
                    <div class="confirm-message" id="confirm-modal-message">Are you sure?</div>
                </div>
                <div class="confirm-modal-actions">
                    <button id="confirm-no" class="confirm-btn">Cancel</button>
                    <button id="confirm-yes" class="confirm-btn primary">Yes</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // close on backdrop click
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.classList.remove('visible'); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && overlay.classList.contains('visible')) overlay.classList.remove('visible'); });

        return overlay;
    }

    function showConfirmModal(message, onYes, onNo, title) {
        const overlay = createConfirmModal();
        const msg = overlay.querySelector('#confirm-modal-message');
        const yes = overlay.querySelector('#confirm-yes');
        const no = overlay.querySelector('#confirm-no');
        const titleEl = overlay.querySelector('.confirm-modal-title');

        if (title && titleEl) titleEl.textContent = String(title);

        msg.textContent = message || 'Are you sure?';

        function cleanup() {
            yes.removeEventListener('click', onYesClick);
            no.removeEventListener('click', onNoClick);
            document.removeEventListener('keydown', onKey);
            overlay.classList.remove('visible');
        }

        function onYesClick() { cleanup(); if (typeof onYes === 'function') onYes(); }
        function onNoClick() { cleanup(); if (typeof onNo === 'function') onNo(); }
        function onKey(e) { if (e.key === 'Enter') onYesClick(); if (e.key === 'Escape') onNoClick(); }

        yes.addEventListener('click', onYesClick);
        no.addEventListener('click', onNoClick);
        document.addEventListener('keydown', onKey);

        overlay.classList.add('visible');
        // focus yes for quick keyboard confirm
        setTimeout(() => yes.focus(), 60);
    }

    // --- Save Order modal (UI for entering optional reference before saving) ---
    function createSaveOrderModal() {
        if (document.getElementById('save-order-overlay')) return document.getElementById('save-order-overlay');
        const overlay = document.createElement('div');
        overlay.id = 'save-order-overlay';
        overlay.className = 'confirm-modal-overlay';
        overlay.innerHTML = `
            <div class="confirm-modal" role="dialog" aria-modal="true">
                <div class="confirm-modal-header">
                    <h3 class="confirm-modal-title">Save order</h3>
                </div>
                <div class="confirm-modal-body">
                    <label for="save-order-ref" style="display:block;margin-bottom:8px;color:#bfbfbf">Reference (optional)</label>
                    <input id="save-order-ref" type="text" placeholder="e.g. Table 4 / Order A" style="width:100%;padding:8px;border-radius:6px;border:1px solid #2a2a2a;background:#111;color:#fff" />
                    <div id="save-order-error" style="color:#ff6b6b;min-height:20px;margin-top:8px;font-size:0.95rem"></div>
                </div>
                <div class="confirm-modal-actions">
                    <button id="save-order-cancel" class="confirm-btn">Cancel</button>
                    <button id="save-order-save" class="confirm-btn primary">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // close on backdrop click
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.classList.remove('visible'); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && overlay.classList.contains('visible')) overlay.classList.remove('visible'); });

        return overlay;
    }

    function showSaveOrderModal(onSave, onCancel, initialValue, titleText) {
        const overlay = createSaveOrderModal();
        const input = overlay.querySelector('#save-order-ref');
        const saveBtn = overlay.querySelector('#save-order-save');
        const cancelBtn = overlay.querySelector('#save-order-cancel');
        const err = overlay.querySelector('#save-order-error');
        const titleEl = overlay.querySelector('.confirm-modal-title');

        // cleanup handlers
        function cleanup() {
            saveBtn.removeEventListener('click', onSaveClick);
            cancelBtn.removeEventListener('click', onCancelClick);
            document.removeEventListener('keydown', onKey);
            overlay.classList.remove('visible');
        }

        function onSaveClick() {
            const val = String(input.value || '').trim();
            // simple client-side validation: max length 128
            if (val.length > 128) {
                err.textContent = 'Reference too long (max 128 chars)';
                return;
            }
            cleanup();
            if (typeof onSave === 'function') onSave(val || null);
        }

        function onCancelClick() {
            cleanup();
            if (typeof onCancel === 'function') onCancel();
        }

        function onKey(e) {
            if (!overlay.classList.contains('visible')) return;
            if (e.key === 'Enter') onSaveClick();
            if (e.key === 'Escape') onCancelClick();
        }

        saveBtn.addEventListener('click', onSaveClick);
        cancelBtn.addEventListener('click', onCancelClick);
        document.addEventListener('keydown', onKey);

        err.textContent = '';
        try { if (typeof initialValue !== 'undefined' && initialValue !== null) input.value = String(initialValue); else input.value = ''; } catch (e) { input.value = ''; }
        if (titleText && titleEl) titleEl.textContent = String(titleText);
        overlay.classList.add('visible');
        setTimeout(() => { try { input.focus(); } catch (e) {} }, 40);
    }

    // Simple toast/notification UI
    function showToast(message, type) {
        try {
            const id = 'pos-toast-container';
            let container = document.getElementById(id);
            if (!container) {
                container = document.createElement('div');
                container.id = id;
                container.style.position = 'fixed';
                container.style.right = '16px';
                container.style.bottom = '16px';
                container.style.zIndex = 99999;
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '8px';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.className = 'pos-toast';
            toast.style.minWidth = '220px';
            toast.style.maxWidth = '360px';
            toast.style.padding = '10px 12px';
            toast.style.borderRadius = '8px';
            toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.5)';
            toast.style.color = '#fff';
            toast.style.fontSize = '0.95rem';
            toast.style.lineHeight = '1.2';
            toast.style.cursor = 'pointer';
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 220ms ease, transform 220ms ease';
            toast.style.transform = 'translateY(8px)';

            // background by type
            switch ((type || '').toLowerCase()) {
                case 'success': toast.style.background = '#2b8a3e'; break;
                case 'error': toast.style.background = '#c0392b'; break;
                case 'warning': toast.style.background = '#b56b00'; break;
                default: toast.style.background = '#2a2a2a'; break;
            }

            toast.textContent = String(message || '');
            container.appendChild(toast);

            // animate in
            requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });

            const t = setTimeout(() => {
                try { toast.style.opacity = '0'; toast.style.transform = 'translateY(8px)'; setTimeout(() => toast.remove(), 240); } catch (e) {}
            }, 4200);

            // remove on click
            toast.addEventListener('click', () => { clearTimeout(t); try { toast.remove(); } catch (e) {} });
        } catch (e) { /* ignore toasting errors */ }
    }

    // --- Merge Orders modal ---
    function createMergeModal(selectedIds) {
        if (document.getElementById('merge-order-overlay')) {
            // update existing overlay options
            const existing = document.getElementById('merge-order-overlay');
            const sel = existing.querySelector('#merge-order-target');
            if (sel) {
                // repopulate options
                sel.innerHTML = '';
                const candidates = (Array.isArray(openOrdersCache) ? openOrdersCache : []).filter(o => selectedIds.indexOf(String(o.id)) !== -1);
                if (candidates.length === 0) {
                    const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'No target orders available'; sel.appendChild(opt);
                    sel.disabled = true;
                } else {
                    sel.disabled = false;
                    candidates.forEach(o => {
                        const opt = document.createElement('option');
                        opt.value = String(o.id);
                        const ref = o.reference || o.ref || ('Order #' + (o.id || ''));
                        const amt = (o.total_amount || o.total || o.totalAmount || 0);
                        const label = `${ref} — ${currency}${parseFloat(amt || 0).toFixed(2)}`;
                        opt.textContent = label;
                        sel.appendChild(opt);
                    });
                }
            }
            // ensure it's visible when reused
            try { existing.classList.add('visible'); } catch (e) {}
            return document.getElementById('merge-order-overlay');
        }

        const overlay = document.createElement('div');
        overlay.id = 'merge-order-overlay';
        overlay.className = 'confirm-modal-overlay';
        const candidates = (Array.isArray(openOrdersCache) ? openOrdersCache : []).filter(o => selectedIds.indexOf(String(o.id)) !== -1);
        let optionsHtml = '';
        if (candidates.length === 0) {
            optionsHtml = `<option value="" disabled selected>No target orders available</option>`;
        } else {
            optionsHtml = candidates.map(o => {
                const ref = o.reference || o.ref || ('Order #' + (o.id || ''));
                const amt = (o.total_amount || o.total || o.totalAmount || 0);
                const label = `${ref} — ${currency}${parseFloat(amt || 0).toFixed(2)}`;
                return `<option value="${String(o.id)}">${escapeHtml(label)}</option>`;
            }).join('');
        }

        overlay.innerHTML = `
            <div class="confirm-modal" role="dialog" aria-modal="true">
                <div class="confirm-modal-header">
                    <h3 class="confirm-modal-title">Merge orders</h3>
                </div>
                <div class="confirm-modal-body">
                    <label for="merge-order-target" style="display:block;margin-bottom:8px;color:#bfbfbf">Merge selected orders into</label>
                    <select id="merge-order-target" style="width:100%;padding:8px;border-radius:6px;border:1px solid #2a2a2a;background:#111;color:#fff">${optionsHtml}</select>
                    <div id="merge-order-error" style="color:#ff6b6b;min-height:20px;margin-top:8px;font-size:0.95rem"></div>
                </div>
                <div class="confirm-modal-actions">
                    <button id="merge-order-cancel" class="confirm-btn">Cancel</button>
                    <button id="merge-order-continue" class="confirm-btn primary">Continue</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        // close on backdrop click and Escape
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.classList.remove('visible'); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && overlay.classList.contains('visible')) overlay.classList.remove('visible'); });

        // show immediately
        try { overlay.classList.add('visible'); } catch (e) {}
        return overlay;
    }

    // --- Split Order modal (multi-column support) ---
    // Accepts optional savedMeta: { id, ref, created_at, updated_at }
    function createSplitModal(initialItems, savedMeta) {
        // If an old split overlay exists, remove it so we always rebuild
        // from the latest `initialItems` (ensures newly added cart items
        // appear when reopening the modal after closing).
        const _existingSplit = document.getElementById('split-order-overlay');
        if (_existingSplit) {
            try { _existingSplit.parentNode.removeChild(_existingSplit); } catch (e) { try { _existingSplit.remove(); } catch (e2) {} }
        }

        // Prepare a human-friendly ref and time parts when we have saved order metadata
        function formatClock(ts) {
            if (!ts) ts = new Date().toISOString();
            try { return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch (e) { const d = new Date(ts); return d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0'); }
        }
        const baseRef = (savedMeta && (savedMeta.ref || savedMeta.id)) ? (savedMeta.ref ? String(savedMeta.ref) : ('Order #' + (savedMeta.id || ''))) : null;
        const baseTime = savedMeta ? formatClock(savedMeta.updated_at || savedMeta.created_at || savedMeta.created || new Date().toISOString()) : null;

        // columns: first is main order, subsequent are new order containers
        const columns = [];
        // deep copy initial items into first column; title uses baseRef/time when available
        columns.push({ id: 'col-0', title: (baseRef ? (baseRef + (baseTime ? (' - ' + baseTime) : '')) : 'Main order'), items: (Array.isArray(initialItems) ? initialItems.map(i => Object.assign({}, i)) : []) });
        // add one new order column by default
        let nextColIndex = 1;
        columns.push({ id: `col-${nextColIndex}`, title: (baseRef ? (baseRef + ' - 1' + (baseTime ? (' - ' + baseTime) : '')) : 'New order'), items: [] });

        const overlay = document.createElement('div');
        overlay.id = 'split-order-overlay';
        overlay.className = 'confirm-modal-overlay';
        overlay.innerHTML = `
            <div class="confirm-modal" role="dialog" aria-modal="true" style="width:460px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <button id="split-close" class="confirm-btn" style="display:inline-flex;align-items:center;justify-content:center;height:36px;min-width:36px;padding:6px;">×</button>
                    </div>
                    <div style="flex:1;display:flex;align-items:center;">
                        <h3 class="confirm-modal-title" style="margin:0">Split order</h3>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <button id="split-save" class="confirm-btn primary" style="display:inline-flex;align-items:center;justify-content:center;height:36px;padding:6px;margin-left:6px;">Save split</button>
                    </div>
                </div>
                <div class="confirm-modal-body" style="overflow-x:auto;">
                    <div id="split-columns-container" style="min-width:100%;display:flex;gap:24px;padding-bottom:6px;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        function createColumnDOM(col, idx) {
            const outer = document.createElement('div');
            outer.style.flex = '1';
            outer.style.minWidth = '350px';
            outer.style.display = 'flex';
            outer.style.flexDirection = 'column';
            outer.dataset.colId = col.id;

            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.justifyContent = 'space-between';
            header.style.marginBottom = '8px';
            header.innerHTML = `
                <div style="font-size:0.95rem;color:#bfbfbf;">${escapeHtml(col.title)}</div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <button data-add-for="${col.id}" class="split-add-btn confirm-btn" title="Add container to right" style="height:28px;padding:4px 8px;"><i class="fa fa-plus" aria-hidden="true"></i></button>
                    <button data-opts-for="${col.id}" class="split-opts-btn confirm-btn" title="Options" style="height:28px;padding:4px 8px;"><i class="fa fa-ellipsis-v" aria-hidden="true"></i></button>
                </div>
            `;

            const list = document.createElement('div');
            list.id = `split-list-${col.id}`;
            list.style.flex = '1';
            list.style.border = '1px solid #2a2a2a';
            list.style.padding = '8px';
            list.style.borderRadius = '6px';
            list.style.maxHeight = '360px';
            list.style.overflow = 'auto';
            list.style.background = '#0f0f0f';

            const moveWrap = document.createElement('div');
            moveWrap.style.marginTop = '8px';
            moveWrap.style.display = 'flex';
            moveWrap.style.justifyContent = 'flex-start';
            moveWrap.innerHTML = `<button data-move-here-for="${col.id}" class="split-move-here confirm-btn primary" disabled style="width:100%;box-sizing:border-box;height:44px;padding:10px;border-radius:6px;font-weight:600;">Move here</button>`;

            outer.appendChild(header);
            outer.appendChild(list);
            outer.appendChild(moveWrap);
            return outer;
        }

        function render() {
            const container = overlay.querySelector('#split-columns-container');
            container.innerHTML = '';
            columns.forEach((col, colIdx) => {
                // Update title for default columns: if we have a baseRef/time, derive numbered titles
                if (baseRef) {
                    if (colIdx === 0) col.title = baseRef + (baseTime ? (' - ' + baseTime) : '');
                    else col.title = `${baseRef} - ${colIdx}` + (baseTime ? (' - ' + baseTime) : '');
                } else {
                    if (colIdx === 0) col.title = 'Main order';
                    else col.title = col.title || `New order`;
                }
                const colDom = createColumnDOM(col, colIdx);
                container.appendChild(colDom);

                // Render items
                const listEl = colDom.querySelector(`#split-list-${col.id}`);
                listEl.innerHTML = '';
                col.items.forEach((it, idx) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.alignItems = 'center';
                    row.style.justifyContent = 'space-between';
                    row.style.padding = '10px 8px';
                    row.style.minHeight = '48px';
                    row.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
                    row.innerHTML = `
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;">
                            <label class="table-checkbox" style="margin-right:8px;display:inline-flex;align-items:center;gap:8px;">
                                <input type="checkbox" class="split-check" data-col="${col.id}" data-idx="${idx}" />
                                <span class="checkmark"></span>
                            </label>
                            <div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(it.name || '')}${it.variant?(' — ' + escapeHtml(it.variant)) : ''}</div>
                        </div>
                        <div style="margin-left:12px;color:#ffb347">${currency}${(it.unit_price||0).toFixed(2)} x ${it.quantity}</div>
                    `;
                    listEl.appendChild(row);
                    const cb = row.querySelector('.split-check');
                    if (cb) cb.addEventListener('click', (ev) => { ev.stopPropagation(); updateButtons(); });
                    row.addEventListener('click', (ev) => {
                        try {
                            if (ev.target && ev.target.closest && ev.target.closest('.table-checkbox')) return;
                            const cbLocal = row.querySelector('.split-check');
                            if (cbLocal) {
                                cbLocal.checked = !cbLocal.checked;
                                updateButtons();
                            }
                        } catch (e) { /* ignore */ }
                    });
                });
            });

            // wire change listeners
            overlay.querySelectorAll('.split-check').forEach(cb => cb.addEventListener('change', updateButtons));
            updateButtons();
        }

        function updateButtons() {
            // Determine checked counts per source column
            const checkedEls = Array.from(overlay.querySelectorAll('.split-check:checked'));
            const counts = {};
            checkedEls.forEach(cb => { const sc = cb.getAttribute('data-col'); counts[sc] = (counts[sc] || 0) + 1; });
            const totalChecked = checkedEls.length;

            // For each column, enable its Move Here button only if there are checked items in other columns
            columns.forEach(col => {
                const selector = `[data-move-here-for="${col.id}"]`;
                const targetBtn = overlay.querySelector(selector);
                if (!targetBtn) return;
                const otherChecked = totalChecked - (counts[col.id] || 0);
                const enabled = otherChecked > 0;
                targetBtn.disabled = !enabled;
                try { targetBtn.setAttribute('aria-disabled', (!enabled).toString()); } catch (e) {}
                // Visual disabled state
                if (enabled) {
                    targetBtn.classList.remove('disabled');
                    targetBtn.style.opacity = '';
                } else {
                    targetBtn.classList.add('disabled');
                    targetBtn.style.opacity = '0.5';
                }
            });
        }

        // initial render
        render();

        // helper: add a new column to the right of a given column id
        function addColumnToRight(afterColId) {
            nextColIndex++;
            const newCol = { id: `col-${nextColIndex}`, title: (baseRef ? (baseRef + ' - ' + (columns.length) + (baseTime ? (' - ' + baseTime) : '')) : 'New order'), items: [] };
            const idx = columns.findIndex(c => c.id === afterColId);
            if (idx === -1) columns.push(newCol);
            else columns.splice(idx + 1, 0, newCol);
            render();
            // scroll to far right so the new column is visible
            try { overlay.querySelector('.confirm-modal-body').scrollLeft = overlay.querySelector('.confirm-modal-body').scrollWidth; } catch (e) {}
        }

        // Move here handler: move checked items from any other column(s) into target column
        overlay.addEventListener('click', (ev) => {
            const mv = ev.target.closest && ev.target.closest('[data-move-here-for]');
            if (mv) {
                ev.stopPropagation();
                const targetId = mv.getAttribute('data-move-here-for');
                const checked = Array.from(overlay.querySelectorAll('.split-check:checked'));
                // group checks by source column
                const bySource = {};
                checked.forEach(cb => {
                    const sc = cb.getAttribute('data-col');
                    const si = parseInt(cb.getAttribute('data-idx'), 10);
                    if (!bySource[sc]) bySource[sc] = [];
                    bySource[sc].push(si);
                });
                // For each source column, remove items by descending index
                Object.keys(bySource).forEach(srcId => {
                    if (srcId === targetId) return; // don't move from same column
                    const srcCol = columns.find(c => c.id === srcId);
                    const tgtCol = columns.find(c => c.id === targetId);
                    if (!srcCol || !tgtCol) return;
                    const indices = bySource[srcId].sort((a,b)=>b-a);
                    indices.forEach(i => {
                        const it = srcCol.items.splice(i,1)[0];
                        if (it) tgtCol.items.push(it);
                    });
                });
                render();
                try { overlay.querySelector('.confirm-modal-body').scrollLeft = 0; } catch (e) {}
            }
        });

        // Add / Options handler: Add creates a new column to the right; Options shows a dropdown
        overlay.addEventListener('click', (ev) => {
            const addBtn = ev.target.closest && ev.target.closest('[data-add-for]');
            if (addBtn) {
                ev.stopPropagation();
                const forId = addBtn.getAttribute('data-add-for');
                addColumnToRight(forId);
                return;
            }

            const optsBtn = ev.target.closest && ev.target.closest('[data-opts-for]');
            if (optsBtn) {
                ev.stopPropagation();
                const forId = optsBtn.getAttribute('data-opts-for');

                // Remove any existing menu
                try { const ex = document.getElementById('split-options-menu'); if (ex) ex.remove(); } catch (e) {}

                const btnRect = optsBtn.getBoundingClientRect();
                const overlayRect = overlay.getBoundingClientRect();
                const menu = document.createElement('div');
                menu.id = 'split-options-menu';
                menu.style.position = 'absolute';
                menu.style.zIndex = 999999;
                menu.style.left = (btnRect.left - overlayRect.left) + 'px';
                menu.style.top = (btnRect.bottom - overlayRect.top) + 'px';
                menu.style.background = '#0f0f0f';
                menu.style.border = '1px solid #2a2a2a';
                menu.style.borderRadius = '6px';
                menu.style.padding = '4px';
                menu.style.minWidth = '140px';
                menu.style.boxShadow = '0 6px 16px rgba(0,0,0,0.6)';
                menu.innerHTML = `
                    <button data-action="edit" class="split-options-item" style="display:block;width:100%;text-align:left;padding:8px;border:none;background:transparent;color:#fff">Edit</button>
                    <button data-action="delete" class="split-options-item" style="display:block;width:100%;text-align:left;padding:8px;border:none;background:transparent;color:#fff">Delete</button>
                `;

                overlay.appendChild(menu);

                // determine column index
                const colIdx = columns.findIndex(c => c.id === forId);
                if (colIdx === -1) {
                    // nothing to do
                    setTimeout(() => { try { menu.remove(); } catch (e) {} }, 1600);
                    return;
                }

                // disable delete for main column
                if (colIdx === 0) {
                    try {
                        const delBtn = menu.querySelector('[data-action="delete"]');
                        if (delBtn) { delBtn.disabled = true; delBtn.style.opacity = '0.5'; delBtn.title = 'Cannot delete main order'; }
                    } catch (e) {}
                }

                // menu click handler
                menu.addEventListener('click', (mev) => {
                    mev.stopPropagation();
                    const action = mev.target.getAttribute('data-action');
                    if (!action) return;
                        if (action === 'edit') {
                            // When savedMeta/time is present, keep the time suffix uneditable.
                            const fullTitle = columns[colIdx] && columns[colIdx].title ? columns[colIdx].title : (colIdx === 0 ? 'Main order' : 'New order');
                            let initialEditable = fullTitle;
                            if (baseTime && typeof fullTitle === 'string' && fullTitle.endsWith(' - ' + baseTime)) {
                                // strip the trailing " - TIME"
                                initialEditable = fullTitle.slice(0, fullTitle.length - ((' - ' + baseTime).length));
                            }
                            // Use in-app modal instead of native prompt. Only the non-time part is editable.
                            showSaveOrderModal(function onSaveRef(val) {
                                try {
                                    const cleaned = String(val).trim() || (colIdx===0?'Main order':'New order');
                                    columns[colIdx].title = baseTime ? (cleaned + ' - ' + baseTime) : cleaned;
                                    render();
                                } catch (e) { showToast('Could not rename column', 'error'); }
                            }, function onCancelRef() {
                                // nothing
                            }, initialEditable, 'Edit column name');
                            try { menu.remove(); } catch (e) {}
                            return;
                        }
                    if (action === 'delete') {
                        if (colIdx === 0) {
                            showToast('Cannot delete main order', 'warning');
                            try { menu.remove(); } catch (e) {}
                            return;
                        }
                        showConfirmModal('Delete this order column? Its items will be moved to the Main order.', function onYes() {
                            try {
                                // move items to main
                                const src = columns[colIdx];
                                if (src && Array.isArray(src.items) && src.items.length > 0) {
                                    columns[0].items = columns[0].items.concat(src.items);
                                }
                                // remove the column
                                columns.splice(colIdx, 1);
                                render();
                                showToast('Order column deleted; items moved to Main order', 'success');
                            } catch (e) { showToast('Could not delete column: ' + (e && e.message ? e.message : e), 'error'); }
                        }, function onNo() {
                            // cancelled
                        }, 'Delete order column');
                        try { menu.remove(); } catch (e) {}
                        return;
                    }
                });

                // click outside to close
                setTimeout(() => {
                    function onDocClick(evt) {
                        if (!menu.contains(evt.target) && !optsBtn.contains(evt.target)) {
                            try { menu.remove(); } catch (e) {}
                            document.removeEventListener('click', onDocClick);
                        }
                    }
                    document.addEventListener('click', onDocClick);
                }, 10);

                return;
            }
        });

        // Close (X) in header
        const closeBtn = overlay.querySelector('#split-close');
        if (closeBtn) closeBtn.addEventListener('click', () => { overlay.classList.remove('visible'); });

        // Save split: first column remains as main; combine all other columns into a single new order payload
        const saveBtn = overlay.querySelector('#split-save');
        saveBtn.addEventListener('click', async () => {
            const leftItems = columns[0].items;
            const rightItemsCombined = columns.slice(1).reduce((acc,c) => acc.concat(c.items), []);
            if (rightItemsCombined.length === 0) {
                showToast('No items selected for new order.', 'warning');
                return;
            }

            function totalsFor(items) {
                const subtotal = items.reduce((s,it)=>s + ((parseFloat(it.unit_price)||0) * (parseInt(it.quantity)||0)), 0);
                const tax = subtotal * taxRate;
                const total = subtotal + tax;
                return { subtotal, tax, total };
            }

            const cm = (function(){ try { return localStorage.getItem(CART_MODE_KEY); } catch(e){ return null; } })() || 'dinein';

            const rightTotals = totalsFor(rightItemsCombined);
            const payloadNew = { ref: null, items: rightItemsCombined, subtotal: rightTotals.subtotal, tax: rightTotals.tax, total: rightTotals.total, payment_method: selectedPaymentMethod, cart_mode: cm };
            const leftTotals = totalsFor(leftItems);

            try {
                if (typeof currentOrderId !== 'undefined' && currentOrderId) {
                    const payloadLeft = { order_id: currentOrderId, ref: currentOrderRef || null, items: leftItems, subtotal: leftTotals.subtotal, tax: leftTotals.tax, total: leftTotals.total, payment_method: selectedPaymentMethod, cart_mode: cm };
                    try {
                        const rLeft = await fetch('save_order_api.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadLeft) });
                        if (!rLeft.ok) throw new Error('Failed to update original order');
                        const jLeft = await rLeft.json();
                        if (!jLeft || !jLeft.success) throw new Error(jLeft && jLeft.error ? jLeft.error : 'Failed to update original order');
                    } catch (err) {
                        console.warn('Could not update original order on server:', err);
                    }
                }
                // Use the title of the first non-main column as the reference for the new saved order, stripping any trailing time part
                try {
                    const firstNonMain = columns[1] && columns[1].title ? String(columns[1].title) : null;
                    if (firstNonMain) {
                        // If baseTime exists and the title ends with ' - TIME', remove it when saving the reference
                        const timeSuffix = baseTime ? (' - ' + baseTime) : null;
                        payloadNew.ref = (timeSuffix && firstNonMain.endsWith(timeSuffix)) ? firstNonMain.slice(0, firstNonMain.length - timeSuffix.length) : firstNonMain;
                    }
                } catch (e) {
                    // ignore and leave ref as-is
                }

                const rNew = await fetch('save_order_api.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadNew) });
                if (!rNew.ok) throw new Error('Failed to save new order');
                const jNew = await rNew.json();
                if (!jNew || !jNew.success) throw new Error(jNew && jNew.error ? jNew.error : 'Failed to save new order');

                // After successfully saving the split, clear the active cart (user requested behavior)
                try {
                    cart = [];
                    currentOrderId = null;
                    currentOrderRef = null;
                } catch (e) {}
                updateCartDisplay();

                showToast('Order split saved', 'success');
                overlay.classList.remove('visible');

                try { fetch('open_orders_api.php', { credentials: 'same-origin' }).then(r=>r.ok?r.json():Promise.reject()).then(j=>{ if (j && j.success) { openOrdersCache = j.orders || []; } }); } catch (e) {}
            } catch (err) {
                showToast('Split failed: ' + (err && err.message ? err.message : err), 'error');
            }
        });

        // close on backdrop click and Escape
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.classList.remove('visible'); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && overlay.classList.contains('visible')) overlay.classList.remove('visible'); });

        // show
        overlay.classList.add('visible');
        return overlay;
    }

    // Make the current sale title editable inline when clicked
    function enableTitleEditing() {
        try {
            const titleEl = document.getElementById('current-sale-title');
            if (!titleEl) return;
            // avoid attaching multiple listeners: remove existing by cloning
            const newTitle = titleEl.cloneNode(true);
            titleEl.parentNode.replaceChild(newTitle, titleEl);
            newTitle.style.cursor = 'pointer';
            newTitle.addEventListener('click', function onClickEdit() {
                const curText = String(newTitle.textContent || '').trim();
                const input = document.createElement('input');
                input.type = 'text';
                input.id = 'current-sale-title-input';
                input.value = (curText === 'Current Sale') ? '' : curText;
                input.style.width = '100%';
                input.style.padding = '6px 8px';
                input.style.borderRadius = '6px';
                input.style.border = '1px solid #2a2a2a';
                input.style.background = 'transparent';
                input.style.color = '#fff';
                // replace element
                newTitle.parentNode.replaceChild(input, newTitle);
                input.focus();
                input.select();

                function finishSave() {
                    const v = String(input.value || '').trim();
                    const h = document.createElement('h3');
                    h.id = 'current-sale-title';
                    h.textContent = v || 'Current Sale';
                    h.style.cursor = 'pointer';
                    input.parentNode.replaceChild(h, input);
                    // store the ref locally
                    currentOrderRef = v || null;
                    // if editing should persist to server for a loaded order, this is the place to do it (optional)
                    enableTitleEditing();
                }

                function cancelEdit() {
                    const h = document.createElement('h3');
                    h.id = 'current-sale-title';
                    h.textContent = curText || 'Current Sale';
                    h.style.cursor = 'pointer';
                    input.parentNode.replaceChild(h, input);
                    enableTitleEditing();
                }

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') finishSave();
                    if (e.key === 'Escape') cancelEdit();
                });
                // save on blur
                input.addEventListener('blur', finishSave);
            });
        } catch (e) { /* ignore */ }
    }

    function showPriceModal(cardEl, product, cb) {
        const overlay = createPriceModal();
        const currencyEl = overlay.querySelector('.price-display .currency');
        const amountEl = overlay.querySelector('.price-display .amount');
        const title = overlay.querySelector('#price-modal-title');
        const confirm = overlay.querySelector('#price-modal-confirm');
        const cancel = overlay.querySelector('#price-modal-cancel');
        const errorEl = overlay.querySelector('.price-modal-error');
        const keys = overlay.querySelectorAll('.price-keypad .key');

        // internal digits (cents) and display updater
        let digits = '';
        function updateDisplay() {
            const cents = digits === '' ? 0 : parseInt(digits, 10);
            const value = cents / 100;
            amountEl.textContent = value.toFixed(2);
            currencyEl.textContent = typeof currency === 'string' ? currency : '';
        }

        // set title and initialize
        title.textContent = product.name || 'Enter price';
        errorEl.textContent = '';
        digits = '';
        updateDisplay();
        overlay.classList.add('visible');

        // keyboard support: digits, Backspace, C, Enter, Escape
        function onKeyDown(e) {
            // if modal not visible ignore
            if (!overlay.classList.contains('visible')) return;
            const k = e.key;
            if (k >= '0' && k <= '9') {
                if (digits.length >= 9) return;
                digits = (digits === '0') ? k : digits + k;
                digits = digits.replace(/^0+(?=\d)/, '');
                updateDisplay();
                e.preventDefault();
                return;
            }
            if (k === 'Backspace') {
                digits = digits.slice(0, -1);
                updateDisplay();
                e.preventDefault();
                return;
            }
            if (k === 'c' || k === 'C') {
                digits = '';
                errorEl.textContent = '';
                updateDisplay();
                e.preventDefault();
                return;
            }
            if (k === 'Enter') {
                onConfirm();
                e.preventDefault();
                return;
            }
            if (k === 'Escape') {
                onCancel();
                e.preventDefault();
                return;
            }
        }

        document.addEventListener('keydown', onKeyDown);

        function onKeyClick(e) {
            const v = e.currentTarget.textContent;
            if (v === 'C') { digits = ''; errorEl.textContent = ''; updateDisplay(); return; }
            if (v === '⌫') { digits = digits.slice(0, -1); updateDisplay(); return; }
            if (digits.length >= 9) return; // prevent extremely long input
            // append digit
            digits = (digits === '0') ? v : digits + v;
            digits = digits.replace(/^0+(?=\d)/, '');
            updateDisplay();
        }

        keys.forEach(k => k.addEventListener('click', onKeyClick));

        function cleanup() {
            keys.forEach(k => k.removeEventListener('click', onKeyClick));
            confirm.removeEventListener('click', onConfirm);
            cancel.removeEventListener('click', onCancel);
            document.removeEventListener('keydown', onKeyDown);
            overlay.classList.remove('visible');
        }

        function onConfirm() {
            const cents = digits === '' ? 0 : parseInt(digits, 10);
            const val = cents / 100;
            if (isNaN(val) || val < 0) {
                errorEl.textContent = 'Please enter a valid non-negative price';
                return;
            }
            cleanup();
            cb(val);
        }

        function onCancel() { cleanup(); }

        confirm.addEventListener('click', onConfirm);
        cancel.addEventListener('click', onCancel);
    }

    // --- Variant selection modal ---
    function createVariantModal() {
        if (document.getElementById('variant-modal-overlay')) return document.getElementById('variant-modal-overlay');
        const overlay = document.createElement('div');
        overlay.id = 'variant-modal-overlay';
        overlay.className = 'variant-modal-overlay';
        overlay.innerHTML = `
            <div class="variant-modal" role="dialog" aria-modal="true">
                <div class="variant-modal-header">
                    <div class="variant-modal-title" id="variant-modal-title">Variants</div>
                    <button id="variant-modal-cancel" class="variant-btn icon" aria-label="Cancel">×</button>
                </div>
                <div class="variant-modal-body">
                    <div class="variant-list" id="variant-list"></div>
                    <div class="variant-modal-error" aria-live="polite"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // close on backdrop click and Escape
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.classList.remove('visible'); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && overlay.classList.contains('visible')) overlay.classList.remove('visible'); });

        return overlay;
    }

    function showVariantModal(product, variants, onSelect) {
        // variants: array of {id, name, sku, cost, price, quantity}
        const overlay = createVariantModal();
        const title = overlay.querySelector('#variant-modal-title');
        const list = overlay.querySelector('#variant-list');
        const errorEl = overlay.querySelector('.variant-modal-error');

        title.textContent = product.name || 'Select variant';
        errorEl.textContent = '';
        list.innerHTML = '';

        if (!Array.isArray(variants) || variants.length === 0) {
            errorEl.textContent = 'No variants available';
            return;
        }

        variants.forEach(v => {
            const item = document.createElement('button');
            item.className = 'variant-item';
            // Determine displayed price text (prefer price, fall back to cost).
            // If price is the literal string 'variable', do not display a price and show the price-entry modal on selection.
            let priceText = '';
            const isVariablePrice = (typeof v.price === 'string' && v.price.toLowerCase() === 'variable');
            if (!isVariablePrice) {
                if (v.price !== null && v.price !== undefined && !isNaN(parseFloat(v.price))) {
                    priceText = currency + parseFloat(v.price).toFixed(2);
                } else if (v.cost !== null && v.cost !== undefined && !isNaN(parseFloat(v.cost))) {
                    priceText = currency + parseFloat(v.cost).toFixed(2);
                }
            }
            // Determine stock indicator: prefer variant quantity; use variant.low_stock when available, otherwise product.low_stock
            let stockText = '';
            let stockClass = '';
            if (typeof v.quantity === 'number') {
                if (v.quantity <= 0) {
                    stockText = 'Out of stock';
                    stockClass = 'out-of-stock';
                } else {
                    const lowThresholdRaw = (v.low_stock !== null && v.low_stock !== undefined) ? v.low_stock : product.low_stock;
                    const lowThreshold = (lowThresholdRaw === null || lowThresholdRaw === undefined || lowThresholdRaw === '') ? null : parseInt(lowThresholdRaw, 10);
                    if (lowThreshold !== null && !isNaN(lowThreshold) && v.quantity <= lowThreshold) { stockText = 'Low stock'; stockClass = 'low-stock'; }
                }
            }

            // Build structured markup: left column (name + sku), right column (price above, stock below)
            item.innerHTML = `
                <div class="variant-left">
                    <div class="variant-name">${v.name || ('#' + (v.id || ''))}</div>
                    ${v.sku ? `<div class="variant-sku">${v.sku}</div>` : ''}
                </div>
                <div class="variant-right">
                    <div class="variant-price">${priceText}</div>
                    ${stockText ? `<div class="variant-stock ${stockClass}">${stockText}</div>` : `<div class="variant-stock empty"></div>`}
                </div>
            `;
            // If there's no stock text or no price text, vertically center the remaining content on the right column
            if (!stockText || !priceText) {
                item.classList.add('variant-center');
                // add centered class to right column after it's in the DOM
                // we'll add it after appending to list to ensure selector finds it
            }
            item.addEventListener('click', (ev) => {
                ev.preventDefault();
                // close modal and invoke callback with selected variant
                overlay.classList.remove('visible');
                if (typeof onSelect === 'function') onSelect(v);
            });
            list.appendChild(item);
            // center right-column content when either price or stock is missing
            if (!stockText || !priceText) {
                const vr = item.querySelector('.variant-right');
                if (vr) vr.classList.add('centered');
            }
        });

        // cancel button
        const cancel = overlay.querySelector('#variant-modal-cancel');
        function onCancel() { overlay.classList.remove('visible'); }
        cancel.addEventListener('click', onCancel);

        overlay.classList.add('visible');
    }

    // Update cart display
    function updateCartDisplay() {
        cartItems.innerHTML = '';
        let subtotal = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.quantity * item.unit_price;
            subtotal += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            const productTitle = item.name || '';
            const variantPrefix = item.variant ? (item.variant + ' | ') : '';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${productTitle}</h4>
                    <p>${variantPrefix}${currency}${item.unit_price.toFixed(2)} x ${item.quantity}</p>
                </div>
                <div class="cart-item-total">
                    <span>${currency}${itemTotal.toFixed(2)}</span>
                    <button class="remove-item-btn" data-index="${index}">×</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });

        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        subtotalEl.textContent = `${currency}${subtotal.toFixed(2)}`;
        taxEl.textContent = `${currency}${tax.toFixed(2)}`;
        totalEl.textContent = `${currency}${total.toFixed(2)}`;

        // Attach remove item listeners
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                removeFromCart(index);
            });
        });

        updateChange();
        // Update the right-side button label: when there are items allow saving the order,
        // otherwise show 'Saved Orders' (existing default). Keep click behavior unchanged.
        try {
            if (openOrdersBtn) {
                openOrdersBtn.textContent = cart.length > 0 ? 'Save Order' : 'Saved Orders';
            }
        } catch (e) { /* ignore UI update errors */ }
        // Update Sale More menu item enabled/disabled state based on cart size
        try {
            const saleMoreList = document.getElementById('sale-more-list');
            if (saleMoreList) {
                const cnt = Array.isArray(cart) ? cart.length : 0;
                const clearLi = saleMoreList.querySelector('li[data-action="clear"]');
                const splitLi = saleMoreList.querySelector('li[data-action="split"]');
                const mergeLi = saleMoreList.querySelector('li[data-action="merge"]');
                if (clearLi) {
                    clearLi.classList.toggle('disabled', cnt === 0);
                    clearLi.setAttribute('aria-disabled', cnt === 0 ? 'true' : 'false');
                }
                if (mergeLi) {
                    mergeLi.classList.toggle('disabled', cnt === 0);
                    mergeLi.setAttribute('aria-disabled', cnt === 0 ? 'true' : 'false');
                }
                if (splitLi) {
                    splitLi.classList.toggle('disabled', cnt < 2);
                    splitLi.setAttribute('aria-disabled', cnt < 2 ? 'true' : 'false');
                }
            }
        } catch (e) { /* ignore menu update errors */ }
    }

    // Remove item from cart
    function removeFromCart(index) {
        cart.splice(index, 1);
        updateCartDisplay();
    }

    // Parse a simple received-amount string that may contain additions/subtractions
    // e.g. "100+20-5" -> 115. This is intentionally simple and disallows any
    // characters except digits, +, -, dot and whitespace to avoid unsafe evaluation.
    function parseReceivedAmount(val) {
        const raw = String(val || '').trim();
        if (!raw) return NaN;
        // If the input contains only operators/spaces or ends with an operator
        // we consider it an in-progress arithmetic expression and do not parse it.
        if (/^[+\-*/\s]+$/.test(raw) || /[+\-*/]\s*$/.test(raw)) return NaN;
        // Allow digits, + - * / . and spaces only; otherwise try parseFloat fallback
        if (!/^[0-9+\-*/\.\s]+$/.test(raw)) {
            const p = parseFloat(raw);
            return isNaN(p) ? NaN : p;
        }

        // Tokenize supporting unary +/-, and binary + - * /
        const tokens = [];
        let i = 0;
        while (i < raw.length) {
            // skip spaces
            if (raw[i] === ' ') { i++; continue; }
            const ch = raw[i];
            // handle operator characters
            if (ch === '+' || ch === '-') {
                // Determine if unary: at start or after another operator
                const prev = tokens.length ? tokens[tokens.length - 1] : null;
                if (prev === null || (typeof prev === 'string' && /[+\-*/]/.test(prev))) {
                    // unary sign -> parse number with this sign
                    let j = i + 1;
                    // allow whitespace between sign and number
                    while (raw[j] === ' ') j++;
                    const m = raw.slice(j).match(/^\d+(?:\.\d+)?/);
                    if (!m) return NaN;
                    const numStr = ch + m[0];
                    tokens.push(parseFloat(numStr));
                    i = j + m[0].length;
                    continue;
                } else {
                    // binary plus/minus operator
                    tokens.push(ch);
                    i++;
                    continue;
                }
            }
            if (ch === '*' || ch === '/') {
                tokens.push(ch);
                i++;
                continue;
            }
            // number
            if (/[0-9\.]/.test(ch)) {
                const m = raw.slice(i).match(/^\d+(?:\.\d+)?/);
                if (!m) return NaN;
                tokens.push(parseFloat(m[0]));
                i += m[0].length;
                continue;
            }

            // anything else invalid
            return NaN;
        }

        if (tokens.length === 0) return NaN;

        // First pass: handle * and / left-to-right
        const reduced = [];
        let idx = 0;
        while (idx < tokens.length) {
            const t = tokens[idx];
            if (t === '*' || t === '/') {
                // operator must have a left value in reduced and a right numeric token
                const left = reduced.pop();
                const right = tokens[idx + 1];
                if (typeof left !== 'number' || typeof right !== 'number') return NaN;
                let res;
                if (t === '*') res = left * right;
                else {
                    if (right === 0) return NaN;
                    res = left / right;
                }
                reduced.push(res);
                idx += 2;
            } else {
                reduced.push(t);
                idx += 1;
            }
        }

        // Second pass: handle + and - left-to-right (reduced should alternate number, operator, number...)
        let result = reduced[0];
        if (typeof result !== 'number') return NaN;
        idx = 1;
        while (idx < reduced.length) {
            const op = reduced[idx];
            const num = reduced[idx + 1];
            if (typeof num !== 'number' || (op !== '+' && op !== '-')) return NaN;
            if (op === '+') result = result + num;
            else result = result - num;
            idx += 2;
        }

        return result;
    }

    // Update change amount
    function updateChange() {
        let total = parseFloat(String(totalEl.textContent || '').replace(currency, '').replace(/,/g, '').trim());
        if (isNaN(total)) total = 0;
        const raw = String(amountReceived.value || '').trim();
        // If the input is empty, show zero
        if (!raw) {
            changeEl.textContent = `${currency}0.00`;
            changeEl.style.color = '';
            return;
        }
        // If the input looks like an in-progress arithmetic entry (only operators
        // or ends with an operator), show blank to indicate it's incomplete.
        if (/^[+\-*/\s]+$/.test(raw) || /[+\-*/]\s*$/.test(raw)) {
            changeEl.textContent = '';
            changeEl.style.color = '';
            return;
        }
        const received = parseReceivedAmount(raw);
        if (isNaN(received)) {
            changeEl.textContent = `${currency}0.00`;
            changeEl.style.color = '';
            return;
        }
        const change = received - total;
        // Show negative change when amount received is less than total.
        if (change >= 0) {
            changeEl.textContent = `${currency}${change.toFixed(2)}`;
            changeEl.style.color = '';
        } else {
            changeEl.textContent = `-${currency}${Math.abs(change).toFixed(2)}`;
            // visually indicate shortfall in red
            try { changeEl.style.color = '#ff6b6b'; } catch (e) {}
        }
    }

    // Product search
    productSearch.addEventListener('input', function () {
        const searchTerm = productSearch.value.trim();
        if (searchTerm.length >= 2) {
            fetchProducts(searchTerm, currentCategory);
        } else if (searchTerm.length === 0) {
            fetchProducts('', currentCategory);
        }
    });

    // Search toggle: icon-only that expands the search input and hides other toggles
    const searchToggle = document.getElementById('search-toggle');
    const searchRow = document.querySelector('.search-row');
    function openSearch() {
        if (!searchRow) return;
        searchRow.classList.add('search-open');
        // focus input after a short delay to allow transition
        setTimeout(() => productSearch.focus(), 200);
        // add document listener to collapse when clicking outside
        document.addEventListener('click', outsideClickHandler);
        document.addEventListener('keydown', escHandler);
    }
    function closeSearch() {
        if (!searchRow) return;
        searchRow.classList.remove('search-open');
        document.removeEventListener('click', outsideClickHandler);
        document.removeEventListener('keydown', escHandler);
    }
    function outsideClickHandler(e) {
        if (!searchRow) return;
        const within = searchRow.contains(e.target);
        if (!within) closeSearch();
    }
    function escHandler(e) {
        if (e.key === 'Escape') closeSearch();
    }
    if (searchToggle) {
        searchToggle.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const isOpen = searchRow && searchRow.classList.contains('search-open');
            if (isOpen) {
                closeSearch();
            } else {
                openSearch();
            }
        });
    }

    // --- View mode toggle (single button) ---
    const viewToggleBtn = document.getElementById('view-toggle-btn');
    const VIEW_KEY = 'pos_view_mode'; // 'grid' | 'list'

    function applyViewMode(mode) {
        if (!productGrid) return;
        const isList = mode === 'list';
        if (isList) {
            productGrid.classList.add('list-mode');
        } else {
            productGrid.classList.remove('list-mode');
        }
        // update button icon/state
        if (viewToggleBtn) {
            const icon = viewToggleBtn.querySelector('i');
            if (icon) {
                icon.className = isList ? 'fa fa-list' : 'fa fa-th';
                viewToggleBtn.setAttribute('title', isList ? 'Switch to grid view' : 'Switch to list view');
            }
            viewToggleBtn.setAttribute('aria-pressed', isList ? 'true' : 'false');
            viewToggleBtn.classList.toggle('active', isList);
        }
        try { localStorage.setItem(VIEW_KEY, mode); } catch (e) { /* ignore */ }
        // Adjust DOM placement of price elements so list-mode shows price before the favourite
        // and grid-mode restores original placement.
        try { adjustPricesForListMode(isList); } catch (e) { /* ignore */ }
    }

    // Move `.product-price` into `.card-bottom` while in list-mode so the price appears
    // to the right (just before the favourite). When switching back to grid-mode, move
    // the price back to its original parent (stored on the element).
    function adjustPricesForListMode(isList) {
        if (!productGrid) return;
        const cards = productGrid.querySelectorAll('.product-card');
        cards.forEach(card => {
            const cardBottom = card.querySelector('.card-bottom');
            const cardDetails = card.querySelector('.card-details');

            // Handle stock-status movement first so it runs even when a product
            // has no price element (e.g. variable price). This prevents the
            // badge from remaining over the name.
            try {
                const stockEl = card.querySelector('.stock-status');
                if (stockEl) {
                    // store original parent marker for restore
                    if (!stockEl.dataset.origParent) {
                        const sp = stockEl.parentElement;
                        if (sp) {
                            if (sp.classList.contains('card-middle')) stockEl.dataset.origParent = 'card-middle';
                            else if (sp.classList.contains('card-bottom')) stockEl.dataset.origParent = 'card-bottom';
                            else if (sp.classList.contains('card-details')) stockEl.dataset.origParent = 'card-details';
                            else stockEl.dataset.origParent = 'other';
                        }
                    }

                    if (isList) {
                        let center = card.querySelector('.card-center');
                        if (!center) {
                            center = document.createElement('div');
                            center.className = 'card-center';
                            // insert the center container just before cardBottom
                            if (cardBottom && cardBottom.parentElement) cardBottom.parentElement.insertBefore(center, cardBottom);
                            else card.appendChild(center);
                        }
                        if (stockEl.parentElement !== center) {
                            center.appendChild(stockEl);
                            stockEl.dataset.stockMoved = '1';
                        }
                    } else {
                        // restore to original location when leaving list-mode
                        const orig = stockEl.dataset.origParent;
                        if (orig === 'card-middle' && card.querySelector('.card-middle') && stockEl.parentElement !== card.querySelector('.card-middle')) {
                            const cm = card.querySelector('.card-middle');
                            const cd = cm.querySelector('.card-details');
                            // place stock BEFORE the card-details so it appears above the name
                            if (cd) cm.insertBefore(stockEl, cd);
                            else cm.insertBefore(stockEl, cm.firstChild);
                            delete stockEl.dataset.stockMoved;
                        } else if (orig === 'card-bottom' && cardBottom && stockEl.parentElement !== cardBottom) {
                            cardBottom.appendChild(stockEl);
                            delete stockEl.dataset.stockMoved;
                        } else if (orig === 'card-details' && cardDetails && stockEl.parentElement !== cardDetails) {
                            // keep stock at the top of card-details if possible
                            cardDetails.insertBefore(stockEl, cardDetails.firstChild);
                            delete stockEl.dataset.stockMoved;
                        } else if (!orig && card.querySelector('.card-middle')) {
                            const cm = card.querySelector('.card-middle');
                            const cd = cm.querySelector('.card-details');
                            if (cd) cm.insertBefore(stockEl, cd);
                            else cm.insertBefore(stockEl, cm.firstChild);
                            delete stockEl.dataset.stockMoved;
                        }
                        // remove empty center container if present
                        const existingCenter = card.querySelector('.card-center');
                        if (existingCenter && existingCenter.children.length === 0) existingCenter.remove();
                    }
                }
            } catch (e) { /* ignore stock movement errors */ }

            // Ensure image-card product name (<h4>) also moves when toggling
            // so that grid/list renderings keep the name in the expected container.
            try {
                const nameEl = card.querySelector('h4');
                if (nameEl) {
                    // store original parent marker for restore
                    if (!nameEl.dataset.origParent) {
                        const np = nameEl.parentElement;
                        if (np) {
                            if (np.classList.contains('card-details')) nameEl.dataset.origParent = 'card-details';
                            else if (np.classList.contains('card-bottom')) nameEl.dataset.origParent = 'card-bottom';
                            else if (np.classList.contains('card-middle')) nameEl.dataset.origParent = 'card-middle';
                            else nameEl.dataset.origParent = 'other';
                        }
                    }

                    if (isList) {
                        // target details container inside the middle area
                        let targetDetails = card.querySelector('.card-details');
                        if (!targetDetails) {
                            // ensure card-middle exists
                            let cm = card.querySelector('.card-middle');
                            if (!cm) {
                                const overlay = card.querySelector('.card-overlay') || card;
                                cm = document.createElement('div');
                                cm.className = 'card-middle column';
                                if (overlay && overlay.firstChild) overlay.insertBefore(cm, overlay.querySelector('.card-bottom'));
                                else if (overlay) overlay.appendChild(cm);
                            }
                            targetDetails = document.createElement('div');
                            targetDetails.className = 'card-details';
                            cm.appendChild(targetDetails);
                        }

                        if (nameEl.parentElement !== targetDetails) {
                            targetDetails.appendChild(nameEl);
                            nameEl.dataset.nameMoved = '1';
                        }
                    } else {
                        // restore to original location when leaving list-mode
                        const orig = nameEl.dataset.origParent;
                        const isImage = !!card.querySelector('.card-bg.bg-image');
                        const cb = card.querySelector('.card-bottom');

                        // If this is an image card, prefer placing the name into
                        // card-bottom above the price so it stays just above the price
                        // and does not overlap the stock badge in the middle.
                        if (isImage && cb) {
                            const priceSibling = cb.querySelector('.product-price');
                            if (priceSibling) {
                                if (nameEl.parentElement !== cb) cb.insertBefore(nameEl, priceSibling);
                            } else {
                                if (nameEl.parentElement !== cb) cb.appendChild(nameEl);
                            }
                        } else if (orig === 'card-details') {
                            const cd = card.querySelector('.card-details');
                            if (cd && nameEl.parentElement !== cd) cd.appendChild(nameEl);
                        } else if (orig === 'card-middle') {
                            const cm = card.querySelector('.card-middle');
                            if (cm && nameEl.parentElement !== cm) cm.appendChild(nameEl);
                        } else if (orig === 'card-bottom') {
                            const cb2 = card.querySelector('.card-bottom');
                            if (cb2 && nameEl.parentElement !== cb2) cb2.appendChild(nameEl);
                        } else {
                            // fallback: append to card-bottom
                            const cb3 = card.querySelector('.card-bottom');
                            if (cb3 && nameEl.parentElement !== cb3) cb3.appendChild(nameEl);
                        }
                        delete nameEl.dataset.nameMoved;
                    }
                }
            } catch (e) { /* ignore name movement errors */ }

            const priceEl = card.querySelector('.product-price');
            if (!priceEl) return;

            // Store original parent marker so we can restore when returning to grid
            if (!priceEl.dataset.origParent) {
                const p = priceEl.parentElement;
                if (p) {
                    if (p.classList.contains('card-details')) priceEl.dataset.origParent = 'card-details';
                    else if (p.classList.contains('card-bottom')) priceEl.dataset.origParent = 'card-bottom';
                    else if (p.classList.contains('card-middle')) priceEl.dataset.origParent = 'card-middle';
                    else priceEl.dataset.origParent = 'other';
                }
            }

            if (isList) {
                // Move the price into the right-hand block (.card-bottom) so it visually sits
                // before the absolutely-positioned favourite button.
                if (cardBottom && priceEl.parentElement !== cardBottom) {
                    cardBottom.appendChild(priceEl);
                    priceEl.dataset.moved = '1';
                }
            } else {
                // Grid: try to restore to original location if known
                const orig = priceEl.dataset.origParent;
                const isImage = !!card.querySelector('.card-bg.bg-image');
                const isTriangle = !!card.querySelector('.card-bg.bg-shape.triangle');

                if (orig === 'card-details' && cardDetails && priceEl.parentElement !== cardDetails) {
                    cardDetails.appendChild(priceEl);
                    delete priceEl.dataset.moved;
                } else if (orig === 'card-bottom') {
                    // If the saved origin is card-bottom but the card is a regular
                    // shape (not an image and not a triangle), the grid layout
                    // expects the price inside card-details. Restore there to
                    // avoid hiding the price in a grid (card-bottom prices are
                    // typically hidden in grid CSS).
                    if (!isImage && !isTriangle && cardDetails && priceEl.parentElement !== cardDetails) {
                        cardDetails.appendChild(priceEl);
                        delete priceEl.dataset.moved;
                    } else if (cardBottom && priceEl.parentElement !== cardBottom) {
                        cardBottom.appendChild(priceEl);
                        delete priceEl.dataset.moved;
                    }
                } else if (!orig) {
                    // No recorded origin: prefer cardDetails for non-image shapes,
                    // otherwise fallback to cardBottom so images keep bottom layout.
                    if (!isImage && cardDetails && priceEl.parentElement !== cardDetails) {
                        cardDetails.appendChild(priceEl);
                        delete priceEl.dataset.moved;
                    } else if (cardBottom && priceEl.parentElement !== cardBottom) {
                        cardBottom.appendChild(priceEl);
                        delete priceEl.dataset.moved;
                    }
                }
            }

            // Special-case: triangle-shaped cards display price at the top area of
            // the triangle in grid mode. Move the price into `.card-middle` as
            // the first child so it appears above the name while leaving the
            // name's position intact. Mark with `triangleMoved` so we can
            // identify and clean up when switching views.
            try {
                const isTriangle = !!card.querySelector('.card-bg.bg-shape.triangle');
                const cardMiddle = card.querySelector('.card-middle');
                if (!isList && isTriangle && priceEl && cardMiddle) {
                    if (priceEl.parentElement !== cardMiddle) {
                        cardMiddle.insertBefore(priceEl, cardMiddle.firstChild);
                        priceEl.dataset.triangleMoved = '1';
                    }
                } else if (priceEl && priceEl.dataset.triangleMoved && isList) {
                    // switching to list-mode will move price to card-bottom; clear marker
                    delete priceEl.dataset.triangleMoved;
                }
            } catch (e) { /* ignore triangle position errors */ }

            // Ensure if both name and price end up inside `.card-bottom` we
            // place the name before the price so the visual order matches
            // the intended grid layout. This avoids cases where append order
            // during restore leaves the price above the name.
            try {
                const nameEl = card.querySelector('h4');
                const priceElFinal = card.querySelector('.product-price');
                const cbFinal = card.querySelector('.card-bottom');
                if (cbFinal && nameEl && priceElFinal && nameEl.parentElement === cbFinal && priceElFinal.parentElement === cbFinal) {
                    const children = Array.from(cbFinal.children);
                    if (children.indexOf(priceElFinal) < children.indexOf(nameEl)) {
                        cbFinal.insertBefore(nameEl, priceElFinal);
                    }
                }
            } catch (e) { /* ignore ordering fixes */ }
        });
    }

    if (viewToggleBtn) {
        viewToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentlyList = productGrid && productGrid.classList.contains('list-mode');
            applyViewMode(currentlyList ? 'grid' : 'list');
        });
    }

    // apply saved preference (if any) before first render
    try {
        const saved = localStorage.getItem(VIEW_KEY);
        if (saved === 'list') applyViewMode('list');
        else applyViewMode('grid');
    } catch (e) {
        // ignore localStorage errors and default to grid
        applyViewMode('grid');
    }

    // Right-side search submit button behavior
    const searchSubmit = document.getElementById('search-submit');
    if (searchSubmit) {
        searchSubmit.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const q = productSearch.value.trim();
            fetchProducts(q.length >= 2 ? q : '', currentCategory);
            // keep the input focused for quick consecutive searches
            productSearch.focus();
        });
    }

    // allow Enter key to submit when the input is focused
    productSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = productSearch.value.trim();
            fetchProducts(q.length >= 2 ? q : '', currentCategory);
        }
    });

    // Category toggle behavior
    if (categoryToggle && categoryList) {
        // Fetch categories from inventory API and populate the category list
        function fetchCategories() {
            // inventory api sits one folder up (pages/inventory/api.php)
            fetch('../inventory/api.php?categories=1', { credentials: 'same-origin' })
                .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to load categories')))
                .then(data => {
                    if (!Array.isArray(data)) return;
                    // remove any existing category items except the default 'All Items' (data-category="all")
                    const existingDefault = categoryList.querySelector('li[data-category="all"]');
                    categoryList.innerHTML = '';
                    // Re-add default and two special entries (Favourites, Discount)
                    const allLi = document.createElement('li');
                    allLi.setAttribute('data-category', 'all');
                    allLi.className = 'active';
                    allLi.textContent = 'All Items';
                    categoryList.appendChild(allLi);

                    // Special (not real categories) entries
                    const favLi = document.createElement('li');
                    favLi.setAttribute('data-category', 'favourites');
                    favLi.textContent = 'Favourites';
                    categoryList.appendChild(favLi);

                    const discLi = document.createElement('li');
                    discLi.setAttribute('data-category', 'discounts');
                    discLi.textContent = 'Discount';
                    categoryList.appendChild(discLi);

                    // Add fetched categories after the special items
                    data.forEach(cat => {
                        if (typeof cat !== 'string') return;
                        const li = document.createElement('li');
                        li.setAttribute('data-category', cat);
                        li.textContent = cat;
                        categoryList.appendChild(li);
                    });
                })
                .catch(err => {
                    console.warn('Unable to fetch categories for POS:', err);
                    // leave existing items as-is if fetch fails
                });
        }
        // initial population
        fetchCategories();

        categoryToggle.addEventListener('click', (e) => {
            // When opening the dropdown, move the currently active item to the top
            // so the user's current selection appears first.
            const active = categoryList.querySelector('li.active');
            if (active && categoryList.firstElementChild !== active) {
                try {
                    categoryList.insertBefore(active, categoryList.firstElementChild);
                } catch (err) {
                    // ignore DOM reordering errors
                    console.warn('Could not reorder category list', err);
                }
            }
            const hidden = categoryList.getAttribute('aria-hidden') === 'true';
            categoryList.setAttribute('aria-hidden', String(!hidden));
            e.stopPropagation();
        });

        // Scan button behavior (fallback manual input). If you later add camera scanning,
        // replace this handler with the scanner flow.
        const scanBtn = document.getElementById('scan-btn');
        if (scanBtn) {
            scanBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                // simple fallback: prompt user to paste/enter scanned barcode or SKU
                const val = window.prompt('Scan or enter barcode / SKU:', '');
                if (val && val.trim()) {
                    productSearch.value = val.trim();
                    // trigger search immediately
                    if (productSearch.value.length >= 2) fetchProducts(productSearch.value, currentCategory);
                    else fetchProducts('', currentCategory);
                } else {
                    // focus the input so hardware scanner (keyboard HID) can type into it
                    productSearch.focus();
                }
            });
        }
        // clicking a category
        categoryList.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            // mark active
            categoryList.querySelectorAll('li').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
            const cat = li.getAttribute('data-category') || 'all';
            currentCategory = cat;
            // update button label without destroying chevron span
            // if the toggle has been split into a label + chevron, update only the label text
            try {
                const labelEl = categoryToggle.querySelector && categoryToggle.querySelector('.toggle-label');
                const chevronEl = categoryToggle.querySelector && categoryToggle.querySelector('.toggle-chevron');
                if (labelEl) {
                    labelEl.textContent = (li.textContent || 'All Items');
                    // ensure chevron remains visible; if missing, append a simple chevron node
                    if (!chevronEl) {
                        const chev = document.createElement('span');
                        chev.className = 'toggle-chevron';
                        chev.textContent = ' ▾';
                        categoryToggle.appendChild(chev);
                    }
                } else {
                    // fallback for older markup: replace text content (preserves behaviour)
                    categoryToggle.textContent = (li.textContent || 'All Items') + ' ▾';
                }
            } catch (err) {
                // if anything goes wrong, fallback to simple text update
                try { categoryToggle.textContent = (li.textContent || 'All Items') + ' ▾'; } catch(e) { /* ignore */ }
            }
            categoryList.setAttribute('aria-hidden', 'true');
            // refetch products with category
            const q = productSearch.value.trim();
            fetchProducts(q.length >= 2 ? q : '', currentCategory);
        });
        // close when clicking outside
        document.addEventListener('click', () => {
            if (categoryList.getAttribute('aria-hidden') === 'false') categoryList.setAttribute('aria-hidden', 'true');
        });
    }

    // Payment method selection
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paymentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPaymentMethod = btn.getAttribute('data-method');
        });
    });

    // Amount received input
    // Sanitize input to allow only digits, operators (+ - * /), decimal point and spaces.
    // Respect programmatic updates so autofill does not mark the field as user-edited.
    amountReceived.addEventListener('input', function sanitizeAmountInput(e) {
        try {
            // If we're setting the value programmatically, do not treat this as a user edit
            if (programmaticAmountUpdate) {
                // clear the flag and ignore marking user-edited; keep quick-replace state
                programmaticAmountUpdate = false;
                return;
            }

            // mark that the user has edited the field so we don't overwrite their input
            amountUserEdited = true;
            // user input cancels the quick-replace state
            lastQuickReplaced = false;

            const raw = String(amountReceived.value || '');
            const sanitized = raw.replace(/[^0-9+\-*/\.\s]/g, '');
            if (sanitized !== raw) {
                // attempt to preserve caret position
                const start = amountReceived.selectionStart || 0;
                const diff = raw.length - sanitized.length;
                const newPos = Math.max(0, start - diff);
                amountReceived.value = sanitized;
                try { amountReceived.setSelectionRange(newPos, newPos); } catch (err) { /* ignore */ }
            }
        } catch (err) { /* ignore sanitize errors */ }
    });

    amountReceived.addEventListener('input', updateChange);

    // Show/hide the clear button based on whether there is any input
    function updateAmountClearVisibility() {
        try {
            const btn = document.getElementById('amount-clear-btn');
            if (!btn) return;
            const has = String(amountReceived.value || '').trim().length > 0;
            btn.style.display = has ? 'inline-flex' : 'none';
        } catch (e) { /* ignore */ }
    }

    // ensure visibility updates on input
    amountReceived.addEventListener('input', updateAmountClearVisibility);

    // Clear amount button behavior
    try {
        const amountClearBtn = document.getElementById('amount-clear-btn');
        if (amountClearBtn) {
            amountClearBtn.addEventListener('click', (e) => {
                try {
                    // Programmatic clear so sanitizer does not mark as user edit
                    programmaticAmountUpdate = true;
                    amountReceived.value = '';
                    // reset user-edit and quick-replace state
                    amountUserEdited = false;
                    lastQuickReplaced = false;
                    // run change update and focus the input
                    updateChange();
                    updateAmountClearVisibility();
                    try { amountReceived.focus(); } catch (e) {}
                } catch (err) { /* ignore */ }
            });
        }
    } catch (e) { /* ignore wiring errors */ }

    // Quick-amount buttons: clicking these adds the amount to the received value.
    // Uses programmaticAmountUpdate so sanitizer does not mark this as a user edit.
    try {
        const quickContainer = document.getElementById('quick-amounts');
        if (quickContainer) {
            quickContainer.addEventListener('click', (ev) => {
                try {
                    const btn = ev.target.closest && ev.target.closest('.quick-amount');
                    if (!btn) return;
                    const amt = parseFloat(btn.getAttribute('data-amount'));
                    if (isNaN(amt)) return;

                    // If the user has NOT manually edited the amount field, replace
                    // the current (auto-filled) value with the clicked amount. If the
                    // user has edited the field, keep additive behaviour (sum).
                        if (!amountUserEdited) {
                            // If this is the first quick-button interaction since auto-fill,
                            // replace the auto-filled value. Subsequent quick clicks add.
                            if (!lastQuickReplaced) {
                                programmaticAmountUpdate = true;
                                amountReceived.value = Number(amt).toFixed(2);
                                lastQuickReplaced = true;
                                updateChange();
                                updateAmountClearVisibility();
                                return;
                            }
                            // otherwise fallthrough to additive behavior
                        }

                        // Additive behavior: attempt to parse and add; fall back to replacement
                        let current = parseReceivedAmount(String(amountReceived.value || ''));
                        if (isNaN(current)) current = 0;
                        const newVal = current + amt;
                        programmaticAmountUpdate = true;
                        amountReceived.value = Number(newVal).toFixed(2);
                        // after an additive quick-click we consider the quick-replace state true
                        lastQuickReplaced = true;
                        updateChange();
                        updateAmountClearVisibility();
                } catch (e) { /* ignore individual button errors */ }
            });
        }
    } catch (e) { /* ignore wiring errors */ }

    // Complete sale
    completeSaleBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showToast('Cart is empty!', 'warning');
            return;
        }

        // compute totals locally to avoid relying on DOM values
        const subtotal = cart.reduce((s, it) => s + ((parseFloat(it.unit_price) || 0) * (parseInt(it.quantity) || 0)), 0);
        const tax = subtotal * taxRate;
        const total = parseFloat((subtotal + tax).toFixed(2));

        const received = parseReceivedAmount(amountReceived.value);

        // If the received amount is not a valid number (including in-progress expressions)
        // don't allow completing the sale.
        if (isNaN(received)) {
            showToast('Please enter a valid payment amount.', 'error');
            return;
        }

        if (selectedPaymentMethod === 'cash' && received < total) {
            showToast('Insufficient payment amount!', 'error');
            return;
        }

        // prepare payload. include optional metadata for server logging/receipt
        const saleData = {
            items: cart.map(i => ({ product_id: i.product_id || null, unit_price: parseFloat(i.unit_price) || 0, quantity: parseInt(i.quantity) || 0, name: i.name || '', variant: i.variant || null })),
            payment_method: selectedPaymentMethod,
            channel: 'in-store',
            subtotal: subtotal,
            tax: tax,
            total_amount: total,
            amount_received: received,
            change: parseFloat((received - total).toFixed(2)),
            reference: currentOrderRef || null,
            cart_mode: (function(){ try { return localStorage.getItem(CART_MODE_KEY) || 'dinein'; } catch(e){ return 'dinein'; } })()
        };

        // disable button while processing
        try { completeSaleBtn.disabled = true; completeSaleBtn.classList.add('disabled'); } catch (e) {}

        fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(saleData)
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.success) {
                showToast('Sale completed — ID: ' + (data.sale_id || data.saleId || ''), 'success');
                try { clearCart(); } catch (e) {}
            } else {
                showToast('Error completing sale: ' + (data && data.error ? data.error : 'Unknown'), 'error');
            }
        })
        .catch(err => {
            console.error('Complete sale error', err);
            showToast('Network error: could not complete sale', 'error');
        })
        .finally(() => { try { completeSaleBtn.disabled = false; completeSaleBtn.classList.remove('disabled'); } catch (e) {} });
    });

    // Save / Saved Orders button behavior
    if (openOrdersBtn) {
        openOrdersBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            if (cart && cart.length > 0) {
                    // Prepare a save function that accepts an optional reference
                    function doSave(refVal) {
                        const subtotal = cart.reduce((s, it) => s + (it.unit_price * it.quantity), 0);
                        const tax = subtotal * taxRate;
                        const total = subtotal + tax;
                        const payload = {
                            ref: refVal ? String(refVal).trim() : null,
                            items: cart,
                            subtotal: subtotal,
                            tax: tax,
                            total: total,
                            payment_method: selectedPaymentMethod
                        };
                        // include cart mode (dinein|takeout|delivery)
                        try {
                            const cm = (function(){ try { return localStorage.getItem(CART_MODE_KEY); } catch(e){ return null; } })() || 'dinein';
                            payload.cart_mode = cm;
                        } catch (e) { payload.cart_mode = 'dinein'; }
                        // include order_id when updating an existing saved order
                        if (typeof currentOrderId !== 'undefined' && currentOrderId) payload.order_id = currentOrderId;
                        fetch('save_order_api.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                            credentials: 'same-origin'
                        })
                        .then(res => res.ok ? res.json() : Promise.reject(new Error('Network error')))
                        .then(json => {
                            if (json && json.success) {
                                showToast('Order saved. ID: ' + (json.order_id || 'n/a'), 'success');
                                clearCart();
                                // reset payment method to cash and cart mode to dinein (persist)
                                try {
                                    selectedPaymentMethod = 'cash';
                                    try { paymentBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-method') === 'cash')); } catch (e) {}
                                    try { setCartMode('dinein', true); } catch (e) {}
                                } catch (e) { /* ignore reset errors */ }
                            } else {
                                // fallback: notify and keep cart intact
                                showToast('Could not save order: ' + (json && json.error ? json.error : 'Unknown'), 'error');
                            }
                        })
                        .catch(err => {
                            // fallback: save locally and notify
                            try {
                                const key = 'pos_open_orders';
                                let open = [];
                                try { open = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { open = []; }
                                open.push({ id: Date.now(), ref: refVal || null, items: cart.slice(), subtotal, tax, total, created_at: new Date().toISOString() });
                                localStorage.setItem(key, JSON.stringify(open));
                                showToast('Order saved locally (server unreachable).', 'warning');
                                clearCart();
                                // reset payment method to cash and cart mode to dinein (persist)
                                try {
                                    selectedPaymentMethod = 'cash';
                                    try { paymentBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-method') === 'cash')); } catch (e) {}
                                    try { setCartMode('dinein', true); } catch (e) {}
                                } catch (e) { /* ignore reset errors */ }
                            } catch (e2) {
                                showToast('Failed to save order: ' + e2.message, 'error');
                            }
                        });
                    }

                    // If this cart was loaded from an existing saved order, save directly (no ref prompt).
                    if (typeof currentOrderId !== 'undefined' && currentOrderId) {
                        doSave(currentOrderRef || null);
                    } else {
                        // show modal to collect optional reference
                        showSaveOrderModal((refVal) => doSave(refVal), function(){ /* cancelled */ });
                    }
                    return;
                }

            // If cart empty -> open list of saved orders
            fetch('open_orders_api.php', { credentials: 'same-origin' })
                .then(res => res.ok ? res.json() : Promise.reject(new Error('Network error')))
                .then(json => {
                    if (json && json.success) {
                        showOpenOrdersModal(json.orders || []);
                    } else {
                        alert('Could not load orders');
                    }
                })
                .catch(err => {
                    // try localStorage fallback
                    try {
                        const key = 'pos_open_orders';
                        const open = JSON.parse(localStorage.getItem(key) || '[]');
                        showOpenOrdersModal(open || []);
                    } catch (e) {
                        alert('Could not load orders: ' + err.message);
                    }
                });
        });
    }

    function clearCart() {
        cart = [];
        updateCartDisplay();
        amountReceived.value = '';
    amountUserEdited = false;
    programmaticAmountUpdate = false;
    lastQuickReplaced = false;
    changeEl.textContent = `${currency}0.00`;
        try {
            const titleEl = document.getElementById('current-sale-title');
            if (titleEl) titleEl.textContent = 'Current Sale';
        } catch (e) { /* ignore */ }
        // clear tracked order info
        currentOrderId = null;
        currentOrderRef = null;
    }

    // --- Saved Orders modal (list saved orders) ---
    let openOrdersCache = [];
    let openOrdersSort = 'time'; // 'name' | 'amount' | 'time' | 'employee'
    let openOrdersSearch = '';

    function createOpenOrdersModal() {
        if (document.getElementById('open-orders-overlay')) return document.getElementById('open-orders-overlay');
        const overlay = document.createElement('div');
        overlay.id = 'open-orders-overlay';
        overlay.className = 'confirm-modal-overlay';
        overlay.innerHTML = `
            <div class="confirm-modal" role="dialog" aria-modal="true">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <button id="open-orders-close" class="confirm-btn">×</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex:1;">
                        <h3 style="margin:0;flex:1">Saved Orders</h3>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <button id="open-orders-continue" class="confirm-btn primary" style="display:none;margin-left:6px;">Continue</button>
                    </div>
                </div>
                <div id="open-orders-controls" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <div style="flex:1;display:flex;align-items:center;">
                        <label class="table-checkbox" style="margin-left:4px;display:inline-flex;align-items:center;gap:8px;">
                            <input id="open-orders-select-all" type="checkbox" />
                            <span class="checkmark"></span>
                        </label>
                    </div>
                    <div id="open-orders-icons" style="display:flex;align-items:center;gap:8px;justify-content:flex-end;">
                        <button id="open-orders-bulk-delete" class="confirm-btn" style="display:none;margin-right:6px;" title="Delete selected"><i class="fa fa-trash" aria-hidden="true"></i></button>
                        <button id="open-orders-merge" class="confirm-btn" style="display:none;margin-right:6px;" title="Merge selected" aria-label="Merge selected"><i class="fas fa-compress-arrows-alt"></i></button>
                        <div style="position:relative;">
                            <button id="open-orders-sort-btn" class="confirm-btn" title="Sort"> <i class="fa fa-sort" aria-hidden="true"></i> </button>
                            <ul id="open-orders-sort-list" style="position:absolute;right:0;top:36px;display:none;background:#121212;border:1px solid #2a2a2a;border-radius:6px;list-style:none;padding:6px;margin:0;z-index:10000;min-width:140px;">
                                <li data-sort="name" style="padding:6px 10px;cursor:pointer;color:#e6e6e6">Name</li>
                                <li data-sort="amount" style="padding:6px 10px;cursor:pointer;color:#e6e6e6">Amount</li>
                                <li data-sort="time" style="padding:6px 10px;cursor:pointer;color:#e6e6e6">Time</li>
                                <li data-sort="employee" style="padding:6px 10px;cursor:pointer;color:#e6e6e6">Employee</li>
                            </ul>
                        </div>
                        
                        <div style="position:relative;">
                            <button id="open-orders-search-btn" class="confirm-btn" title="Search"> <i class="fa fa-search" aria-hidden="true"></i> </button>
                        </div>
                    </div>
                    <input id="open-orders-search" type="text" placeholder="Search orders..." style="flex:1;padding:8px;border-radius:6px;border:1px solid #2a2a2a;display:none;background:#111;color:#fff" />
                </div>
                <div id="open-orders-list" style="max-height:360px;overflow:auto;padding:6px 4px;"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.classList.remove('visible'); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && overlay.classList.contains('visible')) overlay.classList.remove('visible'); });

        // wire sort/search/select/bulk-delete behavior
        setTimeout(() => {
            const sortBtn = overlay.querySelector('#open-orders-sort-btn');
            const sortList = overlay.querySelector('#open-orders-sort-list');
            const searchBtn = overlay.querySelector('#open-orders-search-btn');
            const searchInput = overlay.querySelector('#open-orders-search');
            const iconsContainer = overlay.querySelector('#open-orders-icons');
            const selectAll = overlay.querySelector('#open-orders-select-all');
            const bulkDelete = overlay.querySelector('#open-orders-bulk-delete');
            const mergeBtn = overlay.querySelector('#open-orders-merge');
            const continueBtn = overlay.querySelector('#open-orders-continue');

            if (sortBtn && sortList) {
                sortBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const visible = sortList.style.display !== 'none';
                    sortList.style.display = visible ? 'none' : 'block';
                });
                // choose sort
                sortList.querySelectorAll('li').forEach(li => {
                    li.addEventListener('click', (ev) => {
                        const s = li.getAttribute('data-sort');
                        openOrdersSort = s || 'time';
                        sortList.style.display = 'none';
                        renderOpenOrdersList(openOrdersCache);
                    });
                });
                // close sort dropdown when clicking outside
                document.addEventListener('click', (ev) => { if (sortList && !sortList.contains(ev.target) && !sortBtn.contains(ev.target)) sortList.style.display = 'none'; });
            }

            if (searchBtn && searchInput) {
                searchBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const showing = searchInput.style.display !== 'none';
                    if (!showing) {
                        // show input and hide icons
                        if (iconsContainer) iconsContainer.style.display = 'none';
                        searchInput.style.display = 'block';
                        searchInput.focus();
                    } else {
                        // hide input and show icons
                        searchInput.style.display = 'none';
                        searchInput.value = '';
                        openOrdersSearch = '';
                        if (iconsContainer) iconsContainer.style.display = 'flex';
                        renderOpenOrdersList(openOrdersCache);
                    }
                });
                searchInput.addEventListener('input', (e) => {
                    openOrdersSearch = (e.target.value || '').trim().toLowerCase();
                    renderOpenOrdersList(openOrdersCache);
                });
                // hide input when Escape pressed while focused
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        searchInput.style.display = 'none';
                        searchInput.value = '';
                        openOrdersSearch = '';
                        if (iconsContainer) iconsContainer.style.display = 'flex';
                        renderOpenOrdersList(openOrdersCache);
                    }
                });
                // clicking anywhere in the overlay but outside the search input or icons will hide the search input and restore icons
                overlay.addEventListener('click', function(ev) {
                    try {
                        const showing = searchInput.style.display !== 'none';
                        if (!showing) return;
                        const insideSearch = ev.target.closest && ev.target.closest('#open-orders-search');
                        const insideIcons = ev.target.closest && ev.target.closest('#open-orders-icons');
                        const insideSortList = ev.target.closest && ev.target.closest('#open-orders-sort-list');
                        const isSearchBtn = ev.target.closest && ev.target.closest('#open-orders-search-btn');
                        if (!insideSearch && !insideIcons && !insideSortList && !isSearchBtn) {
                            searchInput.style.display = 'none';
                            searchInput.value = '';
                            openOrdersSearch = '';
                            if (iconsContainer) iconsContainer.style.display = 'flex';
                            renderOpenOrdersList(openOrdersCache);
                        }
                    } catch (e) { /* ignore overlay handler errors */ }
                });
            }

            // select all handling
            function updateBulkDeleteVisibility() {
                const checkedEls = overlay.querySelectorAll('.open-order-select:checked');
                const any = checkedEls.length > 0;
                const mergeModeActive = (overlay.dataset && overlay.dataset.mergeMode === 'true');
                if (bulkDelete) bulkDelete.style.display = mergeModeActive ? 'none' : (any ? 'inline-block' : 'none');
                if (mergeBtn) mergeBtn.style.display = mergeModeActive ? 'none' : ((checkedEls.length > 1) ? 'inline-block' : 'none');
                if (continueBtn) continueBtn.style.display = (mergeModeActive && checkedEls.length > 1) ? 'inline-block' : 'none';
            }

            // ensure change events (including keyboard toggles) also update visibility
            overlay.addEventListener('change', (e) => {
                try {
                    if (e.target && e.target.classList && e.target.classList.contains('open-order-select')) {
                        updateBulkDeleteVisibility();
                    }
                } catch (err) { /* ignore */ }
            });

            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    const checked = !!selectAll.checked;
                    overlay.querySelectorAll('.open-order-select').forEach(cb => { cb.checked = checked; });
                    updateBulkDeleteVisibility();
                });
            }

            if (bulkDelete) {
                bulkDelete.addEventListener('click', () => {
                    const selected = Array.from(overlay.querySelectorAll('.open-order-select:checked')).map(cb => cb.getAttribute('data-id'));
                    if (!selected || selected.length === 0) return;
                    // Use singular/plural wording and do not include item names
                    const noun = (selected.length === 1) ? 'order' : 'orders';
                    const message = `Are you sure you want to void ${noun}?`;
                    const title = (selected.length === 1) ? 'Void order' : 'Void orders';

                    showConfirmModal(message, () => {
                        // perform deletes sequentially and refresh when done
                        (async function doDeletes() {
                            for (let id of selected) {
                                try {
                                    const res = await fetch('open_orders_api.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', order_id: id }) });
                                    if (!res.ok) throw new Error('Delete failed');
                                    const j = await res.json();
                                    if (!j || !j.success) throw new Error(j && j.error ? j.error : 'Delete failed');
                                } catch (err) {
                                    alert('Failed to delete order ' + id + ': ' + (err && err.message ? err.message : err));
                                }
                            }
                            // refresh list
                            fetch('open_orders_api.php', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : Promise.reject()).then(j => { if (j && j.success) { openOrdersCache = j.orders || []; renderOpenOrdersList(openOrdersCache); if (selectAll) selectAll.checked = false; } });
                        })();
                    }, function(){}, title);
                });
            }
            // Merge button handler: show merge modal to pick target
            if (mergeBtn) {
                mergeBtn.addEventListener('click', () => {
                    const selected = Array.from(overlay.querySelectorAll('.open-order-select:checked')).map(cb => cb.getAttribute('data-id'));
                    if (!selected || selected.length < 2) return;
                    // close/hide the Open Orders modal so only the Merge modal is visible
                    try {
                        overlay.classList.remove('visible');
                        // remove from DOM to avoid stacking multiple overlays
                        try { overlay.parentNode && overlay.parentNode.removeChild(overlay); } catch(e) {}
                    } catch (e) {}
                    // open merge modal
                    const mergeOverlay = createMergeModal(selected);
                    const continueBtn = mergeOverlay.querySelector('#merge-order-continue');
                    const cancelBtn = mergeOverlay.querySelector('#merge-order-cancel');
                    function cleanup() {
                        continueBtn.removeEventListener('click', onContinue);
                        cancelBtn.removeEventListener('click', onCancel);
                        mergeOverlay.classList.remove('visible');
                    }
                    function onCancel() { cleanup(); }
                    async function onContinue() {
                        try {
                            const sel = mergeOverlay.querySelector('#merge-order-target');
                            const targetId = sel ? sel.value : null;
                            if (!targetId) return;
                            // sources = selected excluding target
                            const sources = selected.filter(id => String(id) !== String(targetId));
                            if (sources.length === 0) return;
                            // perform merge via API
                            const res = await fetch('open_orders_api.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'merge', target_id: targetId, order_ids: sources }) });
                            if (!res.ok) throw new Error('Merge failed');
                            const j = await res.json();
                            if (!j || !j.success) throw new Error(j && j.error ? j.error : 'Merge failed');
                            showToast('Orders merged', 'success');
                            // Close merge modal and any other overlays, then clear the cart
                            try {
                                cleanup();
                            } catch (e) {}
                            try { const oo = document.getElementById('open-orders-overlay'); if (oo) { oo.parentNode && oo.parentNode.removeChild(oo); } } catch (e) {}
                            try { const so = document.getElementById('split-order-overlay'); if (so) { so.parentNode && so.parentNode.removeChild(so); } } catch (e) {}
                            try { const mo = document.getElementById('merge-order-overlay'); if (mo) { mo.parentNode && mo.parentNode.removeChild(mo); } } catch (e) {}
                            try { clearCart(); } catch (e) {}
                            // refresh list of open orders in background WITHOUT reopening the modal
                            fetch('open_orders_api.php', { credentials: 'same-origin' })
                                .then(r => r.ok ? r.json() : Promise.reject())
                                .then(j => {
                                    if (j && j.success) {
                                        // update the in-memory cache only; do not call renderOpenOrdersList
                                        openOrdersCache = j.orders || [];
                                        try { if (selectAll) selectAll.checked = false; } catch (e) {}
                                    }
                                })
                                .catch(() => { /* ignore background refresh errors */ });
                        } catch (err) {
                            alert('Merge failed: ' + (err && err.message ? err.message : err));
                        }
                    }
                    continueBtn.addEventListener('click', onContinue);
                    cancelBtn.addEventListener('click', onCancel);
                });
            }
            // Header Continue button should trigger the same merge workflow as the inline Merge button
            if (continueBtn) {
                continueBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    // delegate to the same handler as mergeBtn
                    try {
                        if (mergeBtn) mergeBtn.click();
                    } catch (e) { /* ignore delegation errors */ }
                });
            }
        }, 20);

        return overlay;
    }

    function renderOpenOrdersList(orders, opts) {
        opts = opts || {};
        const overlay = createOpenOrdersModal();
        const list = overlay.querySelector('#open-orders-list');
        list.innerHTML = '';
        // adjust header and controls for merge mode when requested
        try {
            // Preserve existing mergeMode state when opts.mergeMode is not provided.
            let mergeMode;
            if (typeof opts.mergeMode !== 'undefined') mergeMode = !!opts.mergeMode;
            else mergeMode = !!(overlay && overlay.dataset && overlay.dataset.mergeMode === 'true');

            const header = overlay.querySelector('h3');
            if (header) header.textContent = mergeMode ? 'Merge with...' : 'Saved Orders';
            const bulkDelete = overlay.querySelector('#open-orders-bulk-delete');
            if (bulkDelete) bulkDelete.style.display = mergeMode ? 'none' : (bulkDelete.style.display || 'none');
            if (mergeMode) overlay.dataset.mergeMode = 'true'; else delete overlay.dataset.mergeMode;
            // keep merge icon visible in merge mode
        } catch (e) {}
        if (!Array.isArray(orders) || orders.length === 0) {
            list.innerHTML = '<div style="padding:12px;color:#ddd">No saved orders yet.</div>';
            overlay.classList.add('visible');
            return;
        }

        // Filter: search across reference, id, item names, employee, amount and time
        let filtered = orders.filter(o => {
            if (!openOrdersSearch) return true;
            const q = String(openOrdersSearch).toLowerCase();
            // reference / id
            const ref = String(o.reference || o.ref || ('Order #' + (o.id || ''))).toLowerCase();
            if (ref.indexOf(q) !== -1) return true;
            if (String(o.id || '').indexOf(q) !== -1) return true;
            // search in items
            if (o.items && o.items.some(it => String(it.name || '').toLowerCase().indexOf(q) !== -1)) return true;
            // search in employee
            if (o.employee && String(o.employee).toLowerCase().indexOf(q) !== -1) return true;
            // search in amount (numeric and formatted)
            const amt = parseFloat(o.total_amount || o.total || o.totalAmount || 0) || 0;
            const amtStr = amt.toFixed(2);
            if (amtStr.indexOf(q) !== -1) return true;
            if ((String(currency || '') + amtStr).toLowerCase().indexOf(q) !== -1) return true;
            // search in time (clock) and relative time
            const created = o.created_at || o.created || '';
            if (created) {
                try {
                    const dt = new Date(created);
                    const clock = (dt && dt.toLocaleTimeString) ? dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase() : '';
                    if (clock.indexOf(q) !== -1) return true;
                } catch (e) { /* ignore */ }
                // simple relative time check
                try {
                    const now = Date.now();
                    const then = new Date(created).getTime();
                    let diff = Math.max(0, Math.floor((now - then) / 1000)); // seconds
                    const days = Math.floor(diff / 86400); diff -= days * 86400;
                    const hours = Math.floor(diff / 3600); diff -= hours * 3600;
                    const minutes = Math.floor(diff / 60);
                    let rel = '';
                    if (days > 0) rel = `${days} day${days>1?'s':''} ago`;
                    else if (hours > 0) rel = `${hours} hr${hours!==1?'s':''} ago`;
                    else if (minutes > 0) rel = `${minutes} minute${minutes!==1?'s':''} ago`;
                    else rel = 'just now';
                    if (String(rel).toLowerCase().indexOf(q) !== -1) return true;
                } catch (e) { /* ignore */ }
            }
            return false;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (openOrdersSort) {
                case 'name': {
                    const an = String(a.reference || a.ref || (a.items && a.items[0] && a.items[0].name) || '').toLowerCase();
                    const bn = String(b.reference || b.ref || (b.items && b.items[0] && b.items[0].name) || '').toLowerCase();
                    return an.localeCompare(bn);
                }
                case 'amount': {
                    const aa = parseFloat(a.total_amount || a.total || a.totalAmount || 0);
                    const ba = parseFloat(b.total_amount || b.total || b.totalAmount || 0);
                    return aa - ba;
                }
                case 'employee': {
                    const ae = String(a.employee || a.cashier || '').toLowerCase();
                    const be = String(b.employee || b.cashier || '').toLowerCase();
                    return ae.localeCompare(be);
                }
                case 'time':
                default: {
                    const at = new Date(a.created_at || a.created || 0).getTime() || 0;
                    const bt = new Date(b.created_at || b.created || 0).getTime() || 0;
                    return bt - at; // newest first
                }
            }
        });

        // helpers for time formatting
        function formatClock(created) {
            if (!created) return '';
            const dt = new Date(created);
            try {
                return dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            } catch (e) {
                // fallback
                return dt.getHours() + ':' + String(dt.getMinutes()).padStart(2, '0');
            }
        }

        function relativeTime(created) {
            if (!created) return '';
            const now = Date.now();
            const then = new Date(created).getTime();
            let diff = Math.max(0, Math.floor((now - then) / 1000)); // seconds
            const days = Math.floor(diff / 86400); diff -= days * 86400;
            const hours = Math.floor(diff / 3600); diff -= hours * 3600;
            const minutes = Math.floor(diff / 60);
            if (days > 0) return `${days} day${days>1?'s':''} ${hours} hr${hours!==1?'s':''} ago`;
            if (hours > 0) return `${hours} hr${hours!==1?'s':''} ${minutes} minute${minutes!==1?'s':''} ago`;
            if (minutes > 0) return `${minutes} minute${minutes!==1?'s':''} ago`;
            return 'just now';
        }

        // Determine a simple grouping label for an order based on age
        function getGroupLabel(created) {
            if (!created) return 'Older';
            const now = new Date();
            const then = new Date(created);
            // normalize to midnight boundaries to compute full days
            const diffMs = now.setHours(0,0,0,0) - new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
            const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays <= 7) return 'Last week';
            if (diffDays <= 30) return 'Last month';
            return 'Older';
        }

        // Render with group dividers (insert a divider when group changes)
        let prevGroup = null;
        for (let i = 0; i < filtered.length; i++) {
            const o = filtered[i];
            const created = o.created_at || o.created || '';
            const group = getGroupLabel(created);
            if (group !== prevGroup) {
                // Show a divider for every group (including Today)
                if (group) {
                    const divider = document.createElement('div');
                    divider.className = 'open-orders-group-divider';
                    divider.textContent = group;
                    list.appendChild(divider);
                }
                prevGroup = group;
            }

            const item = document.createElement('div');
            item.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
            item.style.padding = '10px 0';
            const ref = o.reference || o.ref || '';
            const amount = parseFloat(o.total_amount || o.total || o.totalAmount || 0);
            const amountText = currency + amount.toFixed(2);
            const employee = o.employee || o.cashier || '';

            // Prefer updated_at for the display clock and "mins ago" label; fall back to created timestamp
            const timeRef = o.updated_at || o.updated || created;
            const formattedClock = formatClock(timeRef);
            const rel = relativeTime(timeRef);
            const empText = employee ? escapeHtml(employee) : (o.employee_id ? ('ID ' + escapeHtml(o.employee_id)) : '');

            item.innerHTML = `
                <div style="display:flex;gap:8px;align-items:center;">
                        <label class="table-checkbox" style="margin-right:8px;flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;">
                            <input class="open-order-select" data-id="${o.id}" type="checkbox" />
                            <span class="checkmark"></span>
                        </label>
                    <div style="flex:1;min-width:0">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                            <div style="min-width:0">
                                <div style="font-weight:400;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ref ? escapeHtml(ref) : 'Order #' + (o.id || '')} - ${escapeHtml(formattedClock)}</div>
                                <div style="color:#bfbfbf;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(rel)}${empText ? (', ' + empText) : ''}</div>
                            </div>
                            <div style="margin-left:12px;color:#ffb347;font-weight:500">${escapeHtml(amountText)}</div>
                        </div>
                    </div>
                </div>
            `;

            list.appendChild(item);
            // auto-select preselected ids (use opts.preselect array of string ids)
            try {
                if (Array.isArray(opts.preselect) && opts.preselect.indexOf(String(o.id)) !== -1) {
                    const cbAuto = item.querySelector('.open-order-select');
                    if (cbAuto) {
                        cbAuto.checked = true;
                        try { updateBulkDeleteVisibilityLocal(); } catch (e) { /* ignore */ }
                    }
                    // When opened in merge mode, hide the auto-selected (base) order row
                    if (opts.mergeMode) {
                        try { item.style.display = 'none'; } catch (e) { /* ignore */ }
                    }
                }
            } catch (e) {}

            // local helper to update bulk delete visibility (per-render)
            function updateBulkDeleteVisibilityLocal() {
                const checkedCount = overlay.querySelectorAll('.open-order-select:checked').length;
                const any = checkedCount > 0;
                const bulk = overlay.querySelector('#open-orders-bulk-delete');
                const mergeLocal = overlay.querySelector('#open-orders-merge');
                const continueLocal = overlay.querySelector('#open-orders-continue');
                const mergeModeActive = (overlay.dataset && overlay.dataset.mergeMode === 'true');
                if (bulk) bulk.style.display = mergeModeActive ? 'none' : (any ? 'inline-block' : 'none');
                if (mergeLocal) mergeLocal.style.display = mergeModeActive ? 'none' : ((checkedCount > 1) ? 'inline-block' : 'none');
                if (continueLocal) continueLocal.style.display = (mergeModeActive && checkedCount > 1) ? 'inline-block' : 'none';
            }

            // checkbox wiring: stop propagation on both the input and its label
            const cb = item.querySelector('.open-order-select');
            if (cb) {
                cb.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    try {
                        if (typeof updateBulkDeleteVisibility === 'function') updateBulkDeleteVisibility();
                        else updateBulkDeleteVisibilityLocal();
                    } catch (e) { try { updateBulkDeleteVisibilityLocal(); } catch (e) {} }
                });
                // also listen for 'change' which fires for keyboard toggles and programmatic changes
                cb.addEventListener('change', (ev) => {
                    ev.stopPropagation();
                    try {
                        if (typeof updateBulkDeleteVisibility === 'function') updateBulkDeleteVisibility();
                        else updateBulkDeleteVisibilityLocal();
                    } catch (e) { try { updateBulkDeleteVisibilityLocal(); } catch (e) {} }
                });
            }
            // ensure clicking on the styled label/checkmark does not trigger the row click
            const lbl = item.querySelector('.table-checkbox');
            if (lbl) {
                lbl.addEventListener('click', (ev) => { ev.stopPropagation(); });
            }

            // clicking the row either toggles selection in mergeMode, or loads the order (ignore clicks inside checkbox area)
            item.addEventListener('click', (ev) => {
                // ignore clicks on the checkbox input or anywhere inside the styled checkbox label
                try {
                    if (ev.target && ev.target.closest && ev.target.closest('.table-checkbox')) return;
                } catch (e) {}

                const mergeModeActive = overlay && overlay.dataset && overlay.dataset.mergeMode === 'true';
                if (mergeModeActive) {
                    // toggle the checkbox for this row instead of loading
                    try {
                        const cbLocal = item.querySelector('.open-order-select');
                        if (cbLocal) {
                            cbLocal.checked = !cbLocal.checked;
                            try {
                                if (typeof updateBulkDeleteVisibility === 'function') updateBulkDeleteVisibility();
                                else updateBulkDeleteVisibilityLocal();
                            } catch (e) { try { updateBulkDeleteVisibilityLocal(); } catch (e) {} }
                        }
                    } catch (e) { /* ignore toggle errors */ }
                    return;
                }

                // normal behavior: load the order into the cart
                const id = o.id;
                fetch(`open_orders_api.php?id=${encodeURIComponent(id)}`, { credentials: 'same-origin' })
                    .then(res => res.ok ? res.json() : Promise.reject(new Error('Network error')))
                    .then(json => {
                        if (json && json.success) {
                            const order = json.order || json.orders && json.orders[0];
                            if (order && order.items) {
                                cart = order.items.map(it => ({ product_id: it.product_id || null, name: it.name || '', unit_price: parseFloat(it.unit_price) || 0, quantity: parseInt(it.quantity) || 1, variant: it.variant || null }));
                                updateCartDisplay();
                                        // Autofill the amount-received with the order total (programmatic)
                                        try {
                                            let savedTotal = parseFloat(order.total_amount || order.total || order.totalAmount || 0);
                                            if (isNaN(savedTotal)) savedTotal = 0;
                                            programmaticAmountUpdate = true;
                                            amountReceived.value = Number(savedTotal).toFixed(2);
                                            // treat this as programmatic (not user-edited) and reset quick-replace
                                            amountUserEdited = false;
                                            lastQuickReplaced = false;
                                            updateChange();
                                            updateAmountClearVisibility();
                                        } catch (e) { /* ignore autofill errors */ }
                                        try {
                                            const titleEl = document.getElementById('current-sale-title');
                                            const refText = order.reference || order.ref || ('Order #' + (order.id || ''));
                                            if (titleEl) titleEl.textContent = refText;
                                            // store current order id/ref for later
                                            currentOrderId = order.id || null;
                                            currentOrderRef = order.reference || order.ref || null;
                                            // ensure title is editable
                                            enableTitleEditing();
                                            // restore cart mode from saved order (do not persist as default)
                                            try {
                                                if (order.cart_mode) {
                                                    setCartMode(order.cart_mode, false);
                                                    if (cartModeList) {
                                                        try {
                                                            cartModeList.querySelectorAll('li').forEach(x => x.classList.remove('active'));
                                                            const m = cartModeList.querySelector(`li[data-mode="${order.cart_mode}"]`);
                                                            if (m) m.classList.add('active');
                                                        } catch (e) { /* ignore */ }
                                                    }
                                                }
                                            } catch (e) { /* ignore cart mode restore errors */ }
                                            // restore payment method (cash/card/online)
                                            try {
                                                if (order.payment_method) {
                                                    selectedPaymentMethod = order.payment_method;
                                                    try {
                                                        paymentBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-method') === selectedPaymentMethod));
                                                    } catch (e) { /* ignore */ }
                                                }
                                            } catch (e) { /* ignore payment restore errors */ }
                                        } catch (e) {}
                                overlay.classList.remove('visible');
                                    }
                        } else {
                            alert('Could not load order details');
                        }
                    })
                    .catch(() => alert('Could not load order details'));
            });
        }

        const close = overlay.querySelector('#open-orders-close');
        if (close) close.addEventListener('click', () => overlay.classList.remove('visible'));

        overlay.classList.add('visible');
    }

    function showOpenOrdersModal(orders, opts) {
        openOrdersCache = Array.isArray(orders) ? orders : [];
        renderOpenOrdersList(openOrdersCache, opts || {});
    }

    function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

    // Initial load
    // Initial load (respect currentCategory)
    loadSettings().then(() => { fetchProducts('', currentCategory); try { updateCartDisplay(); } catch(e) { /* ignore */ } try { updateAmountClearVisibility(); } catch(e) {} });
});
