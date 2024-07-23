document.addEventListener('DOMContentLoaded', () => {
    const shortenForm = document.getElementById('shorten-form');
    const deleteForm = document.getElementById('delete-form');
    const reportForm = document.getElementById('report-form');
    const reportList = document.getElementById('report-list');

    if (shortenForm) {
        shortenForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const originalUrl = document.getElementById('originalUrl').value;
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ originalUrl })
            });
            const result = await response.json();
            document.getElementById('shorten-result').innerText = response.ok ? `Shortened URL: ${result.shortUrl}` : `Error: ${result.error}`;
        });
    }

    if (deleteForm) {
        deleteForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = document.getElementById('id').value;
            const adminId = document.getElementById('adminId').value;
            const response = await fetch(`/api/delete/${adminId}/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            document.getElementById('delete-result').innerText = response.ok ? `Success: ${result.message}` : `Error: ${result.error}`;
        });
    }

    if (reportForm) {
        reportForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = document.getElementById('reportId').value;
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            document.getElementById('report-result').innerText = response.ok ? `Reported: ${result.message}` : `Error: ${result.error}`;
            loadReportList();
        });
    }

    // Load report list
    async function loadReportList() {
        reportList.innerHTML = '';
        const response = await fetch('/api/reports');
        const reports = await response.json();
        reports.forEach(report => {
            const li = document.createElement('li');
            li.textContent = `ID: ${report.id}, URL: ${report.originalUrl}`;
            reportList.appendChild(li);
        });
    }

    loadReportList();
});
