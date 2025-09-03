// Enhanced Auto-Bolt Popup JavaScript with Trust-Building Features
class AutoBoltUI {
    constructor() {
        this.currentStep = 1;
        this.isProcessing = false;
        this.processingStartTime = null;
        this.processedRecords = 0;
        this.totalRecords = 0;
        this.successCount = 0;
        this.errorCount = 0;
        this.skippedCount = 0;
        this.pendingCount = 0;
        this.isPaused = false;
        this.toastQueue = [];
        
        // Directory management
        this.directories = [];
        this.selectedDirectories = new Set();
        this.filteredDirectories = [];
        this.currentPreset = 'custom';
        this.businessData = null;
        this.processingResults = [];
        
        // Performance optimizations
        this.virtualScrolling = {
            itemHeight: 80, // Height of each directory item in pixels
            containerHeight: 320, // Max height of container
            visibleItems: 0,
            scrollTop: 0,
            startIndex: 0,
            endIndex: 0,
            buffer: 5 // Extra items to render for smooth scrolling
        };
        this.searchDebounceTimer = null;
        this.renderDebounceTimer = null;
        
        // Performance monitoring
        this.performanceMetrics = {
            renderTime: 0,
            searchTime: 0,
            filterTime: 0
        };
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.updateStepIndicator();
        this.initializeAccessibility();
        await this.loadDirectories();
        this.setupDirectoryUI();
        this.showToast('Welcome to Auto-Bolt! Ready for professional directory submissions 🚀', 'info');
        this.loadSavedSettings();
        
        // Initialize filteredDirectories to show all directories initially
        this.filteredDirectories = [...this.directories];
        this.applyFilters();
    }

    bindEvents() {
        // Button events
        document.getElementById('fetchButton').addEventListener('click', () => this.handleFetchData());
        document.getElementById('fillFormsButton').addEventListener('click', () => this.handleFillForm());
        document.getElementById('startDirectorySubmissionButton').addEventListener('click', () => this.handleDirectorySubmission());
        document.getElementById('clearDataButton').addEventListener('click', () => this.handleClearData());
        document.getElementById('saveSettings').addEventListener('click', () => this.handleSaveSettings());
        
        // Directory selection events
        document.getElementById('quickStartPreset').addEventListener('click', () => this.applyPreset('quickStart'));
        document.getElementById('fullAutomationPreset').addEventListener('click', () => this.applyPreset('fullAutomation'));
        document.getElementById('highPriorityPreset').addEventListener('click', () => this.applyPreset('highPriority'));
        document.getElementById('customPreset').addEventListener('click', () => this.applyPreset('custom'));
        
        // Filter events
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('difficultyFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('priorityFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('requiresLoginFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('hasAntiBotFilter').addEventListener('change', () => this.applyFilters());
        
        // Enhanced search events with debouncing
        document.getElementById('directorySearch').addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
            
            // Show/hide clear button
            const clearButton = document.getElementById('searchClear');
            if (e.target.value.trim()) {
                clearButton.classList.remove('opacity-0');
                clearButton.classList.add('opacity-100');
            } else {
                clearButton.classList.add('opacity-0');
                clearButton.classList.remove('opacity-100');
            }
        });
        
        document.getElementById('searchClear').addEventListener('click', () => this.clearSearch());
        
        // Add clear filters functionality
        document.getElementById('clearFilters')?.addEventListener('click', () => this.clearAllFilters());
        
        // Selection events
        document.getElementById('selectAllDirectories').addEventListener('change', (e) => this.handleSelectAll(e.target.checked));
        document.getElementById('expandAllCategories').addEventListener('click', () => this.toggleExpandAll());
        
        // Directory processing control events
        document.getElementById('cancelBatchButton').addEventListener('click', () => this.handleCancelDirectoryProcessing());
        document.getElementById('pauseResumeButton').addEventListener('click', () => this.handlePauseResume());
        document.getElementById('exportResultsButton').addEventListener('click', () => this.exportResults());
        
        // Log controls
        document.getElementById('clearLogButton').addEventListener('click', () => this.clearLog());
        document.getElementById('exportLogButton').addEventListener('click', () => this.exportLog());
        document.getElementById('downloadCSVButton').addEventListener('click', () => this.downloadCSV());
        
        // Results controls
        document.getElementById('showDetailsButton').addEventListener('click', () => this.toggleResultsDetails());
        document.getElementById('filterResultsButton').addEventListener('click', () => this.showResultsFilter());
        
        // Modal events
        document.getElementById('modalClose').addEventListener('click', () => this.hideModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.hideModal());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalOverlay')) {
                this.hideModal();
            }
        });
        
        // Toast close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('toast-close')) {
                this.closeToast(e.target.closest('.toast'));
            }
        });
    }

    // Enhanced Step Management with Tailwind animations
    updateStepIndicator(step = null) {
        if (step) this.currentStep = step;
        
        const steps = document.querySelectorAll('.step');
        const connectors = document.querySelectorAll('.step-connector');
        
        steps.forEach((stepEl, index) => {
            const stepNumber = index + 1;
            const circle = stepEl.querySelector('.step[data-step]')?.firstElementChild;
            const number = stepEl.querySelector('.step-number');
            const icon = stepEl.querySelector('.step-icon');
            const label = stepEl.querySelector('.step-label');
            
            if (circle && number && icon && label) {
                // Reset classes
                circle.className = circle.className.replace(/border-\w+-\d+|bg-\w+-\d+|shadow-\w+/g, '');
                
                if (stepNumber < this.currentStep) {
                    // Completed state
                    circle.classList.add('border-green-500', 'bg-green-500', 'shadow-lg');
                    circle.style.transform = 'scale(1.05)';
                    number.style.opacity = '0';
                    number.style.transform = 'scale(0)';
                    icon.style.opacity = '1';
                    icon.style.transform = 'scale(1)';
                    icon.style.color = 'white';
                    label.classList.add('text-green-600', 'font-semibold');
                    
                } else if (stepNumber === this.currentStep) {
                    // Active state
                    circle.classList.add('border-blue-500', 'bg-blue-50', 'shadow-lg', 'shadow-blue-300/50');
                    circle.style.transform = 'scale(1.1)';
                    number.classList.add('text-blue-600', 'font-bold');
                    label.classList.add('text-blue-600', 'font-semibold');
                    
                    // Add pulsing animation
                    circle.style.animation = 'pulse 2s infinite';
                    
                } else {
                    // Pending state
                    circle.classList.add('border-gray-300', 'bg-white');
                    circle.style.transform = 'scale(1)';
                    circle.style.animation = 'none';
                    number.style.opacity = '1';
                    number.style.transform = 'scale(1)';
                    icon.style.opacity = '0';
                    icon.style.transform = 'scale(0)';
                    label.classList.remove('text-blue-600', 'text-green-600', 'font-semibold');
                }
            }
        });
        
        // Enhanced connector animations
        connectors.forEach((connector, index) => {
            const progressBar = connector.querySelector('div');
            if (progressBar) {
                if (index + 1 < this.currentStep) {
                    progressBar.style.transform = 'translateX(0)';
                    progressBar.classList.remove('bg-auto-primary');
                    progressBar.classList.add('bg-green-500');
                } else if (index + 1 === this.currentStep) {
                    progressBar.style.transform = 'translateX(0)';
                    progressBar.classList.add('bg-auto-primary');
                    progressBar.style.animation = 'flow 2s ease-in-out infinite';
                } else {
                    progressBar.style.transform = 'translateX(-100%)';
                    progressBar.style.animation = 'none';
                }
            }
        });
    }

    setStepError(step) {
        const stepEl = document.querySelector(`.step[data-step="${step}"]`);
        if (stepEl) {
            stepEl.classList.remove('active', 'completed');
            stepEl.classList.add('error');
        }
    }

    // Enhanced Status Management with Tailwind
    updateStatus(text, subtext = '', type = 'ready') {
        const statusText = document.getElementById('statusText');
        const statusSubtext = document.getElementById('statusSubtext');
        const statusDot = document.getElementById('statusDot');
        const statusContainer = document.getElementById('statusIndicator')?.parentElement;
        
        statusText.textContent = text;
        statusSubtext.textContent = subtext;
        
        // Reset classes
        statusDot.className = 'w-3 h-3 rounded-full transition-all duration-300';
        
        if (statusContainer) {
            statusContainer.className = statusContainer.className.replace(/from-\w+-\d+|to-\w+-\d+|border-\w+-\d+/g, '');
        }
        
        switch (type) {
            case 'loading':
                statusDot.classList.add('bg-amber-500', 'animate-pulse');
                if (statusContainer) {
                    statusContainer.classList.add('bg-gradient-to-r', 'from-amber-50', 'to-yellow-50', 'border-amber-200');
                }
                break;
            case 'error':
                statusDot.classList.add('bg-red-500', 'animate-bounce');
                if (statusContainer) {
                    statusContainer.classList.add('bg-gradient-to-r', 'from-red-50', 'to-pink-50', 'border-red-200');
                }
                break;
            case 'success':
                statusDot.classList.add('bg-green-500', 'animate-pulse');
                if (statusContainer) {
                    statusContainer.classList.add('bg-gradient-to-r', 'from-green-50', 'to-emerald-50', 'border-green-200');
                }
                break;
            default: // ready
                statusDot.classList.add('bg-green-500', 'animate-pulse');
                if (statusContainer) {
                    statusContainer.classList.add('bg-gradient-to-r', 'from-blue-50', 'to-indigo-50', 'border-blue-200');
                }
        }
        
        // Add ripple effect
        statusDot.style.position = 'relative';
        const ripple = statusDot.parentElement?.querySelector('.absolute');
        if (ripple) {
            ripple.style.animation = type === 'loading' ? 'ping 2s infinite' : 'ping 1s';
        }
    }

    // Enhanced Button State Management for Tailwind
    setButtonLoading(buttonId, loading = true) {
        const button = document.getElementById(buttonId);
        const spinner = button.querySelector('.loading-spinner');
        const icon = button.querySelector('span[class*="text-"]');
        
        if (loading) {
            button.disabled = true;
            if (spinner) {
                spinner.classList.remove('hidden');
                spinner.classList.add('block');
            }
            if (icon) {
                icon.style.opacity = '0.7';
            }
            
            // Add loading state styling
            button.classList.add('cursor-not-allowed', 'opacity-75');
            
        } else {
            button.disabled = false;
            if (spinner) {
                spinner.classList.add('hidden');
                spinner.classList.remove('block');
            }
            if (icon) {
                icon.style.opacity = '1';
            }
            
            // Remove loading state styling
            button.classList.remove('cursor-not-allowed', 'opacity-75');
        }
    }

    enableButton(buttonId, enabled = true) {
        const button = document.getElementById(buttonId);
        button.disabled = !enabled;
    }

    // Data Fetching
    async handleFetchData() {
        this.setButtonLoading('fetchButton', true);
        this.updateStatus('Fetching data...', 'Connecting to Airtable', 'loading');
        this.updateStepIndicator(1);
        
        try {
            // Simulate API call with loading steps
            await this.showLoadingWithSteps([
                'Connecting to Airtable...',
                'Fetching records...',
                'Processing data...'
            ]);
            
            // Simulate successful data fetch
            const mockData = this.generateMockData();
            this.displayBusinessData(mockData);
            
            this.updateStatus('Data loaded successfully', `${mockData.length} records available`, 'ready');
            this.updateStepIndicator(2);
            this.enableButton('fillFormsButton', true);
            this.enableButton('startDirectorySubmissionButton', this.selectedDirectories.size > 0);
            this.businessData = mockData;
            
            const recordCount = document.getElementById('recordCount');
            const countBadge = recordCount.querySelector('.count-badge');
            countBadge.textContent = `${mockData.length} records`;
            recordCount.style.display = 'flex';
            
            this.showToast(`Successfully loaded ${mockData.length} business records`, 'success');
            
        } catch (error) {
            this.updateStatus('Failed to fetch data', 'Please check your settings', 'error');
            this.setStepError(1);
            this.showToast('Failed to fetch business data. Please check your API credentials.', 'error');
        } finally {
            this.setButtonLoading('fetchButton', false);
            this.hideLoading();
        }
    }

    generateMockData() {
        return [
            { company: 'Tech Solutions Inc', contact: 'John Smith', email: 'john@techsolutions.com' },
            { company: 'Digital Marketing Pro', contact: 'Sarah Johnson', email: 'sarah@digitalmarketing.com' },
            { company: 'Creative Design Studio', contact: 'Mike Brown', email: 'mike@creativedesign.com' },
            { company: 'Data Analytics Corp', contact: 'Lisa Davis', email: 'lisa@dataanalytics.com' },
            { company: 'Cloud Services LLC', contact: 'Tom Wilson', email: 'tom@cloudservices.com' }
        ];
    }

    displayBusinessData(data) {
        const display = document.getElementById('businessInfoDisplay');
        
        if (!data || data.length === 0) {
            display.innerHTML = `
                <div class="no-data">
                    <div class="empty-state-icon">📋</div>
                    <p>No business data available</p>
                    <p class="help-text">Try fetching data again</p>
                </div>
            `;
            return;
        }

        const dataHtml = data.map((item, index) => `
            <div class="business-record" data-index="${index}">
                <div class="record-header">
                    <strong>${item.company}</strong>
                    <span class="record-badge">#${index + 1}</span>
                </div>
                <div class="record-details">
                    <div class="data-item">
                        <span class="data-label">Contact:</span>
                        <span class="data-value">${item.contact}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Email:</span>
                        <span class="data-value">${item.email}</span>
                    </div>
                </div>
            </div>
        `).join('');

        display.innerHTML = `<div class="business-data">${dataHtml}</div>`;
    }

    // Form Filling
    async handleFillForm() {
        this.setButtonLoading('fillFormsButton', true);
        this.updateStatus('Filling form...', 'Processing current record', 'loading');
        this.updateStepIndicator(3);
        
        try {
            await this.delay(2000); // Simulate form filling
            this.updateStatus('Form filled successfully', 'Ready for next action', 'ready');
            this.showToast('Form filled successfully! 📝', 'success');
        } catch (error) {
            this.setStepError(3);
            this.showToast('Failed to fill form. Please try again.', 'error');
        } finally {
            this.setButtonLoading('fillFormsButton', false);
        }
    }

    // Directory Management
    async loadDirectories() {
        try {
            // Load the master directory list
            const response = await fetch(chrome.runtime.getURL('directories/master-directory-list.json'));
            const data = await response.json();
            this.directories = data.directories || [];
            
            // Update total count
            document.getElementById('totalDirectories').textContent = `${this.directories.length} directories`;
            
        } catch (error) {
            console.error('Failed to load directories:', error);
            this.showToast('Failed to load directory list', 'error');
            this.directories = [];
        }
    }
    
    setupDirectoryUI() {
        this.populateCategoryFilter();
        this.renderDirectoryList();
        this.updateSelectionStats();
    }
    
    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categories = [...new Set(this.directories.map(dir => dir.category))].sort();
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = this.formatCategoryName(category);
            categoryFilter.appendChild(option);
        });
    }
    
    formatCategoryName(category) {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    // Enhanced directory rendering with performance optimizations
    renderDirectoryList() {
        const startTime = performance.now();
        
        if (this.renderDebounceTimer) {
            clearTimeout(this.renderDebounceTimer);
        }
        
        this.renderDebounceTimer = setTimeout(() => {
            this._performDirectoryRender();
            this.performanceMetrics.renderTime = performance.now() - startTime;
        }, 16); // 60fps debouncing
    }
    
    _performDirectoryRender() {
        const listContainer = document.getElementById('directoryList');
        
        if (this.filteredDirectories.length === 0) {
            listContainer.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        // Update filtered count display
        const filteredCount = document.getElementById('filteredCount');
        if (filteredCount) {
            filteredCount.textContent = `Showing ${this.filteredDirectories.length} of ${this.directories.length} directories`;
        }
        
        // Use virtual scrolling for performance with 63+ directories
        if (this.filteredDirectories.length > 20) {
            this.renderVirtualizedList(listContainer);
        } else {
            this.renderRegularList(listContainer);
        }
        
        // Bind events after rendering
        this.bindDirectoryCheckboxes();
    }
    
    renderVirtualizedList(container) {
        const { itemHeight, containerHeight, buffer } = this.virtualScrolling;
        const totalItems = this.filteredDirectories.length;
        const visibleItems = Math.ceil(containerHeight / itemHeight);
        
        // Calculate visible range
        const scrollTop = container.scrollTop || 0;
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
        const endIndex = Math.min(totalItems, startIndex + visibleItems + (buffer * 2));
        
        // Create virtual container
        const totalHeight = totalItems * itemHeight;
        const offsetY = startIndex * itemHeight;
        
        let html = `
            <div style="height: ${totalHeight}px; position: relative;">
                <div style="transform: translateY(${offsetY}px);">
        `;
        
        // Render only visible items
        for (let i = startIndex; i < endIndex; i++) {
            const directory = this.filteredDirectories[i];
            if (directory) {
                html += this.renderDirectoryItem(directory, true); // true for virtual scrolling
            }
        }
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add scroll listener for virtual scrolling
        container.addEventListener('scroll', this.handleVirtualScroll.bind(this), { passive: true });
    }
    
    renderRegularList(container) {
        // Group directories by category for better organization
        const groupedDirectories = this.groupDirectoriesByCategory(this.filteredDirectories);
        
        let html = '';
        for (const [category, directories] of Object.entries(groupedDirectories)) {
            html += this.renderCategorySection(category, directories);
        }
        
        container.innerHTML = html;
    }
    
    handleVirtualScroll(event) {
        if (this.virtualScrollTimer) {
            clearTimeout(this.virtualScrollTimer);
        }
        
        this.virtualScrollTimer = setTimeout(() => {
            this.renderVirtualizedList(event.target);
        }, 16);
    }
    
    getEmptyStateHTML() {
        return `
            <div class="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <p class="text-lg font-medium mb-2">No directories match your criteria</p>
                <p class="text-sm text-gray-400">Try adjusting your filters or search terms</p>
                <button class="mt-4 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" onclick="document.getElementById('clearFilters')?.click()">
                    Clear All Filters
                </button>
            </div>
        `;
    }
    
    groupDirectoriesByCategory(directories) {
        const grouped = {};
        directories.forEach(directory => {
            const category = directory.category || 'other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(directory);
        });
        return grouped;
    }
    
    renderCategorySection(category, directories) {
        const categoryName = this.formatCategoryName(category);
        const selectedCount = directories.filter(dir => this.selectedDirectories.has(dir.id)).length;
        const totalEstimatedTime = directories.reduce((sum, dir) => sum + (dir.estimatedTime || 0), 0);
        
        return `
            <div class="directory-category">
                <div class="category-header" data-category="${category}">
                    <div class="category-toggle">
                        <span class="category-arrow">▼</span>
                        <span class="category-name">${categoryName}</span>
                        <span class="category-count">${directories.length} directories</span>
                    </div>
                    <div class="category-stats">
                        <span class="selected-badge">${selectedCount} selected</span>
                        <span class="time-badge">${Math.round(totalEstimatedTime / 60)}min</span>
                    </div>
                    <div class="category-actions">
                        <button class="select-category-btn" data-category="${category}">Select All</button>
                    </div>
                </div>
                <div class="category-content" data-category="${category}">
                    ${directories.map(directory => this.renderDirectoryItem(directory)).join('')}
                </div>
            </div>
        `;
    }
    
    renderDirectoryItem(directory) {
        const isSelected = this.selectedDirectories.has(directory.id);
        const difficultyColor = this.getDifficultyColor(directory.difficulty);
        const priorityColor = this.getPriorityColor(directory.priority);
        const estimatedMinutes = Math.round((directory.estimatedTime || 0) / 60);
        
        const requiresLogin = directory.requirements?.includes('login') || directory.requiresLogin;
        const hasAntiBot = directory.hasAntiBot || directory.requirements?.includes('antibot');
        
        return `
            <div class="directory-item ${isSelected ? 'selected' : ''}" data-id="${directory.id}">
                <div class="directory-checkbox">
                    <input type="checkbox" id="dir_${directory.id}" ${isSelected ? 'checked' : ''}>
                    <label for="dir_${directory.id}"></label>
                </div>
                <div class="directory-info">
                    <div class="directory-header">
                        <h4 class="directory-name">${directory.name}</h4>
                        <div class="directory-badges">
                            <span class="priority-badge ${priorityColor}">${directory.priority || 'medium'}</span>
                            <span class="difficulty-badge ${difficultyColor}">${directory.difficulty || 'medium'}</span>
                            ${estimatedMinutes > 0 ? `<span class="time-badge">${estimatedMinutes}min</span>` : ''}
                        </div>
                    </div>
                    <div class="directory-details">
                        <div class="directory-url">${directory.url}</div>
                        <div class="directory-requirements">
                            ${requiresLogin ? '<span class="req-badge login">🔐 Login</span>' : ''}
                            ${hasAntiBot ? '<span class="req-badge antibot">🤖 Anti-bot</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getDifficultyColor(difficulty) {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'difficulty-easy';
            case 'medium': return 'difficulty-medium';
            case 'hard': return 'difficulty-hard';
            default: return 'difficulty-medium';
        }
    }
    
    getPriorityColor(priority) {
        switch (priority?.toLowerCase()) {
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return 'priority-medium';
        }
    }
    
    bindDirectoryCheckboxes() {
        const checkboxes = document.querySelectorAll('.directory-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const directoryId = e.target.id.replace('dir_', '');
                this.handleDirectorySelection(directoryId, e.target.checked);
            });
        });
        
        // Category header toggles
        const categoryHeaders = document.querySelectorAll('.category-header');
        categoryHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                if (!e.target.closest('.category-actions')) {
                    this.toggleCategorySection(header.dataset.category);
                }
            });
        });
        
        // Select all category buttons
        const selectCategoryBtns = document.querySelectorAll('.select-category-btn');
        selectCategoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectAllInCategory(btn.dataset.category);
            });
        });
    }
    
    handleDirectorySelection(directoryId, selected) {
        if (selected) {
            this.selectedDirectories.add(directoryId);
        } else {
            this.selectedDirectories.delete(directoryId);
        }
        
        this.updateSelectionStats();
        this.updateDirectoryItemAppearance(directoryId, selected);
        
        // Enable/disable submission button
        this.enableButton('startDirectorySubmissionButton', 
            this.selectedDirectories.size > 0 && this.businessData !== null);
    }
    
    updateDirectoryItemAppearance(directoryId, selected) {
        const item = document.querySelector(`.directory-item[data-id="${directoryId}"]`);
        if (item) {
            item.classList.toggle('selected', selected);
        }
    }
    
    updateSelectionStats() {
        const selectedCount = this.selectedDirectories.size;
        const totalTime = this.calculateSelectedTime();
        
        document.getElementById('selectedCount').textContent = `${selectedCount} selected`;
        document.getElementById('timeEstimate').textContent = `Est: ${Math.round(totalTime / 60)} min`;
        
        // Update select all checkbox state
        const selectAllCheckbox = document.getElementById('selectAllDirectories');
        const visibleDirectories = this.filteredDirectories.length;
        const selectedVisible = this.filteredDirectories.filter(dir => 
            this.selectedDirectories.has(dir.id)).length;
        
        selectAllCheckbox.checked = selectedVisible === visibleDirectories && visibleDirectories > 0;
        selectAllCheckbox.indeterminate = selectedVisible > 0 && selectedVisible < visibleDirectories;
    }
    
    calculateSelectedTime() {
        let totalTime = 0;
        this.selectedDirectories.forEach(directoryId => {
            const directory = this.directories.find(dir => dir.id === directoryId);
            if (directory) {
                totalTime += directory.estimatedTime || 0;
            }
        });
        return totalTime;
    }
    
    // Preset Management
    applyPreset(presetName) {
        this.currentPreset = presetName;
        this.selectedDirectories.clear();
        
        // Update preset button states
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${presetName}Preset`).classList.add('active');
        
        switch (presetName) {
            case 'quickStart':
                this.applyQuickStartPreset();
                break;
            case 'fullAutomation':
                this.applyFullAutomationPreset();
                break;
            case 'highPriority':
                this.applyHighPriorityPreset();
                break;
            case 'custom':
                // Don't auto-select anything for custom
                break;
        }
        
        this.renderDirectoryList();
        this.updateSelectionStats();
        this.showToast(`Applied ${presetName} preset`, 'info');
    }
    
    applyQuickStartPreset() {
        // Select easy directories with no login required
        this.directories.forEach(directory => {
            const isEasy = directory.difficulty === 'easy';
            const requiresLogin = directory.requirements?.includes('login') || directory.requiresLogin;
            const hasAntiBot = directory.hasAntiBot || directory.requirements?.includes('antibot');
            
            if (isEasy && !requiresLogin && !hasAntiBot) {
                this.selectedDirectories.add(directory.id);
            }
        });
    }
    
    applyFullAutomationPreset() {
        // Select all directories except those requiring login/antibot
        this.directories.forEach(directory => {
            const requiresLogin = directory.requirements?.includes('login') || directory.requiresLogin;
            const hasAntiBot = directory.hasAntiBot || directory.requirements?.includes('antibot');
            
            if (!requiresLogin && !hasAntiBot) {
                this.selectedDirectories.add(directory.id);
            }
        });
    }
    
    applyHighPriorityPreset() {
        // Select only high priority directories
        this.directories.forEach(directory => {
            if (directory.priority === 'high') {
                this.selectedDirectories.add(directory.id);
            }
        });
    }
    
    // Enhanced Filter Management with performance optimizations
    applyFilters() {
        const startTime = performance.now();
        
        const filters = this.getActiveFilters();
        const searchTerm = document.getElementById('directorySearch').value.toLowerCase().trim();
        
        // Use Web Workers for heavy filtering if available
        if (this.directories.length > 50 && typeof Worker !== 'undefined') {
            this.applyFiltersWithWorker(filters, searchTerm);
        } else {
            this.applyFiltersSync(filters, searchTerm);
        }
        
        this.performanceMetrics.filterTime = performance.now() - startTime;
        this.updateFilteredCount();
    }
    
    getActiveFilters() {
        return {
            category: document.getElementById('categoryFilter').value,
            difficulty: document.getElementById('difficultyFilter').value,
            priority: document.getElementById('priorityFilter').value,
            requiresLogin: document.getElementById('requiresLoginFilter').checked,
            hasAntiBot: document.getElementById('hasAntiBotFilter').checked
        };
    }
    
    applyFiltersSync(filters, searchTerm) {
        this.filteredDirectories = this.directories.filter(directory => {
            // Category filter
            if (filters.category && directory.category !== filters.category) return false;
            
            // Difficulty filter
            if (filters.difficulty && directory.difficulty !== filters.difficulty) return false;
            
            // Priority filter
            if (filters.priority && directory.priority !== filters.priority) return false;
            
            // Login requirement filter
            const requiresLogin = directory.requirements?.includes('login') || directory.requiresLogin;
            if (filters.requiresLogin && !requiresLogin) return false;
            
            // Anti-bot filter
            const hasAntiBot = directory.hasAntiBot || directory.requirements?.includes('antibot');
            if (filters.hasAntiBot && !hasAntiBot) return false;
            
            // Enhanced search with fuzzy matching
            if (searchTerm) {
                const searchFields = [
                    directory.name.toLowerCase(),
                    directory.url.toLowerCase(),
                    directory.category?.toLowerCase() || '',
                    directory.description?.toLowerCase() || ''
                ];
                
                const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
                const matchesSearch = searchTerms.every(term => 
                    searchFields.some(field => field.includes(term))
                );
                
                if (!matchesSearch) return false;
            }
            
            return true;
        });
        
        // Sort filtered results by relevance
        if (searchTerm) {
            this.sortByRelevance(searchTerm);
        } else {
            this.sortByPriority();
        }
        
        this.renderDirectoryList();
        this.updateSelectionStats();
    }
    
    sortByRelevance(searchTerm) {
        this.filteredDirectories.sort((a, b) => {
            const aRelevance = this.calculateRelevance(a, searchTerm);
            const bRelevance = this.calculateRelevance(b, searchTerm);
            
            if (aRelevance !== bRelevance) {
                return bRelevance - aRelevance;
            }
            
            // Secondary sort by priority
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });
    }
    
    sortByPriority() {
        this.filteredDirectories.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            const aPriority = priorityOrder[a.priority] || 0;
            const bPriority = priorityOrder[b.priority] || 0;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            // Secondary sort by difficulty (easier first)
            const difficultyOrder = { 'easy': 3, 'medium': 2, 'hard': 1 };
            return (difficultyOrder[b.difficulty] || 0) - (difficultyOrder[a.difficulty] || 0);
        });
    }
    
    calculateRelevance(directory, searchTerm) {
        let relevance = 0;
        const terms = searchTerm.split(' ');
        
        terms.forEach(term => {
            // Name matches get highest relevance
            if (directory.name.toLowerCase().includes(term)) {
                relevance += directory.name.toLowerCase().indexOf(term) === 0 ? 10 : 5;
            }
            
            // URL matches get medium relevance
            if (directory.url.toLowerCase().includes(term)) {
                relevance += 3;
            }
            
            // Category matches get lower relevance
            if (directory.category?.toLowerCase().includes(term)) {
                relevance += 2;
            }
            
            // Description matches get lowest relevance
            if (directory.description?.toLowerCase().includes(term)) {
                relevance += 1;
            }
        });
        
        return relevance;
    }
    
    updateFilteredCount() {
        const filteredCount = document.getElementById('filteredCount');
        if (filteredCount) {
            const total = this.directories.length;
            const filtered = this.filteredDirectories.length;
            
            if (filtered === total) {
                filteredCount.textContent = `Showing all ${total} directories`;
                filteredCount.className = 'text-xs text-gray-500';
            } else {
                filteredCount.textContent = `Showing ${filtered} of ${total} directories`;
                filteredCount.className = 'text-xs text-blue-600 font-medium';
            }
        }
        
        // Update success probability based on filtered selection
        this.updateSuccessProbability();
    }
    
    updateSuccessProbability() {
        const successProbability = document.getElementById('successProbability');
        if (successProbability && this.filteredDirectories.length > 0) {
            const easyCount = this.filteredDirectories.filter(d => d.difficulty === 'easy').length;
            const mediumCount = this.filteredDirectories.filter(d => d.difficulty === 'medium').length;
            const hardCount = this.filteredDirectories.filter(d => d.difficulty === 'hard').length;
            const noLoginCount = this.filteredDirectories.filter(d => 
                !d.requirements?.includes('login') && !d.requiresLogin
            ).length;
            
            // Calculate weighted success rate
            const easyRate = 0.9;
            const mediumRate = 0.8;
            const hardRate = 0.7;
            const loginPenalty = 0.9; // 10% reduction for login requirements
            
            let totalRate = (easyCount * easyRate + mediumCount * mediumRate + hardCount * hardRate) / this.filteredDirectories.length;
            totalRate *= (noLoginCount / this.filteredDirectories.length) * loginPenalty + (1 - noLoginCount / this.filteredDirectories.length);
            
            const percentage = Math.round(totalRate * 100);
            successProbability.textContent = `~${percentage}% success`;
            
            // Update color based on success rate
            successProbability.className = successProbability.className.replace(/text-\w+-\d+/g, '');
            if (percentage >= 80) {
                successProbability.classList.add('text-green-600');
            } else if (percentage >= 60) {
                successProbability.classList.add('text-amber-600');
            } else {
                successProbability.classList.add('text-red-600');
            }
        }
    }
    
    // Enhanced search with debouncing
    handleSearchInput(value) {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        this.searchDebounceTimer = setTimeout(() => {
            const startTime = performance.now();
            this.applyFilters();
            this.performanceMetrics.searchTime = performance.now() - startTime;
        }, 300); // 300ms debounce
    }
    
    clearSearch() {
        const searchInput = document.getElementById('directorySearch');
        const clearButton = document.getElementById('searchClear');
        
        searchInput.value = '';
        clearButton.classList.add('opacity-0');
        clearButton.classList.remove('opacity-100');
        
        this.applyFilters();
    }
    
    clearAllFilters() {
        // Reset all filter controls
        document.getElementById('categoryFilter').value = '';
        document.getElementById('difficultyFilter').value = '';
        document.getElementById('priorityFilter').value = '';
        document.getElementById('requiresLoginFilter').checked = false;
        document.getElementById('hasAntiBotFilter').checked = false;
        
        // Clear search
        this.clearSearch();
        
        // Show toast notification
        this.showToast('All filters cleared', 'info');
    }
    
    handleSelectAll(checked) {
        this.filteredDirectories.forEach(directory => {
            if (checked) {
                this.selectedDirectories.add(directory.id);
            } else {
                this.selectedDirectories.delete(directory.id);
            }
        });
        
        this.renderDirectoryList();
        this.updateSelectionStats();
    }
    
    selectAllInCategory(category) {
        const categoryDirectories = this.filteredDirectories.filter(dir => dir.category === category);
        const allSelected = categoryDirectories.every(dir => this.selectedDirectories.has(dir.id));
        
        categoryDirectories.forEach(directory => {
            if (allSelected) {
                this.selectedDirectories.delete(directory.id);
            } else {
                this.selectedDirectories.add(directory.id);
            }
        });
        
        this.renderDirectoryList();
        this.updateSelectionStats();
    }
    
    toggleCategorySection(category) {
        const content = document.querySelector(`.category-content[data-category="${category}"]`);
        const arrow = document.querySelector(`.category-header[data-category="${category}"] .category-arrow`);
        
        if (content) {
            const isExpanded = content.style.display !== 'none';
            content.style.display = isExpanded ? 'none' : 'block';
            arrow.textContent = isExpanded ? '▶' : '▼';
        }
    }
    
    toggleExpandAll() {
        const contents = document.querySelectorAll('.category-content');
        const arrows = document.querySelectorAll('.category-arrow');
        const allExpanded = Array.from(contents).every(content => content.style.display !== 'none');
        
        contents.forEach(content => {
            content.style.display = allExpanded ? 'none' : 'block';
        });
        
        arrows.forEach(arrow => {
            arrow.textContent = allExpanded ? '▶' : '▼';
        });
        
        const button = document.getElementById('expandAllCategories');
        button.textContent = allExpanded ? 'Expand All' : 'Collapse All';
    }
    
    // Directory Submission Processing
    async handleDirectorySubmission() {
        if (this.selectedDirectories.size === 0) {
            this.showToast('Please select at least one directory', 'warning');
            return;
        }
        
        if (!this.businessData) {
            this.showToast('Please fetch business data first', 'warning');
            return;
        }
        
        const selectedDirs = Array.from(this.selectedDirectories).map(id => 
            this.directories.find(dir => dir.id === id)).filter(Boolean);
        
        const confirmResult = await this.showConfirmationModal(
            'Start Directory Submission',
            `This will submit your business information to ${selectedDirs.length} selected directories.`,
            '🚀',
            `Estimated time: ${Math.round(this.calculateSelectedTime() / 60)} minutes`
        );
        
        if (!confirmResult) return;
        
        this.startDirectoryProcessing(selectedDirs);
    }

    async startDirectoryProcessing(selectedDirectories) {
        this.isProcessing = true;
        this.processingStartTime = Date.now();
        this.totalRecords = selectedDirectories.length;
        this.processedRecords = 0;
        this.successCount = 0;
        this.errorCount = 0;
        this.skippedCount = 0;
        this.pendingCount = selectedDirectories.length;
        this.processingResults = [];
        
        // Show directory progress section
        document.getElementById('directoryProgressSection').style.display = 'block';
        this.setButtonLoading('startDirectorySubmissionButton', true);
        this.updateStepIndicator(3);
        
        this.updateStatus('Directory submission in progress...', 'Processing selected directories', 'loading');
        this.showToast('Directory submission started 🚀', 'info');
        
        // Process directories one by one
        for (let i = 0; i < selectedDirectories.length; i++) {
            if (!this.isProcessing) break; // Check if cancelled
            
            while (this.isPaused) {
                await this.delay(100); // Wait while paused
            }
            
            const directory = selectedDirectories[i];
            this.updateCurrentDirectory(directory, 'processing');
            
            try {
                const result = await this.processDirectory(directory);
                
                if (result.skipped) {
                    this.skippedCount++;
                    this.addLogEntry(`Skipped ${directory.name}: ${result.reason}`, 'warning');
                    this.processingResults.push({
                        directory: directory.name,
                        url: directory.url,
                        status: 'skipped',
                        reason: result.reason,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    this.successCount++;
                    this.addLogEntry(`Successfully submitted to ${directory.name}`, 'success');
                    this.processingResults.push({
                        directory: directory.name,
                        url: directory.url,
                        submissionUrl: result.submissionUrl,
                        status: 'success',
                        fieldsMatched: result.fieldsMatched,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                this.errorCount++;
                this.addLogEntry(`Failed to submit to ${directory.name}: ${error.message}`, 'error');
                this.processingResults.push({
                    directory: directory.name,
                    url: directory.url,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
            
            this.processedRecords = i + 1;
            this.pendingCount = selectedDirectories.length - this.processedRecords;
            this.updateProgress();
            
            // Simulate processing time based on directory complexity
            const baseDelay = 2000;
            const complexityMultiplier = directory.difficulty === 'hard' ? 2 : 
                                       directory.difficulty === 'medium' ? 1.5 : 1;
            await this.delay(baseDelay * complexityMultiplier);
        }
        
        this.completeDirectoryProcessing();
    }

    async processDirectory(directory) {
        // Check if directory requires login or has anti-bot protection
        const requiresLogin = directory.requirements?.includes('login') || directory.requiresLogin;
        const hasAntiBot = directory.hasAntiBot || directory.requirements?.includes('antibot');
        
        if (requiresLogin) {
            return {
                skipped: true,
                reason: 'Login required'
            };
        }
        
        if (hasAntiBot) {
            return {
                skipped: true,
                reason: 'Anti-bot protection detected'
            };
        }
        
        // Simulate form submission with realistic success rates based on difficulty
        const successRate = directory.difficulty === 'easy' ? 0.9 : 
                           directory.difficulty === 'medium' ? 0.8 : 0.7;
        
        if (Math.random() < successRate) {
            return {
                skipped: false,
                submissionUrl: directory.submissionUrl || directory.url,
                fieldsMatched: this.getFieldsMatched(directory)
            };
        } else {
            throw new Error('Form submission failed - unable to locate required fields');
        }
    }
    
    getFieldsMatched(directory) {
        // Return mock field matching data
        const possibleFields = Object.keys(directory.fieldMapping || {});
        const businessFields = ['businessName', 'email', 'phone', 'website', 'address'];
        return businessFields.filter(field => possibleFields.includes(field));
    }

    // Enhanced progress tracking with visual charts
    updateProgress() {
        const percentage = Math.round((this.processedRecords / this.totalRecords) * 100);
        
        // Update main progress bar
        this.updateProgressBar(percentage);
        
        // Update metrics with animations
        this.updateMetricCards();
        
        // Update circular progress chart
        this.updateCircularProgress(percentage);
        
        // Update ETA and speed metrics
        this.updateProcessingMetrics();
        
        // Update mini charts
        this.updateMiniCharts();
    }
    
    updateProgressBar(percentage) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
            
            // Add color transitions based on progress
            progressFill.className = progressFill.className.replace(/bg-\w+-\d+/g, '');
            if (percentage < 25) {
                progressFill.classList.add('bg-gradient-to-r', 'from-blue-400', 'to-blue-600');
            } else if (percentage < 50) {
                progressFill.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-600');
            } else if (percentage < 75) {
                progressFill.classList.add('bg-gradient-to-r', 'from-purple-500', 'to-pink-600');
            } else {
                progressFill.classList.add('bg-gradient-to-r', 'from-green-400', 'to-green-600');
            }
        }
        
        if (progressText) {
            progressText.textContent = `${this.processedRecords} / ${this.totalRecords} directories processed`;
        }
        
        if (progressPercentage) {
            progressPercentage.textContent = `${percentage}%`;
        }
    }
    
    updateMetricCards() {
        const metrics = [
            { id: 'successCount', value: this.successCount, color: 'green', animate: true },
            { id: 'errorCount', value: this.errorCount, color: 'red', animate: true },
            { id: 'skippedCount', value: this.skippedCount, color: 'amber', animate: true },
            { id: 'pendingCount', value: this.pendingCount, color: 'gray', animate: false }
        ];
        
        metrics.forEach(metric => {
            const element = document.getElementById(metric.id);
            if (element && element.textContent !== metric.value.toString()) {
                if (metric.animate) {
                    this.animateCounter(element, metric.value);
                } else {
                    element.textContent = metric.value;
                }
                
                // Add pulse animation for changes
                const card = element.closest('.metric-card');
                if (card) {
                    card.classList.add('animate-pulse');
                    setTimeout(() => card.classList.remove('animate-pulse'), 600);
                }
            }
        });
    }
    
    animateCounter(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 300;
        const steps = Math.abs(targetValue - currentValue);
        const stepDuration = steps > 0 ? duration / steps : 0;
        
        let current = currentValue;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === targetValue) {
                clearInterval(timer);
            }
        }, stepDuration);
    }
    
    updateCircularProgress(percentage) {
        // Create or update circular progress chart
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) {
            const progressSection = document.getElementById('directoryProgressSection');
            if (progressSection) {
                this.createCircularProgressChart(progressSection, percentage);
            }
        } else {
            this.updateCircularProgressChart(percentage);
        }
    }
    
    createCircularProgressChart(container, percentage) {
        const chartHTML = `
            <div class="chart-container bg-white rounded-lg p-4 mb-4 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-700">Overall Progress</h4>
                    <span class="text-xs text-gray-500">Real-time</span>
                </div>
                <div class="flex items-center justify-center">
                    <svg class="transform -rotate-90 w-24 h-24">
                        <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="8" fill="transparent"></circle>
                        <circle id="progressCircle" cx="48" cy="48" r="40" stroke="#3b82f6" stroke-width="8" fill="transparent" 
                                stroke-dasharray="251.33" stroke-dashoffset="251.33" class="transition-all duration-500 ease-out"></circle>
                    </svg>
                    <div class="absolute text-center">
                        <div class="text-lg font-bold text-gray-900" id="circularPercentage">0%</div>
                        <div class="text-xs text-gray-500">Complete</div>
                    </div>
                </div>
            </div>
        `;
        
        const progressOverview = container.querySelector('.progress-overview');
        if (progressOverview) {
            progressOverview.insertAdjacentHTML('beforeend', chartHTML);
        }
    }
    
    updateCircularProgressChart(percentage) {
        const circle = document.getElementById('progressCircle');
        const percentageEl = document.getElementById('circularPercentage');
        
        if (circle && percentageEl) {
            const circumference = 251.33; // 2 * π * 40
            const offset = circumference - (percentage / 100) * circumference;
            
            circle.style.strokeDashoffset = offset;
            percentageEl.textContent = `${percentage}%`;
            
            // Update color based on progress
            if (percentage < 30) {
                circle.setAttribute('stroke', '#ef4444'); // red
            } else if (percentage < 70) {
                circle.setAttribute('stroke', '#f59e0b'); // amber
            } else {
                circle.setAttribute('stroke', '#10b981'); // green
            }
        }
    }
    
    updateProcessingMetrics() {
        if (this.processedRecords > 0) {
            const elapsed = Date.now() - this.processingStartTime;
            const avgTimePerRecord = elapsed / this.processedRecords;
            const remainingRecords = this.totalRecords - this.processedRecords;
            const etaMs = remainingRecords * avgTimePerRecord;
            
            const etaTime = document.getElementById('etaTime');
            const processingSpeed = document.getElementById('processingSpeed');
            
            if (etaTime) {
                etaTime.textContent = this.formatETA(etaMs);
                etaTime.className = 'font-semibold ' + (etaMs < 300000 ? 'text-green-600' : etaMs < 600000 ? 'text-amber-600' : 'text-red-600');
            }
            
            if (processingSpeed) {
                const speed = Math.round((this.processedRecords / (elapsed / 60000)) * 10) / 10;
                processingSpeed.textContent = `${speed} records/min`;
                processingSpeed.className = 'text-sm ' + (speed > 2 ? 'text-green-600' : speed > 1 ? 'text-amber-600' : 'text-red-600');
            }
        }
    }
    
    updateMiniCharts() {
        // Create mini success rate chart
        const total = this.successCount + this.errorCount + this.skippedCount;
        if (total > 0) {
            const successRate = (this.successCount / total) * 100;
            this.updateMiniChart('success-rate-chart', successRate, 'Success Rate');
        }
    }
    
    updateMiniChart(containerId, percentage, label) {
        let container = document.getElementById(containerId);
        if (!container) {
            const metricsContainer = document.querySelector('.directory-metrics');
            if (metricsContainer) {
                const chartHTML = `
                    <div id="${containerId}" class="bg-white rounded-lg p-3 shadow-sm">
                        <div class="text-xs font-medium text-gray-600 mb-2">${label}</div>
                        <div class="flex items-center space-x-2">
                            <div class="flex-1 bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-500 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                            </div>
                            <span class="text-sm font-semibold text-gray-700">0%</span>
                        </div>
                    </div>
                `;
                metricsContainer.insertAdjacentHTML('beforeend', chartHTML);
                container = document.getElementById(containerId);
            }
        }
        
        if (container) {
            const progressBar = container.querySelector('div > div > div');
            const percentageSpan = container.querySelector('span');
            
            if (progressBar && percentageSpan) {
                progressBar.style.width = `${percentage}%`;
                percentageSpan.textContent = `${Math.round(percentage)}%`;
                
                // Update color based on success rate
                progressBar.className = progressBar.className.replace(/bg-\w+-\d+/g, '');
                if (percentage >= 80) {
                    progressBar.classList.add('bg-green-500');
                } else if (percentage >= 60) {
                    progressBar.classList.add('bg-amber-500');
                } else {
                    progressBar.classList.add('bg-red-500');
                }
            }
        }
    }

    updateCurrentDirectory(directory, stage) {
        const currentDirectoryName = document.getElementById('currentDirectoryName');
        const currentDirectoryUrl = document.getElementById('currentDirectoryUrl');
        const currentDirectoryStage = document.getElementById('currentDirectoryStage');
        
        if (directory) {
            currentDirectoryName.textContent = directory.name;
            currentDirectoryUrl.textContent = directory.url;
            
            switch (stage) {
                case 'processing':
                    currentDirectoryStage.textContent = 'Analyzing form structure...';
                    break;
                case 'filling':
                    currentDirectoryStage.textContent = 'Filling form fields...';
                    break;
                case 'submitting':
                    currentDirectoryStage.textContent = 'Submitting form...';
                    break;
                default:
                    currentDirectoryStage.textContent = stage;
            }
        } else {
            currentDirectoryName.textContent = 'Waiting to start...';
            currentDirectoryUrl.textContent = '';
            currentDirectoryStage.textContent = '';
        }
    }

    completeDirectoryProcessing() {
        this.isProcessing = false;
        this.setButtonLoading('startDirectorySubmissionButton', false);
        
        const totalProcessed = this.successCount + this.errorCount + this.skippedCount;
        const successRate = Math.round((this.successCount / totalProcessed) * 100);
        
        if (this.successCount === totalProcessed) {
            this.updateStatus('Directory submission completed successfully', 'All directories processed', 'ready');
            this.showToast(`🎉 All ${this.successCount} directory submissions completed successfully!`, 'success');
        } else if (successRate >= 70) {
            this.updateStatus('Directory submission completed with warnings', 
                `${this.successCount} successful, ${this.skippedCount} skipped, ${this.errorCount} failed`, 'ready');
            this.showToast(`Directory submission completed. ${this.successCount} successful, ${this.skippedCount} skipped due to requirements.`, 'warning');
        } else {
            this.updateStatus('Directory submission completed with errors', `Multiple failures occurred`, 'error');
            this.showToast(`Directory submission completed with significant errors. Please review the results.`, 'error');
        }
        
        this.updateCurrentDirectory(null, 'Processing complete');
        this.addLogEntry(`Directory submission completed. Success: ${this.successCount}, Skipped: ${this.skippedCount}, Errors: ${this.errorCount}`, 'info');
        
        this.displayResults();
    }

    handleCancelDirectoryProcessing() {
        if (!this.isProcessing) return;
        
        this.showConfirmationModal(
            'Cancel Directory Processing',
            'Are you sure you want to cancel the current directory submission?',
            '⚠️',
            'This will stop processing and cannot be undone.'
        ).then(confirmed => {
            if (confirmed) {
                this.isProcessing = false;
                this.setButtonLoading('startDirectorySubmissionButton', false);
                this.updateStatus('Directory submission cancelled', 'Processing stopped by user', 'ready');
                this.updateCurrentDirectory(null, 'Cancelled by user');
                this.addLogEntry('Directory submission cancelled by user', 'warning');
                this.showToast('Directory submission cancelled', 'warning');
                this.displayResults(); // Show partial results
            }
        });
    }

    handlePauseResume() {
        if (!this.isProcessing) return;
        
        const button = document.getElementById('pauseResumeButton');
        
        if (this.isPaused) {
            this.isPaused = false;
            button.innerHTML = '⏸️ Pause';
            this.updateStatus('Directory submission in progress...', 'Resuming processing', 'loading');
            this.addLogEntry('Directory submission resumed', 'info');
            this.showToast('Processing resumed', 'info');
        } else {
            this.isPaused = true;
            button.innerHTML = '▶️ Resume';
            this.updateStatus('Directory submission paused', 'Processing temporarily stopped', 'ready');
            this.addLogEntry('Directory submission paused', 'warning');
            this.showToast('Processing paused', 'warning');
        }
    }

    // Data Management
    async handleClearData() {
        const confirmResult = await this.showConfirmationModal(
            'Clear All Data',
            'This will clear all loaded business data and reset the extension.',
            '🗑️',
            'This action cannot be undone.'
        );
        
        if (!confirmResult) return;
        
        this.clearAllData();
    }

    clearAllData() {
        const display = document.getElementById('businessInfoDisplay');
        display.innerHTML = `
            <div class="no-data">
                <div class="empty-state-icon">📋</div>
                <p>No business data loaded</p>
                <p class="help-text">Click "Fetch Business Info" to load data from Airtable</p>
            </div>
        `;
        
        const recordCount = document.getElementById('recordCount');
        recordCount.style.display = 'none';
        
        this.enableButton('fillFormsButton', false);
        this.enableButton('startDirectorySubmissionButton', false);
        this.businessData = null;
        
        document.getElementById('directoryProgressSection').style.display = 'none';
        
        this.updateStepIndicator(1);
        this.updateStatus('Data cleared', 'Ready to start fresh', 'ready');
        this.showToast('All data cleared successfully', 'info');
    }

    // Settings Management
    async handleSaveSettings() {
        this.setButtonLoading('saveSettings', true);
        
        const apiKey = document.getElementById('airtableKey').value;
        const baseId = document.getElementById('baseId').value;
        const tableId = document.getElementById('tableId').value;
        
        if (!apiKey || !baseId || !tableId) {
            this.showToast('Please fill in all required fields', 'warning');
            this.setButtonLoading('saveSettings', false);
            return;
        }
        
        try {
            // Simulate saving settings
            await this.delay(1000);
            
            // Save to chrome storage (in real implementation)
            const settings = { apiKey, baseId, tableId };
            localStorage.setItem('autoBoltSettings', JSON.stringify(settings));
            
            this.showToast('Settings saved successfully! 🔐', 'success');
        } catch (error) {
            this.showToast('Failed to save settings. Please try again.', 'error');
        } finally {
            this.setButtonLoading('saveSettings', false);
        }
    }

    loadSavedSettings() {
        try {
            const saved = localStorage.getItem('autoBoltSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                document.getElementById('airtableKey').value = settings.apiKey || '';
                document.getElementById('baseId').value = settings.baseId || '';
                document.getElementById('tableId').value = settings.tableId || '';
            }
        } catch (error) {
            console.log('No saved settings found');
        }
    }

    // Log Management
    addLogEntry(message, type = 'info') {
        const logContent = document.getElementById('logContent');
        const placeholder = logContent.querySelector('.log-placeholder');
        
        if (placeholder) {
            placeholder.remove();
        }
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-message">${message}</span>
        `;
        
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    clearLog() {
        const logContent = document.getElementById('logContent');
        logContent.innerHTML = '<div class="log-placeholder">Processing logs will appear here...</div>';
        this.showToast('Log cleared', 'info');
    }

    exportLog() {
        const entries = document.querySelectorAll('.log-entry');
        if (entries.length === 0) {
            this.showToast('No log entries to export', 'warning');
            return;
        }
        
        const logData = Array.from(entries).map(entry => {
            const time = entry.querySelector('.log-time').textContent;
            const message = entry.querySelector('.log-message').textContent;
            return `${time} - ${message}`;
        }).join('\n');
        
        const blob = new Blob([logData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `auto-bolt-log-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Log exported successfully! 📄', 'success');
    }
    
    // Results Management
    displayResults() {
        const resultsContent = document.getElementById('resultsContent');
        
        if (this.processingResults.length === 0) {
            resultsContent.innerHTML = '<div class="results-placeholder">No results to display</div>';
            return;
        }
        
        const successResults = this.processingResults.filter(r => r.status === 'success');
        const failedResults = this.processingResults.filter(r => r.status === 'failed');
        const skippedResults = this.processingResults.filter(r => r.status === 'skipped');
        
        let html = '<div class="results-summary">';
        
        if (successResults.length > 0) {
            html += `
                <div class="result-group success">
                    <h4>🟢 Successfully Submitted (${successResults.length})</h4>
                    <div class="result-items">
                        ${successResults.map(result => `
                            <div class="result-item success">
                                <div class="result-header">
                                    <strong>${result.directory}</strong>
                                    <span class="result-time">${new Date(result.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div class="result-details">
                                    <div>URL: ${result.url}</div>
                                    <div>Fields matched: ${result.fieldsMatched ? result.fieldsMatched.join(', ') : 'N/A'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (skippedResults.length > 0) {
            html += `
                <div class="result-group skipped">
                    <h4>🟡 Skipped (${skippedResults.length})</h4>
                    <div class="result-items">
                        ${skippedResults.map(result => `
                            <div class="result-item skipped">
                                <div class="result-header">
                                    <strong>${result.directory}</strong>
                                    <span class="result-time">${new Date(result.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div class="result-details">
                                    <div>URL: ${result.url}</div>
                                    <div class="skip-reason">Reason: ${result.reason}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (failedResults.length > 0) {
            html += `
                <div class="result-group failed">
                    <h4>🔴 Failed (${failedResults.length})</h4>
                    <div class="result-items">
                        ${failedResults.map(result => `
                            <div class="result-item failed">
                                <div class="result-header">
                                    <strong>${result.directory}</strong>
                                    <span class="result-time">${new Date(result.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div class="result-details">
                                    <div>URL: ${result.url}</div>
                                    <div class="error-reason">Error: ${result.error}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        resultsContent.innerHTML = html;
    }
    
    exportResults() {
        if (this.processingResults.length === 0) {
            this.showToast('No results to export', 'warning');
            return;
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        
        // Create detailed report
        let reportData = `Directory Submission Results - ${new Date().toLocaleString()}\n`;
        reportData += `=================================\n\n`;
        reportData += `Summary:\n`;
        reportData += `- Total Processed: ${this.processingResults.length}\n`;
        reportData += `- Successful: ${this.successCount}\n`;
        reportData += `- Failed: ${this.errorCount}\n`;
        reportData += `- Skipped: ${this.skippedCount}\n\n`;
        
        reportData += `Detailed Results:\n`;
        reportData += `================\n\n`;
        
        this.processingResults.forEach((result, index) => {
            reportData += `${index + 1}. ${result.directory}\n`;
            reportData += `   Status: ${result.status.toUpperCase()}\n`;
            reportData += `   URL: ${result.url}\n`;
            reportData += `   Time: ${new Date(result.timestamp).toLocaleString()}\n`;
            
            if (result.status === 'success') {
                reportData += `   Submission URL: ${result.submissionUrl}\n`;
                reportData += `   Fields Matched: ${result.fieldsMatched ? result.fieldsMatched.join(', ') : 'N/A'}\n`;
            } else if (result.status === 'skipped') {
                reportData += `   Reason: ${result.reason}\n`;
            } else if (result.status === 'failed') {
                reportData += `   Error: ${result.error}\n`;
            }
            
            reportData += `\n`;
        });
        
        const blob = new Blob([reportData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `directory-submission-results-${timestamp}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Results exported successfully! 📄', 'success');
    }
    
    downloadCSV() {
        if (this.processingResults.length === 0) {
            this.showToast('No results to download', 'warning');
            return;
        }
        
        // Create CSV data
        const csvHeaders = ['Directory Name', 'URL', 'Status', 'Timestamp', 'Submission URL', 'Fields Matched', 'Error/Reason'];
        const csvRows = [csvHeaders.join(',')];
        
        this.processingResults.forEach(result => {
            const row = [
                `"${result.directory}"`,
                `"${result.url}"`,
                result.status,
                new Date(result.timestamp).toISOString(),
                `"${result.submissionUrl || ''}"`,
                `"${result.fieldsMatched ? result.fieldsMatched.join('; ') : ''}"`,
                `"${result.error || result.reason || ''}"`
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const a = document.createElement('a');
        a.href = url;
        a.download = `directory-results-${timestamp}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('CSV downloaded successfully! 📊', 'success');
    }
    
    toggleResultsDetails() {
        const resultItems = document.querySelectorAll('.result-details');
        const button = document.getElementById('showDetailsButton');
        const isHidden = resultItems[0]?.style.display === 'none';
        
        resultItems.forEach(item => {
            item.style.display = isHidden ? 'block' : 'none';
        });
        
        button.textContent = isHidden ? 'Hide Details' : 'Show Details';
    }
    
    showResultsFilter() {
        // Simple filter implementation - could be enhanced
        const filterOptions = ['all', 'success', 'failed', 'skipped'];
        const currentFilter = prompt('Filter results by status (all/success/failed/skipped):', 'all');
        
        if (currentFilter && filterOptions.includes(currentFilter)) {
            const resultGroups = document.querySelectorAll('.result-group');
            
            resultGroups.forEach(group => {
                if (currentFilter === 'all') {
                    group.style.display = 'block';
                } else {
                    const groupClass = group.classList.contains(currentFilter);
                    group.style.display = groupClass ? 'block' : 'none';
                }
            });
            
            this.showToast(`Filtered results by: ${currentFilter}`, 'info');
        }
    }

    // Enhanced Toast System with accessibility
    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            this.createToastContainer();
        }
        
        const toast = document.createElement('div');
        const toastId = `toast-${Date.now()}`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');
        
        // Enhanced styling with Tailwind
        const baseClasses = 'flex items-center justify-between p-4 mb-3 rounded-lg shadow-lg transform transition-all duration-300 animate-fade-in';
        const typeClasses = {
            'success': 'bg-green-100 border border-green-400 text-green-700',
            'error': 'bg-red-100 border border-red-400 text-red-700',
            'warning': 'bg-amber-100 border border-amber-400 text-amber-700',
            'info': 'bg-blue-100 border border-blue-400 text-blue-700'
        };
        
        toast.className = `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
        
        const icons = {
            'success': '✓',
            'error': '⚠',
            'warning': '⚠',
            'info': 'i'
        };
        
        toast.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${
                    type === 'success' ? 'bg-green-500 text-white' :
                    type === 'error' ? 'bg-red-500 text-white' :
                    type === 'warning' ? 'bg-amber-500 text-white' :
                    'bg-blue-500 text-white'
                }">
                    ${icons[type] || icons.info}
                </div>
                <span class="flex-1 font-medium">${message}</span>
            </div>
            <button class="ml-4 flex-shrink-0 w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" 
                    aria-label="Close notification"
                    onclick="window.autoBoltUI.closeToast(document.getElementById('${toastId}'))">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.closeToast(toast);
            }, duration);
        }
        
        // Announce to screen readers
        this.announceToScreenReader(message, type);
    }
    
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-4 left-4 right-4 z-50 space-y-2';
        container.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(container);
    }
    
    announceToScreenReader(message, type) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${message}`;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    closeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }
    
    // Accessibility enhancements
    initializeAccessibility() {
        // Add ARIA labels and roles
        this.addAriaLabels();
        
        // Keyboard navigation support
        this.setupKeyboardNavigation();
        
        // High contrast mode detection
        this.setupHighContrastMode();
        
        // Reduced motion detection
        this.setupReducedMotionMode();
    }
    
    addAriaLabels() {
        const elements = [
            { id: 'fetchButton', label: 'Fetch business information from Airtable' },
            { id: 'fillFormsButton', label: 'Fill current form with business data' },
            { id: 'startDirectorySubmissionButton', label: 'Start automated directory submission process' },
            { id: 'clearDataButton', label: 'Clear all business data' },
            { id: 'directorySearch', label: 'Search directories by name, URL, or category' },
            { id: 'selectAllDirectories', label: 'Select or deselect all visible directories' }
        ];
        
        elements.forEach(({ id, label }) => {
            const element = document.getElementById(id);
            if (element && !element.getAttribute('aria-label')) {
                element.setAttribute('aria-label', label);
            }
        });
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC to close modal
            if (e.key === 'Escape') {
                this.hideModal();
            }
            
            // Space or Enter to trigger preset buttons
            if ((e.key === ' ' || e.key === 'Enter') && e.target.classList.contains('preset-btn')) {
                e.preventDefault();
                e.target.click();
            }
            
            // Ctrl+F to focus search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('directorySearch')?.focus();
            }
        });
    }
    
    setupHighContrastMode() {
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.documentElement.classList.add('high-contrast');
            
            // Adjust colors for better contrast
            const style = document.createElement('style');
            style.textContent = `
                .high-contrast .bg-gradient-to-r { background: solid !important; }
                .high-contrast .text-gray-500 { color: #000 !important; }
                .high-contrast .border-gray-300 { border-color: #000 !important; }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupReducedMotionMode() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduced-motion');
            
            // Disable animations
            const style = document.createElement('style');
            style.textContent = `
                .reduced-motion * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Error handling and validation
    validateBusinessData(data) {
        const errors = [];
        
        if (!data || !Array.isArray(data)) {
            errors.push('Invalid data format received');
            return { isValid: false, errors };
        }
        
        data.forEach((record, index) => {
            if (!record.company || record.company.trim() === '') {
                errors.push(`Record ${index + 1}: Missing company name`);
            }
            
            if (!record.email || !this.isValidEmail(record.email)) {
                errors.push(`Record ${index + 1}: Invalid or missing email address`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings: this.getDataWarnings(data)
        };
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    getDataWarnings(data) {
        const warnings = [];
        
        data.forEach((record, index) => {
            if (!record.phone) {
                warnings.push(`Record ${index + 1}: Missing phone number`);
            }
            
            if (!record.website) {
                warnings.push(`Record ${index + 1}: Missing website URL`);
            }
        });
        
        return warnings;
    }
    
    // Error state management
    showErrorState(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('border-red-500', 'bg-red-50');
            element.setAttribute('aria-invalid', 'true');
            
            // Add error message
            let errorMsg = element.parentElement.querySelector('.error-message');
            if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'error-message text-sm text-red-600 mt-1';
                errorMsg.setAttribute('role', 'alert');
                element.parentElement.appendChild(errorMsg);
            }
            errorMsg.textContent = message;
        }
    }
    
    clearErrorState(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('border-red-500', 'bg-red-50');
            element.removeAttribute('aria-invalid');
            
            const errorMsg = element.parentElement.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    }

    // Modal System
    showConfirmationModal(title, message, icon = '⚠️', details = '') {
        return new Promise((resolve) => {
            const overlay = document.getElementById('modalOverlay');
            const modal = document.getElementById('confirmationModal');
            
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').textContent = message;
            document.getElementById('modalIcon').textContent = icon;
            
            const detailsEl = document.getElementById('modalDetails');
            if (details) {
                detailsEl.textContent = details;
                detailsEl.style.display = 'block';
            } else {
                detailsEl.style.display = 'none';
            }
            
            overlay.style.display = 'flex';
            
            const handleConfirm = () => {
                this.hideModal();
                resolve(true);
            };
            
            const handleCancel = () => {
                this.hideModal();
                resolve(false);
            };
            
            // Remove existing listeners
            document.getElementById('modalConfirm').replaceWith(document.getElementById('modalConfirm').cloneNode(true));
            document.getElementById('modalCancel').replaceWith(document.getElementById('modalCancel').cloneNode(true));
            
            // Add new listeners
            document.getElementById('modalConfirm').addEventListener('click', handleConfirm);
            document.getElementById('modalCancel').addEventListener('click', handleCancel);
            
            // ESC key to cancel
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeyDown);
                    handleCancel();
                }
            };
            document.addEventListener('keydown', handleKeyDown);
        });
    }

    hideModal() {
        document.getElementById('modalOverlay').style.display = 'none';
    }

    // Loading System
    async showLoadingWithSteps(steps) {
        const overlay = document.getElementById('loadingOverlay');
        const stepElements = document.querySelectorAll('.loading-step');
        
        overlay.style.display = 'flex';
        
        for (let i = 0; i < steps.length; i++) {
            // Update step text
            if (stepElements[i]) {
                stepElements[i].textContent = steps[i];
                stepElements[i].classList.add('active');
            }
            
            // Wait for step completion
            await this.delay(1000);
            
            // Remove active state
            if (stepElements[i]) {
                stepElements[i].classList.remove('active');
            }
        }
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
        // Reset loading steps
        const stepElements = document.querySelectorAll('.loading-step');
        stepElements.forEach(step => step.classList.remove('active'));
    }

    // Utility Functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatETA(ms) {
        if (ms < 60000) {
            return `${Math.round(ms / 1000)}s`;
        } else if (ms < 3600000) {
            return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
        } else {
            return `${Math.round(ms / 3600000)}h ${Math.round((ms % 3600000) / 60000)}m`;
        }
    }
}

// Initialize the enhanced UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.autoBoltUI = new AutoBoltUI();
});

// Add CSS for additional styles that need to be applied dynamically
const additionalStyles = `
.business-record {
    margin-bottom: 16px;
    padding: 12px;
    background: var(--background);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: var(--transition);
}

.business-record:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow);
}

.record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
}

.record-badge {
    background: var(--primary-light);
    color: var(--primary-color);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
}

.record-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

@keyframes toastSlideOut {
    from {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    to {
        transform: translateY(-100%) scale(0.95);
        opacity: 0;
    }
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);