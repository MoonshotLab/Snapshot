var Q = require('q');
var gm = require('gm');
var config = require('./config')();
var exec = require('child_process').exec;

var s3Client = require('knox').createClient({
  key     : config.S3_KEY,
  secret  : config.S3_SECRET,
  bucket  : config.S3_BUCKET
});




capture();
setInterval(capture, 60000);



function capture(){
  gatherCameras()
    .then(takePictures)
    .then(resizePictures)
    .then(uploadPhotos)
    .then(finish)
    .fail(function(err){
      console.log(err);
    });
}



function gatherCameras(){
  var deferred = Q.defer();

  console.log('gathering cameras...');
  exec('imagesnap -l', function(error, stdout, stderr) {
    if(stdout){
      var cameras = [];
      var outputArray = stdout.split('\n');

      outputArray.forEach(function(item, i){
        if(item.indexOf('HD Pro') != -1){
          cameras.push(item);
        }
      });

      deferred.resolve({ cameras : cameras });
    } else if(error) deferred.reject(error);
    else deferred.reject(stderr);
  });

  return deferred.promise;
}



function takePictures(opts){
  var deferred = Q.defer();
  var pictures = [];

  console.log('taking pictures...');
  opts.cameras.forEach(function(camera, i){
    var dateStamp = formatDate(new Date());
    var filename  = ['camera', i, dateStamp].join('-');
    var filepath  = 'camera-output/' + filename + '.jpg';
    var command   = ['imagesnap -d', '"' + camera + '"', filepath].join(' ');

    setTimeout(function(){
      exec(command, function(error, stdout, stderr) {
        if(stderr){ console.log('b'); deferred.reject(stderr); }
        if(error){ deferred.reject(error); console.log('c');}
        else {
          console.log('snap!');
          pictures.push(filepath);
          if(pictures.length == opts.cameras.length){
            deferred.resolve({ pictures : pictures });
          }
        }
      });
    }, 2000*i);
  });

  return deferred.promise;
}



function uploadPhotos(opts){
  var deferred = Q.defer();
  var savedPics = [];

  console.log('uploading to S3...');
  opts.pictures.forEach(function(pic){
    var s3Path = pic.replace('camera-output', '');
    s3Path = s3Path.substring(0, 9) + '/' + s3Path.substring(10, s3Path.length);

    s3Client.putFile(pic, s3Path, function(err, res){
      if(err) deferred.reject(err);
      else{
        savedPics.push(s3Path);
        if(savedPics.length == opts.pictures.length){
          deferred.resolve({ picPaths : savedPics });
        }
      }
    });
  });

  return deferred.promise;
}



function finish(opts){
  var now = new Date();
  console.log('saved ' + opts.picPaths.length + ' pictures');
  var minutes = now.getMinutes();
  var hours = now.getHours();

  if(minutes < 10) minutes = '0' + minutes;
  if(hours < 10) hours = '0' + hours;
  console.log(hours + ':' + minutes);
  console.log('--------------------------');
};



// formats a javascript date object to YYYY-MM-DD-MM
function formatDate(date){
  var year    = date.getFullYear();
  var month   = date.getMonth() + 1;
  var day     = date.getDate();
  var hour    = date.getHours();
  var minute  = date.getMinutes();

  if(day < 10) day = '0' + day;
  if(month < 10) month = '0' + month;
  if(hour < 10) hour = '0' + hour;
  if(minute < 10) minute = '0' + minute;

  return [year, month, day, hour, minute].join('-');
}



// resize each photo
function resizePictures(opts){
  var deferred = Q.defer();
  var savedPics = [];

  opts.pictures.forEach(function(pic){
    gm(pic).resize(740)
      .write(pic, function(err){
        savedPics.push(pic);

        if(err) deferred.reject(err);
        else if(savedPics.length == opts.pictures.length){
          deferred.resolve({ pictures : savedPics });
        }
      });
  });

  return deferred.promise;
}
