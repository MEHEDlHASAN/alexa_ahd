const Alexa = require('ask-sdk-core');
const { audio, visual, data } = require('../../res');
const {
  getRemoteData
} = require('../../helper.js');

const REGISTER = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegistrationIntent'
      || (Alexa.getRequestType(handlerInput.requestEnvelope) ===
        'Alexa.Presentation.APL.UserEvent' &&
        handlerInput.requestEnvelope.request.arguments[0] === 'RegistrationIntent');
  },
  async handle(handlerInput) {
    let accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;

    if (accessToken === undefined) {
      var speechText = "Please use the Alexa companion app to authenticate with your Amazon account to start using this skill.";

      return handlerInput.responseBuilder
        .speak(speechText)
        .withLinkAccountCard()
        .getResponse();
    } else {
      //let accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
      let url = `https://api.amazon.com/user/profile?access_token=${accessToken}`;
      /*
      * data.user_id : "amzn1.account.xxxxxxxxxx"
      * data.email : "steve@dabblelab.com"
      * data.name : "Steve Tingiris"
      * data.postal_code : "33607"
      */
      let outputSpeech = 'This is the default message.';

      await getRemoteData(url)
        .then((response) => {
          const data = JSON.parse(response);
          outputSpeech = `Hi ${data.name}. I have yor email address as: ${data.email}.`;
        })
        .catch((err) => {
          //set an optional error message here
          outputSpeech = err.message;
        });

      return handlerInput.responseBuilder
        .speak(outputSpeech)
        .getResponse();
    }
  }
};

module.exports = REGISTER;