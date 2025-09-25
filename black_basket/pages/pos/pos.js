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

    let cart = [];
    let selectedPaymentMethod = 'cash';
    const taxRate = 0.0825; // 8.25%

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
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h4>${product.name}</h4>
                <p>$${parseFloat(product.unit_price).toFixed(2)}</p>
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
                    <p>$${item.unit_price.toFixed(2)} x ${item.quantity}</p>
                </div>
                <div class="cart-item-total">
                    <span>$${itemTotal.toFixed(2)}</span>
                    <button class="remove-item-btn" data-index="${index}">×</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });

        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        taxEl.textContent = `$${tax.toFixed(2)}`;
        totalEl.textContent = `$${total.toFixed(2)}`;

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
        const total = parseFloat(totalEl.textContent.replace('$', ''));
        const received = parseFloat(amountReceived.value) || 0;
        const change = received - total;
        changeEl.textContent = change >= 0 ? `$${change.toFixed(2)}` : '$0.00';
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

        const total = parseFloat(totalEl.textContent.replace('$', ''));
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
        changeEl.textContent = '$0.00';
    }

    // Initial load
    fetchProducts();
});
