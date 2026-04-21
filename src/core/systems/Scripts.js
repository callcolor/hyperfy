import { System } from './System'

import * as THREE from '../extras/three'
import { DEG2RAD, RAD2DEG } from '../extras/general'
import { clamp, num, uuid } from '../utils'
import { LerpVector3 } from '../extras/LerpVector3'
import { LerpQuaternion } from '../extras/LerpQuaternion'
import { Curve } from '../extras/Curve'
import { prng } from '../extras/prng'
import { BufferedLerpVector3 } from '../extras/BufferedLerpVector3'
import { BufferedLerpQuaternion } from '../extras/BufferedLerpQuaternion'

/**
 * Script System
 *
 * - Runs on both the server and client.
 * - Executes scripts inside secure compartments
 *
 */

export class Scripts extends System {
  constructor(world) {
    super(world)
    this.compartment = new Compartment({
      console: {
        log: (...args) => console.log(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args),
        time: (...args) => console.time(...args),
        timeEnd: (...args) => console.timeEnd(...args),
      },
      Date: {
        now: () => Date.now(),
      },
      URL: {
        createObjectURL: blob => URL.createObjectURL(blob),
      },
      Math,
      eval: undefined,
      harden: undefined,
      lockdown: undefined,
      num,
      prng,
      clamp,
      // Layers,
      Object3D: THREE.Object3D,
      Quaternion: THREE.Quaternion,
      Vector3: THREE.Vector3,
      Euler: THREE.Euler,
      Matrix4: THREE.Matrix4,
      LerpVector3, // deprecated - use BufferedLerpVector3
      LerpQuaternion, // deprecated - use BufferedLerpQuaternion
      BufferedLerpVector3,
      BufferedLerpQuaternion,
      // Material: Material,
      Curve,
      // Gradient: Gradient,
      DEG2RAD,
      RAD2DEG,
      uuid,
      // pause: () => this.world.pause(),
    })
  }

  evaluate(code, url) {
    let value
    const result = {
      exec: (...args) => {
        if (!value) value = this.compartment.evaluate(wrapRawCode(code, url))
        return value(...args)
      },
      code,
      url,
    }
    return result
  }
}

// Number of wrapper lines inserted before the user's code. Used by App.js to translate
// stack-trace line numbers back to the user's source. MUST stay in sync with wrapRawCode.
export const SCRIPT_USER_LINE_OFFSET = 1

// NOTE: config is deprecated and renamed to props
// NOTE: keep the wrapper prefix on a single line so the line offset remains exactly 1.
function wrapRawCode(code, url) {
  const prefix = `(function(){const shared={};return(world,app,fetch,props,setTimeout)=>{const config=props;`
  const suffix = `\n}})()`
  const sourceURL = url ? `\n//# sourceURL=${url}` : ''
  return `${prefix}\n${code}${suffix}${sourceURL}`
}
