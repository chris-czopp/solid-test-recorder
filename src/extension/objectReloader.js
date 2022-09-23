(() => {
  try {
    if (!window.reloadTestRecorder) {
      delete window.global
      return
    }

    window.reloadTestRecorder()
    delete window.global
  } catch (err) {
    console.log(err)
  }
})()
