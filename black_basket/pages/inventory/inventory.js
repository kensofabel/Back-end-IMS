document.addEventListener('DOMContentLoaded', function () {
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

    // Handle add product form submission
    addProductForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = {
            name: addProductForm.name.value.trim(),
            category: addProductForm.category.value,
            price: parseFloat(addProductForm.price.value),
            stock: parseInt(addProductForm.stock.value),
            description: addProductForm.description.value.trim()
        };

        fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Product added successfully!');
                    addProductForm.reset();
                    fetchInventory();
                } else {
                    alert('Error adding product: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                alert('Error adding product: ' + error);
            });
    });

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

    // Modal logic
    const modal = document.getElementById('productModal');
    const addBtn = document.getElementById('addProductBtn');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    addBtn.onclick = function() {
        modal.style.display = 'flex';
        document.getElementById('modalTitle').innerText = 'Add Product';
        document.getElementById('add-product-form').reset();
        document.getElementById('variantRow').style.display = 'none';
    };
    closeModal.onclick = cancelBtn.onclick = function() {
        modal.style.display = 'none';
    };
    window.onclick = function(e) {
        if (e.target === modal) modal.style.display = 'none';
    };
    window.onkeydown = function(e) {
        if (e.key === 'Escape') modal.style.display = 'none';
    };

    // Composite product logic (as before)
    const productType = document.getElementById('productType');
    const variantRow = document.getElementById('variantRow');
    const addComponentBtn = document.getElementById('addComponentBtn');
    const componentsList = document.getElementById('componentsList');
    let inventoryItems = [
        { id: 1, name: 'Coke Syrup' },
        { id: 2, name: 'Cup' },
        { id: 3, name: 'Ice' },
        { id: 4, name: 'Sprite Syrup' }
    ];
    let components = [];
    productType.onchange = function() {
        if (productType.value === 'product') {
            variantRow.style.display = 'flex';
        } else {
            variantRow.style.display = 'none';
            components = [];
            renderComponents();
        }
    };
    addComponentBtn.onclick = function() {
        components.push({ itemId: '', qty: 1 });
        renderComponents();
    };
    function renderComponents() {
        componentsList.innerHTML = '';
        components.forEach((comp, idx) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.gap = '8px';
            div.style.marginBottom = '6px';
            div.innerHTML = `
                <select class="component-item" data-idx="${idx}" style="flex:2;">
                    <option value="">Select Item</option>
                    ${inventoryItems.map(item => `<option value="${item.id}" ${comp.itemId==item.id?"selected":""}>${item.name}</option>`).join('')}
                </select>
                <input type="number" class="component-qty" data-idx="${idx}" min="1" value="${comp.qty}" style="width:60px;">
                <button type="button" class="btn btn-secondary removeComponentBtn" data-idx="${idx}">Remove</button>
            `;
            componentsList.appendChild(div);
        });
        document.querySelectorAll('.removeComponentBtn').forEach(btn => {
            btn.onclick = function() {
                const idx = +btn.getAttribute('data-idx');
                components.splice(idx, 1);
                renderComponents();
            };
        });
        document.querySelectorAll('.component-item').forEach(sel => {
            sel.onchange = function() {
                const idx = +sel.getAttribute('data-idx');
                components[idx].itemId = sel.value;
            };
        });
        document.querySelectorAll('.component-qty').forEach(input => {
            input.oninput = function() {
                const idx = +input.getAttribute('data-idx');
                components[idx].qty = input.value;
            };
        });
    }
});