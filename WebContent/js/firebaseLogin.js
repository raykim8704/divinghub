
// Initialize Firebase
var config = {
    apiKey: "AIzaSyAkxRH4sw2fm8b1-rdxnXGBWg1JFxQ2jKk",
    authDomain: "koreadivinghub.firebaseapp.com",
    databaseURL: "https://koreadivinghub.firebaseio.com",
    projectId: "koreadivinghub",
    storageBucket: "koreadivinghub.appspot.com",
    messagingSenderId: "789252938860"
  };
  firebase.initializeApp(config);
var _gUserInfo;
var db = firebase.firestore();


firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    var uid = user.uid;
    _firebaseAuth.getDataFromDB('users',uid).then(function(result){
      console.log("_firebaseAuth result")
      if(result){
        console.log("Document data:", result.data());
        _firebaseAuth.setUserInfo(result.data());
        _pagetopInterface.setUserLogin(result.data());

        sessionStorage.setItem('userData',JSON.stringify(result.data()));

      }else {
        // setUserProfile(user);
        // _firebaseAuth.setUserInfo('users',uid,)
      }
    }
  )

  console.log(user);

} else {
  _pagetopInterface.setUserLogout();
  _firebaseAuth.setUserInfo();
}
});

function loadingPreloader(){
  return  new Loading({
    discription : 'Loading...',
    defaultApply : true
  });
}
function getToday(){
  var d1 = new Date();
  return [d1.getFullYear(),d1.getMonth()+1,d1.getDate() ].join('-');
}
function getNow(){
  var date = new Date();
  var month = date.getMonth()+1;
  return date.getFullYear()+''+month+''+date.getDate()+''+date.getHours()+date.getTime();
}

async function setUserProfile(user){

  var isDuplicate = true;
  const {value: formValues} = await Swal.fire({
    // allowEnterKey : false,
    title: '가입을 축하합니다!',
    allowOutsideClick:false,
    allowEscapeKey : false,
    showConfirmButton : false,
    html:
    '<div class="left-align"><b>Nickname을 입력하세요</b></div>'+
    '<input id="input_nickname" maxlength="20" class="swal2-input1">'+
    '<div class="left-align" id="result_text"></div>'+
    '<h5 class="btn blue lighten-1" id="duplicate">중복확인</h5>'+
    '<h5 class="btn green lighten-2" id="nickname_complete">완료하기</h5>',
    focusConfirm: false,
    onBeforeOpen:function(){
      $('#nickname_complete').hide();
      $('#duplicate').click(function(){
        console.log('duplicate check')
        var nickname = $('#input_nickname').val().trim();
        db.collection("users").where("nickname", "==", nickname)
        .get()
        .then(function(querySnapshot) {

          if(querySnapshot.empty){
            $('#result_text').text('사용 가능한 닉네임 입니다.');
            $('#result_text').css({color:'#66bb6a'})
            $('#duplicate').hide();
            $('#nickname_complete').show();
            isDuplicate = false;
          }else{
            $('#result_text').text('중복된 닉네임 입니다.');
            $('#result_text').css({color:'#ef5350'})
            $('#duplicate').show();
            $('#nickname_complete').hide();
            isDuplicate = true;
            // $('#duplicate').addClass('disabled');
          }
        })
        .catch(function(error) {
          console.log("Error getting documents: ", error);
        });
      });

      $('#input_nickname').keyup(function(){
        if(!isDuplicate){
          $('#nickname_complete').hide();
          isDuplicate = true;
          $('#duplicate').show();
          $('#result_text').text('');
        }

      });
      $('#nickname_complete').click(function(){
        var nickname = $('#input_nickname').val().trim();
        if(!isDuplicate){
          var userData = {
            uid : user.uid,
            email : user.email,
            regDate : new Date(),
            nickname : nickname
          }

          db.collection('users').doc(user.uid).set(userData).then(function(){
            fireswal(nickname+'님 Login되었습니다.',user.email,'success','ok',function(){})
          }).catch(function(error){
            fireswal('Error','닉네님을 저장하지 못 했습니다','error','ok',setUserProfile(user))
          })
        }
      });

    },
    preConfirm: function() {
      return [
        document.getElementById('input_nickname').value
      ]
    }
  });

  if (formValues) {
    var  _oResult = validationCheck(formValues[0]);
    if(_oResult.result){
      // _firebaseAuth.loginWithEmail(formValues[0],formValues[1]);
    }else{
      // fireswal(_oResult.message,'','error','OK',swalLogin)
      // $('#error-message').text(_oResult.message)
      // swalLogin();
    }
  }
}


var num_shards = 10;

var _firebaseAuth = {
  getWritingPage : function(cursor){
    var limitNum = 100;
    console.log('current cursor ',cursor)
    var loading = loadingPreloader();
    var first = (typeof cursor == 'undefined' ) ? db.collection("magazine")
    .orderBy("_dTimestamp","desc")
    .limit(limitNum)
    :
    db.collection("magazine")
   .orderBy("_dTimestamp","desc")
   .startAfter(cursor)
   .limit(limitNum)

    return  new Promise (function(resolve,reject){
      first.get().then(function (documentSnapshots) {
        // Get the last visible document
        // console.log(documentSnapshots.docs)
        loading.out();
        var lastVisible = documentSnapshots.docs[documentSnapshots.docs.length-1];
        console.log("last", lastVisible.data());

        // Construct a new query starting at this document,
        // get the next 25 cities.
        var next = db.collection("magazine")
        .orderBy("_dTimestamp","desc")
        .startAfter(lastVisible)
        .limit(1)

        var response = {
          _aDocList : documentSnapshots.docs,
          _cBefore : cursor
        }

        next.get().then(function(snap){
          if(snap.empty){
            response._cNext = false
            console.log('exists:',false)
          }else {
            response._cNext = lastVisible
            console.log('exists: ',true)
          }

          resolve(response)
        })





      })
      .catch(function(error){
        loading.out()
        reject(_firebaseAuth.firebaseErrorHandler(error));
      });
    })



  },
  createDBRef : function(coll,doc){
    return  db.collection(coll).doc(doc);
  },
  getCount : function(coll,doc) {
    var ref = _firebaseAuth.createDBRef(coll,doc)
    // Sum the count of each shard in the subcollection
    return ref.collection('shards').get().then(snapshot => {
      let total_count = 0;
      snapshot.forEach(doc => {
        total_count += doc.data().count;
      });

      return total_count;
    });
  },


  createCounter : function(coll,doc) {
    var ref = _firebaseAuth.createDBRef(coll,doc)
    var batch = db.batch();

    // Initialize the counter document
    batch.set(ref, { num_shards: num_shards });

    // Initialize each shard with count=0
    for (let i = 0; i < num_shards; i++) {
      let shardRef = ref.collection('shards').doc(i.toString());
      batch.set(shardRef, { count: 0 });
    }

    // Commit the write batch
    return batch.commit();
  },
  incrementCounter : function(coll,doc) {
    // Select a shard of the counter at random
    const shard_id = Math.floor(Math.random() * num_shards).toString();
    const ref = _firebaseAuth.createDBRef(coll,doc);
    const shard_ref = ref.collection('shards').doc(shard_id);

    // Update count in a transaction
    return db.runTransaction(t => {
      return t.get(shard_ref).then(doc => {
        const new_count = doc.data().count + 1;
        t.update(shard_ref, { count: new_count });
      });
    });
  },
  updateWritingData : async function(category,title,markupStr,tags,uid,state,docId){
    var loading = loadingPreloader();

    var docCode = docId;
    var contentPath = category+"/"+docCode;
    var fields = {
      _sAuthor : uid,
      _sRegdate : getToday(),
      _dTimestamp : new Date(),
      _sTitle : title,
      _sContentPath : contentPath,
      _nLike : 0,
      _aTags : tags,
      _sStatus : state
    }
    var setDB = false;
    var setDBerror;
    await _firebaseAuth.updateDataToDB(category,docCode,fields)
    .then(function(response){
      setDB = true;
      // _firebaseAuth.incrementCounter(category,'counter')
      console.log('await')
    })
    .catch(function(error){
      console.log(error);
      setDB = false;
    _firebaseAuth.firebaseErrorHandler(error);
    })
loading.out();
  if (setDB){
    return _firebaseAuth.setDataToStorage(contentPath,markupStr)
    .then(function(response){
      response.docid = docCode;
      console.log('setDataToStroage',response);
      return response;
    })
    .catch(function(error){
      console.log('setDataToStroageError',error);
      return error;
    })
 }
  },
  setWritingData: async function(category,title,markupStr,tags,uid,state){
    // await _firebaseAuth.createCounter(category,'counter');


    var loading = loadingPreloader();
    var docCode = category+getNow();
    console.log('getnow: ',docCode)
    var contentPath = category+"/"+docCode;
    var fields = {
      _sAuthor : uid,
      _sRegdate : getToday(),
      _dTimestamp : new Date(),
      _sTitle : title,
      _sContentPath : contentPath,
      _nLike : 0,
      _aTags : tags,
      _sStatus : state
    }
    console.log("field Check : ",fields);

    var setDB = false;
    var setDBerror;
    await _firebaseAuth.setDataToDB(category,docCode,fields)
    .then(function(response){
      setDB = true;
      // _firebaseAuth.incrementCounter(category,'counter')
      console.log('await')
    })
    .catch(function(error){
      console.log(error);
      setDB = false;
    _firebaseAuth.firebaseErrorHandler(error);
    })
loading.out();
  if (setDB){
    return _firebaseAuth.setDataToStorage(contentPath,markupStr)
    .then(function(response){
      response.docid = docCode;
      console.log('setDataToStroage',response);
      return response;
    })
    .catch(function(error){
      console.log('setDataToStroageError',error);
      return error;
    })
 }
    // _firebaseAuth.firebaseErrorHandler(setDBerror);

  },
  getWritingData : function(category,docId){
      var loading = loadingPreloader();
    return new Promise(function(resolve,reject){
      _firebaseAuth.getDataFromDB(category,docId)
      .then(function(response){
        loading.out();
        console.log('res : ', response)
        resolve(response.data());
      })
      .catch(function(error){
        loading.out();
        consol.log('error:',error)
        reject(error)
      })
    })

  },
  getWritingContents : function(contentPath){
      var loading = loadingPreloader();
    return new Promise (function(resovle,reject){
      _firebaseAuth.getDataFromStorage(contentPath)
      .then(function(response){
            loading.out();
        resovle(response);
      })
      .catch(function(error){
            loading.out();
        reject(error);
      })
    })

  },
  getSuccessCode : function(){
    return {code : 200 , message :'success' }
  },
  findPassword :function(email){
    var auth = firebase.auth();
    return new Promise(function(resolve,reject){
      auth.sendPasswordResetEmail(email).then(function() {
        // Email sent.
        resolve(_firebaseAuth.getSuccessCode())
      }).catch(function(error) {
        // An error happened.
        console.log(error)
        reject(_firebaseAuth.firebaseErrorHandler(error))
      });
    })

  },
  reAuthCheck : function(email,currentPassword){
    var loading = loadingPreloader();
    return new Promise(function(resolve,reject){
      var user = firebase.auth().currentUser;
      const credential = firebase.auth.EmailAuthProvider.credential(email, currentPassword);
      // Prompt the user to re-provide their sign-in credentials
      user.reauthenticateAndRetrieveDataWithCredential(credential).then(function(result) {
        // User re-authenticated.
        loading.out();
        resolve(_firebaseAuth.getSuccessCode());

      }).catch(function(error) {
        // An error happened.
        loading.out();
        reject(_firebaseAuth.firebaseErrorHandler(error));
      });
    })
  },
  changePassword : function(newPassword){
    var loading = loadingPreloader();
    var user = firebase.auth().currentUser;

    user.updatePassword(newPassword).then(function() {
      loading.out();
      fireswal('비밀번호가 변경되었습니다.','','success','OK')

    }).catch(function(error) {
      loading.out();
      // An error happened.
    });
  },
  setUserInfo : function(user){
    _gUserInfo = user;
  },
  getUserInfo : function () {
    return _gUserInfo;
  },
  nicknameDuplicateCheck : function(nickname){
    var isDuplicate;
    var usersRef = db.collection("users");
    var query = usersRef.where("nickname","==",nickname);

    return new Promise(function(resolve,reject){
      query.get().then(function(result){
        console.log(result)
        resolve(!result.empty);
      }).catch(function(error){
        reject(error);
      });
    })
  },
  loginWithEmail : function(email,password){
    var loading = loadingPreloader();

    return new Promise(function(resolve,reject){
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(function(){
        return firebase.auth().signInWithEmailAndPassword(email, password).then(function(loginResult){
          console.log('loginresult :',loginResult)
          loading.out();
          var result = _firebaseAuth.getSuccessCode();
          result.loginResult = loginResult;
          resolve(result);
        })
      }).catch(function(error){
        loading.out();
        var errorCode = error.code;
        var errorMessgae = error.message;
        reject(_firebaseAuth.firebaseErrorHandler(error));
      })

    })


  },
  registerWithEamilPassword : function(registInfo){
    console.log('try regist with email password',registInfo);
    var loading = loadingPreloader();

    firebase.auth().createUserWithEmailAndPassword(registInfo.email,registInfo.password)
    .then(function(response){

      var today =  getToday();
      var userData = {
        _dTimestamp : new Date(),
        _sEmail : registInfo.email,
        _sRegDate : today,
        _sUid : response.user.uid,
        _sUsername : registInfo.username,
        _nLevel : 1,
        _sBirthday : registInfo.birthday,
        _nLike : 0,
        _nWriting : 0
      }
      console.log('first login success',response.user);
      console.log('first login success',userData);

      db.collection('users').doc(response.user.uid).set(userData).then(function(){
        fireswal(registInfo.username+'님 Login되었습니다.',userData.email,'success','ok',function(){})
        // fireswal(nickname+'님 Login되었습니다.',user.email,'success','ok',function(){})
        loading.out()
      }).catch(function(error){
        loading.out()
        fireswal('Error','사용자 정보를 저장하지 못 했습니다','error','ok',function(){})
      })

    }).catch(function(error) {
      loading.out();
      var errorCode = error.code;
      var errorMessgae = error.message;
      fireswal('Error','사용자 정보를 저장하지 못 했습니다','error','ok',function(){})
      console.log('error Code',errorCode)
      console.log('error MSG : ',errorMessgae);

    });

  },
  getPhoneAuth : function(phoneNumber){
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
    var appVerifier = window.recaptchaVerifier;
    firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier)
    .then(function (confirmationResult) {
      // SMS sent. Prompt user to type the code from the message, then sign the
      // user in with confirmationResult.confirm(code).
      window.confirmationResult = confirmationResult;
    }).catch(function (error) {
      // Error; SMS not sent
      // ...
    });
  },
  signOut : function(email){
    return new Promise(function(resolve,reject){
      firebase.auth().signOut().then(function() {
        sessionStorage.removeItem('userData');
        resolve(true)
      })
      .catch(function(error) {
        console.log(error)
        reject(error)
      })
    });
  },
  setDataToDB : function(coll,doc,data){
    var loading = loadingPreloader();
    return new Promise(function(resolve,reject){
      db.collection(coll).doc(doc).set(data)
      .then(function(){
        loading.out();
        resolve(_firebaseAuth.getSuccessCode());
      })
      .catch(function(error){
        loading.out();
        reject(_firebaseAuth.firebaseErrorHandler(error));
        console.error('error writing document:',error);
      })
    })
  },
  setDataToStorage : function(path,data){
    var loading = loadingPreloader();
    var storageRef = firebase.storage().ref();
    var dataRef = storageRef.child(path);
    return new Promise(function(resolve,reject){
      dataRef.putString(data).then(function(snapshot) {
        loading.out();
        console.log('Uploaded a raw string!');
        console.log(snapshot)
        resolve(_firebaseAuth.getSuccessCode());
      })
      .catch(function(error){
        loading.out();
        reject(_firebaseAuth.firebaseErrorHandler(error));
        console.error('error writing document:',error);
      })
    })
  },
  updateDataToDB : function(coll,doc,data){
    var loading = loadingPreloader();
    return new Promise(function(resolve,reject){
      db.collection(coll).doc(doc).set(data,{merge:true})
      .then(function(){
        loading.out();
        resolve(_firebaseAuth.getSuccessCode());
      })
      .catch(function(error){
        loading.out();
        reject(_firebaseAuth.firebaseErrorHandler(error));
        console.error('error writing document:',error);
      })
    })
  },
  updateUserInfo : function(coll,doc,data){
    var loading =  loadingPreloader();

    return new Promise(function(resolve,reject){
      db.collection(coll).doc(doc).set(data,{merge:true})
      .then(function(){
        loading.out()
        resolve(_firebaseAuth.getSuccessCode())
      })
      .catch(function(error) {
        // An error happened.
        loading.out()
        console.log(error)
        reject(_firebaseAuth.firebaseErrorHandler(error))
      });
    })
  },
  getDataFromDB : function(coll,doc){
    var userRef =  db.collection(coll).doc(doc);
    return new Promise(function(resolve,reject){
      userRef.get().then(function(doc){
        if(doc.exists){
          resolve(doc)
        }else{
          resolve(false)
        }
      }).catch(function(error){
        reject(error)
      })
    })

  },
  getDataFromStorage : function(contentsPath){
    var storage = firebase.storage();
    var storageRef = storage.ref(contentsPath);
    return new Promise(function(resovle,reject){
      storageRef.getDownloadURL()
     .then(function(url){
       console.log('storage download url  : ',url);
       resovle(url);
     })
     .catch(function(error){
       console.log('storage download url error : ',error)
       reject(error);
     })
    })

  },
  uploadUserProfileImage : function (imageFile,type,uid,username,currentImagePath){
    var storage = firebase.storage();
    var storageRef = storage.ref();

    var profileRoot = 'userProfile';
    var userProfilePath = uid;
    var date = new Date();
    var today = date.getFullYear()+''+date.getMonth()+''+date.getDate()+''+date.getHours()+date.getTime();
    var profileImageName = today+'_'+username+'.'+type;
    var userProfilePath = 'userProfile/'+uid+'/'+profileImageName
    var _oProfilePath  = {
      profileImagePath : userProfilePath
    }
    var loading =  loadingPreloader();

    var userProfileRef = storageRef.child(userProfilePath);
    return new Promise(function(resolve,reject){
      userProfileRef.put(imageFile).then(function(snapshot) {

        var pathReference = storage.ref(_oProfilePath.profileImagePath);
        pathReference.getDownloadURL().then(function(url) {
          var _oFirebaseImagePath = {
            _sProfileImagePath : url,
            _sProfileRefPath : _oProfilePath.profileImagePath
          }

          _firebaseAuth.updateDataToDB('users',uid,_oFirebaseImagePath).then(function(response){
            console.log('image upload success',response);
            loading.out();
            var result = _firebaseAuth.getSuccessCode();
            result.imagePath =  _oFirebaseImagePath._sProfileImagePath;
            result.imageRefPath = _oFirebaseImagePath._sProfileRefPath;
             if(currentImagePath){  _firebaseAuth.deleteImage(storageRef,currentImagePath); }
            resolve(result)
          })

        })


      }).catch(function(error){
        loading.out();

        reject(_firebaseAuth.firebaseErrorHandler(error))
      })
    })
  },
  deleteImage : function(storageRef,imagePath){
    return new Promise(function(resolve,reject){
      var desertRef = storageRef.child(imagePath);

      resolve(_firebaseAuth.getSuccessCode());
      desertRef.delete().then(function() {
        // File deleted successfully
      }).catch(function(error) {
        // Uh-oh, an error occurred!
        reject(_firebaseAuth.firebaseErrorHandler(error));
      });
    })
  },
  getProfileImage : function(imagePath,target){
      $('.'+target).attr({ src :imagePath});
  },
  firebaseErrorHandler : function(error){
    console.log('error occurrs',error)

    switch (error.code) {
      case 'auth/wrong-password' :
      return {code:10001,message : '잘못된 비밀번호 입니다.'}
      break;

      case 'auth/user-not-found' :
      console.log('user-not-found');
      return {code:10002, message : '가입되지 않은 사용자 입니다.'}
      break;
      case 'auth/wrong-password' :
      return {code:10003, message : '잘못된 비밀번호 입니다.'}
      break;
      case 'storage/unauthorized' :
      return {code:10004, message : '저장할 수 있는 권한이 없습니다.'}
      default:
      return {code:10100, message : '알 수 없는 에러로 인해 처리되지 않았습니다.'}

    }


  }

}
