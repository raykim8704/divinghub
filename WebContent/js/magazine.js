
var newURL = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
console.log('newURL :',newURL)

var writingConfig = {
  targetpage : "magazine.html",
  category : "magazines"
}

function renderPagination(total,currentPage){
  var shard = 10;
  var totalPages =  Math.ceil(total/shard);
  var block = Math.floor(currentPage/(shard+1));
  var begin = block * shard + 1;
  var end = ((block*shard+shard) < totalPages ) ? block*shard+shard : totalPages;
  var container =   $('#pagination');

  return new Promise(function(resolve,reject){
    if(block > 0 ){
      container.append('<li class="waves-effect" id="before_arrow" blocknum='+block+'><a class="back_arrow"  href="#!"><i class="material-icons">chevron_left</i></a></li>')
    }
    var i;
    for( i=begin; i <= end; i++){
      container.append('<li class="page" id="page_btn_'+i+'" pagenum='+i+' ><a href="#!">'+i+'</a></li>');
    }
    if(totalPages > end){
      //right Arrow
      container.append('<li class="waves-effect" id="next_arrow" blocknum='+block+'><a class="back_arrow"  href="#!"><i class="material-icons">chevron_right</i></a></li>')

    }
      $('#page_btn_'+currentPage).addClass('active');
      $('.page').click(function(){
        var movePage = $(this).attr('pagenum');
        pagemove(writingConfig.targetpage,movePage);
      })
      $('#before_arrow').click(function(){
        var previousPage = begin-1;
        pagemove(writingConfig.targetpage,previousPage);
      })
      $('#next_arrow').click(function(){
        var nextPage = end+1;
        pagemove(writingConfig.targetpage,nextPage);
      });
  })
}

function renderWritingList(total,currentPage,renderList){
  renderPagination(total,currentPage)
  $('#writing_container').empty();
  renderList.forEach(function(v,i,a){
    $('#writing_container').append($('<div/>',{
      class : 'row',
      id : 'row'+i,
    }));
    $('#row'+i).append($('<div/>',{
      class : 'col s12 m6 l6 writing_title',
      id : 'col'+i,
      text : v._source._sTitle,
      indexNum : i
    }));
    $('#writing_container').append($('<div/>',{
      class : 'divider'
    }))
  })
  $('.writing_title').click(function(){
    var indexNum = $(this).attr('indexNum')
    console.log(renderList[indexNum]._source._sContentPath);
  })

}

var pageinit = {
  init : function(userData){
    console.log('writingpage userData: ',userData._bAdmin);
    (userData._bAdmin) ? $('#write-magazine').css({
      'visibility':'visible'
    }) : $('#write-magazine').css({
      'visibility' :'hidden'
    })
  }
}


$(document).ready(function(){

  // $('#write-magazine').hide()
  // var queryString = decodeURIComponent(window.location.search);
  // var _oData = getDataFromPrevious(queryString);
  var page = $('#context').attr('page')
  var _oData = {
    page : page,
    category : 'magazines'
  }
  console.log("_oData",_oData);
  // var page = _oData.page;

  var cloudFunctionUrl = (location.protocol == 'https:') ?
  "https://us-central1-koreadivinghub.cloudfunctions.net/getWritingPage"
  : "http://localhost:5001/koreadivinghub/us-central1/getWritingPage"
  var getWritingPageUrl = cloudFunctionUrl+"?page="+page+"&category="+writingConfig.category
  console.log('current page protocol : ',location.protocol);

  $.get(getWritingPageUrl,function(response){
    console.log("cloud functions response : ", response)
    var total = response.total;
    var renderList = response.hits;
    renderWritingList(total,page,renderList);
  })

  $('#write-magazine').click(function(){
    pagemove('writeform.html',{"mode" :"create",writingConfig:writingConfig})
  })
})

function getDataFromPrevious(queryString){
  queryString = queryString.substring(1);
  var queries = queryString.split("=")[1];
  return  JSON.parse(queries);
}
