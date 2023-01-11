const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const _ = require('lodash');
const momentz = require('moment-timezone');
let datetime = momentz().tz('Asia/Dhaka');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});
exports.s3 = s3;

const d = new Date();
d.toLocaleTimeString();

const timestamp = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`
exports.timestamp = timestamp;

        
exports.exists = async (key) => {
    const exists = await s3
  .headObject({
    Bucket: process.env.S3_PERSISTENCE_BUCKET,
    Key: key,
  })
  .promise()
  .then(
    () => true,
    err => {
      if (err.code === 'NotFound') {
        return false;
      }
      throw err;
    }
  );
  
  return exists;
}
  
      
exports.s3upload = async (data, userId, seg) => {
  var buf = Buffer.from(JSON.stringify(data));
  await s3.putObject({
    Body: buf,
    Bucket: process.env.S3_PERSISTENCE_BUCKET,
    ContentEncoding: 'base64',
    ContentType: 'application/json',
    // ACL: 'public-read',
    Key: `Media/log/${userId}/${seg}/${timestamp}/data.json`
  }, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log(data);           // successful response
      console.log(`Data is successsfully uploaded to ${process.env.S3_PERSISTENCE_BUCKET}`)
    }
  }).promise();
}

// Shuffle Array
exports.shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}



// Localization Intercceptor
const languageStrings = require('./languages/languageStrings');// Localized resources used by the localization client

let greetTime = parseInt(datetime.format('HH'));
let greet = '';

if (greetTime >= 5 && greetTime < 12) {
  greet = 'Good morning. ';
} else if (greetTime >= 12 && greetTime < 18) {
  greet = 'Good afternoon. ';
} else if (greetTime >= 18 && greetTime < 22) {
  greet = 'Good evening. ';
} else if (greetTime >= 22 && greetTime < 24) {
  greet = 'Hello there. ';
} else {
  greet = 'Greetings. ';
}

exports.greet = greet;

exports.ObjectId = (m = Math, d = Date, h = 16, s = s => m.floor(s).toString(h)) =>
  s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h))

exports.speakDate = datetime.format('YYYY-MM-DD hh:mm A');
exports.timestamps = datetime.format('YYYY-MM-DD HH:mm:ss');
exports.displayDate = datetime.format('DD MMMM [<span fontSize="60dp"><br><b>] HH:mm A[</b></span>]');

var mobileDisplayOutput = '';
exports.mobileDisplay = (data) => {
  for (let i = 0; i < 30; i++) {
    mobileDisplayOutput += i + 1 + ". " + data + "\n";
  }
}


const s3SigV4Client = new AWS.S3({
  signatureVersion: 'v4',
  region: process.env.S3_PERSISTENCE_REGION
});

exports.getUrl = (s3ObjectKey) => {

  const bucketName = process.env.S3_PERSISTENCE_BUCKET;
  const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
    Bucket: bucketName,
    Key: s3ObjectKey,
    Expires: 60 * 1 // the Expires is capped for 1 minute
  });
  // console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
  return s3PreSignedUrl;

}

exports.switchVoice = (text, voice_name) => {
  if (text) {
    return "<speak><amazon:domain name='news'><voice name='" + voice_name + "'>" + text + "</voice></amazon:domain></speak>"
  }
}

exports.switchConversation = (text, voice_name) => {
  if (text) {
    return "<speak><amazon:domain name='conversational'><voice name='" + voice_name + "'>" + text + "</voice></amazon:domain></speak>"
  }
}

exports.getRndInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
}

exports.supportsAPL = (handlerInput) => {
  const supportedInterfaces = handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
  const aplInterface = supportedInterfaces['Alexa.Presentation.APL'];
  return aplInterface !== null && aplInterface !== undefined;
}

exports.getRemoteData = (url) => new Promise((resolve, reject) => {
  const client = url.startsWith('https') ? require('https') : require('http');
  const request = client.get(url, (response) => {
    if (response.statusCode < 200 || response.statusCode > 299) {
      reject(new Error(`Failed with status code: ${response.statusCode}`));
    }
    const body = [];
    response.on('data', (chunk) => body.push(chunk));
    response.on('end', () => resolve(body.join('')));
  });
  request.on('error', (err) => reject(err));
});

exports.speakSSML = (txt) => {
  return `<speak>${txt.replace(/[^A-Za-z0-9;\-—:.'?*$%(){}[\]!"#+/;,=\\^_~|ª©«¬®ˉ°±²³´µ¶¸¹º»¼½¾¿ÆÇÐÑ×ÖØÝÞßæçèñõö÷øùúûüýþÿ ]/g, "")}</speak>`;
}

exports.filterSpeech = (txt) => {
  return `${txt.replace(/[^A-Za-z0-9;\-—:.'?*$%(){}[\]!"#+/;,=\\^_~|ª©«¬®ˉ°±²³´µ¶¸¹º»¼½¾¿ÆÇÐÑ×ÖØÝÞßæçèñõö÷øùúûüýþÿ ]/g, "")}`;
}
exports.html2bntxt = (txt) => txt.replace(/<[^>]*>#;?/gm, '').replace(/[^ঀ-ঃঅ-ঌএ-ঐও-নপ-রলশ-হ়-ৄে-ৈো-ৎৗড়ঢ়য়/ৣ০-৾\—।'?*$(){}!+,^_~|ª©«¬®ˉ°±²³´µ¶¸¹º»¼½¾¿ÆÇÐÑ×ÖØÝÞßæçèñõö÷øùúûüýþÿ ]/g, '');

exports.limitTxt = (txt) => {
  return txt.split('.', 13).join('. ');
}

exports.cleanText = (txt) => {
  return `${txt.replace(/[^A-Za-z0-9;\-—:.'?*$%(){}[\]!"#+/;,=\\^_~|ª©«¬®ˉ°±²³´µ¶¸¹º»¼½¾¿ÆÇÐÑ×ÖØÝÞßæçèñõö÷øùúûüýþÿ ]/g, "")}`;
}
exports.html2txt = (txt) => txt.replace(/<[^>]*>?/gm, '').replace(/&#8217;/g, "'").replace("&#8230;", "...").replace("&#8220;", "\"").replace("&#8221;", "\"").split('Continue reading "')[0].replace(/\s?&\S+/g, '');

function isAplSupported(handlerInput) {
  const interfaces = Alexa.getSupportedInterfaces(handlerInput.requestEnvelope);
  const aplInterface = interfaces["Alexa.Presentation.APL"];
  return _.get(aplInterface, 'runtime.maxVersion') >= "1.1";
}

exports.addAplIfSupported = (handlerInput, document, data) => {
  if (isAplSupported(handlerInput)) {
    handlerInput.responseBuilder
      .addDirective({
        "type": "Alexa.Presentation.APL.RenderDocument",
        "document": document,
        "datasources": data
      });
  }
}

exports.getAplADirective = (document) => {
  return {
    "type": "Alexa.Presentation.APLA.RenderDocument",
    "document": document
  }
}

exports.dynamicAplADirective = (document, data) => {
  return {
    "type": "Alexa.Presentation.APLA.RenderDocument",
    "document": document,
    "datasources": data
  }
}

exports.LocalizationInterceptor = {
  process(handlerInput) {
    const { requestEnvelope, attributesManager } = handlerInput;

    const localizationClient = i18n.use(sprintf).init({
      lng: requestEnvelope.request.locale,
      fallbackLng: 'en-US',
      resources: languageStrings,
    });

    localizationClient.localize = (...args) => {
      // const args = arguments;
      const values = [];

      for (let i = 1; i < args.length; i += 1) {
        values.push(args[i]);
      }
      const value = i18n.t(args[0], {
        returnObjects: true,
        postProcess: 'sprintf',
        sprintf: values,
      });

      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };

    const attributes = attributesManager.getRequestAttributes();
    attributes.t = (...args) => localizationClient.localize(...args);
  },
};