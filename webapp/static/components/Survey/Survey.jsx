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

const renderQuestion = (questionNumber, configQuestion,
  responseQuestion, activeQuestion, completed, handleAnswer) => {
  switch (configQuestion.type) {
    case 'INTEGER':
      return (
        <div key={questionNumber} className="panel panel-default response__question">
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
                  <tr key={key}>
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
              className={`pt-label ${completed ? 'pt-disabled' : ''}`}
            >
              {q.text}
              <input
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
          <div className="section__label-count">
            {`Section ${section.id} out of ${configObj.config.meta.sections.length}`}
          </div>
          <div>
            {`${section.label}${(section.graded && configObj.completed) ?
              ` | Your Section GPA is ${configObj.score[section.group].toFixed(1)}` :
              ''
            }`}
          </div>
          <Button onClick={() => configObj.handleSave(configObj.answers)} text="Save" />
        </div>
        <div className="response__section">
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
  </div>
);

const renderSurvey = (config, answers, activeQuestion,
  handleAnswer, handleSectionChange,
  handleSave, handleSubmit, isPosting) => (
  <div className="survey__viewer">
    {renderQuestionnaire({
      config,
      answers,
      activeQuestion,
      handleAnswer,
      handleSave,
      isPosting,
    })}
    {isPosting ?
      '' :
      <div className="questionnaire-footer">
        <Button onClick={() => handleSectionChange(-1)} text="Back" />
        <Button onClick={() => handleSectionChange(1)} text="Next" />
      </div>
    }
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

  handleAnswer = (qid, aid) => {
    this.setState({
      surveyAnswers: {
        ...this.state.surveyAnswers,
        ...{ [qid]: aid },
      },
    });
  }

  handleSectionChange = (diff) => {
    const activeSection = this.state.config.meta.sections.find(
      (section) => section.qids.includes(this.state.activeQuestion)
    );
    let nextID = (activeSection.id + diff);
    nextID = nextID < 1 ? 1 : nextID;
    nextID = nextID > this.state.config.meta.sections.length ?
      this.state.config.meta.sections.length : nextID;
    this.setState({
      activeQuestion: this.state.config.meta.sections.find(
        (section) => section.id === nextID
      ).qids[0],
    });
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
      this.handleAnswer,
      this.handleSectionChange,
      handleSave,
      handleSubmit,
      response.isPosting
    );
  }

  render() {
    return (
      <div className="spaceComponent surveyComponent">
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
