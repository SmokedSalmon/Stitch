function loadScript (url) {
  const tag = document.createElement('script');
  tag.setAttribute('src', url);
  document.head.appendChild(tag);
}

function loadStyle (url) {
  const tag = document.createElement('link');
  tag.setAttribute('rel', 'stylesheet');
  tag.setAttribute('href', url);
  document.head.appendChild(tag);
}

// relative path is based on URL
loadScript('../assets/js/easymde.min.js');
loadScript('../assets/js/popper.min.js');
loadScript('../assets/js/editor/editor_methods.js');
loadStyle('../assets/css/easymde.min.css');
loadStyle('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.9.0/css/all.min.css');

window.onload = function () {
  let editor;
  // setting up the editor
  editor = new EasyMDE({
    autoDownloadFontAwesome: false,
    element: document.getElementById('editing-area'),
    autofocus: true,
    initialValue: '# Your title\nWrite some content here',
    // placeholder: 'Type your markdown content here and preview the rendered output on the left',

    // toolbar
    toolbar: [
      {
        name: "new-line",
        action: newLine,
        className: "fa new-line",
        title: "New line",
      },
      {
        name: "new-paragraph",
        action: newParagraph,
        className: "fa new-paragraph",
        title: "New paragraph",
      }, '|',
      'bold', 'italic', 'strikethrough', 'heading', 'heading-bigger', 'heading-smaller',
      {
        name: "heading set",
        className: "fa fa-header fa-heading",
        title: "Heading set",
        children: [
          {
            name: "heading-1",
            action: EasyMDE.toggleHeading1,
            className: "fa fa-header fa-heading",
            title: "Heading 1",
          },
          {
            name: "heading-2",
            action: EasyMDE.toggleHeading2,
            className: "fa fa-header fa-heading",
            title: "Heading 2",
          },
          {
            name: "heading-3",
            action: EasyMDE.toggleHeading3,
            className: "fa fa-header fa-heading",
            title: "Heading 3",
          }
        ]
      }, '|',
      'quote', 'unordered-list', 'ordered-list',
      { name: 'task-list', action: addTaskListExample, className: 'fa fa-check-square', title: 'Task-list' }, '|',
      {
        name: "table",
        action: null,
        className: "fa fa-table draw-table",
        title: "Table",
      },
      'code',
      {
        name: 'multi-line-code-block',
        action: addMultilineCodeBlock,
        className: 'fa fa-code multiline-code-block',
        title: 'Multiline Code-block'
      },
      'link', 'image', '|',
      'preview', 'side-by-side', 'fullscreen', '|',
      {
        name: "help",
        action: null,
        className: "fa fa-question-circle",
        title: "Help",
      }
    ],

    promptURLs: true,

    sideBySideFullscreen: false,
    renderingConfig: {
      singleLineBreaks: false,
    },

    // window alert prompt upon user adding link or image, instead of inserting example content
    // promptURLs: true
  });

  prepareDrawTableDropdown(editor);

  prepareGuideMenu();

  prepareControlPanel();

  comingSoonMessage();

  newLineNewParagraphTip();

  // show side-by-side
  editor.toggleSideBySide();

  // debug only
  window.editor = editor;
}