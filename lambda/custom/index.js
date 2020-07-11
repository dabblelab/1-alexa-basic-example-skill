/*
 * Copyright (C) 2019 Dabble Lab - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms and conditions defined in file 'LICENSE.txt', which
 * is part of this source code package.
 *
 * For additional copyright information please
 * visit : http://dabblelab.com/copyright
 */

const Alexa = require('ask-sdk-core');
const dotenv = require('dotenv');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

/* LANGUAGE STRINGS */
const languageStrings = require('./languages/languageStrings');

/* HANDLERS */

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Hi what\'s your name?';
    const repromptText = 'Can you tell me your name?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard('Example Card Title', 'Example card body content.')
      .getResponse();
  },
};

const MyNameIsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'MyNameIsIntent';
  },
  handle(handlerInput) {
    const nameSlot = handlerInput.requestEnvelope.request.intent.slots.name.value;
    const speechText = `Hello ${nameSlot}. It's nice to meet you.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can introduce yourself by telling me your name';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
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
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
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

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
    // .reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  },
};

// This interceptor function is used for supporting different languages and locals.
// It uses the i18n npm module, along with files in ./lambda/custome/languages/
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
    LaunchRequestHandler,
    MyNameIsIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LocalizationInterceptor)
  .lambda();
