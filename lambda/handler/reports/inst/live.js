const Alexa = require('ask-sdk-core');
const moment = require('moment');

const { audio, visual } = require('../../../res');
const {
    greet,
    supportsAPL,
    getRemoteData,
    switchVoice,
    addAplIfSupported,
    dynamicAplADirective,
    speakDate,
    getUrl,
    exists
} = require('../../../helper.js');

const INST_LIVE = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'INST_LIVE'
            || (Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent' &&
                handlerInput.requestEnvelope.request.arguments[0] === 'INST_LIVE');
    },
    async handle(handlerInput) {
        const S3_EXISTS = await exists('Media/NewsOpener.mp3');
        const audioUri = S3_EXISTS ? await getUrl("Media/NewsOpener.mp3").replace(/&/g, '&amp;') : '';
        let introTheme = S3_EXISTS ? `<audio src='${audioUri}' />` : '';

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        const REPORT_PROMPT = attributes.t('REPORT_INST');

        await getRemoteData(`${process.env.EXTERNAL_URL}`)
            .then((response) => {
                const res = JSON.parse(response);
                const data = res.inst;
                let title1 = data.today1.titleText;
                let speakText1 = data.today1.speakText;
                let displayText1 = data.today1.displayText;
                let lastUpdated = moment(res.last_updated + "+06:00", "YYYY-MM-DD HH:mm:ssZ");

                let mobileDisplay = data.today1.mDisplayText;

                const datasources = {
                    "card": {
                        "type": "object",
                        "properties": {
                            "pagerData": [
                                {
                                    "text": displayText1,
                                    "id": "one",
                                    "pageText": switchVoice(speakText1, "Matthew"),
                                    "HeaderText": title1
                                },
                                {
                                    "text": "Thanks for watching. <br>To see another report you can say, <br><i>'Alexa, Open report two'</i> or <br><i>'Alexa, Open report three'</i>",
                                    "id": "two",
                                    "pageText": switchVoice(`To see another report<break time='0.3s'/> ${REPORT_PROMPT}`, "Matthew"),
                                    "HeaderText": "Thank you"
                                }
                            ],
                            "uploadTime": `${lastUpdated.fromNow()}`,
                            "preambleSsml": `<speak>Greetings to AHD report. Today is ${speakDate} </speak>`,
                            "reportTitle": "INST Live Sales Analysis",
                            "reportSubtitle": "Animal Health Division"
                        },
                        "transformers": [
                            {
                                "inputPath": "pagerData[*].pageText",
                                "outputName": "textSpeech",
                                "transformer": "ssmlToSpeech"
                            },
                            {
                                "inputPath": "preambleSsml",
                                "outputName": "preambleSpeech",
                                "transformer": "ssmlToSpeech"
                            }
                        ]
                    }
                };

                if (!supportsAPL(handlerInput)) {
                    return handlerInput.responseBuilder
                        .withSimpleCard(`${title1}`, `${mobileDisplay}`)
                        .addDirective(dynamicAplADirective(audio.mobile, datasources))
                        .reprompt(`${switchVoice("You can say, report two for sales analysis yesterday or report three for Month to date sales analysis.", "Matthew")}`)
                        .getResponse();
                } else {
                    // Add visuals if supported
                    addAplIfSupported(handlerInput, visual.report, datasources);
                }


            })

        return handlerInput.responseBuilder
            .speak(introTheme)
            .getResponse();
    }
};

module.exports = INST_LIVE;