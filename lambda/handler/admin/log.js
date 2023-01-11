const Alexa = require('ask-sdk-core');
const admin = require("firebase-admin");
const { data } = require('../../res');
const {
  getRemoteData
} = require('../../helper.js');

var MongoClient = require('mongodb').MongoClient;
var MongoDB = process.env.MONGODB;


const serviceAccount = require("../../log/firebase.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //   databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
});
const DB = admin.firestore();


const accountSid = process.env.TWILIO_ACC_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// const messaging_service_sid = 'MGee12e7e7641c0794a910106e0632eeb0';
const client = require('twilio')(accountSid, authToken);


const LOG = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'lastUpdatedIntent'
      || (Alexa.getRequestType(handlerInput.requestEnvelope) ===
        'Alexa.Presentation.APL.UserEvent' &&
        handlerInput.requestEnvelope.request.arguments[0] === 'lastUpdatedIntent');
  },
  async handle(handlerInput) {
    let outputSpeech = "";
    //firestore constants
    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
    const deviceId = Alexa.getDeviceId(handlerInput.requestEnvelope);
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const sessionStatus = Alexa.isNewSession(handlerInput.requestEnvelope);
    const viewPortProfile = Alexa.getViewportProfile(handlerInput.requestEnvelope);
    const viewPortOrientation = Alexa.getViewportOrientation(handlerInput.requestEnvelope);
    // let {deviceID} = handlerInput.requestEnvelope.context.System.device.deviceId;

    // Data from account linking
    let accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
    let url = `https://api.amazon.com/user/profile?access_token=${accessToken}`;

    let userID, userEmail, userName, userPostalCode;

    const { serviceClientFactory, responseBuilder } = handlerInput;
    try {
      const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();


      const upsServiceClient = serviceClientFactory.getUpsServiceClient();

      const profileName = await upsServiceClient.getProfileName();
      const profileEmail = await upsServiceClient.getProfileEmail();
      const profileMobileObject = await upsServiceClient.getProfileMobileNumber();
      const profileMobile = profileMobileObject.phoneNumber;
      const usertimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
      const localTime = new Date(new Date().toLocaleString(locale, { timeZone: usertimeZone }));

      const address = await deviceAddressServiceClient.getFullAddress(deviceId);
      // const shortAddress = await deviceAddressServiceClient.getCountryAndPostalCode(deviceId);
      const ADDRESS_MESSAGE = `${address.addressLine1}, ${address.stateOrRegion}-${address.postalCode},${address.city}`;
      // const ADDRESS2_MESSAGE = `Here is your full address: ${address.addressLine2}, ${address.countryCode}, ${address.city}, ${address.districtOrCounty}`;
      // const SHORT_MESSAGE = `Here is your full address: ${shortAddress.ShortAddress}`;

      // const distanceUnit = await upsServiceClient.getSystemDistanceUnits(deviceId);
      // const userDistanceUnit = distanceUnit.DistanceUnits;
      // const temperatureUnit = await upsServiceClient.getSystemTemperatureUnit(deviceId);
      // const userProfileTemperatureUnit = terperatureUnit.TemperatureUnit;
      // const systemTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);

      let options = {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      },
        myDate = new Intl.DateTimeFormat([], options);
      let bnTime = myDate.format(new Date());

      Date.prototype.yyyymmdd = function () {
        var mm = this.getMonth() + 1; // getMonth() is zero-based
        var dd = this.getDate();

        return [this.getFullYear(),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd
        ].join('');
      };

      var date = new Date();
      const TRANSDATE = date.yyyymmdd();

      await getRemoteData(url)
        .then((response) => {
          const data = JSON.parse(response);
          userID = data.user_id;
          userEmail = data.email;
          userName = data.name;
          userPostalCode = data.postal_code;
        })


      let lastUpdated = data.time.lastUpdated;
      outputSpeech += lastUpdated

      // Smart Notification
      // client.messages
      //     .create({body: `Hi, I am Alexa. Welcome to AHD report. ${outputSpeech}`, from: '+17207990766', to: '+8801985440869'})
      //     .then(message => console.log(message.sid));

      // WhatsApp Notification
      client.messages
        .create({
          from: 'whatsapp:+14155238886',
          body: `Hi, I am Alexa. Welcome to AHD report. ${outputSpeech}`,
          mediaUrl: ['https://desert-barracuda-2351.twil.io/assets/Alexa.png'],
          to: 'whatsapp:+8801985440869'
        })
        .then(message => console.log(message.sid));


      //Mongo DB
      await MongoClient.connect(MongoDB, { useUnifiedTopology: true, useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        var dbo = db.db("SKF");
        var AHD = {
          Address: ADDRESS_MESSAGE,
          Name: userName,//profileName,
          Email: userEmail,// profileEmail,
          Phone: '0' + profileMobile,
          UserAccount: userID,//userId,
          UserId: userId,
          PostalCode: userPostalCode,
          DeviceId: deviceId,
          Locale: locale,
          SessionStatus: sessionStatus,
          ViewportProfile: viewPortProfile,
          ViewportOrientation: viewPortOrientation,
          LocalDateTime: localTime,
          DateTime: bnTime,
          DATE: TRANSDATE
        };
        dbo.collection("AHD").insertOne(AHD, function (err, res) {
          console.log('Inserted!');
          if (err) throw err;
          console.log(err)
          db.close();
        });
      });

      // Firestore
      // await DB.collection('AHD').add({
      //         Address: ADDRESS_MESSAGE,
      //         Name: userName,//profileName,
      //         Email: userEmail,// profileEmail,
      //         Phone: '0'+ profileMobile,
      //         UserAccount: userID,//userId,
      //         UserId: userId,
      //         PostalCode: userPostalCode,
      //         DeviceId: deviceId,
      //         Locale: locale,
      //         SessionStatus: sessionStatus,
      //         ViewportProfile: viewPortProfile,
      //         ViewportOrientation: viewPortOrientation,
      //         LocalDateTime: localTime,
      //         DateTime: bnTime,
      //         DATE: TRANSDATE
      //     })

    } catch (e) {
      console.log(e)
      outputSpeech += ` Please say, "Sign me up" to register. and enable permission  from skill setting.`
    }

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .getResponse();
  }
};

module.exports = LOG;