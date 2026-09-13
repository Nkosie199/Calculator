import { answerQuery, type QueryResult } from '../core/query';
import { getAngleMode } from './angleMode';
import { switchToMode } from './modes';
import { setPrimaryFunction } from './modes/graph';

let askForm: HTMLFormElement;
let askInput: HTMLInputElement;
let resultEl: HTMLDivElement;

function renderAnswer(title: string, value: string, detail?: string): void {
  resultEl.innerHTML = '';
  const titleEl = document.createElement('div');
  titleEl.className = 'ask-title';
  titleEl.textContent = title;
  const valueEl = document.createElement('div');
  valueEl.className = 'ask-value';
  valueEl.textContent = value;
  resultEl.append(titleEl, valueEl);
  if (detail) {
    const detailEl = document.createElement('div');
    detailEl.className = 'ask-detail';
    detailEl.textContent = detail;
    resultEl.appendChild(detailEl);
  }
}

function renderError(message: string, suggestions: string[]): void {
  resultEl.innerHTML = '';
  const messageEl = document.createElement('div');
  messageEl.className = 'ask-error';
  messageEl.textContent = message;
  resultEl.appendChild(messageEl);

  const label = document.createElement('div');
  label.className = 'ask-detail';
  label.textContent = 'Try one of these:';
  resultEl.appendChild(label);

  const list = document.createElement('div');
  list.className = 'ask-suggestions';
  for (const example of suggestions.slice(0, 6)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pill';
    button.textContent = example;
    button.addEventListener('click', () => {
      askInput.value = example;
      submit();
    });
    list.appendChild(button);
  }
  resultEl.appendChild(list);
}

function render(result: QueryResult): void {
  resultEl.hidden = false;

  if (result.kind === 'answer') {
    renderAnswer(result.title, result.value, result.detail);
    return;
  }

  if (result.kind === 'navigate') {
    switchToMode(result.mode);
    if (result.mode === 'graph') setPrimaryFunction(result.expression);
    renderAnswer('Plotted', `${result.expression} — see the Graph tab`);
    return;
  }

  renderError(result.message, result.suggestions);
}

function submit(): void {
  const value = askInput.value.trim();
  if (value === '') {
    resultEl.hidden = true;
    return;
  }
  render(answerQuery(value, getAngleMode()));
}

let initialized = false;

export function initAskBar(): void {
  if (initialized) return;
  initialized = true;

  askForm = document.getElementById('askForm') as HTMLFormElement;
  askInput = document.getElementById('askInput') as HTMLInputElement;
  resultEl = document.getElementById('askResult') as HTMLDivElement;

  document.querySelectorAll<HTMLButtonElement>('.ask-examples .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      askInput.value = chip.dataset.example ?? chip.textContent ?? '';
      submit();
      askInput.focus();
    });
  });

  askForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submit();
  });
}
