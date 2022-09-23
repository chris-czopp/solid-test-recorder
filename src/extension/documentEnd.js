// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const setSelectedElement = (selectedNode) => {
  const prevSelectedNode = document.querySelector('[data-str-selected-element]')
  const prevScriptNode = document.querySelector('body [data-str-script]')
  const newScriptNode = document.createElement('script')

  if (prevSelectedNode) {
    prevSelectedNode.removeAttribute('data-str-selected-element')
    prevSelectedNode.removeAttribute('data-str-selectable')
  }

  selectedNode.setAttribute('data-str-selected-element', true)
  newScriptNode.setAttribute('data-str-script', true)
  newScriptNode.src = chrome.runtime.getURL('objectReloader.js')

  if (prevScriptNode) {
    prevScriptNode.replaceWith(newScriptNode)
    return
  }

  document.body.appendChild(newScriptNode)
}

const headNode = document.querySelector('head')
const scriptHeadNode = document.createElement('script')
const styleNode = document.createElement('style')
const styleContent = document.createTextNode(`
  [data-str-selected-element] {
    outline: 1px dashed orange;
    outline-offset: -1px;
  }
  [data-str-selectable] {
    outline: 1px dashed green;
  }
`)

const monacoLoaderUrl = chrome.runtime.getURL('monaco-editor/min/vs/loader.js')
const monacoWorkerUrl = chrome.runtime.getURL('monaco-editor/min/vs/base/worker/workerMain.js')
const [monacoBaseUrl] = monacoLoaderUrl.match(/^.+\/min\//)
const [monacoVsUrl] = monacoLoaderUrl.match(/^.+\/vs/)

scriptHeadNode.setAttribute('data-str-script', true)
scriptHeadNode.src = chrome.runtime.getURL('bundles/index-1.js')

styleNode.setAttribute('data-str-style', true)
styleNode.appendChild(styleContent)

headNode.appendChild(scriptHeadNode)
headNode.appendChild(styleNode)

sessionStorage.setItem('str_monacoLoaderUrl', monacoLoaderUrl)
sessionStorage.setItem('str_monacoWorkerUrl', monacoWorkerUrl)
sessionStorage.setItem('str_monacoBaseUrl', monacoBaseUrl)
sessionStorage.setItem('str_monacoVsUrl', monacoVsUrl)
