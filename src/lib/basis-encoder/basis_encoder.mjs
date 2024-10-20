import basisEncoderWasmUrl from './basis_encoder.wasm?url'

var BASIS = (() => {
  var _scriptName =
    typeof document != "undefined" ? document.currentScript?.src : undefined

  return function (moduleArg = {}) {
    var moduleRtn

    var Module = moduleArg
    var readyPromiseResolve, readyPromiseReject
    var readyPromise = new Promise((resolve, reject) => {
      readyPromiseResolve = resolve
      readyPromiseReject = reject
    })
    var ENVIRONMENT_IS_WEB = false
    var ENVIRONMENT_IS_WORKER = true
    var moduleOverrides = Object.assign({}, Module)
    var arguments_ = []
    var thisProgram = "./this.program"
    var quit_ = (status, toThrow) => {
      throw toThrow
    }
    var scriptDirectory = ""
    
    var readAsync, readBinary
    if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
      } else if (typeof document != "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src
      }
      if (_scriptName) {
        scriptDirectory = _scriptName
      }
      if (scriptDirectory.startsWith("blob:")) {
        scriptDirectory = ""
      } else {
        scriptDirectory = scriptDirectory.substr(
          0,
          scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1,
        )
      }
      {
        if (ENVIRONMENT_IS_WORKER) {
          readBinary = (url) => {
            var xhr = new XMLHttpRequest()
            xhr.open("GET", url, false)
            xhr.responseType = "arraybuffer"
            xhr.send(null)
            return new Uint8Array(xhr.response)
          }
        }
        readAsync = (url) =>
          fetch(url, { credentials: "same-origin" }).then((response) => {
            if (response.ok) {
              return response.arrayBuffer()
            }
            return Promise.reject(
              new Error(response.status + " : " + response.url),
            )
          })
      }
    } else {
    }
    var out = Module["print"] || console.log.bind(console)
    var err = Module["printErr"] || console.error.bind(console)
    Object.assign(Module, moduleOverrides)
    moduleOverrides = null
    if (Module["arguments"]) arguments_ = Module["arguments"]
    if (Module["thisProgram"]) thisProgram = Module["thisProgram"]
    var wasmBinary = Module["wasmBinary"]
    var wasmMemory
    var ABORT = false
    var EXITSTATUS
    var HEAP8,
      HEAPU8,
      HEAP16,
      HEAPU16,
      HEAP32,
      HEAPU32,
      HEAPF32,
      HEAP64,
      HEAPU64,
      HEAPF64
    function updateMemoryViews() {
      var b = wasmMemory.buffer
      Module["HEAP8"] = HEAP8 = new Int8Array(b)
      Module["HEAP16"] = HEAP16 = new Int16Array(b)
      Module["HEAPU8"] = HEAPU8 = new Uint8Array(b)
      Module["HEAPU16"] = HEAPU16 = new Uint16Array(b)
      Module["HEAP32"] = HEAP32 = new Int32Array(b)
      Module["HEAPU32"] = HEAPU32 = new Uint32Array(b)
      Module["HEAPF32"] = HEAPF32 = new Float32Array(b)
      Module["HEAPF64"] = HEAPF64 = new Float64Array(b)
      Module["HEAP64"] = HEAP64 = new BigInt64Array(b)
      Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b)
    }
    var __ATPRERUN__ = []
    var __ATINIT__ = []
    var __ATPOSTRUN__ = []
    var runtimeInitialized = false
    function preRun() {
      if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function")
          Module["preRun"] = [Module["preRun"]]
        while (Module["preRun"].length) {
          addOnPreRun(Module["preRun"].shift())
        }
      }
      callRuntimeCallbacks(__ATPRERUN__)
    }
    function initRuntime() {
      runtimeInitialized = true
      callRuntimeCallbacks(__ATINIT__)
    }
    function postRun() {
      if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function")
          Module["postRun"] = [Module["postRun"]]
        while (Module["postRun"].length) {
          addOnPostRun(Module["postRun"].shift())
        }
      }
      callRuntimeCallbacks(__ATPOSTRUN__)
    }
    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb)
    }
    function addOnInit(cb) {
      __ATINIT__.unshift(cb)
    }
    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb)
    }
    var runDependencies = 0
    var runDependencyWatcher = null
    var dependenciesFulfilled = null
    function addRunDependency(id) {
      runDependencies++
      Module["monitorRunDependencies"]?.(runDependencies)
    }
    function removeRunDependency(id) {
      runDependencies--
      Module["monitorRunDependencies"]?.(runDependencies)
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher)
          runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled
          dependenciesFulfilled = null
          callback()
        }
      }
    }
    function abort(what) {
      Module["onAbort"]?.(what)
      what = "Aborted(" + what + ")"
      err(what)
      ABORT = true
      what += ". Build with -sASSERTIONS for more info."
      var e = new WebAssembly.RuntimeError(what)
      readyPromiseReject(e)
      throw e
    }
    var dataURIPrefix = "data:application/octet-stream;base64,"
    var isDataURI = (filename) => filename.startsWith(dataURIPrefix)
    var wasmBinaryFile
    function getBinarySync(file) {
      if (file == wasmBinaryFile && wasmBinary) {
        return new Uint8Array(wasmBinary)
      }
      if (readBinary) {
        return readBinary(file)
      }
      throw "both async and sync fetching of the wasm failed"
    }
    function getBinaryPromise(binaryFile) {
      if (!wasmBinary) {
        return readAsync(binaryFile).then(
          (response) => new Uint8Array(response),
          () => getBinarySync(binaryFile),
        )
      }
      return Promise.resolve().then(() => getBinarySync(binaryFile))
    }
    function instantiateArrayBuffer(binaryFile, imports, receiver) {
      return getBinaryPromise(binaryFile)
        .then((binary) => WebAssembly.instantiate(binary, imports))
        .then(receiver, (reason) => {
          err(`failed to asynchronously prepare wasm: ${reason}`)
          abort(reason)
        })
    }
    function instantiateAsync(binary, binaryFile, imports, callback) {
      if (
        !binary &&
        typeof WebAssembly.instantiateStreaming == "function" &&
        !isDataURI(binaryFile) &&
        typeof fetch == "function"
      ) {
        return fetch(binaryFile, { credentials: "same-origin" }).then(
          (response) => {
            var result = WebAssembly.instantiateStreaming(response, imports)
            return result.then(callback, function (reason) {
              err(`wasm streaming compile failed: ${reason}`)
              err("falling back to ArrayBuffer instantiation")
              return instantiateArrayBuffer(binaryFile, imports, callback)
            })
          },
        )
      }
      return instantiateArrayBuffer(binaryFile, imports, callback)
    }
    function getWasmImports() {
      return { a: wasmImports }
    }
    function createWasm() {
      var info = getWasmImports()
      function receiveInstance(instance, module) {
        wasmExports = instance.exports
        wasmMemory = wasmExports["ea"]
        updateMemoryViews()
        wasmTable = wasmExports["ja"]
        addOnInit(wasmExports["fa"])
        removeRunDependency("wasm-instantiate")
        return wasmExports
      }
      addRunDependency("wasm-instantiate")
      function receiveInstantiationResult(result) {
        receiveInstance(result["instance"])
      }
      if (Module["instantiateWasm"]) {
        try {
          return Module["instantiateWasm"](info, receiveInstance)
        } catch (e) {
          err(`Module.instantiateWasm callback failed with error: ${e}`)
          readyPromiseReject(e)
        }
      }
      if (!wasmBinaryFile) wasmBinaryFile = basisEncoderWasmUrl
      instantiateAsync(
        wasmBinary,
        wasmBinaryFile,
        info,
        receiveInstantiationResult,
      ).catch(readyPromiseReject)
      return {}
    }
    function ExitStatus(status) {
      this.name = "ExitStatus"
      this.message = `Program terminated with exit(${status})`
      this.status = status
    }
    var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        callbacks.shift()(Module)
      }
    }
    var noExitRuntime = Module["noExitRuntime"] || true
    var stackRestore = (val) => __emscripten_stack_restore(val)
    var stackSave = () => _emscripten_stack_get_current()
    var UTF8Decoder =
      typeof TextDecoder != "undefined" ? new TextDecoder() : undefined
    var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
      var endIdx = idx + maxBytesToRead
      var endPtr = idx
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
      }
      var str = ""
      while (idx < endPtr) {
        var u0 = heapOrArray[idx++]
        if (!(u0 & 128)) {
          str += String.fromCharCode(u0)
          continue
        }
        var u1 = heapOrArray[idx++] & 63
        if ((u0 & 224) == 192) {
          str += String.fromCharCode(((u0 & 31) << 6) | u1)
          continue
        }
        var u2 = heapOrArray[idx++] & 63
        if ((u0 & 240) == 224) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2
        } else {
          u0 =
            ((u0 & 7) << 18) |
            (u1 << 12) |
            (u2 << 6) |
            (heapOrArray[idx++] & 63)
        }
        if (u0 < 65536) {
          str += String.fromCharCode(u0)
        } else {
          var ch = u0 - 65536
          str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023))
        }
      }
      return str
    }
    var UTF8ToString = (ptr, maxBytesToRead) =>
      ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
    var SYSCALLS = {
      varargs: undefined,
      getStr(ptr) {
        var ret = UTF8ToString(ptr)
        return ret
      },
    }
    function ___syscall_fcntl64(fd, cmd, varargs) {
      SYSCALLS.varargs = varargs
      return 0
    }
    var ___syscall_fstat64 = (fd, buf) => {}
    function ___syscall_ioctl(fd, op, varargs) {
      SYSCALLS.varargs = varargs
      return 0
    }
    function ___syscall_openat(dirfd, path, flags, varargs) {
      SYSCALLS.varargs = varargs
    }
    var __abort_js = () => {
      abort("")
    }
    var structRegistrations = {}
    var runDestructors = (destructors) => {
      while (destructors.length) {
        var ptr = destructors.pop()
        var del = destructors.pop()
        del(ptr)
      }
    }
    function readPointer(pointer) {
      return this["fromWireType"](HEAPU32[pointer >> 2])
    }
    var awaitingDependencies = {}
    var registeredTypes = {}
    var typeDependencies = {}
    var InternalError
    var throwInternalError = (message) => {
      throw new InternalError(message)
    }
    var whenDependentTypesAreResolved = (
      myTypes,
      dependentTypes,
      getTypeConverters,
    ) => {
      myTypes.forEach((type) => (typeDependencies[type] = dependentTypes))
      function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters)
        if (myTypeConverters.length !== myTypes.length) {
          throwInternalError("Mismatched type converter count")
        }
        for (var i = 0; i < myTypes.length; ++i) {
          registerType(myTypes[i], myTypeConverters[i])
        }
      }
      var typeConverters = new Array(dependentTypes.length)
      var unregisteredTypes = []
      var registered = 0
      dependentTypes.forEach((dt, i) => {
        if (registeredTypes.hasOwnProperty(dt)) {
          typeConverters[i] = registeredTypes[dt]
        } else {
          unregisteredTypes.push(dt)
          if (!awaitingDependencies.hasOwnProperty(dt)) {
            awaitingDependencies[dt] = []
          }
          awaitingDependencies[dt].push(() => {
            typeConverters[i] = registeredTypes[dt]
            ++registered
            if (registered === unregisteredTypes.length) {
              onComplete(typeConverters)
            }
          })
        }
      })
      if (0 === unregisteredTypes.length) {
        onComplete(typeConverters)
      }
    }
    var __embind_finalize_value_object = (structType) => {
      var reg = structRegistrations[structType]
      delete structRegistrations[structType]
      var rawConstructor = reg.rawConstructor
      var rawDestructor = reg.rawDestructor
      var fieldRecords = reg.fields
      var fieldTypes = fieldRecords
        .map((field) => field.getterReturnType)
        .concat(fieldRecords.map((field) => field.setterArgumentType))
      whenDependentTypesAreResolved([structType], fieldTypes, (fieldTypes) => {
        var fields = {}
        fieldRecords.forEach((field, i) => {
          var fieldName = field.fieldName
          var getterReturnType = fieldTypes[i]
          var getter = field.getter
          var getterContext = field.getterContext
          var setterArgumentType = fieldTypes[i + fieldRecords.length]
          var setter = field.setter
          var setterContext = field.setterContext
          fields[fieldName] = {
            read: (ptr) =>
              getterReturnType["fromWireType"](getter(getterContext, ptr)),
            write: (ptr, o) => {
              var destructors = []
              setter(
                setterContext,
                ptr,
                setterArgumentType["toWireType"](destructors, o),
              )
              runDestructors(destructors)
            },
          }
        })
        return [
          {
            name: reg.name,
            fromWireType: (ptr) => {
              var rv = {}
              for (var i in fields) {
                rv[i] = fields[i].read(ptr)
              }
              rawDestructor(ptr)
              return rv
            },
            toWireType: (destructors, o) => {
              for (var fieldName in fields) {
                if (!(fieldName in o)) {
                  throw new TypeError(`Missing field: "${fieldName}"`)
                }
              }
              var ptr = rawConstructor()
              for (fieldName in fields) {
                fields[fieldName].write(ptr, o[fieldName])
              }
              if (destructors !== null) {
                destructors.push(rawDestructor, ptr)
              }
              return ptr
            },
            argPackAdvance: GenericWireTypeSize,
            readValueFromPointer: readPointer,
            destructorFunction: rawDestructor,
          },
        ]
      })
    }
    var embindRepr = (v) => {
      if (v === null) {
        return "null"
      }
      var t = typeof v
      if (t === "object" || t === "array" || t === "function") {
        return v.toString()
      } else {
        return "" + v
      }
    }
    var embind_init_charCodes = () => {
      var codes = new Array(256)
      for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i)
      }
      embind_charCodes = codes
    }
    var embind_charCodes
    var readLatin1String = (ptr) => {
      var ret = ""
      var c = ptr
      while (HEAPU8[c]) {
        ret += embind_charCodes[HEAPU8[c++]]
      }
      return ret
    }
    var BindingError
    var throwBindingError = (message) => {
      throw new BindingError(message)
    }
    function sharedRegisterType(rawType, registeredInstance, options = {}) {
      var name = registeredInstance.name
      if (!rawType) {
        throwBindingError(
          `type "${name}" must have a positive integer typeid pointer`,
        )
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
          return
        } else {
          throwBindingError(`Cannot register type '${name}' twice`)
        }
      }
      registeredTypes[rawType] = registeredInstance
      delete typeDependencies[rawType]
      if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType]
        delete awaitingDependencies[rawType]
        callbacks.forEach((cb) => cb())
      }
    }
    function registerType(rawType, registeredInstance, options = {}) {
      return sharedRegisterType(rawType, registeredInstance, options)
    }
    var integerReadValueFromPointer = (name, width, signed) => {
      switch (width) {
        case 1:
          return signed
            ? (pointer) => HEAP8[pointer]
            : (pointer) => HEAPU8[pointer]
        case 2:
          return signed
            ? (pointer) => HEAP16[pointer >> 1]
            : (pointer) => HEAPU16[pointer >> 1]
        case 4:
          return signed
            ? (pointer) => HEAP32[pointer >> 2]
            : (pointer) => HEAPU32[pointer >> 2]
        case 8:
          return signed
            ? (pointer) => HEAP64[pointer >> 3]
            : (pointer) => HEAPU64[pointer >> 3]
        default:
          throw new TypeError(`invalid integer width (${width}): ${name}`)
      }
    }
    var __embind_register_bigint = (
      primitiveType,
      name,
      size,
      minRange,
      maxRange,
    ) => {
      name = readLatin1String(name)
      var isUnsignedType = name.indexOf("u") != -1
      if (isUnsignedType) {
        maxRange = (1n << 64n) - 1n
      }
      registerType(primitiveType, {
        name,
        fromWireType: (value) => value,
        toWireType: function (destructors, value) {
          if (typeof value != "bigint" && typeof value != "number") {
            throw new TypeError(
              `Cannot convert "${embindRepr(value)}" to ${this.name}`,
            )
          }
          if (typeof value == "number") {
            value = BigInt(value)
          }
          return value
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: integerReadValueFromPointer(
          name,
          size,
          !isUnsignedType,
        ),
        destructorFunction: null,
      })
    }
    var GenericWireTypeSize = 8
    var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
      name = readLatin1String(name)
      registerType(rawType, {
        name,
        fromWireType: function (wt) {
          return !!wt
        },
        toWireType: function (destructors, o) {
          return o ? trueValue : falseValue
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: function (pointer) {
          return this["fromWireType"](HEAPU8[pointer])
        },
        destructorFunction: null,
      })
    }
    var shallowCopyInternalPointer = (o) => ({
      count: o.count,
      deleteScheduled: o.deleteScheduled,
      preservePointerOnDelete: o.preservePointerOnDelete,
      ptr: o.ptr,
      ptrType: o.ptrType,
      smartPtr: o.smartPtr,
      smartPtrType: o.smartPtrType,
    })
    var throwInstanceAlreadyDeleted = (obj) => {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name
      }
      throwBindingError(getInstanceTypeName(obj) + " instance already deleted")
    }
    var finalizationRegistry = false
    var detachFinalizer = (handle) => {}
    var runDestructor = ($$) => {
      if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr)
      } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr)
      }
    }
    var releaseClassHandle = ($$) => {
      $$.count.value -= 1
      var toDelete = 0 === $$.count.value
      if (toDelete) {
        runDestructor($$)
      }
    }
    var downcastPointer = (ptr, ptrClass, desiredClass) => {
      if (ptrClass === desiredClass) {
        return ptr
      }
      if (undefined === desiredClass.baseClass) {
        return null
      }
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass)
      if (rv === null) {
        return null
      }
      return desiredClass.downcast(rv)
    }
    var registeredPointers = {}
    var getInheritedInstanceCount = () =>
      Object.keys(registeredInstances).length
    var getLiveInheritedInstances = () => {
      var rv = []
      for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
          rv.push(registeredInstances[k])
        }
      }
      return rv
    }
    var deletionQueue = []
    var flushPendingDeletes = () => {
      while (deletionQueue.length) {
        var obj = deletionQueue.pop()
        obj.$$.deleteScheduled = false
        obj["delete"]()
      }
    }
    var delayFunction
    var setDelayFunction = (fn) => {
      delayFunction = fn
      if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes)
      }
    }
    var init_embind = () => {
      Module["getInheritedInstanceCount"] = getInheritedInstanceCount
      Module["getLiveInheritedInstances"] = getLiveInheritedInstances
      Module["flushPendingDeletes"] = flushPendingDeletes
      Module["setDelayFunction"] = setDelayFunction
    }
    var registeredInstances = {}
    var getBasestPointer = (class_, ptr) => {
      if (ptr === undefined) {
        throwBindingError("ptr should not be undefined")
      }
      while (class_.baseClass) {
        ptr = class_.upcast(ptr)
        class_ = class_.baseClass
      }
      return ptr
    }
    var getInheritedInstance = (class_, ptr) => {
      ptr = getBasestPointer(class_, ptr)
      return registeredInstances[ptr]
    }
    var makeClassHandle = (prototype, record) => {
      if (!record.ptrType || !record.ptr) {
        throwInternalError("makeClassHandle requires ptr and ptrType")
      }
      var hasSmartPtrType = !!record.smartPtrType
      var hasSmartPtr = !!record.smartPtr
      if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError("Both smartPtrType and smartPtr must be specified")
      }
      record.count = { value: 1 }
      return attachFinalizer(
        Object.create(prototype, { $$: { value: record, writable: true } }),
      )
    }
    function RegisteredPointer_fromWireType(ptr) {
      var rawPointer = this.getPointee(ptr)
      if (!rawPointer) {
        this.destructor(ptr)
        return null
      }
      var registeredInstance = getInheritedInstance(
        this.registeredClass,
        rawPointer,
      )
      if (undefined !== registeredInstance) {
        if (0 === registeredInstance.$$.count.value) {
          registeredInstance.$$.ptr = rawPointer
          registeredInstance.$$.smartPtr = ptr
          return registeredInstance["clone"]()
        } else {
          var rv = registeredInstance["clone"]()
          this.destructor(ptr)
          return rv
        }
      }
      function makeDefaultHandle() {
        if (this.isSmartPointer) {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this.pointeeType,
            ptr: rawPointer,
            smartPtrType: this,
            smartPtr: ptr,
          })
        } else {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this,
            ptr,
          })
        }
      }
      var actualType = this.registeredClass.getActualType(rawPointer)
      var registeredPointerRecord = registeredPointers[actualType]
      if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this)
      }
      var toType
      if (this.isConst) {
        toType = registeredPointerRecord.constPointerType
      } else {
        toType = registeredPointerRecord.pointerType
      }
      var dp = downcastPointer(
        rawPointer,
        this.registeredClass,
        toType.registeredClass,
      )
      if (dp === null) {
        return makeDefaultHandle.call(this)
      }
      if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
          smartPtrType: this,
          smartPtr: ptr,
        })
      } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
        })
      }
    }
    var attachFinalizer = (handle) => {
      if ("undefined" === typeof FinalizationRegistry) {
        attachFinalizer = (handle) => handle
        return handle
      }
      finalizationRegistry = new FinalizationRegistry((info) => {
        releaseClassHandle(info.$$)
      })
      attachFinalizer = (handle) => {
        var $$ = handle.$$
        var hasSmartPtr = !!$$.smartPtr
        if (hasSmartPtr) {
          var info = { $$ }
          finalizationRegistry.register(handle, info, handle)
        }
        return handle
      }
      detachFinalizer = (handle) => finalizationRegistry.unregister(handle)
      return attachFinalizer(handle)
    }
    var init_ClassHandle = () => {
      Object.assign(ClassHandle.prototype, {
        isAliasOf(other) {
          if (!(this instanceof ClassHandle)) {
            return false
          }
          if (!(other instanceof ClassHandle)) {
            return false
          }
          var leftClass = this.$$.ptrType.registeredClass
          var left = this.$$.ptr
          other.$$ = other.$$
          var rightClass = other.$$.ptrType.registeredClass
          var right = other.$$.ptr
          while (leftClass.baseClass) {
            left = leftClass.upcast(left)
            leftClass = leftClass.baseClass
          }
          while (rightClass.baseClass) {
            right = rightClass.upcast(right)
            rightClass = rightClass.baseClass
          }
          return leftClass === rightClass && left === right
        },
        clone() {
          if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this)
          }
          if (this.$$.preservePointerOnDelete) {
            this.$$.count.value += 1
            return this
          } else {
            var clone = attachFinalizer(
              Object.create(Object.getPrototypeOf(this), {
                $$: { value: shallowCopyInternalPointer(this.$$) },
              }),
            )
            clone.$$.count.value += 1
            clone.$$.deleteScheduled = false
            return clone
          }
        },
        delete() {
          if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this)
          }
          if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError("Object already scheduled for deletion")
          }
          detachFinalizer(this)
          releaseClassHandle(this.$$)
          if (!this.$$.preservePointerOnDelete) {
            this.$$.smartPtr = undefined
            this.$$.ptr = undefined
          }
        },
        isDeleted() {
          return !this.$$.ptr
        },
        deleteLater() {
          if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this)
          }
          if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError("Object already scheduled for deletion")
          }
          deletionQueue.push(this)
          if (deletionQueue.length === 1 && delayFunction) {
            delayFunction(flushPendingDeletes)
          }
          this.$$.deleteScheduled = true
          return this
        },
      })
    }
    function ClassHandle() {}
    var createNamedFunction = (name, body) =>
      Object.defineProperty(body, "name", { value: name })
    var ensureOverloadTable = (proto, methodName, humanName) => {
      if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName]
        proto[methodName] = function (...args) {
          if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) {
            throwBindingError(
              `Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`,
            )
          }
          return proto[methodName].overloadTable[args.length].apply(this, args)
        }
        proto[methodName].overloadTable = []
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
      }
    }
    var exposePublicSymbol = (name, value, numArguments) => {
      if (Module.hasOwnProperty(name)) {
        if (
          undefined === numArguments ||
          (undefined !== Module[name].overloadTable &&
            undefined !== Module[name].overloadTable[numArguments])
        ) {
          throwBindingError(`Cannot register public name '${name}' twice`)
        }
        ensureOverloadTable(Module, name, name)
        if (Module.hasOwnProperty(numArguments)) {
          throwBindingError(
            `Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`,
          )
        }
        Module[name].overloadTable[numArguments] = value
      } else {
        Module[name] = value
        if (undefined !== numArguments) {
          Module[name].numArguments = numArguments
        }
      }
    }
    var char_0 = 48
    var char_9 = 57
    var makeLegalFunctionName = (name) => {
      if (undefined === name) {
        return "_unknown"
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, "$")
      var f = name.charCodeAt(0)
      if (f >= char_0 && f <= char_9) {
        return `_${name}`
      }
      return name
    }
    function RegisteredClass(
      name,
      constructor,
      instancePrototype,
      rawDestructor,
      baseClass,
      getActualType,
      upcast,
      downcast,
    ) {
      this.name = name
      this.constructor = constructor
      this.instancePrototype = instancePrototype
      this.rawDestructor = rawDestructor
      this.baseClass = baseClass
      this.getActualType = getActualType
      this.upcast = upcast
      this.downcast = downcast
      this.pureVirtualFunctions = []
    }
    var upcastPointer = (ptr, ptrClass, desiredClass) => {
      while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
          throwBindingError(
            `Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`,
          )
        }
        ptr = ptrClass.upcast(ptr)
        ptrClass = ptrClass.baseClass
      }
      return ptr
    }
    function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`)
        }
        return 0
      }
      if (!handle.$$) {
        throwBindingError(
          `Cannot pass "${embindRepr(handle)}" as a ${this.name}`,
        )
      }
      if (!handle.$$.ptr) {
        throwBindingError(
          `Cannot pass deleted object as a pointer of type ${this.name}`,
        )
      }
      var handleClass = handle.$$.ptrType.registeredClass
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass)
      return ptr
    }
    function genericPointerToWireType(destructors, handle) {
      var ptr
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`)
        }
        if (this.isSmartPointer) {
          ptr = this.rawConstructor()
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr)
          }
          return ptr
        } else {
          return 0
        }
      }
      if (!handle || !handle.$$) {
        throwBindingError(
          `Cannot pass "${embindRepr(handle)}" as a ${this.name}`,
        )
      }
      if (!handle.$$.ptr) {
        throwBindingError(
          `Cannot pass deleted object as a pointer of type ${this.name}`,
        )
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError(
          `Cannot convert argument of type ${
            handle.$$.smartPtrType
              ? handle.$$.smartPtrType.name
              : handle.$$.ptrType.name
          } to parameter type ${this.name}`,
        )
      }
      var handleClass = handle.$$.ptrType.registeredClass
      ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass)
      if (this.isSmartPointer) {
        if (undefined === handle.$$.smartPtr) {
          throwBindingError("Passing raw pointer to smart pointer is illegal")
        }
        switch (this.sharingPolicy) {
          case 0:
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr
            } else {
              throwBindingError(
                `Cannot convert argument of type ${
                  handle.$$.smartPtrType
                    ? handle.$$.smartPtrType.name
                    : handle.$$.ptrType.name
                } to parameter type ${this.name}`,
              )
            }
            break
          case 1:
            ptr = handle.$$.smartPtr
            break
          case 2:
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr
            } else {
              var clonedHandle = handle["clone"]()
              ptr = this.rawShare(
                ptr,
                Emval.toHandle(() => clonedHandle["delete"]()),
              )
              if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr)
              }
            }
            break
          default:
            throwBindingError("Unsupporting sharing policy")
        }
      }
      return ptr
    }
    function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`)
        }
        return 0
      }
      if (!handle.$$) {
        throwBindingError(
          `Cannot pass "${embindRepr(handle)}" as a ${this.name}`,
        )
      }
      if (!handle.$$.ptr) {
        throwBindingError(
          `Cannot pass deleted object as a pointer of type ${this.name}`,
        )
      }
      if (handle.$$.ptrType.isConst) {
        throwBindingError(
          `Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`,
        )
      }
      var handleClass = handle.$$.ptrType.registeredClass
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass)
      return ptr
    }
    var init_RegisteredPointer = () => {
      Object.assign(RegisteredPointer.prototype, {
        getPointee(ptr) {
          if (this.rawGetPointee) {
            ptr = this.rawGetPointee(ptr)
          }
          return ptr
        },
        destructor(ptr) {
          this.rawDestructor?.(ptr)
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: readPointer,
        fromWireType: RegisteredPointer_fromWireType,
      })
    }
    function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor,
    ) {
      this.name = name
      this.registeredClass = registeredClass
      this.isReference = isReference
      this.isConst = isConst
      this.isSmartPointer = isSmartPointer
      this.pointeeType = pointeeType
      this.sharingPolicy = sharingPolicy
      this.rawGetPointee = rawGetPointee
      this.rawConstructor = rawConstructor
      this.rawShare = rawShare
      this.rawDestructor = rawDestructor
      if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
          this["toWireType"] = constNoSmartPtrRawPointerToWireType
          this.destructorFunction = null
        } else {
          this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType
          this.destructorFunction = null
        }
      } else {
        this["toWireType"] = genericPointerToWireType
      }
    }
    var replacePublicSymbol = (name, value, numArguments) => {
      if (!Module.hasOwnProperty(name)) {
        throwInternalError("Replacing nonexistent public symbol")
      }
      if (
        undefined !== Module[name].overloadTable &&
        undefined !== numArguments
      ) {
        Module[name].overloadTable[numArguments] = value
      } else {
        Module[name] = value
        Module[name].argCount = numArguments
      }
    }
    var wasmTableMirror = []
    var wasmTable
    var getWasmTableEntry = (funcPtr) => {
      var func = wasmTableMirror[funcPtr]
      if (!func) {
        if (funcPtr >= wasmTableMirror.length)
          wasmTableMirror.length = funcPtr + 1
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr)
      }
      return func
    }
    var embind__requireFunction = (signature, rawFunction) => {
      signature = readLatin1String(signature)
      function makeDynCaller() {
        return getWasmTableEntry(rawFunction)
      }
      var fp = makeDynCaller()
      if (typeof fp != "function") {
        throwBindingError(
          `unknown function pointer with signature ${signature}: ${rawFunction}`,
        )
      }
      return fp
    }
    var extendError = (baseErrorType, errorName) => {
      var errorClass = createNamedFunction(errorName, function (message) {
        this.name = errorName
        this.message = message
        var stack = new Error(message).stack
        if (stack !== undefined) {
          this.stack =
            this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
        }
      })
      errorClass.prototype = Object.create(baseErrorType.prototype)
      errorClass.prototype.constructor = errorClass
      errorClass.prototype.toString = function () {
        if (this.message === undefined) {
          return this.name
        } else {
          return `${this.name}: ${this.message}`
        }
      }
      return errorClass
    }
    var UnboundTypeError
    var getTypeName = (type) => {
      var ptr = ___getTypeName(type)
      var rv = readLatin1String(ptr)
      _free(ptr)
      return rv
    }
    var throwUnboundTypeError = (message, types) => {
      var unboundTypes = []
      var seen = {}
      function visit(type) {
        if (seen[type]) {
          return
        }
        if (registeredTypes[type]) {
          return
        }
        if (typeDependencies[type]) {
          typeDependencies[type].forEach(visit)
          return
        }
        unboundTypes.push(type)
        seen[type] = true
      }
      types.forEach(visit)
      throw new UnboundTypeError(
        `${message}: ` + unboundTypes.map(getTypeName).join([", "]),
      )
    }
    var __embind_register_class = (
      rawType,
      rawPointerType,
      rawConstPointerType,
      baseClassRawType,
      getActualTypeSignature,
      getActualType,
      upcastSignature,
      upcast,
      downcastSignature,
      downcast,
      name,
      destructorSignature,
      rawDestructor,
    ) => {
      name = readLatin1String(name)
      getActualType = embind__requireFunction(
        getActualTypeSignature,
        getActualType,
      )
      upcast &&= embind__requireFunction(upcastSignature, upcast)
      downcast &&= embind__requireFunction(downcastSignature, downcast)
      rawDestructor = embind__requireFunction(
        destructorSignature,
        rawDestructor,
      )
      var legalFunctionName = makeLegalFunctionName(name)
      exposePublicSymbol(legalFunctionName, function () {
        throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [
          baseClassRawType,
        ])
      })
      whenDependentTypesAreResolved(
        [rawType, rawPointerType, rawConstPointerType],
        baseClassRawType ? [baseClassRawType] : [],
        (base) => {
          base = base[0]
          var baseClass
          var basePrototype
          if (baseClassRawType) {
            baseClass = base.registeredClass
            basePrototype = baseClass.instancePrototype
          } else {
            basePrototype = ClassHandle.prototype
          }
          var constructor = createNamedFunction(name, function (...args) {
            if (Object.getPrototypeOf(this) !== instancePrototype) {
              throw new BindingError("Use 'new' to construct " + name)
            }
            if (undefined === registeredClass.constructor_body) {
              throw new BindingError(name + " has no accessible constructor")
            }
            var body = registeredClass.constructor_body[args.length]
            if (undefined === body) {
              throw new BindingError(
                `Tried to invoke ctor of ${name} with invalid number of parameters (${
                  args.length
                }) - expected (${Object.keys(
                  registeredClass.constructor_body,
                ).toString()}) parameters instead!`,
              )
            }
            return body.apply(this, args)
          })
          var instancePrototype = Object.create(basePrototype, {
            constructor: { value: constructor },
          })
          constructor.prototype = instancePrototype
          var registeredClass = new RegisteredClass(
            name,
            constructor,
            instancePrototype,
            rawDestructor,
            baseClass,
            getActualType,
            upcast,
            downcast,
          )
          if (registeredClass.baseClass) {
            registeredClass.baseClass.__derivedClasses ??= []
            registeredClass.baseClass.__derivedClasses.push(registeredClass)
          }
          var referenceConverter = new RegisteredPointer(
            name,
            registeredClass,
            true,
            false,
            false,
          )
          var pointerConverter = new RegisteredPointer(
            name + "*",
            registeredClass,
            false,
            false,
            false,
          )
          var constPointerConverter = new RegisteredPointer(
            name + " const*",
            registeredClass,
            false,
            true,
            false,
          )
          registeredPointers[rawType] = {
            pointerType: pointerConverter,
            constPointerType: constPointerConverter,
          }
          replacePublicSymbol(legalFunctionName, constructor)
          return [referenceConverter, pointerConverter, constPointerConverter]
        },
      )
    }
    var heap32VectorToArray = (count, firstElement) => {
      var array = []
      for (var i = 0; i < count; i++) {
        array.push(HEAPU32[(firstElement + i * 4) >> 2])
      }
      return array
    }
    function usesDestructorStack(argTypes) {
      for (var i = 1; i < argTypes.length; ++i) {
        if (
          argTypes[i] !== null &&
          argTypes[i].destructorFunction === undefined
        ) {
          return true
        }
      }
      return false
    }
    function newFunc(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
        throw new TypeError(
          `new_ called with constructor type ${typeof constructor} which is not a function`,
        )
      }
      var dummy = createNamedFunction(
        constructor.name || "unknownFunctionName",
        function () {},
      )
      dummy.prototype = constructor.prototype
      var obj = new dummy()
      var r = constructor.apply(obj, argumentList)
      return r instanceof Object ? r : obj
    }
    function createJsInvoker(argTypes, isClassMethodFunc, returns, isAsync) {
      var needsDestructorStack = usesDestructorStack(argTypes)
      var argCount = argTypes.length - 2
      var argsList = []
      var argsListWired = ["fn"]
      if (isClassMethodFunc) {
        argsListWired.push("thisWired")
      }
      for (var i = 0; i < argCount; ++i) {
        argsList.push(`arg${i}`)
        argsListWired.push(`arg${i}Wired`)
      }
      argsList = argsList.join(",")
      argsListWired = argsListWired.join(",")
      var invokerFnBody = `\n        return function (${argsList}) {\n        if (arguments.length !== ${argCount}) {\n          throwBindingError('function ' + humanName + ' called with ' + arguments.length + ' arguments, expected ${argCount}');\n        }`
      if (needsDestructorStack) {
        invokerFnBody += "var destructors = [];\n"
      }
      var dtorStack = needsDestructorStack ? "destructors" : "null"
      var args1 = [
        "humanName",
        "throwBindingError",
        "invoker",
        "fn",
        "runDestructors",
        "retType",
        "classParam",
      ]
      if (isClassMethodFunc) {
        invokerFnBody += `var thisWired = classParam['toWireType'](${dtorStack}, this);\n`
      }
      for (var i = 0; i < argCount; ++i) {
        invokerFnBody += `var arg${i}Wired = argType${i}['toWireType'](${dtorStack}, arg${i});\n`
        args1.push(`argType${i}`)
      }
      invokerFnBody +=
        (returns || isAsync ? "var rv = " : "") + `invoker(${argsListWired});\n`
      if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n"
      } else {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
          var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired"
          if (argTypes[i].destructorFunction !== null) {
            invokerFnBody += `${paramName}_dtor(${paramName});\n`
            args1.push(`${paramName}_dtor`)
          }
        }
      }
      if (returns) {
        invokerFnBody +=
          "var ret = retType['fromWireType'](rv);\n" + "return ret;\n"
      } else {
      }
      invokerFnBody += "}\n"
      return [args1, invokerFnBody]
    }
    function craftInvokerFunction(
      humanName,
      argTypes,
      classType,
      cppInvokerFunc,
      cppTargetFunc,
      isAsync,
    ) {
      var argCount = argTypes.length
      if (argCount < 2) {
        throwBindingError(
          "argTypes array size mismatch! Must at least get return value and 'this' types!",
        )
      }
      var isClassMethodFunc = argTypes[1] !== null && classType !== null
      var needsDestructorStack = usesDestructorStack(argTypes)
      var returns = argTypes[0].name !== "void"
      var closureArgs = [
        humanName,
        throwBindingError,
        cppInvokerFunc,
        cppTargetFunc,
        runDestructors,
        argTypes[0],
        argTypes[1],
      ]
      for (var i = 0; i < argCount - 2; ++i) {
        closureArgs.push(argTypes[i + 2])
      }
      if (!needsDestructorStack) {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
          if (argTypes[i].destructorFunction !== null) {
            closureArgs.push(argTypes[i].destructorFunction)
          }
        }
      }
      let [args, invokerFnBody] = createJsInvoker(
        argTypes,
        isClassMethodFunc,
        returns,
        isAsync,
      )
      args.push(invokerFnBody)
      var invokerFn = newFunc(Function, args)(...closureArgs)
      return createNamedFunction(humanName, invokerFn)
    }
    var __embind_register_class_constructor = (
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor,
    ) => {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr)
      invoker = embind__requireFunction(invokerSignature, invoker)
      whenDependentTypesAreResolved([], [rawClassType], (classType) => {
        classType = classType[0]
        var humanName = `constructor ${classType.name}`
        if (undefined === classType.registeredClass.constructor_body) {
          classType.registeredClass.constructor_body = []
        }
        if (
          undefined !== classType.registeredClass.constructor_body[argCount - 1]
        ) {
          throw new BindingError(
            `Cannot register multiple constructors with identical number of parameters (${
              argCount - 1
            }) for class '${
              classType.name
            }'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
          )
        }
        classType.registeredClass.constructor_body[argCount - 1] = () => {
          throwUnboundTypeError(
            `Cannot construct ${classType.name} due to unbound types`,
            rawArgTypes,
          )
        }
        whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
          argTypes.splice(1, 0, null)
          classType.registeredClass.constructor_body[argCount - 1] =
            craftInvokerFunction(
              humanName,
              argTypes,
              null,
              invoker,
              rawConstructor,
            )
          return []
        })
        return []
      })
    }
    var getFunctionName = (signature) => {
      signature = signature.trim()
      const argsIndex = signature.indexOf("(")
      if (argsIndex !== -1) {
        return signature.substr(0, argsIndex)
      } else {
        return signature
      }
    }
    var __embind_register_class_function = (
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      rawInvoker,
      context,
      isPureVirtual,
      isAsync,
      isNonnullReturn,
    ) => {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr)
      methodName = readLatin1String(methodName)
      methodName = getFunctionName(methodName)
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker)
      whenDependentTypesAreResolved([], [rawClassType], (classType) => {
        classType = classType[0]
        var humanName = `${classType.name}.${methodName}`
        if (methodName.startsWith("@@")) {
          methodName = Symbol[methodName.substring(2)]
        }
        if (isPureVirtual) {
          classType.registeredClass.pureVirtualFunctions.push(methodName)
        }
        function unboundTypesHandler() {
          throwUnboundTypeError(
            `Cannot call ${humanName} due to unbound types`,
            rawArgTypes,
          )
        }
        var proto = classType.registeredClass.instancePrototype
        var method = proto[methodName]
        if (
          undefined === method ||
          (undefined === method.overloadTable &&
            method.className !== classType.name &&
            method.argCount === argCount - 2)
        ) {
          unboundTypesHandler.argCount = argCount - 2
          unboundTypesHandler.className = classType.name
          proto[methodName] = unboundTypesHandler
        } else {
          ensureOverloadTable(proto, methodName, humanName)
          proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler
        }
        whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
          var memberFunction = craftInvokerFunction(
            humanName,
            argTypes,
            classType,
            rawInvoker,
            context,
            isAsync,
          )
          if (undefined === proto[methodName].overloadTable) {
            memberFunction.argCount = argCount - 2
            proto[methodName] = memberFunction
          } else {
            proto[methodName].overloadTable[argCount - 2] = memberFunction
          }
          return []
        })
        return []
      })
    }
    var __embind_register_constant = (name, type, value) => {
      name = readLatin1String(name)
      whenDependentTypesAreResolved([], [type], (type) => {
        type = type[0]
        Module[name] = type["fromWireType"](value)
        return []
      })
    }
    var emval_freelist = []
    var emval_handles = []
    var __emval_decref = (handle) => {
      if (handle > 9 && 0 === --emval_handles[handle + 1]) {
        emval_handles[handle] = undefined
        emval_freelist.push(handle)
      }
    }
    var count_emval_handles = () =>
      emval_handles.length / 2 - 5 - emval_freelist.length
    var init_emval = () => {
      emval_handles.push(0, 1, undefined, 1, null, 1, true, 1, false, 1)
      Module["count_emval_handles"] = count_emval_handles
    }
    var Emval = {
      toValue: (handle) => {
        if (!handle) {
          throwBindingError("Cannot use deleted val. handle = " + handle)
        }
        return emval_handles[handle]
      },
      toHandle: (value) => {
        switch (value) {
          case undefined:
            return 2
          case null:
            return 4
          case true:
            return 6
          case false:
            return 8
          default: {
            const handle = emval_freelist.pop() || emval_handles.length
            emval_handles[handle] = value
            emval_handles[handle + 1] = 1
            return handle
          }
        }
      },
    }
    var EmValType = {
      name: "emscripten::val",
      fromWireType: (handle) => {
        var rv = Emval.toValue(handle)
        __emval_decref(handle)
        return rv
      },
      toWireType: (destructors, value) => Emval.toHandle(value),
      argPackAdvance: GenericWireTypeSize,
      readValueFromPointer: readPointer,
      destructorFunction: null,
    }
    var __embind_register_emval = (rawType) => registerType(rawType, EmValType)
    var enumReadValueFromPointer = (name, width, signed) => {
      switch (width) {
        case 1:
          return signed
            ? function (pointer) {
                return this["fromWireType"](HEAP8[pointer])
              }
            : function (pointer) {
                return this["fromWireType"](HEAPU8[pointer])
              }
        case 2:
          return signed
            ? function (pointer) {
                return this["fromWireType"](HEAP16[pointer >> 1])
              }
            : function (pointer) {
                return this["fromWireType"](HEAPU16[pointer >> 1])
              }
        case 4:
          return signed
            ? function (pointer) {
                return this["fromWireType"](HEAP32[pointer >> 2])
              }
            : function (pointer) {
                return this["fromWireType"](HEAPU32[pointer >> 2])
              }
        default:
          throw new TypeError(`invalid integer width (${width}): ${name}`)
      }
    }
    var __embind_register_enum = (rawType, name, size, isSigned) => {
      name = readLatin1String(name)
      function ctor() {}
      ctor.values = {}
      registerType(rawType, {
        name,
        constructor: ctor,
        fromWireType: function (c) {
          return this.constructor.values[c]
        },
        toWireType: (destructors, c) => c.value,
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: enumReadValueFromPointer(name, size, isSigned),
        destructorFunction: null,
      })
      exposePublicSymbol(name, ctor)
    }
    var requireRegisteredType = (rawType, humanName) => {
      var impl = registeredTypes[rawType]
      if (undefined === impl) {
        throwBindingError(
          `${humanName} has unknown type ${getTypeName(rawType)}`,
        )
      }
      return impl
    }
    var __embind_register_enum_value = (rawEnumType, name, enumValue) => {
      var enumType = requireRegisteredType(rawEnumType, "enum")
      name = readLatin1String(name)
      var Enum = enumType.constructor
      var Value = Object.create(enumType.constructor.prototype, {
        value: { value: enumValue },
        constructor: {
          value: createNamedFunction(
            `${enumType.name}_${name}`,
            function () {},
          ),
        },
      })
      Enum.values[enumValue] = Value
      Enum[name] = Value
    }
    var floatReadValueFromPointer = (name, width) => {
      switch (width) {
        case 4:
          return function (pointer) {
            return this["fromWireType"](HEAPF32[pointer >> 2])
          }
        case 8:
          return function (pointer) {
            return this["fromWireType"](HEAPF64[pointer >> 3])
          }
        default:
          throw new TypeError(`invalid float width (${width}): ${name}`)
      }
    }
    var __embind_register_float = (rawType, name, size) => {
      name = readLatin1String(name)
      registerType(rawType, {
        name,
        fromWireType: (value) => value,
        toWireType: (destructors, value) => value,
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: floatReadValueFromPointer(name, size),
        destructorFunction: null,
      })
    }
    var __embind_register_function = (
      name,
      argCount,
      rawArgTypesAddr,
      signature,
      rawInvoker,
      fn,
      isAsync,
      isNonnullReturn,
    ) => {
      var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr)
      name = readLatin1String(name)
      name = getFunctionName(name)
      rawInvoker = embind__requireFunction(signature, rawInvoker)
      exposePublicSymbol(
        name,
        function () {
          throwUnboundTypeError(
            `Cannot call ${name} due to unbound types`,
            argTypes,
          )
        },
        argCount - 1,
      )
      whenDependentTypesAreResolved([], argTypes, (argTypes) => {
        var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1))
        replacePublicSymbol(
          name,
          craftInvokerFunction(
            name,
            invokerArgsArray,
            null,
            rawInvoker,
            fn,
            isAsync,
          ),
          argCount - 1,
        )
        return []
      })
    }
    var __embind_register_integer = (
      primitiveType,
      name,
      size,
      minRange,
      maxRange,
    ) => {
      name = readLatin1String(name)
      if (maxRange === -1) {
        maxRange = 4294967295
      }
      var fromWireType = (value) => value
      if (minRange === 0) {
        var bitshift = 32 - 8 * size
        fromWireType = (value) => (value << bitshift) >>> bitshift
      }
      var isUnsignedType = name.includes("unsigned")
      var checkAssertions = (value, toTypeName) => {}
      var toWireType
      if (isUnsignedType) {
        toWireType = function (destructors, value) {
          checkAssertions(value, this.name)
          return value >>> 0
        }
      } else {
        toWireType = function (destructors, value) {
          checkAssertions(value, this.name)
          return value
        }
      }
      registerType(primitiveType, {
        name,
        fromWireType,
        toWireType,
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: integerReadValueFromPointer(
          name,
          size,
          minRange !== 0,
        ),
        destructorFunction: null,
      })
    }
    var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
      var typeMapping = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
        BigInt64Array,
        BigUint64Array,
      ]
      var TA = typeMapping[dataTypeIndex]
      function decodeMemoryView(handle) {
        var size = HEAPU32[handle >> 2]
        var data = HEAPU32[(handle + 4) >> 2]
        return new TA(HEAP8.buffer, data, size)
      }
      name = readLatin1String(name)
      registerType(
        rawType,
        {
          name,
          fromWireType: decodeMemoryView,
          argPackAdvance: GenericWireTypeSize,
          readValueFromPointer: decodeMemoryView,
        },
        { ignoreDuplicateRegistrations: true },
      )
    }
    var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      if (!(maxBytesToWrite > 0)) return 0
      var startIdx = outIdx
      var endIdx = outIdx + maxBytesToWrite - 1
      for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i)
        if (u >= 55296 && u <= 57343) {
          var u1 = str.charCodeAt(++i)
          u = (65536 + ((u & 1023) << 10)) | (u1 & 1023)
        }
        if (u <= 127) {
          if (outIdx >= endIdx) break
          heap[outIdx++] = u
        } else if (u <= 2047) {
          if (outIdx + 1 >= endIdx) break
          heap[outIdx++] = 192 | (u >> 6)
          heap[outIdx++] = 128 | (u & 63)
        } else if (u <= 65535) {
          if (outIdx + 2 >= endIdx) break
          heap[outIdx++] = 224 | (u >> 12)
          heap[outIdx++] = 128 | ((u >> 6) & 63)
          heap[outIdx++] = 128 | (u & 63)
        } else {
          if (outIdx + 3 >= endIdx) break
          heap[outIdx++] = 240 | (u >> 18)
          heap[outIdx++] = 128 | ((u >> 12) & 63)
          heap[outIdx++] = 128 | ((u >> 6) & 63)
          heap[outIdx++] = 128 | (u & 63)
        }
      }
      heap[outIdx] = 0
      return outIdx - startIdx
    }
    var stringToUTF8 = (str, outPtr, maxBytesToWrite) =>
      stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
    var lengthBytesUTF8 = (str) => {
      var len = 0
      for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i)
        if (c <= 127) {
          len++
        } else if (c <= 2047) {
          len += 2
        } else if (c >= 55296 && c <= 57343) {
          len += 4
          ++i
        } else {
          len += 3
        }
      }
      return len
    }
    var __embind_register_std_string = (rawType, name) => {
      name = readLatin1String(name)
      var stdStringIsUTF8 = name === "std::string"
      registerType(rawType, {
        name,
        fromWireType(value) {
          var length = HEAPU32[value >> 2]
          var payload = value + 4
          var str
          if (stdStringIsUTF8) {
            var decodeStartPtr = payload
            for (var i = 0; i <= length; ++i) {
              var currentBytePtr = payload + i
              if (i == length || HEAPU8[currentBytePtr] == 0) {
                var maxRead = currentBytePtr - decodeStartPtr
                var stringSegment = UTF8ToString(decodeStartPtr, maxRead)
                if (str === undefined) {
                  str = stringSegment
                } else {
                  str += String.fromCharCode(0)
                  str += stringSegment
                }
                decodeStartPtr = currentBytePtr + 1
              }
            }
          } else {
            var a = new Array(length)
            for (var i = 0; i < length; ++i) {
              a[i] = String.fromCharCode(HEAPU8[payload + i])
            }
            str = a.join("")
          }
          _free(value)
          return str
        },
        toWireType(destructors, value) {
          if (value instanceof ArrayBuffer) {
            value = new Uint8Array(value)
          }
          var length
          var valueIsOfTypeString = typeof value == "string"
          if (
            !(
              valueIsOfTypeString ||
              value instanceof Uint8Array ||
              value instanceof Uint8ClampedArray ||
              value instanceof Int8Array
            )
          ) {
            throwBindingError("Cannot pass non-string to std::string")
          }
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            length = lengthBytesUTF8(value)
          } else {
            length = value.length
          }
          var base = _malloc(4 + length + 1)
          var ptr = base + 4
          HEAPU32[base >> 2] = length
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            stringToUTF8(value, ptr, length + 1)
          } else {
            if (valueIsOfTypeString) {
              for (var i = 0; i < length; ++i) {
                var charCode = value.charCodeAt(i)
                if (charCode > 255) {
                  _free(ptr)
                  throwBindingError(
                    "String has UTF-16 code units that do not fit in 8 bits",
                  )
                }
                HEAPU8[ptr + i] = charCode
              }
            } else {
              for (var i = 0; i < length; ++i) {
                HEAPU8[ptr + i] = value[i]
              }
            }
          }
          if (destructors !== null) {
            destructors.push(_free, base)
          }
          return base
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: readPointer,
        destructorFunction(ptr) {
          _free(ptr)
        },
      })
    }
    var UTF16Decoder =
      typeof TextDecoder != "undefined"
        ? new TextDecoder("utf-16le")
        : undefined
    var UTF16ToString = (ptr, maxBytesToRead) => {
      var endPtr = ptr
      var idx = endPtr >> 1
      var maxIdx = idx + maxBytesToRead / 2
      while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx
      endPtr = idx << 1
      if (endPtr - ptr > 32 && UTF16Decoder)
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr))
      var str = ""
      for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
        var codeUnit = HEAP16[(ptr + i * 2) >> 1]
        if (codeUnit == 0) break
        str += String.fromCharCode(codeUnit)
      }
      return str
    }
    var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
      maxBytesToWrite ??= 2147483647
      if (maxBytesToWrite < 2) return 0
      maxBytesToWrite -= 2
      var startPtr = outPtr
      var numCharsToWrite =
        maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length
      for (var i = 0; i < numCharsToWrite; ++i) {
        var codeUnit = str.charCodeAt(i)
        HEAP16[outPtr >> 1] = codeUnit
        outPtr += 2
      }
      HEAP16[outPtr >> 1] = 0
      return outPtr - startPtr
    }
    var lengthBytesUTF16 = (str) => str.length * 2
    var UTF32ToString = (ptr, maxBytesToRead) => {
      var i = 0
      var str = ""
      while (!(i >= maxBytesToRead / 4)) {
        var utf32 = HEAP32[(ptr + i * 4) >> 2]
        if (utf32 == 0) break
        ++i
        if (utf32 >= 65536) {
          var ch = utf32 - 65536
          str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023))
        } else {
          str += String.fromCharCode(utf32)
        }
      }
      return str
    }
    var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
      maxBytesToWrite ??= 2147483647
      if (maxBytesToWrite < 4) return 0
      var startPtr = outPtr
      var endPtr = startPtr + maxBytesToWrite - 4
      for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i)
        if (codeUnit >= 55296 && codeUnit <= 57343) {
          var trailSurrogate = str.charCodeAt(++i)
          codeUnit =
            (65536 + ((codeUnit & 1023) << 10)) | (trailSurrogate & 1023)
        }
        HEAP32[outPtr >> 2] = codeUnit
        outPtr += 4
        if (outPtr + 4 > endPtr) break
      }
      HEAP32[outPtr >> 2] = 0
      return outPtr - startPtr
    }
    var lengthBytesUTF32 = (str) => {
      var len = 0
      for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i)
        if (codeUnit >= 55296 && codeUnit <= 57343) ++i
        len += 4
      }
      return len
    }
    var __embind_register_std_wstring = (rawType, charSize, name) => {
      name = readLatin1String(name)
      var decodeString, encodeString, readCharAt, lengthBytesUTF
      if (charSize === 2) {
        decodeString = UTF16ToString
        encodeString = stringToUTF16
        lengthBytesUTF = lengthBytesUTF16
        readCharAt = (pointer) => HEAPU16[pointer >> 1]
      } else if (charSize === 4) {
        decodeString = UTF32ToString
        encodeString = stringToUTF32
        lengthBytesUTF = lengthBytesUTF32
        readCharAt = (pointer) => HEAPU32[pointer >> 2]
      }
      registerType(rawType, {
        name,
        fromWireType: (value) => {
          var length = HEAPU32[value >> 2]
          var str
          var decodeStartPtr = value + 4
          for (var i = 0; i <= length; ++i) {
            var currentBytePtr = value + 4 + i * charSize
            if (i == length || readCharAt(currentBytePtr) == 0) {
              var maxReadBytes = currentBytePtr - decodeStartPtr
              var stringSegment = decodeString(decodeStartPtr, maxReadBytes)
              if (str === undefined) {
                str = stringSegment
              } else {
                str += String.fromCharCode(0)
                str += stringSegment
              }
              decodeStartPtr = currentBytePtr + charSize
            }
          }
          _free(value)
          return str
        },
        toWireType: (destructors, value) => {
          if (!(typeof value == "string")) {
            throwBindingError(
              `Cannot pass non-string to C++ string type ${name}`,
            )
          }
          var length = lengthBytesUTF(value)
          var ptr = _malloc(4 + length + charSize)
          HEAPU32[ptr >> 2] = length / charSize
          encodeString(value, ptr + 4, length + charSize)
          if (destructors !== null) {
            destructors.push(_free, ptr)
          }
          return ptr
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: readPointer,
        destructorFunction(ptr) {
          _free(ptr)
        },
      })
    }
    var __embind_register_value_object = (
      rawType,
      name,
      constructorSignature,
      rawConstructor,
      destructorSignature,
      rawDestructor,
    ) => {
      structRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: embind__requireFunction(
          constructorSignature,
          rawConstructor,
        ),
        rawDestructor: embind__requireFunction(
          destructorSignature,
          rawDestructor,
        ),
        fields: [],
      }
    }
    var __embind_register_value_object_field = (
      structType,
      fieldName,
      getterReturnType,
      getterSignature,
      getter,
      getterContext,
      setterArgumentType,
      setterSignature,
      setter,
      setterContext,
    ) => {
      structRegistrations[structType].fields.push({
        fieldName: readLatin1String(fieldName),
        getterReturnType,
        getter: embind__requireFunction(getterSignature, getter),
        getterContext,
        setterArgumentType,
        setter: embind__requireFunction(setterSignature, setter),
        setterContext,
      })
    }
    var __embind_register_void = (rawType, name) => {
      name = readLatin1String(name)
      registerType(rawType, {
        isVoid: true,
        name,
        argPackAdvance: 0,
        fromWireType: () => undefined,
        toWireType: (destructors, o) => undefined,
      })
    }
    var __emscripten_runtime_keepalive_clear = () => {
      noExitRuntime = false
      runtimeKeepaliveCounter = 0
    }
    var __emscripten_throw_longjmp = () => {
      throw Infinity
    }
    var emval_returnValue = (returnType, destructorsRef, handle) => {
      var destructors = []
      var result = returnType["toWireType"](destructors, handle)
      if (destructors.length) {
        HEAPU32[destructorsRef >> 2] = Emval.toHandle(destructors)
      }
      return result
    }
    var __emval_as = (handle, returnType, destructorsRef) => {
      handle = Emval.toValue(handle)
      returnType = requireRegisteredType(returnType, "emval::as")
      return emval_returnValue(returnType, destructorsRef, handle)
    }
    var emval_methodCallers = []
    var __emval_call = (caller, handle, destructorsRef, args) => {
      caller = emval_methodCallers[caller]
      handle = Emval.toValue(handle)
      return caller(null, handle, destructorsRef, args)
    }
    var emval_symbols = {}
    var getStringOrSymbol = (address) => {
      var symbol = emval_symbols[address]
      if (symbol === undefined) {
        return readLatin1String(address)
      }
      return symbol
    }
    var __emval_call_method = (
      caller,
      objHandle,
      methodName,
      destructorsRef,
      args,
    ) => {
      caller = emval_methodCallers[caller]
      objHandle = Emval.toValue(objHandle)
      methodName = getStringOrSymbol(methodName)
      return caller(objHandle, objHandle[methodName], destructorsRef, args)
    }
    var emval_get_global = () => {
      if (typeof globalThis == "object") {
        return globalThis
      }
      return (function () {
        return Function
      })()("return this")()
    }
    var __emval_get_global = (name) => {
      if (name === 0) {
        return Emval.toHandle(emval_get_global())
      } else {
        name = getStringOrSymbol(name)
        return Emval.toHandle(emval_get_global()[name])
      }
    }
    var emval_addMethodCaller = (caller) => {
      var id = emval_methodCallers.length
      emval_methodCallers.push(caller)
      return id
    }
    var emval_lookupTypes = (argCount, argTypes) => {
      var a = new Array(argCount)
      for (var i = 0; i < argCount; ++i) {
        a[i] = requireRegisteredType(
          HEAPU32[(argTypes + i * 4) >> 2],
          "parameter " + i,
        )
      }
      return a
    }
    var reflectConstruct = Reflect.construct
    var __emval_get_method_caller = (argCount, argTypes, kind) => {
      var types = emval_lookupTypes(argCount, argTypes)
      var retType = types.shift()
      argCount--
      var functionBody = `return function (obj, func, destructorsRef, args) {\n`
      var offset = 0
      var argsList = []
      if (kind === 0) {
        argsList.push("obj")
      }
      var params = ["retType"]
      var args = [retType]
      for (var i = 0; i < argCount; ++i) {
        argsList.push("arg" + i)
        params.push("argType" + i)
        args.push(types[i])
        functionBody += `  var arg${i} = argType${i}.readValueFromPointer(args${
          offset ? "+" + offset : ""
        });\n`
        offset += types[i].argPackAdvance
      }
      var invoker = kind === 1 ? "new func" : "func.call"
      functionBody += `  var rv = ${invoker}(${argsList.join(", ")});\n`
      if (!retType.isVoid) {
        params.push("emval_returnValue")
        args.push(emval_returnValue)
        functionBody +=
          "  return emval_returnValue(retType, destructorsRef, rv);\n"
      }
      functionBody += "};\n"
      params.push(functionBody)
      var invokerFunction = newFunc(Function, params)(...args)
      var functionName = `methodCaller<(${types
        .map((t) => t.name)
        .join(", ")}) => ${retType.name}>`
      return emval_addMethodCaller(
        createNamedFunction(functionName, invokerFunction),
      )
    }
    var __emval_get_module_property = (name) => {
      name = getStringOrSymbol(name)
      return Emval.toHandle(Module[name])
    }
    var __emval_get_property = (handle, key) => {
      handle = Emval.toValue(handle)
      key = Emval.toValue(key)
      return Emval.toHandle(handle[key])
    }
    var __emval_incref = (handle) => {
      if (handle > 9) {
        emval_handles[handle + 1] += 1
      }
    }
    var __emval_new_cstring = (v) => Emval.toHandle(getStringOrSymbol(v))
    var __emval_run_destructors = (handle) => {
      var destructors = Emval.toValue(handle)
      runDestructors(destructors)
      __emval_decref(handle)
    }
    var INT53_MAX = 9007199254740992
    var INT53_MIN = -9007199254740992
    var bigintToI53Checked = (num) =>
      num < INT53_MIN || num > INT53_MAX ? NaN : Number(num)
    function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
      offset = bigintToI53Checked(offset)
      return -52
    }
    function __munmap_js(addr, len, prot, flags, fd, offset) {
      offset = bigintToI53Checked(offset)
    }
    var timers = {}
    var handleException = (e) => {
      if (e instanceof ExitStatus || e == "unwind") {
        return EXITSTATUS
      }
      quit_(1, e)
    }
    var runtimeKeepaliveCounter = 0
    var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0
    var _proc_exit = (code) => {
      EXITSTATUS = code
      if (!keepRuntimeAlive()) {
        Module["onExit"]?.(code)
        ABORT = true
      }
      quit_(code, new ExitStatus(code))
    }
    var exitJS = (status, implicit) => {
      EXITSTATUS = status
      _proc_exit(status)
    }
    var _exit = exitJS
    var maybeExit = () => {
      if (!keepRuntimeAlive()) {
        try {
          _exit(EXITSTATUS)
        } catch (e) {
          handleException(e)
        }
      }
    }
    var callUserCallback = (func) => {
      if (ABORT) {
        return
      }
      try {
        func()
        maybeExit()
      } catch (e) {
        handleException(e)
      }
    }
    var _emscripten_get_now
    _emscripten_get_now = () => performance.now()
    var __setitimer_js = (which, timeout_ms) => {
      if (timers[which]) {
        clearTimeout(timers[which].id)
        delete timers[which]
      }
      if (!timeout_ms) return 0
      var id = setTimeout(() => {
        delete timers[which]
        callUserCallback(() =>
          __emscripten_timeout(which, _emscripten_get_now()),
        )
      }, timeout_ms)
      timers[which] = { id, timeout_ms }
      return 0
    }
    var __tzset_js = (timezone, daylight, std_name, dst_name) => {
      var currentYear = new Date().getFullYear()
      var winter = new Date(currentYear, 0, 1)
      var summer = new Date(currentYear, 6, 1)
      var winterOffset = winter.getTimezoneOffset()
      var summerOffset = summer.getTimezoneOffset()
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset)
      HEAPU32[timezone >> 2] = stdTimezoneOffset * 60
      HEAP32[daylight >> 2] = Number(winterOffset != summerOffset)
      var extractZone = (timezoneOffset) => {
        var sign = timezoneOffset >= 0 ? "-" : "+"
        var absOffset = Math.abs(timezoneOffset)
        var hours = String(Math.floor(absOffset / 60)).padStart(2, "0")
        var minutes = String(absOffset % 60).padStart(2, "0")
        return `UTC${sign}${hours}${minutes}`
      }
      var winterName = extractZone(winterOffset)
      var summerName = extractZone(summerOffset)
      if (summerOffset < winterOffset) {
        stringToUTF8(winterName, std_name, 17)
        stringToUTF8(summerName, dst_name, 17)
      } else {
        stringToUTF8(winterName, dst_name, 17)
        stringToUTF8(summerName, std_name, 17)
      }
    }
    var _emscripten_date_now = () => Date.now()
    var getHeapMax = () => 2147483648
    var alignMemory = (size, alignment) =>
      Math.ceil(size / alignment) * alignment
    var growMemory = (size) => {
      var b = wasmMemory.buffer
      var pages = (size - b.byteLength + 65535) / 65536
      try {
        wasmMemory.grow(pages)
        updateMemoryViews()
        return 1
      } catch (e) {}
    }
    var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length
      requestedSize >>>= 0
      var maxHeapSize = getHeapMax()
      if (requestedSize > maxHeapSize) {
        return false
      }
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown)
        overGrownHeapSize = Math.min(
          overGrownHeapSize,
          requestedSize + 100663296,
        )
        var newSize = Math.min(
          maxHeapSize,
          alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536),
        )
        var replacement = growMemory(newSize)
        if (replacement) {
          return true
        }
      }
      return false
    }
    var ENV = {}
    var getExecutableName = () => thisProgram || "./this.program"
    var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        var lang =
          (
            (typeof navigator == "object" &&
              navigator.languages &&
              navigator.languages[0]) ||
            "C"
          ).replace("-", "_") + ".UTF-8"
        var env = {
          USER: "web_user",
          LOGNAME: "web_user",
          PATH: "/",
          PWD: "/",
          HOME: "/home/web_user",
          LANG: lang,
          _: getExecutableName(),
        }
        for (var x in ENV) {
          if (ENV[x] === undefined) delete env[x]
          else env[x] = ENV[x]
        }
        var strings = []
        for (var x in env) {
          strings.push(`${x}=${env[x]}`)
        }
        getEnvStrings.strings = strings
      }
      return getEnvStrings.strings
    }
    var stringToAscii = (str, buffer) => {
      for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++] = str.charCodeAt(i)
      }
      HEAP8[buffer] = 0
    }
    var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0
      getEnvStrings().forEach((string, i) => {
        var ptr = environ_buf + bufSize
        HEAPU32[(__environ + i * 4) >> 2] = ptr
        stringToAscii(string, ptr)
        bufSize += string.length + 1
      })
      return 0
    }
    var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings()
      HEAPU32[penviron_count >> 2] = strings.length
      var bufSize = 0
      strings.forEach((string) => (bufSize += string.length + 1))
      HEAPU32[penviron_buf_size >> 2] = bufSize
      return 0
    }
    var _fd_close = (fd) => 52
    var _fd_read = (fd, iov, iovcnt, pnum) => 52
    function _fd_seek(fd, offset, whence, newOffset) {
      offset = bigintToI53Checked(offset)
      return 70
    }
    var printCharBuffers = [null, [], []]
    var printChar = (stream, curr) => {
      var buffer = printCharBuffers[stream]
      if (curr === 0 || curr === 10) {
        ;(stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0))
        buffer.length = 0
      } else {
        buffer.push(curr)
      }
    }
    var _fd_write = (fd, iov, iovcnt, pnum) => {
      var num = 0
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2]
        var len = HEAPU32[(iov + 4) >> 2]
        iov += 8
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr + j])
        }
        num += len
      }
      HEAPU32[pnum >> 2] = num
      return 0
    }
    InternalError = Module["InternalError"] = class InternalError extends (
      Error
    ) {
      constructor(message) {
        super(message)
        this.name = "InternalError"
      }
    }
    embind_init_charCodes()
    BindingError = Module["BindingError"] = class BindingError extends Error {
      constructor(message) {
        super(message)
        this.name = "BindingError"
      }
    }
    init_ClassHandle()
    init_embind()
    init_RegisteredPointer()
    UnboundTypeError = Module["UnboundTypeError"] = extendError(
      Error,
      "UnboundTypeError",
    )
    init_emval()
    var wasmImports = {
      z: ___syscall_fcntl64,
      U: ___syscall_fstat64,
      X: ___syscall_ioctl,
      A: ___syscall_openat,
      Z: __abort_js,
      k: __embind_finalize_value_object,
      D: __embind_register_bigint,
      $: __embind_register_bool,
      q: __embind_register_class,
      p: __embind_register_class_constructor,
      c: __embind_register_class_function,
      o: __embind_register_constant,
      _: __embind_register_emval,
      h: __embind_register_enum,
      a: __embind_register_enum_value,
      C: __embind_register_float,
      f: __embind_register_function,
      g: __embind_register_integer,
      d: __embind_register_memory_view,
      E: __embind_register_std_string,
      u: __embind_register_std_wstring,
      l: __embind_register_value_object,
      i: __embind_register_value_object_field,
      aa: __embind_register_void,
      K: __emscripten_runtime_keepalive_clear,
      I: __emscripten_throw_longjmp,
      r: __emval_as,
      B: __emval_call,
      w: __emval_call_method,
      F: __emval_decref,
      ca: __emval_get_global,
      n: __emval_get_method_caller,
      ba: __emval_get_module_property,
      v: __emval_get_property,
      S: __emval_incref,
      da: __emval_new_cstring,
      G: __emval_run_destructors,
      Q: __mmap_js,
      R: __munmap_js,
      L: __setitimer_js,
      M: __tzset_js,
      Y: _emscripten_date_now,
      P: _emscripten_resize_heap,
      N: _environ_get,
      O: _environ_sizes_get,
      t: _fd_close,
      W: _fd_read,
      T: _fd_seek,
      V: _fd_write,
      m: invoke_ii,
      e: invoke_iii,
      j: invoke_iiii,
      y: invoke_iiiii,
      x: invoke_iiiiii,
      s: invoke_vi,
      b: invoke_vii,
      H: invoke_viiii,
      J: _proc_exit,
    }
    var wasmExports = createWasm()
    var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["fa"])()
    var ___getTypeName = (a0) => (___getTypeName = wasmExports["ga"])(a0)
    var _free = (a0) => (_free = wasmExports["ha"])(a0)
    var _malloc = (a0) => (_malloc = wasmExports["ia"])(a0)
    var __emscripten_timeout = (a0, a1) =>
      (__emscripten_timeout = wasmExports["ka"])(a0, a1)
    var _setThrew = (a0, a1) => (_setThrew = wasmExports["la"])(a0, a1)
    var __emscripten_stack_restore = (a0) =>
      (__emscripten_stack_restore = wasmExports["ma"])(a0)
    var _emscripten_stack_get_current = () =>
      (_emscripten_stack_get_current = wasmExports["na"])()
    function invoke_vii(index, a1, a2) {
      var sp = stackSave()
      try {
        getWasmTableEntry(index)(a1, a2)
      } catch (e) {
        stackRestore(sp)
        if (e !== e + 0) throw e
        _setThrew(1, 0)
      }
    }
    function invoke_iiiii(index, a1, a2, a3, a4) {
      var sp = stackSave()
      try {
        return getWasmTableEntry(index)(a1, a2, a3, a4)
      } catch (e) {
        stackRestore(sp)
        if (e !== e + 0) throw e
        _setThrew(1, 0)
      }
    }
    function invoke_vi(index, a1) {
      var sp = stackSave()
      try {
        getWasmTableEntry(index)(a1)
      } catch (e) {
        stackRestore(sp)
        if (e !== e + 0) throw e
        _setThrew(1, 0)
      }
    }
    function invoke_iiii(index, a1, a2, a3) {
      var sp = stackSave()
      try {
        return getWasmTableEntry(index)(a1, a2, a3)
      } catch (e) {
        stackRestore(sp)
        if (e !== e + 0) throw e
        _setThrew(1, 0)
      }
    }
    function invoke_iii(index, a1, a2) {
      var sp = stackSave()
      try {
        return getWasmTableEntry(index)(a1, a2)
      } catch (e) {
        stackRestore(sp)
        if (e !== e + 0) throw e
        _setThrew(1, 0)
      }
    }
    function invoke_ii(index, a1) {
      var sp = stackSave()
      try {
        return getWasmTableEntry(index)(a1)
      } catch (e) {
        stackRestore(sp)
        if (e !== e + 0) throw e
        _setThrew(1, 0)
      }
    }
    function invoke_viiii(index, a1, a2, a3, a4) {
      var sp = stackSave()
      try {
        getWasmTableEntry(index)(a1, a2, a3, a4)
      } catch (e) {
        stackRestore(sp)
        if (e !== e + 0) throw e
        _setThrew(1, 0)
      }
    }
    function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
      var sp = stackSave()
      try {
        return getWasmTableEntry(index)(a1, a2, a3, a4, a5)
      } catch (e) {
        stackRestore(sp)
        if (e !== e + 0) throw e
        _setThrew(1, 0)
      }
    }
    var calledRun
    dependenciesFulfilled = function runCaller() {
      if (!calledRun) run()
      if (!calledRun) dependenciesFulfilled = runCaller
    }
    function run() {
      if (runDependencies > 0) {
        return
      }
      preRun()
      if (runDependencies > 0) {
        return
      }
      function doRun() {
        if (calledRun) return
        calledRun = true
        Module["calledRun"] = true
        if (ABORT) return
        initRuntime()
        readyPromiseResolve(Module)
        Module["onRuntimeInitialized"]?.()
        postRun()
      }
      if (Module["setStatus"]) {
        Module["setStatus"]("Running...")
        setTimeout(() => {
          setTimeout(() => Module["setStatus"](""), 1)
          doRun()
        }, 1)
      } else {
        doRun()
      }
    }
    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]]
      while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
      }
    }
    run()
    moduleRtn = readyPromise

    return moduleRtn
  }
})()
export default BASIS