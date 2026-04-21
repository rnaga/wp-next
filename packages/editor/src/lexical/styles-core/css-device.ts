import type * as types from "../../types";
import { CSS_DEFAULT_DEVICE, DEFAULT_STYLES } from "./constants";

export const getUpperDevices = (
  device?: types.BreakpointDevice,
  option?: {
    reverse?: boolean;
  }
) => {
  const devices = Object.keys(DEFAULT_STYLES) as types.BreakpointDevice[];
  const upperDevices = [] as types.BreakpointDevice[];
  for (const _device of devices) {
    if (device === _device) {
      break;
    }
    upperDevices.push(_device);
  }

  return option?.reverse ? upperDevices.reverse() : upperDevices;

  // const index = devices.indexOf(device ?? CSSDevice.__current);
  // return option?.reverse
  //   ? devices.slice(index + 1).reverse()
  //   : devices.slice(0, index);
};

export const getLowerDevices = (device?: types.BreakpointDevice) => {
  const devices = Object.keys(
    DEFAULT_STYLES
  ).reverse() as types.BreakpointDevice[];
  const lowerDevices = [] as types.BreakpointDevice[];
  for (const _device of devices) {
    if (device === _device) {
      break;
    }
    lowerDevices.push(_device);
  }

  return lowerDevices;

  // const index = devices.indexOf(device ?? CSSDevice.__current);
  // return devices.slice(index + 1).reverse();
};

export class CSSDevice {
  static #__device: types.BreakpointDevice = CSS_DEFAULT_DEVICE;
  static __previousDevice: types.BreakpointDevice = CSS_DEFAULT_DEVICE;

  static set __current(device: types.BreakpointDevice) {
    CSSDevice.#__device = device;
  }

  static get __current() {
    return CSSDevice.#__device;
  }

  static getDevice() {
    return CSSDevice.__current;
  }

  // Note: Dont't use restoreDecice, setDevice, setDefaultDevice
  // if code between them involves async code
  // i.e. setTimeout, setInterval, await / async function
  static restoreDevice() {
    const restoredDevice = CSSDevice.__previousDevice;
    CSSDevice.__previousDevice = CSSDevice.__current;
    CSSDevice.__current = restoredDevice;
  }

  static setDevice(device: types.BreakpointDevice) {
    CSSDevice.__previousDevice = CSSDevice.__current;
    CSSDevice.__current = device;
  }

  static setDefaultDevice() {
    CSSDevice.setDevice(CSS_DEFAULT_DEVICE);
  }
}
