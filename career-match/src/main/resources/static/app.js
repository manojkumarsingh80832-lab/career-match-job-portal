const API = '/api';

// =====================================================
// LOAD JOBS
// =====================================================
async function loadJobs() {
    const jobList = document.getElementById('jobList');
    if (!jobList) return;

    try {
        const response = await fetch(`${API}/jobs`);
        if (!response.ok) throw new Error(`Failed to load jobs.`);

        cachedJobs = await response.json(); // Jobs ko cache mein save karein
        renderJobs(cachedJobs);

    } catch (error) {
        console.error('Job loading error:', error);
        jobList.textContent = 'Unable to load jobs.';
    }
}

// Render karne ka alag helper function taaki sorting aur searching asan ho
function renderJobs(jobsArray) {
    const jobList = document.getElementById('jobList');
    if (!jobList) return;

    jobList.replaceChildren();

    const searchInput = document.getElementById('jobSearch');
    if (searchInput && searchInput.value === '') {
        // keep search input as is
    }

    if (!Array.isArray(jobsArray) || jobsArray.length === 0) {
        jobList.textContent = 'No jobs available.';
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const isAdmin = currentUser && currentUser.role === 'ADMIN';

    jobsArray.forEach(job => {
        const card = document.createElement('div');
        card.className = 'card';

        const title = document.createElement('h3');
        title.textContent = job.title;

        const company = document.createElement('p');
        company.className = 'company';
        company.textContent = `${job.company} | ${job.location}`;

        const description = document.createElement('p');
        description.textContent = job.description;

        // Job Status Badge
        const isClosed = job.status === 'CLOSED';
        const statusBadge = document.createElement('span');
        statusBadge.style.cssText = `display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-bottom: 8px; background: ${isClosed ? '#fee2e2' : '#dcfce7'}; color: ${isClosed ? '#dc2626' : '#16a34a'};`;
        statusBadge.textContent = isClosed ? 'CLOSED' : 'ACTIVE';
        card.appendChild(statusBadge);

        const skillsBox = document.createElement('div');
        skillsBox.className = 'skills';

        if (job.skills) {
            job.skills.split(',').forEach(skill => {
                const pill = document.createElement('span');
                pill.className = 'pill';
                pill.textContent = skill.trim();
                skillsBox.appendChild(pill);
            });
        }

        const actions = document.createElement('div');
        actions.className = 'job-actions';

        if (isAdmin) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn secondary';
            editBtn.textContent = 'Edit Job';
            editBtn.addEventListener('click', () => openEditJobModal(job));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn secondary';
            deleteBtn.style.background = '#dc2626';
            deleteBtn.textContent = 'Delete Job';
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this job?')) {
                    await deleteJob(job.id);
                }
            });
            actions.append(editBtn, deleteBtn);
        } else {
            const matchBtn = document.createElement('button');
            matchBtn.className = 'btn secondary';
            matchBtn.textContent = 'Check Match';

            const result = document.createElement('p');
            result.className = 'match';

            const keywords = document.createElement('p');
            keywords.className = 'muted';

            matchBtn.addEventListener('click', () => matchJob(job.id, result, keywords));

            const applyBtn = document.createElement('button');
            applyBtn.className = 'btn';
            applyBtn.textContent = isClosed ? 'Job Closed' : 'Apply Job';

            if (isClosed) {
                applyBtn.disabled = true;
                applyBtn.style.background = '#9ca3af';
                applyBtn.style.cursor = 'not-allowed';
            } else {
                applyBtn.addEventListener('click', async () => {
                    const success = await applyJob(job.id);
                    if (success) {
                        applyBtn.textContent = 'Already Applied';
                        applyBtn.disabled = true;
                        applyBtn.style.opacity = '0.6';
                    }
                });
            }

            const detailsBtn = document.createElement('button');
            detailsBtn.className = 'btn secondary';
            detailsBtn.textContent = 'View Details';
            detailsBtn.addEventListener('click', () => openJobModal(job));

            actions.append(matchBtn, applyBtn, detailsBtn);
            card.append(title, company, description, skillsBox, actions, result, keywords);
            jobList.appendChild(card);
            return;
        }

        card.append(title, company, description, skillsBox, actions);
        jobList.appendChild(card);
    });
}

// Sort function jo dropdown change hone par chalega
function sortJobs() {
    const sortValue = document.getElementById('jobSortSelect').value;
    let sortedArray = [...cachedJobs];

    if (sortValue === 'latest') {
        // ID ke descending order mein sort karein (newest first)
        sortedArray.sort((a, b) => b.id - a.id);
    } else if (sortValue === 'match') {
        // Agar match score ke basis par sort karna ho (agar score calculate ho chuka ho)
        sortedArray.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    renderJobs(sortedArray);
}

// =====================================================
// ADMIN: CREATE / EDIT / DELETE JOB
// =====================================================
async function createJob() {
    const title = document.getElementById('newJobTitle').value.trim();
    const company = document.getElementById('newJobCompany').value.trim();
    const location = document.getElementById('newJobLocation').value.trim();
    const description = document.getElementById('newJobDesc').value.trim();
    const skills = document.getElementById('newJobSkills').value.trim();
    const statusSelect = document.getElementById('newJobStatus');
    const status = statusSelect ? statusSelect.value : "ACTIVE";
    const msg = document.getElementById('adminMsg');

    if (!title || !company || !description) {
        msg.textContent = 'Please fill required fields (Title, Company, Description).';
        msg.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`${API}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, company, location, description, skills, status })
        });

        if (!response.ok) throw new Error('Failed to create job');

        showToast('Job posted successfully!');
        document.getElementById('newJobTitle').value = '';
        document.getElementById('newJobCompany').value = '';
        document.getElementById('newJobLocation').value = '';
        document.getElementById('newJobDesc').value = '';
        document.getElementById('newJobSkills').value = '';
        if (statusSelect) statusSelect.value = 'ACTIVE';

        loadJobs();
        loadAdminStats();
    } catch (err) {
        console.error(err);
        showToast('Error posting job.', 'error');
    }
}

function openEditJobModal(job) {
    document.getElementById('editJobId').value = job.id;
    document.getElementById('editJobTitle').value = job.title;
    document.getElementById('editJobCompany').value = job.company;
    document.getElementById('editJobLocation').value = job.location;
    document.getElementById('editJobDesc').value = job.description;
    document.getElementById('editJobSkills').value = job.skills || '';

    const editStatus = document.getElementById('editJobStatus');
    if (editStatus) editStatus.value = job.status || 'ACTIVE';

    document.getElementById('editMsg').textContent = '';
    document.getElementById('editJobModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editJobModal').style.display = 'none';
}

async function saveJobEdit() {
    const id = document.getElementById('editJobId').value;
    const title = document.getElementById('editJobTitle').value.trim();
    const company = document.getElementById('editJobCompany').value.trim();
    const location = document.getElementById('editJobLocation').value.trim();
    const description = document.getElementById('editJobDesc').value.trim();
    const skills = document.getElementById('editJobSkills').value.trim();
    const editStatus = document.getElementById('editJobStatus');
    const status = editStatus ? editStatus.value : 'ACTIVE';
    const msg = document.getElementById('editMsg');

    if (!title || !company || !description) {
        msg.textContent = 'Please fill required fields.';
        msg.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`${API}/jobs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, company, location, description, skills, status })
        });

        if (!response.ok) throw new Error('Failed to update job');

        showToast('Job updated successfully!');

        setTimeout(() => {
            closeEditModal();
            loadJobs();
            loadAdminStats();
        }, 800);

    } catch (err) {
        console.error(err);
        showToast('Error updating job.', 'error');
    }
}

async function deleteJob(jobId) {
    try {
        const response = await fetch(`${API}/jobs/${jobId}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Job deleted successfully!');
            loadJobs();
            loadAdminStats();
        } else {
            showToast('Failed to delete job.', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

// =====================================================
// SEARCH / FILTER JOBS
// =====================================================
function filterJobs() {
    const searchInput = document.getElementById('jobSearch');
    const jobList = document.getElementById('jobList');
    if (!searchInput || !jobList) return;

    const searchText = searchInput.value.toLowerCase().trim();
    const cards = jobList.getElementsByClassName('card');

    Array.from(cards).forEach(card => {
        const text = card.textContent.toLowerCase();

        if (searchText === "" || text.includes(searchText)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// =====================================================
// UPLOAD RESUME
// =====================================================
async function uploadResume() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) {
        showToast("Please login first.", "error");
        return;
    }
    const userId = user.id;
    const fileInput = document.getElementById('resumeFile');
    const message = document.getElementById('resumeMsg');

    if (!fileInput.files.length) {
        message.textContent = 'Please select a resume.';
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    message.textContent = 'Uploading and extracting resume...';
    showToast('Uploading and extracting resume...');

    try {
        const response = await fetch(`${API}/resumes/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed.');
        const data = await response.json();
        message.textContent = `Resume uploaded successfully: ${data.fileName || file.name}`;
        showToast(`Resume uploaded successfully!`);
    } catch (error) {
        console.error(error);
        message.textContent = 'Unable to upload resume.';
        showToast('Unable to upload resume.', 'error');
    }
}

// =====================================================
// CHECK MATCH & APPLY
// =====================================================
async function matchJob(jobId, result, keywords) {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) { showToast("Please login first.", "error"); return; }

    result.textContent = 'Calculating match...';
    try {
        const response = await fetch(`${API}/jobs/${jobId}/match/${user.id}`);
        const data = await response.json();
        result.textContent = `Match Score: ${data.score}%`;
        keywords.textContent = `Matched: ${data.matchedKeywords?.join(', ') || 'None'} | Missing: ${data.missingKeywords?.join(', ') || 'None'}`;
    } catch (error) {
        result.textContent = 'Unable to calculate match.';
    }
}

async function applyJob(jobId) {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) { showToast("Please login first.", "error"); return false; }

    try {
        const response = await fetch(`${API}/applications?userId=${user.id}&jobId=${jobId}`, { method: 'POST' });
        if (!response.ok) {
            showToast('You have already applied for this job.', 'error');
            return false;
        }
        const application = await response.json();
        showToast(`Application submitted successfully! Match Score: ${application.matchScore}%`);
        setTimeout(() => {
            showToast(`📧 Email notification simulated & sent to ${user.email}`);
        }, 1000);

        loadApplications();
        loadAdminStats();
        return true;
    } catch (error) {
        showToast('Unable to apply.', 'error');
        return false;
    }
}

// =====================================================
// LOAD APPLICATIONS & VISUAL PROGRESS BAR
// =====================================================
async function loadApplications() {
    const box = document.getElementById('applicationList');
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!box) return;

    if (!user) {
        box.textContent = 'Please login to view applications.';
        return;
    }

    const isAdmin = user.role === 'ADMIN';
    const endpoint = isAdmin ? `${API}/applications` : `${API}/applications/user/${user.id}`;

    if (isAdmin) {
        document.getElementById('appHeaderTitle').textContent = 'All Candidate Applications';
        document.getElementById('appTagTitle').textContent = 'Admin Overview';
    } else {
        document.getElementById('appHeaderTitle').textContent = 'My Applications';
        document.getElementById('appTagTitle').textContent = 'Your activity';
    }

    box.textContent = 'Loading applications...';

    try {
        const response = await fetch(endpoint);
        const applications = await response.json();

        if (!Array.isArray(applications) || applications.length === 0) {
            box.textContent = 'No applications found.';
            return;
        }

        box.replaceChildren();
        applications.forEach(app => {
            const card = document.createElement('div');
            card.className = 'card';

            let statusColor = '#4f46e5';
            if (app.status === 'SHORTLISTED') statusColor = '#059669';
            else if (app.status === 'INTERVIEW_SCHEDULED') statusColor = '#d97706';
            else if (app.status === 'REJECTED') statusColor = '#dc2626';

            // Visual Progress Bar logic
            let step1Active = true;
            let step2Active = ['SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(app.status);
            let step3Active = app.status === 'INTERVIEW_SCHEDULED';
            let isRejected = app.status === 'REJECTED';

            let progressHtml = '';
            if (isRejected) {
                progressHtml = `<div style="margin: 12px 0; padding: 8px; background: #fee2e2; color: #dc2626; border-radius: 6px; font-weight: bold; text-align: center; font-size: 13px;">Application Rejected</div>`;
            } else {
                progressHtml = `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin: 15px 0 10px; font-size: 12px; font-weight: bold; color: #64748b;">
                        <div style="text-align: center; flex: 1; color: ${step1Active ? '#4f46e5' : '#9ca3af'}">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${step1Active ? '#4f46e5' : '#e5e7eb'}; color: white; display: grid; place-items: center; margin: 0 auto 4px;">✓</div>
                            Applied
                        </div>
                        <div style="height: 2px; flex: 1; background: ${step2Active ? '#4f46e5' : '#e5e7eb'}; margin-bottom: 15px;"></div>
                        <div style="text-align: center; flex: 1; color: ${step2Active ? '#4f46e5' : '#9ca3af'}">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${step2Active ? '#4f46e5' : '#e5e7eb'}; color: white; display: grid; place-items: center; margin: 0 auto 4px;">${step2Active ? '✓' : '2'}</div>
                            Shortlisted
                        </div>
                        <div style="height: 2px; flex: 1; background: ${step3Active ? '#4f46e5' : '#e5e7eb'}; margin-bottom: 15px;"></div>
                        <div style="text-align: center; flex: 1; color: ${step3Active ? '#4f46e5' : '#9ca3af'}">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${step3Active ? '#4f46e5' : '#e5e7eb'}; color: white; display: grid; place-items: center; margin: 0 auto 4px;">${step3Active ? '✓' : '3'}</div>
                            Interview
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <h3>${app.jobTitle || 'Job #' + app.jobId}</h3>
                <p class="company">${app.company || ''} | ${app.location || ''}</p>
                ${isAdmin ? `
                    <div style="background: #f8fafc; padding: 10px; border-radius: 6px; margin: 10px 0; font-size: 14px; border: 1px solid #e2e8f0;">
                        <p><b>Candidate:</b> ${app.candidateName || 'User #' + app.userId}</p>
                        <p><b>Email:</b> ${app.candidateEmail || 'N/A'}</p>
                        <p><b>Phone:</b> ${app.candidatePhone || 'N/A'}</p>
                        <p><b>College:</b> ${app.candidateCollege || 'N/A'}</p>
                    </div>
                ` : ''}
                <p class="match">Match Score: ${app.matchScore}%</p>
                <p class="muted">Status: <span style="color: ${statusColor}; font-weight: bold;">${app.status}</span></p>
                ${progressHtml}
            `;

            if (isAdmin) {
                const actionDiv = document.createElement('div');
                actionDiv.style.marginTop = '12px';
                actionDiv.style.display = 'flex';
                actionDiv.style.gap = '8px';
                actionDiv.style.flexWrap = 'wrap';

                ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'REJECTED'].forEach(st => {
                    const btn = document.createElement('button');
                    btn.className = 'btn secondary';
                    btn.style.fontSize = '12px';
                    btn.style.padding = '6px 10px';
                    btn.textContent = st.replace('_', ' ');

                    btn.addEventListener('click', async () => {
                        await updateApplicationStatus(app.id, st);
                    });
                    actionDiv.appendChild(btn);
                });
                card.appendChild(actionDiv);
            }

            box.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        box.textContent = 'Unable to load applications.';
    }
}

// =====================================================
// UPDATE APPLICATION STATUS
// =====================================================
async function updateApplicationStatus(appId, newStatus) {
    try {
        const response = await fetch(`${API}/applications/${appId}/status?status=${newStatus}`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to update status');

        showToast(`Application status updated to ${newStatus}!`);
        setTimeout(() => {
            showToast(`📧 Candidate email notification sent successfully!`);
        }, 1000);

        loadApplications();
    } catch (err) {
        console.error(err);
        showToast('Error updating application status.', 'error');
    }
}

// =====================================================
// TOAST NOTIFICATION SYSTEM
// =====================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// =====================================================
// MODAL CONTROLS
// =====================================================
function openJobModal(job) {
    const modal = document.getElementById('jobModal');
    document.getElementById('modalTitle').textContent = job.title;
    document.getElementById('modalCompany').textContent = `${job.company} | ${job.location}`;
    document.getElementById('modalDescription').textContent = job.description;

    const modalSkills = document.getElementById('modalSkills');
    modalSkills.replaceChildren();
    if (job.skills) {
        job.skills.split(',').forEach(skill => {
            const pill = document.createElement('span');
            pill.className = 'pill';
            pill.textContent = skill.trim();
            modalSkills.appendChild(pill);
        });
    }

    document.getElementById('modalApplyBtn').onclick = async () => {
        if (await applyJob(job.id)) modal.style.display = 'none';
    };
    modal.style.display = 'flex';
}

function setupModal() {
    const modal = document.getElementById('jobModal');
    const editModal = document.getElementById('editJobModal');
    const editProfileModal = document.getElementById('editProfileModal');
    const authModal = document.getElementById('authModal');
    const closeModal = document.getElementById('closeModal');

    if (closeModal && modal) {
        closeModal.onclick = () => modal.style.display = 'none';
    }

    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
        if (e.target === editModal) editModal.style.display = 'none';
        if (e.target === editProfileModal) editProfileModal.style.display = 'none';
        if (e.target === authModal) authModal.style.display = 'none';
    };
}

// =====================================================
// AUTH & SESSION MANAGEMENT
// =====================================================
function showLogin() {
    document.getElementById("authModal").style.display = "flex";
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("registerBox").style.display = "none";
    document.getElementById("forgotBox").style.display = "none";
}

function showRegister() {
    document.getElementById("authModal").style.display = "flex";
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("registerBox").style.display = "block";
    document.getElementById("forgotBox").style.display = "none";

    setupRegisterEnterKey();
}

function closeAuthModal() {
    document.getElementById("authModal").style.display = "none";
}

async function loginUser() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const msg = document.getElementById("loginMsg");

    try {
        const response = await fetch(`${API}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }

        if (!response.ok) { msg.textContent = data; return; }

        localStorage.setItem("loggedInUser", JSON.stringify(data));
        applyUserRoleUI(data);
        closeAuthModal();
        loadJobs();
        loadApplications();
        showToast(`Welcome back, ${data.name}!`);
    } catch (error) {
        msg.textContent = "Unable to connect.";
    }
}

function logoutUser() {
    localStorage.removeItem("loggedInUser");
    location.reload();
}

function applyUserRoleUI(user) {
    const authButtons = document.getElementById("authButtons");
    if (authButtons) {
        authButtons.innerHTML = `
            <span class="muted">Welcome, ${user.name} (${user.role})</span>
            <button class="btn secondary" onclick="openEditProfileModal()">Edit Profile</button>
            <button class="btn secondary" onclick="logoutUser()">Logout</button>
        `;
    }

    const adminSection = document.getElementById("adminSection");
    const resumeSection = document.getElementById("resume");
    const navAdmin = document.getElementById("navAdmin");
    const navResume = document.getElementById("navResume");

    if (user.role === 'ADMIN') {
        if (adminSection) {
            adminSection.style.display = 'block';
            loadAdminStats();
        }
        if (resumeSection) resumeSection.style.display = 'none';
        if (navAdmin) navAdmin.style.display = 'block';
        if (navResume) navResume.style.display = 'none';
    } else {
        if (adminSection) adminSection.style.display = 'none';
        if (resumeSection) resumeSection.style.display = 'block';
        if (navAdmin) navAdmin.style.display = 'none';
        if (navResume) navResume.style.display = 'block';
    }
}

// =====================================================
// PASSWORD VISIBILITY TOGGLE (EYE ICON)
// =====================================================
function togglePasswordVisibility(fieldId, btn) {
    const passwordInput = document.getElementById(fieldId);
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        btn.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        btn.textContent = "👁️";
    }
}

// =====================================================
// REGISTER USER
// =====================================================
async function registerUser() {
    const msg = document.getElementById("registerMsg");
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        msg.textContent = "Please enter a valid email address.";
        msg.style.color = "red";
        return;
    }

    const password = document.getElementById("registerPassword").value;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!\%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
        msg.textContent = "Password must be 6+ chars with uppercase, lowercase, number & symbol (e.g., Manoj@123)";
        msg.style.color = "red";
        return;
    }

    const phone = document.getElementById("registerPhone").value.trim();
    const college = document.getElementById("registerCollege").value.trim();
    const skills = document.getElementById("registerSkills").value.trim();
    const linkedinUrl = document.getElementById("registerLinkedin").value.trim();
    const role = document.getElementById("registerRole").value;

    if (!name || !email || !password) {
        msg.textContent = "Please fill required fields (Name, Email, Password).";
        msg.style.color = "red";
        return;
    }

    try {
        const response = await fetch(`${API}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, phone, college, skills, linkedinUrl, role })
        });
        const data = await response.text();
        if (!response.ok) {
            msg.textContent = data;
            msg.style.color = "red";
            return;
        }

        msg.textContent = "Registration successful! Please login.";
        msg.style.color = "green";
        showToast("Registration successful! Please login.");

        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";
        document.getElementById("registerPhone").value = "";
        document.getElementById("registerCollege").value = "";
        document.getElementById("registerSkills").value = "";
        document.getElementById("registerLinkedin").value = "";

        setTimeout(showLogin, 1200);
    } catch (error) {
        console.error(error);
        msg.textContent = "Server error.";
        msg.style.color = "red";
    }
}

function switchView(viewId) {
    const sections = ['jobs', 'resume', 'applications', 'adminSection', 'about'];

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === viewId) {
                el.style.display = 'block';
                if (viewId === 'applications') loadApplications();
                if (viewId === 'adminSection') loadAdminStats();
            } else {
                el.style.display = 'none';
            }
        }
    });
}

function setupRegisterEnterKey() {
    const registerInputs = [
        "registerName",
        "registerEmail",
        "registerPassword",
        "registerPhone",
        "registerCollege",
        "registerSkills",
        "registerLinkedin"
    ];

    registerInputs.forEach((id, index) => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.removeEventListener("keydown", handleRegisterEnter);
            inputElement.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const nextId = registerInputs[index + 1];
                    if (nextId) {
                        const nextElement = document.getElementById(nextId);
                        if (nextElement) nextElement.focus();
                    } else {
                        const roleSelect = document.getElementById("registerRole");
                        if (roleSelect) roleSelect.focus();
                    }
                }
            });
        }
    });
}

function handleRegisterEnter() {}

// =====================================================
// EDIT PROFILE FUNCTIONS
// =====================================================
function openEditProfileModal() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) return;

    document.getElementById("editProfileName").value = user.name || "";
    document.getElementById("editProfilePhone").value = user.phone || "";
    document.getElementById("editProfileCollege").value = user.college || "";
    document.getElementById("editProfileSkills").value = user.skills || "";
    document.getElementById("editProfileLinkedin").value = user.linkedinUrl || "";
    document.getElementById("editProfileMsg").textContent = "";

    document.getElementById("editProfileModal").style.display = "flex";
}

function closeEditProfileModal() {
    document.getElementById("editProfileModal").style.display = "none";
}

async function saveProfileChanges() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) return;

    const name = document.getElementById("editProfileName").value.trim();
    const phone = document.getElementById("editProfilePhone").value.trim();
    const college = document.getElementById("editProfileCollege").value.trim();
    const skills = document.getElementById("editProfileSkills").value.trim();
    const linkedinUrl = document.getElementById("editProfileLinkedin").value.trim();
    const msg = document.getElementById("editProfileMsg");

    if (!name) {
        msg.textContent = "Name cannot be empty.";
        msg.style.color = "red";
        return;
    }

    try {
        const response = await fetch(`${API}/users/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, college, skills, linkedinUrl })
        });

        if (!response.ok) throw new Error("Failed to update profile");

        const updatedUser = await response.json();
        localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
        applyUserRoleUI(updatedUser);

        msg.textContent = "Profile updated successfully!";
        msg.style.color = "green";
        showToast("Profile updated successfully!");

        setTimeout(() => {
            closeEditProfileModal();
        }, 1000);

    } catch (err) {
        console.error(err);
        msg.textContent = "Error updating profile.";
        msg.style.color = "red";
    }
}

// Search & Enter key support
const searchInput = document.getElementById('jobSearch');
if (searchInput) {
    searchInput.addEventListener('input', () => { filterJobs(); });
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); filterJobs(); }
    });
}

const loginPasswordInput = document.getElementById('loginPassword');
if (loginPasswordInput) {
    loginPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); loginUser(); }
    });
}

// =====================================================
// FORGOT PASSWORD FUNCTIONS
// =====================================================
function showForgotPassword() {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("registerBox").style.display = "none";
    document.getElementById("forgotBox").style.display = "block";
    document.getElementById("forgotMsg").textContent = "";
    document.getElementById("forgotEmail").value = "";
    document.getElementById("forgotNewPassword").value = "";
}

async function resetPassword() {
    const email = document.getElementById("forgotEmail").value.trim();
    const password = document.getElementById("forgotNewPassword").value;
    const msg = document.getElementById("forgotMsg");

    if (!email || !password) {
        msg.textContent = "Please fill all fields.";
        msg.style.color = "red";
        return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!\%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
        msg.textContent = "Password must be 6+ chars with uppercase, lowercase, number & symbol (e.g., Manoj@123)";
        msg.style.color = "red";
        return;
    }

    try {
        const response = await fetch(`${API}/users/forgot-password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.text();
        if (!response.ok) {
            msg.textContent = data;
            msg.style.color = "red";
            return;
        }

        msg.textContent = "Password updated successfully! Please login.";
        msg.style.color = "green";
        showToast("Password updated successfully!");

        setTimeout(() => { showLogin(); }, 1500);

    } catch (err) {
        console.error(err);
        msg.textContent = "Unable to connect to server.";
        msg.style.color = "red";
    }
}

// =====================================================
// ADMIN STATS & ANALYTICS
// =====================================================
async function loadAdminStats() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user || user.role !== 'ADMIN') return;

    try {
        const response = await fetch(`${API}/jobs/stats`);
        if (!response.ok) throw new Error("Failed to load stats");

        const data = await response.json();
        const jobsCount = document.getElementById('statJobsCount');
        const candidatesCount = document.getElementById('statCandidatesCount');
        const appsCount = document.getElementById('statAppsCount');

        if (jobsCount) jobsCount.textContent = data.totalJobs || 0;
        if (candidatesCount) candidatesCount.textContent = data.totalCandidates || 0;
        if (appsCount) appsCount.textContent = data.totalApplications || 0;
    } catch (err) {
        console.error("Error fetching admin stats:", err);
    }
}

// =====================================================
// INITIALIZATION ON DOM LOAD
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    localStorage.removeItem("loggedInUser");
    switchView('jobs');
    setupModal();
});