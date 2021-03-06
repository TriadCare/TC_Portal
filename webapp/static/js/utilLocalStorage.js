export const loadState = () => {
  try {
    console.log('Loading state from local storage');
    const serializedState = localStorage.getItem('state');
    if (serializedState === null) { return undefined; }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    console.log('Saving state to local storage');
    const serializedState = JSON.stringify(state);
    localStorage.setItem('state', serializedState);
  } catch (err) {
    console.log('Error saving state to local storage.');
  }
};
