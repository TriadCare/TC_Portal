const appReducer = (state) => {
  let initialState = {};
  if (state === undefined) {
    // Executive App Config
    initialState = {
      titleBarText: 'Executive Portal',
      spaces: [
        {
          uri: '/executive/dashboard',
          label: 'Dashboard',
          icon: 'heartbeat',
        },
        {
          uri: '/executive/reporting',
          label: 'Reporting',
          icon: 'bar-chart',
        },
        {
          uri: '/executive/cohort',
          label: 'Cohort',
          icon: 'users',
        },
        {
          uri: '/executive/profile',
          label: 'Profile',
          icon: 'user-circle',
        },
      ],
    };
  }

  return { ...state, ...initialState };
};

export default appReducer;
