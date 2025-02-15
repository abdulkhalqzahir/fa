document.getElementById('depreciationForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const cost = parseFloat(document.getElementById('cost').value);
    const life = parseInt(document.getElementById('life').value);
    const salvage = parseFloat(document.getElementById('salvage').value);

    const annualDepreciation = (cost - salvage) / life;

    document.getElementById('annualDepreciation').textContent = annualDepreciation.toFixed(2);

    const tableBody = document.querySelector('#depreciationTable tbody');
    tableBody.innerHTML = '';

    let accumulatedDepreciation = 0;
    let remainingValue = cost;

    for (let year = 1; year <= life; year++) {
        accumulatedDepreciation += annualDepreciation;
        remainingValue -= annualDepreciation;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${year}</td>
            <td title="خەرجی ساڵانە = (کۆلفەی مەجود - بەهای خڕتە) / عومری بەرهەمهێنان">${annualDepreciation.toFixed(2)}</td>
            <td title="کۆی خەرجەکان = خەرجی ساڵانە × ساڵ">${accumulatedDepreciation.toFixed(2)}</td>
            <td title="بەهای مانەوە = کۆلفەی مەجود - کۆی خەرجەکان">${remainingValue.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    }

    document.getElementById('result').classList.remove('hidden');
});