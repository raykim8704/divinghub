$(document).ready(function(){

  jQuery.getScript('/js/firebaseLogin.js').done(function(){
    $('.parallax').parallax();

    $('#top-nav').load('pages/pagetop.html')
    $('#pagefooter').load('pages/pagefooter.html');

  }).fail(function(){})

  // $('#modal-container').load('pages/login_modal.html',function(){
  // // $('.modal').modal()
  // })

  setInterface();
});
if ('serviceWorker' in navigator) {
navigator.serviceWorker.register('./service-worker.js',{scope: './'})
    .then((reg) => {
      // Registration worked.
      console.log('Registration succeeded. Scope is ' + reg.scope);
    }).catch((error) => {
      // Registration failed.
      console.log('Registration failed with ' + error.message);
    });
} else {
window.location.assign('/unsupported');
}
function setInterface(){


}
