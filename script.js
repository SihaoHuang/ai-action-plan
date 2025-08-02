document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof aiActionPlanData === 'undefined') {
            console.error('aiActionPlanData is not defined');
            document.getElementById('agencies-container').innerHTML = '<div class="error-message">Error: Data not loaded</div>';
            return;
        }
        
        console.log('aiActionPlanData loaded:', aiActionPlanData);
        console.log('Number of agencies:', aiActionPlanData.agencies?.length);
        
        const stats = calculateStatistics();
        console.log('Stats:', stats);
        
        // Update statistics
        updateStatistics(stats);
        
        // Create agency chart
        createAgencyChart(stats.byAgency);
        
        // Render agency cards
        renderAgencies();
        
        // Setup filter buttons
        setupFilters();
        
        // Setup modal
        setupModal();
        
        // Create agency completion charts
        createAgencyCompletionCharts();
    } catch (error) {
        console.error('Error initializing website:', error);
        document.getElementById('agencies-container').innerHTML = '<div class="error-message">Error loading content: ' + error.message + '</div>';
    }
});

function updateStatistics(stats) {
    document.getElementById('total-recommendations').textContent = stats.lead; // Show 103 policy actions, not total entries
    document.getElementById('total-agencies').textContent = stats.agencies;
    // stat-total is now hardcoded to "3" (pillars), so don't update it
    document.getElementById('stat-agencies').textContent = stats.agencies;
    document.getElementById('stat-lead').textContent = stats.lead;
    document.getElementById('stat-support').textContent = stats.support;
}

function createAgencyChart(agencyStats) {
    const ctx = document.getElementById('agencyChart').getContext('2d');
    const agencies = Object.keys(agencyStats);
    const leadData = agencies.map(a => agencyStats[a].lead);
    const supportData = agencies.map(a => agencyStats[a].support);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: agencies,
            datasets: [
                {
                    label: 'Lead Agency',
                    data: leadData,
                    backgroundColor: '#005ea2',
                    borderColor: '#003566',
                    borderWidth: 1
                },
                {
                    label: 'Supporting Agency',
                    data: supportData,
                    backgroundColor: '#ffbe2e',
                    borderColor: '#e6ac00',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Recommendations by Agency and Role',
                    font: {
                        size: 18,
                        family: 'Instrument Serif',
                        weight: 'normal'
                    },
                    color: '#030A1B'
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14,
                            family: 'Instrument Sans'
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Instrument Sans'
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: '#E0E0E0'
                    },
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Instrument Sans'
                        }
                    }
                }
            }
        }
    });
}

function renderAgencies() {
    const container = document.getElementById('agencies-container');
    if (!container) {
        console.error('agencies-container not found');
        return;
    }
    
    // Clear loading message
    container.innerHTML = '';
    
    if (!aiActionPlanData || !aiActionPlanData.agencies) {
        container.innerHTML = '<div class="error-message">No agency data available</div>';
        return;
    }
    
    // Sort agencies by total number of recommendations (descending)
    const sortedAgencies = [...aiActionPlanData.agencies].sort((a, b) => {
        return b.recommendations.length - a.recommendations.length;
    });
    
    // Create fragment for better performance
    const fragment = document.createDocumentFragment();
    
    sortedAgencies.forEach((agency, index) => {
        try {
            const agencyCard = createAgencyCard(agency);
            fragment.appendChild(agencyCard);
        } catch (error) {
            console.error(`Error creating card for agency ${agency.name}:`, error);
            // Create error card
            const errorCard = document.createElement('div');
            errorCard.className = 'agency-card error';
            errorCard.innerHTML = `<div class="agency-header"><h3>Error loading ${agency.name || 'Unknown Agency'}</h3></div>`;
            fragment.appendChild(errorCard);
        }
    });
    
    container.appendChild(fragment);
}

function createAgencyCard(agency) {
    const card = document.createElement('div');
    card.className = 'agency-card';
    card.dataset.agency = agency.acronym;
    
    // Create header section
    const header = document.createElement('div');
    header.className = 'agency-header';
    
    const nameElement = document.createElement('h3');
    nameElement.className = 'agency-name';
    nameElement.textContent = agency.name;
    
    const statsElement = document.createElement('div');
    statsElement.className = 'agency-stats';
    
    const leadCount = agency.recommendations.filter(r => r.role === 'lead').length;
    const supportCount = agency.recommendations.filter(r => r.role === 'support').length;
    
    statsElement.innerHTML = `
        <span>Lead: ${leadCount}</span>
        <span>Support: ${supportCount}</span>
        <span>Total: ${agency.recommendations.length}</span>
    `;
    
    header.appendChild(nameElement);
    header.appendChild(statsElement);
    
    // Create recommendations section
    const recommendationsContainer = document.createElement('div');
    recommendationsContainer.className = 'agency-recommendations';
    
    // Sort recommendations: lead first, then support
    const sortedRecommendations = [...agency.recommendations].sort((a, b) => {
        if (a.role === 'lead' && b.role === 'support') return -1;
        if (a.role === 'support' && b.role === 'lead') return 1;
        return 0;
    });
    
    sortedRecommendations.forEach(rec => {
        const recElement = document.createElement('div');
        recElement.className = `recommendation-item ${rec.role}`;
        recElement.dataset.id = rec.id;
        recElement.dataset.agency = agency.name;
        recElement.dataset.title = rec.title;
        recElement.dataset.description = rec.description;
        recElement.dataset.pillar = rec.pillar || 'pillar1';
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'recommendation-content';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'recommendation-title';
        titleElement.textContent = rec.title;
        
        const roleElement = document.createElement('div');
        roleElement.className = `recommendation-role ${rec.role}`;
        roleElement.textContent = rec.role === 'lead' ? 'LEAD AGENCY' : 'SUPPORTING AGENCY';
        
        // Add status dropdown
        const statusWrapper = document.createElement('div');
        statusWrapper.className = 'status-wrapper';
        
        const statusLabel = document.createElement('label');
        statusLabel.textContent = 'Status: ';
        statusLabel.className = 'status-label';
        
        const statusSelect = document.createElement('select');
        statusSelect.className = 'status-select';
        statusSelect.dataset.recId = rec.id;
        statusSelect.onclick = (e) => e.stopPropagation(); // Prevent modal from opening
        
        const statuses = ['Pending', 'PoC established', 'In progress', 'Completed'];
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });
        
        // Load saved status
        const savedStatus = getStatus(rec.id);
        if (savedStatus) {
            statusSelect.value = savedStatus;
        }
        
        // Save status on change
        statusSelect.onchange = (e) => {
            e.stopPropagation();
            const newStatus = e.target.value;
            const actionId = rec.id;
            
            // Save the status
            saveStatus(actionId, newStatus);
            
            // Update all other instances of this action across all cards
            updateAllInstancesOfAction(actionId, newStatus);
            
            updateStatusCount();
            // Reapply filters to update visibility if filtering by status
            if (activeFilters.status !== 'all') {
                applyFilters();
            }
            // Update completion charts
            createAgencyCompletionCharts();
        };
        
        statusWrapper.appendChild(statusLabel);
        statusWrapper.appendChild(statusSelect);
        
        contentWrapper.appendChild(titleElement);
        contentWrapper.appendChild(roleElement);
        
        recElement.appendChild(contentWrapper);
        recElement.appendChild(statusWrapper);
        
        // Update click handling to exclude status wrapper
        contentWrapper.onclick = function() {
            const modal = document.getElementById('recommendation-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            
            modalTitle.textContent = rec.title;
            modalBody.innerHTML = `
                <p><strong>Agency:</strong> ${agency.name}</p>
                <p><strong>Role:</strong> ${rec.role === 'lead' ? 'Lead Agency' : 'Supporting Agency'}</p>
                <p><strong>Description:</strong></p>
                <p>${rec.description}</p>
            `;
            
            modal.style.display = 'block';
        };
        recommendationsContainer.appendChild(recElement);
    });
    
    card.appendChild(header);
    card.appendChild(recommendationsContainer);
    
    return card;
}

// Store active filters
let activeFilters = {
    pillar: 'all',
    status: 'all',
    search: ''
};

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.dataset.filterType;
            const filterValue = this.dataset.filter;
            
            // Remove active class from buttons in the same group
            document.querySelectorAll(`.filter-btn[data-filter-type="${filterType}"]`).forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update active filters
            activeFilters[filterType] = filterValue;
            
            // Apply combined filters
            applyFilters();
        });
    });
    
    // Setup search functionality
    setupSearch();
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search');
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const searchTerm = this.value.trim();
        
        // Show/hide clear button
        clearButton.style.display = searchTerm ? 'block' : 'none';
        
        // Debounce search to avoid too many updates
        searchTimeout = setTimeout(() => {
            activeFilters.search = searchTerm.toLowerCase();
            applyFilters();
        }, 300);
    });
    
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        this.style.display = 'none';
        activeFilters.search = '';
        applyFilters();
    });
    
    // Allow Enter key to trigger immediate search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            activeFilters.search = this.value.trim().toLowerCase();
            applyFilters();
        }
    });
}

function applyFilters() {
    const cards = document.querySelectorAll('.agency-card');
    
    cards.forEach(card => {
        const agencyName = card.querySelector('.agency-name').textContent.toLowerCase();
        const recommendations = card.querySelectorAll('.recommendation-item');
        let visibleLeadCount = 0;
        let visibleSupportCount = 0;
        let hasVisibleRecommendations = false;
        
        // Check if agency name matches search
        const agencyMatchesSearch = !activeFilters.search || agencyName.includes(activeFilters.search);
        
        recommendations.forEach(rec => {
            const recId = rec.dataset.id;
            const recPillar = rec.dataset.pillar;
            const recStatus = getStatus(recId);
            const recTitle = rec.dataset.title.toLowerCase();
            const recDescription = rec.dataset.description.toLowerCase();
            
            // Check if recommendation passes all filters
            const passesPillarFilter = activeFilters.pillar === 'all' || recPillar === activeFilters.pillar;
            const passesStatusFilter = activeFilters.status === 'all' || recStatus === activeFilters.status;
            const passesSearchFilter = !activeFilters.search || 
                agencyMatchesSearch || 
                recTitle.includes(activeFilters.search) || 
                recDescription.includes(activeFilters.search);
            
            if (passesPillarFilter && passesStatusFilter && passesSearchFilter) {
                rec.style.display = 'block';
                hasVisibleRecommendations = true;
                if (rec.classList.contains('lead')) {
                    visibleLeadCount++;
                } else if (rec.classList.contains('support')) {
                    visibleSupportCount++;
                }
                
                // Highlight search terms if present
                if (activeFilters.search) {
                    highlightSearchTerms(rec, activeFilters.search);
                } else {
                    removeHighlights(rec);
                }
            } else {
                rec.style.display = 'none';
            }
        });
        
        // Show/hide the entire agency card based on whether it has visible recommendations
        card.style.display = hasVisibleRecommendations ? 'block' : 'none';
        
        // Update the agency stats display
        const visibleTotal = visibleLeadCount + visibleSupportCount;
        const statsElement = card.querySelector('.agency-stats');
        if (statsElement && hasVisibleRecommendations) {
            statsElement.innerHTML = `
                <span>Lead: ${visibleLeadCount}</span>
                <span>Support: ${visibleSupportCount}</span>
                <span>Total: ${visibleTotal}</span>
            `;
        }
    });
}

function highlightSearchTerms(element, searchTerm) {
    const titleElement = element.querySelector('.recommendation-title');
    if (titleElement) {
        const originalText = element.dataset.title;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedText = originalText.replace(regex, '<span class="search-highlight">$1</span>');
        titleElement.innerHTML = highlightedText;
    }
}

function removeHighlights(element) {
    const titleElement = element.querySelector('.recommendation-title');
    if (titleElement) {
        titleElement.textContent = element.dataset.title;
    }
}

function setupModal() {
    const modal = document.getElementById('recommendation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close');
    
    // Click events are now handled directly on contentWrapper in createAgencyCard
    
    // Close modal when clicking X
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

// Storage functions for status persistence
function saveStatus(recId, status) {
    const statuses = JSON.parse(localStorage.getItem('aiActionPlanStatuses') || '{}');
    statuses[recId] = status;
    localStorage.setItem('aiActionPlanStatuses', JSON.stringify(statuses));
    
    // Optional: Save to GitHub Gist for cloud persistence
    // This would require user authentication
    // saveToGitHub(statuses);
}

function getStatus(recId) {
    const statuses = JSON.parse(localStorage.getItem('aiActionPlanStatuses') || '{}');
    return statuses[recId] || 'Pending';
}

function getAllStatuses() {
    return JSON.parse(localStorage.getItem('aiActionPlanStatuses') || '{}');
}

function updateAllInstancesOfAction(actionId, newStatus) {
    // Find all status selects with the same action ID and update them
    const allStatusSelects = document.querySelectorAll(`select[data-rec-id="${actionId}"]`);
    
    allStatusSelects.forEach(select => {
        if (select.value !== newStatus) {
            select.value = newStatus;
            // Trigger visual update for the select element's styling
            select.setAttribute('value', newStatus);
        }
    });
}

function updateStatusCount() {
    const statuses = getAllStatuses();
    const counts = {
        'Pending': 0,
        'PoC established': 0,
        'In progress': 0,
        'Completed': 0
    };
    
    Object.values(statuses).forEach(status => {
        if (counts.hasOwnProperty(status)) {
            counts[status]++;
        }
    });
    
    // Update status summary if we add it to the UI later
    console.log('Status counts:', counts);
}

// Export/Import functionality for sharing
function exportStatuses() {
    const statuses = getAllStatuses();
    const dataStr = JSON.stringify(statuses, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'ai-action-plan-statuses.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importStatuses(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const statuses = JSON.parse(e.target.result);
            localStorage.setItem('aiActionPlanStatuses', JSON.stringify(statuses));
            location.reload(); // Refresh to show new statuses
        } catch (error) {
            alert('Invalid status file');
        }
    };
    reader.readAsText(file);
}

// Agency completion tracking
function createAgencyCompletionCharts() {
    const container = document.getElementById('agency-completion-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Calculate completion stats for each agency
    const agencyCompletionData = calculateAgencyCompletions();
    
    // Sort agencies by completion percentage (descending)
    const sortedAgencies = Object.entries(agencyCompletionData)
        .sort(([,a], [,b]) => b.completionPercentage - a.completionPercentage);
    
    sortedAgencies.forEach(([acronym, data]) => {
        const card = createAgencyCompletionCard(acronym, data);
        container.appendChild(card);
    });
}

function calculateAgencyCompletions() {
    const agencyData = {};
    
    aiActionPlanData.agencies.forEach(agency => {
        const stats = {
            pending: 0,
            pocEstablished: 0,
            inProgress: 0,
            completed: 0,
            total: 0
        };
        
        agency.recommendations.forEach(rec => {
            const status = getStatus(rec.id);
            stats.total++;
            
            switch(status) {
                case 'Pending':
                    stats.pending++;
                    break;
                case 'PoC established':
                    stats.pocEstablished++;
                    break;
                case 'In progress':
                    stats.inProgress++;
                    break;
                case 'Completed':
                    stats.completed++;
                    break;
            }
        });
        
        // Calculate weighted completion percentage
        // Pending: 0%, PoC: 25%, In Progress: 50%, Completed: 100%
        const weightedScore = (stats.pocEstablished * 0.25) + 
                             (stats.inProgress * 0.5) + 
                             (stats.completed * 1.0);
        const completionPercentage = stats.total > 0 ? (weightedScore / stats.total) * 100 : 0;
        
        agencyData[agency.acronym] = {
            name: agency.name,
            ...stats,
            completionPercentage: Math.round(completionPercentage)
        };
    });
    
    return agencyData;
}

function createAgencyCompletionCard(acronym, data) {
    const card = document.createElement('div');
    card.className = 'agency-completion-card';
    
    // Calculate color based on completion percentage
    const color = getCompletionColor(data.completionPercentage);
    
    card.innerHTML = `
        <div class="agency-completion-name">${acronym}</div>
        <div class="agency-completion-chart">
            <canvas id="chart-${acronym}" width="80" height="80"></canvas>
        </div>
        <div class="completion-stats">
            <div class="completion-percentage" style="color: ${color}">
                ${data.completionPercentage}%
            </div>
            <div class="completion-breakdown">
                ${data.completed}/${data.total} completed
            </div>
        </div>
    `;
    
    // Create pie chart after DOM insertion
    setTimeout(() => {
        createAgencyPieChart(`chart-${acronym}`, data);
    }, 0);
    
    return card;
}

function createAgencyPieChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Define tasteful colors from red to green
    const colors = {
        pending: '#dc2626',      // Red
        pocEstablished: '#d97706', // Orange  
        inProgress: '#ca8a04',   // Yellow
        completed: '#16a34a'     // Green
    };
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'PoC Established', 'In Progress', 'Completed'],
            datasets: [{
                data: [data.pending, data.pocEstablished, data.inProgress, data.completed],
                backgroundColor: [
                    colors.pending,
                    colors.pocEstablished,
                    colors.inProgress,
                    colors.completed
                ],
                borderWidth: 0,
                cutout: '50%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    cornerRadius: 4,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.label;
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 1000
            }
        }
    });
}

function getCompletionColor(percentage) {
    // Generate color from red to green based on completion percentage
    if (percentage <= 25) {
        // Red to Orange (0-25%)
        const factor = percentage / 25;
        const red = Math.round(220 * (1 - factor) + 217 * factor);
        const green = Math.round(38 * (1 - factor) + 119 * factor);
        const blue = Math.round(38 * (1 - factor) + 6 * factor);
        return `rgb(${red}, ${green}, ${blue})`;
    } else if (percentage <= 50) {
        // Orange to Yellow (25-50%)
        const factor = (percentage - 25) / 25;
        const red = Math.round(217 * (1 - factor) + 202 * factor);
        const green = Math.round(119 * (1 - factor) + 138 * factor);
        const blue = Math.round(6 * (1 - factor) + 4 * factor);
        return `rgb(${red}, ${green}, ${blue})`;
    } else if (percentage <= 75) {
        // Yellow to Light Green (50-75%)
        const factor = (percentage - 50) / 25;
        const red = Math.round(202 * (1 - factor) + 101 * factor);
        const green = Math.round(138 * (1 - factor) + 163 * factor);
        const blue = Math.round(4 * (1 - factor) + 13 * factor);
        return `rgb(${red}, ${green}, ${blue})`;
    } else {
        // Light Green to Green (75-100%)
        const factor = (percentage - 75) / 25;
        const red = Math.round(101 * (1 - factor) + 22 * factor);
        const green = Math.round(163 * (1 - factor) + 163 * factor);
        const blue = Math.round(13 * (1 - factor) + 74 * factor);
        return `rgb(${red}, ${green}, ${blue})`;
    }
}