import { getQueriesForElement } from '@testing-library/dom'
import availableRoles from './roles.json'

export default (node) => {
  const {
    queryByAltText,
    queryByPlaceholderText,
    queryByDisplayValue,
    queryByTestId,
    queryByLabelText,
    queryByText,
    queryByRole
  } = getQueriesForElement(document.body)

  try {
    if (node.hasAttribute('alt') && queryByAltText(node.getAttribute('alt')) === node) {
      return {
        type: 'byAltText',
        altText: node.getAttribute('alt')
      }
    }
  } catch (err) {}

  try {
    if (node.hasAttribute('placeholder') && queryByPlaceholderText(node.getAttribute('placeholder')) === node) {
      return {
        type: 'byPlaceholderText',
        placeholder: node.getAttribute('aria-placeholder') || node.getAttribute('placeholder')
      }
    }
  } catch (err) {}

  try {
    if (node.value && queryByDisplayValue(node.value) && !['checkbox', 'radio'].includes(node.getAttribute('type'))) {
      return {
        type: 'byDisplayValue',
        displayValue: node.value
      }
    }
  } catch (err) {}

  try {
    if (node.hasAttribute('data-testid')) {
      const testIdAttr = node.getAttribute('data-testid')

      if (queryByTestId(testIdAttr)) {
        return {
          type: 'byTestId',
          testId: testIdAttr
        }
      }
    }
  } catch (err) {}

  try {
    if (node.closest('label')) {
      const labelText = node.closest('label').textContent.trim()

      if (queryByLabelText(labelText) === node) {
        return {
          type: 'byLabelText',
          labelText
        }
      }
    }
  } catch (err) {}

  try {
    if (node.hasAttribute('id')) {
      const labelText = document.querySelector(`[for=${node.getAttribute('id')}]`).textContent.trim()

      if (queryByLabelText(labelText) === node) {
        return {
          type: 'byLabelText',
          labelText
        }
      }
    }
  } catch (err) {}

  try {
    if (node.hasAttribute('aria-labelledby')) {
      const labelText = document.querySelector(`#${node.getAttribute('aria-labelledby')}`).textContent.trim()

      if (queryByLabelText(labelText) === node) {
        return {
          type: 'byLabelText',
          labelText
        }
      }
    }
  } catch (err) {}

  try {
    if (node.hasAttribute('aria-label')) {
      const labelText = node.getAttribute('aria-label')

      if (queryByLabelText(labelText) === node) {
        return {
          type: 'byLabelText',
          labelText
        }
      }
    }
  } catch (err) {}

  try {
    if (node.closest('h1,h2,h3,h4,h5,h6')) {
      const level = Number(node.nodeName.replace(/^H/, ''))

      if (queryByRole('heading', { level })) {
        return {
          type: 'byRole',
          level,
          role: 'heading'
        }
      }
    }
  } catch (err) {}

  for (const role of availableRoles) {
    try {
      const text = node.textContent.trim()
      const options = {
        ...(!['checkbox', 'radio'].includes(node.getAttribute('type')) ? { name: text } : {}),
        exact: false
      }

      if (queryByRole(role, options) === node) {
        return {
          type: 'byRole',
          text,
          role
        }
      }
    } catch (err) {}
  }

  try {
    if (queryByText(node.textContent, { exact: false })) {
      return {
        type: 'byText',
        text: node.textContent
      }
    }
  } catch (err) {}

  return null
}
