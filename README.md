# Solid Test Recorder

**Automated Chrome extension to generate unit/integration tests for [solidjs](https://www.solidjs.com/)**

## Features

- Generates UI tests which relay on [vitest](https://vitest.dev/) and [msw](https://mswjs.io/) which follow solidjs guidelines.
- Uses a combination of devtools element inspector and console which gives great recording control e.g. terminal-like auto-completion.
- Auto-generates the most specific selector for inspected element.
- Records network requests and generates mocks and their spies.

## Motivation

Writing UI tests is boring yet extremely important. This extension is meant to make it more fun and attract developers to write more tests.

## Installation

First, you need to build it.

You can use Docker:

```bash
$ docker-compose up
$ docker exec -it docker solid_test_recorder yarn build
```

or run these on you machine:

```bash
$ yarn install
$ yarn build
```

Then, upload /dist directory as an unpacked extension. See this [link](https://developer.chrome.com/docs/extensions/mv3/getstarted/#unpacked). 

## Usage

As soon as you open devtools, in Console, you'll get access to `$str` (Solid Test Recorder) global var. You can execute `$str.help` for available commands.

The usual flow would be:

```javascript
$str.clear // to start new test file
$str.describe = 'my component'
$str.it = 'should do something'
$str.expect.to* // use element inspector to choose the element in question
```

You'll be also often capturing events e.g.:

```javascript
$str.capture.click // or any available DOM event
// click at the button in the browser
$str.stopCapturing
// and then again...
$str.expect.to*
```

To see the results which will open as 2 vertical editors:
```javascript
$str.seeResult // to close $str.closeEditor
```

In the first one you'll see your test file, and the second is API mock data generated from the actual network requests.

In order to use the test, your setupVitest.ts in the root directory should look like [this](https://github.com/chris-czopp/solid-test-recorder/blob/master/src/testHelpers/setupVitest.txt)
and you should have a `./test/mocked-requests.json` file. 

> There are more interesting commands. I'll be recording video tutorials soon so bear with me! 

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
