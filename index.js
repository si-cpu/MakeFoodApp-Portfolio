/**
 * @format
 */

import './wdyr'; // why-did-you-render 설정
import 'react-native-get-random-values';
import {AppRegistry, DeviceEventEmitter} from 'react-native';

// Expo 초기화
if (typeof global !== 'undefined') {
  global.__expo = {
    modules: {},
    DeviceEventEmitter: DeviceEventEmitter,
  };
}

import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
