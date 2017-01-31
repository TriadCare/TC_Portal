import React from 'react';
import moment from 'moment';
import { oneLineTrim } from 'common-tags';
import { NonIdealState, Spinner, Button, Radio } from '@blueprintjs/core';

import { renderChart } from 'components/Charting';

import './css/Survey';

const renderLoadingComponent = () => (
  <NonIdealState
    visual="cloud-download"
    title="Fetching your HRA"
    description={'Hang tight while we set this up...'}
    action={<Spinner />}
  />
);

const renderEmptyComponent = (goBackToDashboard) => (
  <NonIdealState
    visual="error"
    title="No HRA has been selected."
    description={'Go back to the Dashboard to pick an HRA to view.'}
    action={<Button text="Back to Dashboard" onClick={goBackToDashboard} />}
  />
);

const pointToPercent = (gradePoint) => Math.round(gradePoint * 100 / 4);

const gradeLetter = (percentage) => {
  if (percentage > 89) { return 'A'; }
  if (percentage > 79) { return 'B'; }
  if (percentage > 69) { return 'C'; }
  if (percentage > 59) { return 'D'; }
  return 'F';
};

const reconcileCheckbox = (currentAnswer, checkedValue) => {
  if (currentAnswer === undefined) { return checkedValue; }
  const a = parseInt(currentAnswer, 10);
  const v = parseInt(checkedValue, 10);
  if (a === 3) { return (a - v).toString(); }
  if (a === v) { return undefined; }
  return '3';
};

const scrollTo = (element, to, duration) => {
  if (duration <= 0) return;
  const difference = to - element.scrollTop;
  const perTick = difference / duration * 10;

  setTimeout(() => {
    /* eslint no-param-reassign: ["error", { "props": false }]*/
    element.scrollTop = element.scrollTop + perTick;
    if (element.scrollTop === to) return;
    scrollTo(element, to, duration - 10);
  }, 10);
};

// const convertToPDF = (htmlData, filename, callback) => {
//   const xhr = new XMLHttpRequest();
//   xhr.onload = (e) => {
//     const arraybuffer = xhr.response; // not responseText
//
//     const blob = new Blob([arraybuffer], { type: 'application/pdf' });
//     const url = window.URL.createObjectURL(blob);
//
//     const a = document.createElement('a');
//     document.body.appendChild(a);
//     a.style = 'display: none';
//     a.class = 'blobLink';
//     a.href = url;
//     a.download = filename;
//     a.click();
//     window.URL.revokeObjectURL(url);
//
//     document.body.removeChild(a);
//
//     callback(e);
//   };
//
//   xhr.open('POST', '/pdf/');
//   xhr.responseType = 'arraybuffer';
//   xhr.send(JSON.stringify(htmlData));
// };
//
// const requestPDF = () => {
//   const data = { html: document.documentElement.innerHTML };
//   const filename = 'hra.pdf';
//   convertToPDF(data, filename, () => console.log('all done.'));
// };

const renderQuestion = (questionNumber, configQuestion,
  responseQuestion, activeQuestion, error, completed, handleAnswer) => {
  switch (configQuestion.type) {
    case 'INTEGER':
      return (
        <div
          key={questionNumber}
          ref={`qid_${configQuestion.qid}`}
          className={'panel panel-default response__question'}
        >
          <div className="panel-heading response__question-label">
            {configQuestion.text}
          </div>
          <div className="panel-body response__question-answer">
            <input
              type="number"
              name={configQuestion.qid}
              value={(responseQuestion.aid || '')}
              onChange={(e) => handleAnswer(configQuestion.qid, e.target.value)}
              disabled={completed ? 'disabled' : ''}
              autoFocus={configQuestion.qid === activeQuestion}
            />
          </div>
          {(completed && configQuestion.blurb) ?
            <div className="panel-footer response_question-blurb">
              {configQuestion.blurb}
            </div> :
            ''
          }
        </div>
      );
    case 'MULTIPLE_CHOICE':
      return (
        <div
          key={questionNumber}
          ref={`qid_${configQuestion.qid}`}
          className={oneLineTrim
            `panel panel-default response__question ${
              configQuestion.qid === activeQuestion ? `${/* 'question-active'*/''}` : ''
            }`
          }
        >
          <div className="panel-heading response__question-label">
            {configQuestion.text}
          </div>
          <div className="panel-body response__question-answers">
            {configQuestion.answers.map((answer) =>
              <div key={answer.aid} className="response__question-answer">
                <Radio
                  className="response__question-answer-multichoice"
                  name={configQuestion.qid}
                  value={answer.aid}
                  label={answer.text}
                  checked={answer.aid === responseQuestion.aid}
                  disabled={completed ? 'disabled' : ''}
                  onChange={() => handleAnswer(configQuestion.qid, answer.aid)}
                  autoFocus={configQuestion.qid === activeQuestion}
                />
              </div>
            )}
          </div>
          {(completed && configQuestion.blurb) ?
            <div className="panel-footer response__question-blurb">
              {configQuestion.blurb}
            </div> :
            ''
          }
        </div>
      );
    case 'GRID':
      return (
        <div key={questionNumber} className="panel panel-default response__question">
          <div className="panel-heading response__question-label">
            {configQuestion.text}
          </div>
          <div className="panel-body response__question-answers">
            <table
              className={
                "table table-bordered table-striped table-hover response__question-grid"
              }
            ><tbody>
              <tr>
                <td></td>
                {configQuestion.columns.map((column, key) =>
                  <td
                    key={key}
                    className="grid__column-header"
                  >{column}</td>
                )}
              </tr>
              {configQuestion.rows.map((row, key) =>
                (row.type === 'GRID_TEXT' ? null :
                  <tr
                    key={key}
                    ref={`qid_${row.qid}`}
                  >
                    <td className="grid__row-header">{row.text}</td>
                    {configQuestion.columns.map((column, idx) => {
                      switch (row.type) {
                        case 'GRID_RADIO':
                        case 'GRID_CHECKBOX':
                          return (
                            <td
                              className="grid__cell"
                              key={idx}
                              onClick={(e) => {
                                if (e.target.localName === 'span') {
                                  return;
                                }
                                const answer = row.type === 'GRID_CHECKBOX' ?
                                  reconcileCheckbox(responseQuestion[row.qid], (idx + 1).toString())
                                  : (idx + 1).toString();
                                handleAnswer(row.qid, answer);
                              }}
                            >
                              <div
                                className={
                                  `pt-control ${
                                    row.type === 'GRID_RADIO' ? 'pt-radio' : 'pt-checkbox'
                                  } grid__cell-answer`
                                }
                              >
                                {(row.type === 'GRID_RADIO') ?
                                  <input
                                    name={row.qid}
                                    type="radio"
                                    disabled={completed ? 'disabled' : ''}
                                    checked={
                                      (responseQuestion[row.qid] === (idx + 1).toString()) ?
                                      'checked' : ''
                                    }
                                    onChange={() => {
                                      handleAnswer(row.qid, (idx + 1).toString());
                                    }}
                                    autoFocus={(idx === 0 && row.qid === activeQuestion)}
                                  /> :
                                  <input
                                    name={row.qid}
                                    type="checkbox"
                                    disabled={completed ? 'disabled' : ''}
                                    checked={
                                      (responseQuestion[row.qid] === (idx + 1).toString() ||
                                      responseQuestion[row.qid] === '3') ? 'checked' : ''
                                    }
                                    onChange={() => {
                                      handleAnswer(row.qid, (idx + 1).toString());
                                    }}
                                    autoFocus={(idx === 0 && row.qid === activeQuestion)}
                                  />
                                }
                                <span
                                  className="pt-control-indicator"
                                  onClick={() => {
                                    handleAnswer(row.qid, (idx + 1).toString());
                                  }}
                                ></span>
                              </div>
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                  </tr>
                )
              )}
            </tbody></table>
          {configQuestion.rows.filter((row) => row.type === 'GRID_TEXT').map((q, idx) =>
            <label
              key={idx}
              className={`pt-label specify-label ${completed ? 'pt-disabled' : ''}`}
            >
              {q.text}
              <input
                ref={`qid_${q.qid}`}
                name={q.qid}
                value={(responseQuestion[q.qid] || '')}
                disabled={completed ? 'disabled' : ''}
                className="pt-input"
                type="text"
                dir="auto"
                onChange={(e) => handleAnswer(q.qid, e.target.value)}
              />
            </label>
            )}
          </div>
          {(completed && configQuestion.blurb) ?
            <div className="panel-footer response__question-blurb">
              {configQuestion.blurb}
            </div> :
            ''
          }
        </div>
      );
    default:
      return '';
  }
};

const renderQuestionnaire = (configObj) => (
  <div className="questionnaire">
    {configObj.config.meta.sections.map((section, index) => (
      <div
        key={index}
        id={`section_${section.id}`}
        className={
          oneLineTrim`section__container ${
            (configObj.activeQuestion === undefined ||
            section.qids.includes(configObj.activeQuestion)) ?
            'section-active' : 'section-inactive'}`
        }
      >
        <div className="response__section-label">
          {!configObj.completed &&
            <div className="section__label-item section__label-count">
              {`Section ${section.id} out of ${configObj.config.meta.sections.length}`}
            </div>
          }
          <div className="section__label-item section__label-text">
            {`${section.label}${(section.graded && configObj.completed) ?
              ` | Your Section GPA is ${configObj.score[section.group].toFixed(1)}` :
              ''
            }`}
          </div>
          {!configObj.completed &&
            <div className="section__label-item section__button-container section__button-save">
              <Button
                onClick={() => configObj.handleSave(configObj.answers)}
                text={configObj.surveyCompleted ? 'Submit' : 'Save'}
                className={oneLineTrim
                  `pt-intent-${configObj.surveyCompleted ? 'success submit__button ' : 'primary '}
                   section__button`
                 }
              />
            </div>
          }
        </div>
        <div
          ref={`section_${section.id}`}
          id={`section_${section.id}`}
          className="response__section"
        >
          {section.question_numbers.map((questionNumber) => {
            const configQuestion = configObj.config.questions.find(
              (qObj) => qObj.question_number === questionNumber
            );
            const responseQuestion = (configQuestion.type === 'GRID') ?
              configQuestion.rows.reduce(
                (responseQs, row) => ({
                  ...responseQs,
                  ...{ [row.qid]: configObj.answers[row.qid] },
                }), {}
              ) :
              { aid: configObj.answers[configQuestion.qid] };

            return renderQuestion(
              questionNumber,
              configQuestion,
              responseQuestion,
              configObj.activeQuestion,
              configObj.error,
              configObj.completed,
              configObj.handleAnswer
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

const renderViewer = (config, answers, response, tcScores) => (
  <div className="response__viewer">
    {/*
      <div
        className="pt-button pt-intent-primary button-print"
        onClick={requestPDF}>Export PDF
      </div>
      */}
    <div className="response__overall">
      <div className="response__overall-date">
        {moment(response.meta.DATE_CREATED).format('ddd MMM Do, YYYY')}
      </div>
      <div className="response__overall-label">
        Your Overall Score is a {gradeLetter(pointToPercent(response.score.Overall))}
      </div>
      {renderChart('point', 'Pie', [response], 'ct-chart response__chart response__chart-donut')}
    </div>
    <div className="response__section-breakdown">
      <div className="response__section-breakdown-label">Section Breakdown</div>
      <div className="response__chart-bar-key">
        <span className="key__item key__item-blue">Your Score</span>
        <span className="key__item key__item-gray">Average Score</span>
      </div>
      {renderChart(
        'point', 'Bar', [response, tcScores],
        'ct-chart response__chart response__chart-bar'
      )}
    </div>
    <div className="response__questionnaire-breakdown">
      <div className="response__questionnaire-breakdown-label">Questionnaire Breakdown</div>
      {renderQuestionnaire({
        config,
        answers,
        score: response.score,
        completed: (response.meta.completed === 1),
      })}
    </div>
    <span
      id="top-link-block"
      ref="topBlock"
      className="hidden well well-sm topBlock"
      onClick={() => scrollTo(document.getElementsByClassName('surveyComponent')[0], 0, 500)}
    >
      <i className="glyphicon glyphicon-chevron-up"></i> Back to Top
    </span>
  </div>
);

const renderSurvey = (config, answers, activeQuestion,
  error, errorMessage,
  handleAnswer, handleSectionChange,
  handleSave, handleSubmit, surveyCompleted, isPosting) => (
  <div className="survey__viewer">
    {renderQuestionnaire({
      config,
      answers,
      activeQuestion,
      error,
      handleAnswer,
      handleSave: (surveyCompleted ? handleSubmit : handleSave),
      surveyCompleted,
      isPosting,
    })}
    <div className="questionnaire-footer">
      <div className="section__button-container section__button-back">
        <Button
          onClick={() => handleSectionChange(-1)}
          text="Back"
          className="pt-intent-primary section__button"
          disabled={config.meta.sections.find((s) => s.qids.includes(activeQuestion)).id === 1}
        />
      </div>
      {error &&
        <div className="section__button-container section__label-error">
          {errorMessage}
        </div>
      }
      <div className="section__button-container section__button-next">
        <Button
          onClick={() => handleSectionChange(1)}
          text="Next"
          className="pt-intent-primary section__button"
          disabled={
            config.meta.sections.find(
              (s) => s.qids.includes(activeQuestion)
            ).id === config.meta.sections.length
          }
        />
      </div>
    </div>
  </div>
);

const buildSurveyAnswers = (config, response, existingAnswers) => ({
  ...config.meta.sections.reduce((answers, section) => (
    {
      ...answers,
      ...section.qids.reduce((sectionAnswers, qid) => ({
        ...sectionAnswers,
        ...{
          [qid]: (response.find((q) => q.qid === qid) || { aid: undefined }).aid,
        },
      }), {}),
    }
  ), {}),
  ...Object.keys(existingAnswers).reduce(  // need to remove values of undefined
    (onlyAnswers, a) => (
      (existingAnswers[a] !== undefined) ?
      { ...onlyAnswers, ...{ [a]: existingAnswers[a] } } :
      { ...onlyAnswers }
    ),
    {}
  ),
});

const nullToUndefined = (o) => {
  const newO = {};
  Object.keys(o).forEach((k) => {
    const value = (o[k] === undefined || o[k] === null) ? undefined : o[k];
    newO[k] = value;
  });
  return newO;
};

const updateState = (props, surveyAnswers) => {
  const response = (
    (props.response.items !== undefined &&
    props.response.items.length !== 0) ?
      props.response.items[0] :
      {}
  );
  const responseAnswers = response.questionnaire ? props.response.items[0].questionnaire : [];
  const activeQuestion = (
    response.meta === undefined ||
    response.meta.completed === 1) ?
      undefined :
      ((
        response.questionnaire
        .sort((q1, q2) => (parseInt(q1.qid, 10) < parseInt(q2.qid, 10) ? -1 : 1))
        .find((q) => (q.aid === undefined || q.aid === null)) || { qid: '1' }
      ).qid);
  return {
    surveyAnswers: nullToUndefined(
      buildSurveyAnswers(props.config, responseAnswers, surveyAnswers)
    ),
    activeQuestion,
  };
};

class Survey extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...{ config: props.config },
      ...updateState(props, {}),
    };
  }

  componentWillReceiveProps = (nextProps) => (
    this.setState(updateState(nextProps, this.state.surveyAnswers))
  );

  focusInput = (qid) => {
    const q = this.refs[`qid_${qid}`];
    const section = this.state.config.meta.sections.find((s) => s.qids.includes(qid));

    let to = 0;
    if (q.localName === 'tr') {
      to = ((q.offsetParent !== null) ?
        q.offsetParent.offsetTop - q.offsetParent.offsetHeight : 0);
    } else {
      to = q.offsetTop - q.offsetHeight;
    }

    scrollTo(this.refs[`section_${section.id}`], to, 300);

    if (q.localName === 'input') {
      q.focus();
      return;
    }
    if (q.localName === 'tr') {
      q.firstElementChild.nextElementSibling.firstElementChild.firstElementChild.focus();
      return;
    }
    // target must be question panel for multiple choice or number input
    if (q.lastElementChild.firstElementChild.localName === 'input') {
      q.lastElementChild.firstElementChild.focus();
      return;
    }
    q.lastElementChild.firstElementChild.firstElementChild.focus();
    return;
  }

  handleAnswer = (qid, aid) => {
    this.refs[`qid_${qid}`].classList.remove('q-error');
    this.setState({
      error: false,
      errorMessage: '',
      surveyAnswers: {
        ...this.state.surveyAnswers,
        ...{ [qid]: aid },
      },
    });
  }

  validateSection = (section) => {
    if (!section.isRequired) { return true; }

    const answers = this.state.surveyAnswers;
    const unansweredQ = section.qids.find((q) => answers[q] === undefined);
    if (unansweredQ) {
      // ignore text inputs for now (none are required)
      if (this.refs[`qid_${unansweredQ}`].type !== 'text') {
        this.setState({
          activeQuestion: unansweredQ,
          error: true,
          errorMessage: 'Oops! You missed one.',
        });
        // add the error class and focus the question
        const questionElement = this.refs[`qid_${unansweredQ}`];
        questionElement.classList.add('q-error');
        this.focusInput(unansweredQ);
        return false;
      }
    }
    // should save section now
    return true;
  }

  handleSectionChange = (diff) => {
    const activeSection = this.state.config.meta.sections.find(
      (section) => section.qids.includes(this.state.activeQuestion)
    );
    // If diff is positive (moving forward),
    // we need to validate the current section
    if (diff > 0) {
      if (!this.validateSection(activeSection)) {
        return;
      }
      // Saving Section Here
      // const r = (this.props.response.items !== undefined ?
      //   this.props.response.items[0].questionnaire : []);
      // if (r.length > 0) {
      //   const answerChanged = activeSection.qids.find(
      //     (q) => this.state.surveyAnswers[q] !== r.find(
      //       (a) => a.qid === q
      //     ).aid
      //   );
      //   if (activeSection.isRequired && answerChanged !== undefined) {
      //     this.props.handleSave(this.state.surveyAnswers);
      //   }
      // }
    }

    let nextID = (activeSection.id + diff);
    nextID = nextID < 1 ? 1 : nextID;
    nextID = nextID > this.state.config.meta.sections.length ?
      this.state.config.meta.sections.length : nextID;

    const qid = this.state.config.meta.sections.find(
      (section) => section.id === nextID
    ).qids[0];

    this.setState({
      activeQuestion: qid,
    }, () => this.focusInput(qid));
  }

  surveyCompleted = () => {
    if (this.state.config === undefined) {
      return false;
    }
    const incomplete = this.state.config.meta.sections.filter((s) => s.isRequired).find(
      (s) => s.qids.find(
        (q) => this.state.surveyAnswers[q] === undefined
      )
    );
    return (incomplete === undefined);
  }

  renderComponent(config, response, TCAvgHRA, handleSave,
    handleSubmit, goBackToDashboard) {
    if (response.isFetching) {
      return renderLoadingComponent();
    }
    if (response.items === undefined || response.items.length === 0) {
      return renderEmptyComponent(goBackToDashboard);
    }
    if (response.items[0].meta.completed) {
      return renderViewer(
        config,
        this.state.surveyAnswers,
        response.items[0],
        TCAvgHRA.items[0]
      );
    }
    return renderSurvey(
      config,
      this.state.surveyAnswers,
      this.state.activeQuestion,
      this.state.error,
      this.state.errorMessage,
      this.handleAnswer,
      this.handleSectionChange,
      handleSave,
      handleSubmit,
      this.surveyCompleted(),
      response.isPosting
    );
  }

  render() {
    return (
      <div
        className="spaceComponent surveyComponent"
        onScroll={() => {
          this.refs.topBlock.classList.remove('hidden');
          console.log('scrolling!');
        }}
      >
        {this.renderComponent(
          this.props.config,
          this.props.response,
          this.props.TCAvgHRA,
          this.props.handleSave,
          this.props.handleSubmit,
          this.props.goBackToDashboard
        )}
      </div>
    );
  }
}

Survey.propTypes = {
  config: React.PropTypes.shape({
    meta: React.PropTypes.shape({ sections: React.PropTypes.array.isRequired }).isRequired,
    questions: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
  }).isRequired,
  response: React.PropTypes.shape({
    isFetching: React.PropTypes.bool.isRequired,
    isPosting: React.PropTypes.bool.isRequired,
    items: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        meta: React.PropTypes.object.isRequired,
        score: React.PropTypes.object,
        questionnaire: React.PropTypes.array.isRequired,
      })
    ),
  }),
  TCAvgHRA: React.PropTypes.shape({
    isFetching: React.PropTypes.bool.isRequired,
    items: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        score: React.PropTypes.object.isRequired,
      })
    ),
  }),
  handleSave: React.PropTypes.func.isRequired,
  handleSubmit: React.PropTypes.func.isRequired,
  handleRefresh: React.PropTypes.func.isRequired,
  goBackToDashboard: React.PropTypes.func.isRequired,
};


export default Survey;
