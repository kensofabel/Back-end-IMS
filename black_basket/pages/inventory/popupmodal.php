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
                    grid-template-columns: .8fr .6fr .5fr .7fr 1.3fr;
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
                /* Row wrapper and variant list styling to preserve grid columns (use template grid) */
                .br-row-wrapper {
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                    clear: both;
                }
                /* Ensure header and rows' column cells share the same inline-flex sizing so grid fr units control layout.
                   Use padding-right instead of external margins so cells don't cause horizontal overflow. */
                .barcode-results-header > .br-col,
                .barcode-result-row > .br-col {
                    display: inline-flex;
                    align-items: center;
                    padding-right: 12px;
                    min-width: 0; /* allow ellipsis inside flex/grid */
                    box-sizing: border-box;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                /* Slightly smaller internal spacing for variant rows */
                .variant-list .barcode-result-row > .br-col {
                    padding-right: 8px;
                }
                /* Give variant rows their own grid template so you can adjust column widths separately.
                   Default is a slightly different proportion — override by setting --variant-grid-columns
                   on .variant-list or via this selector. */
                .variant-list .barcode-result-row {
                    display: grid;
                    /* Adjustable via CSS variable; change to suit your layout */
                    grid-template-columns: var(--variant-grid-columns, 1.1fr .5fr .7fr 1.3fr);
                    gap: 8px;
                    align-items: center;
                    padding: 8px 8px 6px 8px;
                    background: transparent;
                }
                /* Last header column (No. of stock) should be left-aligned and use flex layout
                   instead of centered — target only the header's last .br-col */
                .barcode-results-header > .br-col:last-child {
                    display: flex;
                    justify-content: flex-start;
                    align-items: flex-start;
                    padding-right: 12px;
                }

                /* Keep the first grid column centered horizontally, but align its inner content to the top-left.
                   This keeps the column centered in the grid while the category/name stack starts at the top-left. */
                .barcode-result-row > .br-col:first-child {
                    padding-left: 8px;
                    /* center the cell within the grid column */
                    justify-content: center;
                    /* stack children from the top and left */
                    align-items: flex-start;
                    text-align: left;
                }

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
                .barcode-result-row input.br-add-qty:focus {
                    border: 1px solid #ff9800; /* or #333 for consistent color */
                    outline: none;
                }
                /* WebKit number input spinner styling */
                .barcode-result-row input[type=number]::-webkit-outer-spin-button,
                .barcode-result-row input[type=number]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }

                /* Stronger target for the actual typed text: reduce font-size and padding so typed text is smaller */
                #createItemSearch,
                .create-autocomplete input[type="text"] {
                    font-size: 16px !important;
                    line-height: 1.1 !important;
                    padding: 10px 15px !important;
                }

                .create-dropdown .create-option,
                .create-option {
                    padding: 5px 15px;
                }

                .create-autocomplete input::placeholder {
                    font-size: 16px !important;
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
    </style>
    <style>
    /* Hide number input spinners for create-tab quantity inputs (only targets .comp-qty)
       — keeps spinner behavior for other number inputs intact. */
    .comp-qty::-webkit-outer-spin-button,
    .comp-qty::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    /* Firefox */
    .comp-qty {
        -moz-appearance: textfield;
        appearance: textfield;
    }
    </style>
    <style>
    /* Container holds header, scrollable body, and footer. Body is the only scrollable part. */
    .create-table-container { width: 100%; }
    .create-table-body-container {
        max-height: 260px; /* adjust as desired */
        overflow-y: auto;
        overflow-x: hidden;
        background: transparent; /* make scroller background transparent */
        -webkit-overflow-scrolling: touch;
    }
    /* make the inner table background transparent so rows show through */
    #createComponentsBodyTable {
        background: transparent;
    }
    /* Keep table layout stable and allow column widths to align */
    #createComponentsTable,
    #createComponentsBodyTable {
        border-collapse: collapse;
    }
    /* Custom scrollbar: transparent track so the modal background shows through */
    .create-table-body-container::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }
    .create-table-body-container::-webkit-scrollbar-track {
        background: transparent;
    }
    .create-table-body-container::-webkit-scrollbar-thumb {
        background: #2b2b2b;
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: content-box;
    }
    /* Variant select inside component rows */
    .comp-variant {
        background:#171717;
        color:#fff;
        border:1px solid #333;
        padding:4px;
        border-radius:4px;
        font-size:14px;
        min-width:160px;
    }
    /* Make the main item cell hoverable only when it is interactive (has variants).
       Non-interactive items will not show hover/click affordance. */
    .comp-name {
        display: block;
        padding: 0 8px;
        border-radius: 6px;
        transition: background 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        cursor: default;
        background: transparent;
        border: 1px solid transparent;
        max-width: 100%;
        box-sizing: border-box;
    }
    /* When the row has variants, mark the cell .interactive so it shows the panel style by default */
    .comp-name.interactive {
        /* leave room on the right for the chevron (slightly reduced) */
        position: relative;
        padding: 4px 28px 4px 8px;
        cursor: pointer;
        background: #1f1f1f; /* same dark panel used elsewhere */
        border-color: #333;
        box-shadow: 0 6px 18px rgba(0,0,0,0.18);
    }
    /* Right-hand chevron like the category select: small triangle that rotates when open */
    .comp-name.interactive::after {
        content: "";
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%) rotate(0deg);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #cfcfcf; /* chevron color (smaller) */
        transition: transform 140ms ease, opacity 120ms ease;
        opacity: 0.95;
        pointer-events: none;
    }
    /* rotate the chevron when the cell is marked open */
    .comp-name.interactive.open::after {
        transform: translateY(-50%) rotate(180deg);
    }
    .comp-name.interactive:hover,
    .comp-name.interactive:focus,
    .comp-name.interactive:active {
        background: #232323;
        border-color: #444;
        box-shadow: 0 8px 22px rgba(0,0,0,0.22);
    }
    </style>
</head>
<!-- Scanner/Manual/Add Items Modal with Tab Panels -->
<div class="modal" id="scannerModal">
    <span id="closeModalBtn" style="position:absolute; top:15px; right:15px; font-size:20px; color:#fff; background: none; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:100; box-shadow:0 2px 8px rgba(0,0,0,0.2);">&#10006;</span>
    <div class="modal-content scanner-modal">
        <div class="modal-tabs">
            <button class="scanner-tab" id="createTab">CREATE</button>
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
            <!-- Create Tab Panel -->
            <div id="createTabPanel" class="tab-panel" style="display:none;">
                <div class="modal-body">
                    <div style="margin-bottom:12px;">
                        <div class="create-table-container">
                            <!-- Header table (fixed) -->
                            <table id="createComponentsTable" style="width:100%; border-collapse:collapse;">
                                <!-- Define column widths here so header and body table columns match -->
                                <colgroup>
                                    <col style="width: auto;">
                                    <col style="width: 18%;">
                                    <col style="width: 17%;">
                                    <col style="width: 45px;">
                                </colgroup>
                                <thead>
                                    <tr style="text-align:left; color:#dbdbdb; border-bottom:1px solid #333;">
                                        <th style="padding:8px; padding-left: 15px;">Component</th>
                                        <th style="padding:8px; text-align:right;">Quantity</th>
                                        <th style="padding:8px; text-align:right;">Cost</th>
                                        <th style="padding:8px; text-align:center;">&nbsp;</th>
                                    </tr>
                                </thead>
                            </table>

                            <!-- Scrollable body (only this scrolls) -->
                            <div class="create-table-body-container">
                                <table id="createComponentsBodyTable" style="width:100%; border-collapse:collapse;">
                                    <colgroup>
                                        <col style="width: auto;">
                                        <col style="width: 18%;">
                                        <col style="width: 17%;">
                                        <col style="width: 45px;">
                                    </colgroup>
                                    <tbody id="createComponentsBody">
                                        <!-- Component rows will be added here -->
                                    </tbody>
                                </table>
                            </div>

                            <!-- Footer (search + total) stays fixed below the list) -->
                            <div class="create-table-footer" style="margin-top:8px;">
                                <div style="padding-top:6px;">
                                    <div class="create-autocomplete" style="width:100%; position:relative;">
                                        <input id="createItemSearch" placeholder="Item search" style="width:100%; padding:10px; background:#171717; border:1px solid #333; color:#fff; border-radius:6px;" autocomplete="off" />
                                        <div class="create-dropdown" id="createDropdown"></div>
                                    </div>
                                </div>
                                <div style="display:flex; justify-content:flex-end; margin-top:8px;">
                                    <div style="text-align:right; color:#fff; align-self:right;">Total cost:</div>
                                    <div id="createTotalCost" style="color:#fff; text-align:left; padding-left: 30px; min-width:120px;">₱0.00</div>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary" id="nextBtn">Next</button>
                    </div>
                    <div class="skip-section">
                        <button type="button" class="skip-btn" id="skipCreateTab">Skip for now</button>
                    </div>
                </div>
            </div>
            <!-- Add Items/Product Tab Panel -->
            <div id="addItemsTabPanel" class="tab-panel" style="display:none;">
                <div class="modal-header">
                    <h2 class="modal-title">Add new item</h2>
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
                            <input type="checkbox" id="availablePOS" name="availablePOS" class="field-checkbox" checked>
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
                                <div class="br-col br-col-instock header">Stock</div>
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
                                    <div class="br-success-message" aria-live="polite" style="flex:10 1 400px;"></div>
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
                        /* Success column: message wraps, buttons stay right */
                        .br-col-success {
                            display: flex;
                            flex-direction: row;
                            flex-wrap: wrap;
                            align-items: center;
                            justify-content: flex-end;
                            gap: 8px;
                            min-width: 0;
                        }

                        .br-success-message {
                            flex: 10 1 400px;
                            min-width: 0;
                            max-width: 100%;
                            white-space: normal;
                            word-break: break-word;
                            font-size: 16px;
                            line-height: 1.4;
                        }

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
// Create tab behavior: add/remove components and update total
document.addEventListener('DOMContentLoaded', function() {
    try {
    const createTabBtn = document.getElementById('createTab');
    const createTabPanel = document.getElementById('createTabPanel');
    const createItemSearch = document.getElementById('createItemSearch');
    const componentsBody = document.getElementById('createComponentsBody');
    const totalCostEl = document.getElementById('createTotalCost');
    // Compute absolute path for variants API so fetch works regardless of include path
    <?php $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); $variantsPath = $base . '/variants_api.php'; ?>
    const variantsApiPath = '<?php echo $variantsPath; ?>';

        function formatCurrency(n) {
            // Basic formatting — keep existing currency symbol used elsewhere
            const num = parseFloat(n) || 0;
            return '₱' + num.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
        }

        function recalcTotal() {
            let total = 0;
            const rows = componentsBody.querySelectorAll('tr.component-row');
            rows.forEach(r => {
                const q = parseFloat(r.querySelector('.comp-qty').value) || 0;
                const c = parseFloat(r.querySelector('.comp-cost').value.replace(/[^0-9.-]/g,'')) || 0;
                total += q * c;
            });
            totalCostEl.textContent = formatCurrency(total);
        }

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
                <td style="padding:8px; width:120px; text-align:right;"><input class="comp-qty" type="number" min="0" value="${qty}" style="width:100%; padding:6px; background:#171717; border:1px solid #333; color:#fff; border-radius:4px; text-align:right;" /></td>
                <td style="padding:8px; width:120px; text-align:right;"><input class="comp-cost" currency-localization="₱" readonly value="${'₱' + Number(cost).toFixed(2)}" style="width:100%; background:#171717; border: none; color:#fff; cursor:default; pointer-events: none; text-align:right;" /></td>
                <td style="padding:8px; width:45px; text-align:center;"><button class="comp-remove btn" title="Remove" style="background:transparent; border:none; color:#bbb; font-size:18px; line-height:1; width:30px; height:34px; display:inline-flex; align-items:center; justify-content:center;">🗑</button></td>
            `;
            // attach listeners
            tr.querySelector('.comp-qty').addEventListener('input', function() { recalcTotal(); });
            // comp-cost is readonly — do not attach input listener
            const rem = tr.querySelector('.comp-remove');
            if (rem) rem.addEventListener('click', function() { tr.remove(); recalcTotal(); });
            componentsBody.appendChild(tr);
            recalcTotal();
        }

        // Create a component row for a product that has variants.
        // product: { id, name, sku }
        // variants: [{ id, name, sku, cost, price, quantity }, ...]
        // NOTE: variant select dropdown below the parent item has been removed per request.
        // If variants are present we auto-select the first variant and show the variant
        // name inline as "Parent (Variant Name)" and display the SKU on the line below.
        function createComponentRowFromProduct(product, variants) {
            const tr = document.createElement('tr');
            tr.className = 'component-row';
            tr.style.borderBottom = '1px solid #2b2b2b';
            tr.innerHTML = `
                <td style="padding:8px; color:#dbdbdb;">
                    <div class="comp-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        <div class="comp-name-text">${escapeHtml(product.name || '')}</div>
                        ${product.sku ? `<div class="comp-sku" style="color:#9e9e9e; font-size:12px; margin-top:0;">SKU: ${escapeHtml(product.sku)}</div>` : `<div class="comp-sku" style="color:#9e9e9e; font-size:12px; margin-top:0;">&nbsp;</div>`}
                    </div>
                </td>
                <td style="padding:8px; width:120px; text-align:right;"><input class="comp-qty" type="number" min="0" value="1" style="width:100%; padding:6px; background:#171717; border:1px solid #333; color:#fff; border-radius:4px; text-align:right;" /></td>
                <td style="padding:8px; width:120px; text-align:right;"><input class="comp-cost" currency-localization="₱" readonly value="₱0.00" style="width:100%; background:#171717; border: none; color:#fff; cursor:default; pointer-events: none; text-align:right;" /></td>
                <td style="padding:8px; width:45px; text-align:center;"><button class="comp-remove btn" title="Remove" style="background:transparent; border:none; color:#bbb; font-size:18px; line-height:1; width:30px; height:34px; display:inline-flex; align-items:center; justify-content:center;">🗑</button></td>
            `;

            componentsBody.appendChild(tr);

            const costInput = tr.querySelector('.comp-cost');
            const skuEl = tr.querySelector('.comp-sku');
            const nameTextEl = tr.querySelector('.comp-name-text');

            // If variants available, auto-select the first variant and reflect its values.
            if (variants && Array.isArray(variants) && variants.length) {
                const v = variants[0];
                // show parent with variant name inline
                if (nameTextEl) nameTextEl.textContent = (product.name || '') + (v.name ? ' (' + v.name + ')' : '');
                // show SKU from variant (fall back to product.sku)
                if (skuEl) skuEl.textContent = 'SKU: ' + (v.sku || product.sku || '');
                // use variant cost (fall back to price/product cost)
                const costVal = (v.cost !== undefined && v.cost !== null) ? v.cost : (v.price !== undefined && v.price !== null ? v.price : (product.cost || product.price || 0));
                costInput.value = formatCurrency(parseFloat(costVal) || 0);
                // remember selected variant id (auto-selected first)
                try { tr.dataset.selectedVariantId = v.id || ''; } catch(e) {}
            } else {
                // No variants: use product-level values
                if (nameTextEl) nameTextEl.textContent = (product.name || '');
                if (skuEl) skuEl.textContent = product.sku ? ('SKU: ' + product.sku) : '&nbsp;';
                const costVal = (product.cost !== undefined && product.cost !== null) ? product.cost : (product.price !== undefined && product.price !== null ? product.price : 0);
                costInput.value = formatCurrency(parseFloat(costVal) || 0);
            }

            // store variants/product reference on the row for later use by the inline dropdown
            try { tr._variants = variants || null; } catch(e) { tr._variants = null; }
            try { tr._product = product || null; } catch(e) { tr._product = null; }

            // clicking the name opens a dropdown of variants (styled like category select)
            const nameCell = tr.querySelector('.comp-name');
            if (nameCell) {
                // Only make the cell interactive if we have known variants
                if (tr._variants && Array.isArray(tr._variants) && tr._variants.length) {
                    nameCell.classList.add('interactive');
                    nameCell.addEventListener('click', function(e) {
                        e.stopPropagation();
                        openVariantDropdown(nameCell, tr, product, tr._variants);
                    });
                } else {
                    // ensure it's not interactive
                    nameCell.classList.remove('interactive');
                }
            }

            // wire qty/remove and recalc
            tr.querySelector('.comp-qty').addEventListener('input', function() { recalcTotal(); });
            const rem = tr.querySelector('.comp-remove');
            if (rem) rem.addEventListener('click', function() { tr.remove(); recalcTotal(); });

            recalcTotal();
        }

        // Shared inline variant dropdown (one instance appended to body)
        const variantDropdown = document.createElement('div');
        variantDropdown.className = 'create-dropdown comp-variant-dropdown';
        variantDropdown.style.position = 'absolute';
        variantDropdown.style.zIndex = 99999;
        variantDropdown.style.display = 'none';
        document.body.appendChild(variantDropdown);
        let variantDropdownCurrent = null; // { row, product, variants }

        function closeVariantDropdown() {
            try {
                if (variantDropdownCurrent && variantDropdownCurrent.row) {
                    const prevName = variantDropdownCurrent.row.querySelector('.comp-name');
                    if (prevName) prevName.classList.remove('open');
                }
            } catch (e) {}
            variantDropdown.style.display = 'none';
            variantDropdown.innerHTML = '';
            variantDropdownCurrent = null;
        }

        // open dropdown positioned under triggerEl. variants is an array.
        function openVariantDropdown(triggerEl, row, product, variants) {
            // preserve previous so we can clear its open state
            const previousDropdown = variantDropdownCurrent;
            variantDropdown.innerHTML = '';
            variantDropdownCurrent = { row, product, variants };

            // build options
            if (!variants || !variants.length) {
                const noOpt = document.createElement('div');
                noOpt.className = 'create-option';
                noOpt.style.opacity = '0.7';
                noOpt.style.cursor = 'default';
                noOpt.textContent = 'No variants';
                variantDropdown.appendChild(noOpt);
            } else {
                // If the row already has a selectedVariantId, move that variant to the front so it appears first
                let variantsToRender = Array.isArray(variants) ? variants.slice() : [];
                try {
                    const curId = row.dataset && row.dataset.selectedVariantId ? String(row.dataset.selectedVariantId) : '';
                    if (curId) {
                        const idx = variantsToRender.findIndex(x => String(x.id) === curId);
                        if (idx > 0) {
                            const [found] = variantsToRender.splice(idx, 1);
                            variantsToRender.unshift(found);
                        }
                    }
                } catch (e) {
                    // ignore
                }

                variantsToRender.forEach(v => {
                    const opt = document.createElement('div');
                    opt.className = 'create-option';
                    // left: parent (variant) + SKU, right: cost
                    const parentName = product && product.name ? product.name : '';
                    const variantName = v.name || '';
                    const sku = v.sku || '';
                    const cost = (v.cost !== undefined && v.cost !== null) ? v.cost : (v.price !== undefined && v.price !== null ? v.price : '');
                    opt.innerHTML = `
                        <div style="display:grid; grid-template-columns: 1fr 100px; align-items:center; gap:8px; width:100%;">
                            <div style="min-width:0;">
                                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; color:#e6e6e6;">${escapeHtml(variantName ? variantName : '')}</div>
                                ${sku ? `<div style="color:#9e9e9e; font-size:12px; margin-top:4px;">SKU: ${escapeHtml(sku)}</div>` : ''}
                            </div>
                            <div style="text-align:right; color:#9ca3af; white-space:nowrap;">${cost !== '' ? '₱' + Number(cost).toFixed(2) : ''}</div>
                        </div>
                    `;
                    opt.addEventListener('mousedown', e => e.preventDefault());
                    opt.addEventListener('click', function() {
                        // apply selection to row
                        const nameTextEl = row.querySelector('.comp-name-text');
                        const skuEl = row.querySelector('.comp-sku');
                        const costInput = row.querySelector('.comp-cost');
                        if (nameTextEl) nameTextEl.textContent = (product.name || '') + (variantName ? ' (' + variantName + ')' : '');
                        if (skuEl) skuEl.textContent = sku ? ('SKU: ' + sku) : (product.sku ? ('SKU: ' + product.sku) : '');
                        if (costInput) costInput.value = formatCurrency(parseFloat(cost) || 0);
                        // store selected variant id for potential form submission
                        try { row.dataset.selectedVariantId = v.id || ''; } catch(e){}
                        recalcTotal();
                        closeVariantDropdown();
                    });
                    variantDropdown.appendChild(opt);
                });
            }

            // position the dropdown relative to the trigger element, accounting for page scroll
            const r = triggerEl.getBoundingClientRect();
            // coordinates relative to the document
            let left = r.left + window.scrollX;
            // prefer matching trigger width, but ensure min width for readability
            const width = Math.max(240, Math.round(r.width));
            // keep within viewport right edge
            const maxRight = window.scrollX + document.documentElement.clientWidth - 8;
            if (left + width > maxRight) left = Math.max(8 + window.scrollX, maxRight - width);
            // keep within viewport left edge
            if (left < 8 + window.scrollX) left = 8 + window.scrollX;

            variantDropdown.style.width = width + 'px';
            variantDropdown.style.left = left + 'px';
            // show it first so we can measure height
            variantDropdown.style.display = 'block';
            // mark trigger as open (rotate chevron)
            try {
                if (previousDropdown && previousDropdown.row) {
                    const prevName = previousDropdown.row.querySelector('.comp-name');
                    if (prevName) prevName.classList.remove('open');
                }
                if (triggerEl && triggerEl.classList) triggerEl.classList.add('open');
            } catch (e) {}
            const dh = variantDropdown.offsetHeight || variantDropdown.scrollHeight || 200;
            // compute top so the dropdown's TOP aligns with the trigger TOP (covering the cell)
            const topCover = r.top + window.scrollY;
            // If there's not enough room above (or dropdown would overflow viewport bottom), fallback to placing below the trigger
            const viewportBottom = window.scrollY + document.documentElement.clientHeight - 8;
            if (topCover < window.scrollY + 8 || (topCover + dh) > viewportBottom) {
                // place below
                variantDropdown.style.top = (r.bottom + window.scrollY + 6) + 'px';
            } else {
                // align top of dropdown with top of trigger so it covers the cell from the top
                variantDropdown.style.top = topCover + 'px';
            }
        }

        // Close on outside click or Escape
        document.addEventListener('click', function(e) {
            if (!variantDropdownCurrent) return;
            const inside = variantDropdown.contains(e.target) || (variantDropdownCurrent.row && variantDropdownCurrent.row.contains && variantDropdownCurrent.row.contains(e.target));
            if (!inside) closeVariantDropdown();
        });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeVariantDropdown(); });

        function escapeHtml(s) {
            return String(s).replace(/[&<>"'`]/g, function(ch) { return '&#' + ch.charCodeAt(0) + ';'; });
        }

        // Create-tab autocomplete (mirrors category autocomplete behavior but shows 'No item found' when empty)
        (function setupCreateAutocomplete() {
            const input = createItemSearch;
            const dropdown = document.getElementById('createDropdown');
            if (!input || !dropdown) return;

            // Move dropdown to body to escape modal clipping
            document.body.appendChild(dropdown);

            let productsCache = null; // cached full product list
            let filtered = [];
            let highlighted = -1;

            function fetchProductsOnce() {
                if (productsCache !== null) return Promise.resolve(productsCache);

                // Helper: try fetch and parse JSON, but return rejected promise with response text when parse fails
                function fetchAndParse(url) {
                    return fetch(url).then(resp => {
                        return resp.text().then(text => {
                            try {
                                return JSON.parse(text);
                            } catch (e) {
                                // Attach the raw text for debugging
                                const err = new Error('Invalid JSON');
                                err.responseText = text;
                                err.url = url;
                                throw err;
                            }
                        });
                    });
                }

                // Primary attempt (relative). Use a dedicated search endpoint so we don't call the main api.php
                <?php $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); $searchPath = $base . '/search_api.php'; ?>
                const fallbackUrl = '<?php echo $searchPath; ?>';

                // Try the relative path first, then fallback to the PHP-derived absolute path
                return fetchAndParse('search_api.php')
                    .catch(err => {
                        // If server returned HTML (err.responseText starts with '<'), log snippet and retry fallback
                        try {
                            if (err && err.responseText && String(err.responseText).trim().charAt(0) === '<') {
                                console.warn('create autocomplete: api.php returned non-JSON (HTML). Response snippet:', String(err.responseText).slice(0,400));
                            }
                        } catch (e) {}
                        // Retry fallback URL once
                        try { console.debug('create autocomplete: retrying with fallback URL', fallbackUrl); } catch(e){}
                        return fetchAndParse(fallbackUrl);
                    })
                    .then(data => {
                        if (Array.isArray(data)) productsCache = data;
                        else if (data && Array.isArray(data.products)) productsCache = data.products;
                        else productsCache = [];
                        try {
                            console.debug('create autocomplete: products fetched', productsCache.length);
                            console.debug('create autocomplete: sample', productsCache.slice(0,5));
                        } catch (e) {}
                        return productsCache;
                    })
                    .catch(err => {
                        console.warn('create autocomplete fetch error (after fallback)', err);
                        if (err && err.responseText) console.debug('create autocomplete: final response text snippet', String(err.responseText).slice(0,600));
                        productsCache = [];
                        return productsCache;
                    });
            }

            function getName(item) {
                if (!item) return '';
                if (typeof item === 'string') return item;
                return String(item.name || item.product_name || item.title || item.product || '').trim();
            }

            function getCost(item) {
                if (!item) return '';
                if (typeof item === 'string') return '';
                return (item.cost !== undefined ? item.cost : (item.price !== undefined ? item.price : (item.unit_price !== undefined ? item.unit_price : '')));
            }

                function getSKU(item) {
                    if (!item) return '';
                    if (typeof item === 'string') return '';
                    return String(item.sku || item.product_sku || item.barcode || item.code || item.ref || '').trim();
                }

            function showDropdown(items, searchTerm = '') {
                dropdown.innerHTML = '';
                filtered = items || [];
                highlighted = -1;

                // Position dropdown below the input field
                const r = input.getBoundingClientRect();
                dropdown.style.top = (r.bottom + 2) + 'px';
                dropdown.style.left = r.left + 'px';
                dropdown.style.width = r.width + 'px';

                if (filtered.length === 0) {
                    // show non-clickable no-result row
                    const noOpt = document.createElement('div');
                    noOpt.className = 'create-option';
                    noOpt.style.opacity = '0.7';
                    noOpt.style.cursor = 'default';
                    noOpt.textContent = searchTerm.trim() === '' ? 'Start typing to search items' : 'No item found';
                    dropdown.appendChild(noOpt);
                } else {
                    filtered.forEach((p) => {
                        const opt = document.createElement('div');
                        opt.className = 'create-option';
                        const displayName = getName(p);
                        const displayCost = getCost(p);
                        const displaySku = getSKU(p);
                        // Two-column layout: left = name + sku (stacked), right = cost (vertically centered)
                        opt.innerHTML = `
                            <div style="display:grid; grid-template-columns: 1fr 120px; align-items:center; gap:8px; width:100%;">
                                <div style="min-width:0;">
                                    <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(displayName)}</div>
                                    ${displaySku ? `<div style="color:#9e9e9e; font-size:12px; margin-top: 0;">SKU: ${escapeHtml(displaySku)}</div>` : ''}
                                </div>
                                <div style="text-align:right; color:#9ca3af; white-space:nowrap;">${displayCost !== '' ? '₱' + Number(displayCost).toFixed(2) : ''}</div>
                            </div>
                        `;
                        opt.addEventListener('mousedown', e => e.preventDefault());
                        // Pass the original product object so selectItem can access id/variants
                        opt.addEventListener('click', () => selectItem(p));
                        dropdown.appendChild(opt);
                    });
                }

                dropdown.classList.add('show');
            }

            function hideDropdown() {
                dropdown.classList.remove('show');
                highlighted = -1;
            }

            function selectItem(item) {
                // item may include .name, .cost, .sku, .id and optionally .variants
                input.value = '';
                input.focus();
                hideDropdown();

                // If product already includes variants, use them directly
                if (item && item.variants && Array.isArray(item.variants) && item.variants.length) {
                    createComponentRowFromProduct(item, item.variants);
                    return;
                }

                // If product has an id, try fetching variants on demand
                if (item && item.id) {
                    console.log('selectItem: fetching variants for product id', item.id, 'using', variantsApiPath);
                    fetch(variantsApiPath + '?product_id=' + encodeURIComponent(item.id))
                        .then(resp => resp.json())
                        .then(vars => {
                            console.log('variants result', vars && vars.length ? vars.length : 0, 'items');
                            if (vars && Array.isArray(vars) && vars.length) {
                                createComponentRowFromProduct(item, vars);
                            } else {
                                createComponentRow(item.name || item, 1, item.cost || 0, item.sku || '');
                            }
                        })
                        .catch(err => {
                            // on error, fallback to product-level addition
                            console.warn('variants fetch error', err);
                            createComponentRow(item.name || item, 1, item.cost || 0, item.sku || '');
                        });
                    return;
                }

                // Fallback: no id/variants
                createComponentRow(item.name || item, 1, item.cost || 0, item.sku || '');
            }

            function filterProducts(term) {
                const list = productsCache || [];
                // If the user hasn't typed anything, show all cached items
                if (!term || term.trim() === '') return list;
                const q = term.toLowerCase();
                // Return all matches (no client-side limit)
                return list.filter(p => {
                    const name = getName(p).toLowerCase();
                    return name.includes(q);
                });
            }

            function highlight(index) {
                const opts = dropdown.querySelectorAll('.create-option');
                opts.forEach(o => o.classList.remove('highlighted'));
                if (index >= 0 && index < opts.length) {
                    opts[index].classList.add('highlighted');
                    highlighted = index;
                } else highlighted = -1;
            }

            input.addEventListener('focus', function() {
                fetchProductsOnce().then(() => {
                    const list = filterProducts(input.value.trim());
                    showDropdown(list, input.value.trim());
                });
            });

            input.addEventListener('input', function(e) {
                const term = e.target.value.trim();
                fetchProductsOnce().then(() => {
                    const list = filterProducts(term);
                    try { console.debug('create autocomplete: filter for', term, '=>', list.length, list.slice(0,6)); } catch (e) {}
                    showDropdown(list, term);
                });
            });

            input.addEventListener('keydown', function(e) {
                const opts = dropdown.querySelectorAll('.create-option');
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        highlighted = Math.min(highlighted + 1, opts.length - 1);
                        highlight(highlighted);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        highlighted = Math.max(highlighted - 1, 0);
                        highlight(highlighted);
                        break;
                    case 'Enter':
                        e.preventDefault();
                        // If a highlighted option exists, select it.
                        if (highlighted >= 0 && filtered[highlighted]) {
                            const sel = filtered[highlighted];
                            selectItem(sel);
                            break;
                        }
                        // If no highlight but filtered list has results, select the first one.
                        if (filtered.length > 0) {
                            const sel = filtered[0];
                            selectItem(sel);
                            break;
                        }
                        // No matches: do NOT create a new item on Enter. Keep the input and show 'No item found'.
                        // Optionally, you can add a small visual hint here in future.
                        break;
                    case 'Escape':
                        e.preventDefault();
                        hideDropdown();
                        input.blur();
                        break;
                }
            });

            // Hide when clicking outside
            document.addEventListener('click', function(e) {
                if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                    hideDropdown();
                }
            });

            // Small blur safety: allow clicks on dropdown to register
            input.addEventListener('blur', function() {
                setTimeout(() => { if (!dropdown.contains(document.activeElement)) hideDropdown(); }, 120);
            });
        })();

        // Wire create tab button to show panel (compatible with existing showTab function if present)
        if (createTabBtn) {
            createSaveBtn.addEventListener('click', function() {
                try { if (typeof showTab === 'function') { showTab('create'); return; } } catch(e) {}
                // Fallback manual toggle
                document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
                // comp-name contains internal .comp-name-text and optional .comp-sku
                const nameEl = r.querySelector('.comp-name-text');
                const name = nameEl ? nameEl.textContent.trim() : (r.querySelector('.comp-name') ? r.querySelector('.comp-name').textContent.trim() : '');
            });
        }

        // Back/Close buttons
        const backFromCreate = document.getElementById('backFromCreate');
        if (backFromCreate) backFromCreate.addEventListener('click', function() { try { if (typeof showTab === 'function') showTab('scan'); else { createTabPanel.style.display='none'; document.getElementById('scanTabPanel').style.display='block'; } } catch(e){} });
        const createCancelBtn = document.getElementById('createCancelBtn');
        if (createCancelBtn) createCancelBtn.addEventListener('click', function() { if (createTabPanel) createTabPanel.style.display='none'; });

        // Optional Save button hook (can be wired to API)
        const createSaveBtn = document.getElementById('createSaveBtn');
    if (createSaveBtn) createSaveBtn.addEventListener('click', function() {
            // gather components
            const comps = [];
            componentsBody.querySelectorAll('tr.component-row').forEach(r => {
                const name = r.querySelector('.comp-name').textContent.trim();
                const qty = parseFloat(r.querySelector('.comp-qty').value) || 0;
                const cost = parseFloat((r.querySelector('.comp-cost').value || '').replace(/[^0-9.-]/g,'')) || 0;
                if (name) comps.push({ name, qty, cost });
            });
            // For now just show a toast and close
            try { if (comps.length === 0) { showErrorPopup('No components to save'); return; } } catch(e) {}
            try { showSuccessPopup('Components saved (client-side)'); } catch(e) { alert('Components saved'); }
            if (createTabPanel) createTabPanel.style.display = 'none';
        });

        // Expose a helper to append components into the Create tab from other pages/scripts.
        // Uses the local helper functions (createComponentRow, createComponentRowFromProduct, variantsApiPath)
        // so it's defined inside this DOMContentLoaded scope and has access to those helpers.
        window.appendCreateComponents = function(items) {
            try {
                if (!items || !Array.isArray(items)) return;
                // Clear existing rows
                if (componentsBody) componentsBody.innerHTML = '';
                // Iterate and append each. If product id present, fetch variants then create row.
                items.forEach(function(it) {
                    if (!it) return;
                    var pid = it.id || it.product_id || null;
                    var name = it.name || it.product_name || it.displayName || '';
                    var sku = it.sku || '';
                    var qty = (it.qty !== undefined && it.qty !== null) ? it.qty : 1;
                    var cost = (it.cost !== undefined && it.cost !== null) ? it.cost : 0;

                    if (pid) {
                        // fetch variants and call the existing creator
                        fetch(variantsApiPath + '?product_id=' + encodeURIComponent(pid))
                            .then(function(resp) { return resp.json(); })
                            .then(function(vars) {
                                try {
                                    createComponentRowFromProduct({ id: pid, name: name, sku: sku }, Array.isArray(vars) ? vars : []);
                                } catch (e) {
                                    // fallback to simple row
                                    createComponentRow(name, qty, cost, sku);
                                }
                            })
                            .catch(function() {
                                createComponentRow(name, qty, cost, sku);
                            });
                    } else {
                        createComponentRow(name, qty, cost, sku);
                    }
                });
            } catch (e) { console.warn('appendCreateComponents error', e); }
        };

    } catch (e) { console.warn('create tab init error', e); }
});

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

            // Block submission if any SKU has been marked with a client-side error
            // (inputs receive the `sku-error` class when inventory.js detects DB duplicates
            // or duplicate SKUs among variant rows). This ensures the canonical submit
            // handler in this file respects the validation performed in pages/inventory/inventory.js
            try {
                if (document.querySelectorAll && document.querySelectorAll('.sku-error').length > 0) {
                    // Use the in-page popup if available, fall back to alert
                    if (typeof showErrorPopup === 'function') {
                        showErrorPopup('SKUs are invalid or already existing.');
                    } else {
                        alert('SKUs are invalid or already existing.');
                    }
                    return; // abort submit
                }
            } catch (err) {
                // If anything goes wrong checking DOM, do not proceed with submit
                try { showErrorPopup && showErrorPopup('SKU validation failed. Please check SKU fields.'); } catch (e) { alert('SKU validation failed.'); }
                return;
            }
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
            // Determine whether the user provided an image (either as a URL input, a file upload,
            // or a preview image). We need to compute this BEFORE deciding representation/type
            // so the form will treat an uploaded image as a valid representation.
            var image_url = null;
            var imageInput = document.getElementById('productImageUrl') || document.querySelector('input[name="productImageUrl"]') || document.querySelector('.product-image-url input');
            if (imageInput) image_url = (imageInput.value || '').trim();
            var fileInputEl = document.getElementById('posProductImage');
            var uploadedPreview = document.getElementById('uploadedImagePreview');
            var hasImage = false;
            if (image_url && image_url !== '') hasImage = true;
            if (!hasImage && fileInputEl && fileInputEl.files && fileInputEl.files.length > 0) hasImage = true;
            if (!hasImage && uploadedPreview && uploadedPreview.src && uploadedPreview.src.trim() !== '') hasImage = true;

            // Representation: prefer an explicitly selected representation type; if none
            // selected and an image is present, use 'image'. Fall back to 'color_shape'.
            var repEl = document.querySelector('input[name="representationType"]:checked');
            var type = repEl ? repEl.value : (hasImage ? 'image' : 'color_shape');
            // Get selected color and shape from UI
            var color = lastSelectedColor || '';
            var shape = lastSelectedShape || '';
            // If POS is checked and no color/shape selected, set defaults only when
            // there is no image (image acts as the representation)
            if (posAvailable && (!color || color === '') && !hasImage) color = 'gray';
            if (posAvailable && (!shape || shape === '') && !hasImage) shape = 'square';
            // If POS is checked but no representation chosen (no color, no shape, no image), prompt the POS options first.
            var productFormEl = document.querySelector('.product-form');
            var posOptionsEl = document.getElementById('posOptionsContainer');
            var representationPrompted = productFormEl && productFormEl.dataset && productFormEl.dataset.representationPrompted === '1';
            if (posAvailable && !lastSelectedColor && !lastSelectedShape && !hasImage && !representationPrompted) {
                if (posOptionsEl) {
                    posOptionsEl.classList.add('slide-up');
                    posOptionsEl.style.display = 'block';
                }
                if (productFormEl) productFormEl.classList.add('pos-options-active');
                if (productFormEl) productFormEl.dataset.representationPrompted = '1';
                var posChevron = document.getElementById('posToggleChevron');
                if (posChevron) posChevron.style.display = 'inline-block';
                if (posOptionsEl && typeof posOptionsEl.scrollIntoView === 'function') {
                    posOptionsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                return; // stop submit to let user pick representation or submit again to accept defaults
            }
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
            // If this Add Item flow was initiated from the Create tab (Create -> Next -> Add Items),
            // include the Create tab components as composite components to be saved with the new product.
            // We detect the flow via the global flag set earlier by inventory.js (window._inlineCostFixed).
            var composite_components = [];
            try {
                if (window._inlineCostFixed && document.getElementById('createComponentsBody')) {
                    document.querySelectorAll('#createComponentsBody tr.component-row').forEach(function(r) {
                        var nameEl = r.querySelector('.comp-name-text');
                        var qtyEl = r.querySelector('.comp-qty');
                        var costEl = r.querySelector('.comp-cost');
                        var skuEl = r.querySelector('.comp-sku');
                        var cname = nameEl ? nameEl.textContent.trim() : '';
                        var cqty = qtyEl ? (qtyEl.value || '').toString().trim() : '';
                        var ccost = costEl ? (costEl.value || '').replace(/[^0-9.-]/g,'') : '';
                        var csku = '';
                        if (skuEl) {
                            try { csku = skuEl.textContent.replace(/^SKU:\s*/i, '').trim(); } catch(e) { csku = ''; }
                        }
                        if (cname) {
                            composite_components.push({
                                name: cname,
                                price: 'variable',
                                cost: ccost || 0,
                                in_stock: cqty || '',
                                sku: csku || '',
                                pos_available: 0
                            });
                        }
                    });
                }
            } catch (e) { console.warn('collect composite components error', e); }
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
                // If we have composite components collected above, include them in the payload
                var compositeFlag = (composite_components && composite_components.length) ? 1 : 0;
                fetch('api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        category,
                        price,
                        cost,
                        track_stock: trackStock,
                            variantsTrackStock: (document.getElementById('variantsTrackStockToggle') && document.getElementById('variantsTrackStockToggle').checked) ? 1 : 0,
                        in_stock: payloadInStock,
                        low_stock: payloadLowStock,
                        pos_available: posAvailable,
                        type,
                        color,
                        shape,
                        image_url,
                        sku,
                        barcode,
                        variants,
                        composite_from_create: compositeFlag,
                        composite_components: composite_components,
                        // If coming from Create flow, mark type as composite so server can store appropriately
                        type: (compositeFlag ? 'composite' : type)
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
                        if (posCheckbox) posCheckbox.checked = true;
                        if (posOptions) {
                            posOptions.classList.remove('slide-up');
                            posOptions.style.display = 'none';
                        }
                        if (productForm) {
                            productForm.classList.remove('pos-options-active');
                            productForm.removeAttribute('data-representation-prompted');
                        }
                        // Clear any uploaded image and image inputs so the modal resets to no-image state
                        try {
                            // file input
                            var fileInput = document.getElementById('posProductImage');
                            if (fileInput) {
                                try { fileInput.value = ''; } catch (e) { /* ignore */ }
                            }
                            // image URL input
                            var imageUrlInput = document.getElementById('productImageUrl') || document.querySelector('input[name="productImageUrl"]') || document.querySelector('.product-image-url input');
                            if (imageUrlInput) imageUrlInput.value = '';
                            // preview and uploaded area
                            var uploadedPreview = document.getElementById('uploadedImagePreview');
                            if (uploadedPreview) uploadedPreview.src = '';
                            document.querySelectorAll('#uploadedImageArea').forEach(function(a) { a.style.display = 'none'; });
                            var imageUploadArea = document.getElementById('imageUploadArea');
                            if (imageUploadArea) imageUploadArea.style.display = 'block';
                            var uploadPlaceholder = document.getElementById('uploadPlaceholder');
                            if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
                            // clear crop canvas if present
                            var cropCanvas = document.getElementById('imageCropCanvas');
                            if (cropCanvas && cropCanvas.getContext) {
                                try { cropCanvas.getContext('2d').clearRect(0,0,cropCanvas.width,cropCanvas.height); } catch(e){}
                            }
                            // reset any global cropImage var
                            try { if (typeof cropImage !== 'undefined') cropImage = null; } catch(e) {}
                            // reset representation selection (radios)
                            var reps = document.querySelectorAll('input[name="representationType"]');
                            reps.forEach(function(r) { try { r.checked = false; } catch(e) {} });
                            // Switch POS representation tab back to Color & Shape (not Image)
                            try {
                                var colorTabBtn = document.querySelector('.pos-tab-btn[data-tab="colorShape"]');
                                var imageTabBtn = document.querySelector('.pos-tab-btn[data-tab="image"]');
                                var colorTabPanel = document.getElementById('colorShapeTab');
                                var imageTabPanel = document.getElementById('imageTab');
                                var posOptions = document.getElementById('posOptionsContainer');

                                // Remove pos-options-active from any product-form instances to restore interactivity
                                document.querySelectorAll('.product-form').forEach(function(pf) {
                                    try { pf.classList.remove('pos-options-active'); } catch(e) {}
                                    try { pf.removeAttribute('data-representation-prompted'); } catch(e) {}
                                    try { pf.style.pointerEvents = ''; pf.style.opacity = ''; } catch(e) {}
                                });

                                // Ensure POS options are hidden and not sliding up
                                if (posOptions) {
                                    try { posOptions.classList.remove('slide-up'); } catch(e) {}
                                    try { posOptions.style.display = 'none'; } catch(e) {}
                                }

                                if (colorTabBtn && imageTabBtn && colorTabPanel && imageTabPanel) {
                                    // Ensure both the class and inline styles are consistent with the tab state.
                                    colorTabBtn.classList.add('active');
                                    imageTabBtn.classList.remove('active');
                                    // Mirror the same inline style changes that the tab click handlers apply
                                    try { colorTabBtn.style.background = '#ff9800'; colorTabBtn.style.color = '#171717'; } catch(e) {}
                                    try { imageTabBtn.style.background = '#333'; imageTabBtn.style.color = '#dbdbdb'; } catch(e) {}

                                    // Make the color/shape panel interactive and the image panel disabled
                                    try { colorTabPanel.style.display = 'block'; colorTabPanel.setAttribute('aria-disabled', 'false'); } catch(e) {}
                                    try { imageTabPanel.style.display = 'none'; imageTabPanel.setAttribute('aria-disabled', 'true'); } catch(e) {}

                                    try { colorTabPanel.classList.add('active'); } catch(e) {}
                                    try { imageTabPanel.classList.remove('active'); } catch(e) {}

                                    try { if (typeof setTabDisabling === 'function') setTabDisabling(); } catch(e) {}
                                }
                            } catch (e) { /* ignore */ }
                        } catch (e) {
                            console.warn('reset image state error', e);
                        }
                        // Ensure variants panel is closed and cleared so next add starts fresh
                        var variantsSection = document.getElementById('variantsSection');
                        var variantsTableBody = document.getElementById('variantsTableBody');
                        var variantsTrackStockToggle = document.getElementById('variantsTrackStockToggle');
                        var closeVariantsBtn = document.getElementById('closeVariantsBtn');
                        var variantsAddBtn = document.querySelector('.variants-add-btn');
                        if (variantsSection) {
                            variantsSection.style.display = 'none';
                        }
                        if (variantsTableBody) {
                            // remove all variant rows
                            variantsTableBody.innerHTML = '';
                        }
                        if (variantsTrackStockToggle) {
                            variantsTrackStockToggle.checked = false;
                        }
                        if (closeVariantsBtn) {
                            // ensure Close button is not focused or active
                            closeVariantsBtn.blur();
                        }
                        if (variantsAddBtn) {
                            // ensure the Add Variant button is enabled for next use
                            variantsAddBtn.disabled = false;
                        }
                        // Also try to call the page-level hideVariantsSection() to fully reset state
                        try {
                            if (typeof hideVariantsSection === 'function') {
                                hideVariantsSection();
                            }
                        } catch (e) {
                            // ignore if function isn't available
                        }
                        // Reset global flag if present
                        try {
                            if (typeof isVariantsMode !== 'undefined') {
                                isVariantsMode = false;
                            }
                        } catch (e) {}
                        // Also request the inventory page to reset its name dropdown state if available
                        try {
                            if (typeof window !== 'undefined' && typeof window.resetNameDropdownState === 'function') {
                                window.resetNameDropdownState();
                            }
                        } catch (e) {
                            // ignore
                        }
                        // Reset price and cost to defaults and ensure the price row is visible
                        var inlinePrice = document.getElementById('inlineItemPrice');
                        var inlineCost = document.getElementById('inlineItemCost');
                        var priceRow = document.getElementById('priceRow');
                        if (inlinePrice) inlinePrice.value = '';
                        if (inlineCost) inlineCost.value = '₱0.00';
                        if (priceRow) priceRow.style.display = 'flex';
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
// In-page confirmation dialog. Returns a Promise that resolves to true if confirmed,
// false if cancelled. Also accepts optional callbacks via second/third args.
window.showConfirm = function(message, onConfirm, onCancel) {
    return new Promise(function(resolve) {
        // Create overlay
        var overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.45)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = 10000;

        // Modal
        var modal = document.createElement('div');
        modal.style.background = '#1e1e1e';
        modal.style.color = '#fff';
        modal.style.padding = '18px 20px';
        modal.style.borderRadius = '10px';
        modal.style.maxWidth = '520px';
        modal.style.width = '90%';
        modal.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
        modal.style.fontSize = '15px';
        modal.style.lineHeight = '1.4';

        var msg = document.createElement('div');
        msg.textContent = message || 'Are you sure?';
        msg.style.marginBottom = '16px';

        var actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';
        actions.style.gap = '8px';

        var cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.background = 'transparent';
        cancelBtn.style.color = '#ddd';
        cancelBtn.style.border = '1px solid #444';
        cancelBtn.style.padding = '8px 12px';
        cancelBtn.style.borderRadius = '6px';
        cancelBtn.style.cursor = 'pointer';

        var okBtn = document.createElement('button');
        okBtn.textContent = 'Delete';
        okBtn.style.background = '#dc3545';
        okBtn.style.color = '#fff';
        okBtn.style.border = 'none';
        okBtn.style.padding = '8px 12px';
        okBtn.style.borderRadius = '6px';
        okBtn.style.cursor = 'pointer';

        actions.appendChild(cancelBtn);
        actions.appendChild(okBtn);
        modal.appendChild(msg);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Focus management
        okBtn.focus();

        function cleanup() {
            try { overlay.remove(); } catch (e) {}
            document.removeEventListener('keydown', onKey);
        }

        function onKey(e) {
            if (e.key === 'Escape') {
                cleanup();
                if (typeof onCancel === 'function') onCancel();
                resolve(false);
            } else if (e.key === 'Enter') {
                // Enter confirms
                cleanup();
                if (typeof onConfirm === 'function') onConfirm();
                resolve(true);
            }
        }

        cancelBtn.addEventListener('click', function() {
            cleanup();
            if (typeof onCancel === 'function') onCancel();
            resolve(false);
        });

        okBtn.addEventListener('click', function() {
            cleanup();
            if (typeof onConfirm === 'function') onConfirm();
            resolve(true);
        });

        document.addEventListener('keydown', onKey);
    });
};
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

