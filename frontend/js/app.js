// API base URL - production için backend URL'yi buraya girin
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5050/api' 
  : 'https://cloudbasedx-backend.onrender.com/api'; // Render backend URL'si

// App State
let currentUser = null;
let currentToken = localStorage.getItem('token');
let currentPage = 1;
let currentSearch = '';
let currentType = '';
let currentSort = 'createdAt-desc';

// DOM Elements
const elements = {
    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    sections: document.querySelectorAll('.section'),
    
    // Auth
    userInfo: document.getElementById('userInfo'),
    authButtons: document.getElementById('authButtons'),
    username: document.getElementById('username'),
    logoutBtn: document.getElementById('logoutBtn'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    
    // Modals
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    uploadModal: document.getElementById('uploadModal'),
    fileDetailsModal: document.getElementById('fileDetailsModal'),
    
    // Forms
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    uploadForm: document.getElementById('uploadForm'),
    profileForm: document.getElementById('profileForm'),
    passwordForm: document.getElementById('passwordForm'),
    
    // File Management
    filesGrid: document.getElementById('filesGrid'),
    searchInput: document.getElementById('searchInput'),
    typeFilter: document.getElementById('typeFilter'),
    sortFilter: document.getElementById('sortFilter'),
    storageUsed: document.getElementById('storageUsed'),
    storageText: document.getElementById('storageText'),
    pagination: document.getElementById('pagination'),
    
    // Upload
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    
    if (currentToken) {
        loadUserProfile();
    }
});

// Initialize App
function initializeApp() {
    // Check if user is logged in
    if (currentToken) {
        showAuthenticatedUI();
    } else {
        showUnauthenticatedUI();
    }
    
    // Load initial data
    loadFiles();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Auth buttons
    elements.loginBtn.addEventListener('click', () => showModal(elements.loginModal));
    elements.registerBtn.addEventListener('click', () => showModal(elements.registerModal));
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal);
        });
    });
    
    // Modal background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal);
            }
        });
    });
    
    // Auth form switches
    document.getElementById('switchToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(elements.loginModal);
        showModal(elements.registerModal);
    });
    
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(elements.registerModal);
        showModal(elements.loginModal);
    });
    
    // Forms
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.uploadForm.addEventListener('submit', handleFileUpload);
    elements.profileForm.addEventListener('submit', handleProfileUpdate);
    elements.passwordForm.addEventListener('submit', handlePasswordChange);
    
    // File controls
    elements.searchInput.addEventListener('input', debounce(handleSearch, 500));
    elements.typeFilter.addEventListener('change', handleTypeFilter);
    elements.sortFilter.addEventListener('change', handleSortFilter);
    
    // Upload area
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Hero buttons
    document.getElementById('getStartedBtn').addEventListener('click', () => {
        if (!currentUser) {
            showModal(elements.registerModal);
        } else {
            navigateToSection('files');
        }
    });
    
    document.getElementById('uploadBtn').addEventListener('click', () => {
        if (currentUser) {
            showModal(elements.uploadModal);
        } else {
            showToast('Lütfen önce giriş yapın', 'error');
        }
    });
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href').substring(1);
    navigateToSection(targetId);
}

function navigateToSection(sectionId) {
    // Update active nav link
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    // Show target section
    elements.sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });
    
    // Load section specific data
    if (sectionId === 'files') {
        loadFiles();
    } else if (sectionId === 'shared') {
        loadSharedFiles();
    } else if (sectionId === 'profile') {
        loadUserProfile();
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentToken = result.token;
            currentUser = result.user;
            localStorage.setItem('token', currentToken);
            
            showAuthenticatedUI();
            hideModal(elements.loginModal);
            showToast('Giriş başarılı!', 'success');
            
            // Reset form
            e.target.reset();
        } else {
            showToast(result.message || 'Giriş başarısız', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Bir hata oluştu', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentToken = result.token;
            currentUser = result.user;
            localStorage.setItem('token', currentToken);
            
            showAuthenticatedUI();
            hideModal(elements.registerModal);
            showToast('Kayıt başarılı!', 'success');
            
            // Reset form
            e.target.reset();
        } else {
            showToast(result.message || 'Kayıt başarısız', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('Bir hata oluştu', 'error');
    } finally {
        hideLoading();
    }
}

function handleLogout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    
    showUnauthenticatedUI();
    showToast('Çıkış yapıldı', 'info');
}

function showAuthenticatedUI() {
    elements.userInfo.style.display = 'flex';
    elements.authButtons.style.display = 'none';
    elements.username.textContent = currentUser ? currentUser.username : '';
}

function showUnauthenticatedUI() {
    elements.userInfo.style.display = 'none';
    elements.authButtons.style.display = 'flex';
}

// File Management
async function loadFiles() {
    if (!currentUser) return;
    
    showLoading();
    
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 12,
            sort: currentSort.split('-')[0],
            order: currentSort.split('-')[1],
            search: currentSearch,
            type: currentType
        });
        
        const response = await fetch(`${API_BASE_URL}/files?${params}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            renderFiles(result.files);
            renderPagination(result.pagination);
            updateStorageInfo();
        } else {
            showToast(result.message || 'Dosyalar yüklenemedi', 'error');
        }
    } catch (error) {
        console.error('Load files error:', error);
        showToast('Bir hata oluştu', 'error');
    } finally {
        hideLoading();
    }
}

function renderFiles(files) {
    if (files.length === 0) {
        elements.filesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Henüz dosya yok</h3>
                <p>İlk dosyanızı yüklemek için "Dosya Yükle" butonuna tıklayın.</p>
            </div>
        `;
        return;
    }
    
    elements.filesGrid.innerHTML = files.map(file => `
        <div class="file-card" data-file-id="${file._id}">
            <div class="file-icon ${file.fileType}">
                <i class="fas ${getFileIcon(file.mimetype)}"></i>
            </div>
            <div class="file-name">${file.originalName}</div>
            <div class="file-info">
                <div>${file.sizeFormatted}</div>
                <div>${new Date(file.createdAt).toLocaleDateString('tr-TR')}</div>
                ${file.description ? `<div>${file.description}</div>` : ''}
            </div>
            <div class="file-actions">
                <button class="btn btn-primary" onclick="downloadFile('${file._id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-secondary" onclick="showFileDetails('${file._id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
                ${file.owner._id === currentUser._id ? `
                    <button class="btn btn-secondary" onclick="deleteFile('${file._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getFileIcon(mimetype) {
    if (mimetype.startsWith('image/')) return 'fa-image';
    if (mimetype.startsWith('video/')) return 'fa-video';
    if (mimetype.startsWith('audio/')) return 'fa-music';
    if (mimetype.includes('pdf')) return 'fa-file-pdf';
    if (mimetype.includes('document') || mimetype.includes('word')) return 'fa-file-word';
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'fa-file-excel';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'fa-file-powerpoint';
    if (mimetype.includes('archive') || mimetype.includes('zip') || mimetype.includes('rar')) return 'fa-file-archive';
    return 'fa-file';
}

function renderPagination(pagination) {
    if (pagination.totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (pagination.hasPrev) {
        paginationHTML += `<button class="btn" onclick="changePage(${pagination.currentPage - 1})">Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === pagination.currentPage) {
            paginationHTML += `<button class="btn active">${i}</button>`;
        } else if (i === 1 || i === pagination.totalPages || (i >= pagination.currentPage - 2 && i <= pagination.currentPage + 2)) {
            paginationHTML += `<button class="btn" onclick="changePage(${i})">${i}</button>`;
        } else if (i === pagination.currentPage - 3 || i === pagination.currentPage + 3) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    // Next button
    if (pagination.hasNext) {
        paginationHTML += `<button class="btn" onclick="changePage(${pagination.currentPage + 1})">Next</button>`;
    }
    
    elements.pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    loadFiles();
}

async function updateStorageInfo() {
    if (!currentUser) return;
    
    const usedMB = currentUser.storageUsedMB || 0;
    const limitMB = currentUser.storageLimitMB || 1024;
    const percentage = Math.min((usedMB / limitMB) * 100, 100);
    
    elements.storageUsed.style.width = `${percentage}%`;
    elements.storageText.textContent = `${usedMB} MB / ${limitMB} MB used`;
}

// File Operations
async function downloadFile(fileId) {
    try {
        const response = await fetch(`${API_BASE_URL}/files/download/${fileId}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showToast('Downloading file...', 'success');
        } else {
            const result = await response.json();
            showToast(result.message || 'File download failed', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showToast('Download error', 'error');
    }
}

async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('File deleted', 'success');
            loadFiles();
        } else {
            showToast(result.message || 'File deletion failed', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Delete error', 'error');
    }
}

// File Upload
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        elements.fileInput.files = files;
        handleFileSelect();
    }
}

function handleFileSelect() {
    const file = elements.fileInput.files[0];
    if (file) {
        elements.uploadArea.innerHTML = `
            <i class="fas fa-file"></i>
            <p>${file.name}</p>
            <small>${formatFileSize(file.size)}</small>
        `;
    }
}

async function handleFileUpload(e) {
    e.preventDefault();
    
    const file = elements.fileInput.files[0];
    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }
    
    showLoading();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', e.target.description.value);
    formData.append('tags', e.target.tags.value);
    formData.append('isPublic', e.target.isPublic.checked);
    
    try {
        const response = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('File uploaded successfully', 'success');
            hideModal(elements.uploadModal);
            e.target.reset();
            elements.uploadArea.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag and drop files here or click to upload</p>
            `;
            loadFiles();
        } else {
            showToast(result.message || 'File upload failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload error', 'error');
    } finally {
        hideLoading();
    }
}

// Profile Management
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentUser = result.user;
            
            // Fill profile form
            document.getElementById('profileFirstName').value = currentUser.firstName;
            document.getElementById('profileLastName').value = currentUser.lastName;
            document.getElementById('profileEmail').value = currentUser.email;
            
            updateStorageInfo();
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentUser = result.user;
            elements.username.textContent = currentUser.username;
            showToast('Profile updated', 'success');
        } else {
            showToast(result.message || 'Profile update failed', 'error');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showToast('Update error', 'error');
    } finally {
        hideLoading();
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    showLoading();
    
    const formData = new FormData(e.target);
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        hideLoading();
        return;
    }
    
    const data = {
        currentPassword: formData.get('currentPassword'),
        newPassword: newPassword
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Password changed', 'success');
            e.target.reset();
        } else {
            showToast(result.message || 'Password change failed', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showToast('Password change error', 'error');
    } finally {
        hideLoading();
    }
}

// Search and Filters
function handleSearch() {
    currentSearch = elements.searchInput.value;
    currentPage = 1;
    loadFiles();
}

function handleTypeFilter() {
    currentType = elements.typeFilter.value;
    currentPage = 1;
    loadFiles();
}

function handleSortFilter() {
    currentSort = elements.sortFilter.value;
    currentPage = 1;
    loadFiles();
}

// Utility Functions
function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

function showLoading() {
    elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Shared Files (placeholder)
function loadSharedFiles() {
    elements.sharedFiles.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-share-alt"></i>
            <h3>No shared files</h3>
            <p>No files shared with you.</p>
        </div>
    `;
}

// File Details (placeholder)
function showFileDetails(fileId) {
    // Implementation for file details modal
    showToast('File details will be added soon', 'info');
} 