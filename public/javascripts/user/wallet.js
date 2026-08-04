
async function addMoneyToWallet() {
    const amount = document.getElementById('amount').value;
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    try {
        const response = await fetch('/wallet/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: parseFloat(amount) })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Money added successfully!');
            // Reload the page to show updated balance and transactions
            window.location.reload();
        } else {
            showToast(data.message || 'Failed to add money', 'error');
        }
    } catch (error) {
        showToast('An error occurred', 'error');
        console.error('Error:', error);
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}