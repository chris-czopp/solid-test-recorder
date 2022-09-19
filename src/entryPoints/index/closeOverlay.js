import { bodyStyles } from './showOverlay'

export default () => {
  const existingOverlayNode = document.getElementById('str-overlay')

  if (!existingOverlayNode || !window?.monaco?.editor) {
    return false
  }

  window.monaco.editor.getModels().forEach((model) => {
    model.dispose()
  })

  existingOverlayNode.remove()
  document.body.style.overflow = bodyStyles.overflow

  return true
}
