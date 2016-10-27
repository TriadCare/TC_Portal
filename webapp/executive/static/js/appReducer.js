const appReducer = (state) => {
  let initialState = {};
  if (state === undefined) {
    // Executive App Config
    initialState = {
      titleBarText: 'Executive Portal',
      spaces: [
        '/executive/dashboard',
        '/executive/reporting',
        '/executive/cohort',
        '/executive/profile',
      ],
    };
  }

  return { ...state, ...initialState };
};

export default appReducer;
