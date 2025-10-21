<head>
<style>
        input.input-box:-webkit-autofill,
        input.input-box:-webkit-autofill:focus,
        input.input-box:-webkit-autofill:hover,
        input.input-box:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #222 inset !important;
            box-shadow: 0 0 0 1000px #222 inset !important;
            background-color: #222 !important;
            color: #fff !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        /* Disable tab content when not active */
        .pos-tab-panel[aria-disabled="true"] {
            pointer-events: none;
            opacity: 0.5;
            filter: grayscale(0.5);
        }
        /* Slide-up effect for POS options above form, never covering footer */
                #posOptionsContainer {
          position: absolute;
          left: 0;
          right: 0;
          /* Align bottom to top of footer */
          bottom: 100%;
          background: #171717;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -4px 0 #414141;
          z-index: 20; /* Lower than footer */
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(.4,0,.2,1), padding 0.4s cubic-bezier(.4,0,.2,1);
          padding: 0 20px;
          pointer-events: none;
        }
        
        .product-form.pos-options-active, 
        .product-form.pos-options-active * {
            pointer-events: none !important;
            opacity: 0.6;
        }
        #posOptionsContainer.slide-up {
          max-height: 420px;
          padding: 20px 20px 0 20px;
          overflow: none;
          pointer-events: auto;
          z-index: 20; /* Lower than footer */
        }
        .modal-footer {
          position: sticky !important;
          bottom: 0 !important;
          z-index: 30 !important; /* Always above POS options */
          background: #171717 !important;
        }

        /* Ensure modal body is relative for absolute positioning */
        .inventory-modal-body, .modal-content, .modal-dialog {
          position: relative;
        }

        #posToggleChevron {
          display: none;
        }
        #availablePOS:checked ~ label ~ #posToggleChevron {
          display: inline-block;
        }
                /* When a panel takes over (Add Items or Barcode results), hide the top tab buttons */
                .modal-content.hide-tabs .modal-tabs {
                        display: none !important;
                        pointer-events: none !important;
                        opacity: 0 !important;
                }
                .barcode-results-container {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                .barcode-results-inner {
                    width:600px;
                    /* allow absolute-positioned tooltips to escape row bounds */
                    overflow: visible;
                }
                /* Recommendation tooltip shown above the input in barcode rows */
                .br-recommend-msg {
                    position: absolute;
                    display: block;
                    background: #222;
                    color: #ffcc80;
                    padding: 6px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                    z-index: 9999; /* ensure on top */
                    white-space: nowrap;
                    pointer-events: none;
                }
                .barcode-results-header,
                .barcode-result-row {
                    display: grid;
                    grid-template-columns: .8fr .6fr .5fr .7fr 1.2fr;
                    gap: 8px;
                    align-items: center;
                    padding: 10px 10px;
                    border-radius: 8px;
                    color: #dbdbdb;
                    background: transparent;
                }
                .barcode-results-header {
                    background: #1f1f1f;
                    border: 1px solid #333;
                    margin-bottom: 10px;
                    font-weight: 600;
                    color: #e6e6e6;
                }
                .barcode-result-row {
                    padding: 10px 10px 8px 10px;
                    background: #171717;
                    border: 1px solid #262626;
                    margin-bottom: 8px;
                    position: relative; /* allow absolute children for ghost numbers */
                }
                .barcode-result-row
                .barcode-results-header .br-col-main {
                    color: #dbdbdb;
                    font-size: 14px;
                }
                .barcode-result-row .small-label,
                .barcode-results-header .header {
                    color: #9e9e9e;
                    font-size: 12px;
                }
                /* Make category match the track-stock label styling (size + color) */
                .barcode-result-row .br-category {
                    color: #9e9e9e;
                    font-size: 12px;
                    line-height: 1.1;
                }
                .br-name {
                    color: #dbdbdb;
                    font-size: 18px;
                    line-height: 1.0;      /* compact vertical spacing */
                    margin: 0;
                    padding: 0;
                    max-height: 20px;      /* keep visual height consistent */
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .barcode-result-row .br-name { margin-bottom: 8px; }
                .barcode-result-row .br-col {
                    gap: 0  ;              /* space between category and name */
                }
                .barcode-result-row .add-input-row input.br-add-qty {
                    min-width: 40px;
                    max-width: 80px;
                }
                .br-col { display: flex; flex-direction: column; gap: 4px; }
                @media (max-width: 720px) {
                    .barcode-results-header,
                    .barcode-result-row {
                        grid-template-columns: 1fr;
                    }
                }
                /* Make the toggle smaller in barcode result rows to match a compact layout */
                .barcode-result-row .switch {
                    width: 60px !important;
                    height: 40px !important;
                    bottom: -2px;
                }
                .barcode-result-row .slider {
                    top: 3px; bottom: 3px; border-radius: 8px; border-width: 1px; height: 30px;
                }
                .barcode-result-row .slider:before {
                    height: 22px !important; width: 22px !important; left: 3px; bottom: 3px;
                }
                .barcode-result-row .switch input:checked + .slider:before {
                    transform: translateX(30px);
                }
                /* Make add-qty input background match header */
                .barcode-result-row input.br-add-qty {
                    background: #1f1f1f;
                    border: 1px solid #333;
                    color: #e6e6e6;
                    padding: 8px 8px;
                    border-radius: 6px;
                }
                /* WebKit number input spinner styling */
                .barcode-result-row input[type=number]::-webkit-outer-spin-button,
                .barcode-result-row input[type=number]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                /* Provide custom small arrow buttons (unit arrows) matching header */
                .barcode-result-row .unit-arrows .unit-arrow {
                    background: #1f1f1f;
                    border: 1px solid #333;
                    color: #e6e6e6;
                    width: 28px;
                    height: 20px;
                    padding: 0;
                    border-radius: 4px;
                    font-size: 11px;
                }
                .barcode-result-row .unit-arrows .unit-arrow:hover {
                    background: #262626;
                }
    </style>
</head>
<!-- Scanner/Manual/Add Items Modal with Tab Panels -->
<div class="modal" id="scannerModal">
    <span id="closeModalBtn" style="position:absolute; top:15px; right:15px; font-size:20px; color:#fff; background: none; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:100; box-shadow:0 2px 8px rgba(0,0,0,0.2);">&#10006;</span>
    <div class="modal-content scanner-modal">
        <div class="modal-tabs">
            <button class="scanner-tab" id="scanTab">SCAN</button>
            <button class="scanner-tab" id="manualTab">MANUAL</button>
        </div>
        <div class="tab-panels">
            <!-- Scan Tab Panel -->
            <div id="scanTabPanel" class="tab-panel">
                <div class="modal-body">
                    <div class="camera-container">
                        <video id="cameraVideo" autoplay playsinline></video>
                        <!-- Hidden QuaggaJS target for barcode scanning -->
                        <div id="cameraScanner" style="width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;overflow:hidden;"></div>
                        <div class="scanner-overlay">
                            <div class="scanner-line"></div>
                        </div>
                    </div>
                    <div class="skip-section">
                        <button type="button" class="skip-btn" id="skipScanner">Skip for now</button>
                    </div>
                </div>
            </div>
            <!-- Mismatch choice popup (hidden by default) -->
            <div id="mismatchChoiceModal" style="display:none; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: #121212; border: 1px solid #333; padding: 18px; border-radius: 10px; z-index: 120; width: 420px; box-shadow: 0 12px 30px rgba(0,0,0,0.6);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div id="mismatchTitle" style="font-weight:700; color:#fff;">Inputs doesnt match</div>
                    <button type="button" id="mismatchCloseBtn" style="background:none; border:none; color:#fff; font-size:18px; cursor:pointer;">&times;</button>
                </div>
                <div id="mismatchBody" style="color:#ddd; margin-bottom:12px;">Would you like to:</div>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button type="button" id="mismatchSkuBtn" class="btn" style="background:#333; color:#fff; padding:8px 12px; border-radius:6px;">Show SKU match</button>
                    <button type="button" id="mismatchBarcodeBtn" class="btn" style="background:#ff9800; color:#171717; padding:8px 12px; border-radius:6px;">Show Barcode match</button>
                </div>
            </div>
            <!-- Manual Tab Panel -->
            <div id="manualTabPanel" class="tab-panel" style="display:none;">
                <div class="modal-body">
                    <div class="manual-form">
                        <div class="form-group checkbox-group">
                            <label>SKU</label>
                            <div class="input-row">
                                <input type="checkbox" id="enableSKU" class="field-checkbox">
                                <input type="text" id="manualSKU" required class="input-box" placeholder="Unique item identifier">
                            </div>
                        </div>
                        <div class="form-group checkbox-group">
                            <label>Barcode</label>
                            <div class="input-row">
                                <input type="checkbox" id="enableBarcode" class="field-checkbox">
                                <input type="text" id="manualBarcode" required class="input-box" placeholder="Barcode number">
                            </div>
                        </div>
                        <button class="btn btn-primary" id="nextBtn">Next</button>
                    </div>
                    <div class="skip-section">
                        <button type="button" class="skip-btn" id="skipManualEntry">Skip for now</button>
                    </div>
                </div>
            </div>
            <!-- Add Items/Product Tab Panel -->
            <div id="addItemsTabPanel" class="tab-panel" style="display:none;">
                <div class="modal-header">
                    <h2 class="modal-title">Add Items</h2>
                    <button type="button" class="inline-back" id="backInlineAddItems" aria-label="Back" title="Back">&larr;</button>
                </div>
                <div class="modal-divider"></div>
                <div class="modal-body">
                    <form id="inlineAddItemsForm" class="product-form">
                        <!-- Row 1: Name | Category -->
                        <div class="form-row" style="display: flex; gap: 15px; justify-content: space-between;">
                            <div class="form-group name-autocomplete" style="flex:3; position: relative;">
                                <label for="inlineItemName">Name</label>
                                <input type="text" id="inlineItemName" name="itemName" class="input-box" autocomplete="off">
                                <div id="nameErrorMsg" style="color:#dc3545; font-size:14px; margin-top:4px; display:none;"></div>
                                <div class="name-dropdown" id="nameDropdown"></div>
                            </div>
                            <div class="form-group category-autocomplete" style="flex:2; position: relative;">
                                <label for="inlineItemCategory">Category</label>
                                <input type="text" id="inlineItemCategory" name="itemCategory" class="input-box" autocomplete="off" placeholder="Select or create" value = "No Category" required>
                                <div class="category-dropdown" id="categoryDropdown"></div>
                            </div>
                        </div>
                        <!-- Row 2: Price | Cost | Track Stock Toggle -->
                        <div class="form-row" id="priceRow" style="display: flex; gap: 15px; justify-content: space-between; margin-top: 10px; margin-bottom: -10px;">
                            <div class="form-group" style="flex:1.45;">
                                <label for="inlineItemPrice">Price</label>
                                <input type="text" id="inlineItemPrice" name="itemPrice" class="input-box" currency-localization="₱" placeholder="Optional">
                            </div>
                            <div class="form-group" style="flex:1.45;">
                                <label for="inlineItemCost">Cost</label>
                                <input type="text" id="inlineItemCost" name="itemCost" class="input-box" currency-localization="₱" value="₱0.00">
                            </div>
                            <div class="form-group" style="flex:2;">
                                <label for="inlineTrackStockToggle">Track Stock</label>
                                <label class="switch" style="left: 10px;">
                                    <input type="checkbox" id="inlineTrackStockToggle" name="trackStock">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <!-- Variants Section (Initially Hidden) -->
                        <div class="variants-section" id="variantsSection" style="display: none; margin-top: 10px; margin-bottom: -10px;">
                            <div class="modal-divider" style="margin-top: -10px !important; margin-bottom: 20px !important;"></div>
                            <!-- Variants Header -->
                            <div class="variants-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <button type="button" class="variants-add-btn" style="background: #ff9800; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">+ Add Variant</button>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <label style="color: #dbdbdb; font-size: 12px; margin: 0;">Track Stock</label>
                                        <label class="switch" style="width: 60px !important; height: 30px !important;">
                                            <input type="checkbox" id="variantsTrackStockToggle" name="variantsTrackStock">
                                            <span class="slider" style="top: -1px; bottom: 1px;"></span>
                                        </label>
                                    </div>
                                    <button type="button" class="variants-close-btn" id="closeVariantsBtn" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s ease;">
                                        ✕ Close
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Variants Table -->
                            <div class="variants-table-container" style="border: 2px solid #444; border-radius: 8px; background: #1a1a1a;">
                                <table class="variants-table" style="width: 100%; border-collapse: collapse;">
                                    <thead id="variantsTableHead">
                                        <tr style="background: #333;">
                                            <th style="padding: 12px 8px; color: #dbdbdb; border-bottom: 1px solid #555; text-align: center; font-size: 11px;">Available</th>
                                            <th style="padding: 12px 8px; color: #dbdbdb; border-bottom: 1px solid #555; text-align: left; font-size: 11px;">Variant</th>
                                            <th style="padding: 12px 8px; color: #dbdbdb; border-bottom: 1px solid #555; text-align: left; font-size: 11px;">Price</th>
                                            <th style="padding: 12px 8px; color: #dbdbdb; border-bottom: 1px solid #555; text-align: left; font-size: 11px;">Cost</th>
                                            <th class="stock-column" style="padding: 12px 8px; color: #dbdbdb; border-bottom: 1px solid #555; text-align: left; font-size: 11px; display: none;">In Stock</th>
                                            <th class="stock-column" style="padding: 12px 8px; color: #dbdbdb; border-bottom: 1px solid #555; text-align: left; font-size: 11px; display: none;">Low Stock</th>
                                            <th style="padding: 12px 8px; color: #dbdbdb; border-bottom: 1px solid #555; text-align: left; font-size: 11px;">SKU</th>
                                            <th style="padding: 12px 8px; color: #dbdbdb; border-bottom: 1px solid #555; text-align: left; font-size: 11px;">Barcode</th>
                                            <th style="padding: 12px 8px; color: #dbdbdb; border-bottom: 1px solid #555; text-align: center; font-size: 11px; width: 50px;">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="variantsTableBody">
                                        <!-- Variant rows will be added here dynamically -->
                                        <!-- Ensure variant name input is required in JS that generates these rows -->
                                    </tbody>
                                </table>
                            </div>
                            <div class="modal-divider" style="margin-bottom: 30px !important; margin-top: 20px !important;"></div>
                        </div>
                        <div class="form-row stock-fields" id="stockFieldsRow" style="display: none; gap: 15px; justify-content: space-between;">
                            <div class="form-group quantity-input-wrapper" style="flex:2;">
                                <label for="inlineInStock">In Stock</label>
                                <div class="input-with-unit-selector">
                                    <input type="text" id="inlineInStock" name="inStock" class="input-box" placeholder="Stock quantity">
                                    <div class="unit-selector">
                                        <span class="unit-prefix">|</span>
                                        <span class="unit-value">- -</span>
                                        <div class="unit-arrows">
                                            <button type="button" class="unit-arrow unit-up">▲</button>
                                            <button type="button" class="unit-arrow unit-down">▼</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group quantity-input-wrapper" style="flex:2; margin-right: 95px;">
                                <label for="inlineLowStock">Low stock</label>
                                <div class="input-with-unit-selector">
                                    <input type="text" id="inlineLowStock" name="lowStock" class="input-box" placeholder="Alert stock">
                                    <div class="unit-selector">
                                        <span class="unit-prefix">|</span>
                                        <span class="unit-value">- -</span>
                                        <div class="unit-arrows">
                                            <button type="button" class="unit-arrow unit-up">▲</button>
                                            <button type="button" class="unit-arrow unit-down">▼</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-row" style="display: flex; gap: 15px; justify-content: space-between; margin-bottom: -20px">
                            <div class="form-group" style="flex:2;">
                                <label for="inlineItemSKU">SKU</label>
                                <input type="text" id="inlineItemSKU" name="itemSKU" class="input-box" placeholder="Unique item identifier">
                                <div id="skuErrorMsg" style="color:#dc3545; font-size:14px; margin-top:4px; display:none;"></div>
                                <script>
                                document.addEventListener('DOMContentLoaded', function() {
                                    var skuInput = document.getElementById('inlineItemSKU');
                                    var skuErrorMsg = document.getElementById('skuErrorMsg');
                                    if (skuInput && skuErrorMsg) {
                                        skuInput.addEventListener('input', function() {
                                            if (skuErrorMsg.style.display === 'block') {
                                                skuErrorMsg.style.display = 'none';
                                                skuErrorMsg.textContent = '';
                                            }
                                        });
                                    }
                                });
                                </script>
                            </div>
                            <div class="form-group" style="flex:2;">
                                <label for="inlineItemBarcode">Barcode</label>
                                <input type="text" id="inlineItemBarcode" name="itemBarcode" class="input-box">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer" style="position: sticky; bottom: 0; z-index: 10; padding: 10px 20px;">
                    <div style="display: flex; flex-direction: column; width: 100%; gap: 8px;">
                        <div class="modal-divider" style="z-index: 30;"></div>
                        <!-- First row: Checkbox -->
                        <div style="display: flex; align-items: center; justify-content: flex-start; width: 100%;">
                          <div class="form-group" style="display: flex; align-items: center; gap: 30px; position: relative;">
                            <input type="checkbox" id="availablePOS" name="availablePOS" class="field-checkbox">
                            <label for="availablePOS" style="cursor: pointer;">This item is available in POS</label>
                          </div>
                          <span id="posToggleChevron" style="font-size: 18px; cursor: pointer; user-select: none; transition: transform 0.3s; color: #fff; display: none; margin-left: auto; align-self: flex-start;">
                            <svg id="chevronSVG" width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                              <path id="chevronPath" fill-rule="evenodd" clip-rule="evenodd" d="M4.18179 8.81819C4.00605 8.64245 4.00605 8.35753 4.18179 8.18179L7.18179 5.18179C7.26618 5.0974 7.38064 5.04999 7.49999 5.04999C7.61933 5.04999 7.73379 5.0974 7.81819 5.18179L10.8182 8.18179C10.9939 8.35753 10.9939 8.64245 10.8182 8.81819C10.6424 8.99392 10.3575 8.99392 10.1818 8.81819L7.49999 6.13638L4.81819 8.81819C4.64245 8.99392 4.35753 8.99392 4.18179 8.81819Z" fill="#fff"/>
                            </svg>
                          </span>
                        </div>
                        
                        <!-- POS Options Tabs (hidden by default) -->
                        <div id="posOptionsContainer" style="display: none; width: 100%; margin-top: 10px;">
                            
                            
                            <!-- Tab Content -->
                            <div class="pos-tab-content">
                                <!-- Color & Shape Tab -->
                                <div id="colorShapeTab" class="pos-tab-panel active" style="display: block;">
                                    <div style="display: flex; gap: 15px;">
                                        <!-- Color Selection -->
                                        <div style="flex: 1; text-align: center;">
                                            <label style="display: block; color: #dbdbdb; font-size: 12px; margin-bottom: 10px;">Color</label>
                                            <div class="color-options" style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">
                                                <div class="color-option" data-color="red" style="width: 24px; height: 24px; background: #f44336; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                                <div class="color-option" data-color="orange" style="width: 24px; height: 24px; background: #ff9800; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                                <div class="color-option" data-color="yellow" style="width: 24px; height: 24px; background: #ffeb3b; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                                <div class="color-option" data-color="green" style="width: 24px; height: 24px; background: #4caf50; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                                <div class="color-option" data-color="blue" style="width: 24px; height: 24px; background: #2196f3; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                                <div class="color-option" data-color="purple" style="width: 24px; height: 24px; background: #9c27b0; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                                <div class="color-option" data-color="brown" style="width: 24px; height: 24px; background: #795548; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                                <div class="color-option" data-color="gray" style="width: 24px; height: 24px; background: #607d8b; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                            </div>
                                        </div>
                                        
                                        <!-- Shape Selection -->
                                        <div style="flex: 1; text-align: center; margin-bottom: 20px;">
                                            <label style="display: block; color: #dbdbdb; font-size: 12px; margin-bottom: 10px;">Shape</label>
                                            <div class="shape-options" style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">
                                                <div class="shape-option" data-shape="circle" style="width: 24px; height: 24px; background: #555; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                                <div class="shape-option" data-shape="square" style="width: 24px; height: 24px; background: #555; border-radius: 2px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;"></div>
                                                <div class="shape-option" data-shape="triangle" style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 20px solid #555; cursor: pointer; border-radius: 0; transition: all 0.2s ease; position: relative;"></div>
                                                <div class="shape-option" data-shape="diamond" style="width: 16px; height: 16px; background: #555; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; transform: rotate(45deg); margin: 4px;"></div>
                                                <div class="shape-option" data-shape="star" style="width: 20px; height: 20px; background: #555; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);"></div>
                                                <div class="shape-option" data-shape="hexagon" style="width: 20px; height: 20px; background: #555; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Image Tab -->
                                <div id="imageTab" class="pos-tab-panel" style="display: none;">
                                    <div style="text-align: center;">
                                        <label style="display: block; color: #dbdbdb; font-size: 12px; margin-bottom: 10px;">Product Image</label>
                                        <div id="imageUploadSection">
                                            <div id="imageUploadArea" style="border: 2px dashed #555; border-radius: 8px; padding: 20px; background: #1a1a1a; margin-bottom: 20px;">
                                                <input type="file" id="posProductImage" accept="image/*" style="display: none;">
                                                <div id="uploadPlaceholder">
                                                    <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: #777; margin-bottom: 8px;"></i>
                                                    <p style="color: #777; font-size: 12px; margin: 0;">Select product image</p>
                                                    <p style="color: #555; font-size: 10px; margin: 4px 0 0 0;">JPG, PNG, GIF up to 10MB</p>
                                                </div>
                                            </div>
                                            <div id="uploadedImageArea" style="display:none; border: 2px dashed #555; border-radius: 8px; padding: 20px; background: #1a1a1a; margin-bottom: 20px; justify-content:center; align-items:center;">
                                                <div id="imageCropBoxContainer" style="display:flex; justify-content:center; align-items:center; margin-top:5px; width:100%;">
                                                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%;">
                                                        <div style="display:flex; flex-direction:row; align-items:flex-start; justify-content:center; width:100%;">
                                                            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:150px; margin-left: 32px; flex:0 0 auto;">
                                                                <div style="position:relative; width:150px;">
                                                                    <span id="closeCropBoxBtn" style="position:absolute; top:-10px; left:-10px; font-size:15px; color:#fff; background:rgba(0,0,0,0.85); border:none; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:100; box-shadow:0 2px 8px rgba(0,0,0,0.2);">&#10006;</span>
                                                                    <div id="cropBoxWrapper" style="width:150px; height:150px; background:#222; border:2px solid #ff9800; border-radius:8px; overflow:hidden; position:relative;">
                                                                        <canvas id="imageCropCanvas" width="150" height="150" style="display:block; position:absolute; left:0; top:0; width:150px; height:150px; background:#000; border-radius:8px;"></canvas>
                                                                        <div id="changeImageOverlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(30,30,30,0.7); color:#fff; font-weight:600; font-size:16px; border-radius:8px; align-items:center; justify-content:center; text-align:center; cursor:pointer; z-index:2;">
                                                                            Change Image
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; margin-top: 20px; flex:0 0 auto;">
                                                                    <input type="range" id="zoomSlider" min="1" max="1.5" step="0.01" value="1" style="writing-mode: bt-lr; -webkit-appearance: slider-vertical; appearance: slider-vertical; width:32px; height:120px; margin-top: 0;">
                                                            </div>
                                                        </div>
                                                        <div style="margin-top:16px; display:flex; flex-direction:row; gap:10px; align-items:center; justify-content:center; width:100%;">
                                                            <button type="button" id="moveLeftBtn" style="background:#333; color:#fff; border:none; border-radius:4px; width:32px; height:32px; font-size:18px; cursor:pointer;">&#8592;</button>
                                                            <button type="button" id="moveUpBtn" style="background:#333; color:#fff; border:none; border-radius:4px; width:32px; height:32px; font-size:18px; cursor:pointer;">&#8593;</button>
                                                            <button type="button" id="moveDownBtn" style="background:#333; color:#fff; border:none; border-radius:4px; width:32px; height:32px; font-size:18px; cursor:pointer;">&#8595;</button>
                                                            <button type="button" id="moveRightBtn" style="background:#333; color:#fff; border:none; border-radius:4px; width:32px; height:32px; font-size:18px; cursor:pointer;">&#8594;</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Tab Navigation -->
                            <div class="pos-tabs" style="display: flex; gap: 2px; margin-bottom: 10px;">
                                <button type="button" class="pos-tab-btn active" data-tab="colorShape" style="flex: 1; padding: 8px 12px; background: #ff9800; color: #171717; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                    Color & Shape
                                </button>
                                <button type="button" class="pos-tab-btn" data-tab="image" style="flex: 1; padding: 8px 12px; background: #333; color: #dbdbdb; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                    Image
                                </button>
                            </div>
                        </div>
                        <!-- Second row: Cancel (left) and Add (right) -->
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                            <button type="button" class="cancel-secondary" style="width: 90px; height: 40px;">Cancel</button>
                            <button type="submit" class="btn btn-primary" style="width: 120px; height: 40px;">Add Item</button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Barcode Results Tab Panel (separate from Add Items) -->
            <div id="barcodeResultsTabPanel" class="tab-panel" style="display:none;">
                <div class="modal-header">
                        <h2 class="modal-title"><span id="barcodeResultsHeaderPrefix">Items using barcode:</span> <span id="barcodeResultsHeaderValue" style="color:#ff9800; font-weight:600;"></span></h2>
                        <button type="button" class="inline-back" id="backFromBarcodeResults" aria-label="Back" title="Back">&larr;</button>
                    </div>
                <div class="modal-divider"></div>
                <div class="modal-body">
                    <div class="barcode-results-container">
                        <div class="barcode-results-inner">
                            <!-- Header row: aligns with result rows -->
                            <div class="barcode-results-header" role="row">
                                <div class="br-col br-col-main header">Category / Item</div>
                                <div class="br-col br-col-track header">Track stock</div>
                                <div class="br-col br-col-instock header">In stock</div>
                                <div class="br-col br-col-status header">Status</div>
                                <div class="br-col br-col-add header">No. of stock</div>
                            </div>
                            <div id="barcodeResultsMount" aria-live="polite"></div>
                        </div>
                    </div>
                    <!-- Template row: kept in DOM as fallback for JS cloning -->
                    <template id="barcodeResultRowTemplateStandalone">
                        <div class="barcode-result-row" role="group" aria-label="Barcode result">
                            <div class="br-col br-col-main">
                                <div class="br-category"></div>
                                <div class="br-name"></div>
                            </div>
                            <div class="br-col br-col-track">
                                <div class="track-toggle">
                                    <label class="switch">
                                        <input type="checkbox" class="br-track-toggle" aria-label="Track stock">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>
                            <div class="br-col br-col-instock">
                                <div class="br-instock-value">0</div>
                            </div>
                            <div class="br-col br-col-status">
                                <div class="br-status">With stocks</div>
                            </div>
                            <div class="br-col br-col-add">
                                <div class="add-input-row">
                                    <input type="number" class="br-add-qty" min="0" step="1" aria-label="No of stock" value="1"/>
                                    <button class="br-add-btn btn" type="button">Add stock</button>
                                </div>
                            </div>
                            <!-- Success area (hidden by default) -->
                            <div class="br-col br-col-success" style="display:none; grid-column: 1 / -1;">
                                <div class="br-success-inner" style="display:flex; width:100%; gap:12px; align-items:center;">
                                    <div class="br-success-message" aria-live="polite" style="flex:1;"></div>
                                    <div class="br-success-undo" style="width:110px; text-align:center;">
                                        <button type="button" class="br-undo btn" style="width:100%;">Undo</button>
                                    </div>
                                    <div class="br-success-addagain" style="width:110px; text-align:center;">
                                        <button type="button" class="br-add-again btn" style="width:100%;">Add again</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <style>
                        /* Small animation when stock is added */
                        .barcode-result-row.added {
                            animation: br-added 700ms ease-in-out;
                            background: linear-gradient(90deg, rgba(76,175,80,0.06), transparent);
                        }
                        @keyframes br-added {
                            0% { transform: translateY(0); box-shadow: none; }
                            30% { transform: translateY(-6px); box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
                            100% { transform: translateY(0); box-shadow: none; }
                        }
                        .br-success-message {
                            color: #4caf50;
                            font-weight: 600;
                            font-size: 14px;
                        }
                        /* Ensure the success column spans the whole row area */
                        .br-col-success {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: flex-start;
                            padding-left: 6px;
                            padding-right: 6px;
                            width: 100%;
                            box-sizing: border-box;
                        }
                        /* Floating ghost number when stock is added */
                        .ghost-add-number {
                            position: absolute;
                            background: transparent;
                            color: #66bb6a;
                            font-weight: 700;
                            font-size: 14px;
                            pointer-events: none;
                            text-shadow: 0 2px 6px rgba(0,0,0,0.6);
                            opacity: 1;
                            z-index: 5;
                            will-change: transform, opacity, left, top;
                            white-space: nowrap;
                        }
                        @keyframes ghost-float {
                            0% { transform: translateY(0) scale(1); opacity: 1; }
                            60% { transform: translateY(-22px) scale(1.05); opacity: 0.9; }
                            100% { transform: translateY(-46px) scale(1.0); opacity: 0; }
                        }
                        .br-success-actions .br-add-again { background: #ff9800; color: #171717; }
                        .br-success-actions .br-add-again { background: #ff9800; color: #171717; }
                    </style>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Product form submission handler
document.addEventListener('DOMContentLoaded', function() {
    // Color selection logic (always latest selected)
    let lastSelectedColor = null;
    document.querySelectorAll('.color-option').forEach(function(option) {
        option.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(function(opt) {
                opt.classList.remove('selected');
                opt.style.borderColor = 'transparent';
            });
            option.classList.add('selected');
            option.style.borderColor = '#ff9800';
            lastSelectedColor = option.getAttribute('data-color');
        });
    });
    // Shape selection logic (always latest selected)
    let lastSelectedShape = null;
    document.querySelectorAll('.shape-option').forEach(function(option) {
        option.addEventListener('click', function() {
            document.querySelectorAll('.shape-option').forEach(function(opt) {
                opt.classList.remove('selected');
                opt.style.borderColor = 'transparent';
            });
            option.classList.add('selected');
            option.style.borderColor = 'none';
            lastSelectedShape = option.getAttribute('data-shape');
        });
    });
    var addItemsForm = document.getElementById('inlineAddItemsForm');
    if (addItemsForm) {
        addItemsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Collect form data
            var name = document.getElementById('inlineItemName').value.trim();
            var category = document.getElementById('inlineItemCategory').value.trim();
            var price = document.getElementById('inlineItemPrice').value.replace(/[^\d.]/g, '');
    if (!price) price = 'variable';
            var cost = document.getElementById('inlineItemCost').value.replace(/[^\d.]/g, '');
            var trackStock = document.getElementById('inlineTrackStockToggle').checked ? 1 : 0;
            // Get unit suffix for inStock and lowStock
            var inStockInput = document.getElementById('inlineInStock');
            var inStockUnit = inStockInput && inStockInput.parentElement.querySelector('.unit-value') ? inStockInput.parentElement.querySelector('.unit-value').textContent.trim() : '';
            var inStock = '';
            if (inStockInput) {
                var val = inStockInput.value.trim();
                if (val) {
                    inStock = inStockUnit && inStockUnit !== '- -' ? val + ' ' + inStockUnit : val;
                } else {
                    // If tracking is on but user left the field empty, send empty string (not zero)
                    inStock = '';
                }
            } else {
                inStock = '';
            }

            var lowStockInput = document.getElementById('inlineLowStock');
            var lowStockUnit = lowStockInput && lowStockInput.parentElement.querySelector('.unit-value') ? lowStockInput.parentElement.querySelector('.unit-value').textContent.trim() : '';
            var lowStock = '';
            if (lowStockInput) {
                var val = lowStockInput.value.trim();
                if (val) {
                    lowStock = lowStockUnit && lowStockUnit !== '- -' ? val + ' ' + lowStockUnit : val;
                } else {
                    lowStock = '';
                }
            } else {
                lowStock = '';
            }
            var posAvailable = document.getElementById('availablePOS') ? document.getElementById('availablePOS').checked ? 1 : 0 : 1;
            // Representation
            var type = document.querySelector('input[name="representationType"]:checked') ? document.querySelector('input[name="representationType"]:checked').value : 'color_shape';
            // Get selected color and shape from UI
            var color = lastSelectedColor || '';
            var shape = lastSelectedShape || '';
            // If POS is checked and no color/shape selected, set defaults
            if (posAvailable && !color) color = 'gray';
            if (posAvailable && !shape) shape = 'square';
            var image_url = null;
            var imageInput = document.getElementById('productImageUrl') || document.querySelector('input[name="productImageUrl"]') || document.querySelector('.product-image-url input');
            if (imageInput) image_url = imageInput.value.trim();
            // Product SKU/Barcode
            var skuInput = document.getElementById('inlineItemSKU') || document.querySelector('input[name="itemSKU"]') || document.querySelector('.product-sku input');
            var barcodeInput = document.getElementById('inlineItemBarcode') || document.querySelector('input[name="itemBarcode"]') || document.querySelector('.product-barcode input');
            var sku = skuInput ? skuInput.value.trim() : '';
            var barcode = barcodeInput ? barcodeInput.value.trim() : '';
            // Variants
            var variants = [];
            var variantsTable = document.getElementById('variantsTableBody');
            if (variantsTable) {
                variantsTable.querySelectorAll('tr').forEach(function(row) {
                    // Robust selector for variant name input
                    var nameInput = row.querySelector('input.variant-name') || row.querySelector('.variant-name input');
                    var variantName = nameInput ? nameInput.value.trim() : '';
                    var priceInput = row.querySelector('input.variant-price');
                    var priceValue = priceInput ? priceInput.value.replace(/[^\d.]/g, '') : '';
                    if (!priceValue) priceValue = 'variable';
                    var variant = {
                        name: variantName,
                        price: priceValue,
                        cost: row.querySelector('input.variant-cost') ? row.querySelector('input.variant-cost').value.replace(/[^\d.]/g, '') : '',
                        // Get unit suffix for variant stock fields
                        in_stock: (function() {
                            var stockInput = row.querySelector('input.variant-stock');
                            var stockUnit = stockInput && stockInput.parentElement.querySelector('.unit-value') ? stockInput.parentElement.querySelector('.unit-value').textContent.trim() : '';
                            var val = stockInput ? stockInput.value.trim() : '';
                                if (val) {
                                    return stockUnit && stockUnit !== '- -' ? val + ' ' + stockUnit : val;
                                } else {
                                    // Variant left empty -> send empty instead of '0'
                                    return '';
                                }
                        })(),
                        low_stock: (function() {
                            var lowStockInput = row.querySelector('input.variant-low-stock');
                            var lowStockUnit = lowStockInput && lowStockInput.parentElement.querySelector('.unit-value') ? lowStockInput.parentElement.querySelector('.unit-value').textContent.trim() : '';
                            var val = lowStockInput ? lowStockInput.value.trim() : '';
                            if (val) {
                                return lowStockUnit && lowStockUnit !== '- -' ? val + ' ' + lowStockUnit : val;
                            } else {
                                return '';
                            }
                        })(),
                        sku: row.querySelector('input.variant-sku') ? row.querySelector('input.variant-sku').value.trim() : '',
                        barcode: row.querySelector('input.variant-barcode') ? row.querySelector('input.variant-barcode').value.trim() : '',
                        pos_available: 1 // Default to 1, adjust if you have a checkbox
                    };
                    variants.push(variant);
                });
                // Debug: log all variant names before sending
                console.log('Variant names:', variants.map(v => v.name));
            }
                // Client-side validation: require main Name and SKU (show both errors if both empty)
                var skuErrorMsg = document.getElementById('skuErrorMsg');
                var nameErrorMsg = document.getElementById('nameErrorMsg');
                // Clear previous inline errors
                if (skuErrorMsg) { skuErrorMsg.style.display = 'none'; skuErrorMsg.textContent = ''; }
                if (nameErrorMsg) { nameErrorMsg.style.display = 'none'; nameErrorMsg.textContent = ''; }

                var hasInlineError = false;
                if (!name || name === '') {
                    if (nameErrorMsg) {
                        nameErrorMsg.textContent = 'Name is required';
                        nameErrorMsg.style.display = 'block';
                    }
                    hasInlineError = true;
                }
                if (!sku || sku === '') {
                    if (skuErrorMsg) {
                        skuErrorMsg.textContent = 'SKU is required';
                        skuErrorMsg.style.display = 'block';
                    }
                    hasInlineError = true;
                }
                if (hasInlineError) {
                    return; // abort submit
                }

                // Check variant SKUs
                if (variants && variants.length > 0) {
                    for (var vi = 0; vi < variants.length; vi++) {
                        if (!variants[vi].sku || variants[vi].sku.trim() === '') {
                            // Find the corresponding row input and highlight
                            var variantRows = document.querySelectorAll('#variantsTableBody tr');
                            if (variantRows && variantRows[vi]) {
                                var vSkuInput = variantRows[vi].querySelector('input.variant-sku');
                                if (vSkuInput) {
                                    vSkuInput.focus();
                                    // Show a temporary inline error next to the field if desired
                                    // We'll reuse the global SKU error area for visibility
                                    if (skuErrorMsg) {
                                        skuErrorMsg.textContent = 'All variant SKUs are required';
                                        skuErrorMsg.style.display = 'block';
                                    }
                                }
                            }
                            return; // abort submit
                        }
                    }
                }

                // Send all product data to API (only once, with all fields)
                // Normalize stock fields: if tracking is disabled or user left field empty, send empty string
                var payloadInStock = (trackStock && inStock) ? inStock : '';
                var payloadLowStock = (trackStock && lowStock) ? lowStock : '';
                fetch('api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        category,
                        price,
                        cost,
                        track_stock: trackStock,
                        in_stock: payloadInStock,
                        low_stock: payloadLowStock,
                        pos_available: posAvailable,
                        type,
                        color,
                        shape,
                        image_url,
                        sku,
                        barcode,
                        variants
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Show temporary success popup
                        showSuccessPopup('Product successfully added!');

                        // Run the requested success UI flow:
                        // 1) switch back to the previous tab
                        // 2) fetch next SKU and populate the inline SKU input
                        // 3) then close the modal after a short delay
                        try {
                            // 1) show appropriate tab: if user came from MANUAL, switch to SCAN so they can continue scanning;
                            // otherwise return to previous tab.
                            if (typeof showTab === 'function') {
                                try {
                                    if (typeof previousTab !== 'undefined' && previousTab === 'manual') {
                                        showTab('scan');
                                    } else {
                                        showTab(previousTab);
                                    }
                                } catch (e) {
                                    // Fallback to scan if previousTab isn't available
                                    showTab('scan');
                                }
                            }

                            // 2) fetch next SKU and set it in the inline form (if present)
                            setTimeout(function() {
                                fetch('get_next_sku.php')
                                    .then(function(resp) { return resp.json(); })
                                    .then(function(skuData) {
                                        if (skuData && skuData.next_sku) {
                                            var skuInput = document.querySelector('#inlineAddItemsForm input[name="itemSKU"], #inlineItemSKU');
                                            if (skuInput) skuInput.value = skuData.next_sku;
                                        }
                                    })
                                    .finally(function() {
                                        // 3) close the modal after ensuring UI updated
                                        var scannerModal = document.getElementById('scannerModal');
                                        if (scannerModal) {
                                            setTimeout(function() {
                                                scannerModal.style.display = 'none';
                                                scannerModal.classList.remove('show');
                                            }, 300); // small delay to let SKU populate
                                        }
                                    });
                            }, 300);
                        } catch (e) {
                            // If anything fails, still close the modal safely
                            console.error(e);
                            var scannerModal = document.getElementById('scannerModal');
                            if (scannerModal) {
                                scannerModal.style.display = 'none';
                                scannerModal.classList.remove('show');
                            }
                        }

                        // Reset modal fields and visual state (keep modal-close timing above)
                        addItemsForm.reset();
                        var stockFieldsRow = document.getElementById('stockFieldsRow');
                        if (stockFieldsRow) stockFieldsRow.style.display = 'none';
                        document.querySelectorAll('.color-option').forEach(function(opt) {
                            opt.classList.remove('selected');
                            opt.style.borderColor = 'transparent';
                        });
                        document.querySelectorAll('.shape-option').forEach(function(opt) {
                            opt.classList.remove('selected');
                            opt.style.borderColor = 'transparent';
                        });
                        lastSelectedColor = null;
                        lastSelectedShape = null;
                        var posCheckbox = document.getElementById('availablePOS');
                        var posOptions = document.getElementById('posOptionsContainer');
                        var productForm = document.querySelector('.product-form');
                        if (posCheckbox) posCheckbox.checked = false;
                        if (posOptions) {
                            posOptions.classList.remove('slide-up');
                            posOptions.style.display = 'none';
                        }
                        if (productForm) productForm.classList.remove('pos-options-active');
                        var skuErrorMsg = document.getElementById('skuErrorMsg');
                        if (skuErrorMsg) {
                            skuErrorMsg.style.display = 'none';
                            skuErrorMsg.textContent = '';
                        }
                    } else {
                        // Keep modal open. Show inline errors for SKU or Name if returned by server.
                        var skuErrorMsg = document.getElementById('skuErrorMsg');
                        var nameErrorMsg = document.getElementById('nameErrorMsg');
                        // Reset inline errors
                        if (skuErrorMsg) { skuErrorMsg.style.display = 'none'; skuErrorMsg.textContent = ''; }
                        if (nameErrorMsg) { nameErrorMsg.style.display = 'none'; nameErrorMsg.textContent = ''; }

                        if (data.error) {
                            var lower = data.error.toLowerCase();
                            if (lower.includes('sku') && skuErrorMsg) {
                                skuErrorMsg.textContent = data.error;
                                skuErrorMsg.style.display = 'block';
                            } else if ((lower.includes('name') || lower.includes('required')) && nameErrorMsg) {
                                nameErrorMsg.textContent = data.error;
                                nameErrorMsg.style.display = 'block';
                            } else {
                                // Fallback: generic error popup
                                showErrorPopup('Error: ' + data.error);
                            }
                        } else {
                            showErrorPopup('Error: Unknown error');
                        }
                    }
                })
                .catch(err => {
                    showErrorPopup('Error: ' + err);
                });
// Success popup function
function showSuccessPopup(message) {
    var popup = document.createElement('div');
    popup.textContent = message;
    popup.style.position = 'fixed';
    popup.style.top = '30px';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.background = '#4caf50';
    popup.style.color = '#fff';
    popup.style.padding = '16px 32px';
    popup.style.borderRadius = '8px';
    popup.style.fontSize = '18px';
    popup.style.zIndex = '9999';
    popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    document.body.appendChild(popup);
    setTimeout(function() {
        popup.remove();
    }, 1200);
}
// Error popup function
function showErrorPopup(message) {
    var popup = document.createElement('div');
    popup.textContent = message;
    popup.style.position = 'fixed';
    popup.style.top = '30px';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.background = '#dc3545';
    popup.style.color = '#fff';
    popup.style.padding = '16px 32px';
    popup.style.borderRadius = '8px';
    popup.style.fontSize = '18px';
    popup.style.zIndex = '9999';
    popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    document.body.appendChild(popup);
    setTimeout(function() {
        popup.remove();
    }, 1800);
}
        });
    }
});
// Show 'Change Image' overlay on cropBoxWrapper hover and trigger file dialog on click
document.addEventListener('DOMContentLoaded', function() {
    var closeModalBtn = document.getElementById('closeModalBtn');
    var scannerModal = document.getElementById('scannerModal');
    if (closeModalBtn && scannerModal) {
        closeModalBtn.addEventListener('click', function(e) {
            scannerModal.style.display = 'none';
            scannerModal.classList.remove('show');
        });
    }
    // Close modal when clicking outside modal-content
    if (scannerModal) {
        scannerModal.addEventListener('mousedown', function(e) {
            var modalContent = scannerModal.querySelector('.modal-content');
            if (modalContent && !modalContent.contains(e.target)) {
                scannerModal.style.display = 'none';
                scannerModal.classList.remove('show');
                // Stop scanner/camera if closing modal
                if (typeof stopScanner === 'function') {
                    stopScanner();
                }
            }
        });
    }
    // Optional: If you use a function to open modal, ensure it sets display to 'block' and adds 'show' class
    window.openScannerModal = function() {
        if (scannerModal) {
            scannerModal.style.display = 'block';
            scannerModal.classList.add('show');
            // If scan tab is active, start scanner/camera
            var scanPanel = document.getElementById('scanTabPanel');
            if (scanPanel && scanPanel.style.display !== 'none') {
                if (typeof startQuaggaScanner === 'function') {
                    startQuaggaScanner();
                }
            }
        }
    }
    // Crop box logic ...existing code...
    var cropBoxWrapper = document.getElementById('cropBoxWrapper');
    var closeCropBoxBtn = document.getElementById('closeCropBoxBtn');
    if (cropBoxWrapper && closeCropBoxBtn) {
        closeCropBoxBtn.style.display = 'none';
        let isHoveringCrop = false;
        let isHoveringBtn = false;
        function updateXVisibility() {
            closeCropBoxBtn.style.display = (isHoveringCrop || isHoveringBtn) ? 'flex' : 'none';
        }
        cropBoxWrapper.addEventListener('mouseenter', function() {
            isHoveringCrop = true;
            updateXVisibility();
        });
        cropBoxWrapper.addEventListener('mouseleave', function() {
            isHoveringCrop = false;
            setTimeout(updateXVisibility, 10);
        });
        closeCropBoxBtn.addEventListener('mouseenter', function() {
            isHoveringBtn = true;
            updateXVisibility();
        });
        closeCropBoxBtn.addEventListener('mouseleave', function() {
            isHoveringBtn = false;
            setTimeout(updateXVisibility, 10);
        });
    }
    var cropBoxWrapper = document.getElementById('cropBoxWrapper');
    var changeImageOverlay = document.getElementById('changeImageOverlay');
    var fileInput = document.getElementById('posProductImage');
    var closeCropBoxBtn = document.getElementById('closeCropBoxBtn');
    var uploadedImageArea = document.getElementById('uploadedImageArea');
    var imageUploadArea = document.getElementById('imageUploadArea');
    if (cropBoxWrapper && changeImageOverlay && fileInput) {
        cropBoxWrapper.addEventListener('mouseenter', function() {
            changeImageOverlay.style.display = 'flex';
        });
        cropBoxWrapper.addEventListener('mouseleave', function() {
            changeImageOverlay.style.display = 'none';
        });
        changeImageOverlay.addEventListener('click', function(e) {
            // Only trigger file dialog if not clicking the X button
            if (e.target.id !== 'closeCropBoxBtn') {
                e.stopPropagation();
                fileInput.click();
            }
        });
        if (closeCropBoxBtn) {
            closeCropBoxBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                // Hide all uploaded image areas, show upload area, reset file input
                var uploadedImageAreas = document.querySelectorAll('#uploadedImageArea');
                uploadedImageAreas.forEach(function(area) { area.style.display = 'none'; });
                var imageUploadArea = document.getElementById('imageUploadArea');
                if (imageUploadArea) imageUploadArea.style.display = 'block';
                var fileInput = document.getElementById('posProductImage');
                if (fileInput) fileInput.value = '';
                var uploadPlaceholder = document.getElementById('uploadPlaceholder');
                if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
                var uploadedImagePreview = document.getElementById('uploadedImagePreview');
                if (uploadedImagePreview) uploadedImagePreview.src = '';
                // If cropImage is a global variable, reset it
                if (typeof cropImage !== 'undefined') cropImage = null;
                // Optionally clear the canvas
                var cropCanvas = document.getElementById('imageCropCanvas');
                if (cropCanvas) {
                    var ctx = cropCanvas.getContext('2d');
                    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
                }
            });
        }
    }
});


document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#imageTab #imageUploadArea').forEach(function(imageUploadArea) {
        const fileInput = imageUploadArea.querySelector('input[type="file"]');
        const uploadPlaceholder = imageUploadArea.querySelector('#uploadPlaceholder');
        const uploadedImageArea = imageUploadArea.parentElement.querySelector('#uploadedImageArea');
        const cropCanvas = uploadedImageArea ? uploadedImageArea.querySelector('#imageCropCanvas') : null;
    let cropImage = null;
    let posX = 0, posY = 0, zoom = 1;
        if (imageUploadArea && fileInput && uploadPlaceholder && uploadedImageArea && cropCanvas) {
            imageUploadArea.addEventListener('click', function(e) {
                if (uploadPlaceholder.style.display !== 'none') {
                    fileInput.click();
                }
            });
            fileInput.addEventListener('change', function(e) {
                const file = fileInput.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        cropImage = new window.Image();
                        cropImage.onload = function() {
                            uploadPlaceholder.style.display = 'none';
                            uploadedImageArea.style.display = 'flex';
                            imageUploadArea.style.display = 'none';
                            // Calculate initial zoom to cover crop box
                            const cropW = cropCanvas.width;
                            const cropH = cropCanvas.height;
                            const imgW = cropImage.width;
                            const imgH = cropImage.height;
                            zoom = Math.max(cropW / imgW, cropH / imgH);
                            // Center image
                            posX = 0;
                            posY = 0;
                            drawCropImage();
                            // Set slider min/max/value
                            if (zoomSlider) {
                                zoomSlider.min = zoom.toFixed(2);
                                zoomSlider.max = (zoom * 1.5).toFixed(2);
                                zoomSlider.value = zoom.toFixed(2);
                            }
                        };
                        cropImage.src = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
            function drawCropImage() {
                if (!cropImage) return;
                const ctx = cropCanvas.getContext('2d');
                ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
                // Calculate scaled image size
                const iw = cropImage.width * zoom;
                const ih = cropImage.height * zoom;
                // Only allow movement if image overflows crop box
                const canMoveX = iw > cropCanvas.width;
                const canMoveY = ih > cropCanvas.height;
                // Clamp posX/posY so image never leaves empty space
                if (!canMoveX) posX = 0;
                else {
                    const maxX = (iw - cropCanvas.width) / 2;
                    posX = Math.max(-maxX, Math.min(maxX, posX));
                }
                if (!canMoveY) posY = 0;
                else {
                    const maxY = (ih - cropCanvas.height) / 2;
                    posY = Math.max(-maxY, Math.min(maxY, posY));
                }
                // Center position, then apply posX/posY offset
                const cx = cropCanvas.width / 2 - iw / 2 + posX;
                const cy = cropCanvas.height / 2 - ih / 2 + posY;
                ctx.drawImage(cropImage, cx, cy, iw, ih);
            }
            // Controls
            const moveLeftBtn = document.getElementById('moveLeftBtn');
            const moveRightBtn = document.getElementById('moveRightBtn');
            const moveUpBtn = document.getElementById('moveUpBtn');
            const moveDownBtn = document.getElementById('moveDownBtn');
            const zoomSlider = document.getElementById('zoomSlider');
            if (moveLeftBtn) moveLeftBtn.addEventListener('click', function() {
                // Only move if image overflows horizontally
                const iw = cropImage ? cropImage.width * zoom : 0;
                if (iw > cropCanvas.width) { posX += 10; drawCropImage(); }
            });
            if (moveRightBtn) moveRightBtn.addEventListener('click', function() {
                const iw = cropImage ? cropImage.width * zoom : 0;
                if (iw > cropCanvas.width) { posX -= 10; drawCropImage(); }
            });
            if (moveUpBtn) moveUpBtn.addEventListener('click', function() {
                const ih = cropImage ? cropImage.height * zoom : 0;
                if (ih > cropCanvas.height) { posY += 10; drawCropImage(); }
            });
            if (moveDownBtn) moveDownBtn.addEventListener('click', function() {
                const ih = cropImage ? cropImage.height * zoom : 0;
                if (ih > cropCanvas.height) { posY -= 10; drawCropImage(); }
            });
            if (zoomSlider) zoomSlider.addEventListener('input', function() { zoom = parseFloat(this.value); drawCropImage(); });
        }
    });
});

// Input validation for Next button is now handled in inventory.js

document.addEventListener('DOMContentLoaded', function() {
    var posCheckbox = document.getElementById('availablePOS');
    var posOptions = document.getElementById('posOptionsContainer');
    var posChevron = document.getElementById('posToggleChevron');
    var chevronPath = document.getElementById('chevronPath');
    var modalFooter = document.querySelector('.modal-footer');
    var productForm = document.querySelector('.product-form');
    function updateChevronVisibility() {
        if (posCheckbox.checked) {
            posChevron.style.display = 'inline-block';
        } else {
            posChevron.style.display = 'none';
        }
    }
    if (posCheckbox && posOptions && posChevron && chevronPath) {
        function updateChevron() {
            if (posOptions.classList.contains('slide-up')) {
                chevronPath.setAttribute('d', 'M4.18179 8.81819C4.00605 8.64245 4.00605 8.35753 4.18179 8.18179L7.18179 5.18179C7.26618 5.0974 7.38064 5.04999 7.49999 5.04999C7.61933 5.04999 7.73379 5.0974 7.81819 5.18179L10.8182 8.18179C10.9939 8.35753 10.9939 8.64245 10.8182 8.81819C10.6424 8.99392 10.3575 8.99392 10.1818 8.81819L7.49999 6.13638L4.81819 8.81819C4.64245 8.99392 4.35753 8.99392 4.18179 8.81819Z');
            } else {
                chevronPath.setAttribute('d', 'M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z');
            }
        }
        posCheckbox.addEventListener('change', function() {
            updateChevronVisibility();
            if (this.checked) {
                posOptions.style.display = 'block';
                setTimeout(function() {
                    posOptions.classList.add('slide-up');
                    updateChevron();
                    if (productForm) productForm.classList.add('pos-options-active');
                }, 10);
            } else {
                posOptions.classList.remove('slide-up');
                setTimeout(function() {
                    posOptions.style.display = 'none';
                    updateChevron();
                    if (productForm) productForm.classList.remove('pos-options-active');
                }, 400);
            }
        });
        posChevron.addEventListener('click', function() {
            if (!posCheckbox.checked) return;
            if (posOptions.classList.contains('slide-up')) {
                posOptions.classList.remove('slide-up');
                setTimeout(function() {
                    posOptions.style.display = 'none';
                    updateChevron();
                    if (productForm) productForm.classList.remove('pos-options-active');
                }, 400);
            } else {
                posOptions.style.display = 'block';
                setTimeout(function() {
                    posOptions.classList.add('slide-up');
                    updateChevron();
                    if (productForm) productForm.classList.add('pos-options-active');
                }, 10);
            }
        });

        updateChevronVisibility();
        updateChevron();

        // POS tab disabling logic
        var colorShapeTabBtn = document.querySelector('.pos-tab-btn[data-tab="colorShape"]');
        var imageTabBtn = document.querySelector('.pos-tab-btn[data-tab="image"]');
        var colorShapeTabPanel = document.getElementById('colorShapeTab');
        var imageTabPanel = document.getElementById('imageTab');
        function setTabDisabling() {
            if (colorShapeTabBtn && imageTabBtn && colorShapeTabPanel && imageTabPanel) {
                if (colorShapeTabBtn.classList.contains('active')) {
                    colorShapeTabPanel.setAttribute('aria-disabled', 'false');
                    imageTabPanel.setAttribute('aria-disabled', 'true');
                } else if (imageTabBtn.classList.contains('active')) {
                    colorShapeTabPanel.setAttribute('aria-disabled', 'true');
                    imageTabPanel.setAttribute('aria-disabled', 'false');
                }
            }
        }
        // Initial state
        setTabDisabling();
        // Listen for tab button clicks
        if (colorShapeTabBtn && imageTabBtn) {
            colorShapeTabBtn.addEventListener('click', function() {
                colorShapeTabBtn.classList.add('active');
                imageTabBtn.classList.remove('active');
                colorShapeTabPanel.style.display = 'block';
                imageTabPanel.style.display = 'none';
                setTabDisabling();
            });
            imageTabBtn.addEventListener('click', function() {
                imageTabBtn.classList.add('active');
                colorShapeTabBtn.classList.remove('active');
                imageTabPanel.style.display = 'block';
                colorShapeTabPanel.style.display = 'none';
                setTabDisabling();
            });
        }

        // Hide POS options when clicking outside POS options and footer
        let blockNextToggle = false;
        document.addEventListener('mousedown', function(e) {
            if (
                posCheckbox.checked &&
                posOptions.classList.contains('slide-up') &&
                !posOptions.contains(e.target) &&
                !(modalFooter && modalFooter.contains(e.target)) &&
                !(posChevron && posChevron.contains(e.target)) &&
                !(posCheckbox && posCheckbox.contains(e.target))
            ) {
                // If clicking on product form, block the next toggle
                if (productForm && productForm.contains(e.target)) {
                    blockNextToggle = true;
                    e.preventDefault();
                    e.stopPropagation();
                }
                posOptions.classList.remove('slide-up');
                setTimeout(function() {
                    posOptions.style.display = 'none';
                    updateChevron();
                    if (productForm) productForm.classList.remove('pos-options-active');
                }, 400);
            }
        });

        // Specifically block the first click on the track stock toggle after hiding POS options
        var trackStockToggle = document.getElementById('inlineTrackStockToggle');
        if (trackStockToggle) {
            trackStockToggle.addEventListener('click', function(e) {
                if (blockNextToggle) {
                    e.preventDefault();
                    e.stopPropagation();
                    blockNextToggle = false;
                }
            }, true);
        }
    }
});

// Crop controls and zoom slider JS
document.addEventListener('DOMContentLoaded', function() {
    const uploadedImagePreview = document.getElementById('uploadedImagePreview');
    const cropLeft = document.getElementById('cropLeft');
    const cropUp = document.getElementById('cropUp');
    const cropDown = document.getElementById('cropDown');
    const cropRight = document.getElementById('cropRight');
    const zoomSlider = document.getElementById('zoomSlider');
    // Track position and zoom
    let posX = 0, posY = 0, zoom = 1;
    function updateTransform() {
        uploadedImagePreview.style.transform = `translate(${posX}px, ${posY}px) scale(${zoom})`;
    }
    if (cropLeft) cropLeft.addEventListener('click', function() { posX -= 10; updateTransform(); });
    if (cropRight) cropRight.addEventListener('click', function() { posX += 10; updateTransform(); });
    if (cropUp) cropUp.addEventListener('click', function() { posY -= 10; updateTransform(); });
    if (cropDown) cropDown.addEventListener('click', function() { posY += 10; updateTransform(); });
    if (zoomSlider) zoomSlider.addEventListener('input', function() { zoom = parseFloat(this.value); updateTransform(); });
});

// Crop box movement and zoom logic with smooth zoom
document.addEventListener('DOMContentLoaded', function() {
    const cropBoxPreview = document.getElementById('imageCropPreview');
    const moveLeftBtn = document.getElementById('moveLeftBtn');
    const moveUpBtn = document.getElementById('moveUpBtn');
    const moveDownBtn = document.getElementById('moveDownBtn');
    const moveRightBtn = document.getElementById('moveRightBtn');
    const zoomSlider = document.getElementById('zoomSlider');
    let posX = 50, posY = 50, zoom = 1; // Start centered

    function updateCrop() {
        if (cropBoxPreview) {
            cropBoxPreview.style.transformOrigin = '50% 50%';
            cropBoxPreview.style.objectFit = 'cover';
            cropBoxPreview.style.transform = 'scale(' + zoom + ')';
            if (zoom > 1) {
                cropBoxPreview.style.objectPosition = posX + '% ' + posY + '%';
            } else {
                cropBoxPreview.style.objectPosition = '50% 50%';
            }
        }
    }

    if (moveLeftBtn) moveLeftBtn.addEventListener('click', function() { if (zoom > 1) { posX = Math.max(0, posX - 5); updateCrop(); } });
    if (moveRightBtn) moveRightBtn.addEventListener('click', function() { if (zoom > 1) { posX = Math.min(100, posX + 5); updateCrop(); } });
    if (moveUpBtn) moveUpBtn.addEventListener('click', function() { if (zoom > 1) { posY = Math.max(0, posY - 5); updateCrop(); } });
    if (moveDownBtn) moveDownBtn.addEventListener('click', function() { if (zoom > 1) { posY = Math.min(100, posY + 5); updateCrop(); } });
    if (zoomSlider) zoomSlider.addEventListener('input', function() { zoom = parseFloat(this.value); updateCrop(); });

    // Ensure image is fitted to box on load
    if (cropBoxPreview) {
        cropBoxPreview.style.objectFit = 'cover';
        cropBoxPreview.style.objectPosition = '50% 50%';
        cropBoxPreview.style.background = '#222';
    }
});

</script>
<script>
// Allow pressing Enter on inputs inside the MANUAL tab to trigger the Next button
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        var manualPanel = document.getElementById('manualTabPanel');
        var nextBtn = document.getElementById('nextBtn');
        if (!manualPanel || !nextBtn) return;

        // Keydown on the panel - works even if inputs are dynamically added
        manualPanel.addEventListener('keydown', function(e) {
            // Only handle plain Enter (no modifiers)
            if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;

            var target = e.target;
            if (!target) return;

            var tag = target.tagName ? target.tagName.toLowerCase() : '';

            // Only trigger from text-like inputs, textarea or select (ignore checkboxes/radios/buttons)
            if (tag === 'input') {
                var t = (target.type || '').toLowerCase();
                if (t === 'checkbox' || t === 'radio' || t === 'button' || t === 'submit' || t === 'file') return;
            } else if (tag !== 'textarea' && tag !== 'select' && !target.isContentEditable) {
                return;
            }

            // Prevent default (e.g. accidental form submit) and trigger Next
            e.preventDefault();
            try {
                nextBtn.click();
            } catch (err) {
                // Fallback: focus then press Enter programmatically
                try { nextBtn.focus(); } catch (e) {}
            }
        });
    });
})();
</script>
<script src="inventory.js"></script>
</body>
</html>

