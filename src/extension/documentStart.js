const requests = []
let debounceTimeout

sessionStorage.removeItem('str_testState')

chrome.runtime.onMessage.addListener((req) => {
  if (req.type !== 'str_requestFinished') {
    return
  }

  requests.push(req)

  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }

  debounceTimeout = setTimeout(() => {
    const testState = JSON.parse(sessionStorage.getItem('str_testState')) || {
      mockFile: {},
      spies: []
    }

    const baseApiUrl = localStorage.getItem('str_baseApiUrl') || ''
    const excludedRequests = JSON.parse(localStorage.getItem('str_excludedRequests')) || []

    for (const request of requests) {
      const url = new URL(request.url)

      const urlPath = baseApiUrl ? url.pathname.replace(new RegExp(`^${baseApiUrl}`), '') : url.pathname
      const urlFullPath = `${url.pathname}${url.search}${/\?$/.test(request.url) ? '?' : ''}`
      const urlFullPathMinusBase = `${urlPath}${url.search}${/\?$/.test(request.url) ? '?' : ''}`

      if (excludedRequests.find((urlPattern) => new RegExp(`^${urlPattern}`, 'i').test(urlFullPathMinusBase))) {
        continue
      }

      testState.mockFile[`${request.status} ${request.method} ${urlFullPath}`] = request.body

      if (!testState.spies.find(({ url, method }) => url === urlFullPathMinusBase && method === request.method)) {
        testState.spies.push({ method: request.method, status: request.status, url: urlFullPathMinusBase })
      }
    }

    sessionStorage.setItem('str_testState', JSON.stringify(testState))
    window.postMessage({ type: 'str_requestsUpdated' })

    debounceTimeout = undefined
    requests.length = 0
  }, 500)
})
