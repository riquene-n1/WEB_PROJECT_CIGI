// Front-end logic for search, login and admin actions

document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const resultBody = document.querySelector('#resultTable tbody');

    async function fetchChains(query) {
        const params = new URLSearchParams(query || {}).toString();
        const res = await fetch('/api/chains' + (params ? `?${params}` : ''));
        return res.json();
    }

    async function loadHistory() {
        const list = document.getElementById('historyList');
        if (!list) return;
        list.innerHTML = '';
        const username = sessionStorage.getItem('loggedIn') === 'true' ? sessionStorage.getItem('username') : null;
        let items = [];
        if (username) {
            const res = await fetch(`/api/history?username=${encodeURIComponent(username)}`);
            if (res.ok) items = await res.json();
        } else {
            items = JSON.parse(sessionStorage.getItem('tmpHistory') || '[]');
        }
        items.forEach(it => {
            const li = document.createElement('li');
            const q = it.query;
            li.textContent = `${q.type || ''} ${q.model || ''} ${q.spec || ''} ${q.tol || ''}`.trim();
            list.appendChild(li);
        });
    }

    async function populateAdminTable() {
        const tableBody = document.querySelector('#adminTable tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        const chains = await fetchChains();
        chains.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.modelNo}</td>
                <td>${item.type}</td>
                <td>${item.spec}</td>
                <td>${item.tolerance}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    async function loadDetails() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const table = document.getElementById('detailTable');
        if (!id || !table) return;
        const res = await fetch(`/api/chains/${id}`);
        if (!res.ok) {
            table.querySelector('tbody').innerHTML = '<tr><td colspan="2">Not found</td></tr>';
            return;
        }
        const item = await res.json();
        document.getElementById('dModel').textContent = item.modelNo;
        document.getElementById('dType').textContent = item.type;
        document.getElementById('dSpec').textContent = item.spec;
        document.getElementById('dTol').textContent = item.tolerance;
        document.getElementById('dCatalog').innerHTML = `<a href="${item.catalog}">View</a>`;
        document.getElementById('dImage').innerHTML = item.image ? `<img src="${item.image}" width="100">` : '';
    }

    if (productForm && resultBody) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            resultBody.innerHTML = '';

            const typeVal = document.getElementById('productType').value.trim().toLowerCase();
            const modelVal = document.getElementById('modelNo').value.trim().toLowerCase();
            const specVal = document.getElementById('spec').value.trim().toLowerCase();
            const tolVal = document.getElementById('tolerance').value.trim().toLowerCase();

            const queryObj = {
                type: typeVal,
                model: modelVal,
                spec: specVal,
                tol: tolVal
            };
            const chains = await fetchChains(queryObj);
            chains.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                        <td>${item.modelNo}</td>
                        <td>${item.type}</td>
                        <td>${item.spec}</td>
                        <td>${item.tolerance}</td>
                <td><a href="${item.catalog}">View</a></td>
                <td>${item.image ? `<img src="${item.image}" alt="${item.modelNo}" width="50">` : ''}</td>
                <td><a href="detail.html?id=${item.id}">Details</a></td>
                    `;
                resultBody.appendChild(row);
            });

            const username = sessionStorage.getItem('loggedIn') === 'true' ? sessionStorage.getItem('username') : null;
            if (username) {
                fetch('/api/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, query: queryObj })
                }).then(loadHistory);
            } else {
                const tmp = JSON.parse(sessionStorage.getItem('tmpHistory') || '[]');
                tmp.unshift({ query: queryObj, ts: new Date().toISOString() });
                sessionStorage.setItem('tmpHistory', JSON.stringify(tmp.slice(0,5)));
                loadHistory();
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });
            if (res.ok) {
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('username', user);
                if (user === 'admin') window.location.href = 'admin.html';
                else window.location.href = 'index.html';
            } else {
                alert('Invalid credentials');
            }
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                username: document.getElementById('suUsername').value,
                password: document.getElementById('suPassword').value,
                phone: document.getElementById('suPhone').value,
                fullname: document.getElementById('suName').value,
                company: document.getElementById('suCompany').value,
                position: document.getElementById('suPos').value
            };
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert('Registered successfully');
                window.location.href = 'login.html';
            } else {
                alert('Registration failed');
            }
        });
    }

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        if (sessionStorage.getItem('loggedIn') === 'true') {
            logoutLink.style.display = 'inline';
        } else {
            logoutLink.style.display = 'none';
        }
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('loggedIn');
            sessionStorage.removeItem('username');
            window.location.href = 'index.html';
        });
    }

    const addForm = document.getElementById('addForm');
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addForm);
            const res = await fetch('/api/chains', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                alert('Item added');
                addForm.reset();
                populateAdminTable();
            } else {
                alert('Add failed');
            }
        });
    }

    const removeForm = document.getElementById('removeForm');
    if (removeForm) {
        removeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('removeId').value;
            const res = await fetch(`/api/chains/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Item removed');
                removeForm.reset();
                populateAdminTable();
            } else {
                alert('Remove failed');
            }
        });
    }

    const updateForm = document.getElementById('updateForm');
    if (updateForm) {
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('updateId').value;
            const formData = new FormData(updateForm);
            const res = await fetch(`/api/chains/${id}`, {
                method: 'PUT',
                body: formData
            });
            if (res.ok) {
                alert('Item updated');
                updateForm.reset();
                populateAdminTable();
            } else {
                alert('Update failed');
            }
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', populateAdminTable);
    }

    populateAdminTable();
    loadHistory();
    loadDetails();
});
