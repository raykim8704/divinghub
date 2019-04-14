


var pageinit = {
  init : function(userData){
    console.log('writeform : ', userData)

  }
}

function setTestDummy(category,title,markupStr,tags,uid,status){
var increa = 1;
var dataTest = setInterval(function(){
  increa++;
  if(increa>104){
    clearInterval(dataTest);
  }
  _firebaseAuth.setWritingData(category,title+increa,markupStr,tags,uid,status)
  .then(function(response){
    if(response.code == 200){
      fireswal('성공적으로 저장 했습니다','목차로 돌아갑니다','success','OK',function(){
        pagemove('magazine.html');
      });
    }
  })
  .catch(function(error){
    fireswal(error.message,'잠시후에 다시 시도해 주세요.','error','OK');
  })
},1001)
}


$(document).ready(function() {

  var queryString = decodeURIComponent(window.location.search);
  var _oData = getDataFromPrevious(queryString);
  console.log('_oData',_oData)
  var category = _oData.writingConfig.category;
  var targetPage = _oData.writingConfig.targetpage;
  console.log('category :',category)
  console.log('targetPage :',targetPage)

  switch (_oData.mode) {
    case "create":

      console.log("create");
      $('#pending_writing').click(function(){
        var status = "pending";
        var tags = $('#tag-field').tagEditor('getTags')[0].tags;
        var markupStr = $('#summernote').summernote('code');
        var title = $('#writing-title').val();
        if(title ==  ''){
          fireswal('제목을 입력해주세요','','warning','OK',function(){
            var title = $('#writing-title').focus();
          });
          return
        }
        console.log("cate : ",category );

        _firebaseAuth.setWritingData(category,title,markupStr,tags,userData._sUid,status)
        .then(function(response){
            console.log("write form response : ",response)
          if(response.code == 200){

            fireswal('임시저장 되었습니다','','success','OK',function(){
              pagemove('writeform.html',{"mode":"modify","docId":response.docid,"writingConfig":_oData.writingConfig});
            });
          }
        })
        .catch(function(error){
          fireswal(error.message,'잠시후에 다시 시도해 주세요.','error','OK');
        })

      });

      $('#complete_writing').click(function(){
        console.log('userdata',userData)
        var status = "published";
        var markupStr = $('#summernote').summernote('code');
        var title = $('#writing-title').val();
        var tags = $('#tag-field').tagEditor('getTags')[0].tags;
        console.log("tags:",tags)
        var isContentEmpty = $('#summernote').summernote('isEmpty');

        if(!validationCheck(title,isContentEmpty,tags)){
          return
        }
        _firebaseAuth.setWritingData(category,title,markupStr,tags,userData._sUid,status)
        .then(function(response){
          if(response.code == 200){
            fireswal('성공적으로 저장 했습니다','목차로 돌아갑니다','success','OK',function(){
                pagemove(targetPage,{'page':1});
            });
          }
        })
        .catch(function(error){
          fireswal(error.message,'잠시후에 다시 시도해 주세요.','error','OK');
        })

        // setTestDummy('magazines',title,markupStr,tags,userData._sUid,status);

      });

      break;
      case "modify" :
      console.log("modify");
      var docId = _oData.docId;
      var status = _oData._sStatus;
      if(status == "published"){
        $('#pending_writing').hide();
      }
      var updateClickEvent = function(docId){
        $('#pending_writing').click(function(){
          var status = "pending";
          var tags = $('#tag-field').tagEditor('getTags')[0].tags;
          var markupStr = $('#summernote').summernote('code');
          var title = $('#writing-title').val();
          if(title ==  ''){
            fireswal('제목을 입력해주세요','','warning','OK',function(){
              var title = $('#writing-title').focus();
            });
            return
          }
          _firebaseAuth.updateWritingData(category,title,markupStr,tags,userData._sUid,status,docId)
          .then(function(response){
              console.log("write form response : ",response)
            if(response.code == 200){

              fireswal('임시저장 되었습니다','','success','OK',function(){
                pagemove('writeform.html',{"mode":"modify","docId":response.docid,"writingConfig":_oData.writingConfig});
              });
            }
          })
          .catch(function(error){
            fireswal(error.message,'잠시후에 다시 시도해 주세요.','error','OK');
          })

        });

        $('#complete_writing').click(function(){
          console.log('userdata',userData)
          var status = "published";
          var markupStr = $('#summernote').summernote('code');
          var title = $('#writing-title').val();
          var tags = $('#tag-field').tagEditor('getTags')[0].tags;
          console.log("tags:",tags)
          var isContentEmpty = $('#summernote').summernote('isEmpty');

          if(!validationCheck(title,isContentEmpty,tags)){
            return
          }
          _firebaseAuth.updateWritingData(category,title,markupStr,tags,userData._sUid,status,docId)
          .then(function(response){
            if(response.code == 200){
              fireswal('성공적으로 저장 했습니다','목차로 돌아갑니다','success','OK',function(){
                pagemove(targetPage,{'page':1});
              });
            }
          })
          .catch(function(error){
            fireswal(error.message,'잠시후에 다시 시도해 주세요.','error','OK');
          })

          // setTestDummy('magazines',title,markupStr,tags,userData._sUid,status);

        });
      }
      renderDocs(category,docId,updateClickEvent);

      break;
    default:

  }




  $('#summernote').summernote({
    lang: 'ko-KR',
    height: 400,                 // set editor height
    minHeight: null,             // set minimum height of editor
    maxHeight: null,   // set maximum height of editor
    disableDragAndDrop : true,
    focus: true,
    maximumImageFileSize: 3145728,
    callbacks: {
    onImageUpload: function(image) {
      // console.log('imageInfo : ',image.width);

        if((image[0].size) > 3145728) {
            fireswal("이미지 용량이 너무 큽니다.",'3M 이하의 이미지를 사용해주세요','warning','OK');
            return false;
        } else {
            var file = image[0];
            var reader = new FileReader();
            var descWidth;
            reader.onloadend = function(e) {
               var img = new Image;
               img.src = e.target.result;
               img.onload =function(){
                  var containerWidth = parseInt($('.note-codable').css('width').replace(/[^-\d\.]/g, ''));
                 var imageWidth = this.width;
                 console.log('container width : ',containerWidth);
                 console.log('imageWidth : ',imageWidth);
                 descWidth = (containerWidth < imageWidth) ? (containerWidth-20) : imageWidth;
                 console.log('desc',descWidth);
                  var image = $('<img>').attr({
                    'src' : reader.result,
                    'width' : descWidth
                  });

                  $('#summernote').summernote("insertNode", image[0]);

               }

            }
            reader.readAsDataURL(file);
        }
    }
}             // set focus to editable area after initializin

  });

//   $('#summernote').summernote('insertImage', url, function ($image) {
//   $image.css('width', $image.width() / 3);
//   $image.attr('data-filename', 'retriever');
// });

  $('#tag-field').tagEditor({
    maxTags : 20,
    forceLowercase: true,
    placeholder: '검색 태그 입력'
  });;




});

function validationCheck(title,isContentEmpty,tags){


  if(title ==  ''){
    fireswal('제목을 입력해주세요','','warning','OK',function(){
      var title = $('#writing-title').focus();
    });
    return false
  }
  if ($('#summernote').summernote('isEmpty')) {
    fireswal('내용을 입력해주세요','','warning','OK',function(){
      $('#summernote').summernote('focus');
    });
    return false
  }
  if(tags.length == 0){
    fireswal('검색태그를 입력해주세요','최소 1개의 검색태그가 필요합니다','warning','OK',function(){
      $('#tag-field').focus();
    });
    return false
  }

  return true

}

function renderDocs(category,docId,callback){
  console.log("render docs modify : ", docId);
  _firebaseAuth.getWritingData(category,docId).then(function(response){
    console.log('response  for render  : ',response)
    $('#writing-title').val(response._sTitle);
    console.log("_aTags :",response._aTags)
   response._aTags.forEach(function(value,index,array){
     $('#tag-field').tagEditor('addTag',value);
   })


    _firebaseAuth.getWritingContents(response._sContentPath)
    .then(function(response){
      $.get(response,function(data,status){
        console.log('data',data);
        $('#summernote').summernote('code',data);
        $('label').addClass('active');
      })
      callback(docId);
      $('#summernote').summernote('focus');
    })
    .catch(function(error){
      console.log(error)
    })

  })
  .catch(function(error){
    console.log(error);
  })


}

function getDataFromPrevious(queryString){
  queryString = queryString.substring(1);
  var queries = queryString.split("=")[1];
  return  JSON.parse(queries);
}
