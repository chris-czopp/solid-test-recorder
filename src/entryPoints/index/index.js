import generateCode from '@babel/generator'
import {
  clearDb,
  addTestFile,
  addTestCase,
  addTestStep,
  addMultipleTestSteps,
  getCurrentTestFileDescription,
  getCurrentTestCaseDescription,
  getCurrentTestCasesWithSteps,
  storeInitialRequests,
  getCurrentFileInitialRequests,
  storeCodeTemplates,
  getCodeTemplates,
  getDescribeEditString,
  getItEditString,
  applyDescribeEditString,
  applyItEditString,
  getTestFiles,
  getTestCases,
  storeCurrentTestFile,
  storeCurrentTestCase
} from './model'
import getPreferredSelector from './getPreferredSelector'
import getTestFileAst, { buildGetter } from './getTestFileAst'
import showOverlay from './showOverlay'
import closeOverlay from './closeOverlay'
import formatCode from './formatCode'

const initialRequests = []
const newRequests = []
const eventListeners = {}

const ChangeCommittee = {
  changesToCommit: {},
  actions: {
    storeCodeTemplates,
    applyDescribeEditString,
    applyItEditString,
    storeExcludedRequests: (excludedRequests) => {
      localStorage.setItem('str_excludedRequests', excludedRequests)
    }
  },
  getActionsAwaitingCommit() {
    return Object.keys(ChangeCommittee.changesToCommit)
  },
  async commit() {
    for (const actionName of ChangeCommittee.getActionsAwaitingCommit()) {
      await ChangeCommittee.actions[actionName](ChangeCommittee.changesToCommit[actionName])
      delete ChangeCommittee.changesToCommit[actionName]
    }
  }
}

const updateTestFiles = async (context) => {
  context.$files = (await getTestFiles()).reduce(
    (acc, fileId) => Object.assign(acc, { [decodeURIComponent(fileId)]: fileId }),
    {}
  )
  // eslint-disable-next-line no-proto
  context.$files.__proto__ = null
}

const updateTestCases = async (context) => {
  context.$cases = (await getTestCases()).reduce(
    (acc, testCaseId) => Object.assign(acc, { [decodeURIComponent(testCaseId)]: testCaseId }),
    {}
  )
  // eslint-disable-next-line no-proto
  context.$cases.__proto__ = null
}

const reloadTestRecorder = async () => {
  const selectedElement = document.querySelector('[data-str-selected-element]')

  if (!selectedElement) {
    window.$str = {}
  }

  const context = window.$str

  context.config = {}
  context.expect = {}
  context.capture = {}
  context.use = {}
  context.$requests = context.$requests || {}

  updateTestFiles(context)
  updateTestCases(context)

  const preferredSelector = getPreferredSelector(selectedElement)

  if (preferredSelector) {
    selectedElement.setAttribute('data-str-selectable', 1)
    ;(async () => {
      const ast = buildGetter(preferredSelector)

      console.log('can be selected by:')
      console.log(
        generateCode({
          type: 'Program',
          body: [ast]
        }).code
      )
    })()
  }

  !Object.prototype.hasOwnProperty.call(context.config, 'codeTemplates') &&
    Object.defineProperty(context.config, 'codeTemplates', {
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      get() {
        (async () => {
          const codeTemplates = await getCodeTemplates()

          showOverlay(
            [
              {
                id: 'imports',
                lang: 'javascript',
                code: formatCode(codeTemplates.imports)
              },
              {
                id: 'mocks',
                lang: 'javascript',
                code: formatCode(codeTemplates.mocks)
              },
              {
                id: 'componentRenderer',
                lang: 'javascript',
                code: formatCode(codeTemplates.componentRenderer)
              }
            ],
            (editor, id) => {
              codeTemplates[id] = editor.getValue()
              ChangeCommittee.changesToCommit.storeCodeTemplates = codeTemplates
            }
          )
        })()

        return 'done'
      }
    })

  !Object.prototype.hasOwnProperty.call(context.config, 'excludedRequests') &&
    Object.defineProperty(context.config, 'excludedRequests', {
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      get() {
        (async () => {
          const excludedRequests = JSON.parse(localStorage.getItem('str_excludedRequests')) || []

          showOverlay(
            [
              {
                id: 'excludedRequests',
                lang: 'json',
                code: JSON.stringify(excludedRequests, undefined, 2)
              }
            ],
            (editor) => {
              ChangeCommittee.changesToCommit.storeExcludedRequests = editor.getValue()
            }
          )
        })()

        return 'done'
      }
    })

  !Object.prototype.hasOwnProperty.call(context, 'describe') &&
    Object.defineProperty(context, 'describe', {
      set(value) {
        (async () => {
          await addTestFile(value)
          updateTestFiles(context)
        })()

        if (initialRequests.length === 0) {
          initialRequests.push(...newRequests)
          storeInitialRequests(value, initialRequests)
        }
      },
      get() {
        return 'set test file description...'
      }
    })

  !Object.prototype.hasOwnProperty.call(context, 'it') &&
    Object.defineProperty(context, 'it', {
      set(value) {
        (async () => {
          await addTestCase(value)
          updateTestCases(context)
        })()
      },
      get() {
        return 'set case description...'
      }
    })
  ;[
    'toBeChecked',
    'toBeDisabled',
    'toBeEmptyDOMElement',
    'toBeInTheDocument',
    'toBeInvalid',
    'toBePartiallyChecked',
    'toBeRequired',
    'toBeVisible',
    'toHaveFocus',
    'toMatchSnapshot'
  ].forEach((expectVerb) => {
    !Object.prototype.hasOwnProperty.call(context.expect, expectVerb) &&
      Object.defineProperty(context.expect, expectVerb, {
        set(value) {
          const preferredSelector = getPreferredSelector(selectedElement)

          if (preferredSelector) {
            addTestStep({
              type: expectVerb,
              isNegated: !value,
              selector: preferredSelector
            })
          } else {
            console.log(
              "Couldn't match the element. You may need to change this element to be selectable by Testing Library"
            )
          }
        },
        get() {
          return `set expect.${expectVerb} to either true or false...`
        }
      })
  })
  ;[
    'toContainHTML',
    'toHaveAccessibleDescription',
    'toHaveAccessibleName',
    'toHaveAttribute',
    'toHaveClass',
    'toHaveDisplayValue',
    'toHaveErrorMessage',
    'toHaveFormValues',
    'toHaveStyle',
    'toHaveTextContent',
    'toHaveValue'
  ].forEach((expectVerb) => {
    !Object.prototype.hasOwnProperty.call(context.expect, expectVerb) &&
      Object.defineProperty(context.expect, expectVerb, {
        set(value) {
          const preferredSelector = getPreferredSelector(selectedElement)

          if (preferredSelector) {
            addTestStep({
              type: expectVerb,
              isNegated: Array.isArray(value) ? !value[0] : false,
              selector: preferredSelector,
              value: Array.isArray(value) ? value[1] : value
            })
          } else {
            console.log(
              "Couldn't match the element. You may need to change this element to be selectable by Testing Library"
            )
          }
        },
        get() {
          return `set expect.${expectVerb} to either <mixed value> or [true|false, <mixed value>]...`
        }
      })
  })

  for (const e in window) {
    if (/^on/.test(e)) {
      const type = e.replace(/^on/, '')

      !Object.prototype.hasOwnProperty.call(context.capture, type) &&
        Object.defineProperty(context.capture, type, {
          set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
          get() {
            if (eventListeners[type]) {
              document.body.removeEventListener(type, eventListeners[type])
            }

            const eventHandler = (() => {
              let debounceTimeout

              return (e) => {
                let target = e.target
                let preferredSelector = getPreferredSelector(target)

                if (type === 'click' && !preferredSelector) {
                  while (target.parentNode) {
                    target = target.parentNode
                    preferredSelector = getPreferredSelector(target)

                    if (preferredSelector) {
                      break
                    }
                  }
                }

                if (!preferredSelector) {
                  return
                }

                newRequests.length = 0

                if (debounceTimeout) {
                  clearTimeout(debounceTimeout)
                }

                debounceTimeout = setTimeout(() => {
                  addTestStep({
                    type: 'event',
                    event: type,
                    value: target.value,
                    selector: preferredSelector
                  })

                  debounceTimeout = undefined
                }, 1000)
              }
            })()

            document.body.addEventListener(type, eventHandler)

            eventListeners[type] = eventHandler

            const interval = setInterval(() => {
              console.log('waiting for $str.stopCapturing...')
            }, 2000)

            delete context.stopCapturing

            Object.defineProperty(context, 'stopCapturing', {
              configurable: true,
              set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
              get() {
                clearInterval(interval)

                addMultipleTestSteps(
                  newRequests.map((uri) => ({
                    type: 'waitFor',
                    uri
                  }))
                )

                delete context.stopCapturing

                return 'event capturing stopped'
              }
            })

            return 'event capturing started'
          }
        })
    }
  }

  !Object.prototype.hasOwnProperty.call(context, 'seeResult') &&
    Object.defineProperty(context, 'seeResult', {
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      get() {
        const testState = JSON.parse(sessionStorage.getItem('str_testState')) || {
          spies: []
        }

        ;(async () => {
          const codeTemplates = await getCodeTemplates()
          const code = generateCode(
            getTestFileAst({
              codeTemplates,
              description: (await getCurrentTestFileDescription()) || undefined,
              initialRequests: await getCurrentFileInitialRequests(),
              tests: await getCurrentTestCasesWithSteps()
            })
          ).code

          const formattedCode = formatCode(code)

          showOverlay([
            {
              lang: 'javascript',
              code: formattedCode
            },
            {
              lang: 'json',
              code: JSON.stringify(testState.mockFile, undefined, 2)
            }
          ])
        })()

        return 'done'
      }
    })

  !Object.prototype.hasOwnProperty.call(context, 'clear') &&
    Object.defineProperty(context, 'clear', {
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      get() {
        clearDb()

        return 'done'
      }
    })

  !Object.prototype.hasOwnProperty.call(context, 'closeEditor') &&
    Object.defineProperty(context, 'closeEditor', {
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      get() {
        if (!closeOverlay()) {
          return 'no editor to close'
        }

        return 'done'
      }
    })

  !Object.prototype.hasOwnProperty.call(context, 'applyChanges') &&
    Object.defineProperty(context, 'applyChanges', {
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      get() {
        closeOverlay()

        if (ChangeCommittee.getActionsAwaitingCommit().length === 0) {
          return 'no changes to apply'
        }

        ChangeCommittee.commit()

        return 'done'
      }
    })

  !Object.prototype.hasOwnProperty.call(context, 'editTest') &&
    Object.defineProperty(context, 'editTest', {
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      get() {
        (async () => {
          showOverlay(
            [
              {
                id: 'describe',
                lang: 'json',
                code: await getDescribeEditString()
              },
              {
                id: 'it',
                lang: 'json',
                code: await getItEditString()
              }
            ],
            (editor, id) => {
              ChangeCommittee.changesToCommit[{ describe: 'applyDescribeEditString', it: 'applyItEditString' }[id]] =
                editor.getValue()
            }
          )
        })()

        return 'done'
      }
    })

  !Object.prototype.hasOwnProperty.call(context.use, 'file') &&
    Object.defineProperty(context.use, 'file', {
      set(value) {
        if (!context.$files[decodeURIComponent(value)]) {
          console.log(`Couldn't find the test file: '${value}'`)
          return
        }

        storeCurrentTestFile(value)
      },
      get() {
        return 'set active test file from $str.$files'
      }
    })

  !Object.prototype.hasOwnProperty.call(context.use, 'case') &&
    Object.defineProperty(context.use, 'case', {
      set(value) {
        if (!context.$cases[decodeURIComponent(value)]) {
          console.log(`Couldn't find the test case: '${value}'`)
          return
        }

        storeCurrentTestCase(value)
      },
      get() {
        return 'set active test case from $str.$cases'
      }
    })

  !Object.prototype.hasOwnProperty.call(context, 'help') &&
    Object.defineProperty(context, 'help', {
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      get() {
        (async () => {
          console.table([
            ['Active test file', await getCurrentTestFileDescription()],
            ['Active test case', `${await getCurrentTestCaseDescription()}`],
            ['=====', '====='],
            ['# Test cases:', '🠗'],
            ...JSON.parse(await getDescribeEditString()).map((line) => ['🠖', line]),
            ['=====', '====='],
            ['# Test steps:', '🠗'],
            ...JSON.parse(await getItEditString()).map((line) => ['🠖', line]),
            ['=====', '====='],
            ['# Available commands:', '🠗'],
            ['$str.config.codeTemplates', 'allows to edit the code template used when generation test file'],
            ['$str.config.excludedRequests', 'allows to specify list of URLs to ignore when capturing requests'],
            ['$str.describe', 'creates a new test file with a given description'],
            ['$str.it', 'creates a new test case with a given description'],
            ['$str.expect.*', 'adds a new asser on a currently selected element'],
            ['$str.capture.*', 'starts event capturing i.e. auto-generation user events and subsequent requests'],
            ['$str.stopCapturing', 'stops event capturing'],
            ['$str.seeResult', 'opens editor with a generated test file and request mocks'],
            [
              '$str.editTest',
              'allows to reposition or remove test cases and test steps and setting their active cursors'
            ],
            ['$str.use.file', 'allows to switch to a given test file'],
            ['$str.use.case', 'allows to switch to a given test case'],
            ['=====', '====='],
            ['## Controlling editor:', '🠗'],
            ['$str.applyChanges', 'saves changes and closes editor(s)'],
            ['$str.closeEditor', 'discards any changes and closes editor(s)'],
            ['=====', '====='],
            ['## Data collections:', '🠗'],
            ['$str.$requests', 'captured HTTP requests'],
            ['$str.$files', 'test files'],
            ['$str.$cases', 'test cases']
          ])
        })()

        return 'Solid Test Recorder'
      }
    })

  // eslint-disable-next-line no-proto
  context.__proto__ = null
  // eslint-disable-next-line no-proto
  context.config.__proto__ = null
  // eslint-disable-next-line no-proto
  context.expect.__proto__ = null
  // eslint-disable-next-line no-proto
  context.capture.__proto__ = null
  // eslint-disable-next-line no-proto
  context.use.__proto__ = null
}

global.reloadTestRecorder = reloadTestRecorder

let debounceTimeout

window.addEventListener('message', (e) => {
  if (e.data.type !== 'str_requestsUpdated') {
    return
  }

  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }

  debounceTimeout = setTimeout(() => {
    const testState = JSON.parse(sessionStorage.getItem('str_testState')) || {
      mockFile: {},
      spies: []
    }
    const { spies } = testState
    const requests = spies.reduce(
      (acc, { method, status, url }) =>
        Object.assign(acc, { [`${status} ${method} ${url}`]: `${status} ${method} ${url}` }),
      {}
    )

    window.$str = window.$str || {
      $requests: {}
    }

    spies.forEach(({ method, status, url }) => {
      const uri = `${status} ${method} ${url}`

      if (!newRequests.includes(uri) && !window.$str.$requests[uri]) {
        newRequests.push(uri)
      }
    })

    Object.assign(window.$str.$requests, requests)

    // eslint-disable-next-line no-proto
    window.$str.$requests.__proto__ = null
    debounceTimeout = undefined
  }, 500)
})

reloadTestRecorder()
