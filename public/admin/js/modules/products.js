// MODULE: PRODUCTS MANAGEMENT

function renderProductsTable(items) {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  tbody.innerHTML = items.map(p => `
    <tr>
      <td><img class="thumb-preview" src="${p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}" alt=""></td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td><span class="badge badge-device">${escapeHtml(p.category || 'Thiết bị y tế')}</span></td>
      <td><strong style="color:#0F5132;">${formatVND(p.price)}</strong></td>
      <td><b>${p.stock ?? 50}</b></td>
      <td><span class="badge active">Đang bán</span></td>
      <td>
        <div class="action-btns">
          <button title="Sửa" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" title="Xóa" onclick="deleteProduct(${p.id})"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}


// 6. CRUD SẢN PHẨM & THIẾT BỊ (LƯU VÀO SQL Server)
function openProductModal(p = null) {
  const modal = document.getElementById('productModal');
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';

  if (p) {
    document.getElementById('productModalTitle').textContent = 'Chỉnh Sửa Sản Phẩm / Thiết Bị';
    document.getElementById('productId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pStock').value = p.stock ?? 50;
    document.getElementById('pImage').value = p.image || '';
    document.getElementById('pDescription').value = p.description || '';
  } else {
    document.getElementById('productModalTitle').textContent = 'Tạo Sản Phẩm / Thiết Bị Y Tế';
  }
  modal.classList.add('show');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('show');
}

function editProduct(id) {
  const p = productsData.find(x => x.id == id);
  if (p) openProductModal(p);
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const data = {
    name: document.getElementById('pName').value.trim(),
    category: document.getElementById('pCategory').value,
    price: parseFloat(document.getElementById('pPrice').value),
    stock: parseInt(document.getElementById('pStock').value) || 50,
    status: document.getElementById('pStatus').value,
    image: document.getElementById('pImage').value.trim(),
    description: document.getElementById('pDescription').value.trim()
  };

  try {
    const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
    const method = id ? 'PUT' : 'POST';
    await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    showToast('Đã lưu thành công', 'success');
  } catch (err) {
    showToast('Lỗi lưu SQL Server', 'error');
  }

  closeProductModal();
  await loadProducts();
  updateStats();
}

async function deleteProduct(id) {
  try {
    await authFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    showToast('Đã xóa sản phẩm thành công!', 'warning');
    await loadProducts();
    updateStats();
  } catch (err) {
    showToast('Lỗi khi xóa sản phẩm', 'error');
  }
}

