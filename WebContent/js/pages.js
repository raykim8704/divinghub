$(document).ready(function(){

  // jQuery.getScript('/js/firebaseLogin.js').done(function(){
  // }).fail(function(){})

      $('.parallax').parallax({
      });

      $('#modal-container').load('login_modal.html',function(){
        $('.modal').modal();
      })
      setInterface();
    });

function setInterface(){

	$('#pagehead').load('pagetop.html');
	$('#pagefooter').load('pagefooter.html');
	$('.kakoinfo').load('kakaoinfo.html',function(){
    $('#kakaoopenchat').click(function(){
      $(this).attr('href','https://open.kakao.com/o/spvWI4cb');
    })
  });
	 $('.carousel.carousel-slider').carousel({
		    fullWidth: true,
		    indicators: true
		  });
//	 $('td').addClass('center-align')
//	$('th').addClass('center-align')
	 $('table').addClass('centered');



   $('#upload_user_profile').click(function(){
   	var userInfo = _firebaseAuth.getUserInfo();
   	swalAddProfileImage(userInfo);
   });



}
