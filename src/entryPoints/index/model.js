import { openDB } from 'idb'
import generateCode from '@babel/generator'
import { buildStep } from './getTestFileAst'

const DB_NAME = 'str_tests'
const DB_VERSION = 1

const getCurrentDescribeCursor = async (db) => db.get(DB_NAME, 'currentDescribeCursor')

const storeCurrentDescribeCursor = async (store, position) =>
  store.put(position === -1 ? null : position, 'currentDescribeCursor')

const getCurrentItCursor = async (db) => db.get(DB_NAME, 'currentItCursor')

const storeCurrentItCursor = async (store, position) => store.put(position === -1 ? null : position, 'currentItCursor')

export const clearDb = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  for (const key of await db.getAllKeys(DB_NAME)) {
    if (!/^_/.test(key)) {
      await db.delete(DB_NAME, key)
    }
  }

  db.close()
}

export const storeCodeTemplates = async (codeTemplates) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  await store.put(codeTemplates, '_codeTemplates')
  await transaction.done

  db.close()
}

export const getCodeTemplates = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const codeTemplates = (await db.get(DB_NAME, '_codeTemplates')) || {
    imports: `
// imports
import { describe, expect, test as it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from 'solid-testing-library'
import { getRequestSpy } from 'rootPath/setupVitest'
import { SomeComponent } from './some-component'
`.trim(),
    mocks: `
// mocks, use vi.mock()
`.trim(),
    componentRenderer: `
// component renderer
const initialProps = {};
const { unmount } = render(() => <SomeComponent {...initialProps} />)

__ASSERTS__

unmount()
`.trim()
  }

  db.close()

  return codeTemplates
}

export const storeCurrentTestFile = async (currentTestFile) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  await store.put(currentTestFile, 'currentTestFile')
  await transaction.done

  db.close()
}

export const addTestFile = async (description) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const testFiles = (await db.get(DB_NAME, 'testFiles')) || []
  const testFileId = encodeURIComponent(description)
  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  testFiles.push(testFileId)

  await store.put(description, `${testFileId}_describe`)
  await store.put(testFileId, 'currentTestFile')
  await store.put(testFiles, 'testFiles')
  await transaction.done

  db.close()
}

export const getCurrentTestFileDescription = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestFile = await db.get(DB_NAME, 'currentTestFile')
  const description = await db.get(DB_NAME, `${currentTestFile}_describe`)

  db.close()

  return description
}

export const getCurrentTestCaseDescription = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestFile = await db.get(DB_NAME, 'currentTestCase')
  const description = await db.get(DB_NAME, `${currentTestFile}_it`)

  db.close()

  return description
}

export const getTestFiles = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const testFiles = (await db.get(DB_NAME, 'testFiles')) || []

  db.close()

  return testFiles
}

export const storeInitialRequests = async (description, initialRequests) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  await store.put(initialRequests, `${encodeURIComponent(description)}_initialRequests`)
  await transaction.done

  db.close()
}

export const getCurrentFileInitialRequests = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestFile = await db.get(DB_NAME, 'currentTestFile')
  const initialRequests = (await db.get(DB_NAME, `${currentTestFile}_initialRequests`)) || []

  db.close()

  return initialRequests
}

export const storeCurrentTestCase = async (currentTestCase) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  await store.put(currentTestCase, 'currentTestCase')
  await transaction.done

  db.close()
}

export const addTestCase = async (description) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestFile = await db.get(DB_NAME, 'currentTestFile')
  const testCases = (await db.get(DB_NAME, `${currentTestFile}_testCases`)) || []
  const testCaseId = `${currentTestFile}_${encodeURIComponent(description)}`
  const currentDescribeCursor = await getCurrentDescribeCursor(db)

  testCases.splice(currentDescribeCursor || testCases.length, 0, testCaseId)

  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  await store.put(description, `${testCaseId}_it`)
  await store.put(testCaseId, 'currentTestCase')
  await store.put(testCases, `${currentTestFile}_testCases`)
  await storeCurrentDescribeCursor(store, currentDescribeCursor ? currentDescribeCursor + 1 : testCases.length)
  await transaction.done

  db.close()
}

export const getTestCases = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestFile = await db.get(DB_NAME, 'currentTestFile')
  const testCases = (await db.get(DB_NAME, `${currentTestFile}_testCases`)) || []

  db.close()

  return testCases
}

export const getCurrentTestCasesWithSteps = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestFile = await db.get(DB_NAME, 'currentTestFile')
  const testCases = (await db.get(DB_NAME, `${currentTestFile}_testCases`)) || []

  const testCasesWithSteps = await Promise.all(
    testCases.map(async (testCaseId) => ({
      description: await db.get(DB_NAME, `${testCaseId}_it`),
      steps: (await db.get(DB_NAME, `${testCaseId}_steps`)) || []
    }))
  )

  db.close()

  return testCasesWithSteps
}

export const addTestStep = async (testStep) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestCase = await db.get(DB_NAME, 'currentTestCase')
  const testSteps = (await db.get(DB_NAME, `${currentTestCase}_steps`)) || []
  const currentItCursor = await getCurrentItCursor(db)

  testSteps.splice(currentItCursor || testSteps.length, 0, testStep)

  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  await store.put(testSteps, `${currentTestCase}_steps`)
  await storeCurrentItCursor(store, currentItCursor ? currentItCursor + 1 : testSteps.length)
  await transaction.done

  db.close()
}

export const addMultipeTestSteps = async (testSteps) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestCase = await db.get(DB_NAME, 'currentTestCase')
  const currentTestSteps = (await db.get(DB_NAME, `${currentTestCase}_steps`)) || []
  const currentItCursor = await getCurrentItCursor(db)

  currentTestSteps.splice(currentItCursor || currentTestSteps.length, 0, ...testSteps)

  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  await store.put(currentTestSteps, `${currentTestCase}_steps`)
  await storeCurrentItCursor(store, currentItCursor ? currentItCursor + testSteps.length : currentTestSteps.length)
  await transaction.done

  db.close()
}

export const getDescribeEditString = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestFile = await db.get(DB_NAME, 'currentTestFile')
  const testCases = (await db.get(DB_NAME, `${currentTestFile}_testCases`)) || []
  const editString = await Promise.all(
    testCases.map(async (testCaseId, index) => `#${index} ${await db.get(DB_NAME, `${testCaseId}_it`)}`)
  )

  editString.splice((await getCurrentDescribeCursor(db)) || editString.length, 0, '^')

  db.close()

  return JSON.stringify(editString, undefined, 2)
}

export const applyDescribeEditString = async (editString) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestFile = await db.get(DB_NAME, 'currentTestFile')
  const testCases = (await db.get(DB_NAME, `${currentTestFile}_testCases`)) || []
  const editArray = JSON.parse(editString)
  const rearrangedTestCases = []
  const rewrittenIndexes = editArray.map((line) => parseInt(line.slice(1))).filter((index) => !Number.isNaN(index))

  rewrittenIndexes.forEach((prevIndex, newIndex) => {
    rearrangedTestCases[newIndex] = testCases[prevIndex]
    testCases[prevIndex] = undefined
  })

  const testCasesToRemove = testCases.filter(Boolean)
  const testCasesToUpdate = rearrangedTestCases.filter(Boolean)

  for (const testCaseId of testCasesToRemove) {
    await db.delete(DB_NAME, `${testCaseId}_it`)
    await db.delete(DB_NAME, `${testCaseId}_steps`)
  }

  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  await store.put(testCasesToUpdate, `${currentTestFile}_testCases`)
  await storeCurrentDescribeCursor(store, editArray.indexOf('^'))

  db.close()
}

export const getItEditString = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestCase = await db.get(DB_NAME, 'currentTestCase')
  const currentTestSteps = (await db.get(DB_NAME, `${currentTestCase}_steps`)) || []
  const editString = currentTestSteps.map(
    (step, index) =>
      `#${index} ${
        generateCode({
          type: 'Program',
          body: [buildStep(step)]
        }).code
      }`
  )

  editString.splice((await getCurrentItCursor(db)) || editString.length, 0, '^')

  db.close()

  return JSON.stringify(editString, undefined, 2)
}

export const applyItEditString = async (editString) => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(DB_NAME)
    }
  })

  const currentTestCase = await db.get(DB_NAME, 'currentTestCase')
  const currentTestSteps = (await db.get(DB_NAME, `${currentTestCase}_steps`)) || []
  const editArray = JSON.parse(editString)
  const rearrangedTestSteps = []
  const rewrittenIndexes = editArray.map((line) => parseInt(line.slice(1))).filter((index) => !Number.isNaN(index))

  rewrittenIndexes.forEach((prevIndex, newIndex) => {
    rearrangedTestSteps[newIndex] = currentTestSteps[prevIndex]
  })

  const transaction = db.transaction(DB_NAME, 'readwrite')
  const store = transaction.objectStore(DB_NAME)

  await store.put(rearrangedTestSteps, `${currentTestCase}_steps`)
  await storeCurrentItCursor(store, editArray.indexOf('^'))

  db.close()
}
