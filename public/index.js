const display = document.getElementById('current');
const history = document.getElementById('history');
let currentCalculation = '';
let calculationHistory = [];

function buttonClick(value) {
    currentCalculation += value;
    display.value = currentCalculation;
}

function calculateResult() {
    try {
        const result = math.evaluate(currentCalculation.replace(/[^-()\d/*+.]/g, ''));
        calculationHistory.unshift(currentCalculation + ' = ' + result);
        currentCalculation = result.toString();
        display.value = currentCalculation;
        updateHistory();
    } catch (e) {
        display.value = 'Error';
    }
}

function clearCurrent() {
    currentCalculation = '';
    display.value = currentCalculation;
}

function deleteLast() {
    currentCalculation = currentCalculation.slice(0, -1);
    display.value = currentCalculation;
}

function updateHistory() {
    history.innerHTML = calculationHistory.join('<br>');
}

function toggleHistory() {
    const overlay = document.getElementById('historyOverlay');
    overlay.style.display = (overlay.style.display === 'block') ? 'none' : 'block';
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = calculationHistory.map(item => `<div>${item}</div>`).join('');
}