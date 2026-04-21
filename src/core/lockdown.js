lockdown({
  // TODO: in production we may want to flip these
  // but for now this lets us see errors during dev
  errorTaming: 'unsafe',
  errorTrapping: 'report',
  unhandledRejectionTrapping: 'report',

  // Required for Discord Activities: the embedded-app-sdk reassigns
  // console.log/warn/error so iframe logs show up in the Discord client's
  // devtools. SES's default console taming freezes those methods.
  consoleTaming: 'unsafe',

  //
  // regExpTaming: 'unsafe',
  // localeTaming: 'unsafe',
  // evalTaming: 'unsafeEval',
  // // stackFiltering: ''
  // overrideTaming: 'min',
  // domainTaming: 'unsafe',

  // this is needed for monaco to work correctly.
  // specifically the theming seems to be broken.
  // this shouldn't be an issue as we are not using harden()
  __hardenTaming__: 'unsafe',
})
