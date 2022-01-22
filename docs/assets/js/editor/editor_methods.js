/* Draw table drop down */
function drawTable (editor, row, column, options = {}) {
  const { hasHeaderRow } = options;
  let tableStr = '\n\n';
  tableStr = tableStr.concat(new Array(column)
    .fill()
    .reduce((pre, value, index) => `${pre} ${hasHeaderRow ? 'HEADER': 'Column'} ${index + 1} |`, '|'));
  tableStr = tableStr.concat('\n');
  tableStr = tableStr.concat(new Array(column).fill().reduce((pre, value, index) => `${pre} -------- |`, '|'));
  tableStr = tableStr.concat('\n');
  for (let i = 0; i < row; i++) {
    tableStr = tableStr.concat(new Array(column).fill().reduce((pre, value, index) => `${pre}          |`, '|'));
    tableStr = tableStr.concat('\n');
  }
  tableStr = tableStr.concat('\n');
  editor.codemirror.doc.replaceRange(tableStr, editor.codemirror.getCursor('to'));
  editor.codemirror.focus();
}

function prepareDrawTableDropdown(editor) {
  // Customized draw table action
  const drawTableMenuButton = document.querySelector('button.table[title="Table"]');
  const drawTableMenu = document.querySelector('#draw-table-popup');
  const drawTableMocked = document.querySelector('#draw-table-popup table.draw-table-mockup');
  const drawTableToggleHeaderSwitcher = drawTableMenu.querySelector('#draw-table-toggle-header');
  const drawTableFirstRow = drawTableMenu.querySelector('table.draw-table-mockup tr:first-child');
  Popper.createPopper(drawTableMenuButton, drawTableMenu, {
    placement: 'bottom-start',
  });
  drawTableMenu.parentElement.removeChild(drawTableMenu);
  drawTableMenuButton.appendChild(drawTableMenu);

  drawTableToggleHeaderSwitcher.addEventListener('change', (e) => {
    const headers = new Array(...drawTableFirstRow.querySelectorAll('th'));
    const nonHeaders = new Array(...drawTableFirstRow.querySelectorAll('td'));
    headers.forEach(el => el.style.display = drawTableToggleHeaderSwitcher.checked ? 'table-cell' : 'none');
    nonHeaders.forEach(el => el.style.display = drawTableToggleHeaderSwitcher.checked ? 'none' : 'table-cell');
  });

  // table cell click
  const mockedUpTableBody = drawTableMocked.children[0];
  const maxRowCount = mockedUpTableBody.childElementCount;
  const maxColumnCount = mockedUpTableBody.children[1].childElementCount;
  function cellInteraction (e) {
    const cell = e.target || e.srcElement, row = cell.parentElement;
    const rowCount = new Array(...mockedUpTableBody.children).indexOf(row) + 1;
    const columnCount = new Array(...row.children).filter(el => el.style.display !=='none').indexOf(cell) + 1;
    switch (e.type) {
      case 'mouseover':
        for (let x = 0; x < maxRowCount; x++) {
          for (let y = 0; y < maxColumnCount; y++) {
            const loopingRow = mockedUpTableBody.children[x];
            const element = loopingRow.children[y];
            if (x >= rowCount)  element.classList.remove('included');
            else if (y >= columnCount) element.classList.remove('included');
            else element.classList.add('included');
            // for 1st row
            if (x === 0) {
              if (y >= columnCount) loopingRow.children[y + maxColumnCount].classList.remove('included');
              else loopingRow.children[y + maxColumnCount].classList.add('included');
            }
          }
        }
        break;
      case 'click':
        console.log(`${rowCount} - ${columnCount}`);
        drawTable(editor, rowCount, columnCount, { hasHeaderRow: drawTableToggleHeaderSwitcher.checked });
        break;
    }
  };

  new Array(...mockedUpTableBody.children).forEach(row => {
    new Array(...row.children).forEach(cell => {
      cell.addEventListener('mouseover', cellInteraction)
      cell.addEventListener('click', cellInteraction)
    })
  })
}

/* Customized guide/help menu */
function prepareGuideMenu() {
  const guideMenuButton = document.querySelector('button.help[title="Help"]');
  const guideMenu = document.querySelector('#guide-popup');
  Popper.createPopper(guideMenuButton, guideMenu, {
    placement: 'bottom-start',
  });
  guideMenu.parentElement.removeChild(guideMenu);
  guideMenuButton.appendChild(guideMenu);
}



/* Other customized actions */
function newParagraph(editor) {
  editor.codemirror.doc.replaceRange('\n\n', editor.codemirror.getCursor('to'));
  editor.codemirror.focus();
}

function newLine(editor) {
  editor.codemirror.doc.replaceRange('  \n', editor.codemirror.getCursor('to'));
  editor.codemirror.focus();
}

function addTaskListExample(editor) {
  const content = '\n\n- [ ] task to finish\n- [x] finished task\n\n';
  editor.codemirror.doc.replaceRange(content, editor.codemirror.getCursor('to'));
  editor.codemirror.focus();
}

function addMultilineCodeBlock(editor) {
  const content = '\n\n\`\`\`\nAdd your codes here\n\`\`\`\n\n';
  editor.codemirror.doc.replaceRange(content, editor.codemirror.getCursor('to'));
  editor.codemirror.focus();
}

/* Control panel */
function prepareControlPanel() {
  const session_prefix = btoa('stitch_doc');
  sessionStorage[`${session_prefix}_github-domain`] = 'https://github.com';
  sessionStorage[`${session_prefix}_repository-path`] = 'SmokedSalmon/markdown_editor';
  sessionStorage[`${session_prefix}_branch`] = 'master';
  sessionStorage[`${session_prefix}_file-path`] = 'index.html';

  const doneButton = document.getElementById('copy-and-go');
  doneButton.addEventListener('click', () => {
    const githubDomain = sessionStorage[`${session_prefix}_github-domain`];
    const repositoryPath = sessionStorage[`${session_prefix}_repository-path`];
    const branch = sessionStorage[`${session_prefix}_branch`];
    const filePath = sessionStorage[`${session_prefix}_file-path`];
    const newWindow = window.open(`${githubDomain}/${repositoryPath}/edit/${branch}/${filePath}`);
    newWindow.onload = () => {
      newWindow.document.querySelector('input#commit-summary-input').value = 'Update newly edit content';
      const range = newWindow.document.createRange();
      const intervalId = setInterval(() => {
        const codeEditor = newWindow.document.getElementById('code-editor');
        if (!codeEditor) return;
        range.selectNodeContents(codeEditor);
        const sel = newWindow.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        clearInterval(intervalId);
      }, 100)
    }
  });
}

function comingSoonMessage() {
  const comingSoonAnchor = document.getElementById('coming-soon');
  const comingSoonPopup = document.getElementById('coming-soon-popup');
  comingSoonPopup.parentElement.removeChild(comingSoonPopup);
  comingSoonAnchor.appendChild(comingSoonPopup);
  Popper.createPopper(comingSoonAnchor, comingSoonPopup, {
    placement: 'top-start',
    modifiers: [{ name: 'offset', options: { offset: [0, -5] } }],
  });
}

function newLineNewParagraphTip() {
  const newLineButton = document.querySelector('button.new-line');
  const newLinePopup = document.getElementById('new-line-tip');
  Popper.createPopper(newLineButton, newLinePopup, {
    placement: 'bottom-start',
    modifiers: [{ name: 'offset', options: { offset: [0, 10] } }],
  });
  newLineButton.addEventListener('click', () => {
    newLinePopup.classList.add('visible');
    setTimeout(() => newLinePopup.classList.remove('visible'), 2000)
  })
  const newParagraphButton = document.querySelector('button.new-paragraph');
  const newParagraphPopup = document.getElementById('new-paragraph-tip');
  Popper.createPopper(newParagraphButton, newParagraphPopup, {
    placement: 'bottom-start',
    modifiers: [{ name: 'offset', options: { offset: [0, 10] } }],
  });
  newParagraphButton.addEventListener('click', () => {
    newParagraphPopup.classList.add('visible');
    setTimeout(() => newParagraphPopup.classList.remove('visible'), 2000)
  })

}