const Alexa = require('ask-sdk-core');
const { visual, data } = require('../../res');
const {
  supportsAPL,
  addAplIfSupported
} = require('../../helper.js');

const InstHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'INST_DASHBOARD'
      || (Alexa.getRequestType(handlerInput.requestEnvelope) ===
        'Alexa.Presentation.APL.UserEvent' &&
        handlerInput.requestEnvelope.request.arguments[0] === 'INST_SEG');
  },
  async handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = attributes.t('REPORT_INST');

    if (!supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speakOutput)
        // .withStandardCard(attributes.t('SKILL_NAME'),
        //     CARD_CONTENT, process.env.LOGO, process.env.LOGO)
        .reprompt()
        .getResponse();
    } else {
      // Add visuals if supported
      addAplIfSupported(handlerInput, visual.reportLauncher, data.inst_launcher);
    }

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();

  }
};

module.exports = InstHandler;