const Alexa = require('ask-sdk-core');
const dotenv = require('dotenv');
require('dotenv').config();

const { visual, data } = require('./res');

const {
    LocalizationInterceptor,
    supportsAPL,
    addAplIfSupported,
    greet
} = require('./helper.js');

const LaunchIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getRequestAttributes();
        const consent = attributes.t('CONSENT');

        if (!supportsAPL(handlerInput)) {
            return handlerInput.responseBuilder
                .speak(greet + consent)
                .reprompt()
                .getResponse();
        } else {
            handlerInput.responseBuilder
                .speak(greet + consent)
                .addDirective({
                    "type": "Alexa.Presentation.APL.RenderDocument",
                    "document": visual.intro,
                    "datasources": data.intro
                })
                .reprompt()
                .getResponse();

        }

        return handlerInput.responseBuilder
            .getResponse();
    }
};

const ReportRouteHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RreportHomeIntent';
    },
    async handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getRequestAttributes();

        let intent = handlerInput.requestEnvelope.request.intent;
        let consentType = intent.slots.report_consent.value;

        if (consentType === 'yes') {
            if (!supportsAPL(handlerInput)) {
                return MobileReportIntentHandler.handle(handlerInput);
            } else { return HomeHandler.handle(handlerInput); }
        } else {
            handlerInput.responseBuilder
                .withShouldEndSession(true);
        }

        return handlerInput.responseBuilder
            .getResponse();

    }
};

const HomeHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HomeIntent'
            || (Alexa.getRequestType(handlerInput.requestEnvelope) ===
                'Alexa.Presentation.APL.UserEvent' &&
                handlerInput.requestEnvelope.request.arguments[0] === 'goBack');
    },
    async handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getRequestAttributes();
        const speakOutput = attributes.t('REPORT_SEGMENT');

        if (!supportsAPL(handlerInput)) {
            handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt()
                .getResponse();
        } else {
            console.log("APL Initiated!")
            // Add visuals if supported
            addAplIfSupported(handlerInput, visual.reportLauncher, data.report_segment);

        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();

    }
};



const HomeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'backToHomeIntent';
    },
    handle(handlerInput) {
        return LaunchIntentHandler.handle(handlerInput);
    }
};


const MobileReportIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MobileReportIntent';
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getRequestAttributes();
        const speakOutput = attributes.t('GREET')
        const reprompt = attributes.t('GREETING_REPROMPT')

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompt)
            .getResponse();
    }
};


const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getRequestAttributes();
        const speakOutput = attributes.t('HELP');
        const reprompt = attributes.t('HELP_REPROMPT');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompt)
            .getResponse();
    }
};


const PauseSessionIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'PauseSession');
    },
    handle(handlerInput) {
        if (!supportsAPL(handlerInput)) {
            return handlerInput.responseBuilder
                .speak('<speak><amazon:emotion name=\'excited\' intensity=\'low\'>Paused</amazon:emotion></speak>')
                .withShouldEndSession(false)
                .reprompt('You can say; \'Resume\', to resume session.')
                .getResponse();
        } else {
            // Add visuals if supported
            addAplIfSupported(handlerInput, visual.pause, data.pause);
        }

        return handlerInput.responseBuilder
            .getResponse();
    }
};

const EndSession = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'EndSession'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent')
            || (Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent' &&
                handlerInput.requestEnvelope.request.arguments[0] === 'exitButton');
    },
    handle(handlerInput) {
        if (!supportsAPL(handlerInput)) {
            return handlerInput.responseBuilder
                .speak('')
                .withShouldEndSession(true)
                .getResponse();
        } else {
            // Add visuals if supported
            addAplIfSupported(handlerInput, visual.exit, data.exit);

            handlerInput.responseBuilder
                .withShouldEndSession(true)
                .getResponse();
        }



        return handlerInput.responseBuilder
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .withShouldEndSession(true)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getRequestAttributes();
        const speakOutput = attributes.t('FALLBACK')

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getRequestAttributes();
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = attributes.t('INTENT_REFLECTOR', `${intentName}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};


const TDCLHandler = require('./handler/components/TDCL_Launcher.js');
const InstHandler = require('./handler/components/INST_Launcher.js');
const TDCL_LIVE = require('./handler/reports/tdcl/live.js');
const INST_LIVE = require('./handler/reports/inst/live.js');
const TDCL_YESTERDAY = require('./handler/reports/tdcl/yesterday.js');
const INST_YESTERDAY = require('./handler/reports/inst/yesterday.js');
const TDCL_MTD = require('./handler/reports/tdcl/mtd.js');
const INST_MTD = require('./handler/reports/inst/mtd.js');
const CHART = require('./handler/reports/chart.js');
const REGISTER = require('./handler/admin/register.js');
const LOG = require('./handler/admin/log.js');

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        const detailedError = `${JSON.stringify(error)}`;
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};



// dot env interceptor
const EnvironmentCheckInterceptor = {
    process(handlerInput) {
        // load environment variable from .env
        dotenv.config();

        // check for process.env.S3_PERSISTENCE_BUCKET
        if (!process.env.S3_PERSISTENCE_BUCKET) {
            handlerInput.attributesManager.setRequestAttributes({ invalidConfig: true });
        }
    },
};



exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchIntentHandler,
        REGISTER,
        LOG,
        CHART,
        HomeHandler,
        ReportRouteHandler,

        TDCLHandler,
        InstHandler,

        TDCL_LIVE,
        TDCL_YESTERDAY,
        TDCL_MTD,

        INST_LIVE,
        INST_YESTERDAY,
        INST_MTD,

        HomeIntentHandler,
        MobileReportIntentHandler,
        PauseSessionIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        EndSession,
        IntentReflectorHandler)
    .addRequestInterceptors(
        EnvironmentCheckInterceptor,
        LocalizationInterceptor,
    )
    .addErrorHandlers(
        ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())  // calls APIs to access personal informations
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();