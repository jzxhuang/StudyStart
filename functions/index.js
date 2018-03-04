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
const {
    Text,
    Card,
    Image,
    Suggestion,
    Payload
} = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug';

const WELCOME_ACTION = 'input.welcome';
const FALLBACK_ACTION = 'input.unknown';
const GET_TOPIC = 'input.topic';
const TOPIC_NEXT = 'topic.next';
const TOPIC_CANCEL = 'topic.cancel';
const imageUrl = 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png';
const linkUrl = 'https://assistant.google.com/';



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
        if (topic === 'starter hacks') {
            topic = 'starterhacks';
        }
        let url = "http://18.188.4.138:5000/";
        console.log('topic: ' + topic);
        return (admin.database().ref('topics/' + topic).once("value")
            .then(data => {
                let num;
                if (data.val()) {
                    let myArr = data.val().questions;
                    console.log(myArr);
                    num = myArr.length;
                    if (myArr.length > 5) {
                        num = 5;
                    }
                    while (myArr.length > num) {
                        randomNum(myArr.length, remove);
                        //                        let rand = Math.floor(Math.random() * myArr.length);
                        function remove(index) {
                            let removed = myArr.splice(index, 1);
                            console.log('removed: ' + removed);
                        }
                    }
                    console.log(myArr);
                    //                    let myJson = {
                    //                        'facts': myArr
                    //                    };
                    //                    return myJson;
                    let context = {
                        'name': 'topic',
                        'lifespan': 8,
                        'parameters': {
                            'value': topic,
                            'questions': myArr,
                            'counter': 0
                        }
                    };
                    console.log(JSON.stringify(context));
                    agent.setContext(context);
                    agent.add('Question 1: ' + myArr[0].question);
                    agent.add(new Suggestion('Skip this one'));
                    agent.add(new Suggestion('Cancel'));
                } else {
                    agent.add("Sorry, no notes found for this topic. Try something else, or upload notes!");
                    agent.add(new Suggestion('Quiz me about axolotl'));
                    agent.add(new Suggestion('I want to learn about StarterHacks'));
                }
            })
            .catch(err => {
                console.log(err);
                agent.add("Error in reading database");
            }));
        //        agent.add('Hello you would like to study ' + topic);
    }

    function nextTopic(agent) {
        let context = agent.getContext('topic');
        let counter = context.parameters.counter;
        let resp = "The answer is : " + context.parameters.questions[counter].answer + ". ";
        counter++;
        if (context.parameters.questions[counter]) {
            if (context.parameters.questions.length - 1 === counter) {
                resp += "Last question: " + context.parameters.questions[counter].question;
                agent.add(resp);
            } else {
                resp += "Question " + (counter+1).toString() + ": " + context.parameters.questions[counter].question;
                agent.add(resp);
            }
            context.parameters.counter++;
            agent.setContext(context);
            agent.add(new Suggestion('Skip this question'));
            agent.add(new Suggestion('Cancel'));
        } else {
            resp += ("You've answered all the questions about " + context.parameters.value + "!");
            agent.add(resp);
            agent.clearContext('topic');
        }
//        console.log(JSON.stringify(context));
        //        agent.add('next');
    }

    function cancelTopic(agent) {
        agent.add("Alright, maybe you can study another time!");
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function randomNum(max, callback) {
        Math.floor(Math.random() * max);
        callback();
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
