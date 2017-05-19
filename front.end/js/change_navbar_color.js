/*
  Change the navbar color in #services section.

  Copyright © 2016 Franco N. Bellomo
  Licensed under the MIT license.
*/

$(document).ready(function(){       
   var scroll_start = 0;
   var startchange = $('#services');
   var offset = startchange.offset();
    if (startchange.length){
   $(document).scroll(function() { 
      scroll_start = $(this).scrollTop();
      if(scroll_start > offset.top) {
          $(".navbar-inverse").css('background-color', '#2F4254');
       } else {
          $('.navbar-inverse').css('background-color', 'transparent');
       }
   });
    }
});
