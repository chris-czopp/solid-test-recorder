const notifyElementSelection = () => {
  window.$str = window.$str || {
    $requests: {}
  }

  return {
    __proto__: null,
    selected: $0 // eslint-disable-line no-undef
  }
}

chrome.devtools.panels.elements.createSidebarPane('Solidjs Test Recorder', (sidebar) => {
  const updateSidebar = () => {
    sidebar.setExpression(`(${notifyElementSelection.toString()})()`)
  }

  updateSidebar()
  chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
    chrome.devtools.inspectedWindow.eval('setSelectedElement($0)', { useContentScriptContext: true })
    updateSidebar()
  })
})

chrome.devtools.network.onRequestFinished.addListener((e) => {
  if (!e?.request?.url) {
    return
  }

  if (
    e.response.headers.find(
      ({ name, value }) => name.toLowerCase() === 'content-type' && /application\/json/.test(value)
    ) ||
    e.request.headers.find(({ name, value }) => name.toLowerCase() === 'accept' && /application\/json/.test(value))
  ) {
    e.getContent((body) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let parsedBody

        try {
          parsedBody = JSON.parse(body)
        } catch (err) {
          parsedBody = body
        }

        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'str_requestFinished',
          method: e.request.method,
          url: e.request.url,
          body: parsedBody,
          headers: e.response.headers,
          status: e.response.status
        })
      })
    })
  }
})
