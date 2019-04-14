var db;
$(document).ready(function(){
  $('.parallax').parallax({
  });
  $('.sidenav').sidenav();
  hideMainloader();
  checkCurrentUser();
  setInterface();
});
function setInterface(){

  $('#login-btn').click(function(){
    var userid = $('#userid').val().trim();
    var userpw = $('#userpw').val().trim();
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function(){
      return signIn(userid,userpw)
    })

    if (  validationCheck(userid, userpw) ){
      showMainloader();

    }else {
      hideMainloader();
      fireswal('ERROR!', 'fail to validation check','error','OK')

    }

  })
}
function signIn(email,password){
  return firebase.auth().signInWithEmailAndPassword(email,password).then(function(){
    checkCurrentUser();
    hideMainloader();
  }).catch(function(error) {
    hideMainloader();
    fireswal('ERROR!', '아이디와 비밀번호를 다시 확인해 주세요.','error','OK')
    console.log(error)
  });
}

function fireswal(title,text,type,confirmButtonText){
  Swal.fire({
    title: title,
    text: text,
    type: type,
    confirmButtonText: confirmButtonText
  });
}

function checkCurrentUser(){

  var user = firebase.auth().currentUser;
  if (user) {
    var _getUserAuth = function (u){
      return new Promise(function (resolve, reject){
        getUserAuth(u,resolve,reject);
      })
    }
    _getUserAuth(user).then(function(result){
      console.log('success',result)
      result ? pagemove('pages/pageLayout.html') : fireswal('Error','관리자 권한으로 로그인 해 주세요','error', 'OK');
    }).catch(function(error){
      console.log(error)
    })
  } else {
    console.log('no signed user')
  }

}

function getUserAuth(user,resolve,reject){
  db = firebase.firestore();
  var authRef = db.collection("users");
  var query = authRef.where("uid", "==", user.uid);
  var result;
  query.get().then(function(snapshot){
    snapshot.docs.forEach(function(doc){
      var data = doc.data()
      result  = (data.auth == "admin" ) ?  true :  false
      resolve(result)
    })
  }).catch(function(error){
    result = false
    console.log(error)
    reject(false)
  });



}

function setUserToFirebase(user){
  db = firebase.firestore();
  dbRef = db.collection("users").doc('admin');
  dbRef.set({
    uid: user.uid,
    email: user.email,
    auth: 'admin'
  })
  .then(function(docRef) {
    console.log("Document written with ID: ", docRef);
  })
  .catch(function(error) {
    console.error("Error adding document: ", error);
  });
}

function validationCheck(userid, userpw){
  if (userid == ''){
    fireswal('Error!','아이디를 입력해주세요','error','OK');
    return false;
  }
  if (userpw == '') {
    fireswal('Error!','비밀번호를 입력해주세요','error','OK')
    return false;
  }
  return true;
}


var pagemove = function(target) {
  var pagePath = $(location).attr("pathname");

  var path

  if (pagePath == '/index.html' || pagePath =='/') {
    path = 'pages/' + target
  } else {
    path = target
  }
  window.location = path;

}

function showMainloader(){
  $('.main-loader').show();
}
function hideMainloader(){
  $('.main-loader').hide();
}
