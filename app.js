// Front-end logic for search, login and admin actions

document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const resultBody = document.querySelector('#resultTable tbody');

    async function fetchChains() {
        const res = await fetch('/api/chains');
        return res.json();
    }

    if (productForm && resultBody) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            resultBody.innerHTML = '';

            const typeVal = document.getElementById('productType').value.trim().toLowerCase();
            const modelVal = document.getElementById('modelNo').value.trim().toLowerCase();
            const specVal = document.getElementById('spec').value.trim().toLowerCase();
            const tolVal = document.getElementById('tolerance').value.trim().toLowerCase();

            const chains = await fetchChains();
            chains
                .filter(item => {
                    const matchType = typeVal ? item.type.toLowerCase().includes(typeVal) : true;
                    const matchModel = modelVal ? item.modelNo.toLowerCase().includes(modelVal) : true;
                    const matchSpec = specVal ? item.spec.toLowerCase().includes(specVal) : true;
                    const matchTol = tolVal ? item.tolerance.toLowerCase().includes(tolVal) : true;
                    return matchType && matchModel && matchSpec && matchTol;
                })
                .forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.modelNo}</td>
                        <td>${item.type}</td>
                        <td>${item.spec}</td>
                        <td>${item.tolerance}</td>
                        <td><a href="${item.catalog}">View</a></td>
                        <td><img src="${item.image}" alt="${item.modelNo}" width="50"></td>
                    `;
                    resultBody.appendChild(row);
                });
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            if (user === 'admin' && pass === 'admin') {
                sessionStorage.setItem('loggedIn', 'true');
                window.location.href = 'admin.html';
            } else {
                alert('Invalid credentials');
            }
        });
    }

    const addForm = document.getElementById('addForm');
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                modelNo: document.getElementById('newModelNo').value,
                type: document.getElementById('newType').value,
                spec: document.getElementById('newSpec').value,
                tolerance: document.getElementById('newTol').value,
                catalog: '#',
                image: ''
            };
            const res = await fetch('/api/chains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('Item added');
                addForm.reset();
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
            const payload = {
                modelNo: document.getElementById('updateModel').value,
                type: document.getElementById('updateType').value,
                spec: document.getElementById('updateSpec').value,
                tolerance: document.getElementById('updateTol').value,
                catalog: '#',
                image: ''
            };
            const res = await fetch(`/api/chains/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('Item updated');
                updateForm.reset();
            } else {
                alert('Update failed');
            }
        });
    }
});