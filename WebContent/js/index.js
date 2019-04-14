const functions = require('firebase-functions');
const _ = require('lodash');
const request = require('request-promise');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.indexWritingsToElastic = functions.firestore.document('magazines/{magazine}').onWrite((change, context) => {
    const document = change.after.exists ? change.after.data() : null;
    console.log('change : ',change);
    console.log('context : ', context);
    console.log('current data : ',document);
    let elasticsearchFields = Object.keys(document);
    console.log('keys : ',elasticsearchFields);
    let elasticSearchUrl = elasticSearchConfig.url + 'magazines/magazine/' + docId;
	let elasticSearchMethod = carData ? 'POST' : 'DELETE';
    let elasticSearchConfig = functions.config().elasticsearch;
    console.log(elasticSearchConfig);
});
