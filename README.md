# screeps-module-manager
![](https://img.shields.io/npm/v/screeps-module-manager.svg)
![](https://david-dm.org/screepers/screeps-module-manager.svg)  

Automatically transform and synchronize your screeps modules

## Installation

**node v6.0.0** or greater required.

```
npm install screeps-module-manager
```

## Features

- **Transform.** Define a custom transformer to support your favorite language/transpiler.
- **Organize.** Use folders to [organize](#organize-with-folders) your screeps modules.
- **Synchronize.** Automatically transform and sync with screeps when your modules change.

## Example

The following example will transform your `.js` files in `./src` with `babel-core`.

```js
const ModuleManager = require('screeps-module-manager')
const babel = require('babel-core')
const path = require('path')

const modules = new ModuleManager({
  username: 'username',
  password: 'password',
  branch: 'default',
  source: path.resolve(__dirname, 'src'),
  transform: (source, done) => {
    try {
      const transform = babel.transform(source, {
        presets: [
          'es2015'
        ]
      })
      done(null, transform.code)
    } catch (err) {
      done(err)
    }
  }
})

modules.on('error', err => console.error(err))
modules.on('change', file => console.log('File updated!', file)
modules.on('sync', () => console.log('Modules synced!'))
```

## API

### Class: ModuleManager

`const modules = new ModuleManager([options])`

Options:

- `username` (string): Your screeps username
- `password` (string): Your screeps password
- `branch` (string): The name of the target screeps branch
- `source` (string): The path of your screeps modules source
- `transform` (function): A function that takes two parameters and returns the transformed module.
```js
function (source, done) {
    // transpile your module with TypeScript
    const module = ts.transpileModule(source)
    done(err, module)
}
```

#### Event: 'change'

`function (fileName) {}`  

Emitted when a filesystem change is triggered.

#### Event: 'sync'

`function () { }`  

Emitted when the screeps modules have been transformed and synchronized.

#### Event: 'error'

`function (err) { }`

Emitted when the ModuleManager catches an error.


## Organize with folders

Since screeps does not currently support nesting modules within folders, `screeps-module-manager` provides a simple solution by renaming `index.js` files to the name of the parent directory or renaming modules with the parent directories as prefixes and separating them with periods (`.`).

Examples:

```js
// import roles from './roles/index'
// should be required or imported as follows:
const roles = require('roles')
import roles from 'roles'

// import harvester from './roles/harvester'
// should be required or imported as follows:
const harvester = require('roles.harvester')
import harvest from 'roles.harvester'

// this also works with deeper nesting
// ./roles/harvester/routine.js
const harvesterConstants = require('roles.harvester.routine')

// Note: require/import paths are absolute.
// For example in ./roles/harvester.js
const routine = require('harvester.routine') // doesn't work
const routine = require('roles.harvesters.routine') // does work

```


## License

MIT License

Copyright (c) 2016 Adam Snodgrass

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
