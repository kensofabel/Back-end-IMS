document.addEventListener('DOMContentLoaded', function () {
    const productSearch = document.getElementById('product-search');
    const productGrid = document.getElementById('product-grid');
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

    // Fetch and display products
    function fetchProducts(search = '') {
        const url = search ? `api.php?search=${encodeURIComponent(search)}` : 'api.php';
        fetch(url)
            .then(response => response.json())
            .then(data => {
                displayProducts(data);
            })
            .catch(error => {
                console.error('Error fetching products:', error);
            });
    }

    // Display products in grid
    function displayProducts(products) {
        productGrid.innerHTML = '';
        // If no products from API, inject mock data
        if (!products || products.length === 0) {
            products = [
                { id: 101, name: 'Apple', unit_price: 500.00, quantity: 20 },
                { id: 102, name: 'Banana', unit_price: 350.00, quantity: 15 },
                { id: 103, name: 'Milk', unit_price: 1200.00, quantity: 10 },
                { id: 104, name: 'Bread', unit_price: 150.00, quantity: 30 },
                { id: 105, name: 'Egg(tray)', unit_price: 100.00, quantity: 25 }
            ];
        }
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h4>${product.name}</h4>
                <p>${currency}${parseFloat(product.unit_price).toFixed(2)}</p>
                <p>Stock: ${product.quantity}</p>
                <button class="add-to-cart-btn" data-id="${product.id}" data-name="${product.name}" data-price="${product.unit_price}">Add to Cart</button>
            `;
            productGrid.appendChild(productCard);
        });

        // Attach event listeners to add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = parseInt(btn.getAttribute('data-id'));
                const productName = btn.getAttribute('data-name');
                const unitPrice = parseFloat(btn.getAttribute('data-price'));
                addToCart(productId, productName, unitPrice);
            });
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
            fetchProducts(searchTerm);
        } else if (searchTerm.length === 0) {
            fetchProducts();
        }
    });

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
    loadSettings().then(() => fetchProducts());
});
