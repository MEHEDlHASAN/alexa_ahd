const Alexa = require('ask-sdk-core');
const { visual } = require('../../res');
const {
  greet,
  supportsAPL,
  getRemoteData,
  addAplIfSupported
} = require('../../helper.js');


const CHART = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'ChartIntent')
      || (Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent' &&
        handlerInput.requestEnvelope.request.arguments[0] === 'chartTouchEvent');
  },
  async handle(handlerInput) {

    await getRemoteData(`${process.env.EXTERNAL_URL}`)
      .then((response) => {
        const data = JSON.parse(response);

        let speakText1 = data.tdcl.yesterday1.speakText;
        let speakVoice = `${greet} ${speakText1} . To hear another report you can say, report one or report two. Which one would you like to try?`



        const datasources = {
          "aplData": {
            "data": [
              data.kpi.targetYesterday,
              data.kpi.salesYesterday
            ],
            "maxY": data.kpi.targetToday,
            "about_maxY": "maxY must be bigger than or equal to max of data",
            "yTick": Math.ceil(data.kpi.targetYesterday / 4),
            "about_yTick": "yTick must be at least 1/10 of yMax at the smallest",
            "xLabels": [
              "Target",
              `Sales (${Math.ceil((data.kpi.salesYesterday / data.kpi.targetYesterday) * 100)})%`
            ],
            "barColor": "blue"
          }

        }


        if (!supportsAPL(handlerInput)) {
          return handlerInput.responseBuilder
            .speak('<speak><amazon:emotion name=\'excited\' intensity=\'low\'>Sorry, Your device is not APL supported.</amazon:emotion></speak>')
            .withShouldEndSession(true)
            .reprompt('Try with APL enabled device.')
            .getResponse();
        } else {
          console.log(JSON.stringify(datasources));
          // Add visuals if supported
          addAplIfSupported(handlerInput, visual.chart, datasources);

          handlerInput.responseBuilder
            .speak(speakVoice)
            .getResponse();

        }
      })

    return handlerInput.responseBuilder
      .getResponse();

  }
};

module.exports = CHART;