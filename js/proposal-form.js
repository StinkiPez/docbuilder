// Import required modules
const Quill = require('quill');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { saveAs } = require('file-saver');
const fs = require('fs');
const path = require('path');

// ============================================================================
// QUILL EDITOR INITIALIZATION
// ============================================================================

let projectSummaryEditor;
let mechanicalSummaryEditor;
let plumbingSummaryEditor;

function initializeQuillEditors() {
    const toolbarOptions = [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
    ];

    // Project Summary Editor
    projectSummaryEditor = new Quill('#projectSummary', {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions
        },
        placeholder: 'Enter project summary...'
    });

    // Mechanical Summary Editor
    mechanicalSummaryEditor = new Quill('#mechanicalSummary', {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions
        },
        placeholder: 'Enter mechanical summary...'
    });

    // Plumbing Summary Editor
    plumbingSummaryEditor = new Quill('#plumbingSummary', {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions
        },
        placeholder: 'Enter plumbing summary...'
    });
}

// Helper function to convert Quill content to plain text with line breaks
function quillToPlainText(quillInstance) {
    const text = quillInstance.getText();
    return text.split('\n').filter(line => line.trim()).map(line => line.trim());
}

// ============================================================================
// CLIENT DATA MANAGEMENT
// ============================================================================

let clientsData = [];

async function loadClients() {
    try {
        const clientsPath = path.join(__dirname, '../data/clients.json');
        const data = fs.readFileSync(clientsPath, 'utf8');
        clientsData = JSON.parse(data);
        populateClientDropdown();
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

function populateClientDropdown() {
    const select = document.getElementById('clientSelect');

    clientsData.forEach((client, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = client.name;
        select.appendChild(option);
    });
}

function populateContactDropdown(contacts) {
    const select = document.getElementById('contactSelect');

    select.innerHTML = '<option value="">-- Select a contact or enter manually --</option>';

    if (!contacts || contacts.length === 0) {
        select.disabled = true;
        return;
    }

    const validContacts = contacts.filter(contact =>
        contact.name && contact.name.trim() !== ''
    );

    if (validContacts.length === 0) {
        select.disabled = true;
        return;
    }

    select.disabled = false;
    validContacts.forEach((contact, index) => {
        const option = document.createElement('option');
        option.value = contacts.indexOf(contact);
        option.textContent = contact.title && contact.title.trim() !== ''
            ? `${contact.name} - ${contact.title}`
            : contact.name;
        select.appendChild(option);
    });
}

// ============================================================================
// FORM ELEMENT SETUP
// ============================================================================

function setupClientDropdowns() {
    document.getElementById('contactSelect').disabled = true;

    // Company dropdown event listener
    document.getElementById('clientSelect').addEventListener('change', function(e) {
        const selectedIndex = e.target.value;
        const contactSelect = document.getElementById('contactSelect');

        if (selectedIndex === '') {
            contactSelect.disabled = true;
            contactSelect.innerHTML = '<option value="">-- Select a contact or enter manually --</option>';

            document.getElementById('firmName').value = '';
            document.getElementById('firmAddress').value = '';
            document.getElementById('firmCityStateZip').value = '';
            document.getElementById('clientName').value = '';
            document.getElementById('clientTitle').value = '';
            return;
        }

        const client = clientsData[selectedIndex];

        document.getElementById('firmName').value = client.name;
        document.getElementById('firmAddress').value = client.address1 || '';
        document.getElementById('firmCityStateZip').value = client.address2 || '';

        document.getElementById('clientName').value = '';
        document.getElementById('clientTitle').value = '';

        populateContactDropdown(client.contacts || []);
    });

    // Contact dropdown event listener
    document.getElementById('contactSelect').addEventListener('change', function(e) {
        const selectedIndex = e.target.value;

        if (selectedIndex === '') {
            document.getElementById('clientName').value = '';
            document.getElementById('clientTitle').value = '';
            return;
        }

        const clientIndex = document.getElementById('clientSelect').value;
        if (clientIndex === '') return;

        const contact = clientsData[clientIndex].contacts[selectedIndex];

        document.getElementById('clientName').value = contact.name;
        document.getElementById('clientTitle').value = contact.title || '';
    });
}

function setupSubConsultantCheckboxes() {
    const subNone = document.getElementById('subNone');
    const subConsultantBoxes = [
        document.getElementById('subElectrical'),
        document.getElementById('subFireSprinkler'),
        document.getElementById('subTestBalance'),
        document.getElementById('subArchitectural'),
        document.getElementById('subStructural')
    ];

    subConsultantBoxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                subNone.checked = false;
            } else {
                const anyChecked = subConsultantBoxes.some(box => box.checked);
                if (!anyChecked) {
                    subNone.checked = true;
                }
            }
        });
    });

    subNone.addEventListener('change', function() {
        if (this.checked) {
            subConsultantBoxes.forEach(box => box.checked = false);
        } else {
            const anyChecked = subConsultantBoxes.some(box => box.checked);
            if (!anyChecked) {
                this.checked = true;
            }
        }
    });
}

// ============================================================================
// PHASE MANAGEMENT
// ============================================================================

function addPhase() {
    const tbody = document.getElementById('phasesBody');
    const row = tbody.insertRow();
    row.innerHTML = `
        <td>
            <select class="phase-name">
                <option value="Scoping">01 Scoping</option>
                <option value="Pre-design">02 Pre-design</option>
                <option value="Schematic Design">03 Schematic Design</option>
                <option value="Project Planning">03.5 Project Planning</option>
                <option value="Design Development">04 Design Development</option>
                <option value="Bridging Documents">04.5 Bridging Documents</option>
                <option value="Construction Documents">05 Construction Documents</option>
                <option value="Agency Approval">05.5 Agency Approval</option>
                <option value="Bidding">06 Bidding</option>
                <option value="Construction Support">07 Construction Support</option>
                <option value="Project Completion">08 Project Completion</option>
                <option value="Repair Period">08.5 Repair Period</option>
                <option value="Commissioning">09 Commissioning</option>
                <option value="Study">10 Study</option>
                <option value="Consulting">11 Consulting</option>
            </select>
        </td>
        <td>
            <input type="text" class="phase-fee">
        </td>
        <td>
            <button type="button" class="remove-btn">Remove</button>
        </td>
    `;

    // Add event listeners
    const feeInput = row.querySelector('.phase-fee');
    const removeBtn = row.querySelector('.remove-btn');

    feeInput.addEventListener('input', formatPhaseFee);
    feeInput.addEventListener('blur', formatPhaseFee);
    removeBtn.addEventListener('click', function() {
        row.remove();
        updatePhaseTotal();
    });
}

function formatPhaseFee(e) {
    const input = e.target;
    let value = input.value.replace(/[^0-9]/g, '');
    input.value = value;
    updatePhaseTotal();
}

function formatCurrency(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function updatePhaseTotal() {
    const fees = document.querySelectorAll('.phase-fee');
    let total = 0;
    fees.forEach(fee => {
        const cleanValue = fee.value.replace(/,/g, '');
        total += parseFloat(cleanValue) || 0;
    });
    document.getElementById('totalFee').value = '$' + formatCurrency(total);
}

// ============================================================================
// AUTOFILL SAMPLE DATA
// ============================================================================

function autofillProjectInfo() {
    document.getElementById('projectName').value = 'Medical Office Building Renovation';
    document.getElementById('jurisdiction').value = 'HCAI, City of Sacramento';

    projectSummaryEditor.setText('This project involves the renovation of an existing 15,000 square foot medical office building. The scope includes upgrading HVAC systems, modifying mechanical and plumbing systems to accommodate new tenant layouts, and ensuring compliance with current building codes and OSHPD requirements. The project will be completed in phases to maintain partial building occupancy during construction.');

    mechanicalSummaryEditor.setText('The mechanical scope includes replacement of the existing rooftop HVAC units with new high-efficiency units, modification of ductwork distribution to accommodate new floor plans, installation of new VAV boxes and controls, and integration with the building automation system. All work will comply with Title 24 energy efficiency requirements and ASHRAE standards.');

    plumbingSummaryEditor.setText('The plumbing scope includes relocation of fixtures to accommodate new exam rooms and offices, replacement of aging domestic water piping, installation of new medical gas systems, upgrade of the domestic water heater, and installation of low-flow fixtures to meet current water conservation requirements. All plumbing work will comply with California Plumbing Code and healthcare facility standards.');
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

async function generateProposal(e) {
    e.preventDefault();

    // Get logged-in user from localStorage
    const currentUser = localStorage.getItem('currentUser') || 'Unknown User';

    // Collect form data
    const clientFullName = document.getElementById('clientName').value;
    const clientFirstName = clientFullName.trim().split(/\s+/)[0];

    const data = {
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        client_name: clientFullName,
        client_first_name: clientFirstName,
        client_title: document.getElementById('clientTitle').value,
        firm_name: document.getElementById('firmName').value,
        firm_address: document.getElementById('firmAddress').value,
        firm_city_state_zip: document.getElementById('firmCityStateZip').value,
        project_name: document.getElementById('projectName').value,
        project_summary: quillToPlainText(projectSummaryEditor).join('\n'),
        mechanical_summary: quillToPlainText(mechanicalSummaryEditor),
        plumbing_summary: quillToPlainText(plumbingSummaryEditor),
        jurisdiction: document.getElementById('jurisdiction').value.trim() || 'local',
        user_name: currentUser,
        user_title: 'Principal',
        fee_type: document.getElementById('feeType').value,
        total_fee: document.getElementById('totalFee').value.substring(1),
        include_mechanical: mechanicalSummaryEditor.getText().trim().length > 1,
        include_plumbing: plumbingSummaryEditor.getText().trim().length > 1,

        // Computed conditionals
        has_subconsultants: document.getElementById('subElectrical').checked ||
                            document.getElementById('subFireSprinkler').checked ||
                            document.getElementById('subTestBalance').checked ||
                            document.getElementById('subArchitectural').checked ||
                            document.getElementById('subStructural').checked,
        is_hourly_nte: document.getElementById('feeType').value === 'Hourly - NTE',
        is_percent_complete: document.getElementById('feeType').value === 'Percent Complete',

        // Sub-consultant services
        sub_none: document.getElementById('subNone').checked,
        sub_electrical: document.getElementById('subElectrical').checked,
        sub_fire_sprinkler: document.getElementById('subFireSprinkler').checked,
        sub_test_balance: document.getElementById('subTestBalance').checked,
        sub_architectural: document.getElementById('subArchitectural').checked,
        sub_structural: document.getElementById('subStructural').checked,

        // Scope of services
        scope_schematic: document.getElementById('scopeSchematic').checked,
        scope_dd: document.getElementById('scopeDD').checked,
        scope_cd: document.getElementById('scopeCD').checked,
        scope_ca: document.getElementById('scopeCA').checked,

        // Phases
        phases: []
    };

    // Collect phase data
    const phaseNames = document.querySelectorAll('.phase-name');
    const phaseFees = document.querySelectorAll('.phase-fee');
    for (let i = 0; i < phaseNames.length; i++) {
        if (phaseNames[i].value && phaseFees[i].value) {
            const cleanValue = phaseFees[i].value.replace(/,/g, '');
            const numValue = parseFloat(cleanValue);
            data.phases.push({
                name: phaseNames[i].value,
                fee: numValue.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                })
            });
        }
    }

    try {
        // Load the template file
        const templatePath = path.join(__dirname, '../docx/Proposal Template.docx');
        const content = fs.readFileSync(templatePath);

        // Load the template with PizZip
        const zip = new PizZip(content);

        // Create docxtemplater instance
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: function(part) {
                console.warn('Missing value for:', part);
                return '';
            }
        });

        // Render the document with data
        doc.render(data);

        // Generate the output file
        const out = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        // Save the file
        const projectName = data.project_name.replace(/[^a-z0-9]/gi, '_');
        const fileName = `Proposal_${projectName}_${Date.now()}.docx`;

        // Use FileSaver to download the file
        saveAs(out, fileName);
        alert('✓ Proposal generated successfully!');

    } catch (error) {
        console.error('Full error:', error);
        if (error.properties && error.properties.errors) {
            console.error('Template errors:', JSON.stringify(error.properties.errors, null, 2));
        }
        alert('Error generating document. Check the console for details.\n\nError: ' + error.message);
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Quill editors
    initializeQuillEditors();

    // Load client data
    loadClients();

    // Setup form elements
    setupClientDropdowns();
    setupSubConsultantCheckboxes();

    // Setup button event listeners
    document.getElementById('addPhaseBtn').addEventListener('click', addPhase);
    document.getElementById('autofillBtn').addEventListener('click', autofillProjectInfo);

    // Setup form submission
    document.getElementById('proposalForm').addEventListener('submit', generateProposal);
});
