//
// jQuery.getScript('/js/firebaseLogin.js').done(function(){
//   // setProfileInterface();

//   })

// }).fail(function(){})

var pageinit = {
  init : function(userData){
    console.log('profile.js',userData);
    var profilePath = userData._sProfileImagePath
    if(typeof profilePath != 'undefined' && profilePath != '' ){
        _firebaseAuth.getProfileImage(profilePath,'user_profile_image');
    }
    $('#writing_count').text(userData._nWriting+"개");
    $('#like_count').text(userData._nLike+"개");

    $('#upload_profile_image').unbind('click');
    $('#upload_profile_image').click(function(){
      swaluploadProfileImage(userData);
    });

    $('#user_id').attr({value :userData._sEmail});
    $('.profile_datepicker').val(userData._sBirthday);
    $('#user_name').val(userData._sUsername);
    $('#user_name').attr({disabled : false});
    $('#change_password').removeClass('disabled');
    var email = userData._sEmail;
      $('#change_password').click(function(){
        swalPasswordChange(email);
      });

    if(typeof userData._sAddress == 'undefined' || userData._sAddress == ''){
      $('#user_address').val('');
    }else{
      $('#user_address').val(userData._sAddress);
    }
    $('#user_address').attr({disabled : false});
    $('#user_level').text(userData._nLevel);
    $('#btn_update').unbind('click');
    $('#btn_update').click(function(){
      console.log('update start')
      var newUserName = $('#user_name').val();
      var newBirthday = $('.profile_datepicker').val();
      var newAddress = $('#user_address').val();
      var updateInfo = {
      }
      if(newUserName != userData._sUsername){ updateInfo._sUsername = newUserName}
      if(newBirthday != userData._sBirthday){ updateInfo._sBirthday = newBirthday}
      if(newAddress != userData._sAddress){ updateInfo._sAddress = newAddress }

      _firebaseAuth.updateUserInfo('users',userData._sUid,updateInfo)
      .then(function(response){

        if(response.code == 200){
        fireswal('프로필을 성공적으로 업데이트 하였습니다','','success','OK',function(){
           location.reload();
        });
        }
      }).catch(function(error){

        fireswal(error.message,'프로필을 저장하지 못하였습니다.','error','OK');
      })

      // newUserName = (newUserName == userData.username) ?
    })
  }
}

async function swaluploadProfileImage(userInfo){
  var uid = userInfo._sUid;
  var username = userInfo._sUsername;
  var currentImagePath = userInfo._sProfileRefPath;

  const {value: file} = await Swal.fire({
    title: '프로필 이미지 업로드',
    input: 'file',
    inputAttributes: {
      'accept': 'image/*',
      'aria-label': 'Upload your profile picture'
    }
  })
  console.log(file)

  if (file) {
    var imageType = file.type.split('/')[1];
    // setUserProfileImage : function (image,type,uid,username){
    _firebaseAuth.uploadUserProfileImage(file,imageType,userInfo._sUid,userInfo._sUsername,currentImagePath).then(function(response){
      console.log('success to upload image')
      if(response.code == 200){
        // _firebaseAuth.getProfileImage(response.imagePath,'user_profile_image');

        fireswal('프로필 이미지를 성공적으로 업데이트 하였습니다','','success','OK',function(){
          location.reload();
        });
      }

    })
    .catch(function(error){
        fireswal(error.message,'프로필 이미지를 저장하지 못하였습니다.','error','OK');
    })


    // reader.onload = function(e){
    //   Swal.fire({
    //     title: 'Your uploaded picture',
    //     imageUrl: e.target.result,
    //     imageAlt: 'The uploaded picture'
    //   })
    // }
    // reader.readAsDataURL(file)
  }
}

async function swalPasswordChange(){
  const {value: formValues} = await Swal.fire({
    // allowEnterKey : false,
    title: '비밀번호 변경',
    html:
    '<div class="left-align" style="font-weight:bold;">현재 패스워드 확인</div>'+
    '<div class="left-align pulse" style="font-size:12px; font-weight:bold;" id="current_password_notice"></div>'+
    '<input id="swal_current_password" type="password" class="">'+
    '<div class="btn" id="current_password_check">확인</div>'+
    '<div class="left-align" style="font-weight:bold;">패스워드</div>'+
    '<div class="left-align pulse" style="font-size:12px; font-weight:bold;" id="password_notice"></div>'+
    '<input disabled id="swal_regist_password" type="password" class="swal2-input">'+
    '<div class="progress blue lighten-5"><div class="determinate" id="strengthLine" style="width: 0%"></div></div>'+
    '<ul class="left-align grey-text" style="font-size:0.9em; font-weight:bold;"><li id="wcase">대.소문자 포함</li><li id="number">숫자 포함</li>'+
    '<li id="char">특수문자 포함</li><li id="length">8자리 이상</li></ul>'+
    '<div class="left-align" style="font-weight:bold;">패스워드 확인</div>'+
    '<div class="left-align pulse" style="font-size:12px; font-weight:bold;" id="confirm_notice"></div>'+
    '<input disabled id="swal_password_confirm"  type="password" class="swal2-input">'+
    '<div class="btn" id="btn_change">변경하기</div>',
    focusConfirm: false,
    onBeforeOpen:function(){
      $('#current_password_check').click(function(){
        var currentPassword = $('#swal_current_password').val().trim();
        if(currentPassword == '' ){
          $('#current_password_notice').text('비밀번호를 입력해 주세요');
          $('#current_password_notice').css({color:'#ec407a'});
        }else{
          _firebaseAuth.reAuthCheck(email,currentPassword).then(function(response){
            if(response.code == 200){
              $('#current_password_notice').text('확인되었습니다.');
              $('#current_password_notice').css({color:'#66bb6a'});
                $('#swal_regist_password').attr({'disabled' : false})
            }
          }).catch(function(error){
            $('#current_password_notice').text(error.message);
            $('#current_password_notice').css({color:'#ec407a'});
          })
        }
      });



      $('#swal_regist_password').focusout(function(){
        if($('#swal_regist_password').val()){
          $('#password_notice').text('');
        }
      });


      var isEnoughStrength = false;

      $('#swal_regist_password').keyup(function(){


        var password = $('#swal_regist_password').val();
        var strengthCheck = checkStrength(password);
        var percent  =  strengthCheck.strength*20+'%'
        var color;
        switch (strengthCheck.strength) {
          case 1:
          color = '#ec407a'
          $('#swal_password_confirm').attr({'disabled' : true})
          break;
          case 2:
          color = '#ec407a'
          $('#swal_password_confirm').attr({'disabled' : true})
          break;
          case 3 :
          color = '#ffa726'
          $('#swal_password_confirm').attr({'disabled' : true})
          break;
          case 4 :
          color = '#29b6f6'
          $('#swal_password_confirm').attr({'disabled' : true})
          break;
          case  5 :
          isEnoughStrength = true;
          color = '#66bb6a'
          $('#swal_password_confirm').attr({'disabled' : false})
          default:
        }

        $('#strengthLine').css({
          width : percent,
          'background-color' : color
        });

        strengthCheck.case ? $('#wcase').css({'color':'#66bb6a'}) : $("#wcase").css({'color':'#000000'})
        strengthCheck.number ? $("#number").css({color:'#66bb6a'}) : $("#number").css({color:'#000000'})
        strengthCheck.char ? $("#char").css({color:'#66bb6a'}) : $("#char").css({color:'#000000'})
        strengthCheck.length ? $("#length").css({color:'#66bb6a'}) : $("#length").css({color:'#000000'})

      })

      $('#btn_change').click(function(){

        var newPassword =  $('#swal_regist_password').val();
        var newPasswordConfrim =  $('#swal_password_confirm').val();

        if(newPassword == newPasswordConfrim){
          _firebaseAuth.changePassword(newPassword);

        }else{
          $('#password_notice').text('비밀번호가 일치하지 않습니다.')
          $('#password_notice').css({color:'#ec407a'});
        }

      });
    },
    showConfirmButton : false
  });


}

$(document).ready(function(){
  // jQuery.getScript('/js/firebaseLogin.js').done(function(){
  //   setProfileInterface();
  //
  // }).fail(function(){})

  // var queryString = decodeURIComponent(window.location.search);
  // var _oUserData = getDataFromPrevious(queryString);

  // console.log(_oUserData)
  // setProfileInterface(_oUserData);

  $('.profile_datepicker').datepicker({
    defaultDate: new Date(1990,01,01),
    yearRange : 20,
    format :'yyyy-mm-dd',
  });





  function setProfileInterface(userData){

    // var userInfo = _firebaseAuth.getCurrentUserInfo();
    // console.log(userInfo);
    if(userData){
      setUserInfo(userData);
    }else{
      redirectionToHome();
    }


  }

  function setUserInfo(userInfo){
    console.log('setUserinfo Profile page : ',userInfo);
    $('#user_id').attr({value : userInfo._sEmail});
  }

  function redirectionToHome(){

  }

  // if(userInfo){
  //
  // }else{
  //   alert('use after login')
  // }


})
