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

admin.initializeApp({
    databaseURL: "https://study-start-d6061.firebaseio.com",
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": "study-start-d6061",
        "private_key_id": "db418a82b1a2f00452daf14de3bc3182d0856317",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDPckC5oUE+EFHd\ngaW+zvV9ayreofCI5er/BeCcoaHlK4w8Xb4EbPncD6Ia0Y67uXIRD3PY1wELkVt+\nmgN8LOjeDTaGy8VvOL+eHbjRhkYUm1su154M9JWzPcyHA8TghqlDyB/McFcjZv0y\n+txdxXkdNU318IMWFCzt+7c9FsUvXyF2ip05EKyrDJoCNwJ787GS8ceOom7WklYw\nasY7evJZDRYlFykz0OMejORn45XXQNf4pbmbWEn56Wmfvc0bxZsBkT++CeVBO1aF\n5EjzQJ4w4pH7rgxl/NJcD/q0/uhVqqqn4b4Krdo/A8OgXs1gQfzD9bYptqPqggGW\nuwdA0+NFAgMBAAECggEARRASCVrsqBdx0c9YWWJ4a0VS8+Sw+jqlVjrkMPFEv1GU\nsgI5gSqwsnlH7CrJHKlcFt7woAfQcsP1VHw83cnrywVWGmFbvTAE50SY47SSv0iL\nflhNZ53D+vT/kxGHqYJbdtP49iyObhxa/m5zEAruy/ETn+XvFlooLSDIu99JTYAB\n8BgWoI1wyXS1g2tx8ZlM6pK3MaPFEcfkV1fqX23Ff1Kvnp5TnqLaJsSG8qGBaItC\nPb5fwFTLbq/R91Ci9SuS1OPIP5awjhzrEzmOytb4NAEuVhB4JypFw7KOkjhUFu72\nhAkvO7HfsfvlsSe9Nxtjw0hpPIt/A9gCPD+WYN+PTwKBgQD5LFXvXA1MUajlxDr8\nSods4HDomUY95dFnnCT3R6ntVZ90UrztKZJ6eCedLAErL7A5XmVSWXR4BFwnE53t\ncUSLlUVsjiowflcEu/A7C+Ip5pYGICoK4YjZH92EAkAUnTEY4D1NgiVzZFTlDsy1\n7i7KeN69YnSZilln6IGjFg90YwKBgQDVIUA41EnuBD9xbpbu0HCJ/qxtWpIgRdxP\nUnzaHMr41VCU29zi6NP8UnjaPiND7b0vQruJfgoYtFqAIJU/wczKu05UD0kk/EXx\nbDiubqe1snGkgAdSKGhAwsdRs0fL3LfPAOXXyt1wbJ57Yzm5jAKJcfotqoVOWQNI\nNVVomMc2NwKBgQD13YySGfe5Nd59kcpORdApW7GtoghQbWPaY5WKNrlyyYkEg9uN\n/PZfSA52pQQmM/EkOoOp5UDqaAryOAYeVCS5wrn1KrZwkUmWD0g1Sz2H8NJaCwTR\nJcgdzraKWpoWfSEEFcgHogMIQJkQSDEw12xuNyQ6JVs+YehkgmTgopTvVwKBgB1b\nNiBdxU0ekqqKJAoC9e1cAd4SIpyFYuIeJ4pXevGpWC8Y1aT/kutnZLQS6QKbRXq0\nA2bd0IA0n16Unloo1I98Gz7i2B1bDjtBv9Du9vTE/ng9FkUPwcRhz9iGDDadUUgX\nBJGjpLqui2nNcg8HpPXPmDkgCrqO8i/JANmmaZIjAoGARCq1EKdyWYhBj5MsKzo8\nxrG+N5SuXx+SJGU+fxM1xsEnkfKMBAaDHqfpeRQcwoujDZ2mBu9yIsDlT2v1d2Dj\nWpXqLfIPXIbDKSt4wXpowfB/PM9tMOoc8ROsqiKa0VNgGm8hlr7IKU32etoSOmNb\nhuMax/ePIkgRHXFwbEhJzn0=\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-tgp5t@study-start-d6061.iam.gserviceaccount.com",
        "client_id": "100920437462379924865",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-tgp5t%40study-start-d6061.iam.gserviceaccount.com"
    })
});

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
