import moment from 'moment';

export const sortHRAsAscending = (hraOne, hraTwo) =>
  moment(hraOne.meta.DATE_CREATED).diff(moment(hraTwo.meta.DATE_CREATED));

export const sortHRAsDescending = (hraOne, hraTwo) =>
  -moment(hraOne.meta.DATE_CREATED).diff(moment(hraTwo.meta.DATE_CREATED));

export const sortBiometricsDescending = (bioOne, bioTwo) =>
  -moment(bioOne.Dt, 'MM/DD/YYYY').diff(moment(bioTwo.Dt, 'MM/DD/YYYY'));

export const sortVisitsDescending = (visitOne, visitTwo) =>
  -moment(visitOne.VisitDate, 'MM/DD/YYYY').diff(moment(visitTwo.Dt, 'MM/DD/YYYY'));

// This function sums the values in the objects with the same key.
const sumObj = dataList => dataList.reduce((acc, item) => {
  if (acc === undefined) {
    return item;
  }
  const newAcc = {};
  Object.keys(acc).forEach((key) => {
    newAcc[key] = acc[key] + item[key];
  });
  return newAcc;
});

const avgObj = (dataList) => {
  const sum = sumObj(dataList);

  const result = {};
  Object.keys(sum).forEach((key) => {
    result[key] = Math.round((sum[key] / dataList.length) * 100) / 100;
  });
  return result;
};

export const getSelectedDataName = configuration => configuration.controls.data_set.options.find(
    option => option.id === configuration.controls.data_set.selectedValue,
  ).value;

export const getOptionValue = (optionName, controlObject) =>
  controlObject.controls[optionName].options.find(option =>
    option.id === controlObject.controls[optionName].selectedValue,
  ).value;

const filterUsers = (datasources, controlObject, users) => {
  const newOptionObject = {};
  Object.keys(controlObject.controls).forEach((k) => { newOptionObject[k] = []; });
  const filteredUsers = users.filter((user) => {
    let meetsRequirements = true;
    Object.entries(controlObject.controls).forEach(([k, v]) => {
      // Only care about data filters here.
      if (v.type !== 'datafilter') { return; }
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
            controlObject.controls[v.childOf].selectedValue === undefined ||
            getOptionValue(v.childOf, controlObject) === userOption[v.parentKey]) {
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
  Object.entries(controlObject.controls).forEach(([key, control]) => {
    if (control.type === 'datafilter') {
      control.options.splice(0);
      control.options.push(...newOptionObject[key]);
    }
  });
  return filteredUsers;
};


// This is the start of the Data Transformation for the Reporting Tool.
// Depending on the datasource and configuration, the data needs to take a
// certain format in order for the Victory Charts component to render.
// This function will be called everytime the user changes the configuration.
export function buildChartData(datasources, controlObject) {
  const datasourceName = getOptionValue('data_set', controlObject);
  const chartType = getOptionValue('chart_type', controlObject);

  const dataItems = datasources[datasourceName].items;
  const users = datasources.User.items;
  // return if no data
  if (dataItems.length === 0 || users.length === 0) { return { [chartType]: [] }; }
  // Accumulate the options for each datafilter control.
  const filteredUsers = filterUsers(datasources, controlObject, users);

  // TODO: write a function to combine Users, Accounts, and Locations

  const reportData = [];
  const chartData = [];

  switch (datasourceName) {
    case 'HRA':
      if (chartType === 'bar') {
        if (dataItems.length > 0) {
          Object.entries(
            // Average all of the score dictionaries into one
            avgObj(
              dataItems
              .filter(item => (
                moment(item.meta.DATE_CREATED).isSameOrAfter(controlObject.controls.date_range.min_date, 'day') &&
                moment(item.meta.DATE_CREATED).isSameOrBefore(controlObject.controls.date_range.max_date, 'day')
              ))
              .map(item => item.score),
            ),
          ).forEach(([k, v]) => {
            // Need one object for each bar in the bar chart
            chartData.push({ x: k, y: v });
          });
        }
      } else if (chartType === 'line') {
        Object.entries(
          // Average all of the score dictionaries into one
          avgObj(dataItems.map(item => item.score)),
        ).forEach(([k, v]) => {
          // Need one object for each bar in the bar chart
          chartData.push({ x: k, y: v });
        });
      } else if (chartType === 'pie') {
        // I need to show complete, started, not started as parts of a whole
        const pieData = { Completed: 0, Started: 0, 'Not Started': 0 };
        // Filter HRAs by the control date range
        const hrasInDate = dataItems.filter(item => (
          moment(item.meta.DATE_CREATED).isSameOrAfter(controlObject.controls.date_range.min_date, 'day') &&
          moment(item.meta.DATE_CREATED).isSameOrBefore(controlObject.controls.date_range.max_date, 'day')
        ));
        // Build the HRA Compliance Data from the list of filtered users.
        filteredUsers.forEach((user) => {
          const userHRAs = hrasInDate.filter(
            hra => hra.meta.tcid === user.tcid,
          ).sort(sortHRAsDescending);
          if (userHRAs.length === 0) {
            pieData['Not Started'] += 1;
            reportData.push({ meta: { user } });
          } else {
            pieData[
              userHRAs[0].meta.completed === 1 ? 'Completed' : 'Started'
            ] += 1;
            reportData.push(...userHRAs.map(hra => ({
              ...hra,
              ...{
                ...hra.meta,
                ...{ user },
              },
            })));
          }
        });
        Object.entries(pieData).forEach(([k, v]) => chartData.push({ x: k, y: v }));
      }
      return { [chartType]: chartData, reportData };
    case 'Biometric':
      if (chartType === 'pie') {
        // I need to show complete, started, not started as parts of a whole
        const pieData = { Completed: 0, Pending: 0, 'Not Completed': 0 };
        // Filter Biometrics by the control date range
        const biometricsInDate = dataItems.filter(item => (
          moment(item.Dt, 'MM/DD/YYYY').isSameOrAfter(controlObject.controls.date_range.min_date, 'day') &&
          moment(item.Dt, 'MM/DD/YYYY').isSameOrBefore(controlObject.controls.date_range.max_date, 'day')
        ));
        // Build the Biometric Compliance Data from the list of filtered users.
        filteredUsers.forEach((user) => {
          const userBiometrics = biometricsInDate.filter(
            biometric => biometric.PatientId === user.patientID,
          ).sort(sortBiometricsDescending);
          if (userBiometrics.length === 0) {
            pieData['Not Completed'] += 1;
            reportData.push({ meta: { user } });
          } else {
            pieData[
              userBiometrics[0].Verified === '1' ? 'Completed' : 'Pending'
            ] += 1;
            reportData.push(...userBiometrics.map(biometric => ({
              ...biometric,
              ...{ user },
            })));
          }
        });
        Object.entries(pieData).forEach(([k, v]) => chartData.push({ x: k, y: v }));
      }
      return { [chartType]: chartData, reportData };

    case 'Visit':
      if (chartType === 'pie') {
        // I need to show complete, started, not started as parts of a whole
        const pieData = {
          Completed: 0,
          Scheduled: 0,
          Missed: 0,
          'Not Completed': 0,
        };
        // Filter Visits by the control date range
        const visitsInDate = dataItems.filter(item => (
          moment(item.VisitDate, 'MM/DD/YYYY').isSameOrAfter(controlObject.controls.date_range.min_date, 'day') &&
          moment(item.VisitDate, 'MM/DD/YYYY').isSameOrBefore(controlObject.controls.date_range.max_date, 'day')
        ));
        // Build the Visit Compliance Data from the list of filtered users.
        filteredUsers.forEach((user) => {
          const userVisits = visitsInDate.filter(
            visit => visit.PatientId === user.patientID,
          ).sort(sortVisitsDescending);
          if (userVisits.length === 0) {
            pieData['Not Completed'] += 1;
            reportData.push({ meta: { user } });
          } else {
            // All other misc. statuses should be included in 'Scheduled'
            let visitStatus = userVisits[0].VisitStatus === 'Pt Missed Appointment' ? 'Missed' : userVisits[0].VisitStatus;
            visitStatus = Object.keys(pieData).includes(visitStatus) ? visitStatus : 'Scheduled';
            pieData[visitStatus] += 1;
            reportData.push(...userVisits.map(visit => ({
              ...visit,
              ...{ user },
            })));
          }
        });
        Object.entries(pieData).forEach(([k, v]) => chartData.push({ x: k, y: v }));
      }
      return { [chartType]: chartData, reportData };

    default:
      return { [chartType]: datasources[datasourceName] };
  }
}

// Should be built from selected datasource and configuration.
// Will need to be called everytime the user changes the
// configuration of the report.
export function buildReport(datasources, controlObject) {
  const chartType = getOptionValue('chart_type', controlObject);
  const reportConfig = {
    meta: controlObject.reportMetaData,
  };

  if (chartType === 'pie') {
    const data = buildChartData(datasources, controlObject);
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
    reportConfig.reportData = data.reportData;
  } else {
    reportConfig.chart = {
      domainPadding: 20,
      animate: { duration: 1000 },
      style: {
        width: '100%',
        height: '100%',
        padding: '5px',
      },
    };
    reportConfig.independentAxis = {
      style: {
        tickLabels: {
          fontSize: 8,
          padding: 0,
          angle: -45,
        },
      },
    };
    reportConfig.dependentAxis = {
      dependentAxis: true,
      domain: [0, 4],
      tickCount: 4,
      tickFormat: y => `${(y * 100) / 4.0}%`,
    };
    reportConfig[chartType] = {
      data: buildChartData(datasources, controlObject)[chartType],
      labels: datum => `${Math.trunc((datum.y * 100) / 4.0)}%`,
      style: {
        data: { width: 20 },
        labels: { fontSize: 8 },
      },
    };
  }
  return reportConfig;
}
