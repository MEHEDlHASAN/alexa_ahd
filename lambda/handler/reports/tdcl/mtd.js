const Alexa = require('ask-sdk-core');
const moment = require('moment');

const { audio, visual } = require('../../../res');
const {
    greet,
    supportsAPL,
    getRemoteData,
    switchVoice,
    addAplIfSupported,
    speakDate,
    getUrl,
    exists
} = require('../../../helper.js');

const TDCL_MTD = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TDCL_MTD'
            || (Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent' &&
                handlerInput.requestEnvelope.request.arguments[0] === 'TDCL_MTD');
    },
    async handle(handlerInput) {
        const S3_EXISTS = await exists('Media/NewsOpener.mp3');
        const audioUri = S3_EXISTS ? await getUrl("Media/NewsOpener.mp3").replace(/&/g, '&amp;') : '';
        let introTheme = S3_EXISTS ? `<audio src='${audioUri}' />` : '';

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        const REPORT_PROMPT = attributes.t('REPORT_TDCL');
        
        await getRemoteData(`${process.env.EXTERNAL_URL}`)
            .then((response) => {
                const res = JSON.parse(response);
                const data = res.tdcl;
                let title1 = data.mtd1.titleText;
                let speakText1 = data.mtd1.speakText;
                let displayText1 = data.mtd1.displayText;
                let title2 = data.mtd2.titleText;
                let speakText2 = data.mtd2.speakText;
                let displayText2 = data.mtd2.displayText;
                let title3 = data.mtd3.titleText;
                let speakText3 = data.mtd3.speakText;
                let displayText3 = data.mtd3.displayText;
                let speakVoice = ` ${greet} ${speakText1} ${speakText2} ${speakText3}. To hear another report ${REPORT_PROMPT}`

                // Mobile Display
                let mobileDisplay = data.mtd1.mDisplayText;

                let lastUpdated = moment(res.last_updated + "+06:00", "YYYY-MM-DD HH:mm:ssZ");

                if (!supportsAPL(handlerInput)) {
                    handlerInput.responseBuilder
                        .addDirective({
                            type: 'Alexa.Presentation.APLA.RenderDocument',
                            document: audio.mobile_report,
                            datasources: {
                                data: {
                                    type: 'object',
                                    properties: {
                                        "bodyText": `${switchVoice(speakVoice, "Matthew")}`
                                    },
                                },
                            },
                        });

                    return handlerInput.responseBuilder
                        .withSimpleCard(`${title1}`, `${mobileDisplay}`)
                        .reprompt(`${switchVoice("You can say, report one for sales analysis <phoneme alphabet='ipa' ph='laiv'>live</phoneme> or report two for sales analysis yesterday.", "Matthew")}`)
                        .getResponse();
                }

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
                                    "text": displayText2,
                                    "id": "two",
                                    "pageText": switchVoice(speakText2, "Matthew"),
                                    "HeaderText": title2
                                },
                                {
                                    "text": displayText3,
                                    "id": "three",
                                    "pageText": switchVoice(speakText3, "Matthew"),
                                    "HeaderText": title3
                                },
                                {
                                    "text": "Thanks for watching. <br>To see another report you can say, <br><i>'Alexa, Open report one'</i> or <br><i>'Alexa, Open report two'</i>",
                                    "id": "four",
                                    "pageText": switchVoice(`To see another report<break time='0.3s'/> ${REPORT_PROMPT}`, "Matthew"),
                                    "HeaderText": "Thank you"
                                }
                            ],
                            "uploadTime": `${lastUpdated.fromNow()}`,
                            "preambleSsml": `<speak>Greetings to AHD report. Today is ${speakDate} </speak>`,
                            "reportTitle": "TDCL MTD Sales Analysis",
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

                console.log(JSON.stringify(datasources));

                // Add visuals if supported
                addAplIfSupported(handlerInput, visual.report, datasources);

            })

        return handlerInput.responseBuilder
            .speak(introTheme)
            .getResponse();
    }
};

module.exports = TDCL_MTD;