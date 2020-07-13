/*
 * Copyright (C) 2020 Dabble Lab - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms and conditions defined in file 'LICENSE.txt', which
 * is part of this source code package.
 *
 * For additional copyright information please
 * visit : http://dabblelab.com/copyright
 */

const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const dotenv = require('dotenv');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

/* LANGUAGE STRINGS */
const languageStrings = require('./languages/languageStrings');

/* HANDLERS */

// This handler responds when required environment variables
// missing or a .env file has not been created.
const InvalidConfigHandler = {
  canHandle(handlerInput) {
    const attributes = handlerInput.attributesManager.getRequestAttributes();

    const invalidConfig = attributes.invalidConfig || false;

    return invalidConfig;
  },
  handle(handlerInput) {
    const { responseBuilder, attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();

    const speakOutput = requestAttributes.t('ENV_NOT_CONFIGURED');

    return responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes() || {};
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes() || {};
    
    const userName = persistentAttributes.hasOwnProperty('userName') ? persistentAttributes.userName : undefined;
    const skillName = requestAttributes.t('SKILL_NAME');

    let speakOutput = requestAttributes.t('GREETING_UNKNOWN_USER', { skillName: skillName });
    if (userName) speakOutput = requestAttributes.t('GREETING', { userName: userName });

    let repromptOutput = requestAttributes.t('GREETING_UNKNOWN_USER_REPROMPT');
    if (userName) repromptOutput = requestAttributes.t('GREETING_REPROMPT');

    sessionAttributes.repeatSpeakOutput = speakOutput;
    sessionAttributes.repeatRepromptOutput = repromptOutput;   
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .withSimpleCard(skillName, speakOutput)
      .getResponse();
  },
};

const MyNameIsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'MyNameIsIntent';
  },
  async handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    const userName = handlerInput.requestEnvelope.request.intent.slots.name.value;

    const speakOutput = requestAttributes.t('GREETING_RESPONSE', { userName: userName });

    const attributesManager = handlerInput.attributesManager;
        
    let userAttributes = {
        "userName": userName
    };

    attributesManager.setPersistentAttributes(userAttributes);
    await attributesManager.savePersistentAttributes(); 

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const LearnMoreIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'LearnMoreIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    const speakOutput = requestAttributes.t('LEARN_MORE');

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

// This handler is used to handle the AMAZON.RepeatIntent. It lets uses ask Alexa to repeat the
// last thing that was said. For a video tutorial on using the AMAZON.RepeatIntent visit:
// https://dabblelab.com/tutorials/using-the-amazon-repeatintent-in-alexa-skills-195
const RepeatIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes() || {};

    const repeatSpeakOutput = sessionAttributes.repeatSpeakOutput;
    const repeatRepromptOutput = sessionAttributes.repeatRepromptOutput;   

    const speakOutput = requestAttributes.t('REPEAT', {repeatSpeakOutput: repeatSpeakOutput});
    const repromptOutput = requestAttributes.t('REPEAT_REPROMPT', {repeatRepromptOutput: repeatRepromptOutput});

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

const YesNoIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent');
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    let speakOutput = '';

    if (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent') {
      return LearnMoreIntentHandler.handle(handlerInput);
    }

    if (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent') {
      speakOutput = requestAttributes.t('NO');
    }

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    const speakOutput = requestAttributes.t('HELP');
    const repromptOutput = requestAttributes.t('HELP_REPROMPT');

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    const speakOutput = requestAttributes.t('CANCEL_STOP_RESPONSE');

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

// This function handles syntax or routing errors. If you receive an error stating the request
// handler chain is not found, you have not implemented a handler for the intent or included
// it in the skill builder below
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error Request: ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
    console.log(`Error handled: ${error.message}`);

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = requestAttributes.t('ERROR');
    const repromptOutput = requestAttributes.t('ERROR_REPROMPT');

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

// This function handles utterances that can't be matched to any other intent handler.
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    const speakOutput = requestAttributes.t('FALLBACK');
    const repromptOutput = requestAttributes.t('FALLBACK_REPROMPT');

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

// This function is used for testing and debugging. It will echo back an intent name for an
// intent that does not have a suitable intent handler. a response from this function indicates
// an intent handler function should be created or modified to handle the user's intent.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = requestAttributes.t('REFLECTOR', { intentName: intentName });

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const InvalidConfigInterceptor = {
  process(handlerInput) {
    const result = dotenv.config();

    if (result.error) {
      handlerInput.attributesManager.setRequestAttributes({ invalidConfig: true });
    }
  },
};

// This interceptor function is used for supporting different languages and locals.
// It uses the i18n npm module, along with files in ./lambda/custom/languages/
// to make enabling support for different languages and locals simpler.
const LocalizationInterceptor = {
  process(handlerInput) {
    const { requestEnvelope, attributesManager } = handlerInput;

    const localizationClient = i18n.use(sprintf).init({
      lng: requestEnvelope.request.locale,
      fallbackLng: 'en-US',
      resources: languageStrings,
    });

    localizationClient.localize = (...args) => {
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

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    InvalidConfigHandler,
    LaunchRequestHandler,
    MyNameIsIntentHandler,
    LearnMoreIntentHandler,
    YesNoIntentHandler,
    RepeatIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    FallbackIntentHandler,
    IntentReflectorHandler,
  )
  .withPersistenceAdapter(
    new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(InvalidConfigInterceptor, LocalizationInterceptor)
  .lambda();
