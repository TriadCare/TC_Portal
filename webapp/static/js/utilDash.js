
const populateCard = (card, dataItems, sortFunc) => {
  const { cardDefinition, ...rest } = card;
  const data = ((card.data.length === 0) ?
    dataItems :
    card.data.map(
      key => dataItems.find(item => item.meta[card.dataKey] === key),
    ).sort(sortFunc));
  return { ...cardDefinition, ...rest, ...{ data } };
};

export default (state, config, sortOptions) => {
  const dashlets = [];

  config.forEach((card) => {
    if (state.datasources[card.datasource].items.length === 0) {
      return;  // no data for this card, leave it out.
    }
    switch (card.cardType) {
      case 'group':
        if (card.data.length === 0) {  // Use every datapoint
          dashlets.push(
            ...state.datasources[card.datasource].items
              .sort(sortOptions[card.datasource])
              .map(
                item => populateCard(
                    { ...card, ...{ data: [item.meta[card.dataKey]] } },
                    state.datasources[card.datasource].items,
                    sortOptions[card.datasource],
                  ),
              ),
          );
          return;
        }
        // if data IDs are specified, only use those.
        dashlets.push(...card.data.map(data =>
          populateCard(
            { ...card, ...{ data: [data] } },
            state.datasources[card.datasource].items
              .sort(sortOptions[card.datasource]),
            sortOptions[card.datasource],
          ),
        ));
        return;
      case 'single':
      default:
        dashlets.push(populateCard(
          card,
          (state.datasources[card.datasource].items
            .filter(item => item.meta.completed === 1)
            .sort(sortOptions[card.datasource])),
          sortOptions[card.datasource],
        ));
    }
  });

  return dashlets;
};
