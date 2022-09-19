const overlayStyles = `
  position: absolute;
  z-index: 1001;
  top: 0;
  left: 0;
  min-width: 100vh;
  min-height: 100vw;
  overflow: hidden;
  background-color: #060606;
`.replace(/\s+/g, '')

const gridStyles = `
  display: grid;
  height: 100vh;
  width: 100vw;
  grid-auto-rows: 1fr;
  grid-row-gap: 10px;
`.replace(/\s+/g, '')

const colStyles = `
  position: relative;
`.replace(/\s+/g, '')

const editorStyles = `
  position: absolute;
  width: 100%;
  height: 100%;
`.replace(/\s+/g, '')

let hasMainEditorBeenImported = false

export const bodyStyles = {
  overflow: 'auto'
}

export default async (sourceCodes, onChange) => {
  if (document.getElementById('str-overlay')) {
    return
  }

  const scriptNode = document.createElement('script')
  const overlayNode = document.createElement('div')

  window.scrollTo(0, 0)

  scriptNode.src = sessionStorage.getItem('str_monacoLoaderUrl')
  overlayNode.id = 'str-overlay'
  overlayNode.setAttribute('style', overlayStyles)

  document.head.appendChild(scriptNode)
  document.body.appendChild(overlayNode)

  bodyStyles.overflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  overlayNode.innerHTML = `
    <div style="${gridStyles}">
      ${sourceCodes
        .map(
          (...[, index]) => `
        <div style="${colStyles}">
          <div id="str-editor${index}" style="${editorStyles}"></div>
        </div>
      `
        )
        .join('')}
    </div>
  `

  scriptNode.addEventListener('load', () => {
    const proxy = URL.createObjectURL(
      new Blob(
        [
          `
      self.MonacoEnvironment = {
        baseUrl: '${sessionStorage.getItem('str_monacoBaseUrl')}'
      };
      importScripts('${sessionStorage.getItem('str_monacoWorkerUrl')}');
    `
        ],
        { type: 'text/javascript' }
      )
    )

    global.require.config({ paths: { vs: sessionStorage.getItem('str_monacoVsUrl') } })
    global.MonacoEnvironment = { getWorkerUrl: () => proxy }

    const editors = []

    const initEditors = () => {
      sourceCodes.forEach(({ id, code, lang }, index) => {
        editors.push(
          global.monaco.editor.create(document.getElementById(`str-editor${index}`), {
            value: code,
            language: lang,
            theme: 'vs-dark'
          })
        )

        editors[index].onDidChangeModelContent(() => {
          if (onChange) {
            onChange(editors[index], id)
          }
        })
      })
    }

    if (!hasMainEditorBeenImported) {
      global.require(['vs/editor/editor.main'], () => {
        hasMainEditorBeenImported = true
        initEditors()
      })
    } else {
      initEditors()
    }
  })
}
