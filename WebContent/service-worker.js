/**
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Service worker for Firebase Auth test app application. The
 * service worker caches all content and only serves cached content in offline
 * mode.
 */
importScripts('https://www.gstatic.com/firebasejs/5.8.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.8.0/firebase-auth.js');

 // Initialize Firebase
 var config = {
     apiKey: "AIzaSyAkxRH4sw2fm8b1-rdxnXGBWg1JFxQ2jKk",
     authDomain: "koreadivinghub.firebaseapp.com",
     databaseURL: "https://koreadivinghub.firebaseio.com",
     projectId: "koreadivinghub",
     storageBucket: "koreadivinghub.appspot.com",
     messagingSenderId: "789252938860"
   };
// Initialize the Firebase app in the web worker.
firebase.initializeApp(config);

const CACHE_NAME = 'cache-v1';
const urlsToCache = [
  './',
  './js/main.js',
  './js/profile.js',
  './js/magazine.js',
  './js/pages.js',
  './js/firebaseLogin.js'
];

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log('user signed in', user.uid);
  } else {
    console.log('user signed out');
  }
});

/**
 * Returns a promise that resolves with an ID token if available.
 * @return {!Promise<?string>} The promise that resolves with an ID token if
 *     available. Otherwise, the promise resolves with null.
 */
const getIdToken = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      console.log('service worker getIDToken')
      unsubscribe();
      if (user) {
        user.getIdToken().then((idToken) => {
          resolve(idToken);
        }, (error) => {
          resolve(null);
        });
      } else {
        resolve(null);
      }
    });
  }).catch((error) => {
    console.log(error);
  });
};


/**
 * @param {string} url The URL whose origin is to be returned.
 * @return {string} The origin corresponding to given URL.
 */
const getOriginFromUrl = (url) => {
  // https://stackoverflow.com/questions/1420881/how-to-extract-base-url-from-a-string-in-javascript
  const pathArray = url.split('/');
  const protocol = pathArray[0];
  const host = pathArray[2];
  return protocol + '//' + host;
};


self.addEventListener('install', (event) => {
  // Perform install steps.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => {
    // Add all URLs of resources we want to cache.
    return cache.addAll(urlsToCache)
        .catch((error) => {
          // Suppress error as some of the files may not be available for the
          // current page.
        });
  }));
});

// As this is a test app, let's only return cached data when offline.
self.addEventListener('fetch', (event) => {
  console.log('service worker fetch')
  const fetchEvent = event;
  const requestProcessor = (idToken) => {
    let req = event.request;
    // For same origin https requests, append idToken to header.
    if (self.location.origin == getOriginFromUrl(event.request.url) &&
        (self.location.protocol == 'https:' ||
         self.location.hostname == '127.0.0.1') &&
        idToken) {
      // Clone headers as request headers are immutable.
      const headers = new Headers();
      for (let entry of req.headers.entries()) {
        headers.append(entry[0], entry[1]);
      }
      // Add ID token to header. We can't add to Authentication header as it
      // will break HTTP basic authentication.
      headers.append('Authorization', 'Bearer ' + idToken);
      try {
        req = new Request(req.url, {
          method: req.method,
          headers: headers,
          mode: 'same-origin',
          credentials: req.credentials,
          cache: req.cache,
          redirect: req.redirect,
          referrer: req.referrer,
          body: req.body,
          bodyUsed: req.bodyUsed,
          context: req.context
        });
      } catch (e) {
        // This will fail for CORS requests. We just continue with the
        // fetch caching logic below and do not pass the ID token.
      }
    }
    return fetch(req).then((response) => {
      // Check if we received a valid response.
      // If not, just funnel the error response.
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      // If response is valid, clone it and save it to the cache.
      const responseToCache = response.clone();
      // Save response to cache.
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(fetchEvent.request, responseToCache);
      });
      // After caching, return response.
      return response;
    })
    .catch((error) => {
      // For fetch errors, attempt to retrieve the resource from cache.
      return caches.match(fetchEvent.request.clone());
    })
    .catch((error) => {
      // If error getting resource from cache, do nothing.
      console.log(error);
    });
  };
  // Try to fetch the resource first after checking for the ID token.
  event.respondWith(getIdToken().then(requestProcessor, requestProcessor));
});


self.addEventListener('install', function(event) {
  console.log('Service Worker installing.');
});
self.addEventListener('activate', (event) => {
  // Update this list with all caches that need to remain cached.
  const cacheWhitelist = ['cache-v1'];
  event.waitUntil(caches.keys().then((cacheNames) => {
    return Promise.all(cacheNames.map((cacheName) => {
      // Check if cache is not whitelisted above.
      if (cacheWhitelist.indexOf(cacheName) === -1) {
        // If not whitelisted, delete it.
        return caches.delete(cacheName);
      }
    // Allow active service worker to set itself as the controller for all clients
    // within its scope. Otherwise, pages won't be able to use it until the next
    // load. This makes it possible for the login page to immediately use this.
    })).then(() => clients.claim());
  }));
});
