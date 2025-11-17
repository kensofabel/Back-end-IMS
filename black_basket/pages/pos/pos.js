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
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const paymentBtns = document.querySelectorAll('.payment-btn');
    const taxRateLabel = document.getElementById('tax-rate-label');

    let cart = [];
    let selectedPaymentMethod = 'cash';
    let currentCategory = 'all';
    // Defaults; will be overridden by saved settings if available
    let taxRate = 0.12; // 12% VAT (Philippines standard)
    let currency = '₱';

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
            }

            // For image type products, keep name/price bottom-aligned.
            // For non-image (color/shape) products, center the name/price in the middle area.
            if (typeRaw === 'image' && product.image_url) {
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
            } else {
                // Non-image: place details in the middle so they appear centered inside the shape
                // Use a vertical stack so badge and details don't overlap
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
            });
            // Keyboard support: Enter or Space
            productCard.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isVariablePrice) {
                        showPriceModal(productCard, product, (enteredPrice) => {
                            if (typeof enteredPrice === 'number' && !isNaN(enteredPrice)) {
                                animateAddToCart(productCard, cartItems);
                                addToCart(product.id, product.name, enteredPrice);
                            }
                        });
                    } else {
                        animateAddToCart(productCard, cartItems);
                        addToCart(product.id, product.name, displayPrice);
                    }
                }
            });

            productGrid.appendChild(productCard);
        });
    }

    // Add product to cart
    function addToCart(productId, productName, unitPrice) {
        const existingItem = cart.find(item => item.product_id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                product_id: productId,
                name: productName,
                unit_price: unitPrice,
                quantity: 1
            });
        }
        updateCartDisplay();
    }

    // Animate a flying clone of the product card to the target element (cart)
    function animateAddToCart(cardEl, targetEl) {
        try {
            const rect = cardEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();

            const clone = cardEl.cloneNode(true);
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
                    <button id="price-modal-cancel" class="price-btn icon" aria-label="Cancel">×</button>
                    <div class="price-modal-title" id="price-modal-title">Item</div>
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

        // close on backdrop click and allow Escape to close when overlay visible
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.classList.remove('visible'); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && overlay.classList.contains('visible')) overlay.classList.remove('visible'); });

        return overlay;
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
    // Update cart display
    function updateCartDisplay() {
        cartItems.innerHTML = '';
        let subtotal = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.quantity * item.unit_price;
            subtotal += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${currency}${item.unit_price.toFixed(2)} x ${item.quantity}</p>
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
    }

    // Remove item from cart
    function removeFromCart(index) {
        cart.splice(index, 1);
        updateCartDisplay();
    }

    // Update change amount
    function updateChange() {
    const total = parseFloat(totalEl.textContent.replace(currency, ''));
        const received = parseFloat(amountReceived.value) || 0;
        const change = received - total;
    changeEl.textContent = change >= 0 ? `${currency}${change.toFixed(2)}` : `${currency}0.00`;
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
    amountReceived.addEventListener('input', updateChange);

    // Complete sale
    completeSaleBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Cart is empty!');
            return;
        }

    const total = parseFloat(totalEl.textContent.replace(currency, ''));
        const received = parseFloat(amountReceived.value) || 0;

        if (selectedPaymentMethod === 'cash' && received < total) {
            alert('Insufficient payment amount!');
            return;
        }

        const saleData = {
            items: cart,
            payment_method: selectedPaymentMethod,
            channel: 'in-store',
            total_amount: total
        };

        fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saleData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Sale completed successfully! Sale ID: ${data.sale_id}`);
                    clearCart();
                } else {
                    alert('Error completing sale: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                alert('Error completing sale: ' + error);
            });
    });

    // Clear cart
    clearCartBtn.addEventListener('click', clearCart);

    function clearCart() {
        cart = [];
        updateCartDisplay();
        amountReceived.value = '';
    changeEl.textContent = `${currency}0.00`;
    }

    // Initial load
    // Initial load (respect currentCategory)
    loadSettings().then(() => fetchProducts('', currentCategory));
});
