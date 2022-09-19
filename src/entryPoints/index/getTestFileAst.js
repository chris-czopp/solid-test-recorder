import { parse as parseCode } from '@babel/parser'

const passAssertionThroughNegation = (isNegated, ast) =>
  isNegated
    ? {
        type: 'MemberExpression',
        computed: false,
        object: {
          ...ast,
          property: {
            ...ast.property,
            name: 'not'
          }
        },
        property: {
          type: 'Identifier',
          name: ast.property.name
        }
      }
    : ast

export const buildGetter = (selector) => ({
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    computed: false,
    object: {
      type: 'Identifier',
      name: 'screen'
    },
    property: {
      type: 'Identifier',
      name: `get${selector.type[0].toUpperCase()}${selector.type.slice(1)}`
    }
  },
  arguments: [
    ...(['byAltText', 'byDisplayValue', 'byLabelText', 'byPlaceholderText', 'byRole', 'byTestId', 'byText'].includes(
      selector.type
    )
      ? [
          {
            type: 'StringLiteral',
            value: {
              byAltText: selector.altText,
              byDisplayValue: selector.displayValue,
              byLabelText: selector.labelText,
              byPlaceholderText: selector.placeholder,
              byRole: selector.role,
              byTestId: selector.testId,
              byText: selector.text
            }[selector.type]
          }
        ]
      : []),
    ...(!['byAltText', 'byDisplayValue', 'byLabelText', 'byPlaceholderText', 'byTestId'].includes(selector.type)
      ? [
          {
            type: 'ObjectExpression',
            properties: [
              ...(selector.type === 'byRole' && (selector.role !== 'heading' || !selector.level) && selector.text
                ? [
                    {
                      type: 'ObjectProperty',
                      key: {
                        type: 'Identifier',
                        name: 'name'
                      },
                      computed: false,
                      value: {
                        type: 'StringLiteral',
                        value: selector.text
                      },
                      kind: 'init',
                      method: false,
                      shorthand: false
                    }
                  ]
                : []),
              ...(selector.type === 'byRole' && selector.role === 'heading' && selector.level
                ? [
                    {
                      type: 'ObjectProperty',
                      key: {
                        type: 'Identifier',
                        name: 'level'
                      },
                      computed: false,
                      value: {
                        type: 'StringLiteral',
                        value: selector.level
                      },
                      kind: 'init',
                      method: false,
                      shorthand: false
                    }
                  ]
                : []),
              ...(selector.type === 'byText' ||
              (selector.type === 'byRole' && (selector.role !== 'heading' || !selector.level) && selector.text)
                ? [
                    {
                      type: 'ObjectProperty',
                      key: {
                        type: 'Identifier',
                        name: 'exact'
                      },
                      computed: false,
                      value: {
                        type: 'BooleanLiteral',
                        value: false
                      },
                      kind: 'init',
                      method: false,
                      shorthand: false
                    }
                  ]
                : [])
            ]
          }
        ]
      : [])
  ]
})

const buildAssertion = ({ assertionName, assertionValue, isNegated, selector }) => ({
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: passAssertionThroughNegation(isNegated, {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'expect'
        },
        arguments: [buildGetter(selector)]
      },
      property: {
        type: 'Identifier',
        name: assertionName
      }
    }),
    arguments: [
      ...([
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
      ].includes(assertionName)
        ? [
            {
              type: 'StringLiteral',
              value: assertionValue
            }
          ]
        : [])
    ]
  }
})

const buildWaitFor = (uri) => ({
  type: 'ExpressionStatement',
  expression: {
    type: 'AwaitExpression',
    argument: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'waitFor'
      },
      arguments: [
        {
          type: 'ArrowFunctionExpression',
          id: null,
          params: [],
          body: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              computed: false,
              object: {
                type: 'CallExpression',
                callee: {
                  type: 'Identifier',
                  name: 'expect'
                },
                arguments: [
                  {
                    type: 'CallExpression',
                    callee: {
                      type: 'Identifier',
                      name: 'getRequestSpy'
                    },
                    arguments: [
                      {
                        type: 'StringLiteral',
                        value: uri
                      }
                    ]
                  }
                ]
              },
              property: {
                type: 'Identifier',
                name: 'toHaveBeenCalledTimes'
              }
            },
            arguments: [
              {
                type: 'StringLiteral',
                value: 1
              }
            ]
          },
          generator: false,
          expression: true,
          async: false
        }
      ]
    }
  }
})

const buildEvent = ({ eventType, selector, value }) => ({
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'Identifier',
        name: 'fireEvent'
      },
      property: {
        type: 'Identifier',
        name: eventType
      }
    },
    arguments: [
      buildGetter(selector),
      ...(value
        ? [
            {
              type: 'ObjectExpression',
              properties: [
                {
                  type: 'ObjectProperty',
                  key: {
                    type: 'Identifier',
                    name: 'target'
                  },
                  computed: false,
                  value: {
                    type: 'ObjectExpression',
                    properties: [
                      {
                        type: 'ObjectProperty',
                        key: {
                          type: 'Identifier',
                          name: 'value'
                        },
                        computed: false,
                        value: {
                          type: 'StringLiteral',
                          value
                        },
                        kind: 'init',
                        method: false,
                        shorthand: false
                      }
                    ]
                  },
                  kind: 'init',
                  method: false,
                  shorthand: false
                }
              ]
            }
          ]
        : [])
    ]
  }
})

export const buildStep = (step) =>
  new Proxy(
    {
      assert: () =>
        buildAssertion({
          assertionName: step.type,
          assertionValue: step.value,
          isNegated: step.isNegated,
          selector: step.selector
        }),
      event: () =>
        buildEvent({
          eventType: step.event,
          selector: step.selector,
          value: step.value
        }),
      waitFor: () => buildWaitFor(step.uri)
    },
    {
      get: (target, key) => (target[key] || target.assert)()
    }
  )[step.type]

const combineTestBody = (componentRendererAst, stepsAst) => {
  const statements = [
    {
      type: 'ExpressionStatement',
      expression: {
        type: 'AwaitExpression',
        argument: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'waitForInitialRequests'
          },
          arguments: []
        }
      }
    },
    ...stepsAst
  ]

  const assertIndicatorIndex = componentRendererAst.findIndex(
    ({ type, expression }) =>
      type === 'ExpressionStatement' && expression.type === 'Identifier' && expression.name === '__ASSERTS__'
  )

  if (assertIndicatorIndex === -1) {
    return [...componentRendererAst, ...statements]
  }

  return [
    ...componentRendererAst.slice(0, assertIndicatorIndex),
    ...statements,
    ...componentRendererAst.slice(assertIndicatorIndex + 1)
  ]
}

export default ({ codeTemplates, initialRequests, description, tests } = {}) => ({
  type: 'Program',
  body: [
    ...JSON.parse(
      JSON.stringify(parseCode(codeTemplates.imports, { sourceType: 'module', attachComment: false, plugins: ['jsx'] }))
    ).program.body,
    ...JSON.parse(
      JSON.stringify(parseCode(codeTemplates.mocks, { sourceType: 'module', attachComment: false, plugins: ['jsx'] }))
    ).program.body,
    {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'describe'
        },
        arguments: [
          {
            type: 'StringLiteral',
            value: description
          },
          {
            type: 'ArrowFunctionExpression',
            id: null,
            params: [],
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'VariableDeclaration',
                  kind: 'const',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: {
                        type: 'Identifier',
                        name: 'waitForInitialRequests'
                      },
                      init: {
                        type: 'ArrowFunctionExpression',
                        id: null,
                        params: [],
                        body: {
                          type: 'BlockStatement',
                          body: initialRequests.map(buildWaitFor)
                        },
                        generator: false,
                        expression: false,
                        async: true
                      }
                    }
                  ]
                },
                ...tests.map((test) => ({
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'CallExpression',
                    callee: {
                      type: 'Identifier',
                      name: 'it'
                    },
                    arguments: [
                      {
                        type: 'StringLiteral',
                        value: test.description
                      },
                      {
                        type: 'ArrowFunctionExpression',
                        id: null,
                        params: [],
                        body: {
                          type: 'BlockStatement',
                          body: [
                            ...combineTestBody(
                              JSON.parse(
                                JSON.stringify(
                                  parseCode(codeTemplates.componentRenderer, {
                                    sourceType: 'module',
                                    attachComment: false,
                                    plugins: ['jsx']
                                  })
                                )
                              ).program.body,
                              test.steps.map(buildStep)
                            )
                          ]
                        },
                        generator: false,
                        expression: false,
                        async: true
                      }
                    ]
                  }
                }))
              ]
            },
            generator: false,
            expression: false,
            async: false
          }
        ]
      }
    }
  ],
  sourceType: 'module'
})
