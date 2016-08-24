import fs from 'fs-promise'
import path from 'path'
import EventEmitter from 'events'
import {post} from 'request-promise-native'
import {watch} from 'chokidar'
import promiseify from 'just-promiseify'

const isJS = file => /\.js$/.test(file)

export default class ModuleManager extends EventEmitter {
  constructor(opts = {}) {
    super()

    if (!opts.username || !opts.password || !opts.branch) {
      throw new Error('A screeps username, password and branch are required!')
    }

    this.modules = {}
    this.username = opts.username
    this.password = opts.password
    this.branch = opts.branch
    this.source = opts.source || path.resolve(__dirname, '..', 'src')
    this.ptr = opts.ptr || false
    this.transform = (opts.transform) ? opts.transform : (source => source)

    this.transformModules(this.source)
      .then(modules => {
        this.modules = modules
        this.watchModules()
      })
      .catch(err => {
        this.emit('error', err)
      })
  }

  watchModules () {
    const watcher = watch(this.source)

    watcher.on('ready', () => {
      watcher.on('all', async (event, filePath) => {
        if (isJS(filePath)) {
          const module = await this.transformModule(filePath)
          this.emit('change', filePath)
          this.modules = {
            ...this.modules,
            [module.name]: module.code
          }

          this.synchronize()
            .catch(err => {
              this.emit('error', err)
            })
        }
      })
    })
  }

  getModuleName (file, directory) {
    if (file.includes('index')) {
      // if file name is index, change name to directory name
      return directory
    } else {
      // prefix module name with directory name
      return ((directory) ? `${directory}.` : '') + file.slice(0, -3)
    }
  }

  async transformModule(filePath) {
    const source = await fs.readFile(filePath, {encoding: 'utf8'})
    const module = this.transform(source)
    // remove source path from current filePath to get path relative to source
    const relativePath = filePath.replace(this.source, '').slice(1)
    // isolate relative directory and replace /'s with .'s
    const directory = path.dirname(relativePath).replace('/', '.')

    const moduleName = this.getModuleName(
      path.basename(filePath),
      (directory === '.') ? '' : directory
    )

    return {
      name: moduleName,
      code: module
    }
  }

  async transformModules (dir) {
    let modules = {}

    // get a list of files and directories in the current directory
    let files = await fs.readdir(dir)

    for (const file of files) {
      // get the file's full path
      const filePath = path.resolve(dir, file)
      const stat = await fs.lstat(filePath)

      if (stat.isDirectory()) {
        // if the file is a directory, transform all modules inside
        modules = {
          ...modules,
          ...(await this.transformModules(filePath))
        }
      } else if (isJS(file)) {
        // get module name and transformed code
        const module = await this.transformModule(filePath)
        modules[module.name] = module.code
      }
    }

    return modules
  }

  async synchronize(filePath) {
    const url = `https://screeps.com${(this.ptr ? '/ptr' : '')}/api/user/code`
    const options = {
      url,
      json: true,
      auth: {
        username: this.username,
        password: this.password
      },
      body: {
        branch: this.branch,
        modules: this.modules
      }
    }

    try {
      const body = await post(options)

      if (body.error) {
        this.emit('error', body.error)
      } else {
        this.emit('sync')
      }
    } catch (err) {
      this.emit('error', err)
    }
  }
}
