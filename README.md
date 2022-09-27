# Solid Test Recorder

**Chrome extension to generate UI unit/integration tests for [solidjs](https://www.solidjs.com/)**

> You can also use it for [react](https://reactjs.org/) or [preact](https://preactjs.com/) with little config tweaks. 

## Features

- Generates UI tests which relay on [vitest](https://vitest.dev/) and [msw](https://mswjs.io/) which follow solidjs guidelines.
- Uses a combination of Chrome DevTools element inspector and console which gives great recording control e.g. terminal-like auto-completion.
- Auto-generates the most specific selector for inspected element.
- Records network requests and generates mocks and spies for them.


https://user-images.githubusercontent.com/22557930/192564569-6992914e-b6bd-4919-89ff-2539cd34e6f6.mp4


## Motivation

Writing UI tests is boring yet extremely important. This extension is meant to make it more fun and attract developers to write more tests.

## Installation

First, you need to build it.

You can use Docker:

```bash
$ docker-compose up
$ docker exec -it docker solid_test_recorder yarn build
```

or run these on your machine:

```bash
$ yarn install
$ yarn build
```

Then, upload /dist directory as an unpacked extension. See this [link](https://developer.chrome.com/docs/extensions/mv3/getstarted/#unpacked). 

## Usage

As soon as you open Chrome DevTools, in console, you'll get access to `$str` (Solid Test Recorder) global var. You can execute `$str.help` command for available commands.

The usual flow would be:

```javascript
$str.clear // to start new test file
$str.describe = 'my component'
$str.it = 'should do something'
$str.expect.toBeInTheDocument = true // use element inspector to choose the element, assert type and whether it's positive or negation
```

You'll be also often capturing events e.g.:

```javascript
$str.capture.click // or any available DOM event
// click at the button in the browser
$str.stopCapturing
// and then again...
$str.expect.toBeChecked = false // or any availble assert type in testing library
```

To see the results which will open as 2 vertical editors:
```javascript
$str.seeResult // to close $str.closeEditor
```

In the first one you'll see your test file, and the second is API mock data generated from the actual network requests.

In order to use the test, your `setupVitest.ts` in the root directory should look like [this](https://github.com/chris-czopp/solid-test-recorder/blob/master/src/testHelpers/setupVitest.txt)
and you should create a `./test/mocked-requests.json` file. 

```
.
├── test
│   └── mocked-requests.json
└── setupVitest.ts
```

### Available Commands

|                                      |                                                                                           |
|--------------------------------------|-------------------------------------------------------------------------------------------|
| **Configuration:**                   |                                                                                           |
| `$str.config.codeTemplates`          | allows to edit the code template used when generation test file                           |
| `$str.config.excludedRequests`       | allows to specify list of URLs to ignore when capturing requests                          |
| **Testing:**                         |                                                                                           |
| `$str.describe `                     | creates a new test file with a given description                                          |
| `$str.it`                            | creates a new test case with a given description                                          |
| `$str.expect.*`                      | adds a new asser on a currently selected element                                          |
| `$str.capture.*`                     | starts event capturing i.e. auto-generation user events and subsequent requests           |
| `$str.stopCapturing`                 | stops event capturing                                                                     |
| `$str.seeResult`                     | opens editor with a generated test file and request mock                                  |
| `$str.editTest`                      | allows to reposition or remove test cases and test steps and setting their active cursors |
| **Changing current test file/case:** |                                                                                           |
| `$str.use.file`                      | allows to switch to a given test file                                                     |
| `$str.use.case`                      | allows to switch to a given test case                                                     |
| **Controlling editor:**              |                                                                                           |
| `$str.applyChanges`                  | saves changes and closes editor(s)                                                        |
| `$str.closeEditor`                   | discards any changes and closes editor(s)                                                 |
| **Data collections:**                |                                                                                           |
| `$str.$requests`                     | captured HTTP requests                                                                    |
| `$str.$files`                        | test files                                                                                |
| `$str.$cases`                        | test cases                                                                                |

> Dangerous: `$str.clear` - removes all the test data

## Roadmap

1. Produce short video tutorials as documentation. 
2. Convert it to TypeScript. 
3. Write e2e tests (how ironic?). 
4. Store tests in files which can be then uploaded (and sort of replayed).
  
Visit [solidjs discord channel](https://discord.com/invite/solidjs) where I'll be posting updates. Don't hesitate to DM for any questions related to the project.

## Contributing

The codebase needs to be converted to TypeScript before it can be workable by a team. 
Also, I have an idea how to e2e test it, and this would also need to happen before any major logic changes.
Anyway, feel free to create issues and PRs, just want to highlight the priorities.

## License

[MIT](https://github.com/chris-czopp/solid-test-recorder/blob/master/LICENSE.md)
