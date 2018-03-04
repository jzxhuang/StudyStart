/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const requests = require('request');
const axios = require('axios');
const rp = require('request-promise');
const {
    WebhookClient
} = require('dialogflow-fulfillment');
const {Text, Card, Image, Suggestion, Payload} = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug';

const WELCOME_ACTION = 'input.welcome';
const FALLBACK_ACTION = 'input.unknown';
const GET_TOPIC = 'input.topic';
const TOPIC_NEXT = 'topic.next';
const TOPIC_CANCEL = 'topic.cancel';
const imageUrl = 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png';
const linkUrl = 'https://assistant.google.com/';

// creds go here

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({
        request,
        response
    });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    let action = request.body.result.action;
    let parameters = request.body.result.parameters;
    let inputContexts = request.body.result.contexts;
    let originalRequest = request.body.originalRequest;

    function welcome(agent) {
        agent.add(`Welcome to my Study Start!`);
    }

    function testFunc(agent) {
        let topic = parameters.topic.toLowerCase();
        let config = {
            headers: {
                'Content-Type': 'text/plain'
            },
            responseType: 'text'
        };
        let url = "http://18.188.4.138:5000/";
        console.log('topics: ' + topic);
        let text = "Prime Minister Vladimir V. Putin, the country’s paramount leader, cut short a trip to Siberia, returning to Moscow to oversee the federal response. Mr. Putin built his reputation in part on his success at suppressing terrorism, so the attacks could be considered a challenge to his stature.";
        let options = {
            method: 'POST',
            uri: url,
            body: text
        };
        //        return new Promise((resolve, reject) => {
        //            requests.post(options, (error, response, body) => {
        //                console.log(body);
        //                console.log(body.split("\n"));
        //                agent.add('Here is a response');
        //                resolve();
        //            });
        //        });
        return (admin.database().ref('topics/' + topic).once("value")
            .then(data => {
                if (data.val()) {
                    console.log("val: " + data.val());
                    let myArr = data.val().split("\n");
                    console.log(myArr);
                    let context = {
                        'name': 'topic',
                        'lifespan': 5,
                        'parameters': {
                            'value': topic,
                            'questions': myArr,
                            'counter': 0
                        }
                    };
                    agent.setContext(context);
                    agent.add(myArr[0]);
                    agent.add(new Suggestion('Next'));
                    agent.add(new Suggestion('Cancel'));
                } else {
                    agent.add("Sorry, no notes found for this topic. Try something else!");
                    agent.add(new Suggestion('Quiz me about axolotl'));
                    agent.add(new Suggestion('I want to learn about StarterHacks'));
                }
//                agent.add("Database result: ");
                //                agent.send();
            })
            .catch(err => {
                console.log(err);
                agent.add("Error in reading database");
            }));
        //        agent.add('Hello you would like to study ' + topic);
    }
    
    function nextTopic(agent) {
        let context = agent.getContext('topic');
        let counter = context.parameters.counter + 1;
        if (context.parameters.questions[counter]) {
            if (context.parameters.questions.length -1 === counter ) {
                agent.add("Last fact: " + context.parameters.questions[counter]);
            } else {
                agent.add("Fact " + counter.toString() + ": " + context.parameters.questions[counter]);
            }
            context.parameters.counter++;
            agent.setContext(context);
            agent.add(new Suggestion('Next'));
            agent.add(new Suggestion('Cancel'));
        } else {
            agent.add("You've already answered all the questions about " + context.parameters.value + "!");
        }
        console.log(JSON.stringify(context));
//        agent.add('next');
    }
    
    function cancelTopic(agent) {
        agent.add("Alright, maybe you can study another time!");
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }


    function other(agent) {
        agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
        agent.add(new Card({
            title: `Title: this is a card title`,
            imageUrl: imageUrl,
            text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
            buttonText: 'This is a button',
            buttonUrl: linkUrl
        }));
        agent.add(new Suggestion(`Quick Reply`));
        agent.add(new Suggestion(`Suggestion`));
        agent.setContext({
            name: 'weather',
            lifespan: 2,
            parameters: {
                city: 'Rome'
            }
        });
    }

    let actionMap = new Map();
    actionMap.set(WELCOME_ACTION, welcome);
    actionMap.set(FALLBACK_ACTION, fallback);
    actionMap.set(GET_TOPIC, testFunc);
    actionMap.set(TOPIC_NEXT, nextTopic);
    actionMap.set(TOPIC_CANCEL, cancelTopic);
    actionMap.set(null, other);
    agent.handleRequest(actionMap);
});
