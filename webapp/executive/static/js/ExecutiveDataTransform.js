import moment from 'moment';


// This function sums the values in the objects with the same key.
// const sumObj = dataList => dataList.reduce((acc, item) => {
//   if (acc === undefined) {
//     return item;
//   }
//   const newAcc = {};
//   Object.keys(acc).forEach((key) => {
//     newAcc[key] = acc[key] + item[key];
//   });
//   return newAcc;
// });
//
// const avgObj = (dataList) => {
//   const sum = sumObj(dataList);
//
//   const result = {};
//   Object.keys(sum).forEach((key) => {
//     result[key] = Math.round((sum[key] / dataList.length) * 100) / 100;
//   });
//   return result;
// };

export const getSelectedDataName = configuration =>
  configuration.controls.Base.data_set.options.find(
    option => option.id === configuration.controls.Base.data_set.selectedValue,
  ).value;

export const getOptionValue = (optionGroup, optionName, controlObject) =>
  controlObject.controls[optionGroup][optionName].options.find(option =>
    option.id === controlObject.controls[optionGroup][optionName].selectedValue,
  ).value;

const filterUsers = (datasources, controlObject, users) => {
  const newOptionObject = {};
  Object.keys(controlObject.controls.Data).forEach((k) => { newOptionObject[k] = []; });
  const filteredUsers = users.filter((user) => {
    let meetsRequirements = true;
    Object.entries(controlObject.controls.Data).forEach(([k, v]) => {
      // First add the distinct datafilter value if it does not exist
      if (newOptionObject[k].find(
          option => option.value === user[v.key],
        ) === undefined
      ) {
        const userOption = datasources[v.datasource].items.find(
          item => item[v.dataKey] === user[v.key],
        );
        if (userOption) {
          // check dependencies on other fields
          if (v.childOf === undefined ||
            controlObject.controls.Data[v.childOf].selectedValue === undefined ||
            getOptionValue('Data', v.childOf, controlObject) === userOption[v.parentKey]) {
            newOptionObject[k].push(
              {
                id: newOptionObject[k].length + 1,
                label: userOption.Name,
                value: user[v.key],
              },
            );
          }
        }
      }
      // Then make sure this user meets the criteria
      // Note: don't break loop immediately on disqualification because
      // the user might have some unique data filter values we still need to grab.
      if (v.selectedValue !== undefined && v.datasource !== undefined) {
        meetsRequirements = (
          user[v.key] === v.options.find(
            option => option.id === v.selectedValue,
          ).value) ? meetsRequirements : false;
      }
    });
    return meetsRequirements;
  });
  // Update the options for each control
  Object.entries(controlObject.controls.Data).forEach(([key, control]) => {
    control.options.splice(0);
    control.options.push(...newOptionObject[key]);
  });
  return filteredUsers;
};

// Chart & Data Definitions
const recordDateSort = {
  HRA: (hraOne, hraTwo) => moment(hraOne.meta.DATE_CREATED)
    .diff(moment(hraTwo.meta.DATE_CREATED)),
  Biometric: (bioOne, bioTwo) => moment(bioOne.Dt, 'MM/DD/YYYY')
    .diff(moment(bioTwo.Dt, 'MM/DD/YYYY')),
  Visit: (visitOne, visitTwo) => moment(visitOne.VisitDate, 'MM/DD/YYYY')
    .diff(moment(visitTwo.Dt, 'MM/DD/YYYY')),
};

const findUserRecords = {
  HRA: (hra, user) => hra.meta.tcid === user.tcid,
  Biometric: (bio, user) => bio.PatientId === user.patientID,
  Visit: (visit, user) => visit.PatientId === user.patientID,
};

const dateMapper = {
  HRA: item => moment(item.meta.DATE_CREATED),
  Biometric: item => moment(item.Dt, 'MM/DD/YYYY'),
  Visit: item => moment(item.VisitDate, 'MM/DD/YYYY'),
};

const metaMapper = {
  HRA: hra => hra.meta,
  Biometric: bio => bio,
  Visit: visit => visit,
};

const pieDataDefs = {
  HRA: ['Completed', 'Started', 'Not Started'],
  Biometric: ['Verified', 'Pending', 'Not Verified'],
  Visit: ['Completed', 'Scheduled', 'Missed', 'Not Completed'],
};

const columnDefs = {
  HRA: [
    { label: 'First Name', type: 'text' },
    { label: 'Last Name', type: 'text' },
    { label: 'Email', type: 'text' },
    { label: 'Status', type: 'text' },
    { label: 'Date', type: 'date' },
  ],
  Biometric: [
    { label: 'First Name', type: 'text' },
    { label: 'Last Name', type: 'text' },
    { label: 'Email', type: 'text' },
    { label: 'Status', type: 'text' },
    { label: 'Date', type: 'date' },
  ],
  Visit: [
    { label: 'First Name', type: 'text' },
    { label: 'Last Name', type: 'text' },
    { label: 'Email', type: 'text' },
    { label: 'Status', type: 'text' },
    { label: 'Date', type: 'date' },
  ],
};

const keyExchanges = {
  HRA: {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    DATE_CREATED: 'Date',
    completed: 'Status',
  },
  Biometric: {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    Dt: 'Date',
    Verified: 'Status',
  },
  Visit: {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    VisitDate: 'Date',
    VisitStatus: 'Status',
  },
};

const valueExchanges = {
  HRA: {
    first_name: v => v,
    last_name: v => v,
    email: v => v,
    DATE_CREATED: v => (v !== undefined ? moment(v).format('MM/DD/YYYY') : ''),
    completed: (v) => {
      if (Number.isInteger(v)) { return (v === 1 ? 'Complete' : 'Incomplete'); }
      return v;
    },
  },
  Biometric: {
    first_name: v => v,
    last_name: v => v,
    email: v => v,
    Dt: v => (v !== undefined ? moment(v).format('MM/DD/YYYY') : ''),
    Verified: (v) => {
      if (Number.isInteger(Number(v))) { return (v === '1' ? 'Verified' : 'Pending'); }
      return v;
    },
  },
  Visit: {
    first_name: v => v,
    last_name: v => v,
    email: v => v,
    VisitDate: v => (v !== undefined ? moment(v).format('MM/DD/YYYY') : ''),
    VisitStatus: (v) => {
      if (v === 'Pt Missed Appointment') {
        return 'Missed';
      }
      // All other misc. statuses should be included in 'Scheduled'
      return [
        'Completed', 'Scheduled', 'Missed', 'Not Completed',
      ].includes(v) ? v : 'Scheduled';
    },
  },
};

const nullStatus = {
  HRA: 'Not Started',
  Biometric: 'Not Verified',
  Visit: 'Not Completed',
};

const nullRecord = {
  HRA: { DATE_CREATED: undefined, completed: nullStatus.HRA },
  Biometric: { Dt: undefined, Verified: nullStatus.Biometric },
  Visit: { Dt: undefined, VisitStatus: nullStatus.Visit },
};

const statusExchange = {
  HRA: hra => (hra.meta.completed === 1 ? 'Completed' : 'Started'),
  Biometric: bio => (bio.Verified === '1' ? 'Verified' : 'Pending'),
  Visit: (visit) => { // All other misc. statuses should be included in 'Scheduled'
    let visitStatus = visit.VisitStatus === 'Pt Missed Appointment' ? 'Missed' : visit.VisitStatus;
    visitStatus = pieDataDefs.Visit.includes(visitStatus) ? visitStatus : 'Scheduled';
    return visitStatus;
  },
};

const formatRecord = (record, datasourceName) =>
  Object.entries(record).reduce((formattedRecord, [k, v]) => {
    if (keyExchanges[datasourceName][k] === undefined) {
      return formattedRecord;
    }
    return {
      ...formattedRecord,
      ...{
        [keyExchanges[datasourceName][k]]: valueExchanges[datasourceName][k](v),
      },
    };
  }, {});


// This is the start of the Data Transformation for the Reporting Tool.
// Depending on the datasource and configuration, the data needs to take a
// certain format in order for the Victory Charts component to render.
// This function will be called everytime the user changes the configuration.
export function buildChartData(datasources, controlObject) {
  const datasourceName = getOptionValue('Base', 'data_set', controlObject);
  const chartType = getOptionValue('Chart', 'chart_type', controlObject);

  const dataItems = datasources[datasourceName].items;
  const users = datasources.User.items;
  // return if no data
  if (dataItems.length === 0 || users.length === 0) { return { [chartType]: [] }; }
  // Accumulate the options for each datafilter control.
  const filteredUsers = filterUsers(datasources, controlObject, users);

  const reportData = [];
  const chartData = [];

  const pieData = pieDataDefs[datasourceName]
    .reduce((accObj, key) => ({ ...accObj, ...{ [key]: 0 } }), {});
  // Filter records by the control date range
  const recordsInDate = dataItems.filter(item => (
    dateMapper[datasourceName](item)
      .isSameOrAfter(controlObject.controls.Base.date_range.min_date, 'day') &&
    dateMapper[datasourceName](item)
      .isSameOrBefore(controlObject.controls.Base.date_range.max_date, 'day')
  ));
  // Build the Compliance Data from the list of filtered users.
  filteredUsers.forEach((user) => {
    const userRecords = recordsInDate.filter(
      record => findUserRecords[datasourceName](record, user),
    ).sort(recordDateSort[datasourceName]);
    if (userRecords.length === 0) {
      pieData[nullStatus[datasourceName]] += 1;
      reportData.push(
        formatRecord(
          { ...nullRecord[datasourceName], ...user },
          datasourceName,
        ),
      );
    } else {
      pieData[statusExchange[datasourceName](userRecords[0])] += 1;
      reportData.push(...userRecords.map(
        record => formatRecord(
          { ...metaMapper[datasourceName](record), ...user },
          datasourceName,
        ),
      ));
    }
  });
  Object.entries(pieData).forEach(([k, v]) => chartData.push({ x: k, y: v }));

  return {
    [chartType]: chartData,
    reportData,
    columnDef: columnDefs[datasourceName],
  };
}

// Should be built from selected datasource and configuration.
// Will need to be called everytime the user changes the
// configuration of the report.
export function buildReport(datasources, controlObject) {
  const chartType = getOptionValue('Chart', 'chart_type', controlObject);
  const reportConfig = {
    meta: controlObject.reportMetaData,
  };
  const data = buildChartData(datasources, controlObject);
  if (chartType === 'pie') {
    reportConfig[chartType] = {
      data: data[chartType],
      labels: (datum) => {
        if (datum.y === 0) {
          return '';
        }
        return `${Math.trunc(datum.y)}\n${datum.x}`;
      },
      colorScale: [
        'rgb(0,120,185)',
        'rgba(0,120,185, 0.75)',
        'rgb(180,180,180)',
        'rgba(0,120,185, 0.5)',
        'rgba(0,120,185, 0.25)',
      ],
      padAngle: 1,
      innerRadius: 1,
      cornerRadius: 5,
      style: { fontFamily: 'inherit' },
      animate: { duration: 1000 },
    };
  } else {
    reportConfig.chart = {
      domainPadding: 30,
      animate: { duration: 500 },
      style: { padding: '5px' },
    };
    reportConfig.independentAxis = {
      style: {
        tickLabels: {
          fontSize: 16,
          padding: 0,
        },
      },
    };
    reportConfig.dependentAxis = {
      dependentAxis: true,
    };
    reportConfig[chartType] = {
      data: data[chartType],
      labels: (datum) => {
        if (datum.y === 0) {
          return '';
        }
        return `${Math.trunc(datum.y)}`;
      },
      colorScale: [
        'rgb(0,120,185)',
        'rgba(0,120,185, 0.75)',
        'rgb(180,180,180)',
        'rgba(0,120,185, 0.5)',
        'rgba(0,120,185, 0.25)',
      ],
      style: {
        data: { width: 50 },
        labels: { fontSize: 16 },
      },
    };
  }

  reportConfig.reportData = data.reportData;
  reportConfig.columnDef = data.columnDef;
  return reportConfig;
}
