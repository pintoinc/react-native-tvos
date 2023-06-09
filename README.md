## react-native-tvos

Going forward, Apple TV support for React Native will be maintained here and in the corresponding `react-native-tvos` NPM package, and not in the [core repo](https://github.com/facebook/react-native/).  This is a full fork of the main repository, with only the changes needed to support Apple TV.

Releases of `react-native-tvos` will be based on a public release of `react-native`; e.g. the 0.71.8-0 release of this package will be derived from the 0.71.8 release of `react-native`. All releases of this repo will follow the 0.xx.x-y format, where x digits are from a specific RN core release, and y represents the additional versioning from this repo.

Releases will be published on npmjs.org and you may find the latest release version here: https://www.npmjs.com/package/react-native-tvos?activeTab=versions or use the tag `@latest`

You will find the relevant tvOS support and maintenance within the branches marked `tvos-v0.xx.x`;   

To build your project for Apple TV, you should change your `package.json` imports to import `react-native` as follows, so that this package is used instead of the core react-native package.

```js
"react-native": "npm:react-native-tvos@latest",
```

You cannot use this package and the core react-native package simultaneously in a project.

### Hermes JS support

As of the 0.71 release, Hermes is fully working on both Apple TV and Android TV, and is enabled by default.

### React Native new architecture (Fabric) support

Before creating a new project, or running `pod install` in an existing project using version 0.69.5-0 or higher, execute 

```sh
export RCT_NEW_ARCH_ENABLED=1
```
Notes:

- _Apple TV_: `pod install` will pick up the additional pods needed for the new architecture. There are some issues with interactions between Apple TV parallax properties implementation and the new renderer. TabBarIOS has not been reimplemented in the new architecture so it will show up as an "unimplemented component".
- _Android TV_: As in the core repo, Android builds use prebuilt artifacts published in Maven Central.

### Typescript

Typescript types for TV-specific components and APIs have been added to `types/public`.

A minimal Typescript starter template can be used to start a new project using the community react-native CLI (see below for more information on the CLI).

```sh
react-native init TestApp --template=react-native-template-typescript-tv
```

## General support for Apple TV

TV device support has been implemented with the intention of making existing React Native applications "just work" on Apple TV, with few or no changes needed in the JavaScript code for the applications.

The RNTester app supports Apple TV.  In this repo, `RNTester/Podfile` and `RNTester/RNTesterPods.xcodeproj` have been modified to work for tvOS.  Run `pod install`, then open `RNTesterPods.xcworkspace` and build.

## Pitfall

Make sure you do not globally install `react-native` or `react-native-tvos`. You should only install `@react-native-community/cli` to use the commands below. If you have done this the wrong way, you may get error messages like:

```
ld: library not found for -lPods-TestApp-tvOS
```

You should also install `yarn` globally, as it should be used instead of `npm` for working in React Native projects.

## Build changes

- _Native layer_: React Native Xcode projects all now have Apple TV build targets, with names ending in the string '-tvOS'.
- _react-native init_: Creating a new project that uses this package is done using the react-native CLI.  New projects created this way will automatically have properly configured Apple TV targets created in their XCode projects.
- _Maven artifacts_: In 0.71, the React Native Android prebuilt archives are published to Maven instead of being included in the NPM. We are following the same model, except that the Maven artifacts will be in group `io.github.react-native-tvos` instead of `com.facebook.react`. The `react-native-gradle-plugin` has been upgraded so that the Android dependencies will be detected correctly during build.

## New project creation

To use this NPM package in a new project, you can reference it as in the following example using the React Native community CLI:

```sh
# Make sure you have the CLI installed globally (this only needs to be done once on your system)
npm install -g @react-native-community/cli
# Init an app called 'TestApp', note that you must not be in a node module (directory with node_modules sub-directory) for this to work
react-native init TestApp --template=react-native-tvos@latest
# Now start the app in the tvOS Simulator - this will only work on a macOS machine
cd TestApp && react-native run-ios  --simulator "Apple TV" --scheme "TestApp-tvOS"
```

(_Note_: As of now, `npx react-native run-ios` will no longer run Apple TV targets. A fix for this has been merged (https://github.com/react-native-community/cli/pull/1929) and will be released shortly. To run Apple TV (and Android TV) targets from the command line, it is now possible to use the Expo CLI, using the following steps:
- In your app, install the required Expo modules: `yarn add expo`
- Add a file `react-native.config.js` at the top level of your app directory, with [these contents](https://github.com/byCedric/custom-prebuild-example/blob/main/app/react-native.config.js).
- Then an Apple TV target can be run: `npx expo run:ios --scheme MyApp-tvOS --device "Apple TV"`
- To run Android TV: `npx expo run:android`
See [this document](https://docs.expo.dev/bare/using-expo-cli/) for more details on Expo CLI functionality. Note that many of these features require that Expo SDK modules be built into your app, which is not yet supported on Apple TV.)

- _JavaScript layer_: Support for Apple TV has been added to `Platform.ios.js`. You can check whether code is running on AppleTV by doing

```javascript
var Platform = require('Platform');
var running_on_tv = Platform.isTV;

// If you want to be more specific and only detect devices running tvOS
// (but no Android TV devices) you can use:
var running_on_apple_tv = Platform.isTVOS;
```

## Code changes

- _General support for tvOS_: Apple TV specific changes in native code are all wrapped by the TARGET_OS_TV define. These include changes to suppress APIs that are not supported on tvOS (e.g. web views, sliders, switches, status bar, etc.), and changes to support user input from the TV remote or keyboard.

- _Common codebase_: Since tvOS and iOS share most Objective-C and JavaScript code in common, most documentation for iOS applies equally to tvOS.

- _Access to touchable controls_: When running on Apple TV, the native view class is `RCTTVView`, which has additional methods to make use of the tvOS focus engine. The `Touchable` mixin has code added to detect focus changes and use existing methods to style the components properly and initiate the proper actions when the view is selected using the TV remote, so `TouchableWithoutFeedback`, `TouchableHighlight` and `TouchableOpacity` will "just work". In particular:

  - `onFocus` will be executed when the touchable view goes into focus
  - `onBlur` will be executed when the touchable view goes out of focus
  - `onPress` will be executed when the touchable view is actually selected by pressing the "select" button on the TV remote.

- _TV remote/keyboard input_: A native class, `RCTTVRemoteHandler`, sets up gesture recognizers for TV remote events. When TV remote events occur, this class fires notifications that are picked up by `RCTTVNavigationEventEmitter` (a subclass of `RCTEventEmitter`), that fires a JS event. This event will be picked up by instances of the `TVEventHandler` JavaScript object. Application code that needs to implement custom handling of TV remote events can create an instance of `TVEventHandler` and listen for these events.  In 0.63.1-1, we have added `useTVEventHandler`, which wraps `useEffect` to make this more convenient and simpler for use with functional components. In 0.64.2-2, we added a TV event display to the new app template using `useTVEventHandler`.

```javascript

import { TVEventHandler, useTVEventHandler } from 'react-native';

// Functional component

const TVEventHandlerView: () => React.Node = () => {
  const [lastEventType, setLastEventType] = React.useState('');

  const myTVEventHandler = evt => {
    setLastEventType(evt.eventType);
  };

  useTVEventHandler(myTVEventHandler);

  return (
    <View>
      <TouchableOpacity onPress={() => {}}>
        <Text>
          This example enables an instance of TVEventHandler to show the last
          event detected from the Apple TV Siri remote or from a keyboard.
        </Text>
      </TouchableOpacity>
      <Text style={{color: 'blue'}}>{lastEventType}</Text>
    </View>
  );

};

// Class based component

class Game2048 extends React.Component {
  _tvEventHandler: any;

  _enableTVEventHandler() {
    this._tvEventHandler = new TVEventHandler();
    this._tvEventHandler.enable(this, function(cmp, evt) {
      if (evt && evt.eventType === 'right') {
        cmp.setState({board: cmp.state.board.move(2)});
      } else if(evt && evt.eventType === 'up') {
        cmp.setState({board: cmp.state.board.move(1)});
      } else if(evt && evt.eventType === 'left') {
        cmp.setState({board: cmp.state.board.move(0)});
      } else if(evt && evt.eventType === 'down') {
        cmp.setState({board: cmp.state.board.move(3)});
      } else if(evt && evt.eventType === 'playPause') {
        cmp.restartGame();
      }
    });
  }

  _disableTVEventHandler() {
    if (this._tvEventHandler) {
      this._tvEventHandler.disable();
      delete this._tvEventHandler;
    }
  }

  componentDidMount() {
    this._enableTVEventHandler();
  }

  componentWillUnmount() {
    this._disableTVEventHandler();
  }
```

- _Turbomodules_: Working as of the 0.61.2-0 release.

- _Flipper_: Working in the 0.62.2-x releases.  Working in the 0.63.x releases; however, tvOS requires the Flipper pods from 0.62.2-x.  `scripts/react_native_pods.rb` contains macros for both versions.  The new project template Podfile is correctly set up to provide the older Flipper for both iOS and tvOS targets. In 0.64.x and later, Flipper support is removed until issues can be resolved with newer Xcode versions.

- _LogBox_: The new LogBox error/warning display (which replaced YellowBox in 0.63) is working as expected in tvOS, after a few adjustments to make the controls accessible to the focus engine.

- _Pressable_: The new `Pressable` API for React Native 0.63 works with TV.  Additional `onFocus` and `onBlur` props are provided to allow you to customize behavior when a Pressable enters or leaves focus. Similar to the `pressed` state that is true while a user is pressing the component on a touchscreen, the `focused` state will be true when it is focused on TV.  `PressableExample` in RNTester has been modified appropriately.

- _Dev Menu support_: On the simulator, cmd-D will bring up the developer menu, just like on iOS. To bring it up on a real Apple TV device, make a long press on the play/pause button on the remote. (Please do not shake the Apple TV device, that will not work :) )

- _TV remote animations_: `RCTTVView` native code implements Apple-recommended parallax animations to help guide the eye as the user navigates through views. The animations can be disabled or adjusted with new optional view properties.

- _Back navigation with the TV remote menu button_: The `BackHandler` component, originally written to support the Android back button, now also supports back navigation on the Apple TV using the menu button on the TV remote.

- _TVEventControl_: (Formerly "TVMenuControl") (Apple TV only) This module provides methods to enable and disable features on the Apple TV Siri remote:
  - `enableTVMenuKey`/`disableTVMenuKey`:  Method to enable and disable the menu key gesture recognizer, in order to fix an issue with Apple's guidelines for menu key navigation (see https://github.com/facebook/react-native/issues/18930).  The `RNTester` app uses these methods to implement correct menu key behavior for back navigation.
  - `enableTVPanGesture`/`disableTVPanGesture`: Methods to enable and disable detection of finger touches that pan across the touch surface of the Siri remote. See `TVEventHandlerExample` in the `RNTester` app for a demo.
  - `enableGestureHandlersCancelTouches`/`disableGestureHandlersCancelTouches`: Methods to turn on and turn off cancellation of touches by the gesture handlers in `RCTTVRemoteHandler` (see #366). Cancellation of touches is turned on (enabled) by default in 0.69 and earlier releases.

- _TVFocusGuideView_: This component provides support for Apple's `UIFocusGuide` API and is implemented in the same way for Android TV, to help ensure that focusable controls can be navigated to, even if they are not directly in line with other controls.  An example is provided in `RNTester` that shows two different ways of using this component.

| Prop | Value | Description | 
|---|---|---|
| destinations | any[]? | Array of `Component`s to register as destinations of the FocusGuideView |
| autoFocus | boolean? | If true, `TVFocusGuide` will automatically manage focus for you. It will redirect the focus to the first focusable child on the first visit. It also remembers the last focused child and redirects the focus to it on the subsequent visits. `destinations` prop takes precedence over this prop when used together. |
| trapFocus* (Up, Down, Left, Right) | Prevents focus escaping from the container for the given directions. |

More information on the focus handling improvements above can be found in [this article](https://medium.com/xite-engineering/revolutionizing-focus-management-in-tv-applications-with-react-native-10ba69bd90).

- _Next Focus Direction_: the props `nextFocus*` on `View` should work as expected on iOS too (previously android only). One caveat is that if there is no focusable in the `nextFocusable*` direction next to the starting view, iOS doesn't check if we want to override the destination. 

- _TVTextScrollView_: On Apple TV, a ScrollView will not scroll unless there are focusable items inside it or above/below it.  This component wraps ScrollView and uses tvOS-specific native code to allow scrolling using swipe gestures from the remote control.

